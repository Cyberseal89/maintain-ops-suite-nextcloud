<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class TrainingRequirementMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_training_requirements', TrainingRequirement::class);
    }

    public function find(int $id): TrainingRequirement {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(?string $status = null, ?string $assignedTo = null, ?int $platformId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($status)     $qb->andWhere($qb->expr()->eq('status',      $qb->createNamedParameter($status)));
        if ($assignedTo) $qb->andWhere($qb->expr()->eq('assigned_to', $qb->createNamedParameter($assignedTo)));
        if ($platformId) $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        $qb->orderBy('required_by_date', 'ASC')->addOrderBy('status', 'ASC');
        return $this->findEntities($qb);
    }

    public function findBySource(string $sourceType, int $sourceId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('source_type', $qb->createNamedParameter($sourceType)))
           ->andWhere($qb->expr()->eq('source_id', $qb->createNamedParameter($sourceId, IQueryBuilder::PARAM_INT)))
           ->orderBy('status', 'ASC')->addOrderBy('required_by_date', 'ASC');
        return $this->findEntities($qb);
    }

    public function findByAssignee(string $uid): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('assigned_to', $qb->createNamedParameter($uid)))
           ->orderBy('required_by_date', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteBySource(string $sourceType, int $sourceId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('source_type', $qb->createNamedParameter($sourceType)))
           ->andWhere($qb->expr()->eq('source_id', $qb->createNamedParameter($sourceId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
