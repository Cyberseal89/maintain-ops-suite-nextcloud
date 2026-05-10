<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\ModernizationMapper;
use OCA\OpsSuite\Db\ModernizationDocMapper;
use OCA\OpsSuite\Db\Modernization;
use OCA\OpsSuite\Db\ModernizationDoc;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class ModernizationController extends Controller {
    public function __construct(
        string                        $appName,
        IRequest                      $request,
        private readonly ModernizationMapper    $mapper,
        private readonly ModernizationDocMapper $docMapper,
        private readonly PermissionService      $permission,
        private readonly IUserSession           $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $status     = $this->request->getParam('status')      ?: null;
        $platformId = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $assignedTo = $this->request->getParam('assigned_to') ?: null;
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds   = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];

        if (!empty($platformIds)) {
            $mods = $this->mapper->findForPlatforms($platformIds);
        } else {
            $mods = $this->mapper->findAll($status, $platformId, $assignedTo);
        }
        return new DataResponse(array_map(fn($m) => $m->jsonSerialize(), $mods));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $mod  = $this->mapper->find($id);
            $docs = $this->docMapper->findForModernization($id);
            $data = $mod->jsonSerialize();
            $data['docs'] = array_map(fn($d) => $d->jsonSerialize(), $docs);
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $mod = new Modernization();
        $mod->setTitle($data['title'] ?? '');
        $mod->setDescription($data['description'] ?? '');
        $mod->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $mod->setStatus($data['status'] ?? 'design');
        $mod->setAssetIds($data['asset_ids'] ?? '[]');
        $mod->setStartDate($data['start_date'] ?: null);
        $mod->setTargetCompletion($data['target_completion'] ?: null);
        $mod->setAssignedTo($data['assigned_to'] ?? '');
        $mod->setApprover($data['approver'] ?? '');
        $mod->setEstPartsCost((float)($data['est_parts_cost'] ?? 0));
        $mod->setEstLaborCost((float)($data['est_labor_cost'] ?? 0));
        $mod->setEstContractorCost((float)($data['est_contractor_cost'] ?? 0));
        $mod->setCreatedBy($uid);
        $mod->setCreatedAt($now);
        $mod->setUpdatedAt($now);

        $created = $this->mapper->insert($mod);
        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $mod = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        if (array_key_exists('title', $data))              $mod->setTitle($data['title']);
        if (array_key_exists('description', $data))        $mod->setDescription($data['description']);
        if (array_key_exists('platform_id', $data))        $mod->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('status', $data))             $mod->setStatus($data['status']);
        if (array_key_exists('asset_ids', $data))          $mod->setAssetIds($data['asset_ids']);
        if (array_key_exists('start_date', $data))         $mod->setStartDate($data['start_date'] ?: null);
        if (array_key_exists('target_completion', $data))  $mod->setTargetCompletion($data['target_completion'] ?: null);
        if (array_key_exists('assigned_to', $data))        $mod->setAssignedTo($data['assigned_to']);
        if (array_key_exists('approver', $data))           $mod->setApprover($data['approver']);
        if (array_key_exists('est_parts_cost', $data))     $mod->setEstPartsCost((float)$data['est_parts_cost']);
        if (array_key_exists('est_labor_cost', $data))     $mod->setEstLaborCost((float)$data['est_labor_cost']);
        if (array_key_exists('est_contractor_cost', $data))$mod->setEstContractorCost((float)$data['est_contractor_cost']);
        if (array_key_exists('actual_parts_cost', $data))  $mod->setActualPartsCost((float)$data['actual_parts_cost']);
        if (array_key_exists('actual_labor_cost', $data))  $mod->setActualLaborCost((float)$data['actual_labor_cost']);
        if (array_key_exists('actual_contractor_cost', $data)) $mod->setActualContractorCost((float)$data['actual_contractor_cost']);
        if (array_key_exists('completion_notes', $data))   $mod->setCompletionNotes($data['completion_notes']);

        // Auto-set approved_by and approved_at when moving to approval status
        if (isset($data['status']) && $data['status'] === 'approval' && $mod->getStatus() !== 'approval') {
            // Request for approval — set approver if provided
        }
        // Auto-set approved when moving to execution
        if (isset($data['status']) && $data['status'] === 'execution' && $mod->getStatus() === 'approval') {
            $mod->setApprovedBy($uid);
            $mod->setApprovedAt(date('Y-m-d H:i:s'));
        }

        $mod->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($mod)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->docMapper->deleteForModernization($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Document endpoints ────────────────────────────────────────

    /** @NoAdminRequired */
    public function getDocs(int $id): DataResponse {
        $docs = $this->docMapper->findForModernization($id);
        return new DataResponse(array_map(fn($d) => $d->jsonSerialize(), $docs));
    }

    /** @NoAdminRequired */
    public function addDoc(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $doc = new ModernizationDoc();
        $doc->setModernizationId($id);
        $doc->setDocType($data['doc_type'] ?? 'other');
        $doc->setTitle($data['title'] ?? '');
        $doc->setFileRef($data['file_ref'] ?? '');
        $doc->setStatus($data['status'] ?? 'pending');
        $doc->setNotes($data['notes'] ?? '');
        $doc->setCreatedBy($uid);
        $doc->setCreatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->docMapper->insert($doc)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateDoc(int $id, int $docId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $doc = $this->docMapper->find($docId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('doc_type', $data)) $doc->setDocType($data['doc_type']);
        if (array_key_exists('title', $data))    $doc->setTitle($data['title']);
        if (array_key_exists('file_ref', $data)) $doc->setFileRef($data['file_ref']);
        if (array_key_exists('status', $data))   $doc->setStatus($data['status']);
        if (array_key_exists('notes', $data))    $doc->setNotes($data['notes']);
        return new DataResponse($this->docMapper->update($doc)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function deleteDoc(int $id, int $docId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->docMapper->delete($this->docMapper->find($docId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
