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
use OCP\AppFramework\Http\Response;
use OCP\IGroupManager;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\Notification\IManager as INotificationManager;

class AltofleetController extends Controller {

    // Path inside Nextcloud's data dir where the current agent file is stored
    private const AGENT_STORAGE_PATH = 'ops_suite/altofleet-agent.py';

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
        private readonly IConfig               $config,
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
        $cveError = null;
        $cveScanRaw = $data['cve_scan'] ?? null;
        $cveScan = is_string($cveScanRaw) ? json_decode($cveScanRaw, true) : (is_array($cveScanRaw) ? $cveScanRaw : null);
        if (is_array($cveScan) && !empty($cveScan['cves'])) {
            try {
                $this->processCveScan($node, $cveScan, $adminUids);
            } catch (\Throwable $e) {
                $cveError = $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine();
            }
        }

        // Tell the agent whether it needs to run a CVE scan
        $forceScan = (bool)$node->getForceScan();
        $lastScan  = $node->getLastCveScan();
        $needsCveScan = $forceScan || !$lastScan || (time() - strtotime($lastScan)) > 604800;

        // Clear force_scan flag once we've told the agent to run it
        if ($forceScan) {
            $node->setForceScan(false);
            $this->mapper->update($node);
        }

        // Check if we need to trigger a security update on the agent
        $pendingUpdate = (bool)$node->getPendingUpdate();

        // Check whether the agent needs to update itself
        $targetVersion = $this->config->getAppValue('ops_suite', 'agent_target_version', '');
        $currentVersion = $node->getAgentVersion() ?? '';
        $agentUpdateAvailable = $targetVersion && $currentVersion
            && version_compare($currentVersion, $targetVersion, '<');
        $agentDownloadUrl = '';
        if ($agentUpdateAvailable) {
            $ncUrl = rtrim($this->config->getSystemValue('overwrite.cli.url', ''), '/');
            $agentDownloadUrl = $ncUrl . '/apps/ops_suite/api/altofleet/agent/download';
        }

        $response = $node->jsonSerialize();
        $response['pending_installs']       = $pending;
        $response['needs_cve_scan']         = $needsCveScan;
        $response['pending_update']         = $pendingUpdate;
        $response['pending_agent_update']   = $agentUpdateAvailable;
        $response['agent_target_version']   = $targetVersion ?: null;
        $response['agent_download_url']     = $agentDownloadUrl ?: null;
        $response['cve_debug'] = [
            'cveScanIsNull'   => $cveScan === null,
            'cveScanIsArray'  => is_array($cveScan),
            'cvesCount'       => is_array($cveScan) ? count($cveScan['cves'] ?? []) : -1,
            'cveError'        => $cveError,
        ];
        return new DataResponse($response);
    }

    private function processCveScan(AltofleetNode $node, array $scan, array $adminUids): void {
        $now       = date('Y-m-d H:i:s');
        $scannedAt = date('Y-m-d H:i:s', strtotime($scan['scanned_at'] ?? $now));
        $cves      = $scan['cves'] ?? [];
        $nodeId    = $node->getId();

        // Grab existing deficiency ID before deleting rows (deleteByNode wipes deficiency_id links)
        $existingDefId = $this->cveScanMapper->findOpenCveDeficiency($nodeId);

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

        // Update node's last_cve_scan timestamp and clear pending_update
        $node->setLastCveScan($now);
        $node->setPendingUpdate(false);
        $this->mapper->update($node);

        // Auto-create or update a single Deficiency for CRITICAL/HIGH findings
        if ($critCount > 0 || $highCount > 0) {
            $defSev  = $critCount > 0 ? 'SEV-1' : 'SEV-2';
            $summary = 'CVE Scan: '.$critCount.' Critical, '.$highCount.' High vulnerabilities on '.$node->getHostname();

            try {
                if ($existingDefId) {
                    $def = $this->deficiencyMapper->find($existingDefId);
                    $def->setSummary($summary);
                    $def->setSeverity($defSev);
                    $def->setDescription(
                        'Automated CVE scan on '.$node->getHostname().' ('.$node->getIpAddress().') '
                        .'detected '.$critCount.' Critical and '.$highCount.' High severity vulnerabilities. '
                        .'Run patch updates to resolve. See Infrastructure → Fleet Nodes → '.$node->getHostname().' → CVE Scan for details.'
                    );
                    $def->setUpdatedAt($now);
                    $this->deficiencyMapper->update($def);
                    $this->cveScanMapper->setDeficiencyForNode($nodeId, $existingDefId);
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
                    $this->cveScanMapper->setDeficiencyForNode($nodeId, $createdDef->getId());
                    $this->notifyAdmins($adminUids, 'node_alert', $node, [
                        'message' => $summary,
                    ]);
                }
            } catch (\Exception) {}
        }
    }

    /**
     * POST /api/altofleet/nodes/{id}/force-scan
     * @NoAdminRequired
     */
    public function forceScan(int $id): DataResponse {
        try {
            $node = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $node->setForceScan(true);
        $node->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($node)->jsonSerialize());
    }

    /**
     * POST /api/altofleet/nodes/{id}/schedule-update
     * @NoAdminRequired
     */
    public function scheduleUpdate(int $id): DataResponse {
        try {
            $node = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $node->setPendingUpdate(true);
        $node->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($node)->jsonSerialize());
    }

    /**
     * GET /api/altofleet/agent/download
     * Serves the current agent file to authenticated agents.
     * The agent calls this when pending_agent_update is true in the checkin response.
     *
     * @NoAdminRequired
     * @PublicPage
     */
    public function agentDownload(): Response {
        $uuid = $this->request->getParam('uuid', '');
        if (!$uuid || !$this->mapper->findByUuid($uuid)) {
            $r = new Response(); $r->setStatus(Http::STATUS_UNAUTHORIZED); return $r;
        }

        $dataDir   = \OC::$SERVERROOT . '/data';
        $agentPath = $dataDir . '/' . self::AGENT_STORAGE_PATH;

        if (!file_exists($agentPath)) {
            $r = new Response(); $r->setStatus(Http::STATUS_NOT_FOUND); return $r;
        }

        $content  = file_get_contents($agentPath);
        $version  = $this->config->getAppValue('ops_suite', 'agent_target_version', 'unknown');
        $response = new Response();
        $response->addHeader('Content-Type', 'text/x-python');
        $response->addHeader('Content-Disposition', 'attachment; filename="altofleet-agent.py"');
        $response->addHeader('X-Agent-Version', $version);
        $response->addHeader('Content-Length', (string)strlen($content));
        // Stream the file body manually via a callback response
        // (Nextcloud DataResponse would JSON-encode it)
        ob_start();
        echo $content;
        ob_end_flush();
        return $response;
    }

    /**
     * POST /api/altofleet/agent/upload
     * Admin uploads a new agent file and sets the target version.
     * The file is stored in data/ops_suite/altofleet-agent.py.
     *
     * @NoAdminRequired
     */
    public function agentUpload(): DataResponse {
        if (!$this->isAdminUser()) {
            return new DataResponse(['message' => 'Admin required'], Http::STATUS_FORBIDDEN);
        }

        $version = trim($this->request->getParam('version', ''));
        $content = $this->request->getParam('content', '');

        if (!$version || !$content) {
            return new DataResponse(['message' => 'version and content are required'], Http::STATUS_BAD_REQUEST);
        }

        // Basic sanity check — must start with a Python shebang or import
        if (!str_contains($content, 'import') || !str_contains($content, 'def ')) {
            return new DataResponse(['message' => 'Content does not look like a Python file'], Http::STATUS_BAD_REQUEST);
        }

        $dataDir   = \OC::$SERVERROOT . '/data';
        $storageDir = $dataDir . '/ops_suite';
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0750, true);
        }
        $agentPath = $storageDir . '/altofleet-agent.py';

        // Keep one backup of the previous version
        if (file_exists($agentPath)) {
            copy($agentPath, $agentPath . '.bak');
        }

        file_put_contents($agentPath, $content);
        $this->config->setAppValue('ops_suite', 'agent_target_version', $version);

        return new DataResponse([
            'message'         => 'Agent updated',
            'target_version'  => $version,
            'bytes'           => strlen($content),
        ]);
    }

    /**
     * GET /api/altofleet/agent/version
     * Returns the current target agent version. Public so agents can check without auth.
     *
     * @NoAdminRequired
     * @PublicPage
     */
    public function agentVersion(): DataResponse {
        return new DataResponse([
            'target_version' => $this->config->getAppValue('ops_suite', 'agent_target_version', ''),
        ]);
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

        $trivyDbReady = $this->request->getParam('trivy_db_ready');
        if ($trivyDbReady !== null) {
            $node->setTrivyDbReady((bool)$trivyDbReady);
        }

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

    private function isAdminUser(): bool {
        $user = $this->userSession->getUser();
        return $user && $this->groupManager->isInGroup($user->getUID(), 'admin');
    }

    /** @return string[] */
    private function getAdminUids(): array {
        $group = $this->groupManager->get('admin');
        if (!$group) return [];
        return array_map(fn($u) => $u->getUID(), $group->getUsers());
    }
}
