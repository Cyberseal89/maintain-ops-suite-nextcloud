<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Deficiency;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCA\OpsSuite\Db\Procedure;
use OCA\OpsSuite\Db\ProcedureMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class ProcedureController extends Controller {
    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly ProcedureMapper   $mapper,
        private readonly DeficiencyMapper  $defMapper,
        private readonly IUserSession      $userSession,
        private readonly PermissionService $permission
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $assetId     = $this->request->getParam('asset_id');
        $overdueOnly = $this->request->getParam('overdue') === '1';
        $assignedTo  = $this->request->getParam('assigned_to') ?: null;
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];
        $procs = $this->mapper->findAll($assetId ? (int)$assetId : null, $overdueOnly, $assignedTo, $platformIds);
        return new DataResponse(array_map(fn($p) => $p->jsonSerialize(), $procs));
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
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        $proc = new Procedure();
        $proc->setName($data['name'] ?? '');
        $proc->setAssetId((int)($data['asset_id'] ?? 0));
        $proc->setCategory($data['category'] ?? '');
        $proc->setPeriodicity($data['periodicity'] ?? 'monthly');
        $proc->setLastCompleted($data['last_completed'] ?: null);
        $proc->setAssignedTo($data['assigned_to'] ?? '');
        $proc->setDocumentRef($data['document_ref'] ?? '');
        $proc->setDescription($data['description'] ?? '');
        $proc->setEstHours((float)($data['est_hours'] ?? 0));
        $proc->setDocumentId(isset($data['document_id']) && $data['document_id'] ? (int)$data['document_id'] : null);
        $proc->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $proc->setCreateDeficiencyOnFail((int)($data['create_deficiency_on_fail'] ?? 0));
        $proc->setTsDocumentId(isset($data['ts_document_id']) && $data['ts_document_id'] ? (int)$data['ts_document_id'] : null);

        // CBM / trigger fields
        $ttype = $data['trigger_type'] ?? 'calendar';
        $proc->setTriggerType($ttype);
        $proc->setMeterType($data['meter_type'] ?? null ?: null);
        $proc->setMeterUnit($data['meter_unit'] ?? null ?: null);
        $proc->setMeterInterval(isset($data['meter_interval']) && $data['meter_interval'] !== '' ? (float)$data['meter_interval'] : null);
        $meterLast = isset($data['meter_last_value']) && $data['meter_last_value'] !== '' ? (float)$data['meter_last_value'] : null;
        $proc->setMeterLastValue($meterLast);
        $interval = isset($data['meter_interval']) && $data['meter_interval'] !== '' ? (float)$data['meter_interval'] : null;
        $proc->setMeterNextDueValue($meterLast !== null && $interval !== null ? $meterLast + $interval : null);
        $proc->setTriggerCondition($data['trigger_condition'] ?? null ?: null);
        $proc->setTriggerSourceId(isset($data['trigger_source_id']) && $data['trigger_source_id'] ? (int)$data['trigger_source_id'] : null);
        $proc->setTriggerThreshold(isset($data['trigger_threshold']) && $data['trigger_threshold'] !== '' ? (float)$data['trigger_threshold'] : null);
        $proc->setPendingTrigger(0);

        $proc->setCreatedBy($uid);
        $proc->setCreatedAt($now);
        $proc->setUpdatedAt($now);

        // Calendar next_due only applies to calendar and meter (meter uses calendar as check-in reminder)
        if ($ttype !== 'as_required') {
            $proc->setNextDue($data['last_completed']
                ? $this->calcNextDue($data['periodicity'] ?? 'monthly', $data['last_completed'])
                : null);
        }

        return new DataResponse($this->mapper->insert($proc)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $proc = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        if (array_key_exists('name', $data))            $proc->setName($data['name']);
        if (array_key_exists('asset_id', $data))        $proc->setAssetId((int)$data['asset_id']);
        if (array_key_exists('category', $data))        $proc->setCategory($data['category']);
        if (array_key_exists('periodicity', $data))     $proc->setPeriodicity($data['periodicity']);
        if (array_key_exists('last_completed', $data))  $proc->setLastCompleted($data['last_completed'] ?: null);
        if (array_key_exists('next_due', $data))        $proc->setNextDue($data['next_due'] ?: null);
        if (array_key_exists('assigned_to', $data))     $proc->setAssignedTo($data['assigned_to']);
        if (array_key_exists('document_ref', $data))    $proc->setDocumentRef($data['document_ref']);
        if (array_key_exists('description', $data))     $proc->setDescription($data['description']);
        if (array_key_exists('est_hours', $data))       $proc->setEstHours((float)$data['est_hours']);
        if (array_key_exists('document_id', $data))     $proc->setDocumentId($data['document_id'] ? (int)$data['document_id'] : null);
        if (array_key_exists('create_deficiency_on_fail', $data))
            $proc->setCreateDeficiencyOnFail((int)$data['create_deficiency_on_fail']);
        if (array_key_exists('ts_document_id', $data))
            $proc->setTsDocumentId($data['ts_document_id'] ? (int)$data['ts_document_id'] : null);

        // CBM / trigger fields
        if (array_key_exists('trigger_type', $data))        $proc->setTriggerType($data['trigger_type'] ?: 'calendar');
        if (array_key_exists('meter_type', $data))          $proc->setMeterType($data['meter_type'] ?: null);
        if (array_key_exists('meter_unit', $data))          $proc->setMeterUnit($data['meter_unit'] ?: null);
        if (array_key_exists('meter_interval', $data))      $proc->setMeterInterval($data['meter_interval'] !== '' ? (float)$data['meter_interval'] : null);
        if (array_key_exists('meter_last_value', $data))    $proc->setMeterLastValue($data['meter_last_value'] !== '' ? (float)$data['meter_last_value'] : null);
        if (array_key_exists('trigger_condition', $data))   $proc->setTriggerCondition($data['trigger_condition'] ?: null);
        if (array_key_exists('trigger_source_id', $data))   $proc->setTriggerSourceId($data['trigger_source_id'] ? (int)$data['trigger_source_id'] : null);
        if (array_key_exists('trigger_threshold', $data))   $proc->setTriggerThreshold($data['trigger_threshold'] !== '' ? (float)$data['trigger_threshold'] : null);
        // Recalculate meter_next_due_value if meter fields changed
        if (array_key_exists('meter_last_value', $data) || array_key_exists('meter_interval', $data)) {
            $ml = $proc->getMeterLastValue();
            $mi = $proc->getMeterInterval();
            $proc->setMeterNextDueValue($ml !== null && $mi !== null ? $ml + $mi : null);
        }

        $proc->setUpdatedAt(date('Y-m-d H:i:s'));

        // Recalculate calendar next_due if periodicity or last_completed changed
        if (array_key_exists('last_completed', $data) || array_key_exists('periodicity', $data)) {
            $lc = $proc->getLastCompleted();
            if ($lc && $proc->getTriggerType() !== 'as_required') {
                $proc->setNextDue($this->calcNextDue($proc->getPeriodicity(), $lc));
            }
        }

        return new DataResponse($this->mapper->update($proc)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function complete(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $proc = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $today = date('Y-m-d');
        $now   = date('Y-m-d H:i:s');
        $uid   = $this->userSession->getUser()?->getUID() ?? '';
        $proc->setLastCompleted($today);
        $proc->setUpdatedAt($now);

        // Closeout details
        $actualHours     = $this->request->getParam('actual_hours');
        $actualPartsCost = $this->request->getParam('actual_parts_cost');
        $actualLaborCost = $this->request->getParam('actual_labor_cost');
        $completionNotes = $this->request->getParam('completion_notes');
        if ($actualHours !== null)     $proc->setActualHours((float)$actualHours);
        if ($actualPartsCost !== null) $proc->setActualPartsCost((float)$actualPartsCost);
        if ($actualLaborCost !== null) $proc->setActualLaborCost((float)$actualLaborCost);
        if ($completionNotes !== null) $proc->setCompletionNotes((string)$completionNotes);

        $ttype = $proc->getTriggerType() ?: 'calendar';
        $triggeredPmIds = [];

        if ($ttype === 'meter') {
            // Record current meter reading and advance the next-due threshold
            $currentReading = $this->request->getParam('meter_current_value');
            if ($currentReading !== null && $currentReading !== '') {
                $current  = (float)$currentReading;
                $interval = $proc->getMeterInterval();
                $proc->setMeterLastValue($current);
                $proc->setMeterNextDueValue($interval !== null ? $current + $interval : null);
            }
            // Calendar next_due: advance by periodicity as a check-in reminder
            $proc->setNextDue($this->calcNextDue($proc->getPeriodicity(), $today));

            // Evaluate linked as_required PMs — flag any whose threshold is now met
            $linked = $this->mapper->findByTriggerSource($proc->getId());
            foreach ($linked as $child) {
                $threshold = $child->getTriggerThreshold();
                $reading   = $proc->getMeterLastValue();
                if ($threshold !== null && $reading !== null && $reading >= $threshold) {
                    $child->setPendingTrigger(1);
                    $child->setUpdatedAt(date('Y-m-d H:i:s'));
                    $this->mapper->update($child);
                    $triggeredPmIds[] = $child->getId();
                }
            }
        } elseif ($ttype === 'as_required') {
            // Completing an as_required PM clears its pending flag
            $proc->setPendingTrigger(0);
        } else {
            $proc->setNextDue($this->calcNextDue($proc->getPeriodicity(), $today));
        }

        $result = $this->mapper->update($proc)->jsonSerialize();
        if (!empty($triggeredPmIds)) {
            $result['triggered_pm_ids'] = $triggeredPmIds;
        }

        // Auto-create deficiency when explicitly requested (log_deficiency=1)
        // or when create_deficiency_on_fail is set and deficiency_summary is provided
        $logDef     = (int)($this->request->getParam('log_deficiency') ?? 0);
        $defSummary = trim((string)($this->request->getParam('deficiency_summary') ?? ''));
        if ($logDef && $defSummary) {
            $def = new Deficiency();
            $def->setAssetId($proc->getAssetId());
            $def->setSummary($defSummary);
            $def->setDescription(
                'Auto-generated from PM '.$proc->getId().' ('.$proc->getName().')'.
                ($completionNotes ? "\n\nCompletion notes: ".$completionNotes : '')
            );
            $def->setSeverity('SEV-3');
            $def->setStatus('open');
            $def->setLinkedProcedureId($proc->getId());
            if ($proc->getTsDocumentId()) {
                $def->setDocumentId($proc->getTsDocumentId());
            }
            $def->setCreatedBy($uid ?? '');
            $def->setCreatedAt($now);
            $def->setUpdatedAt($now);
            $created = $this->defMapper->insert($def);
            $result['deficiency_id'] = $created->getId();
        }

        return new DataResponse($result);
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    private function calcNextDue(string $periodicity, string $fromDate): string {
        $d = new \DateTime($fromDate);
        match ($periodicity) {
            'daily'       => $d->modify('+1 day'),
            'weekly'      => $d->modify('+7 days'),
            'monthly'     => $d->modify('+1 month'),
            'quarterly'   => $d->modify('+3 months'),
            'semi_annual' => $d->modify('+6 months'),
            'annual'      => $d->modify('+1 year'),
            default       => $d->modify('+1 month'),
        };
        return $d->format('Y-m-d');
    }
}
