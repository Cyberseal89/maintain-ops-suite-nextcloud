<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

class DmStepMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_dm_steps', DmStep::class);
    }

    /** @return DmStep[] ordered by step_order */
    public function findByDocument(int $documentId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('document_id', $qb->createNamedParameter($documentId)))
           ->orderBy('step_order', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteByDocument(int $documentId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('document_id', $qb->createNamedParameter($documentId)));
        $qb->executeStatement();
    }
}
