<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class MmbpLineMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_mmbp_lines', MmbpLine::class);
    }

    public function find(int $id): MmbpLine {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return MmbpLine[] */
    public function findByBudget(int $budgetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('budget_id', $qb->createNamedParameter($budgetId, IQueryBuilder::PARAM_INT)))
           ->orderBy('line_type', 'ASC')->addOrderBy('id', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteByBudget(int $budgetId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('budget_id', $qb->createNamedParameter($budgetId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
