<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class InventoryTransactionMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_inv_transactions', InventoryTransaction::class);
    }

    public function findForItem(int $inventoryId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('inventory_id', $qb->createNamedParameter($inventoryId, IQueryBuilder::PARAM_INT)))
           ->orderBy('created_at', 'DESC');
        return $this->findEntities($qb);
    }
}
