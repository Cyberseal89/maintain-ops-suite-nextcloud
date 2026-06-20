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

    /** @throws DoesNotExistException */
    public function findByLocalUuid(string $uuid): Asset {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('local_uuid', $qb->createNamedParameter($uuid)));
        return $this->findEntity($qb);
    }

    /**
     * @return Asset[]
     * @param int|null $shopId    filter by shop
     * @param int|null $parentId  filter by parent (pass 0 for root-only)
     */
    public function findAll(
        ?string $type       = null,
        ?string $status     = null,
        array   $platformIds = [],
        ?int    $shopId     = null,
        ?int    $parentId   = null
    ): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($type)    $qb->andWhere($qb->expr()->eq('asset_type', $qb->createNamedParameter($type)));
        if ($status)  $qb->andWhere($qb->expr()->eq('status',     $qb->createNamedParameter($status)));
        if ($shopId !== null) {
            $qb->andWhere($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        }
        if ($parentId !== null) {
            if ($parentId === 0) {
                $qb->andWhere($qb->expr()->isNull('parent_id'));
            } else {
                $qb->andWhere($qb->expr()->eq('parent_id', $qb->createNamedParameter($parentId, IQueryBuilder::PARAM_INT)));
            }
        }
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $qb->orderBy('name', 'ASC');
        return $this->findEntities($qb);
    }

    /** Return direct children of a parent asset */
    public function findChildren(int $parentId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('parent_id', $qb->createNamedParameter($parentId, IQueryBuilder::PARAM_INT)))
           ->orderBy('name', 'ASC');
        return $this->findEntities($qb);
    }

    public function countAll(array $platformIds = []): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from($this->getTableName());
        if (!empty($platformIds)) {
            $qb->where($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
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
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['asset_type']] = (int)$row['cnt']; }
        return $out;
    }

    /** IDs of all assets in a shop (used by readiness summaries) */
    public function findIdsByShop(int $shopId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id')->from($this->getTableName())
           ->where($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        $r = $qb->executeQuery();
        $ids = array_column($r->fetchAll(), 'id');
        $r->closeCursor();
        return array_map('intval', $ids);
    }

    /**
     * Resolve an asset from a loose reference string.
     * Tries (in order): ASSET-NNNN label, serial_number, asset_code, uii, name.
     * Optional platformId narrows the search.
     */
    public function findByRef(string $ref, ?int $platformId = null): ?Asset {
        $ref = trim($ref);
        if ($ref === '') return null;

        // ASSET-NNNN format
        if (preg_match('/^ASSET-(\d+)$/i', $ref, $m)) {
            try { return $this->find((int)$m[1]); } catch (\Throwable) {}
        }

        foreach (['serial_number', 'asset_code', 'uii', 'name'] as $col) {
            $qb = $this->db->getQueryBuilder();
            $qb->select('*')->from($this->getTableName())
               ->where($qb->expr()->eq($col, $qb->createNamedParameter($ref)));
            if ($platformId !== null) {
                $qb->andWhere($qb->expr()->eq('platform_id',
                    $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
            }
            $qb->setMaxResults(1);
            try {
                $hits = $this->findEntities($qb);
                if (!empty($hits)) return $hits[0];
            } catch (\Throwable) {}
        }
        return null;
    }

    /** All assets for a platform (or all) that have an hsc_code — used for hierarchy building. */
    public function findAllWithHsc(?int $platformId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->isNotNull('hsc_code'))
           ->andWhere($qb->expr()->neq('hsc_code', $qb->createNamedParameter('')));
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id',
                $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        return $this->findEntities($qb);
    }

    /**
     * Returns a map of asset_id => worst open deficiency severity for the given asset IDs.
     * "Worst" = MIN() over SEV-1…SEV-5 (alphabetical order works because SEV-1 < SEV-2 etc.)
     * Only considers open deficiencies (excludes closed/cancelled).
     *
     * @return array<int, string>  e.g. [42 => 'SEV-1', 99 => 'SEV-3']
     */
    public function findWorstOpenSeverities(array $assetIds): array {
        if (empty($assetIds)) return [];
        $qb = $this->db->getQueryBuilder();
        $qb->select('asset_id', $qb->createFunction('MIN(severity) AS worst_severity'))
           ->from('ops_deficiencies')
           ->where($qb->expr()->in('asset_id', $qb->createNamedParameter($assetIds, IQueryBuilder::PARAM_INT_ARRAY)))
           ->andWhere($qb->expr()->notIn('status', $qb->createNamedParameter(['closed', 'cancelled'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->groupBy('asset_id');
        $result = $qb->executeQuery();
        $map = [];
        while ($row = $result->fetch()) {
            $map[(int)$row['asset_id']] = $row['worst_severity'];
        }
        $result->closeCursor();
        return $map;
    }
}
