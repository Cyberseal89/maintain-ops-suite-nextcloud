<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Modernization;
use OCA\OpsSuite\Db\ModernizationMapper;
use OCA\OpsSuite\Db\ModAsset;
use OCA\OpsSuite\Db\ModAssetMapper;
use OCA\OpsSuite\Db\MmbpBudgetMapper;
use OCA\OpsSuite\Db\RequirementMapper;
use OCA\OpsSuite\Db\SystemInterfaceMapper;
use OCA\OpsSuite\Db\DocumentMapper;
use OCA\OpsSuite\Db\ShopMapper;
use OCA\OpsSuite\Db\SupplyRequestMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class ModernizationController extends Controller {

    private const TRANSITIONS = [
        'drafting'        => ['impact_analysis', 'abandoned'],
        'impact_analysis' => ['ccb_review', 'drafting', 'abandoned'],
        'ccb_review'      => ['approved', 'rejected', 'abandoned'],
        'approved'        => ['execution', 'abandoned'],
        'execution'       => ['verification'],
        'verification'    => ['complete', 'execution'],
        'complete'        => [],
        'rejected'        => [],
        'abandoned'       => [],
    ];

    public function __construct(
        string                        $appName,
        IRequest                      $request,
        private readonly ModernizationMapper    $mapper,
        private readonly ModAssetMapper         $assetMapper,
        private readonly RequirementMapper      $reqMapper,
        private readonly SystemInterfaceMapper  $ifaceMapper,
        private readonly DocumentMapper         $docMapper,
        private readonly ShopMapper             $shopMapper,
        private readonly SupplyRequestMapper    $supplyMapper,
        private readonly MmbpBudgetMapper       $budgetMapper,
        private readonly PermissionService      $permission,
        private readonly IUserSession           $userSession
    ) {
        parent::__construct($appName, $request);
    }

    // ── Modernizations ────────────────────────────────────────────

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $status        = $this->request->getParam('status')       ?: null;
        $platformId    = $this->request->getParam('platform_id')  ? (int)$this->request->getParam('platform_id') : null;
        $assignedTo    = $this->request->getParam('assigned_to')  ?: null;
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds   = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];

        $mods = !empty($platformIds)
            ? $this->mapper->findForPlatforms($platformIds)
            : $this->mapper->findAll($status, $platformId, $assignedTo);

        return new DataResponse(array_map(fn($m) => $m->jsonSerialize(), $mods));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $mod  = $this->mapper->find($id);
            $data = $mod->jsonSerialize();
            try { $data['affected_assets'] = array_map(fn($a) => $a->jsonSerialize(), $this->assetMapper->findForMod($id)); }
            catch (\Throwable $e) { $data['affected_assets'] = []; }
            try { $data['supply_requests'] = array_map(fn($s) => $s->jsonSerialize(), $this->supplyMapper->findForSource('modernization', $id)); }
            catch (\Throwable $e) { $data['supply_requests'] = []; }
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

        $shopId  = isset($data['shop_id']) && $data['shop_id'] ? (int)$data['shop_id'] : null;
        $modCode = $data['mod_code'] ?? $this->buildModCode($shopId);

        $mod = new Modernization();
        $mod->setTitle($data['title'] ?? '');
        $mod->setDescription($data['description'] ?? '');
        $mod->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $mod->setStatus('drafting');
        $mod->setModCode($modCode);
        $mod->setShopId($shopId);
        $mod->setModType($data['mod_type'] ?? 'modification');
        $mod->setPriority($data['priority'] ?? 'routine');
        $mod->setInitiatorUid($uid ?: null);
        $mod->setLinkedDefId(isset($data['linked_def_id']) && $data['linked_def_id'] ? (int)$data['linked_def_id'] : null);
        $mod->setLinkedReqId(isset($data['linked_req_id']) && $data['linked_req_id'] ? (int)$data['linked_req_id'] : null);
        $mod->setTrainingDelta(($data['training_delta'] ?? '') ?: null);
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

        return new DataResponse($this->mapper->insert($mod)->jsonSerialize(), Http::STATUS_CREATED);
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

        // Stage transition with validation
        if (array_key_exists('status', $data) && $data['status'] !== $mod->getStatus()) {
            $allowed = self::TRANSITIONS[$mod->getStatus()] ?? [];
            if (!in_array($data['status'], $allowed, true)) {
                return new DataResponse([
                    'message' => 'Invalid transition: ' . $mod->getStatus() . ' → ' . $data['status'],
                ], Http::STATUS_UNPROCESSABLE_ENTITY);
            }
            if ($data['status'] === 'approved') {
                if ($mod->getPlatformId()) {
                    $fy = (int)date('Y');
                    $platEntry = null;
                    foreach ($this->budgetMapper->findForPlatformYear($mod->getPlatformId(), $fy) as $be) {
                        if ($be->getEntryType() === 'platform') { $platEntry = $be; break; }
                    }
                    $est = $mod->getEstPartsCost() + $mod->getEstLaborCost() + $mod->getEstContractorCost();
                    if ($est > 0 && $platEntry === null) {
                        return new DataResponse([
                            'message' => 'CCB approval blocked: no platform budget authority for FY ' . $fy . '. Set budget authority first.',
                        ], Http::STATUS_PAYMENT_REQUIRED);
                    }
                    if ($platEntry && $est > (float)$platEntry->getTotalAuthorized()) {
                        return new DataResponse([
                            'message' => sprintf('CCB approval blocked: estimated cost $%.2f exceeds platform authority of $%.2f.', $est, (float)$platEntry->getTotalAuthorized()),
                        ], Http::STATUS_PAYMENT_REQUIRED);
                    }
                }
                $mod->setApprovedBy($uid);
                $mod->setApprovedAt(date('Y-m-d H:i:s'));
            }
            if ($data['status'] === 'complete') {
                $mod->setCompletedAt(date('Y-m-d H:i:s'));
            }
            $mod->setStatus($data['status']);
        }

        if (array_key_exists('title', $data))               $mod->setTitle($data['title']);
        if (array_key_exists('description', $data))         $mod->setDescription($data['description']);
        if (array_key_exists('platform_id', $data))         $mod->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('shop_id', $data))             $mod->setShopId($data['shop_id'] ? (int)$data['shop_id'] : null);
        if (array_key_exists('mod_type', $data))            $mod->setModType($data['mod_type']);
        if (array_key_exists('priority', $data))            $mod->setPriority($data['priority']);
        if (array_key_exists('linked_def_id', $data))       $mod->setLinkedDefId($data['linked_def_id'] ? (int)$data['linked_def_id'] : null);
        if (array_key_exists('linked_req_id', $data))       $mod->setLinkedReqId($data['linked_req_id'] ? (int)$data['linked_req_id'] : null);
        if (array_key_exists('training_delta', $data))      $mod->setTrainingDelta($data['training_delta']);
        if (array_key_exists('impact_analysis_json', $data))$mod->setImpactAnalysisJson($data['impact_analysis_json'] ?: null);
        if (array_key_exists('start_date', $data))          $mod->setStartDate($data['start_date'] ?: null);
        if (array_key_exists('target_completion', $data))   $mod->setTargetCompletion($data['target_completion'] ?: null);
        if (array_key_exists('assigned_to', $data))         $mod->setAssignedTo($data['assigned_to']);
        if (array_key_exists('approver', $data))            $mod->setApprover($data['approver']);
        if (array_key_exists('est_parts_cost', $data))      $mod->setEstPartsCost((float)$data['est_parts_cost']);
        if (array_key_exists('est_labor_cost', $data))      $mod->setEstLaborCost((float)$data['est_labor_cost']);
        if (array_key_exists('est_contractor_cost', $data)) $mod->setEstContractorCost((float)$data['est_contractor_cost']);
        if (array_key_exists('actual_parts_cost', $data))      $mod->setActualPartsCost((float)$data['actual_parts_cost']);
        if (array_key_exists('actual_labor_cost', $data))      $mod->setActualLaborCost((float)$data['actual_labor_cost']);
        if (array_key_exists('actual_contractor_cost', $data)) $mod->setActualContractorCost((float)$data['actual_contractor_cost']);
        if (array_key_exists('completion_notes', $data))       $mod->setCompletionNotes($data['completion_notes']);
        if (array_key_exists('budget_status', $data))          $mod->setBudgetStatus($data['budget_status'] ?: 'unbudgeted');
        if (array_key_exists('budget_fiscal_year', $data))     $mod->setBudgetFiscalYear($data['budget_fiscal_year'] ? (int)$data['budget_fiscal_year'] : null);

        $mod->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($mod)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->assetMapper->deleteForMod($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Affected Assets ───────────────────────────────────────────

    /** @NoAdminRequired */
    public function addAsset(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $ma   = new ModAsset();
        $ma->setModId($id);
        $ma->setAssetId((int)($data['asset_id'] ?? 0));
        $ma->setAction($data['action'] ?? 'modify');
        $ma->setBeforeVersion($data['before_version'] ?: null);
        $ma->setAfterVersion($data['after_version'] ?: null);
        $ma->setNotes($data['notes'] ?? '');
        return new DataResponse($this->assetMapper->insert($ma)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateAsset(int $id, int $assetEntryId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $ma = $this->assetMapper->find($assetEntryId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('action', $data))         $ma->setAction($data['action']);
        if (array_key_exists('before_version', $data)) $ma->setBeforeVersion($data['before_version'] ?: null);
        if (array_key_exists('after_version', $data))  $ma->setAfterVersion($data['after_version'] ?: null);
        if (array_key_exists('notes', $data))          $ma->setNotes($data['notes']);
        return new DataResponse($this->assetMapper->update($ma)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function removeAsset(int $id, int $assetEntryId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->assetMapper->delete($this->assetMapper->find($assetEntryId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function buildModCode(?int $shopId): string {
        $seq = str_pad((string)$this->mapper->nextSequence($shopId), 3, '0', STR_PAD_LEFT);
        if ($shopId) {
            try {
                $shop = $this->shopMapper->find($shopId);
                return 'MOD-' . $shop->getCode() . '-' . $seq;
            } catch (\Throwable) {}
        }
        return 'MOD-' . $seq;
    }
}
