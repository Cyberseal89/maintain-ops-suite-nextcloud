<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

class PublicationMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_publications', Publication::class);
    }

    public function find(int $id): Publication {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)));
        return $this->findEntity($qb);
    }

    /** @return Publication[] */
    public function findAll(array $filters = []): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if (!empty($filters['asset_id'])) {
            $qb->andWhere($qb->expr()->eq('asset_id', $qb->createNamedParameter((int)$filters['asset_id'])));
        }
        if (!empty($filters['platform_id'])) {
            $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter((int)$filters['platform_id'])));
        }
        if (!empty($filters['status'])) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($filters['status'])));
        }
        $qb->orderBy('pub_code', 'ASC');
        return $this->findEntities($qb);
    }

    /** Flag all publications containing a specific DM as requiring re-issue. */
    public function flagReIssueForDocument(int $documentId): void {
        $qb = $this->db->getQueryBuilder();
        // Find publication IDs that reference this document
        $sub = $this->db->getQueryBuilder();
        $sub->select('publication_id')->from('ops_publication_dms')
            ->where($sub->expr()->eq('document_id', $sub->createNamedParameter($documentId)));
        $pubIds = array_column($sub->executeQuery()->fetchAllAssociative(), 'publication_id');
        if (empty($pubIds)) return;

        $qb->update($this->getTableName())
           ->set('re_issue_required', $qb->createNamedParameter(true, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_BOOL))
           ->where($qb->expr()->in('id', $qb->createNamedParameter($pubIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
        $qb->executeStatement();
    }
}
