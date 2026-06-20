<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ReqTraceabilityMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_req_traceability', ReqTraceability::class);
    }

    public function find(int $id): ReqTraceability {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return ReqTraceability[] */
    public function findForRequirement(int $reqId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('req_id', $qb->createNamedParameter($reqId, IQueryBuilder::PARAM_INT)))
           ->orderBy('id', 'ASC');
        return $this->findEntities($qb);
    }

    /** All traceability links pointing at a specific record (e.g. all reqs satisfied by a procedure) */
    public function findForTarget(string $type, int $id): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('traced_to_type', $qb->createNamedParameter($type)))
           ->andWhere($qb->expr()->eq('traced_to_id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }

    public function deleteForRequirement(int $reqId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('req_id', $qb->createNamedParameter($reqId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
