<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ReportDashboardMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_report_dashboards', ReportDashboard::class);
    }

    public function find(int $id): ReportDashboard {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ReportDashboard[] */
    public function findAccessible(string $userId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->orX(
               $qb->expr()->eq('created_by', $qb->createNamedParameter($userId)),
               $qb->expr()->eq('visibility', $qb->createNamedParameter('shared'))
           ))
           ->orderBy('updated_at', 'DESC');
        return $this->findEntities($qb);
    }
}
