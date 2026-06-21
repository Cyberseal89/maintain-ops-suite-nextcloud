<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\QBMapper;
use OCP\IDBConnection;

class CveScanResultMapper extends QBMapper {
    public function __construct(IDBConnection $db) {
        parent::__construct($db, 'ops_cve_scan_results', CveScanResult::class);
    }

    /** @return CveScanResult[] */
    public function findByNode(int $nodeId, bool $unresolvedOnly = false): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from($this->getTableName())
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)));
        if ($unresolvedOnly) {
            $qb->andWhere($qb->expr()->eq('resolved', $qb->createNamedParameter(false, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_BOOL)));
        }
        $qb->orderBy('severity', 'ASC')->addOrderBy('cvss_score', 'DESC');
        return $this->findEntities($qb);
    }

    public function deleteByNode(int $nodeId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->delete($this->getTableName())
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)));
        $qb->executeStatement();
    }

    public function findOpenCveDeficiency(int $nodeId): ?int {
        $qb = $this->db->getQueryBuilder();
        $qb->select('deficiency_id')->from($this->getTableName())
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)))
           ->andWhere($qb->expr()->isNotNull('deficiency_id'))
           ->andWhere($qb->expr()->eq('resolved', $qb->createNamedParameter(false, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_BOOL)))
           ->setMaxResults(1);
        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();
        return $row ? (int)$row['deficiency_id'] : null;
    }

    public function markResolvedByNode(int $nodeId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->getTableName())
           ->set('resolved', $qb->createNamedParameter(true, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_BOOL))
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)));
        $qb->executeStatement();
    }

    public function setDeficiencyForNode(int $nodeId, int $deficiencyId): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update($this->getTableName())
           ->set('deficiency_id', $qb->createNamedParameter($deficiencyId))
           ->where($qb->expr()->eq('node_id', $qb->createNamedParameter($nodeId)));
        $qb->executeStatement();
    }
}
