<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\SoftwareCatalogItem;
use OCA\OpsSuite\Db\SoftwareCatalogMapper;
use OCA\OpsSuite\Db\SoftwareRequest;
use OCA\OpsSuite\Db\SoftwareRequestMapper;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCA\OpsSuite\Db\Deficiency;
use OCA\OpsSuite\Db\AltofleetNodeMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class SoftwareCatalogController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private SoftwareCatalogMapper $catalogMapper,
        private SoftwareRequestMapper $requestMapper,
        private DeficiencyMapper      $deficiencyMapper,
        private AltofleetNodeMapper   $nodeMapper,
        private IUserSession          $userSession,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function catalogIndex(): DataResponse {
        $items = $this->catalogMapper->findAll();
        return new DataResponse(array_map(fn($i) => $i->jsonSerialize(), $items));
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function catalogCreate(): DataResponse {
        $now  = date('Y-m-d H:i:s');
        $data = $this->request->getParams();
        $item = new SoftwareCatalogItem();
        $item->setName($data['name'] ?? '');
        $item->setPackageName($data['package_name'] ?? '');
        $item->setDescription($data['description'] ?? '');
        $item->setCategory($data['category'] ?? 'General');
        $item->setTier((int)($data['tier'] ?? 1));
        $item->setIcon($data['icon'] ?? '📦');
        $item->setAutoApprove((bool)($data['auto_approve'] ?? false));
        $item->setEnabled(true);
        $item->setCreatedAt($now);
        $item->setUpdatedAt($now);
        try {
            $created = $this->catalogMapper->insert($item);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function catalogUpdate(int $id): DataResponse {
        $item = $this->catalogMapper->findById($id);
        $data = $this->request->getParams();
        if (isset($data['name']))         $item->setName($data['name']);
        if (isset($data['package_name'])) $item->setPackageName($data['package_name']);
        if (isset($data['description']))  $item->setDescription($data['description']);
        if (isset($data['category']))     $item->setCategory($data['category']);
        if (isset($data['tier']))         $item->setTier((int)$data['tier']);
        if (isset($data['icon']))         $item->setIcon($data['icon']);
        if (isset($data['auto_approve'])) $item->setAutoApprove((bool)$data['auto_approve']);
        if (isset($data['enabled']))      $item->setEnabled((bool)$data['enabled']);
        $item->setUpdatedAt(date('Y-m-d H:i:s'));
        $updated = $this->catalogMapper->update($item);
        return new DataResponse($updated->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function catalogDelete(int $id): DataResponse {
        $item = $this->catalogMapper->findById($id);
        $this->catalogMapper->delete($item);
        return new DataResponse(['ok' => true]);
    }

    // ── Requests ──────────────────────────────────────────────

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function requestIndex(): DataResponse {
        $status = $this->request->getParam('status');
        $nodeId = $this->request->getParam('node_id');
        if ($nodeId) {
            $reqs = $this->requestMapper->findByNode((int)$nodeId);
        } else {
            $reqs = $this->requestMapper->findAll($status ?: null);
        }
        $out = [];
        foreach ($reqs as $r) {
            $row = $r->jsonSerialize();
            try {
                $cat = $this->catalogMapper->findById($r->getCatalogId());
                $row['catalog'] = $cat->jsonSerialize();
            } catch (\Exception) {
                $row['catalog'] = null;
            }
            try {
                $node = $this->nodeMapper->find($r->getNodeId());
                $row['node_hostname'] = $node->getHostname();
            } catch (\Exception) {
                $row['node_hostname'] = '';
            }
            $out[] = $row;
        }
        return new DataResponse($out);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function requestCreate(): DataResponse {
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $data = $this->request->getParams();
        $nodeId    = (int)($data['node_id'] ?? 0);
        $catalogId = (int)($data['catalog_id'] ?? 0);

        try {
            $cat  = $this->catalogMapper->findById($catalogId);
            $node = $this->nodeMapper->find($nodeId);
        } catch (\Exception $e) {
            return new DataResponse(['error' => 'Node or catalog item not found'], Http::STATUS_NOT_FOUND);
        }

        $req = new SoftwareRequest();
        $req->setNodeId($nodeId);
        $req->setCatalogId($catalogId);
        $req->setRequestedBy($uid);
        $req->setStatus($cat->getAutoApprove() ? 'approved' : 'pending');
        $req->setApprovedBy($cat->getAutoApprove() ? 'auto' : '');
        $req->setApprovedAt($cat->getAutoApprove() ? $now : '');
        $req->setInstalledAt('');
        $req->setCustomDescription(null);
        $req->setNotes($data['notes'] ?? '');
        $req->setCreatedAt($now);
        $req->setUpdatedAt($now);

        if (!$cat->getAutoApprove()) {
            $def = new Deficiency();
            $def->setSummary('Software Request: ' . $cat->getName() . ' — ' . $node->getHostname());
            $def->setDescription(
                'Node ' . $node->getHostname() . ' (' . $node->getIpAddress() . ') ' .
                'has requested installation of "' . $cat->getName() . '" (' . $cat->getPackageName() . '). ' .
                'Tier: ' . $cat->tierLabel() . '. Requested by: ' . $uid . '. ' .
                'Approve or reject this request in Infrastructure → Software Catalog → Requests.'
            );
            $def->setSeverity('SEV-4');
            $def->setStatus('open');
            $def->setDiscoveryMethod('software_request');
            $def->setAssignedTo('');
            $def->setReviewedBy('');
            $def->setRequirementsToResolve('');
            $def->setOutsideEntityRequired('');
            $def->setEstPartsCost(0);
            $def->setEstLaborCost(0);
            $def->setManDaysInternal(0);
            $def->setManDaysExternal(0);
            $def->setBudgetStatus('unbudgeted');
            $def->setAssetId(0);
            $def->setCreatedAt($now);
            $def->setUpdatedAt($now);
            $created_def = $this->deficiencyMapper->insert($def);
            $req->setDeficiencyId($created_def->getId());
        }

        $created = $this->requestMapper->insert($req);
        $row = $created->jsonSerialize();
        $row['catalog'] = $cat->jsonSerialize();
        $row['node_hostname'] = $node->getHostname();
        return new DataResponse($row, Http::STATUS_CREATED);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function requestApprove(int $id): DataResponse {
        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';
        $req = $this->requestMapper->findById($id);
        $req->setStatus('approved');
        $req->setApprovedBy($uid);
        $req->setApprovedAt($now);
        $req->setUpdatedAt($now);
        if ($req->getDeficiencyId()) {
            try {
                $def = $this->deficiencyMapper->find($req->getDeficiencyId());
                $def->setStatus('in_progress');
                $def->setUpdatedAt($now);
                $this->deficiencyMapper->update($def);
            } catch (\Exception) {}
        }
        $updated = $this->requestMapper->update($req);
        return new DataResponse($updated->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function requestReject(int $id): DataResponse {
        $now   = date('Y-m-d H:i:s');
        $uid   = $this->userSession->getUser()?->getUID() ?? '';
        $notes = $this->request->getParam('notes', '');
        $req   = $this->requestMapper->findById($id);
        $req->setStatus('rejected');
        $req->setApprovedBy($uid);
        $req->setApprovedAt($now);
        $req->setNotes($notes);
        $req->setUpdatedAt($now);
        if ($req->getDeficiencyId()) {
            try {
                $def = $this->deficiencyMapper->find($req->getDeficiencyId());
                $def->setStatus('closed');
                $def->setUpdatedAt($now);
                $this->deficiencyMapper->update($def);
            } catch (\Exception) {}
        }
        $updated = $this->requestMapper->update($req);
        return new DataResponse($updated->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function customRequestCreate(): DataResponse {
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $data = $this->request->getParams();
        $nodeId = (int)($data['node_id'] ?? 0);
        $desc   = trim($data['description'] ?? '');
        if ($desc === '') {
            return new DataResponse(['error' => 'Description required'], Http::STATUS_BAD_REQUEST);
        }

        try {
            $node = $this->nodeMapper->find($nodeId);
        } catch (\Exception $e) {
            return new DataResponse(['error' => 'Node not found'], Http::STATUS_NOT_FOUND);
        }

        $req = new SoftwareRequest();
        $req->setNodeId($nodeId);
        $req->setCatalogId(0);
        $req->setRequestedBy($uid);
        $req->setStatus('pending');
        $req->setApprovedBy('');
        $req->setApprovedAt('');
        $req->setInstalledAt('');
        $req->setCustomDescription(mb_substr($desc, 0, 2000));
        $req->setNotes($data['notes'] ?? '');
        $req->setCreatedAt($now);
        $req->setUpdatedAt($now);

        $def = new Deficiency();
        $def->setSummary('Software Request (unlisted): ' . $node->getHostname());
        $def->setDescription(
            'Node ' . $node->getHostname() . ' (' . $node->getIpAddress() . ') ' .
            'has submitted an unlisted software request. Requested by: ' . $uid . '. ' .
            'Description: ' . $desc
        );
        $def->setSeverity('SEV-4');
        $def->setStatus('open');
        $def->setDiscoveryMethod('software_request');
        $def->setAssignedTo('');
        $def->setReviewedBy('');
        $def->setRequirementsToResolve('');
        $def->setOutsideEntityRequired('');
        $def->setEstPartsCost(0);
        $def->setEstLaborCost(0);
        $def->setManDaysInternal(0);
        $def->setManDaysExternal(0);
        $def->setBudgetStatus('unbudgeted');
        $def->setAssetId(0);
        $def->setCreatedAt($now);
        $def->setUpdatedAt($now);
        $created_def = $this->deficiencyMapper->insert($def);
        $req->setDeficiencyId($created_def->getId());

        $created = $this->requestMapper->insert($req);
        $row = $created->jsonSerialize();
        $row['node_hostname'] = $node->getHostname();
        return new DataResponse($row, Http::STATUS_CREATED);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function packageSearch(): DataResponse {
        $q = trim($this->request->getParam('q', ''));
        if (strlen($q) < 2) return new DataResponse([]);
        if (!preg_match('/^[a-z0-9][a-z0-9+\-. ]*$/i', $q)) return new DataResponse([]);

        $url = 'https://repology.org/api/v1/projects/?search=' . urlencode($q)
             . '&inrepo=ubuntu_24_04&limit=20';
        $ctx = stream_context_create(['http' => [
            'timeout' => 6,
            'header'  => "User-Agent: MaintainOpsSuite/1.0\r\n",
        ]]);
        try {
            $body = @file_get_contents($url, false, $ctx);
        } catch (\Exception $e) {
            return new DataResponse([]);
        }
        if ($body === false) return new DataResponse([]);
        $data = json_decode($body, true);
        if (!is_array($data)) return new DataResponse([]);

        $results = [];
        foreach ($data as $project => $packages) {
            $ubuntuPkg = null;
            $summary   = '';
            foreach ($packages as $pkg) {
                if (str_contains($pkg['repo'] ?? '', 'ubuntu')) {
                    $ubuntuPkg = $pkg['binname'] ?? $pkg['srcname'] ?? $project;
                    $summary   = $pkg['summary'] ?? '';
                    break;
                }
            }
            if ($ubuntuPkg) {
                $results[] = ['name' => $ubuntuPkg, 'project' => $project, 'summary' => mb_substr($summary, 0, 80)];
            }
        }
        usort($results, fn($a,$b) => strcmp($a['name'], $b['name']));
        return new DataResponse(array_slice($results, 0, 12));
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function repologyCheck(): DataResponse {
        $pkg = trim($this->request->getParam('pkg', ''));
        if ($pkg === '' || !preg_match('/^[a-z0-9][a-z0-9+\-.]+$/i', $pkg)) {
            return new DataResponse(['found' => false, 'error' => 'invalid']);
        }
        $url = 'https://repology.org/api/v1/project/' . urlencode($pkg);
        $ctx = stream_context_create(['http' => [
            'timeout' => 6,
            'header'  => "User-Agent: MaintainOpsSuite/1.0\r\n",
        ]]);
        try {
            $body = @file_get_contents($url, false, $ctx);
        } catch (\Exception $e) {
            return new DataResponse(['found' => false, 'error' => 'unreachable']);
        }
        if ($body === false) {
            return new DataResponse(['found' => false, 'error' => 'unreachable']);
        }
        $data  = json_decode($body, true);
        $found = false;
        if (is_array($data)) {
            foreach ($data as $entry) {
                if (isset($entry['repo']) && preg_match('/ubuntu|debian/i', $entry['repo'])) {
                    $found = true;
                    break;
                }
            }
        }
        return new DataResponse(['found' => $found]);
    }

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function requestConfirm(int $id): DataResponse {
        $now    = date('Y-m-d H:i:s');
        $data   = $this->request->getParams();
        $success = (bool)($data['success'] ?? false);
        $req    = $this->requestMapper->findById($id);
        $req->setStatus($success ? 'installed' : 'failed');
        $req->setInstalledAt($success ? $now : '');
        $req->setNotes($data['error'] ?? '');
        $req->setUpdatedAt($now);
        if ($success && $req->getDeficiencyId()) {
            try {
                $def = $this->deficiencyMapper->find($req->getDeficiencyId());
                $def->setStatus('closed');
                $def->setUpdatedAt($now);
                $this->deficiencyMapper->update($def);
            } catch (\Exception) {}
        }
        $updated = $this->requestMapper->update($req);
        return new DataResponse($updated->jsonSerialize());
    }
}
