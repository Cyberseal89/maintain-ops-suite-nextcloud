<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ProjectItemMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_project_items', ProjectItem::class);
    }

    public function find(int $id): ProjectItem {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findForProject(int $projectId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('project_id', $qb->createNamedParameter($projectId, IQueryBuilder::PARAM_INT)))
           ->orderBy('sequence', 'ASC')
           ->addOrderBy('planned_start', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteForProject(int $projectId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('project_id', $qb->createNamedParameter($projectId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
