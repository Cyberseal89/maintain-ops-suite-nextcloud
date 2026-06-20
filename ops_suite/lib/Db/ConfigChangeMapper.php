<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ConfigChangeMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_changes', ConfigChange::class);
    }

    public function find(int $id): ConfigChange {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ConfigChange[] */
    public function findAll(?int $platformId = null, ?int $shopId = null, ?string $stage = null, ?string $changeType = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        if ($shopId !== null) {
            $qb->andWhere($qb->expr()->eq('shop_id', $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)));
        }
        if ($stage !== null) {
            $qb->andWhere($qb->expr()->eq('stage', $qb->createNamedParameter($stage)));
        }
        if ($changeType !== null) {
            $qb->andWhere($qb->expr()->eq('change_type', $qb->createNamedParameter($changeType)));
        }
        $qb->orderBy('id', 'DESC');
        return $this->findEntities($qb);
    }

    /** Generate next CHG-{SHOPCODE}-{SEQ} using the shop_sequences table (parent_asset_id = -1 = change sequence). */
    public function nextChangeCode(int $shopId, string $shopCode): string {
        $this->db->beginTransaction();
        try {
            $qb = $this->db->getQueryBuilder();
            $qb->select('id', 'next_seq')
               ->from('ops_shop_sequences')
               ->where($qb->expr()->eq('shop_id',         $qb->createNamedParameter($shopId, IQueryBuilder::PARAM_INT)))
               ->andWhere($qb->expr()->eq('parent_asset_id', $qb->createNamedParameter(-1, IQueryBuilder::PARAM_INT)));
            $r   = $qb->executeQuery();
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
                        'shop_id'         => $ins->createNamedParameter($shopId, IQueryBuilder::PARAM_INT),
                        'parent_asset_id' => $ins->createNamedParameter(-1,      IQueryBuilder::PARAM_INT),
                        'next_seq'        => $ins->createNamedParameter(2,       IQueryBuilder::PARAM_INT),
                    ]);
                $ins->executeStatement();
            }

            $this->db->commit();
            return 'CHG-' . strtoupper($shopCode) . '-' . sprintf('%03d', $seq);
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
