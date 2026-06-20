<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use OCP\AppFramework\Db\QBMapper;

class AssetModelMapper extends QBMapper {

    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_3d_models', AssetModel::class);
    }

    public function find(int $id): AssetModel {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return AssetModel[] */
    public function findForAsset(int $assetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('m.*')->from($this->tableName, 'm')
           ->where($qb->expr()->eq('m.asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)))
           ->orderBy('m.created_at', 'DESC');
        return $this->findEntities($qb);
    }

    /** @return AssetModel[] Find models via document registry (cross-asset type sharing) */
    public function findForAssetViaDoc(int $assetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('m.*')->from($this->tableName, 'm')
           ->innerJoin('m', 'ops_documents', 'd', $qb->expr()->eq('m.document_id', 'd.id'))
           ->where($qb->expr()->orX(
               $qb->expr()->eq('m.asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)),
               $qb->expr()->eq('d.asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT))
           ))
           ->orderBy('m.created_at', 'DESC');
        return $this->findEntities($qb);
    }
}
