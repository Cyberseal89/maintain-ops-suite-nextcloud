<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class EnergySourceMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_energy_sources', EnergySource::class);
    }

    public function find(int $id): EnergySource {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return EnergySource[] */
    public function findAll(?int $assetId = null, ?string $sourceType = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($assetId !== null) {
            $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        }
        if ($sourceType !== null) {
            $qb->andWhere($qb->expr()->eq('source_type', $qb->createNamedParameter($sourceType)));
        }
        $qb->orderBy('source_type', 'ASC')->addOrderBy('name', 'ASC');
        return $this->findEntities($qb);
    }
}
