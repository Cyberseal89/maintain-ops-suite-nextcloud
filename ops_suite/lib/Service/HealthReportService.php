<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCP\IDBConnection;
use OCP\DB\QueryBuilder\IQueryBuilder;

/**
 * Sprint 2C — Day 1 Health Report
 * Aggregates post-import readiness data for a platform.
 */
class HealthReportService {

    public function __construct(private readonly IDBConnection $db) {}

    public function generate(?int $platformId): array {
        $now = date('Y-m-d H:i:s');

        // ── Gather all data ───────────────────────────────────────────
        $assetCount       = $this->countAssets($platformId);
        $byType           = $this->assetsByType($platformId);
        $byHsc            = $this->assetsByHscSection($platformId);
        $bySeverity       = $this->deficienciesBySeverity($platformId);
        $openDefCount     = array_sum($bySeverity);
        $overdueCount     = $this->countOverduePMs($platformId);
        $noPmAssets       = $this->assetsWithoutPMs($platformId);
        $critWithDefs     = $this->criticalAssetsWithDeficiencies($platformId);
        $iuidGaps         = $this->iuidGaps($platformId);
        $recentImport     = $this->recentImport($platformId);

        // ── Health score (0–100) ──────────────────────────────────────
        $score = 100;
        $score -= min(30, ($bySeverity['SEV-1'] ?? 0) * 8);
        $score -= min(20, ($bySeverity['SEV-2'] ?? 0) * 4);
        $score -= min(10, ($bySeverity['SEV-3'] ?? 0) * 1);
        $score -= min(15, count($noPmAssets) * 1);
        $score -= min(10, count($iuidGaps) * 1);
        $score -= min(15, $overdueCount * 2);
        $score  = max(0, $score);

        // ── Priority actions ──────────────────────────────────────────
        $actions = $this->buildActionList($bySeverity, $critWithDefs, $noPmAssets, $iuidGaps, $overdueCount);

        return [
            'generated_at'   => $now,
            'platform_id'    => $platformId,
            'health_score'   => $score,
            'summary' => [
                'total_assets'      => $assetCount,
                'open_deficiencies' => $openDefCount,
                'overdue_pms'       => $overdueCount,
                'assets_no_pm'      => count($noPmAssets),
                'iuid_gaps'         => count($iuidGaps),
                'critical_at_risk'  => count($critWithDefs),
            ],
            'assets_by_type'         => $byType,
            'assets_by_hsc_section'  => $byHsc,
            'deficiencies_by_severity' => $bySeverity,
            'critical_assets_with_deficiencies' => array_slice($critWithDefs, 0, 20),
            'assets_without_pms'     => array_slice($noPmAssets, 0, 20),
            'iuid_gaps'              => array_slice($iuidGaps, 0, 20),
            'priority_actions'       => $actions,
            'recent_import'          => $recentImport,
        ];
    }

    // ── Query methods ─────────────────────────────────────────────────

    private function countAssets(?int $platformId): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))->from('ops_assets');
        $this->addPlatformFilter($qb, $platformId);
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    private function assetsByType(?int $platformId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('asset_type', $qb->createFunction('COUNT(*) AS cnt'))
           ->from('ops_assets')->groupBy('asset_type');
        $this->addPlatformFilter($qb, $platformId);
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['asset_type']] = (int)$row['cnt']; }
        return $out;
    }

    private function assetsByHscSection(?int $platformId): array {
        // Group by first 2 chars of hsc_code (SWBS section level)
        $qb = $this->db->getQueryBuilder();
        $qb->select(
                $qb->createFunction('SUBSTRING(hsc_code, 1, 2) AS section'),
                $qb->createFunction('COUNT(*) AS cnt')
           )
           ->from('ops_assets')
           ->where($qb->expr()->isNotNull('hsc_code'))
           ->andWhere($qb->expr()->neq('hsc_code', $qb->createNamedParameter('')))
           ->groupBy($qb->createFunction('SUBSTRING(hsc_code, 1, 2)'))
           ->orderBy('section', 'ASC');
        $this->addPlatformFilter($qb, $platformId);
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        return array_map(fn($row) => [
            'section' => $row['section'],
            'count'   => (int)$row['cnt'],
        ], $rows);
    }

    private function deficienciesBySeverity(?int $platformId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('d.severity', $qb->createFunction('COUNT(*) AS cnt'))
           ->from('ops_deficiencies', 'd')
           ->andWhere($qb->expr()->notIn('d.status',
               $qb->createNamedParameter(['closed','cancelled'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->groupBy('d.severity')
           ->orderBy('d.severity', 'ASC');
        if ($platformId !== null) {
            $assetIds = $this->assetIdsForPlatform($platformId);
            if (empty($assetIds)) return [];
            $qb->andWhere($qb->expr()->in('d.asset_id',
                $qb->createNamedParameter($assetIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        $out = [];
        foreach ($rows as $row) { $out[$row['severity']] = (int)$row['cnt']; }
        return $out;
    }

    private function countOverduePMs(?int $platformId): int {
        $today = date('Y-m-d');
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*) AS cnt'))
           ->from('ops_procedures', 'p')
           ->where($qb->expr()->lt('p.next_due', $qb->createNamedParameter($today)))
           ->andWhere($qb->expr()->isNotNull('p.next_due'));
        if ($platformId !== null) {
            $assetIds = $this->assetIdsForPlatform($platformId);
            if (empty($assetIds)) return 0;
            $qb->andWhere($qb->expr()->in('p.asset_id',
                $qb->createNamedParameter($assetIds, IQueryBuilder::PARAM_INT_ARRAY)));
        }
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        return (int)($row['cnt'] ?? 0);
    }

    private function assetsWithoutPMs(?int $platformId): array {
        // Assets that have no row in ops_procedures
        $qb = $this->db->getQueryBuilder();
        $qb->select('a.id', 'a.name', 'a.asset_type', 'a.criticality_code', 'a.hsc_code', 'a.location')
           ->from('ops_assets', 'a')
           ->leftJoin('a', 'ops_procedures', 'p', 'p.asset_id = a.id')
           ->where($qb->expr()->isNull('p.id'));
        $this->addPlatformFilterAlias($qb, $platformId, 'a');
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        return $rows;
    }

    private function criticalAssetsWithDeficiencies(?int $platformId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('a.id', 'a.name', 'a.criticality_code', 'a.hsc_code', 'a.location',
                    $qb->createFunction('COUNT(d.id) AS def_count'),
                    $qb->createFunction('MIN(d.severity) AS worst_severity'))
           ->from('ops_assets', 'a')
           ->innerJoin('a', 'ops_deficiencies', 'd', 'd.asset_id = a.id')
           ->where($qb->expr()->in('a.criticality_code',
               $qb->createNamedParameter(['CR','DE'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->andWhere($qb->expr()->notIn('d.status',
               $qb->createNamedParameter(['closed','cancelled'], IQueryBuilder::PARAM_STR_ARRAY)))
           ->groupBy('a.id', 'a.name', 'a.criticality_code', 'a.hsc_code', 'a.location')
           ->orderBy('worst_severity', 'ASC')
           ->addOrderBy('def_count', 'DESC');
        $this->addPlatformFilterAlias($qb, $platformId, 'a');
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        return array_map(fn($row) => [
            'id'              => (int)$row['id'],
            'name'            => $row['name'],
            'criticality_code'=> $row['criticality_code'],
            'hsc_code'        => $row['hsc_code'],
            'location'        => $row['location'],
            'def_count'       => (int)$row['def_count'],
            'worst_severity'  => $row['worst_severity'],
        ], $rows);
    }

    private function iuidGaps(?int $platformId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('a.id', 'a.name', 'a.asset_type', 'a.serial_number', 'a.cage_code', 'a.hsc_code', 'a.location')
           ->from('ops_assets', 'a')
           ->where($qb->expr()->eq('a.asset_type', $qb->createNamedParameter('hardware')))
           ->andWhere(
               $qb->expr()->orX(
                   $qb->expr()->eq('a.iuid_compliant', $qb->createNamedParameter(0, IQueryBuilder::PARAM_INT)),
                   $qb->expr()->like('a.uii', $qb->createNamedParameter('//ALTO/%')),
                   $qb->expr()->eq('a.uii', $qb->createNamedParameter('')),
                   $qb->expr()->isNull('a.uii')
               )
           )
           ->orderBy('a.name', 'ASC');
        $this->addPlatformFilterAlias($qb, $platformId, 'a');
        $r = $qb->executeQuery(); $rows = $r->fetchAll(); $r->closeCursor();
        return $rows;
    }

    private function recentImport(?int $platformId): ?array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from('ops_import_jobs')
           ->where($qb->expr()->eq('status', $qb->createNamedParameter('done')))
           ->orderBy('completed_at', 'DESC')
           ->setMaxResults(1);
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id',
                $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
        $r = $qb->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        if (!$row) return null;
        return [
            'id'            => (int)$row['id'],
            'import_type'   => $row['import_type'],
            'imported_rows' => (int)$row['imported_rows'],
            'completed_at'  => $row['completed_at'],
        ];
    }

    // ── Priority action list ──────────────────────────────────────────

    private function buildActionList(array $bySev, array $critWithDefs, array $noPmAssets, array $iuidGaps, int $overdueCount): array {
        $actions = [];
        $p = 1;

        $sev1 = $bySev['SEV-1'] ?? 0;
        $sev2 = $bySev['SEV-2'] ?? 0;
        $sev3 = $bySev['SEV-3'] ?? 0;

        if ($sev1 > 0) {
            $actions[] = ['priority'=>$p++, 'level'=>'critical', 'category'=>'deficiency',
                'title'  => $sev1.' SEV-1 '.($sev1===1?'Deficiency':'Deficiencies').' — Immediate Action Required',
                'detail' => 'SEV-1 deficiencies represent mission-critical failures. Assign personnel and begin corrective action immediately.',
                'action' => 'Open Deficiencies → filter SEV-1',
                'nav_route' => 'deficiencies', 'nav_param' => 'SEV-1'];
        }
        if (!empty($critWithDefs)) {
            $cr = count(array_filter($critWithDefs, fn($a) => $a['criticality_code']==='CR'));
            $de = count(array_filter($critWithDefs, fn($a) => $a['criticality_code']==='DE'));
            $actions[] = ['priority'=>$p++, 'level'=>'critical', 'category'=>'asset',
                'title'  => count($critWithDefs).' Critical/DE Assets with Open Deficiencies',
                'detail' => ($cr>0?$cr.' Critical (CR)':'').($cr>0&&$de>0?' and ':'').($de>0?$de.' Degraded (DE)':'').' assets have unresolved deficiencies.',
                'action' => 'Review critical assets and prioritize deficiency resolution',
                'nav_route' => 'assets', 'nav_param' => null];
        }
        if ($sev2 > 0) {
            $actions[] = ['priority'=>$p++, 'level'=>'high', 'category'=>'deficiency',
                'title'  => $sev2.' SEV-2 '.($sev2===1?'Deficiency':'Deficiencies').' — Resolve Within 72 Hours',
                'detail' => 'High-severity deficiencies should be assigned and under active work within 72 hours.',
                'action' => 'Open Deficiencies → filter SEV-2',
                'nav_route' => 'deficiencies', 'nav_param' => 'SEV-2'];
        }
        if ($overdueCount > 0) {
            $actions[] = ['priority'=>$p++, 'level'=>'high', 'category'=>'pm',
                'title'  => $overdueCount.' Overdue PM '.($overdueCount===1?'Procedure':'Procedures'),
                'detail' => 'Scheduled maintenance is past due. Overdue PMs increase failure risk and may affect readiness certification.',
                'action' => 'PM Procedures → overdue filter',
                'nav_route' => 'pm-procedures', 'nav_param' => null];
        }
        if (!empty($noPmAssets)) {
            $actions[] = ['priority'=>$p++, 'level'=>'medium', 'category'=>'pm',
                'title'  => count($noPmAssets).' '.( count($noPmAssets)===1?'Asset':'Assets').' With No Scheduled Maintenance',
                'detail' => 'These assets have no PM procedures assigned. Without scheduled maintenance, failures will be reactive rather than prevented.',
                'action' => 'Review asset list and assign PM procedures',
                'nav_route' => 'assets', 'nav_param' => null];
        }
        if ($sev3 > 0) {
            $actions[] = ['priority'=>$p++, 'level'=>'medium', 'category'=>'deficiency',
                'title'  => $sev3.' SEV-3 '.($sev3===1?'Deficiency':'Deficiencies').' — Schedule Resolution',
                'detail' => 'Medium-severity deficiencies should be assigned and scheduled within the current work cycle.',
                'action' => 'Open Deficiencies → filter SEV-3',
                'nav_route' => 'deficiencies', 'nav_param' => 'SEV-3'];
        }
        if (!empty($iuidGaps)) {
            $actions[] = ['priority'=>$p++, 'level'=>'low', 'category'=>'compliance',
                'title'  => count($iuidGaps).' Hardware '.( count($iuidGaps)===1?'Asset':'Assets').' Missing IUID/UII Data',
                'detail' => 'CAGE code + serial number required to generate DoD-compliant UII. Update asset records to achieve IUID compliance.',
                'action' => 'Asset Registry → filter hardware → update CAGE/serial',
                'nav_route' => 'assets', 'nav_param' => null];
        }

        if (empty($actions)) {
            $actions[] = ['priority'=>1, 'level'=>'ok', 'category'=>'general',
                'title'  => 'No Immediate Actions Required',
                'detail' => 'All critical metrics are within acceptable thresholds. Continue routine maintenance and monitoring.',
                'action' => '', 'nav_route' => null, 'nav_param' => null];
        }

        return $actions;
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function addPlatformFilter(IQueryBuilder $qb, ?int $platformId): void {
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq('platform_id',
                $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
    }

    private function addPlatformFilterAlias(IQueryBuilder $qb, ?int $platformId, string $alias): void {
        if ($platformId !== null) {
            $qb->andWhere($qb->expr()->eq($alias.'.platform_id',
                $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        }
    }

    private function assetIdsForPlatform(int $platformId): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id')->from('ops_assets')
           ->where($qb->expr()->eq('platform_id',
               $qb->createNamedParameter($platformId, IQueryBuilder::PARAM_INT)));
        $r = $qb->executeQuery();
        $ids = array_column($r->fetchAll(), 'id');
        $r->closeCursor();
        return array_map('intval', $ids);
    }
}
