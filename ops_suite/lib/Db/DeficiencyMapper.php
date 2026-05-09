<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class DeficiencyMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_deficiencies', Deficiency::class);
    }

    public function find(int $id): Deficiency {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(?string $severity = null, ?string $status = null, ?int $assetId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());

        // Special status filter: 'open_all' means any non-closed, non-cancelled status
        if ($status === 'open_all') {
            $qb->andWhere($qb->expr()->notIn('status',
                $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)));
        } elseif ($status !== null && $status !== '') {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }

        if ($severity !== null && $severity !== '') {
            $qb->andWhere($qb->expr()->eq('severity', $qb->createNamedParameter($severity)));
        }
        if ($assetId !== null) {
            $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
        }
        $qb->orderBy('created_at', 'DESC');
        return $this->findEntities($qb);
    }

    /** @return Deficiency[] top N open deficiencies ordered by severity */
    public function findCritical(int $limit = 5): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->notIn('status',
               $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->orderBy('severity', 'ASC')
           ->addOrderBy('created_at', 'DESC')
           ->setMaxResults($limit);
        return $this->findEntities($qb);
    }

    public function countOpen(): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->notIn('status',
               $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)));
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function countBySeverity(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('severity', $qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->where($qb->expr()->notIn('status',
               $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->groupBy('severity');
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['severity']] = (int)$row['cnt']; }
        return $out;
    }

    public function countOpenAssignedTo(string $user): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName())
           ->where($qb->expr()->eq('assigned_to', $qb->createNamedParameter($user)))
           ->andWhere($qb->expr()->notIn('status',
               $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)));
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function findOpenAssignedTo(string $user, int $limit = 10): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('assigned_to', $qb->createNamedParameter($user)))
           ->andWhere($qb->expr()->notIn('status',
               $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->orderBy('severity', 'ASC')
           ->addOrderBy('created_at', 'DESC')
           ->setMaxResults($limit);
        return $this->findEntities($qb);
    }
}
