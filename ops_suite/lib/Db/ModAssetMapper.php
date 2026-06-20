<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ModAssetMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_mod_assets', ModAsset::class);
    }

    public function find(int $id): ModAsset {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ModAsset[] */
    public function findForMod(int $modId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('mod_id', $qb->createNamedParameter($modId, IQueryBuilder::PARAM_INT)))
           ->orderBy('id', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteForMod(int $modId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('mod_id', $qb->createNamedParameter($modId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
