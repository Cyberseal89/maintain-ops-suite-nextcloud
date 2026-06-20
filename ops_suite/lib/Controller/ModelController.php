<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\AssetModel;
use OCA\OpsSuite\Db\AssetModelMapper;
use OCA\OpsSuite\Db\ModelHotspot;
use OCA\OpsSuite\Db\ModelHotspotMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class ModelController extends Controller {

    public function __construct(
        string                      $appName,
        IRequest                    $request,
        private readonly AssetModelMapper   $modelMapper,
        private readonly ModelHotspotMapper $hotspotMapper,
        private readonly PermissionService  $permission,
        private readonly IUserSession       $userSession
    ) {
        parent::__construct($appName, $request);
    }

    // ── 3D Model endpoints ────────────────────────────────────────────

    /** @NoAdminRequired */
    public function index(int $assetId): DataResponse {
        $models = $this->modelMapper->findForAssetViaDoc($assetId);
        return new DataResponse(array_map(fn($m) => array_merge(
            $m->jsonSerialize(),
            ['hotspots' => array_map(fn($h) => $h->jsonSerialize(), $this->hotspotMapper->findForModel($m->getId()))]
        ), $models));
    }

    /** @NoAdminRequired */
    public function show(int $assetId, int $modelId): DataResponse {
        try {
            $m = $this->modelMapper->find($modelId);
            $data = $m->jsonSerialize();
            $data['hotspots'] = array_map(fn($h) => $h->jsonSerialize(), $this->hotspotMapper->findForModel($modelId));
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function create(int $assetId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';

        if (empty($d['source_file_path'])) {
            return new DataResponse(['message' => 'source_file_path is required'], Http::STATUS_BAD_REQUEST);
        }

        $format = strtoupper($d['source_format'] ?? 'GLTF');
        $isGltf = in_array($format, ['GLTF', 'GLB']);

        $m = new AssetModel();
        $m->setDocumentId(isset($d['document_id']) && $d['document_id'] ? (int)$d['document_id'] : 0);
        $m->setAssetId($assetId);
        $m->setSourceFormat($format);
        $m->setSourceFilePath($d['source_file_path']);
        // If already GLTF/GLB, gltf_file_path = source; otherwise pending conversion
        $m->setGltfFilePath($isGltf ? $d['source_file_path'] : null);
        $m->setConversionStatus($isGltf ? 'ready' : 'pending');
        $m->setModelVersion($d['model_version'] ?? 'v1.0');
        $m->setDescription($d['description'] ?: null);
        $m->setCreatedBy($uid);
        $m->setCreatedAt($now);
        $m->setUpdatedAt($now);

        return new DataResponse($this->modelMapper->insert($m)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $assetId, int $modelId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $m = $this->modelMapper->find($modelId); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $d = $this->request->getParams();
        if (array_key_exists('description',   $d)) $m->setDescription($d['description'] ?: null);
        if (array_key_exists('model_version',  $d)) $m->setModelVersion($d['model_version'] ?: 'v1.0');
        if (array_key_exists('gltf_file_path', $d)) $m->setGltfFilePath($d['gltf_file_path'] ?: null);
        if (array_key_exists('conversion_status', $d)) $m->setConversionStatus($d['conversion_status']);
        $m->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->modelMapper->update($m)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $assetId, int $modelId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->modelMapper->delete($this->modelMapper->find($modelId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Hotspot endpoints ─────────────────────────────────────────────

    /** @NoAdminRequired */
    public function addHotspot(int $assetId, int $modelId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');

        $h = new ModelHotspot();
        $h->setModelId($modelId);
        $h->setLabel($d['label'] ?? 'Hotspot');
        $h->setPositionX((string)($d['position_x'] ?? 0));
        $h->setPositionY((string)($d['position_y'] ?? 0));
        $h->setPositionZ((string)($d['position_z'] ?? 0));
        $h->setLinkedType($d['linked_type'] ?: null);
        $h->setLinkedId(isset($d['linked_id']) && $d['linked_id'] ? (int)$d['linked_id'] : null);
        $h->setHotspotColor($d['hotspot_color'] ?: '#38bdf8');
        $h->setNotes($d['notes'] ?: null);
        $h->setCreatedAt($now);

        return new DataResponse($this->hotspotMapper->insert($h)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateHotspot(int $assetId, int $modelId, int $hotspotId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $h = $this->hotspotMapper->find($hotspotId); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $d = $this->request->getParams();
        if (array_key_exists('label',        $d)) $h->setLabel($d['label']);
        if (array_key_exists('position_x',   $d)) $h->setPositionX((string)$d['position_x']);
        if (array_key_exists('position_y',   $d)) $h->setPositionY((string)$d['position_y']);
        if (array_key_exists('position_z',   $d)) $h->setPositionZ((string)$d['position_z']);
        if (array_key_exists('linked_type',  $d)) $h->setLinkedType($d['linked_type'] ?: null);
        if (array_key_exists('linked_id',    $d)) $h->setLinkedId($d['linked_id'] ? (int)$d['linked_id'] : null);
        if (array_key_exists('hotspot_color',$d)) $h->setHotspotColor($d['hotspot_color'] ?: '#38bdf8');
        if (array_key_exists('notes',        $d)) $h->setNotes($d['notes'] ?: null);

        return new DataResponse($this->hotspotMapper->update($h)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function deleteHotspot(int $assetId, int $modelId, int $hotspotId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->hotspotMapper->delete($this->hotspotMapper->find($hotspotId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
