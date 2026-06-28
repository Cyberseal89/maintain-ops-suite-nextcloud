<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Document;
use OCA\OpsSuite\Db\DocumentMapper;
use OCA\OpsSuite\Db\FmeaEntry;
use OCA\OpsSuite\Db\FmeaEntryMapper;
use OCA\OpsSuite\Db\FmeaWorksheetMapper;
use OCA\OpsSuite\Db\Procedure;
use OCA\OpsSuite\Db\ProcedureMapper;
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
        string                          $appName,
        IRequest                        $request,
        private readonly RcmDecisionMapper  $mapper,
        private readonly FmeaEntryMapper    $entryMapper,
        private readonly FmeaWorksheetMapper $wsMapper,
        private readonly ProcedureMapper    $procMapper,
        private readonly DocumentMapper     $docMapper,
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

    /**
     * Generate a PM procedure and a DM 200 stub from an approved RCM decision.
     * Safe to call multiple times — if linked_procedure_id already exists, returns
     * the existing record IDs without creating duplicates.
     *
     * @NoAdminRequired
     */
    public function generatePm(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }

        try { $rcm = $this->mapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'RCM decision not found'], Http::STATUS_NOT_FOUND); }

        // If a PM was already generated, return the existing IDs
        if ($rcm->getLinkedProcedureId()) {
            try {
                $proc = $this->procMapper->find($rcm->getLinkedProcedureId());
                return new DataResponse([
                    'procedure_id' => $proc->getId(),
                    'document_id'  => $proc->getDocumentId(),
                    'created'      => false,
                    'message'      => 'PM procedure already exists for this RCM decision.',
                ]);
            } catch (DoesNotExistException) {
                // Stale link — fall through to recreate
            }
        }

        // Resolve asset_id from FMEA entry → worksheet
        try { $entry = $this->entryMapper->find($rcm->getFmeaEntryId()); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'FMEA entry not found'], Http::STATUS_NOT_FOUND); }

        try { $ws = $this->wsMapper->find($entry->getWorksheetId()); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'FMEA worksheet not found'], Http::STATUS_NOT_FOUND); }

        $assetId     = $ws->getAssetId();
        $failureMode = $entry->getFailureMode() ?? 'Unknown Fault';
        $now         = date('Y-m-d H:i:s');
        $uid         = $this->userSession->getUser()?->getUID() ?? '';

        $taskLabels = [
            'on_condition'          => 'On-Condition Inspection',
            'scheduled_restoration' => 'Scheduled Restoration',
            'scheduled_discard'     => 'Scheduled Discard / Replacement',
            'failure_finding'       => 'Failure Finding Check',
            'run_to_failure'        => 'Run-to-Failure',
            'redesign'              => 'Redesign / Change',
        ];
        $taskLabel = $taskLabels[$rcm->getTaskType()] ?? $rcm->getTaskType();

        // Map task interval string to PM periodicity bucket (best-effort)
        $interval    = strtolower(trim($rcm->getTaskInterval() ?? ''));
        $periodicity = 'monthly'; // safe default
        if (str_contains($interval, 'week'))             $periodicity = 'weekly';
        elseif (str_contains($interval, '30 day') || str_contains($interval, '1 month')) $periodicity = 'monthly';
        elseif (str_contains($interval, '90 day') || str_contains($interval, '3 month')) $periodicity = 'quarterly';
        elseif (str_contains($interval, '6 month') || str_contains($interval, '180 day')) $periodicity = 'semi-annual';
        elseif (str_contains($interval, '12 month') || str_contains($interval, '1 year') || str_contains($interval, 'annual')) $periodicity = 'annual';

        // ── 1. Resolve or create the DM 200 ──────────────────────────
        $linkDocId = (int)($this->request->getParam('document_id') ?? 0);
        $dmCreated = false;
        if ($linkDocId > 0) {
            // Caller supplied an existing document — link to it directly
            try { $dm = $this->docMapper->find($linkDocId); }
            catch (DoesNotExistException) { return new DataResponse(['message' => 'Document #'.$linkDocId.' not found'], Http::STATUS_NOT_FOUND); }
        } else {
            // No existing DM selected — create a fresh stub
            $dm = new Document();
            $dm->setDocType('data_module');
            $dm->setInfoCode('200');
            $dm->setInfoCodeVariant('A');
            $dm->setTitle($taskLabel.' — '.$failureMode);
            $dm->setCategory('sop');
            $dm->setStatus('draft');
            $dm->setAssetId($assetId ?: null);
            $dm->setDocNumber('');
            $dm->setApplicability('');
            $dm->setNotes('Generated from RCM decision #'.$id.' (FMEA: '.$failureMode.')');
            $dm->setCreatedBy($uid);
            $dm->setCreatedAt($now);
            $dm->setUpdatedAt($now);
            $dm->setIssueNumber(1);
            $dm->setInWorkNumber(1);
            $dm = $this->docMapper->insert($dm);
            $dmCreated = true;
        }

        // ── 2. Create PM procedure linked to the DM ───────────────────
        $proc = new Procedure();
        $proc->setAssetId($assetId ?: 0);
        $proc->setName($taskLabel.' — '.$failureMode);
        $proc->setCategory($taskLabel);
        $proc->setPeriodicity($periodicity);
        $proc->setDescription(
            ($rcm->getRationale() ? $rcm->getRationale()."\n\n" : '').
            'Interval: '.($rcm->getTaskInterval() ?: 'TBD').
            "\nBasis: ".($rcm->getIntervalBasis() ?: 'See RCM Decision #'.$id)
        );
        $proc->setDocumentRef('');
        $proc->setDocumentId($dm->getId());
        $proc->setEstHours(0);
        $proc->setCreateDeficiencyOnFail(0);
        $proc->setActualHours(0);
        $proc->setActualPartsCost(0);
        $proc->setActualLaborCost(0);
        $proc->setCompletionNotes('');
        $proc->setAssignedTo('');
        $proc->setCreatedBy($uid);
        $proc->setCreatedAt($now);
        $proc->setUpdatedAt($now);
        $proc = $this->procMapper->insert($proc);

        // ── 3. Link RCM decision → PM ─────────────────────────────────
        $rcm->setLinkedProcedureId($proc->getId());
        $rcm->setUpdatedAt($now);
        $this->mapper->update($rcm);

        $msg = $dmCreated
            ? 'PM procedure created and linked to new DM 200 draft.'
            : 'PM procedure created and linked to existing DM #'.$dm->getId().'.';

        return new DataResponse([
            'procedure_id' => $proc->getId(),
            'document_id'  => $dm->getId(),
            'dm_created'   => $dmCreated,
            'created'      => true,
            'message'      => $msg,
        ], Http::STATUS_CREATED);
    }
}
