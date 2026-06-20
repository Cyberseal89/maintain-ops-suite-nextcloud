<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Shop;
use OCA\OpsSuite\Db\ShopMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IDBConnection;
use OCP\IRequest;
use OCP\IUserSession;

class ShopController extends Controller {
    public function __construct(
        string                   $appName,
        IRequest                 $request,
        private readonly ShopMapper        $mapper,
        private readonly IUserSession      $userSession,
        private readonly PermissionService $permission,
        private readonly IDBConnection     $db,
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $platformId = $this->request->getParam('platform_id');
        $shops = $platformId
            ? $this->mapper->findAll((int)$platformId)
            : $this->mapper->findAll();
        return new DataResponse(array_map(fn($s) => $s->jsonSerialize(), $shops));
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

        // Normalize shop code: uppercase, strip spaces
        $code = strtoupper(trim($data['code'] ?? ''));
        if ($code === '') {
            return new DataResponse(['message' => 'Shop code is required'], Http::STATUS_BAD_REQUEST);
        }

        $shop = new Shop();
        $shop->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $shop->setName($data['name'] ?? '');
        $shop->setCode($code);
        $shop->setDiscipline($data['discipline'] ?? '');
        $shop->setDescription($data['description'] ?? '');
        $shop->setSupervisor($data['supervisor'] ?? '');
        $shop->setCreatedBy($uid);
        $shop->setCreatedAt($now);
        $shop->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($shop)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $shop = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        if (array_key_exists('name',        $data)) $shop->setName($data['name']);
        if (array_key_exists('discipline',  $data)) $shop->setDiscipline($data['discipline']);
        if (array_key_exists('description', $data)) $shop->setDescription($data['description']);
        if (array_key_exists('supervisor',  $data)) $shop->setSupervisor($data['supervisor']);
        if (array_key_exists('platform_id', $data)) $shop->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        // Code is immutable after creation — changing it would break all asset codes
        $shop->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->mapper->update($shop)->jsonSerialize());
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

    // ── Shop user assignments (Sprint 1B) ─────────────────────────────

    /** @NoAdminRequired */
    public function indexUsers(int $id): DataResponse {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id', 'user_uid', 'shop_id', 'created_at')
           ->from('ops_shop_users')
           ->where($qb->expr()->eq('shop_id', $qb->createNamedParameter($id, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)))
           ->orderBy('user_uid', 'ASC');
        $rows = $qb->executeQuery()->fetchAllAssociative();
        return new DataResponse($rows);
    }

    /** @NoAdminRequired */
    public function addUser(int $id): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $uid = $this->request->getParam('user_uid');
        if (!$uid) return new DataResponse(['message' => 'user_uid required'], Http::STATUS_BAD_REQUEST);

        $qb = $this->db->getQueryBuilder();
        $qb->insert('ops_shop_users')->values([
            'user_uid'   => $qb->createNamedParameter($uid),
            'shop_id'    => $qb->createNamedParameter($id, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT),
            'created_at' => $qb->createNamedParameter(date('Y-m-d H:i:s')),
        ]);
        try {
            $qb->executeStatement();
        } catch (\Throwable) {
            // Unique constraint — already assigned
        }
        return new DataResponse(['shop_id' => $id, 'user_uid' => $uid]);
    }

    /** @NoAdminRequired */
    public function removeUser(int $id, string $userId): DataResponse {
        if (!$this->permission->canAdmin()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $qb = $this->db->getQueryBuilder();
        $qb->delete('ops_shop_users')
           ->where($qb->expr()->eq('shop_id',  $qb->createNamedParameter($id, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)))
           ->andWhere($qb->expr()->eq('user_uid', $qb->createNamedParameter($userId)));
        $qb->executeStatement();
        return new DataResponse(['deleted' => $userId]);
    }
}
