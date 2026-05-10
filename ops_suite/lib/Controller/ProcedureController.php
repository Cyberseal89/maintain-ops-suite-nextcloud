<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

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
        string                   $appName,
        IRequest                 $request,
        private readonly ProcedureMapper     $mapper,
        private readonly IUserSession        $userSession,
        private readonly PermissionService   $permission
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $assetId     = $this->request->getParam('asset_id');
        $overdueOnly = $this->request->getParam('overdue') === '1';
        $assignedTo  = $this->request->getParam('assigned_to') ?: null;
        $procs = $this->mapper->findAll($assetId ? (int)$assetId : null, $overdueOnly, $assignedTo);
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
        $proc->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $proc->setCreateDeficiencyOnFail((int)($data['create_deficiency_on_fail'] ?? 0));
        $proc->setCreatedBy($uid);
        $proc->setCreatedAt($now);
        $proc->setUpdatedAt($now);
        $proc->setNextDue($data['last_completed']
            ? $this->calcNextDue($data['periodicity'] ?? 'monthly', $data['last_completed'])
            : null);

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
        if (array_key_exists('create_deficiency_on_fail', $data))
            $proc->setCreateDeficiencyOnFail((int)$data['create_deficiency_on_fail']);
        $proc->setUpdatedAt(date('Y-m-d H:i:s'));

        // Recalculate next_due if periodicity or last_completed changed
        if (array_key_exists('last_completed', $data) || array_key_exists('periodicity', $data)) {
            $lc = $proc->getLastCompleted();
            if ($lc) $proc->setNextDue($this->calcNextDue($proc->getPeriodicity(), $lc));
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
        $proc->setLastCompleted($today);
        $proc->setNextDue($this->calcNextDue($proc->getPeriodicity(), $today));
        $proc->setUpdatedAt(date('Y-m-d H:i:s'));

        // Closeout details
        $actualHours     = $this->request->getParam('actual_hours');
        $actualPartsCost = $this->request->getParam('actual_parts_cost');
        $actualLaborCost = $this->request->getParam('actual_labor_cost');
        $completionNotes = $this->request->getParam('completion_notes');
        if ($actualHours !== null)     $proc->setActualHours((float)$actualHours);
        if ($actualPartsCost !== null) $proc->setActualPartsCost((float)$actualPartsCost);
        if ($actualLaborCost !== null) $proc->setActualLaborCost((float)$actualLaborCost);
        if ($completionNotes !== null) $proc->setCompletionNotes((string)$completionNotes);

        return new DataResponse($this->mapper->update($proc)->jsonSerialize());
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
