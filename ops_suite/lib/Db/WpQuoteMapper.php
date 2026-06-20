<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class WpQuoteMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_wp_quotes', WpQuote::class);
    }

    public function find(int $id): WpQuote {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findForPackage(int $workPackageId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('work_package_id', $qb->createNamedParameter($workPackageId, IQueryBuilder::PARAM_INT)))
           ->orderBy('quote_date', 'DESC');
        return $this->findEntities($qb);
    }

    public function clearSelected(int $workPackageId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->getTableName())
           ->set('is_selected', $qb->createNamedParameter(0, IQueryBuilder::PARAM_INT))
           ->where($qb->expr()->eq('work_package_id', $qb->createNamedParameter($workPackageId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }

    public function deleteForPackage(int $workPackageId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('work_package_id', $qb->createNamedParameter($workPackageId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
