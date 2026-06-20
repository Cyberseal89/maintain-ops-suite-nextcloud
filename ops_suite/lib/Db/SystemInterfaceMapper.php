<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class SystemInterfaceMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_interfaces', SystemInterface::class);
    }

    public function find(int $id): SystemInterface {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return SystemInterface[] */
    public function findAll(?string $interfaceType = null, ?string $status = null, ?int $modernizationId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($interfaceType) {
            $qb->andWhere($qb->expr()->eq('interface_type', $qb->createNamedParameter($interfaceType)));
        }
        if ($status) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        if ($modernizationId !== null) {
            $qb->andWhere($qb->expr()->eq('modernization_id', $qb->createNamedParameter($modernizationId, IQueryBuilder::PARAM_INT)));
        }
        $qb->orderBy('interface_code', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return SystemInterface[] */
    public function findForModernization(int $modId): array {
        return $this->findAll(null, null, $modId);
    }

    /** All interfaces involving a given asset (as source or destination) */
    public function findForAsset(int $assetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where(
               $qb->expr()->orX(
                   $qb->expr()->eq('from_asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)),
                   $qb->expr()->eq('to_asset_id',   $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT))
               )
           )
           ->orderBy('interface_code', 'ASC');
        return $this->findEntities($qb);
    }

    public function nextSequence(int $fromAssetId): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->where($qb->expr()->eq('from_asset_id', $qb->createNamedParameter($fromAssetId, IQueryBuilder::PARAM_INT)));
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0) + 1;
    }
}
