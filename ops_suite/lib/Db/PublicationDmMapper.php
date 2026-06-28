<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

class PublicationDmMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_publication_dms', PublicationDm::class);
    }

    public function find(int $id): PublicationDm {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)));
        return $this->findEntity($qb);
    }

    /** @return PublicationDm[] ordered by chapter → section → sequence */
    public function findByPublication(int $publicationId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('publication_id', $qb->createNamedParameter($publicationId)))
           ->orderBy('chapter', 'ASC')
           ->addOrderBy('section', 'ASC')
           ->addOrderBy('sequence', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteByPublication(int $publicationId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('publication_id', $qb->createNamedParameter($publicationId)));
        $qb->executeStatement();
    }
}
