<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ReportWidgetMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_report_widgets', ReportWidget::class);
    }

    public function find(int $id): ReportWidget {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ReportWidget[] */
    public function findByDashboard(int $dashboardId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('dashboard_id', $qb->createNamedParameter($dashboardId, IQueryBuilder::PARAM_INT)))
           ->orderBy('pos_y')->addOrderBy('pos_x');
        return $this->findEntities($qb);
    }

    public function deleteByDashboard(int $dashboardId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('dashboard_id', $qb->createNamedParameter($dashboardId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
