<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class FmeaEntryMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_fmea_entries', FmeaEntry::class);
    }

    public function find(int $id): FmeaEntry {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id, IQueryBuilder::PARAM_INT)));
        return $this->findEntity($qb);
    }

    /** @return FmeaEntry[] */
    public function findByWorksheet(int $worksheetId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('worksheet_id', $qb->createNamedParameter($worksheetId, IQueryBuilder::PARAM_INT)))
           ->orderBy('sort_order', 'ASC')
           ->addOrderBy('id', 'ASC');
        return $this->findEntities($qb);
    }

    public function deleteByWorksheet(int $worksheetId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('worksheet_id', $qb->createNamedParameter($worksheetId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }

    /** Increment occurrence on entries linked to a failure mode — called from DeficiencyController */
    public function incrementOccurrenceForFailureMode(int $failureModeId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->getTableName())
           ->set('occurrence', $qb->createFunction('LEAST(occurrence + 1, 10)'))
           ->set('rpn', $qb->createFunction('severity * LEAST(occurrence + 1, 10) * detectability'))
           ->where($qb->expr()->eq('failure_mode_id', $qb->createNamedParameter($failureModeId, IQueryBuilder::PARAM_INT)));
        $qb->executeStatement();
    }
}
