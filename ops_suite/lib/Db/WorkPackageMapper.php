<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class WorkPackageMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_work_packages', WorkPackage::class);
    }

    public function find(int $id): WorkPackage {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(?string $status = null, array $platformIds = []): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($status) $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $qb->orderBy('updated_at', 'DESC');
        return $this->findEntities($qb);
    }
}
