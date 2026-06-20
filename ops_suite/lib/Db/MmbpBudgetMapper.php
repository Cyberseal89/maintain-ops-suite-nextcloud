<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class MmbpBudgetMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_mmbp_budget', MmbpBudget::class);
    }

    public function find(int $id): MmbpBudget {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return MmbpBudget[] */
    public function findAll(?int $platformId = null, ?int $shopId = null, ?int $fiscalYear = null, ?string $entryType = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        if ($shopId !== null) {
            $qb->andWhere($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        }
        if ($fiscalYear !== null) {
            $qb->andWhere($qb->expr()->eq('fiscal_year', $qb->createNamedParameter($fiscalYear, IQueryBuilder::PARAM_INT)));
        }
        if ($entryType !== null) {
            $qb->andWhere($qb->expr()->eq('entry_type', $qb->createNamedParameter($entryType)));
        }
        $qb->orderBy('fiscal_year', 'DESC')->addOrderBy('entry_type', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return MmbpBudget[] */
    public function findForPlatformYear(int $platformId, int $fiscalYear): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)))
           ->andWhere($qb->expr()->eq('fiscal_year', $qb->createNamedParameter($fiscalYear, IQueryBuilder::PARAM_INT)))
           ->orderBy('entry_type', 'ASC');
        return $this->findEntities($qb);
    }
}
