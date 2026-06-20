<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class AssetReadinessMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_asset_readiness', AssetReadiness::class);
    }

    public function findByAsset(int $assetId): AssetReadiness {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return AssetReadiness[] */
    public function findByShop(int $shopId, AssetMapper $assetMapper): array {
        // Join via asset_id → ops_assets.shop_id
        $qb = $this->db->getQueryBuilder();
        $qb->select('r.*')
           ->from($this->getTableName(), 'r')
           ->innerJoin('r', 'ops_assets', 'a', $qb->expr()->eq('r.asset_id', 'a.id'))
           ->where($qb->expr()->eq('a.shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }

    /** Count assets by readiness_code for a set of asset IDs */
    public function countByCode(array $assetIds): array {
        if (empty($assetIds)) return [];
        $qb = $this->db->getQueryBuilder();
        $qb->select('readiness_code', $qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->where($qb->expr()->in('asset_id', $qb->createNamedParameter($assetIds, IQueryBuilder::PARAM_INT_ARRAY)))
           ->groupBy('readiness_code');
        $r    = $qb->executeQuery();
        $rows = $r->fetchAll();
        $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['readiness_code']] = (int)$row['cnt']; }
        return $out;
    }
}
