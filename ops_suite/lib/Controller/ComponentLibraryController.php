<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\ComponentLibraryItem;
use OCA\OpsSuite\Db\ComponentLibraryMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class ComponentLibraryController extends Controller {

    public function __construct(
        string                              $appName,
        IRequest                            $request,
        private readonly ComponentLibraryMapper  $mapper,
        private readonly PermissionService       $permission
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $category = $this->request->getParam('category') ?: null;
        $items = $this->mapper->findAll($category);
        return new DataResponse(array_map(fn($i) => $i->jsonSerialize(), $items));
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
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        $item = new ComponentLibraryItem();
        $item->setName($data['name'] ?? '');
        $item->setCategory($data['category'] ?? 'custom');
        $item->setManufacturer($data['manufacturer'] ?? null);
        $item->setModelNumber($data['model_number'] ?? null);
        $item->setAssetType($data['asset_type'] ?? 'hardware');
        $item->setDefaultCriticality($data['default_criticality'] ?? null);
        $item->setNsn($data['nsn'] ?? null);
        $item->setCageCode($data['cage_code'] ?? null);
        $item->setInterfaceTemplates(isset($data['interface_templates']) ? json_encode($data['interface_templates']) : null);
        $item->setPmTemplates(isset($data['pm_templates']) ? json_encode($data['pm_templates']) : null);
        $item->setSpecs(isset($data['specs']) ? json_encode($data['specs']) : null);
        $item->setIconSvg($data['icon_svg'] ?? null);
        $item->setCreatedAt($now);
        $item->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($item)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $item = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();

        if (array_key_exists('name', $data))                $item->setName($data['name']);
        if (array_key_exists('category', $data))            $item->setCategory($data['category']);
        if (array_key_exists('manufacturer', $data))        $item->setManufacturer($data['manufacturer'] ?: null);
        if (array_key_exists('model_number', $data))        $item->setModelNumber($data['model_number'] ?: null);
        if (array_key_exists('asset_type', $data))          $item->setAssetType($data['asset_type']);
        if (array_key_exists('default_criticality', $data)) $item->setDefaultCriticality($data['default_criticality'] ?: null);
        if (array_key_exists('nsn', $data))                 $item->setNsn($data['nsn'] ?: null);
        if (array_key_exists('cage_code', $data))           $item->setCageCode($data['cage_code'] ?: null);
        if (array_key_exists('interface_templates', $data)) $item->setInterfaceTemplates($data['interface_templates'] ? json_encode($data['interface_templates']) : null);
        if (array_key_exists('pm_templates', $data))        $item->setPmTemplates($data['pm_templates'] ? json_encode($data['pm_templates']) : null);
        if (array_key_exists('specs', $data))               $item->setSpecs($data['specs'] ? json_encode($data['specs']) : null);
        if (array_key_exists('icon_svg', $data))            $item->setIconSvg($data['icon_svg'] ?: null);

        $item->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($item)->jsonSerialize());
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
