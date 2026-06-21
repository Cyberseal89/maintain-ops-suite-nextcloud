<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

class SoftwareCatalogMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_software_catalog', SoftwareCatalogItem::class);
    }

    public function findAll(bool $enabledOnly = true): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)->orderBy('tier')->addOrderBy('name');
        if ($enabledOnly) {
            $qb->where($qb->expr()->eq('enabled', $qb->createNamedParameter(true)));
        }
        return $this->findEntities($qb);
    }

    public function findById(int $id): SoftwareCatalogItem {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)));
        return $this->findEntity($qb);
    }
}
