<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Asset;
use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Db\AssetReadinessMapper;
use OCA\OpsSuite\Service\AssetCodeService;
use OCA\OpsSuite\Service\PermissionService;
use OCA\OpsSuite\Service\ReadinessService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class AssetController extends Controller {
    public function __construct(
        string                        $appName,
        IRequest                      $request,
        private readonly AssetMapper          $mapper,
        private readonly AssetReadinessMapper $readinessMapper,
        private readonly AssetCodeService     $codeService,
        private readonly ReadinessService     $readinessService,
        private readonly IUserSession         $userSession,
        private readonly PermissionService    $permission
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $type        = $this->request->getParam('type')     ?: null;
        $status      = $this->request->getParam('status')   ?: null;
        $shopId      = $this->request->getParam('shop_id')  ?: null;
        $parentId    = $this->request->getParam('parent_id');
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];

        $assets = $this->mapper->findAll($type, $status, $platformIds, $shopId ? (int)$shopId : null, $parentId !== null ? (int)$parentId : null);
        $assetIds = array_map(fn($a) => $a->getId(), $assets);
        $worstSev = $this->mapper->findWorstOpenSeverities($assetIds);
        return new DataResponse(array_map(function($a) use ($worstSev) {
            $row = $a->jsonSerialize();
            $row['worst_open_severity'] = $worstSev[$a->getId()] ?? null;
            return $row;
        }, $assets));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $asset = $this->mapper->find($id);
            $row = $asset->jsonSerialize();
            $sev = $this->mapper->findWorstOpenSeverities([$id]);
            $row['worst_open_severity'] = $sev[$id] ?? null;
            return new DataResponse($row);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /**
     * @NoAdminRequired
     * Idempotent: if local_uuid already exists, return the existing record (SYNC-006).
     */
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        // Idempotency: return existing record if local_uuid already persisted
        $localUuid = $data['local_uuid'] ?? null;
        if ($localUuid) {
            try {
                $existing = $this->mapper->findByLocalUuid($localUuid);
                return new DataResponse($existing->jsonSerialize(), Http::STATUS_OK);
            } catch (DoesNotExistException) {
                // Not found — proceed with creation
            }
        }

        $asset = new Asset();
        $asset->setName($data['name'] ?? '');
        $asset->setAssetType($data['asset_type'] ?? 'hardware');
        $asset->setManufacturer($data['manufacturer'] ?? '');
        $asset->setModel($data['model'] ?? '');
        $asset->setSerialNumber($data['serial_number'] ?? '');
        $asset->setVersion($data['version'] ?? '');
        $asset->setLocation($data['location'] ?? '');
        $asset->setIpAddress($data['ip_address'] ?? '');
        $asset->setInstallDate($data['install_date'] ?: null);
        $asset->setWarrantyExpiry($data['warranty_expiry'] ?: null);
        $asset->setStatus($data['status'] ?? 'operational');
        $asset->setNotes($data['notes'] ?? '');
        $asset->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $asset->setShopId(isset($data['shop_id']) && $data['shop_id'] ? (int)$data['shop_id'] : null);
        $asset->setParentId(isset($data['parent_id']) && $data['parent_id'] ? (int)$data['parent_id'] : null);
        $asset->setTags($data['tags'] ?? '');
        $asset->setLinkedAssets($data['linked_assets'] ?? '');
        $asset->setCriticalityCode($data['criticality_code'] ?? null);
        $asset->setBypassState(0);
        $asset->setRedundancyAvailable((int)($data['redundancy_available'] ?? 0));
        $asset->setBypassPossible((int)($data['bypass_possible'] ?? 0));
        $asset->setBypassMethod($data['bypass_method'] ?: null);
        $asset->setDegradedCapability(isset($data['degraded_capability']) && $data['degraded_capability'] !== '' ? (string)$data['degraded_capability'] : null);
        $asset->setDegradedNotes($data['degraded_notes'] ?: null);
        $asset->setFailoverAssetId(isset($data['failover_asset_id']) && $data['failover_asset_id'] ? (int)$data['failover_asset_id'] : null);
        $asset->setRedundancyType($data['redundancy_type'] ?: null);
        $asset->setFailoverTimeMins(isset($data['failover_time_mins']) && $data['failover_time_mins'] ? (int)$data['failover_time_mins'] : null);
        $asset->setFailoverProcedure($data['failover_procedure'] ?: null);
        $asset->setIsSystemNode((int)($data['is_system_node'] ?? 0));
        $asset->setSortOrder((int)($data['sort_order'] ?? 0));
        $asset->setLocalUuid($localUuid);

        // Auto-generate UII if not provided
        $uii = $data['uii'] ?? '';
        if (empty($uii)) {
            $cage   = strtoupper($data['cage_code'] ?? '');
            $serial = strtoupper($data['serial_number'] ?? '');
            $uii = (!empty($cage) && !empty($serial))
                ? '//' . $cage . '/' . $serial
                : '//ALTO/' . strtoupper(substr(bin2hex(random_bytes(8)), 0, 16));
        }
        $asset->setUii($uii);
        $asset->setCageCode($data['cage_code'] ?? '');
        $asset->setIuidCompliant((int)($data['iuid_compliant'] ?? 0));
        $asset->setCreatedBy($uid);
        $asset->setCreatedAt($now);
        $asset->setUpdatedAt($now);

        // Auto-generate asset code if shop is assigned
        $shopId   = $asset->getShopId();
        $parentId = $asset->getParentId();
        if ($shopId !== null) {
            $codes = $this->codeService->generate($asset->getAssetType(), $shopId, $parentId);
            $asset->setAssetCode($codes['asset_code']);
            $asset->setSystemPosition($codes['system_position']);
            $asset->setDepth($codes['depth']);
            $asset->setHierarchyPath($codes['hierarchy_path']);
        }

        $inserted = $this->mapper->insert($asset);

        // Seed initial readiness record if criticality is set
        if ($inserted->getCriticalityCode()) {
            try { $this->readinessService->recalculate($inserted->getId()); } catch (\Throwable) {}
        }

        return new DataResponse($inserted->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $asset = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        if (array_key_exists('name', $data))             $asset->setName($data['name']);
        if (array_key_exists('asset_type', $data))       $asset->setAssetType($data['asset_type']);
        if (array_key_exists('manufacturer', $data))     $asset->setManufacturer($data['manufacturer']);
        if (array_key_exists('model', $data))            $asset->setModel($data['model']);
        if (array_key_exists('serial_number', $data))    $asset->setSerialNumber($data['serial_number']);
        if (array_key_exists('version', $data))          $asset->setVersion($data['version']);
        if (array_key_exists('location', $data))         $asset->setLocation($data['location']);
        if (array_key_exists('ip_address', $data))       $asset->setIpAddress($data['ip_address']);
        if (array_key_exists('install_date', $data))     $asset->setInstallDate($data['install_date'] ?: null);
        if (array_key_exists('warranty_expiry', $data))  $asset->setWarrantyExpiry($data['warranty_expiry'] ?: null);
        if (array_key_exists('status', $data))           $asset->setStatus($data['status']);
        if (array_key_exists('notes', $data))            $asset->setNotes($data['notes']);
        if (array_key_exists('platform_id', $data))      $asset->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('shop_id', $data))          $asset->setShopId($data['shop_id'] ? (int)$data['shop_id'] : null);
        if (array_key_exists('parent_id', $data))        $asset->setParentId($data['parent_id'] ? (int)$data['parent_id'] : null);
        if (array_key_exists('tdp_source_asset_id', $data)) $asset->setTdpSourceAssetId($data['tdp_source_asset_id'] ? (int)$data['tdp_source_asset_id'] : null);
        if (array_key_exists('tags', $data))             $asset->setTags($data['tags']);
        if (array_key_exists('linked_assets', $data))    $asset->setLinkedAssets($data['linked_assets']);
        if (array_key_exists('criticality_code', $data))  $asset->setCriticalityCode($data['criticality_code'] ?: null);
        if (array_key_exists('redundancy_available', $data)) $asset->setRedundancyAvailable((int)$data['redundancy_available']);
        if (array_key_exists('bypass_possible', $data))    $asset->setBypassPossible((int)$data['bypass_possible']);
        if (array_key_exists('bypass_method', $data))      $asset->setBypassMethod($data['bypass_method'] ?: null);
        if (array_key_exists('degraded_capability', $data)) $asset->setDegradedCapability(($data['degraded_capability'] !== '' && $data['degraded_capability'] !== null) ? (string)$data['degraded_capability'] : null);
        if (array_key_exists('degraded_notes', $data))     $asset->setDegradedNotes($data['degraded_notes'] ?: null);
        if (array_key_exists('failover_asset_id', $data))  $asset->setFailoverAssetId($data['failover_asset_id'] ? (int)$data['failover_asset_id'] : null);
        if (array_key_exists('redundancy_type', $data))    $asset->setRedundancyType($data['redundancy_type'] ?: null);
        if (array_key_exists('failover_time_mins', $data)) $asset->setFailoverTimeMins($data['failover_time_mins'] ? (int)$data['failover_time_mins'] : null);
        if (array_key_exists('failover_procedure', $data)) $asset->setFailoverProcedure($data['failover_procedure'] ?: null);
        if (array_key_exists('is_system_node', $data))     $asset->setIsSystemNode((int)$data['is_system_node']);
        if (array_key_exists('sort_order', $data))         $asset->setSortOrder((int)$data['sort_order']);
        if (array_key_exists('uii', $data))                $asset->setUii($data['uii']);
        if (array_key_exists('cage_code', $data))        $asset->setCageCode($data['cage_code']);
        if (array_key_exists('iuid_compliant', $data))   $asset->setIuidCompliant((int)$data['iuid_compliant']);

        // Verify action
        if (!empty($data['verify'])) {
            $uid2 = $this->userSession->getUser()?->getUID() ?? '';
            $asset->setLastVerifiedAt(date('Y-m-d H:i:s'));
            $asset->setVerifiedBy($uid2);
        }

        $asset->setUpdatedAt(date('Y-m-d H:i:s'));
        $updated = $this->mapper->update($asset);

        // Recalculate readiness if criticality is set
        if ($updated->getCriticalityCode()) {
            try { $this->readinessService->recalculate($updated->getId()); } catch (\Throwable) {}
        }

        return new DataResponse($updated->jsonSerialize());
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

    /**
     * @NoAdminRequired
     * GET /api/assets/{id}/readiness
     */
    public function readiness(int $id): DataResponse {
        try {
            $this->mapper->find($id); // ensure asset exists
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        try {
            $r = $this->readinessMapper->findByAsset($id);
            return new DataResponse($r->jsonSerialize());
        } catch (DoesNotExistException) {
            // Calculate on first access
            try {
                $r = $this->readinessService->recalculate($id);
                return new DataResponse($r->jsonSerialize());
            } catch (\Throwable $e) {
                return new DataResponse(['message' => $e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
            }
        }
    }

    /**
     * @NoAdminRequired
     * PUT /api/assets/{id}/criticality
     */
    public function setCriticality(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $asset = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        $valid = ['CR', 'DE', 'RD', 'SP', 'AD', ''];
        $code  = strtoupper($data['criticality_code'] ?? '');
        if (!in_array($code, $valid, true)) {
            return new DataResponse(['message' => 'Invalid criticality code'], Http::STATUS_BAD_REQUEST);
        }

        $asset->setCriticalityCode($code ?: null);
        if (array_key_exists('bypass_state', $data)) {
            $asset->setBypassState((int)$data['bypass_state']);
        }
        if (array_key_exists('redundancy_available', $data)) {
            $asset->setRedundancyAvailable((int)$data['redundancy_available']);
        }
        $asset->setUpdatedAt(date('Y-m-d H:i:s'));
        $updated = $this->mapper->update($asset);

        // Always recalculate readiness when criticality changes
        try { $readiness = $this->readinessService->recalculate($id); } catch (\Throwable) { $readiness = null; }

        return new DataResponse([
            'asset'     => $updated->jsonSerialize(),
            'readiness' => $readiness?->jsonSerialize(),
        ]);
    }
}
