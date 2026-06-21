<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class AltofleetNodeMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_altofleet_nodes', AltofleetNode::class);
    }

    public function find(int $id): AltofleetNode {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    public function findByUuid(string $uuid): ?AltofleetNode {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('local_uuid', $qb->createNamedParameter($uuid)));
        try {
            return $this->findEntity($qb);
        } catch (DoesNotExistException) {
            return null;
        }
    }

    /** @return AltofleetNode[] */
    public function findAll(?int $platformId = null): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName());
        if ($platformId !== null) {
            $qb->where($qb->expr()->eq(
                'platform_id',
                $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)
            ));
        }
        $qb->orderBy('hostname', 'ASC');
        return $this->findEntities($qb);
    }

    /**
     * Nodes whose last_seen timestamp is older than $staleSeconds ago
     * and are not already marked offline.
     *
     * @return AltofleetNode[]
     */
    public function findStale(int $staleSeconds = 180): array {
        $cutoff = date('Y-m-d H:i:s', time() - $staleSeconds);
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->notIn('status', $qb->createNamedParameter(['offline', 'new'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->andWhere($qb->expr()->lt('last_seen', $qb->createNamedParameter($cutoff)))
           ->andWhere($qb->expr()->neq('last_seen', $qb->createNamedParameter('')));
        return $this->findEntities($qb);
    }
}
