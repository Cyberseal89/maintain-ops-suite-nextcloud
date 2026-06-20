<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\AssetPhoto;
use OCA\OpsSuite\Db\AssetPhotoMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class PhotoController extends Controller {

    public function __construct(
        string                    $appName,
        IRequest                  $request,
        private readonly AssetPhotoMapper  $mapper,
        private readonly PermissionService $permission,
        private readonly IUserSession      $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(int $assetId): DataResponse {
        $type = $this->request->getParam('photo_type') ?: null;
        return new DataResponse(array_map(
            fn($p) => $p->jsonSerialize(),
            $this->mapper->findForAsset($assetId, $type)
        ));
    }

    /** @NoAdminRequired */
    public function create(int $assetId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';

        if (empty($d['file_path'])) {
            return new DataResponse(['message' => 'file_path is required'], Http::STATUS_BAD_REQUEST);
        }

        $p = new AssetPhoto();
        $p->setAssetId($assetId);
        $p->setPhotoType($d['photo_type'] ?? 'condition');
        $p->setLinkedDefId(isset($d['linked_def_id']) && $d['linked_def_id'] ? (int)$d['linked_def_id'] : null);
        $p->setLinkedPmId(isset($d['linked_pm_id'])  && $d['linked_pm_id']  ? (int)$d['linked_pm_id']  : null);
        $p->setLinkedChgId(isset($d['linked_chg_id']) && $d['linked_chg_id'] ? (int)$d['linked_chg_id'] : null);
        $p->setFilePath($d['file_path']);
        $p->setThumbnailPath($d['thumbnail_path'] ?: null);
        $p->setCaption($d['caption'] ?: null);
        $p->setSortOrder((int)($d['sort_order'] ?? 0));
        $p->setTakenAt($d['taken_at'] ?: null);
        $p->setTakenBy($uid);
        $p->setLocationLat(isset($d['location_lat']) && $d['location_lat'] !== '' ? $d['location_lat'] : null);
        $p->setLocationLng(isset($d['location_lng']) && $d['location_lng'] !== '' ? $d['location_lng'] : null);
        $p->setCreatedAt($now);

        // If marked primary, clear other primary flags first
        $isPrimary = !empty($d['is_primary']);
        if ($isPrimary) {
            $this->mapper->clearPrimary($assetId);
        }
        $p->setIsPrimary($isPrimary ? 1 : 0);

        return new DataResponse($this->mapper->insert($p)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $assetId, int $photoId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $p = $this->mapper->find($photoId); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $d = $this->request->getParams();
        if (array_key_exists('photo_type', $d)) $p->setPhotoType($d['photo_type']);
        if (array_key_exists('caption',    $d)) $p->setCaption($d['caption'] ?: null);
        if (array_key_exists('sort_order', $d)) $p->setSortOrder((int)$d['sort_order']);

        if (!empty($d['is_primary'])) {
            $this->mapper->clearPrimary($assetId);
            $p->setIsPrimary(1);
        }

        return new DataResponse($this->mapper->update($p)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $assetId, int $photoId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->mapper->delete($this->mapper->find($photoId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
