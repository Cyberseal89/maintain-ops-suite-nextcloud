<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class DocumentRevisionMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_document_revisions', DocumentRevision::class);
    }

    public function find(int $id): DocumentRevision {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return DocumentRevision[] ordered oldest → newest */
    public function findForDocument(int $documentId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('document_id', $qb->createNamedParameter($documentId, IQueryBuilder::PARAM_INT)))
           ->orderBy('id', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteForDocument(int $documentId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('document_id', $qb->createNamedParameter($documentId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
