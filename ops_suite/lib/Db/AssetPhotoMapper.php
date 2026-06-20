<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use OCP\AppFramework\Db\QBMapper;

class AssetPhotoMapper extends QBMapper {

    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_asset_photos', AssetPhoto::class);
    }

    public function find(int $id): AssetPhoto {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return AssetPhoto[] */
    public function findForAsset(int $assetId, ?string $photoType = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        if ($photoType !== null) {
            $qb->andWhere($qb->expr()->eq('photo_type', $qb->createNamedParameter($photoType)));
        }
        $qb->orderBy('is_primary', 'DESC')->addOrderBy('sort_order', 'ASC')->addOrderBy('created_at', 'DESC');
        return $this->findEntities($qb);
    }

    /** @return AssetPhoto[] */
    public function findForDeficiency(int $defId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('linked_def_id', $qb->createNamedParameter($defId, IQueryBuilder::PARAM_INT)))
           ->orderBy('created_at', 'DESC');
        return $this->findEntities($qb);
    }

    public function clearPrimary(int $assetId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->tableName)
           ->set('is_primary', $qb->createNamedParameter(0, IQueryBuilder::PARAM_INT))
           ->where($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
