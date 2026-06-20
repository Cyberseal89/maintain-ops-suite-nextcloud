<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class FailureModeMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_failure_modes', FailureMode::class);
    }

    public function find(int $id): FailureMode {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return FailureMode[] */
    public function findAll(?string $category = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($category !== null) {
            $qb->andWhere($qb->expr()->eq('category', $qb->createNamedParameter($category)));
        }
        $qb->orderBy('category', 'ASC')->addOrderBy('code', 'ASC');
        return $this->findEntities($qb);
    }

    public function codeExists(string $code): bool {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id')->from($this->getTableName())
           ->where($qb->expr()->eq('code', $qb->createNamedParameter($code)))
           ->setMaxResults(1);
        $r = $qb->executeQuery();
        $row = $r->fetch();
        $r->closeCursor();
        return $row !== false;
    }

    public function countAll(): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName());
        $r = $qb->executeQuery();
        $row = $r->fetch();
        $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    /** Count of deficiencies tagged with each failure mode */
    public function occurrenceCounts(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('fm.id', $qb->createFunction('COUNT(d.id) AS occurrence_count'))
           ->from($this->getTableName(), 'fm')
           ->leftJoin('fm', 'ops_deficiencies', 'd',
               $qb->expr()->eq('d.failure_mode_id', 'fm.id'))
           ->groupBy('fm.id');
        $r = $qb->executeQuery();
        $rows = $r->fetchAll();
        $r->closeCursor();
        $out = [];
        foreach ($rows as $row) {
            $out[(int)$row['id']] = (int)$row['occurrence_count'];
        }
        return $out;
    }
}
