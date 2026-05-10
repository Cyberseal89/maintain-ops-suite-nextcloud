<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class WorkPackageItemMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_wp_items', WorkPackageItem::class);
    }

    public function find(int $id): WorkPackageItem {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findForPackage(int $packageId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('package_id', $qb->createNamedParameter($packageId, IQueryBuilder::PARAM_INT)))
           ->orderBy('item_type', 'ASC')->addOrderBy('item_id', 'ASC');
        return $this->findEntities($qb);
    }

    public function findByItem(string $itemType, int $itemId): ?WorkPackageItem {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('item_type', $qb->createNamedParameter($itemType)))
           ->andWhere($qb->expr()->eq('item_id', $qb->createNamedParameter($itemId, IQueryBuilder::PARAM_INT)));
        try { return $this->findEntity($qb); } catch (\Exception $e) { return null; }
    }

    public function deleteForPackage(int $packageId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('package_id', $qb->createNamedParameter($packageId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
