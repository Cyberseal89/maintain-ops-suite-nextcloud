<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ImportJobMapper extends QBMapper {

    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_import_jobs', ImportJob::class);
    }

    /** @throws DoesNotExistException */
    public function find(int $id): ImportJob {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ImportJob[] */
    public function findAll(?string $createdBy = null, ?string $status = null, ?string $importType = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($createdBy !== null) {
            $qb->andWhere($qb->expr()->eq('created_by', $qb->createNamedParameter($createdBy)));
        }
        if ($status !== null) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        if ($importType !== null) {
            $qb->andWhere($qb->expr()->eq('import_type', $qb->createNamedParameter($importType)));
        }
        $qb->orderBy('created_at', 'DESC');
        return $this->findEntities($qb);
    }

    /** @return ImportJob[] */
    public function findRecent(string $createdBy, int $limit = 20): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('created_by', $qb->createNamedParameter($createdBy)))
           ->orderBy('created_at', 'DESC')
           ->setMaxResults($limit);
        return $this->findEntities($qb);
    }
}
