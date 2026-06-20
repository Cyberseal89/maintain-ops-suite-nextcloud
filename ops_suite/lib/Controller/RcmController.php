<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\RcmDecision;
use OCA\OpsSuite\Db\RcmDecisionMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class RcmController extends Controller {

    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly RcmDecisionMapper  $mapper,
        private readonly PermissionService  $permission,
        private readonly IUserSession       $userSession,
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $worksheetId  = $this->request->getParam('worksheet_id')   ? (int)$this->request->getParam('worksheet_id')   : null;
        $fmeaEntryId  = $this->request->getParam('fmea_entry_id')  ? (int)$this->request->getParam('fmea_entry_id')  : null;

        if ($fmeaEntryId) {
            $d = $this->mapper->findByFmeaEntry($fmeaEntryId);
            return new DataResponse($d ? [$d->jsonSerialize()] : []);
        }
        if ($worksheetId) {
            $rows = $this->mapper->findByWorksheet($worksheetId);
            return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $rows));
        }
        return new DataResponse([]);
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
    public function upsert(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data        = $this->request->getParams();
        $fmeaEntryId = (int)($data['fmea_entry_id'] ?? 0);
        $worksheetId = (int)($data['worksheet_id']  ?? 0);
        if (!$fmeaEntryId || !$worksheetId) {
            return new DataResponse(['message' => 'fmea_entry_id and worksheet_id required'], Http::STATUS_BAD_REQUEST);
        }

        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';

        $existing = $this->mapper->findByFmeaEntry($fmeaEntryId);
        if ($existing) {
            $d = $existing;
        } else {
            $d = new RcmDecision();
            $d->setFmeaEntryId($fmeaEntryId);
            $d->setWorksheetId($worksheetId);
            $d->setCreatedBy($uid);
            $d->setCreatedAt($now);
        }

        if (array_key_exists('failure_visibility',  $data)) $d->setFailureVisibility($data['failure_visibility']);
        if (array_key_exists('failure_consequence', $data)) $d->setFailureConsequence($data['failure_consequence']);
        if (array_key_exists('task_type',           $data)) $d->setTaskType($data['task_type']);
        if (array_key_exists('task_interval',       $data)) $d->setTaskInterval($data['task_interval'] ?? '');
        if (array_key_exists('interval_basis',      $data)) $d->setIntervalBasis($data['interval_basis'] ?? '');
        if (array_key_exists('linked_procedure_id', $data)) $d->setLinkedProcedureId($data['linked_procedure_id'] ? (int)$data['linked_procedure_id'] : null);
        if (array_key_exists('rationale',           $data)) $d->setRationale($data['rationale'] ?? '');
        if (array_key_exists('approved_by',         $data)) {
            $d->setApprovedBy($data['approved_by'] ?? '');
            $d->setApprovedAt(!empty($data['approved_by']) ? $now : null);
        }
        $d->setUpdatedAt($now);

        $result = $existing ? $this->mapper->update($d) : $this->mapper->insert($d);
        $status = $existing ? Http::STATUS_OK : Http::STATUS_CREATED;
        return new DataResponse($result->jsonSerialize(), $status);
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
