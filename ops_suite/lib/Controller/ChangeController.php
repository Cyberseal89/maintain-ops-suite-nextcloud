<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\CanvasMapper;
use OCA\OpsSuite\Db\ChangeAsset;
use OCA\OpsSuite\Db\ChangeAssetMapper;
use OCA\OpsSuite\Db\ConfigChange;
use OCA\OpsSuite\Db\ConfigChangeMapper;
use OCA\OpsSuite\Db\MmbpBudgetMapper;
use OCA\OpsSuite\Db\ShopMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class ChangeController extends Controller {

    // Valid stage transitions
    private const TRANSITIONS = [
        'draft'           => ['impact_analysis', 'abandoned'],
        'impact_analysis' => ['ccb_review', 'draft', 'abandoned'],
        'ccb_review'      => ['approved', 'rejected', 'abandoned'],
        'approved'        => ['execution', 'abandoned'],
        'execution'       => ['verification', 'abandoned'],
        'verification'    => ['complete', 'execution'],
        'complete'        => [],
        'rejected'        => [],
        'abandoned'       => [],
    ];

    public function __construct(
        string                    $appName,
        IRequest                  $request,
        private readonly ConfigChangeMapper $mapper,
        private readonly ChangeAssetMapper  $assetMapper,
        private readonly ShopMapper         $shopMapper,
        private readonly MmbpBudgetMapper   $budgetMapper,
        private readonly CanvasMapper       $canvasMapper,
        private readonly PermissionService  $permission,
        private readonly IUserSession       $userSession,
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $platformId  = $this->request->getParam('platform_id')  ? (int)$this->request->getParam('platform_id')  : null;
        $shopId      = $this->request->getParam('shop_id')      ? (int)$this->request->getParam('shop_id')      : null;
        $stage       = $this->request->getParam('stage')        ?: null;
        $changeType  = $this->request->getParam('change_type')  ?: null;
        $rows = $this->mapper->findAll($platformId, $shopId, $stage, $changeType);
        return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $rows));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $change = $this->mapper->find($id);
            $assets = $this->assetMapper->findByChange($id);
            $data   = $change->jsonSerialize();
            $data['affected_assets'] = array_map(fn($a) => $a->jsonSerialize(), $assets);
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

        $shopId = isset($data['shop_id']) && $data['shop_id'] ? (int)$data['shop_id'] : null;
        $shopCode = 'GEN';
        if ($shopId) {
            try { $shopCode = $this->shopMapper->find($shopId)->getCode(); } catch (\Throwable) {}
        }

        $entry = new ConfigChange();
        $entry->setChangeCode($this->mapper->nextChangeCode($shopId ?? 0, $shopCode));
        $entry->setShopId($shopId);
        $entry->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $entry->setChangeType($data['change_type'] ?? 'modification');
        $entry->setTitle($data['title'] ?? '');
        $entry->setDescription($data['description'] ?? '');
        $entry->setInitiatorUid($uid);
        $entry->setStage('draft');
        $entry->setPriority($data['priority'] ?? 'routine');
        $entry->setEstimatedCost(isset($data['estimated_cost']) && $data['estimated_cost'] !== '' ? (float)$data['estimated_cost'] : null);
        $entry->setLinkedDefId(isset($data['linked_def_id']) && $data['linked_def_id'] ? (int)$data['linked_def_id'] : null);
        $entry->setLinkedReqId(isset($data['linked_req_id']) && $data['linked_req_id'] ? (int)$data['linked_req_id'] : null);
        $entry->setTrainingDelta($data['training_delta'] ?? null);
        $entry->setCreatedBy($uid);
        $entry->setCreatedAt($now);
        $entry->setUpdatedAt($now);

        $created = $this->mapper->insert($entry);
        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $entry = $this->mapper->find($id);
            $data  = $this->request->getParams();
            $now   = date('Y-m-d H:i:s');

            // Stage transition validation
            if (array_key_exists('stage', $data) && $data['stage'] !== $entry->getStage()) {
                $newStage = $data['stage'];
                $allowed  = self::TRANSITIONS[$entry->getStage()] ?? [];
                if (!in_array($newStage, $allowed, true)) {
                    return new DataResponse(
                        ['message' => "Cannot move from '{$entry->getStage()}' to '{$newStage}'"],
                        Http::STATUS_UNPROCESSABLE_ENTITY
                    );
                }
                // CCB gate: advancing to 'approved' requires a budget entry for this platform/FY
                if ($newStage === 'approved' && $entry->getPlatformId()) {
                    $fiscalYear = (int)date('Y');
                    $budgetEntries = $this->budgetMapper->findForPlatformYear($entry->getPlatformId(), $fiscalYear);
                    $platEntry = null;
                    foreach ($budgetEntries as $be) {
                        if ($be->getEntryType() === 'platform') { $platEntry = $be; break; }
                    }
                    $estimatedCost = $entry->getEstimatedCost() ?? 0;
                    if ($estimatedCost > 0 && $platEntry === null) {
                        return new DataResponse(
                            ['message' => 'CCB approval blocked: no platform budget authority found for this platform/FY. Set budget authority first.'],
                            Http::STATUS_PAYMENT_REQUIRED
                        );
                    }
                    if ($platEntry && $estimatedCost > (float)$platEntry->getTotalAuthorized()) {
                        return new DataResponse(
                            ['message' => sprintf('CCB approval blocked: estimated cost $%.2f exceeds platform authority of $%.2f.', $estimatedCost, (float)$platEntry->getTotalAuthorized())],
                            Http::STATUS_PAYMENT_REQUIRED
                        );
                    }
                }
                $entry->setStage($newStage);
                // Stamp approval / completion timestamps
                $uid = $this->userSession->getUser()?->getUID() ?? '';
                if ($newStage === 'approved') {
                    $entry->setApprovedBy($uid);
                    $entry->setApprovedAt($now);
                    // Flag canvases linked to affected assets as revision-required
                    $affected = $this->assetMapper->findByChange($id);
                    $assetIds = array_filter(array_map(fn($a) => $a->getAssetId(), $affected));
                    if (!empty($assetIds)) {
                        $this->canvasMapper->flagRevisionRequiredForAssets(array_values($assetIds));
                    }
                }
                if ($newStage === 'complete') {
                    $entry->setCompletedAt($now);
                }
            }

            if (array_key_exists('title',          $data)) $entry->setTitle($data['title']);
            if (array_key_exists('description',    $data)) $entry->setDescription($data['description'] ?? '');
            if (array_key_exists('change_type',    $data)) $entry->setChangeType($data['change_type']);
            if (array_key_exists('priority',       $data)) $entry->setPriority($data['priority']);
            if (array_key_exists('estimated_cost', $data)) $entry->setEstimatedCost($data['estimated_cost'] !== '' && $data['estimated_cost'] !== null ? (float)$data['estimated_cost'] : null);
            if (array_key_exists('actual_cost',    $data)) $entry->setActualCost($data['actual_cost'] !== '' && $data['actual_cost'] !== null ? (float)$data['actual_cost'] : null);
            if (array_key_exists('training_delta', $data)) $entry->setTrainingDelta($data['training_delta'] ?: null);
            if (array_key_exists('impact_analysis_json', $data)) $entry->setImpactAnalysisJson($data['impact_analysis_json'] ?: null);
            if (array_key_exists('linked_def_id',  $data)) $entry->setLinkedDefId($data['linked_def_id'] ? (int)$data['linked_def_id'] : null);
            if (array_key_exists('linked_req_id',  $data)) $entry->setLinkedReqId($data['linked_req_id'] ? (int)$data['linked_req_id'] : null);
            $entry->setUpdatedAt($now);

            return new DataResponse($this->mapper->update($entry)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->assetMapper->deleteByChange($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Affected assets sub-resource ──────────────────────────────────

    /** @NoAdminRequired */
    public function addAsset(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $ca = new ChangeAsset();
        $ca->setChangeId($id);
        $ca->setAssetId((int)($data['asset_id'] ?? 0));
        $ca->setAction($data['action'] ?? 'modify');
        $ca->setBeforeVersion($data['before_version'] ?: null);
        $ca->setAfterVersion($data['after_version'] ?: null);
        $ca->setNotes($data['notes'] ?: null);
        return new DataResponse($this->assetMapper->insert($ca)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateAsset(int $id, int $assetEntryId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $ca   = $this->assetMapper->find($assetEntryId);
            $data = $this->request->getParams();
            if (array_key_exists('action',         $data)) $ca->setAction($data['action']);
            if (array_key_exists('before_version', $data)) $ca->setBeforeVersion($data['before_version'] ?: null);
            if (array_key_exists('after_version',  $data)) $ca->setAfterVersion($data['after_version'] ?: null);
            if (array_key_exists('notes',          $data)) $ca->setNotes($data['notes'] ?: null);
            return new DataResponse($this->assetMapper->update($ca)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function removeAsset(int $id, int $assetEntryId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->assetMapper->delete($this->assetMapper->find($assetEntryId));
            return new DataResponse(['deleted' => $assetEntryId]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
