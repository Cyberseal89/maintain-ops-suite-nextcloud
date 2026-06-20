<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use OCP\AppFramework\Db\QBMapper;

class ModelHotspotMapper extends QBMapper {

    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_model_hotspots', ModelHotspot::class);
    }

    public function find(int $id): ModelHotspot {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ModelHotspot[] */
    public function findForModel(int $modelId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('model_id', $qb->createNamedParameter($modelId, IQueryBuilder::PARAM_INT)))
           ->orderBy('created_at', 'ASC');
        return $this->findEntities($qb);
    }
}
