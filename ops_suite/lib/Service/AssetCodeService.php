<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCA\OpsSuite\Db\Asset;
use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Db\Shop;
use OCA\OpsSuite\Db\ShopMapper;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

/**
 * Generates and manages asset codes in the format TYPE-SHOPCODE-POSITION.
 *
 * Examples:
 *   HW-C1-001          root hardware asset, first in shop C1
 *   SW-IT1-003         root software asset, third in shop IT1
 *   HW-C1-001-002      second child of HW-C1-001
 *   HW-C1-001-002-001  first grandchild of HW-C1-001-002
 *
 * Sequence counters live in ops_shop_sequences keyed on
 * (shop_id, parent_asset_id). parent_asset_id=0 means root level.
 */
class AssetCodeService {

    /** Asset type abbreviations */
    private const TYPE_MAP = [
        'hardware' => 'HW',
        'software' => 'SW',
        'firmware' => 'FW',
    ];

    public function __construct(
        private readonly IDBConnection $db,
        private readonly ShopMapper    $shopMapper,
        private readonly AssetMapper   $assetMapper,
    ) {}

    /**
     * Generate asset_code, system_position, depth, and hierarchy_path
     * for a new asset. Consumes one sequence number (irreversible on commit).
     *
     * @param string   $assetType  'hardware' | 'software' | 'firmware'
     * @param int      $shopId
     * @param int|null $parentId   null for root asset
     * @return array{asset_code:string, system_position:string, depth:int, hierarchy_path:string}
     */
    public function generate(string $assetType, int $shopId, ?int $parentId): array {
        $shop = $this->shopMapper->find($shopId);
        $typeCode = self::TYPE_MAP[$assetType] ?? 'HW';
        $parentAssetDbId = $parentId ?? 0;

        $seq = $this->nextSeq($shopId, $parentAssetDbId);
        $position = sprintf('%03d', $seq);

        if ($parentId === null) {
            // Root asset
            return [
                'asset_code'      => "{$typeCode}-{$shop->getCode()}-{$position}",
                'system_position' => $position,
                'depth'           => 0,
                'hierarchy_path'  => "{$shop->getCode()}/{$position}",
            ];
        }

        // Child asset: inherit parent's code and hierarchy
        try {
            $parent = $this->assetMapper->find($parentId);
        } catch (DoesNotExistException) {
            throw new \InvalidArgumentException("Parent asset {$parentId} not found");
        }

        $parentCode = $parent->getAssetCode() ?? "{$typeCode}-{$shop->getCode()}-???";
        $parentPath = $parent->getHierarchyPath() ?? $shop->getCode();
        $depth      = ($parent->getDepth() ?? 0) + 1;

        return [
            'asset_code'      => "{$parentCode}-{$position}",
            'system_position' => $position,
            'depth'           => $depth,
            'hierarchy_path'  => "{$parentPath}/{$position}",
        ];
    }

    /**
     * Atomically get-and-increment the sequence for a (shop, parent) pair.
     * Uses a DB transaction to prevent concurrent duplicate codes.
     */
    private function nextSeq(int $shopId, int $parentAssetId): int {
        $this->db->beginTransaction();
        try {
            $qb = $this->db->getQueryBuilder();
            $qb->select('id', 'next_seq')
               ->from('ops_shop_sequences')
               ->where($qb->expr()->eq('shop_id',         $qb->createNamedParameter($shopId,        IQueryBuilder::PARAM_INT)))
               ->andWhere($qb->expr()->eq('parent_asset_id', $qb->createNamedParameter($parentAssetId, IQueryBuilder::PARAM_INT)));
            $r = $qb->executeQuery();
            $row = $r->fetch();
            $r->closeCursor();

            if ($row) {
                $seq = (int)$row['next_seq'];
                $upd = $this->db->getQueryBuilder();
                $upd->update('ops_shop_sequences')
                    ->set('next_seq', $upd->createNamedParameter($seq + 1, IQueryBuilder::PARAM_INT))
                    ->where($upd->expr()->eq('id', $upd->createNamedParameter((int)$row['id'], IQueryBuilder::PARAM_INT)));
                $upd->executeStatement();
            } else {
                $seq = 1;
                $ins = $this->db->getQueryBuilder();
                $ins->insert('ops_shop_sequences')
                    ->values([
                        'shop_id'         => $ins->createNamedParameter($shopId,        IQueryBuilder::PARAM_INT),
                        'parent_asset_id' => $ins->createNamedParameter($parentAssetId, IQueryBuilder::PARAM_INT),
                        'next_seq'        => $ins->createNamedParameter(2,              IQueryBuilder::PARAM_INT),
                    ]);
                $ins->executeStatement();
            }

            $this->db->commit();
            return $seq;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
