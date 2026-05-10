<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class AssetMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_assets', Asset::class);
    }

    public function find(int $id): Asset {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(?string $type = null, ?string $status = null, array $platformIds = []): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($type)   $qb->andWhere($qb->expr()->eq('asset_type', $qb->createNamedParameter($type)));
        if ($status) $qb->andWhere($qb->expr()->eq('status',     $qb->createNamedParameter($status)));
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $qb->orderBy('name', 'ASC');
        return $this->findEntities($qb);
    }

    public function countAll(array $platformIds = []): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName());
        if (!empty($platformIds)) {
            $qb->where($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    public function countByType(array $platformIds = []): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('asset_type', $qb->createFunction('COUNT(*) AS cnt'))
           ->from($this->getTableName())
           ->groupBy('asset_type');
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['asset_type']] = (int)$row['cnt']; }
        return $out;
    }
}
