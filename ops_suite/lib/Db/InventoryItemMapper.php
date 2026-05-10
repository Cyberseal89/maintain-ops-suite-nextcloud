<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class InventoryItemMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_inventory', InventoryItem::class);
    }

    public function find(int $id): InventoryItem {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findAll(?string $category = null, array $platformIds = [], bool $belowReorder = false): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($category) $qb->andWhere($qb->expr()->eq('category', $qb->createNamedParameter($category)));
        if (!empty($platformIds)) {
            $qb->andWhere($qb->expr()->in('platform_id', $qb->createNamedParameter($platformIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        if ($belowReorder) {
            $qb->andWhere($qb->expr()->lte('quantity_on_hand', $qb->createFunction('reorder_point')));
        }
        $qb->orderBy('item_name', 'ASC');
        return $this->findEntities($qb);
    }
}
