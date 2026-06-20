<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ManpowerRequirementMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_manpower_requirements', ManpowerRequirement::class);
    }

    public function find(int $id): ManpowerRequirement {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ManpowerRequirement[] */
    public function findAll(?string $sourceType = null, ?int $sourceId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($sourceType !== null) {
            $qb->andWhere($qb->expr()->eq('source_type', $qb->createNamedParameter($sourceType)));
        }
        if ($sourceId !== null) {
            $qb->andWhere($qb->expr()->eq('source_id', $qb->createNamedParameter($sourceId, IQueryBuilder::PARAM_INT)));
        }
        $qb->orderBy('id', 'ASC');
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
