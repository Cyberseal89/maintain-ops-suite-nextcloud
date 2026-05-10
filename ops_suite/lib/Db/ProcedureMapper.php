<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ProcedureMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_procedures', Procedure::class);
    }

    private function getAssetIdsForPlatforms(array $platformIds): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id')->from('ops_assets')
           ->where($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
        $r = $qb->executeQuery();
        $ids = array_column($r->fetchAll(), 'id');
        $r->closeCursor();
        return array_map('intval', $ids);
    }

    private function addPlatformFilter(\OCP\DB\QueryBuilder\IQueryBuilder $qb, array $platformIds): void {
        if (empty($platformIds)) return;
        $assetIds = $this->getAssetIdsForPlatforms($platformIds);
        if (empty($assetIds)) {
            $qb->andWhere('1=0'); // no assets = no results
            return;
        }
        $qb->andWhere($qb->expr()->in('asset_id', $qb->createNamedParameter($assetIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
    }

    public function find(int $id): Procedure {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(?int $assetId = null, bool $overdueOnly = false, ?string $assignedTo = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($assetId !== null) {
            $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        }
        if ($overdueOnly) {
            $qb->andWhere($qb->expr()->lt('next_due', $qb->createNamedParameter(date('Y-m-d'))));
        }
        if ($assignedTo !== null) {
            $qb->andWhere($qb->expr()->eq('assigned_to', $qb->createNamedParameter($assignedTo)));
        }
        $qb->orderBy('next_due', 'ASC');
        return $this->findEntities($qb);
    }

    public function countAll(array $platformIds = []): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName());
        $this->addPlatformFilter($qb, $platformIds);
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function countOverdue(array $platformIds = []): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->lt('next_due', $qb->createNamedParameter(date('Y-m-d'))));
        $this->addPlatformFilter($qb, $platformIds);
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function countDueThisWeek(array $platformIds = []): int {
        $qb = $this->db->getQueryBuilder();
        $soon = date('Y-m-d', strtotime('+7 days'));
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->lte('next_due', $qb->createNamedParameter($soon)))
           ->andWhere($qb->expr()->gte('next_due', $qb->createNamedParameter(date('Y-m-d'))));
        $this->addPlatformFilter($qb, $platformIds);
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function countCompletedLast30Days(array $platformIds = []): int {
        $qb = $this->db->getQueryBuilder();
        $since = date('Y-m-d', strtotime('-30 days'));
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->gte('last_completed', $qb->createNamedParameter($since)));
        $this->addPlatformFilter($qb, $platformIds);
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    /** @return Procedure[] */
    public function findOverdue(int $limit = 10, array $platformIds = []): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select($this->getTableName().'.*')->from($this->getTableName())
           ->where($qb->expr()->lt('next_due', $qb->createNamedParameter(date('Y-m-d'))))
           ->orderBy('next_due', 'ASC')
           ->setMaxResults($limit);
        $this->addPlatformFilter($qb, $platformIds);
        return $this->findEntities($qb);
    }

    public function countAssignedTo(string $user): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->eq('assigned_to', $qb->createNamedParameter($user)));
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function countOverdueAssignedTo(string $user): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->eq('assigned_to', $qb->createNamedParameter($user)))
           ->andWhere($qb->expr()->lt('next_due', $qb->createNamedParameter(date('Y-m-d'))));
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function findOverdueAssignedTo(string $user, int $limit = 10): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('assigned_to', $qb->createNamedParameter($user)))
           ->andWhere($qb->expr()->lt('next_due', $qb->createNamedParameter(date('Y-m-d'))))
           ->orderBy('next_due', 'ASC')
           ->setMaxResults($limit);
        return $this->findEntities($qb);
    }
}
