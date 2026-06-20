<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ShopMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_shops', Shop::class);
    }

    public function find(int $id): Shop {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findByCode(string $code, ?int $platformId = null): Shop {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('code', $qb->createNamedParameter($code)));
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        return $this->findEntity($qb);
    }

    /** @return Shop[] */
    public function findAll(?int $platformId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($platformId !== null) {
            $qb->where($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        $qb->orderBy('code', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return Shop[] */
    public function findByPlatformIds(array $platformIds): array {
        if (empty($platformIds)) return [];
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)))
           ->orderBy('code', 'ASC');
        return $this->findEntities($qb);
    }
}
