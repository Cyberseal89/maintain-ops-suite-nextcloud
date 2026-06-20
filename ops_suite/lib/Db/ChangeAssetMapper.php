<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ChangeAssetMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_change_assets', ChangeAsset::class);
    }

    public function find(int $id): ChangeAsset {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ChangeAsset[] */
    public function findByChange(int $changeId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('change_id', $qb->createNamedParameter($changeId, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }

    public function deleteByChange(int $changeId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('change_id', $qb->createNamedParameter($changeId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
