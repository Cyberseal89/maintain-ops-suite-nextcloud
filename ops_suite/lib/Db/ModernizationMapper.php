<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ModernizationMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_modernizations', Modernization::class);
    }

    public function find(int $id): Modernization {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return Modernization[] */
    public function findAll(?string $status = null, ?int $platformId = null, ?string $assignedTo = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($status)     $qb->andWhere($qb->expr()->eq('status',      $qb->createNamedParameter($status)));
        if ($platformId) $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        if ($assignedTo) $qb->andWhere($qb->expr()->eq('assigned_to', $qb->createNamedParameter($assignedTo)));
        $qb->orderBy('updated_at', 'DESC');
        return $this->findEntities($qb);
    }

    public function findForPlatforms(array $platformIds): array {
        if (empty($platformIds)) return $this->findAll();
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->orX(
               $qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)),
               $qb->expr()->isNull('platform_id')
           ))
           ->orderBy('updated_at', 'DESC');
        return $this->findEntities($qb);
    }

    public function countByStage(array $platformIds = []): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('status', $qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->groupBy('status');
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['status']] = (int)$row['cnt']; }
        return $out;
    }

    public function nextSequence(?int $shopId): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName());
        if ($shopId) {
            $qb->where($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        }
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0) + 1;
    }
}
