<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\AltofleetNode;
use OCA\OpsSuite\Db\AltofleetNodeMapper;
use OCA\OpsSuite\Db\CveScanResult;
use OCA\OpsSuite\Db\CveScanResultMapper;
use OCA\OpsSuite\Db\Deficiency;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCA\OpsSuite\Db\SoftwareCatalogMapper;
use OCA\OpsSuite\Db\SoftwareRequestMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IGroupManager;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\Notification\IManager as INotificationManager;

class AltofleetController extends Controller {

    public function __construct(
        string                          $appName,
        IRequest                        $request,
        private readonly AltofleetNodeMapper   $mapper,
        private readonly IUserSession          $userSession,
        private readonly IGroupManager         $groupManager,
        private readonly INotificationManager  $notificationManager,
        private readonly SoftwareRequestMapper $softwareRequestMapper,
        private readonly SoftwareCatalogMapper $softwareCatalogMapper,
        private readonly CveScanResultMapper   $cveScanMapper,
        private readonly DeficiencyMapper      $deficiencyMapper,
    ) {
        parent::__construct($appName, $request);
    }

    // ── Admin UI endpoints ────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $platformId = $this->request->getParam('platform_id')
            ? (int)$this->request->getParam('platform_id') : null;

        $nodes = $this->mapper->findAll($platformId);

        // Mark stale nodes offline inline so the UI always sees current state
        $staleSeconds = 180;
        $now = date('Y-m-d H:i:s');
        $adminUids = $this->getAdminUids();
        foreach ($nodes as $node) {
            if (
                $node->getStatus() !== 'offline' &&
                $node->getLastSeen() !== '' &&
                (time() - strtotime($node->getLastSeen())) > $staleSeconds
            ) {
                $minutesOffline = (int)round((time() - strtotime($node->getLastSeen())) / 60);
                $node->setStatus('offline');
                $node->setUpdatedAt($now);
                $this->mapper->update($node);
                $this->notifyAdmins($adminUids, 'node_offline', $node, [
                    'minutes' => (string)$minutesOffline,
                ]);
            }
        }

        return new DataResponse(array_map(fn($n) => $n->jsonSerialize(), $nodes));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            return new DataResponse($this->mapper->find($id)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        try {
            $node = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        if (array_key_exists('asset_id',    $data)) $node->setAssetId($data['asset_id'] ? (int)$data['asset_id'] : null);
        if (array_key_exists('platform_id', $data)) $node->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('shop_id',     $data)) $node->setShopId($data['shop_id'] ? (int)$data['shop_id'] : null);
        $node->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->mapper->update($node)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        try {
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Agent endpoints (called by altofleet-agent.py) ───────────────────

    /**
     * POST /api/altofleet/register
     * Creates the node record on first boot. Idempotent — re-registration
     * updates the node's hardware profile without resetting metrics.
     *
     * @NoAdminRequired
     * @PublicPage
     */
    public function register(): DataResponse {
        $data = $this->request->getParams();
        $uuid = trim($data['local_uuid'] ?? '');
        if (!$uuid) {
            return new DataResponse(['message' => 'local_uuid required'], Http::STATUS_BAD_REQUEST);
        }

        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? 'agent';

        $node = $this->mapper->findByUuid($uuid);
        $isNew = ($node === null);

        if ($isNew) {
            $node = new AltofleetNode();
            $node->setLocalUuid($uuid);
            $node->setRegisteredBy($uid);
            $node->setRegisteredAt($now);
            $node->setCreatedAt($now);
            $node->setStatus('online');
        }

        $this->applyHardwareProfile($node, $data);
        $node->setLastSeen($now);
        $node->setUpdatedAt($now);

        $result = $isNew ? $this->mapper->insert($node) : $this->mapper->update($node);
        $status = $isNew ? Http::STATUS_CREATED : Http::STATUS_OK;
        return new DataResponse($result->jsonSerialize(), $status);
    }

    /**
     * POST /api/altofleet/checkin
     * Full metrics payload (every 300 s from the agent).
     *
     * @NoAdminRequired
     * @PublicPage
     */
    public function checkin(): DataResponse {
        $data = $this->request->getParams();
        $uuid = trim($data['local_uuid'] ?? '');
        if (!$uuid) {
            return new DataResponse(['message' => 'local_uuid required'], Http::STATUS_BAD_REQUEST);
        }

        $node = $this->mapper->findByUuid($uuid);
        if (!$node) {
            return new DataResponse(['message' => 'Node not registered'], Http::STATUS_NOT_FOUND);
        }

        $wasOffline = ($node->getStatus() === 'offline');
        $now = date('Y-m-d H:i:s');
        $adminUids = $this->getAdminUids();

        // Metrics
        if (isset($data['cpu_pct']))      $node->setCpuPct((float)$data['cpu_pct']);
        if (isset($data['memory_pct']))   $node->setMemoryPct((float)$data['memory_pct']);
        if (isset($data['disk_pct']))     $node->setDiskPct((float)$data['disk_pct']);
        if (isset($data['disk_free_gb'])) $node->setDiskFreeGb((int)$data['disk_free_gb']);
        if (isset($data['uptime_secs']))  $node->setUptimeSecs((int)$data['uptime_secs']);
        if (isset($data['services']))     $node->setServices(
            is_string($data['services']) ? $data['services'] : json_encode($data['services'])
        );

        $alerts = $this->computeAlerts($node, $data);
        $node->setThresholdAlerts(json_encode($alerts));

        $node->setStatus(empty($alerts) ? 'online' : 'degraded');
        $node->setLastSeen($now);
        $node->setLastFullCheckin($now);
        $node->setUpdatedAt($now);

        $this->mapper->update($node);

        // Notify if node came back online
        if ($wasOffline) {
            $this->notifyAdmins($adminUids, 'node_online', $node);
        }

        // Notify on threshold alerts
        foreach ($alerts as $alert) {
            $this->notifyAdmins($adminUids, 'node_alert', $node, ['message' => $alert]);
        }

        // Build pending_installs from approved software requests
        $pending = [];
        try {
            $approvedReqs = $this->softwareRequestMapper->findApprovedForNode($node->getId());
            foreach ($approvedReqs as $req) {
                try {
                    $cat = $this->softwareCatalogMapper->findById($req->getCatalogId());
                    $pending[] = [
                        'request_id'   => $req->getId(),
                        'package_name' => $cat->getPackageName(),
                        'name'         => $cat->getName(),
                    ];
                } catch (\Exception) {}
            }
        } catch (\Exception) {}

        // Process CVE scan results if included
        $cveScan = $data['cve_scan'] ?? null;
        if (is_array($cveScan) && !empty($cveScan['cves'])) {
            $this->processCveScan($node, $cveScan, $adminUids);
        }

        // Tell the agent whether it needs to run a CVE scan
        $needsCveScan = false;
        $lastScan = $node->getLastCveScan();
        if (!$lastScan || (time() - strtotime($lastScan)) > 604800) {
            $needsCveScan = true;
        }

        $response = $node->jsonSerialize();
        $response['pending_installs'] = $pending;
        $response['needs_cve_scan']   = $needsCveScan;
        return new DataResponse($response);
    }

    private function processCveScan(AltofleetNode $node, array $scan, array $adminUids): void {
        $now       = date('Y-m-d H:i:s');
        $scannedAt = $scan['scanned_at'] ?? $now;
        $cves      = $scan['cves'] ?? [];
        $nodeId    = $node->getId();

        // Replace all CVE records for this node
        $this->cveScanMapper->deleteByNode($nodeId);

        $sevOrder   = ['CRITICAL' => 0, 'HIGH' => 1, 'MEDIUM' => 2, 'LOW' => 3, 'UNKNOWN' => 4];
        $worstSev   = 'UNKNOWN';
        $critCount  = 0;
        $highCount  = 0;

        foreach ($cves as $cveData) {
            $sev = strtoupper($cveData['severity'] ?? 'UNKNOWN');
            if (!isset($sevOrder[$sev])) $sev = 'UNKNOWN';

            if ($sev === 'CRITICAL') $critCount++;
            if ($sev === 'HIGH')     $highCount++;

            if ($sevOrder[$sev] < $sevOrder[$worstSev]) $worstSev = $sev;

            $r = new CveScanResult();
            $r->setNodeId($nodeId);
            $r->setCveId($cveData['cve_id'] ?? '');
            $r->setSeverity($sev);
            $r->setPackageName($cveData['package_name'] ?? '');
            $r->setInstalledVersion($cveData['installed_version'] ?? '');
            $r->setFixedVersion($cveData['fixed_version'] ?? '');
            $r->setDescription(mb_substr($cveData['description'] ?? '', 0, 1000));
            $r->setCvssScore((string)($cveData['cvss_score'] ?? ''));
            $r->setScannedAt($scannedAt);
            $r->setDeficiencyId(null);
            $r->setResolved(false);
            $r->setCreatedAt($now);
            $this->cveScanMapper->insert($r);
        }

        // Update node's last_cve_scan timestamp
        $node->setLastCveScan($now);
        $this->mapper->update($node);

        // Auto-create or update Deficiency for CRITICAL/HIGH findings
        if ($critCount > 0 || $highCount > 0) {
            $defSev   = $critCount > 0 ? 'SEV-1' : 'SEV-2';
            $summary  = 'CVE Scan: '.$critCount.' Critical, '.$highCount.' High vulnerabilities on '.$node->getHostname();

            try {
                // Check if we already have an open CVE deficiency for this node
                $existingDefId = $this->cveScanMapper->findOpenCveDeficiency($nodeId);
                if ($existingDefId) {
                    $def = $this->deficiencyMapper->find($existingDefId);
                    $def->setSummary($summary);
                    $def->setSeverity($defSev);
                    $def->setUpdatedAt($now);
                    $this->deficiencyMapper->update($def);
                } else {
                    $def = new Deficiency();
                    $def->setSummary($summary);
                    $def->setDescription(
                        'Automated CVE scan on '.$node->getHostname().' ('.$node->getIpAddress().') '
                        .'detected '.$critCount.' Critical and '.$highCount.' High severity vulnerabilities. '
                        .'Run patch updates to resolve. See Infrastructure → Fleet Nodes → '.$node->getHostname().' → CVE Scan for details.'
                    );
                    $def->setSeverity($defSev);
                    $def->setStatus('open');
                    $def->setDiscoveryMethod('cve_scan');
                    $def->setAssignedTo('');
                    $def->setReviewedBy('');
                    $def->setRequirementsToResolve('');
                    $def->setOutsideEntityRequired('');
                    $def->setEstPartsCost(0);
                    $def->setEstLaborCost(0);
                    $def->setManDaysInternal(0);
                    $def->setManDaysExternal(0);
                    $def->setBudgetStatus('unbudgeted');
                    $def->setAssetId($node->getAssetId() ?? 0);
                    $def->setCreatedAt($now);
                    $def->setUpdatedAt($now);
                    $createdDef = $this->deficiencyMapper->insert($def);

                    // Link deficiency back to all CVE rows for this node
                    $this->cveScanMapper->setDeficiencyForNode($nodeId, $createdDef->getId());

                    $this->notifyAdmins($adminUids, 'node_alert', $node, [
                        'message' => $summary,
                    ]);
                }
            } catch (\Exception) {}
        }
    }

    /**
     * GET /api/altofleet/nodes/{id}/cves
     * @NoAdminRequired
     */
    public function nodeCves(int $id): DataResponse {
        try {
            $results = $this->cveScanMapper->findByNode($id);
            return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $results));
        } catch (\Exception $e) {
            return new DataResponse([], Http::STATUS_NOT_FOUND);
        }
    }

    /**
     * POST /api/altofleet/heartbeat
     * Lightweight keepalive (every 60 s). Just updates last_seen.
     *
     * @NoAdminRequired
     * @PublicPage
     */
    public function heartbeat(): DataResponse {
        $uuid = trim($this->request->getParam('local_uuid') ?? '');
        if (!$uuid) {
            return new DataResponse(['message' => 'local_uuid required'], Http::STATUS_BAD_REQUEST);
        }

        $node = $this->mapper->findByUuid($uuid);
        if (!$node) {
            return new DataResponse(['message' => 'Node not registered'], Http::STATUS_NOT_FOUND);
        }

        $wasOffline = ($node->getStatus() === 'offline');
        $now = date('Y-m-d H:i:s');

        if ($wasOffline) {
            $node->setStatus('online');
            $this->notifyAdmins($this->getAdminUids(), 'node_online', $node);
        }

        $node->setLastSeen($now);
        $node->setUpdatedAt($now);
        $this->mapper->update($node);

        return new DataResponse(['ok' => true, 'last_seen' => $now]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function applyHardwareProfile(AltofleetNode $node, array $data): void {
        if (isset($data['hostname']))       $node->setHostname($data['hostname']);
        if (isset($data['ip_address']))     $node->setIpAddress($data['ip_address']);
        if (isset($data['mac_address']))    $node->setMacAddress($data['mac_address']);
        if (isset($data['agent_version']))  $node->setAgentVersion($data['agent_version']);
        if (isset($data['os_name']))        $node->setOsName($data['os_name']);
        if (isset($data['os_version']))     $node->setOsVersion($data['os_version']);
        if (isset($data['os_pretty_name'])) $node->setOsPrettyName($data['os_pretty_name']);
        if (isset($data['architecture']))   $node->setArchitecture($data['architecture']);
        if (isset($data['cpu_count']))      $node->setCpuCount((int)$data['cpu_count']);
        if (isset($data['memory_mb']))      $node->setMemoryMb((int)$data['memory_mb']);
        if (isset($data['disk_gb']))        $node->setDiskGb((int)$data['disk_gb']);
    }

    private function computeAlerts(AltofleetNode $node, array $data): array {
        $alerts = [];
        $cpu  = (float)($data['cpu_pct']    ?? $node->getCpuPct());
        $mem  = (float)($data['memory_pct'] ?? $node->getMemoryPct());
        $disk = (float)($data['disk_pct']   ?? $node->getDiskPct());

        if ($cpu  > 90) $alerts[] = "CPU usage critical: {$cpu}% on {$node->getHostname()}";
        if ($mem  > 90) $alerts[] = "Memory usage critical: {$mem}% on {$node->getHostname()}";
        if ($disk > 85) $alerts[] = "Disk usage high: {$disk}% on {$node->getHostname()}";

        // Check for stopped critical services
        $services = is_string($data['services'] ?? null)
            ? json_decode($data['services'], true)
            : ($data['services'] ?? []);
        foreach ($services as $svc => $state) {
            if (str_contains(strtolower((string)$state), 'stop') ||
                str_contains(strtolower((string)$state), 'fail')) {
                $alerts[] = "Service {$svc} is {$state} on {$node->getHostname()}";
            }
        }

        return $alerts;
    }

    /** @param string[] $uids */
    private function notifyAdmins(array $uids, string $subject, AltofleetNode $node, array $extra = []): void {
        $params = array_merge([
            'hostname'  => $node->getHostname(),
            'ip'        => $node->getIpAddress(),
            'last_seen' => $node->getLastSeen(),
        ], $extra);

        foreach ($uids as $uid) {
            try {
                $n = $this->notificationManager->createNotification();
                $n->setApp('ops_suite')
                  ->setUser($uid)
                  ->setDateTime(new \DateTime())
                  ->setObject('altofleet_node', (string)$node->getId())
                  ->setSubject($subject, $params);
                $this->notificationManager->notify($n);
            } catch (\Throwable) {
                // Non-fatal — notification failure never breaks the API response
            }
        }
    }

    /** @return string[] */
    private function getAdminUids(): array {
        $group = $this->groupManager->get('admin');
        if (!$group) return [];
        return array_map(fn($u) => $u->getUID(), $group->getUsers());
    }
}
