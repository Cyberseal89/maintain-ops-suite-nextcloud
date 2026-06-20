<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class FmeaWorksheetMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_fmea_worksheets', FmeaWorksheet::class);
    }

    public function find(int $id): FmeaWorksheet {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return FmeaWorksheet[] */
    public function findByCanvas(int $canvasId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('canvas_id', $qb->createNamedParameter($canvasId, IQueryBuilder::PARAM_INT)))
           ->orderBy('updated_at', 'DESC');
        return $this->findEntities($qb);
    }

    public function findByCanvasNode(int $canvasId, string $nodeId): ?FmeaWorksheet {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('canvas_id', $qb->createNamedParameter($canvasId, IQueryBuilder::PARAM_INT)))
           ->andWhere($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)));
        try {
            return $this->findEntity($qb);
        } catch (DoesNotExistException) {
            return null;
        }
    }

    /** @return FmeaWorksheet[] */
    public function findByAsset(int $assetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }
}
