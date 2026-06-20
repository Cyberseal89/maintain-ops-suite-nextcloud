<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Db\Requirement;
use OCA\OpsSuite\Db\RequirementMapper;
use OCA\OpsSuite\Db\SystemInterface;
use OCA\OpsSuite\Db\SystemInterfaceMapper;
use OCA\OpsSuite\Db\ReqTraceability;
use OCA\OpsSuite\Db\ReqTraceabilityMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class MbseController extends Controller {
    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly AssetMapper            $assetMapper,
        private readonly RequirementMapper      $reqMapper,
        private readonly SystemInterfaceMapper  $ifMapper,
        private readonly ReqTraceabilityMapper  $tracMapper,
        private readonly PermissionService      $permission,
        private readonly IUserSession           $userSession
    ) {
        parent::__construct($appName, $request);
    }

    // ── Requirements ──────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexRequirements(): DataResponse {
        $assetId  = $this->request->getParam('asset_id')          ? (int)$this->request->getParam('asset_id')          : null;
        $modId    = $this->request->getParam('modernization_id')  ? (int)$this->request->getParam('modernization_id')  : null;
        $reqType  = $this->request->getParam('req_type')  ?: null;
        $status   = $this->request->getParam('status')    ?: null;
        $reqs = $this->reqMapper->findAll($assetId, $reqType, $status, $modId);
        return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $reqs));
    }

    /** @NoAdminRequired */
    public function showRequirement(int $id): DataResponse {
        try {
            $req  = $this->reqMapper->find($id);
            $data = $req->jsonSerialize();
            $data['traceability'] = array_map(
                fn($t) => $t->jsonSerialize(),
                $this->tracMapper->findForRequirement($id)
            );
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createRequirement(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $assetId = (int)($data['asset_id'] ?? 0);
        if (!$assetId) {
            return new DataResponse(['message' => 'asset_id required'], Http::STATUS_BAD_REQUEST);
        }

        // Auto-generate req_code from asset code + sequence
        $reqCode = $data['req_code'] ?? $this->buildReqCode($assetId);

        $req = new Requirement();
        $req->setReqCode($reqCode);
        $req->setAssetId($assetId);
        $req->setModernizationId(isset($data['modernization_id']) && $data['modernization_id'] ? (int)$data['modernization_id'] : null);
        $req->setTitle($data['title'] ?? '');
        $req->setDescription($data['description'] ?? '');
        $req->setReqType($data['req_type'] ?? 'functional');
        $req->setThreshold($data['threshold'] ?: null);
        $req->setObjective($data['objective'] ?: null);
        $req->setUnit($data['unit'] ?: null);
        $req->setVerifiedByPmId(isset($data['verified_by_pm_id']) && $data['verified_by_pm_id'] ? (int)$data['verified_by_pm_id'] : null);
        $req->setStatus($data['status'] ?? 'untested');
        $req->setPriority($data['priority'] ?? 'P1');
        $req->setNotes($data['notes'] ?? '');
        $req->setCreatedBy($uid);
        $req->setCreatedAt($now);
        $req->setUpdatedAt($now);

        return new DataResponse($this->reqMapper->insert($req)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateRequirement(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $req = $this->reqMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('title', $data))             $req->setTitle($data['title']);
        if (array_key_exists('description', $data))       $req->setDescription($data['description']);
        if (array_key_exists('req_type', $data))          $req->setReqType($data['req_type']);
        if (array_key_exists('threshold', $data))         $req->setThreshold($data['threshold'] ?: null);
        if (array_key_exists('objective', $data))         $req->setObjective($data['objective'] ?: null);
        if (array_key_exists('unit', $data))              $req->setUnit($data['unit'] ?: null);
        if (array_key_exists('verified_by_pm_id', $data)) $req->setVerifiedByPmId($data['verified_by_pm_id'] ? (int)$data['verified_by_pm_id'] : null);
        if (array_key_exists('last_verified_at', $data))  $req->setLastVerifiedAt($data['last_verified_at'] ?: null);
        if (array_key_exists('last_verified_value', $data)) $req->setLastVerifiedValue($data['last_verified_value'] ?: null);
        if (array_key_exists('status', $data))            $req->setStatus($data['status']);
        if (array_key_exists('priority', $data))          $req->setPriority($data['priority']);
        if (array_key_exists('notes', $data))             $req->setNotes($data['notes']);
        $req->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->reqMapper->update($req)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyRequirement(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->tracMapper->deleteForRequirement($id);
            $this->reqMapper->delete($this->reqMapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Traceability ──────────────────────────────────────────────

    /** @NoAdminRequired */
    public function addTrace(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $trace = new ReqTraceability();
        $trace->setReqId($id);
        $trace->setTracedToType($data['traced_to_type'] ?? '');
        $trace->setTracedToId((int)($data['traced_to_id'] ?? 0));
        $trace->setTraceType($data['trace_type'] ?? 'satisfies');
        $trace->setNotes($data['notes'] ?? '');
        $trace->setCreatedBy($uid);
        $trace->setCreatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->tracMapper->insert($trace)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function deleteTrace(int $id, int $traceId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->tracMapper->delete($this->tracMapper->find($traceId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Interfaces ────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexInterfaces(): DataResponse {
        $type    = $this->request->getParam('interface_type')       ?: null;
        $status  = $this->request->getParam('status')               ?: null;
        $modId   = $this->request->getParam('modernization_id') ? (int)$this->request->getParam('modernization_id') : null;
        $assetId = $this->request->getParam('asset_id')         ? (int)$this->request->getParam('asset_id')         : null;
        if ($assetId !== null) {
            $ifaces = $this->ifMapper->findForAsset($assetId);
        } else {
            $ifaces = $this->ifMapper->findAll($type, $status, $modId);
        }
        return new DataResponse(array_map(fn($i) => $i->jsonSerialize(), $ifaces));
    }

    /** @NoAdminRequired */
    public function showInterface(int $id): DataResponse {
        try {
            return new DataResponse($this->ifMapper->find($id)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createInterface(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $fromId = (int)($data['from_asset_id'] ?? 0);
        $toId   = (int)($data['to_asset_id']   ?? 0);
        if (!$fromId || !$toId) {
            return new DataResponse(['message' => 'from_asset_id and to_asset_id required'], Http::STATUS_BAD_REQUEST);
        }

        $ifCode = $data['interface_code'] ?? $this->buildIfCode($fromId);

        $iface = new SystemInterface();
        $iface->setInterfaceCode($ifCode);
        $iface->setFromAssetId($fromId);
        $iface->setModernizationId(isset($data['modernization_id']) && $data['modernization_id'] ? (int)$data['modernization_id'] : null);
        $iface->setToAssetId($toId);
        $iface->setInterfaceType($data['interface_type'] ?? 'data');
        $iface->setSpecification($data['specification'] ?: null);
        $iface->setStandard($data['standard'] ?: null);
        $iface->setStatus($data['status'] ?? 'active');
        $iface->setCanvasId(isset($data['canvas_id']) && $data['canvas_id'] ? (int)$data['canvas_id'] : null);
        $iface->setDrawingRef($data['drawing_ref'] ?: null);
        $iface->setNotes($data['notes'] ?? '');
        $iface->setCreatedBy($uid);
        $iface->setCreatedAt($now);
        $iface->setUpdatedAt($now);

        return new DataResponse($this->ifMapper->insert($iface)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateInterface(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $iface = $this->ifMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('interface_type', $data)) $iface->setInterfaceType($data['interface_type']);
        if (array_key_exists('specification', $data))  $iface->setSpecification($data['specification'] ?: null);
        if (array_key_exists('standard', $data))       $iface->setStandard($data['standard'] ?: null);
        if (array_key_exists('status', $data))         $iface->setStatus($data['status']);
        if (array_key_exists('drawing_ref', $data))    $iface->setDrawingRef($data['drawing_ref'] ?: null);
        if (array_key_exists('notes', $data))          $iface->setNotes($data['notes']);
        $iface->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->ifMapper->update($iface)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyInterface(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->ifMapper->delete($this->ifMapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Code generators ───────────────────────────────────────────

    private function buildReqCode(int $assetId): string {
        $seq = str_pad((string)$this->reqMapper->nextSequence($assetId), 3, '0', STR_PAD_LEFT);
        try {
            $asset = $this->assetMapper->find($assetId);
            // Extract shop segment from asset_code e.g. HW-C1-001 → C1
            $parts = explode('-', $asset->getAssetCode() ?? '');
            $shopSeg = count($parts) >= 2 ? $parts[1] : 'XX';
            $assetSeg = count($parts) >= 3 ? $parts[2] : '000';
            return 'REQ-' . $shopSeg . '-' . $assetSeg . '-' . $seq;
        } catch (\Throwable) {
            return 'REQ-' . $assetId . '-' . $seq;
        }
    }

    private function buildIfCode(int $fromAssetId): string {
        $seq = str_pad((string)$this->ifMapper->nextSequence($fromAssetId), 2, '0', STR_PAD_LEFT);
        try {
            $asset = $this->assetMapper->find($fromAssetId);
            $parts = explode('-', $asset->getAssetCode() ?? '');
            $shopSeg  = count($parts) >= 2 ? $parts[1] : 'XX';
            $assetSeg = count($parts) >= 3 ? $parts[2] : '000';
            return 'IF-' . $shopSeg . '-' . $assetSeg . '-' . $seq;
        } catch (\Throwable) {
            return 'IF-' . $fromAssetId . '-' . $seq;
        }
    }
}
