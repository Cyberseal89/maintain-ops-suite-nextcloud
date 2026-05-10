<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Asset;
use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class AssetController extends Controller {
    public function __construct(
        string                    $appName,
        IRequest                  $request,
        private readonly AssetMapper        $mapper,
        private readonly IUserSession       $userSession,
        private readonly PermissionService  $permission
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $type   = $this->request->getParam('type')   ?: null;
        $status = $this->request->getParam('status') ?: null;
        $assets = $this->mapper->findAll($type, $status);
        return new DataResponse(array_map(fn($a) => $a->jsonSerialize(), $assets));
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
        $asset->setTags($data['tags'] ?? '');
        $asset->setLinkedAssets($data['linked_assets'] ?? '');
        $asset->setCreatedBy($uid);
        $asset->setCreatedAt($now);
        $asset->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($asset)->jsonSerialize(), Http::STATUS_CREATED);
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
        if (array_key_exists('name', $data))            $asset->setName($data['name']);
        if (array_key_exists('asset_type', $data))      $asset->setAssetType($data['asset_type']);
        if (array_key_exists('manufacturer', $data))    $asset->setManufacturer($data['manufacturer']);
        if (array_key_exists('model', $data))           $asset->setModel($data['model']);
        if (array_key_exists('serial_number', $data))   $asset->setSerialNumber($data['serial_number']);
        if (array_key_exists('version', $data))         $asset->setVersion($data['version']);
        if (array_key_exists('location', $data))        $asset->setLocation($data['location']);
        if (array_key_exists('ip_address', $data))      $asset->setIpAddress($data['ip_address']);
        if (array_key_exists('install_date', $data))    $asset->setInstallDate($data['install_date'] ?: null);
        if (array_key_exists('warranty_expiry', $data)) $asset->setWarrantyExpiry($data['warranty_expiry'] ?: null);
        if (array_key_exists('status', $data))          $asset->setStatus($data['status']);
        if (array_key_exists('notes', $data))           $asset->setNotes($data['notes']);
        if (array_key_exists('platform_id', $data))      $asset->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('tags', $data))            $asset->setTags($data['tags']);
        if (array_key_exists('linked_assets', $data))   $asset->setLinkedAssets($data['linked_assets']);
        $asset->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->mapper->update($asset)->jsonSerialize());
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
}
