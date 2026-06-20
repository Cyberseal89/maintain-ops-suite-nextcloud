<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class PersonnelMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_personnel', Personnel::class);
    }

    public function find(int $id): Personnel {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return Personnel[] */
    public function findAll(?int $platformId = null, ?int $shopId = null, ?string $status = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        if ($shopId !== null) {
            $qb->andWhere($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        }
        if ($status !== null) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        $qb->orderBy('last_name', 'ASC')->addOrderBy('first_name', 'ASC');
        return $this->findEntities($qb);
    }
}
