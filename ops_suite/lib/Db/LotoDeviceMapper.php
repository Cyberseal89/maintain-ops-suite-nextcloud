<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;
use OCP\AppFramework\Db\QBMapper;

class LotoDeviceMapper extends QBMapper {

    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_loto_devices', LotoDevice::class);
    }

    public function find(int $id): LotoDevice {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return LotoDevice[] */
    public function findAll(?string $status = null, ?string $deviceType = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName);
        if ($status !== null) {
            $qb->andWhere($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        }
        if ($deviceType !== null) {
            $qb->andWhere($qb->expr()->eq('device_type', $qb->createNamedParameter($deviceType)));
        }
        $qb->orderBy('serial_number', 'ASC');
        return $this->findEntities($qb);
    }

    /** @return LotoDevice[] */
    public function findBySession(int $sessionId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->tableName)
           ->where($qb->expr()->eq('assigned_session_id', $qb->createNamedParameter($sessionId, IQueryBuilder::PARAM_INT)));
        return $this->findEntities($qb);
    }

    public function countByStatus(string $status): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*)'))
           ->from($this->tableName)
           ->where($qb->expr()->eq('status', $qb->createNamedParameter($status)));
        $result = $qb->executeQuery();
        $count  = (int)$result->fetchOne();
        $result->closeCursor();
        return $count;
    }
}
