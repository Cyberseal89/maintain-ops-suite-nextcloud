<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class RequirementMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_requirements', Requirement::class);
    }

    public function find(int $id): Requirement {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return Requirement[] */
    public function findAll(?int $assetId = null, ?string $reqType = null, ?string $status = null, ?int $modernizationId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($assetId !== null) {
            $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        }
        if ($reqType) {
            $qb->andWhere($qb->expr()->eq('req_type', $qb->createNamedParameter($reqType)));
        }
        if ($status) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        if ($modernizationId !== null) {
            $qb->andWhere($qb->expr()->eq('modernization_id', $qb->createNamedParameter($modernizationId, IQueryBuilder::PARAM_INT)));
        }
        $qb->orderBy('req_code', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return Requirement[] */
    public function findForAsset(int $assetId): array {
        return $this->findAll($assetId);
    }

    /** @return Requirement[] */
    public function findForModernization(int $modId): array {
        return $this->findAll(null, null, null, $modId);
    }

    public function nextSequence(int $assetId): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->where($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0) + 1;
    }
}
