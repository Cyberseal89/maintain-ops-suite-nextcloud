<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Deficiency;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCA\OpsSuite\Db\DeficiencyHistory;
use OCA\OpsSuite\Db\DeficiencyHistoryMapper;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class DeficiencyController extends Controller {
    public function __construct(
        string       $appName,
        IRequest     $request,
        private readonly DeficiencyMapper        $mapper,
        private readonly DeficiencyHistoryMapper $historyMapper,
        private readonly IUserSession            $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $severity = $this->request->getParam('severity');
        $status   = $this->request->getParam('status');
        $assetId  = $this->request->getParam('asset_id');
        $defs = $this->mapper->findAll(
            $severity ?: null,
            $status   ?: null,
            $assetId  ? (int)$assetId : null
        );
        return new DataResponse(array_map(fn($d) => $d->jsonSerialize(), $defs));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $def     = $this->mapper->find($id);
            $history = $this->historyMapper->findByDeficiency($id);
            $data    = $def->jsonSerialize();
            $data['history'] = array_map(fn($h) => $h->jsonSerialize(), $history);
            $data['logs']    = $data['history']; // alias for JS compatibility
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function create(): DataResponse {
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        $def = new Deficiency();
        $def->setSummary($data['summary'] ?? '');
        $def->setDescription($data['description'] ?? '');
        $def->setAssetId((int)($data['asset_id'] ?? 0));
        $def->setSeverity($data['severity'] ?? 'SEV-3');
        $def->setStatus($data['status'] ?? 'open');
        $def->setDiscoveryMethod($data['discovery_method'] ?? 'walkdown');
        $def->setAssignedTo($data['assigned_to'] ?? '');
        $def->setReviewedBy($data['reviewed_by'] ?? '');
        $def->setRequirementsToResolve($data['requirements_to_resolve'] ?? '');
        $def->setOutsideEntityRequired($data['outside_entity_required'] ?? '');
        $def->setEstPartsCost((float)($data['est_parts_cost'] ?? 0));
        $def->setEstLaborCost((float)($data['est_labor_cost'] ?? 0));
        $def->setManDaysInternal((float)($data['man_days_internal'] ?? 0));
        $def->setManDaysExternal((float)($data['man_days_external'] ?? 0));
        $def->setScheduledOutageHours((float)($data['scheduled_outage_hours'] ?? 0));
        $def->setTargetCompletion($data['target_completion'] ?: null);
        $def->setLinkedProcedureId((int)($data['linked_procedure_id'] ?? 0));
        $def->setCreatedBy($uid);
        $def->setCreatedAt($now);
        $def->setUpdatedAt($now);

        $created = $this->mapper->insert($def);

        // Auto-create the opening history entry
        $this->addHistory($created->getId(), 'Deficiency opened.', $uid, $now);

        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        try {
            $def = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $uid       = $this->userSession->getUser()?->getUID() ?? '';
        $data      = $this->request->getParams();
        $oldStatus = $def->getStatus();

        if (array_key_exists('summary', $data))                  $def->setSummary($data['summary']);
        if (array_key_exists('description', $data))              $def->setDescription($data['description']);
        if (array_key_exists('severity', $data))                 $def->setSeverity($data['severity']);
        if (array_key_exists('status', $data))                   $def->setStatus($data['status']);
        if (array_key_exists('assigned_to', $data))              $def->setAssignedTo($data['assigned_to']);
        if (array_key_exists('reviewed_by', $data))              $def->setReviewedBy($data['reviewed_by']);
        if (array_key_exists('requirements_to_resolve', $data))  $def->setRequirementsToResolve($data['requirements_to_resolve']);
        if (array_key_exists('outside_entity_required', $data))  $def->setOutsideEntityRequired($data['outside_entity_required']);
        if (array_key_exists('est_parts_cost', $data))           $def->setEstPartsCost((float)$data['est_parts_cost']);
        if (array_key_exists('est_labor_cost', $data))           $def->setEstLaborCost((float)$data['est_labor_cost']);
        if (array_key_exists('man_days_internal', $data))        $def->setManDaysInternal((float)$data['man_days_internal']);
        if (array_key_exists('man_days_external', $data))        $def->setManDaysExternal((float)$data['man_days_external']);
        if (array_key_exists('scheduled_outage_hours', $data))   $def->setScheduledOutageHours((float)$data['scheduled_outage_hours']);
        if (array_key_exists('target_completion', $data))        $def->setTargetCompletion($data['target_completion'] ?: null);
        $def->setUpdatedAt(date('Y-m-d H:i:s'));

        $updated = $this->mapper->update($def);

        // Auto-log status changes to the history trail
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $this->addHistory($id, "Status changed: {$oldStatus} → {$data['status']}.", $uid);
        }

        return new DataResponse($updated->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        try {
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    private function addHistory(int $defId, string $text, string $uid, ?string $now = null): void {
        $entry = new DeficiencyHistory();
        $entry->setDeficiencyId($defId);
        $entry->setEntryText($text);
        $entry->setCreatedBy($uid);
        $entry->setCreatedAt($now ?? date('Y-m-d H:i:s'));
        $this->historyMapper->insert($entry);
    }
}
