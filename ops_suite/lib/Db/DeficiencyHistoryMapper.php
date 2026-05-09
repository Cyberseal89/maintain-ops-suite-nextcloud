<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class DeficiencyHistoryMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_deficiency_history', DeficiencyHistory::class);
    }

    /** @return DeficiencyHistory[] */
    public function findByDeficiency(int $deficiencyId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('deficiency_id',
               $qb->createNamedParameter($deficiencyId, IQueryBuilder::PARAM_INT)))
           ->orderBy('created_at', 'ASC');
        return $this->findEntities($qb);
    }
}
