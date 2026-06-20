<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class CanvasMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_canvases', Canvas::class);
    }

    public function find(int $id): Canvas {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return Canvas[] */
    public function findAll(?int $platformId = null, ?string $canvasType = null, ?int $shopId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        if ($shopId !== null) {
            $qb->andWhere($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        }
        if ($canvasType !== null) {
            $qb->andWhere($qb->expr()->eq('canvas_type', $qb->createNamedParameter($canvasType)));
        }
        $qb->orderBy('name', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return Canvas[] */
    public function findForAsset(int $assetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('system_asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }

    /**
     * Flag all canvases whose system_asset_id is in $assetIds as revision_required.
     * Called when a Config Change reaches 'approved' stage.
     */
    public function flagRevisionRequiredForAssets(array $assetIds): void {
        if (empty($assetIds)) return;
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->getTableName())
           ->set('revision_required', $qb->createNamedParameter(true, IQueryBuilder::PARAM_BOOL))
           ->where($qb->expr()->in('system_asset_id', $qb->createNamedParameter($assetIds, IQueryBuilder::PARAM_INT_ARRAY)));
        $qb->executeStatement();
    }
}
