<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ModernizationDocMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_modernization_docs', ModernizationDoc::class);
    }

    public function find(int $id): ModernizationDoc {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findForModernization(int $modernizationId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('modernization_id', $qb->createNamedParameter($modernizationId, IQueryBuilder::PARAM_INT)))
           ->orderBy('doc_type', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteForModernization(int $modernizationId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('modernization_id', $qb->createNamedParameter($modernizationId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
