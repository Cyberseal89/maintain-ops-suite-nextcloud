<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\PlatformMapper;
use OCA\OpsSuite\Db\Platform;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class PlatformController extends Controller {
    public function __construct(
        string                  $appName,
        IRequest                $request,
        private readonly PlatformMapper     $mapper,
        private readonly PermissionService  $permission,
        private readonly IUserSession       $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $user = $this->userSession->getUser();
        $uid  = $user ? $user->getUID() : '';
        // Writers/admins see all platforms, others see only their assigned ones
        if ($this->permission->canWrite()) {
            $platforms = $this->mapper->findAll();
        } else {
            $platforms = $this->mapper->findForUser($uid);
        }
        return new DataResponse(array_map(fn($p) => $p->jsonSerialize(), $platforms));
    }

    /** @NoAdminRequired */
    public function myPlatforms(): DataResponse {
        $uid = trim($this->request->getParam('uid') ?: '');
        if (!$uid) {
            $user = $this->userSession->getUser();
            $uid  = $user ? $user->getUID() : '';
        }
        $platforms = $this->mapper->findForUser($uid);
        return new DataResponse(array_map(fn($p) => $p->jsonSerialize(), $platforms));
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
        $user = $this->userSession->getUser();
        $uid  = $user ? $user->getUID() : '';

        $platform = new Platform();
        $platform->setName($data['name'] ?? '');
        $platform->setDescription($data['description'] ?? '');
        $platform->setLocation($data['location'] ?? '');
        $platform->setGroupName($data['group_name'] ?? '');
        $platform->setCreatedBy($uid);
        $platform->setCreatedAt($now);
        $platform->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($platform)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $platform = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('name', $data))        $platform->setName($data['name']);
        if (array_key_exists('description', $data)) $platform->setDescription($data['description']);
        if (array_key_exists('location', $data))    $platform->setLocation($data['location']);
        if (array_key_exists('group_name', $data))  $platform->setGroupName($data['group_name']);
        $platform->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($platform)->jsonSerialize());
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
