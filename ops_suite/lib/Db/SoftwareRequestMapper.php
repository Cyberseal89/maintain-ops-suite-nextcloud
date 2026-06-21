<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

class SoftwareRequestMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_software_requests', SoftwareRequest::class);
    }

    public function findAll(?string $status = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)->orderBy('created_at', 'DESC');
        if ($status) {
            $qb->where($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        return $this->findEntities($qb);
    }

    public function findByNode(int $nodeId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)))
           ->orderBy('created_at', 'DESC');
        return $this->findEntities($qb);
    }

    public function findApprovedForNode(int $nodeId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)))
           ->andWhere($qb->expr()->eq('status', $qb->createNamedParameter('approved')))
           ->orderBy('approved_at');
        return $this->findEntities($qb);
    }

    public function findById(int $id): SoftwareRequest {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)));
        return $this->findEntity($qb);
    }
}
