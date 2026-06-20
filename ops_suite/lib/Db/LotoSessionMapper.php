<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class LotoSessionMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_loto_sessions', LotoSession::class);
    }

    public function find(int $id): LotoSession {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return LotoSession[] */
    public function findAll(?string $status = null, ?int $assetId = null, array $platformIds = []): array {
        $qb = $this->db->getQueryBuilder();
        if (!empty($platformIds)) {
            $qb->select('s.*')
               ->from($this->getTableName(), 's')
               ->leftJoin('s', 'ops_assets', 'a', $qb->expr()->eq('s.asset_id', 'a.id'))
               ->andWhere($qb->expr()->orX(
                   $qb->expr()->in('a.platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)),
                   $qb->expr()->isNull('s.asset_id')
               ));
            if ($status !== null) {
                $qb->andWhere($qb->expr()->eq('s.status', $qb->createNamedParameter($status)));
            }
            if ($assetId !== null) {
                $qb->andWhere($qb->expr()->eq('s.asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
            }
            $qb->orderBy('s.initiated_at', 'DESC');
        } else {
            $qb->select('*')->from($this->getTableName());
            if ($status !== null) {
                $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
            }
            if ($assetId !== null) {
                $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT)));
            }
            $qb->orderBy('initiated_at', 'DESC');
        }
        return $this->findEntities($qb);
    }

    public function countActive(): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->where($qb->expr()->eq('status', $qb->createNamedParameter('active')));
        $r = $qb->executeQuery();
        $row = $r->fetch();
        $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }
}
