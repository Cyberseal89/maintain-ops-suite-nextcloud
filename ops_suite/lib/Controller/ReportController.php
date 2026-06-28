<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\ReportDashboard;
use OCA\OpsSuite\Db\ReportDashboardMapper;
use OCA\OpsSuite\Db\ReportWidget;
use OCA\OpsSuite\Db\ReportWidgetMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IDBConnection;
use OCP\IRequest;
use OCP\IUserSession;

class ReportController extends Controller {

    public function __construct(
        string                          $appName,
        IRequest                        $request,
        private readonly ReportDashboardMapper $dashMapper,
        private readonly ReportWidgetMapper    $widgetMapper,
        private readonly PermissionService     $permission,
        private readonly IUserSession          $userSession,
        private readonly IDBConnection         $db,
    ) {
        parent::__construct($appName, $request);
    }

    // ── Dashboards ────────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexDashboards(): DataResponse {
        $uid    = $this->userSession->getUser()->getUID();
        $boards = $this->dashMapper->findAccessible($uid);
        return new DataResponse(array_map(fn($b) => $b->jsonSerialize(), $boards));
    }

    /** @NoAdminRequired */
    public function showDashboard(int $id): DataResponse {
        try {
            $board   = $this->dashMapper->find($id);
            $widgets = $this->widgetMapper->findByDashboard($id);
            $data    = $board->jsonSerialize();
            $data['widgets'] = array_map(fn($w) => $w->jsonSerialize(), $widgets);
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createDashboard(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data  = $this->request->getParams();
        $title = trim($data['title'] ?? '');
        if (!$title) {
            return new DataResponse(['message' => 'title required'], Http::STATUS_BAD_REQUEST);
        }

        $board = new ReportDashboard();
        $board->setTitle($title);
        $board->setDescription($data['description'] ?? null);
        $board->setCreatedBy($this->userSession->getUser()->getUID());
        $board->setVisibility(in_array($data['visibility'] ?? '', ['personal', 'shared']) ? $data['visibility'] : 'personal');
        $now = (new \DateTime())->format('Y-m-d H:i:s');
        $board->setCreatedAt($now);
        $board->setUpdatedAt($now);

        $board = $this->dashMapper->insert($board);
        return new DataResponse($board->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateDashboard(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $board = $this->dashMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        if (isset($data['title']))       $board->setTitle(trim($data['title']));
        if (array_key_exists('description', $data)) $board->setDescription($data['description']);
        if (isset($data['visibility']) && in_array($data['visibility'], ['personal', 'shared'])) {
            $board->setVisibility($data['visibility']);
        }
        $board->setUpdatedAt((new \DateTime())->format('Y-m-d H:i:s'));
        $this->dashMapper->update($board);
        return new DataResponse($board->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyDashboard(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $board = $this->dashMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $this->widgetMapper->deleteByDashboard($id);
        $this->dashMapper->delete($board);
        return new DataResponse(['ok' => true]);
    }

    // ── Widgets ───────────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function createWidget(int $dashboardId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data   = $this->request->getParams();
        $metric = trim($data['metric'] ?? '');
        if (!$metric || !in_array($metric, ReportWidget::METRICS, true)) {
            return new DataResponse(['message' => 'Invalid metric'], Http::STATUS_BAD_REQUEST);
        }

        $widget = new ReportWidget();
        $widget->setDashboardId($dashboardId);
        $widget->setTitle(trim($data['title'] ?? '') ?: $metric);
        $widget->setMetric($metric);
        $widget->setChartType(in_array($data['chart_type'] ?? '', ReportWidget::CHART_TYPES, true) ? $data['chart_type'] : 'bar');
        $widget->setTimeRange(in_array($data['time_range'] ?? '', ReportWidget::TIME_RANGES, true) ? $data['time_range'] : '30d');
        $widget->setGroupBy($data['group_by'] ?? null);
        $widget->setFilters(isset($data['filters']) ? json_encode($data['filters']) : null);
        $widget->setPosX((int)($data['pos_x'] ?? 0));
        $widget->setPosY((int)($data['pos_y'] ?? 0));
        $widget->setWidth(max(1, (int)($data['width'] ?? 2)));
        $widget->setHeight(max(1, (int)($data['height'] ?? 2)));
        $now = (new \DateTime())->format('Y-m-d H:i:s');
        $widget->setCreatedAt($now);
        $widget->setUpdatedAt($now);

        $widget = $this->widgetMapper->insert($widget);
        return new DataResponse($widget->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateWidget(int $dashboardId, int $widgetId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $widget = $this->widgetMapper->find($widgetId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data = $this->request->getParams();
        if (isset($data['title']))      $widget->setTitle(trim($data['title']));
        if (isset($data['metric']) && in_array($data['metric'], ReportWidget::METRICS, true))
            $widget->setMetric($data['metric']);
        if (isset($data['chart_type']) && in_array($data['chart_type'], ReportWidget::CHART_TYPES, true))
            $widget->setChartType($data['chart_type']);
        if (isset($data['time_range']) && in_array($data['time_range'], ReportWidget::TIME_RANGES, true))
            $widget->setTimeRange($data['time_range']);
        if (array_key_exists('group_by', $data))  $widget->setGroupBy($data['group_by']);
        if (array_key_exists('filters', $data))   $widget->setFilters(json_encode($data['filters']));
        if (isset($data['pos_x']))  $widget->setPosX((int)$data['pos_x']);
        if (isset($data['pos_y']))  $widget->setPosY((int)$data['pos_y']);
        if (isset($data['width']))  $widget->setWidth(max(1, (int)$data['width']));
        if (isset($data['height'])) $widget->setHeight(max(1, (int)$data['height']));
        $widget->setUpdatedAt((new \DateTime())->format('Y-m-d H:i:s'));
        $this->widgetMapper->update($widget);
        return new DataResponse($widget->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyWidget(int $dashboardId, int $widgetId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $widget = $this->widgetMapper->find($widgetId);
            $this->widgetMapper->delete($widget);
            return new DataResponse(['ok' => true]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Widget Data Endpoints ─────────────────────────────────────────

    /** @NoAdminRequired */
    public function widgetData(string $metric): DataResponse {
        $timeRange  = $this->request->getParam('time_range', '30d');
        $groupBy    = $this->request->getParam('group_by');
        $platformId = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $shopId     = $this->request->getParam('shop_id')     ? (int)$this->request->getParam('shop_id')     : null;
        $filters    = json_decode($this->request->getParam('filters', '{}'), true) ?? [];
        if ($platformId) $filters['platform_id'] = $platformId;
        if ($shopId)     $filters['shop_id']     = $shopId;

        $since = $this->sinceDate($timeRange);

        try {
            $result = match($metric) {
                'readiness_trend'         => $this->dataReadinessTrend($since, $groupBy, $filters),
                'pm_compliance'           => $this->dataPmCompliance($since, $groupBy, $filters),
                'cve_severity_trend'      => $this->dataCveSeverityTrend($since, $filters),
                'deficiency_aging'        => $this->dataDeficiencyAging($filters),
                'budget_variance'         => $this->dataBudgetVariance($filters),
                'fleet_node_health'       => $this->dataFleetNodeHealth(),
                'patch_compliance'        => $this->dataPatchCompliance(),
                'vulnerability_score'     => $this->dataVulnerabilityScore(),
                'software_tier_compliance'=> $this->dataSoftwareTierCompliance($since),
                default                   => null,
            };
        } catch (\Throwable $e) {
            return new DataResponse(['message' => $e->getMessage(), 'series' => [], 'type' => 'bar'], Http::STATUS_OK);
        }

        if ($result === null) {
            return new DataResponse(['message' => 'Unknown metric'], Http::STATUS_BAD_REQUEST);
        }
        return new DataResponse($result);
    }

    // ── Metric Queries ────────────────────────────────────────────────

    // Readiness code → 0-100 numeric score
    private function readinessToScore(string $code): int {
        return match($code) {
            'FULL-OP'     => 100,
            'DEG-OP-MIN'  => 75,
            'DEG-OP-BEL'  => 50,
            'DOWN-MX'     => 25,
            'DOWN-OP'     => 10,
            'DOWN-UNS'    => 0,
            default       => 50,
        };
    }

    private function dataReadinessTrend(?string $since, ?string $groupBy, array $filters): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('r.readiness_code', 'r.calculated_at', 'a.platform_id')
           ->from('ops_asset_readiness', 'r')
           ->join('r', 'ops_assets', 'a', $qb->expr()->eq('r.asset_id', 'a.id'))
           ->orderBy('r.calculated_at', 'ASC');

        if ($since) {
            $qb->andWhere($qb->expr()->gte('r.calculated_at', $qb->createNamedParameter($since)));
        }
        if (!empty($filters['platform_id'])) {
            $qb->andWhere($qb->expr()->eq('a.platform_id', $qb->createNamedParameter((int)$filters['platform_id'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        }

        $rows = $qb->executeQuery()->fetchAllAssociative();

        // Bucket by week
        $buckets = [];
        foreach ($rows as $row) {
            $ts   = $row['calculated_at'] ? strtotime($row['calculated_at']) : time();
            $week = date('Y-W', $ts);
            if (!isset($buckets[$week])) $buckets[$week] = ['label' => date('M j', $ts), 'scores' => []];
            $buckets[$week]['scores'][] = $this->readinessToScore($row['readiness_code'] ?? '');
        }

        $series = [];
        foreach ($buckets as $b) {
            $series[] = ['label' => $b['label'], 'value' => $b['scores'] ? round(array_sum($b['scores']) / count($b['scores'])) : 0];
        }

        // If no historical data, show current snapshot per asset
        if (empty($series)) {
            $qb2 = $this->db->getQueryBuilder();
            $qb2->select('r.readiness_code')->from('ops_asset_readiness', 'r');
            $snap = $qb2->executeQuery()->fetchAllAssociative();
            if ($snap) {
                $avg = round(array_sum(array_map(fn($r) => $this->readinessToScore($r['readiness_code']), $snap)) / count($snap));
                $series = [['label' => 'Now', 'value' => $avg]];
            }
        }

        return ['series' => $series, 'type' => 'line'];
    }

    private function dataPmCompliance(?string $since, ?string $groupBy, array $filters): array {
        // Source: ops_procedures — group by category (periodicity bucket) or platform via asset
        $qb = $this->db->getQueryBuilder();
        $qb->select('p.category', 'p.next_due', 'p.last_completed', 'a.platform_id', 'pl.name AS platform_name')
           ->from('ops_procedures', 'p')
           ->join('p', 'ops_assets', 'a', $qb->expr()->eq('p.asset_id', 'a.id'))
           ->leftJoin('a', 'ops_platforms', 'pl', $qb->expr()->eq('a.platform_id', 'pl.id'));

        if (!empty($filters['platform_id'])) {
            $qb->andWhere($qb->expr()->eq('a.platform_id', $qb->createNamedParameter((int)$filters['platform_id'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        }

        $rows = $qb->executeQuery()->fetchAllAssociative();
        $now  = date('Y-m-d');

        $groupKey = ($groupBy === 'platform') ? 'platform_name' : 'category';
        $groups   = [];
        foreach ($rows as $row) {
            $g = $row[$groupKey] ?? 'Uncategorized';
            if (!isset($groups[$g])) $groups[$g] = ['total' => 0, 'completed' => 0, 'overdue' => 0];
            $groups[$g]['total']++;
            if ($row['last_completed']) $groups[$g]['completed']++;
            if ($row['next_due'] && $row['next_due'] < $now) $groups[$g]['overdue']++;
        }

        $series = [];
        foreach ($groups as $name => $g) {
            $series[] = ['label' => $name ?: 'General', 'value' => $g['total'] > 0 ? round($g['completed'] / $g['total'] * 100) : 0, 'total' => $g['total'], 'overdue' => $g['overdue']];
        }
        usort($series, fn($a, $b) => $a['value'] <=> $b['value']);
        return ['series' => $series, 'type' => 'bar', 'unit' => '%'];
    }

    private function dataCveSeverityTrend(?string $since, array $filters): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('c.severity', 'c.scanned_at', 'c.node_id')
           ->from('ops_cve_scan_results', 'c')
           ->orderBy('c.scanned_at', 'ASC');

        if ($since) {
            $qb->andWhere($qb->expr()->gte('c.scanned_at', $qb->createNamedParameter($since)));
        }
        if (!empty($filters['node_id'])) {
            $qb->andWhere($qb->expr()->eq('c.node_id', $qb->createNamedParameter((int)$filters['node_id'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        }

        $rows = $qb->executeQuery()->fetchAllAssociative();

        $buckets = [];
        foreach ($rows as $row) {
            $ts   = $row['scanned_at'] ? strtotime($row['scanned_at']) : time();
            $week = date('Y-W', $ts);
            if (!isset($buckets[$week])) {
                $buckets[$week] = ['label' => date('M j', $ts), 'CRITICAL' => 0, 'HIGH' => 0, 'MEDIUM' => 0, 'LOW' => 0];
            }
            $sev = strtoupper($row['severity'] ?? 'LOW');
            if (isset($buckets[$week][$sev])) $buckets[$week][$sev]++;
        }

        return ['series' => array_values($buckets), 'type' => 'line', 'stacked' => true, 'keys' => ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']];
    }

    private function dataDeficiencyAging(array $filters): array {
        $qb = $this->db->getQueryBuilder();
        // severity column holds SEV-1 … SEV-5
        $qb->select('d.severity', 'd.created_at')
           ->from('ops_deficiencies', 'd')
           ->where($qb->expr()->notIn('d.status', $qb->createNamedParameter(['closed', 'cancelled'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_STR_ARRAY)));

        if (!empty($filters['platform_id'])) {
            $qb->andWhere($qb->expr()->eq('d.platform_id', $qb->createNamedParameter((int)$filters['platform_id'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        }

        $rows = $qb->executeQuery()->fetchAllAssociative();
        $now  = time();

        $buckets = [
            '<7d'   => ['SEV-1' => 0, 'SEV-2' => 0, 'SEV-3' => 0, 'SEV-4' => 0, 'SEV-5' => 0],
            '7-30d' => ['SEV-1' => 0, 'SEV-2' => 0, 'SEV-3' => 0, 'SEV-4' => 0, 'SEV-5' => 0],
            '30-90d'=> ['SEV-1' => 0, 'SEV-2' => 0, 'SEV-3' => 0, 'SEV-4' => 0, 'SEV-5' => 0],
            '>90d'  => ['SEV-1' => 0, 'SEV-2' => 0, 'SEV-3' => 0, 'SEV-4' => 0, 'SEV-5' => 0],
        ];

        foreach ($rows as $row) {
            $age = ($now - strtotime($row['created_at'] ?? 'now')) / 86400;
            $key = $age < 7 ? '<7d' : ($age < 30 ? '7-30d' : ($age < 90 ? '30-90d' : '>90d'));
            $sev = $row['severity'] ?? 'SEV-3';
            if (isset($buckets[$key][$sev])) $buckets[$key][$sev]++;
        }

        $series = [];
        foreach ($buckets as $age => $counts) {
            $series[] = array_merge(['age_bucket' => $age], $counts);
        }
        return ['series' => $series, 'type' => 'heatmap', 'keys' => ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4', 'SEV-5']];
    }

    private function dataBudgetVariance(array $filters): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('b.fiscal_year', 'l.authorized_amount', 'l.obligated_amount', 'p.name AS platform_name')
           ->from('ops_mmbp_budgets', 'b')
           ->join('b', 'ops_mmbp_lines', 'l', $qb->expr()->eq('l.budget_id', 'b.id'))
           ->leftJoin('b', 'ops_platforms', 'p', $qb->expr()->eq('b.platform_id', 'p.id'));

        if (!empty($filters['platform_id'])) {
            $qb->andWhere($qb->expr()->eq('b.platform_id', $qb->createNamedParameter((int)$filters['platform_id'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        }
        if (!empty($filters['fiscal_year'])) {
            $qb->andWhere($qb->expr()->eq('b.fiscal_year', $qb->createNamedParameter((int)$filters['fiscal_year'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        }

        $rows = $qb->executeQuery()->fetchAllAssociative();

        $platforms = [];
        foreach ($rows as $row) {
            $name = $row['platform_name'] ?? 'Unknown';
            if (!isset($platforms[$name])) $platforms[$name] = ['authorized' => 0, 'obligated' => 0];
            $platforms[$name]['authorized'] += (float)($row['authorized_amount'] ?? 0);
            $platforms[$name]['obligated']  += (float)($row['obligated_amount']  ?? 0);
        }

        $series = [];
        foreach ($platforms as $name => $vals) {
            $series[] = ['label' => $name, 'funded' => $vals['authorized'], 'obligated' => $vals['obligated'], 'variance' => $vals['authorized'] - $vals['obligated']];
        }
        return ['series' => $series, 'type' => 'bar', 'keys' => ['funded', 'obligated']];
    }

    private function dataFleetNodeHealth(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id', 'hostname', 'status', 'last_seen', 'cpu_pct', 'memory_pct', 'disk_pct', 'pending_update')
           ->from('ops_altofleet_nodes')
           ->orderBy('hostname');

        $rows = $qb->executeQuery()->fetchAllAssociative();
        $now  = time();

        $series = array_map(function($r) use ($now) {
            $lastSeen = $r['last_seen'] ? strtotime($r['last_seen']) : 0;
            return [
                'id'             => (int)$r['id'],
                'hostname'       => $r['hostname'],
                'status'         => $r['status'],
                'last_seen'      => $r['last_seen'],
                'mins_offline'   => $lastSeen ? round(($now - $lastSeen) / 60) : null,
                'cpu'            => isset($r['cpu_pct'])    ? (float)$r['cpu_pct']    : null,
                'ram'            => isset($r['memory_pct']) ? (float)$r['memory_pct'] : null,
                'disk'           => isset($r['disk_pct'])   ? (float)$r['disk_pct']   : null,
                'pending_update' => (bool)$r['pending_update'],
            ];
        }, $rows);

        return ['series' => $series, 'type' => 'sparkline'];
    }

    private function dataPatchCompliance(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id', 'hostname', 'status', 'pending_update', 'last_seen', 'os_version')
           ->from('ops_altofleet_nodes')
           ->orderBy('hostname');

        $rows = $qb->executeQuery()->fetchAllAssociative();
        $total = count($rows);
        $patched = $pending = $offline = 0;
        $nodes = [];
        $now   = time();

        foreach ($rows as $r) {
            $lastSeen  = $r['last_seen'] ? strtotime($r['last_seen']) : 0;
            $isOffline = !$lastSeen || ($now - $lastSeen) > 600;
            $isPending = (bool)$r['pending_update'];

            if ($isOffline)     $offline++;
            elseif ($isPending) $pending++;
            else                $patched++;

            $nodes[] = [
                'id'             => (int)$r['id'],
                'hostname'       => $r['hostname'],
                'pending_update' => $isPending,
                'offline'        => $isOffline,
                'last_seen'      => $r['last_seen'],
                'os_version'     => $r['os_version'] ?? null,
                'patch_state'    => $isOffline ? 'unknown' : ($isPending ? 'pending' : 'current'),
            ];
        }

        return ['type' => 'gauge', 'compliance_rate' => $total > 0 ? round($patched / $total * 100) : 0,
                'total' => $total, 'patched' => $patched, 'pending' => $pending, 'offline' => $offline, 'nodes' => $nodes];
    }

    private function dataVulnerabilityScore(): array {
        $weights = ['CRITICAL' => 10, 'HIGH' => 5, 'MEDIUM' => 2, 'LOW' => 0.5];

        $qb = $this->db->getQueryBuilder();
        // resolved column stores the remediation flag (bool → 0/1)
        $qb->select('c.node_id', 'c.severity', 'n.hostname', 'n.status')
           ->from('ops_cve_scan_results', 'c')
           ->join('c', 'ops_altofleet_nodes', 'n', $qb->expr()->eq('c.node_id', 'n.id'))
           ->where($qb->expr()->eq('c.resolved', $qb->createNamedParameter(0, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));

        $rows  = $qb->executeQuery()->fetchAllAssociative();
        $nodes = [];

        foreach ($rows as $r) {
            $nid = (int)$r['node_id'];
            if (!isset($nodes[$nid])) $nodes[$nid] = ['id' => $nid, 'hostname' => $r['hostname'], 'raw_score' => 0.0, 'counts' => ['CRITICAL' => 0, 'HIGH' => 0, 'MEDIUM' => 0, 'LOW' => 0]];
            $sev = strtoupper($r['severity'] ?? 'LOW');
            $nodes[$nid]['raw_score'] += $weights[$sev] ?? 0;
            if (isset($nodes[$nid]['counts'][$sev])) $nodes[$nid]['counts'][$sev]++;
        }

        $series = [];
        foreach ($nodes as $n) {
            // Divide raw score by 2 so a node needs 200 weight-points (~20 criticals) to reach 0
            $score    = max(0, 100 - min(100, (int)round($n['raw_score'] / 2)));
            $series[] = ['id' => $n['id'], 'hostname' => $n['hostname'], 'cyber_score' => $score, 'raw_score' => round($n['raw_score'], 1), 'counts' => $n['counts']];
        }
        usort($series, fn($a, $b) => $a['cyber_score'] <=> $b['cyber_score']);

        $fleet_score = $series ? round(array_sum(array_column($series, 'cyber_score')) / count($series)) : 100;
        return ['series' => $series, 'fleet_score' => $fleet_score, 'type' => 'sparkline'];
    }

    private function dataSoftwareTierCompliance(?string $since): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('r.status', 'c.tier')
           ->from('ops_software_requests', 'r')
           ->join('r', 'ops_software_catalog', 'c', $qb->expr()->eq('r.catalog_id', 'c.id'));

        if ($since) {
            $qb->andWhere($qb->expr()->gte('r.created_at', $qb->createNamedParameter($since)));
        }

        $rows  = $qb->executeQuery()->fetchAllAssociative();
        $tiers = [1 => ['approved' => 0, 'total' => 0], 2 => ['approved' => 0, 'total' => 0], 3 => ['approved' => 0, 'total' => 0], 4 => ['approved' => 0, 'total' => 0]];

        foreach ($rows as $r) {
            $tier = (int)($r['tier'] ?? 1);
            if (!isset($tiers[$tier])) continue;
            $tiers[$tier]['total']++;
            if (in_array($r['status'], ['approved', 'installed'], true)) $tiers[$tier]['approved']++;
        }

        $series = [];
        foreach ($tiers as $tier => $t) {
            $series[] = ['label' => 'Tier '.$tier, 'tier' => $tier, 'total' => $t['total'], 'approved' => $t['approved'], 'rate' => $t['total'] > 0 ? round($t['approved'] / $t['total'] * 100) : 100, 'value' => $t['total']];
        }
        return ['series' => $series, 'type' => 'donut'];
    }

    // ── Cyber Readiness Score ─────────────────────────────────────────

    /** @NoAdminRequired — fleet-wide composite cyber readiness score */
    public function cyberReadiness(): DataResponse {
        try {
        // Composite score: 40% patch compliance + 40% vuln score + 20% software tier compliance
        $patch  = $this->dataPatchCompliance();
        $vuln   = $this->dataVulnerabilityScore();
        $sw     = $this->dataSoftwareTierCompliance(null);

        $patchScore = $patch['compliance_rate'] ?? 0;
        $vulnScore  = $vuln['fleet_score'] ?? 100;

        $swScores = array_column($sw['series'], 'rate');
        $swScore  = $swScores ? round(array_sum($swScores) / count($swScores)) : 100;

        $composite = round($patchScore * 0.4 + $vulnScore * 0.4 + $swScore * 0.2);

        $grade = match(true) {
            $composite >= 90 => 'A',
            $composite >= 75 => 'B',
            $composite >= 60 => 'C',
            $composite >= 40 => 'D',
            default          => 'F',
        };

        return new DataResponse([
            'score'         => $composite,
            'grade'         => $grade,
            'patch_score'   => $patchScore,
            'vuln_score'    => $vulnScore,
            'sw_score'      => $swScore,
            'patch_detail'  => $patch,
            'vuln_detail'   => $vuln,
        ]);
        } catch (\Throwable $e) {
            return new DataResponse(['score' => 0, 'grade' => '?', 'error' => $e->getMessage()], Http::STATUS_OK);
        }
    }

    // ── Field Registry ────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function fieldRegistry(): DataResponse {
        return new DataResponse([
            'deficiencies' => ['label'=>'Deficiencies', 'fields'=>[
                ['key'=>'severity',      'label'=>'Severity',              'type'=>'dimension'],
                ['key'=>'status',        'label'=>'Status',               'type'=>'dimension'],
                ['key'=>'platform',      'label'=>'Platform',             'type'=>'dimension'],
                ['key'=>'assigned_to',   'label'=>'Assigned To',          'type'=>'dimension'],
                ['key'=>'created_week',  'label'=>'Week Created',         'type'=>'date'],
                ['key'=>'created_month', 'label'=>'Month Created',        'type'=>'date'],
                ['key'=>'count',         'label'=>'Count',                'type'=>'measure'],
                ['key'=>'mttr',          'label'=>'MTTR (days)',           'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_cost',      'label'=>'Avg Estimated Cost',   'type'=>'measure', 'computed'=>true],
                ['key'=>'total_cost',    'label'=>'Total Estimated Cost', 'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_mandays',   'label'=>'Avg Man-Days',         'type'=>'measure', 'computed'=>true],
                ['key'=>'open_count',    'label'=>'Open Count',           'type'=>'measure', 'computed'=>true],
            ], 'x_from'=>['assets']],
            'assets' => ['label'=>'Assets', 'fields'=>[
                ['key'=>'name',           'label'=>'Asset Name',          'type'=>'dimension'],
                ['key'=>'platform',       'label'=>'Platform',            'type'=>'dimension'],
                ['key'=>'criticality',    'label'=>'Criticality',         'type'=>'dimension'],
                ['key'=>'status',         'label'=>'Status',              'type'=>'dimension'],
                ['key'=>'manufacturer',   'label'=>'Manufacturer',        'type'=>'dimension'],
                ['key'=>'install_month',  'label'=>'Month Installed',     'type'=>'date'],
                ['key'=>'count',          'label'=>'Asset Count',         'type'=>'measure'],
                ['key'=>'age_days',       'label'=>'Avg Age (days)',       'type'=>'measure', 'computed'=>true],
                ['key'=>'days_to_warranty','label'=>'Days to Warranty Exp','type'=>'measure','computed'=>true],
            ]],
            'procedures' => ['label'=>'PM Procedures', 'fields'=>[
                ['key'=>'category',        'label'=>'Category',           'type'=>'dimension'],
                ['key'=>'platform',        'label'=>'Platform',           'type'=>'dimension'],
                ['key'=>'assigned_to',     'label'=>'Assigned Technician','type'=>'dimension'],
                ['key'=>'due_month',       'label'=>'Month Due',          'type'=>'date'],
                ['key'=>'count',           'label'=>'Procedure Count',    'type'=>'measure'],
                ['key'=>'compliance_rate', 'label'=>'Compliance Rate %',  'type'=>'measure', 'computed'=>true],
                ['key'=>'overdue_count',   'label'=>'Overdue Count',      'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_hours',       'label'=>'Avg Actual Hours',   'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_parts_cost',  'label'=>'Avg Parts Cost',     'type'=>'measure', 'computed'=>true],
            ], 'x_from'=>['assets']],
            'fleet' => ['label'=>'Fleet Nodes', 'fields'=>[
                ['key'=>'hostname',     'label'=>'Hostname',              'type'=>'dimension'],
                ['key'=>'status',       'label'=>'Status',               'type'=>'dimension'],
                ['key'=>'os_version',   'label'=>'OS Version',           'type'=>'dimension'],
                ['key'=>'patch_state',  'label'=>'Patch State',          'type'=>'dimension'],
                ['key'=>'count',        'label'=>'Node Count',           'type'=>'measure'],
                ['key'=>'avg_cpu',      'label'=>'Avg CPU %',            'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_memory',   'label'=>'Avg Memory %',         'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_disk',     'label'=>'Avg Disk %',           'type'=>'measure', 'computed'=>true],
                ['key'=>'patch_rate',   'label'=>'Patch Compliance %',   'type'=>'measure', 'computed'=>true],
            ]],
            'cves' => ['label'=>'CVE Scan Results', 'fields'=>[
                ['key'=>'severity',      'label'=>'Severity',            'type'=>'dimension'],
                ['key'=>'node',          'label'=>'Node',                'type'=>'dimension'],
                ['key'=>'resolved',      'label'=>'Resolved',           'type'=>'dimension'],
                ['key'=>'scanned_week',  'label'=>'Week Scanned',       'type'=>'date'],
                ['key'=>'scanned_month', 'label'=>'Month Scanned',      'type'=>'date'],
                ['key'=>'count',         'label'=>'CVE Count',          'type'=>'measure'],
                ['key'=>'open_count',    'label'=>'Open CVE Count',     'type'=>'measure', 'computed'=>true],
                ['key'=>'critical_count','label'=>'Critical Count',     'type'=>'measure', 'computed'=>true],
                ['key'=>'exposure_score','label'=>'Exposure Score',     'type'=>'measure', 'computed'=>true],
            ]],
            'readiness' => ['label'=>'Asset Readiness', 'fields'=>[
                ['key'=>'readiness_code', 'label'=>'Readiness Code',    'type'=>'dimension'],
                ['key'=>'platform',       'label'=>'Platform',          'type'=>'dimension'],
                ['key'=>'calc_week',      'label'=>'Week Assessed',     'type'=>'date'],
                ['key'=>'calc_month',     'label'=>'Month Assessed',    'type'=>'date'],
                ['key'=>'count',          'label'=>'Assessment Count',  'type'=>'measure'],
                ['key'=>'avg_score',      'label'=>'Avg Readiness Score','type'=>'measure','computed'=>true],
                ['key'=>'full_op_rate',   'label'=>'FULL-OP Rate %',    'type'=>'measure', 'computed'=>true],
                ['key'=>'down_rate',      'label'=>'Down Rate %',        'type'=>'measure', 'computed'=>true],
            ]],
            'supply' => ['label'=>'Supply Requests', 'fields'=>[
                ['key'=>'status',         'label'=>'Request Status',    'type'=>'dimension'],
                ['key'=>'platform',       'label'=>'Platform',          'type'=>'dimension'],
                ['key'=>'priority',       'label'=>'Priority',          'type'=>'dimension'],
                ['key'=>'created_month',  'label'=>'Month Requested',   'type'=>'date'],
                ['key'=>'count',          'label'=>'Request Count',     'type'=>'measure'],
                ['key'=>'total_cost',     'label'=>'Total Est. Cost',   'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_days_fill',  'label'=>'Avg Days to Fill',  'type'=>'measure', 'computed'=>true],
            ]],
            'modernizations' => ['label'=>'Modernizations', 'fields'=>[
                ['key'=>'stage',         'label'=>'Stage',              'type'=>'dimension'],
                ['key'=>'platform',      'label'=>'Platform',           'type'=>'dimension'],
                ['key'=>'created_month', 'label'=>'Month Created',      'type'=>'date'],
                ['key'=>'count',         'label'=>'Project Count',      'type'=>'measure'],
                ['key'=>'total_cost',    'label'=>'Total Estimated Cost','type'=>'measure','computed'=>true],
                ['key'=>'avg_cost',      'label'=>'Avg Project Cost',   'type'=>'measure', 'computed'=>true],
                ['key'=>'completion_rate','label'=>'Completion Rate %', 'type'=>'measure', 'computed'=>true],
            ]],
            'budget' => ['label'=>'Budget (MMBP)', 'fields'=>[
                ['key'=>'platform',       'label'=>'Platform',          'type'=>'dimension'],
                ['key'=>'fiscal_year',    'label'=>'Fiscal Year',       'type'=>'dimension'],
                ['key'=>'line_type',      'label'=>'Line Type',         'type'=>'dimension'],
                ['key'=>'total_authorized','label'=>'Total Authorized ($)','type'=>'measure'],
                ['key'=>'total_obligated','label'=>'Total Obligated ($)','type'=>'measure','computed'=>true],
                ['key'=>'variance',       'label'=>'Variance ($)',       'type'=>'measure', 'computed'=>true],
                ['key'=>'obligation_rate','label'=>'Obligation Rate %', 'type'=>'measure', 'computed'=>true],
            ]],
            'software' => ['label'=>'Software Requests', 'fields'=>[
                ['key'=>'status',          'label'=>'Request Status',   'type'=>'dimension'],
                ['key'=>'tier',            'label'=>'Software Tier',    'type'=>'dimension'],
                ['key'=>'requested_by',    'label'=>'Requested By',     'type'=>'dimension'],
                ['key'=>'created_month',   'label'=>'Month Requested',  'type'=>'date'],
                ['key'=>'count',           'label'=>'Request Count',    'type'=>'measure'],
                ['key'=>'approval_rate',   'label'=>'Approval Rate %',  'type'=>'measure', 'computed'=>true],
                ['key'=>'avg_days_approve','label'=>'Avg Days to Approve','type'=>'measure','computed'=>true],
            ]],
        ]);
    }

    // ── Generic Query Engine ──────────────────────────────────────────

    /** @NoAdminRequired */
    public function genericData(): DataResponse {
        // x_source/y_source may differ (cross-source comparison)
        $xSource      = $this->request->getParam('x_source', $this->request->getParam('data_source', ''));
        $xField       = $this->request->getParam('x_field', '');
        $ySource      = $this->request->getParam('y_source', $this->request->getParam('data_source', ''));
        $yField       = $this->request->getParam('y_field', 'count');
        $scatterField = $this->request->getParam('scatter_field', ''); // 2nd measure for scatter X axis
        $timeRange    = $this->request->getParam('time_range', 'all');
        $platformId   = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $shopId       = $this->request->getParam('shop_id')     ? (int)$this->request->getParam('shop_id')     : null;
        $since        = $this->sinceDate($timeRange);

        if (!$ySource) return new DataResponse(['series' => [], 'error' => 'y_source required']);

        try {
            $series = $this->runGenericQuery($xSource ?: $ySource, $xField, $ySource, $yField, $scatterField, $since, $platformId, $shopId);
            return new DataResponse(['series' => $series, 'x_source' => $xSource, 'x_field' => $xField, 'y_source' => $ySource, 'y_field' => $yField, 'type' => 'bar']);
        } catch (\Throwable $e) {
            return new DataResponse(['series' => [], 'error' => $e->getMessage()]);
        }
    }

    // ── DB compatibility helpers ──────────────────────────────────────
    // PostgreSQL lacks DATE_FORMAT(), DATEDIFF(), and ROUND(float8, int).
    // These helpers return the right SQL for the current database platform.

    private ?bool $_isPg = null;
    private function isPg(): bool {
        if ($this->_isPg === null) {
            $this->_isPg = str_contains(
                strtolower(get_class($this->db->getDatabasePlatform())), 'postgre'
            );
        }
        return $this->_isPg;
    }

    private function sqlFmtMonth(string $col): string {
        return $this->isPg() ? "TO_CHAR($col,'YYYY-MM')" : "DATE_FORMAT($col,'%Y-%m')";
    }

    private function sqlFmtWeek(string $col): string {
        // ISO week: PostgreSQL IYYY-IW, MySQL %Y-W%u (both give sortable strings)
        return $this->isPg() ? "TO_CHAR($col,'IYYY-\"W\"IW')" : "DATE_FORMAT($col,'%Y-W%u')";
    }

    // Returns (end - start) in fractional days as a numeric expression.
    private function sqlDaysApart(string $end, string $start): string {
        return $this->isPg()
            ? "EXTRACT(EPOCH FROM (CAST($end AS TIMESTAMP)-CAST($start AS TIMESTAMP)))/86400"
            : "DATEDIFF($end,$start)";
    }

    // ROUND(expr, scale) that works on float columns in PostgreSQL.
    // CAST to DECIMAL(15,4) first — valid in both MySQL and PostgreSQL (alias for NUMERIC).
    private function sqlRound(string $expr, int $scale = 1): string {
        return "ROUND(CAST(($expr) AS DECIMAL(15,4)),$scale)";
    }

    private function sqlCastText(string $col): string {
        return $this->isPg() ? "CAST($col AS TEXT)" : "CAST($col AS CHAR)";
    }

    private function sqlConcat(string ...$parts): string {
        // Both MySQL and PostgreSQL 9.1+ support CONCAT(), but PG needs text args.
        // Use || concat for PG for safety when mixing types.
        if ($this->isPg()) {
            return implode("||", array_map(fn($p) => "CAST($p AS TEXT)", $parts));
        }
        return 'CONCAT(' . implode(',', $parts) . ')';
    }

    // ── Field expression maps ─────────────────────────────────────────

    private function xExpr(string $source, string $xField): ?string {
        $m = [
            'deficiencies.severity'        => 't.severity',
            'deficiencies.status'          => 't.status',
            'deficiencies.assigned_to'     => 't.assigned_to',
            'deficiencies.platform'        => "COALESCE(p.name,'Unknown')",
            'deficiencies.created_week'    => $this->sqlFmtWeek('t.created_at'),
            'deficiencies.created_month'   => $this->sqlFmtMonth('t.created_at'),
            'assets.name'                  => 't.name',
            'assets.platform'              => "COALESCE(p.name,'Unknown')",
            'assets.criticality'           => 't.criticality_code',
            'assets.status'                => 't.status',
            'assets.manufacturer'          => 't.manufacturer',
            'assets.install_month'         => $this->sqlFmtMonth('t.install_date'),
            'procedures.category'          => 't.category',
            'procedures.platform'          => "COALESCE(p.name,'Unknown')",
            'procedures.assigned_to'       => 't.assigned_to',
            'procedures.due_month'         => $this->sqlFmtMonth('t.next_due'),
            'fleet.hostname'               => 't.hostname',
            'fleet.status'                 => 't.status',
            'fleet.os_version'             => 't.os_version',
            'fleet.patch_state'            => "CASE WHEN t.pending_update=1 THEN 'Pending' ELSE 'Current' END",
            'cves.severity'                => 't.severity',
            'cves.node'                    => "COALESCE(n.hostname,'Unknown')",
            'cves.resolved'                => "CASE WHEN t.resolved=1 THEN 'Resolved' ELSE 'Open' END",
            'cves.scanned_week'            => $this->sqlFmtWeek('t.scanned_at'),
            'cves.scanned_month'           => $this->sqlFmtMonth('t.scanned_at'),
            'readiness.readiness_code'     => 't.readiness_code',
            'readiness.platform'           => "COALESCE(p.name,'Unknown')",
            'readiness.calc_week'          => $this->sqlFmtWeek('t.calculated_at'),
            'readiness.calc_month'         => $this->sqlFmtMonth('t.calculated_at'),
            'supply.status'                => 't.status',
            'supply.platform'              => "COALESCE(p.name,'Unknown')",
            'supply.priority'              => 't.priority',
            'supply.created_month'         => $this->sqlFmtMonth('t.created_at'),
            'modernizations.stage'         => 't.stage',
            'modernizations.platform'      => "COALESCE(p.name,'Unknown')",
            'modernizations.created_month' => $this->sqlFmtMonth('t.created_at'),
            'budget.platform'              => "COALESCE(p.name,'Unknown')",
            'budget.fiscal_year'           => $this->sqlCastText('t.fiscal_year'),
            'budget.line_type'             => 'l.line_type',
            'software.status'              => 't.status',
            'software.tier'                => $this->sqlConcat("'Tier '", 'c.tier'),
            'software.requested_by'        => 't.requested_by',
            'software.created_month'       => $this->sqlFmtMonth('t.created_at'),
        ];
        return $m["$source.$xField"] ?? null;
    }

    private function yExpr(string $source, string $yField): string {
        $m = [
            'deficiencies.count'               => 'COUNT(*)',
            'deficiencies.mttr'                => $this->sqlRound('AVG('.$this->sqlDaysApart('t.closed_at','t.created_at').')', 1),
            'deficiencies.avg_cost'            => $this->sqlRound('AVG(t.estimated_cost)', 2),
            'deficiencies.total_cost'          => $this->sqlRound('SUM(t.estimated_cost)', 2),
            'deficiencies.avg_mandays'         => $this->sqlRound('AVG(t.man_days)', 1),
            'deficiencies.open_count'          => "SUM(CASE WHEN t.status NOT IN ('closed','cancelled') THEN 1 ELSE 0 END)",
            'assets.count'                     => 'COUNT(*)',
            'assets.age_days'                  => $this->sqlRound('AVG('.$this->sqlDaysApart('NOW()','t.install_date').')', 0),
            'assets.days_to_warranty'          => $this->sqlRound('AVG('.$this->sqlDaysApart('t.warranty_expiry','NOW()').')', 0),
            'procedures.count'                 => 'COUNT(*)',
            'procedures.compliance_rate'       => "ROUND(100.0*SUM(CASE WHEN t.last_completed IS NOT NULL THEN 1 ELSE 0 END)/COUNT(*),1)",
            'procedures.overdue_count'         => "SUM(CASE WHEN t.next_due < NOW() THEN 1 ELSE 0 END)",
            'procedures.avg_hours'             => $this->sqlRound('AVG(t.actual_hours)', 1),
            'procedures.avg_parts_cost'        => $this->sqlRound('AVG(t.parts_cost)', 2),
            'fleet.count'                      => 'COUNT(*)',
            'fleet.avg_cpu'                    => $this->sqlRound('AVG(t.cpu_pct)', 1),
            'fleet.avg_memory'                 => $this->sqlRound('AVG(t.memory_pct)', 1),
            'fleet.avg_disk'                   => $this->sqlRound('AVG(t.disk_pct)', 1),
            'fleet.patch_rate'                 => "ROUND(100.0*SUM(CASE WHEN t.pending_update=0 THEN 1 ELSE 0 END)/COUNT(*),1)",
            'cves.count'                       => 'COUNT(*)',
            'cves.open_count'                  => "SUM(CASE WHEN t.resolved=0 THEN 1 ELSE 0 END)",
            'cves.critical_count'              => "SUM(CASE WHEN t.severity='CRITICAL' THEN 1 ELSE 0 END)",
            'cves.exposure_score'              => $this->sqlRound("SUM(CASE t.severity WHEN 'CRITICAL' THEN 10 WHEN 'HIGH' THEN 5 WHEN 'MEDIUM' THEN 2 ELSE 0.5 END)/2", 1),
            'readiness.count'                  => 'COUNT(*)',
            'readiness.avg_score'              => $this->sqlRound("AVG(CASE t.readiness_code WHEN 'FULL-OP' THEN 100 WHEN 'DEG-OP-MIN' THEN 75 WHEN 'DEG-OP-BEL' THEN 50 WHEN 'DOWN-MX' THEN 25 WHEN 'DOWN-OP' THEN 10 ELSE 0 END)", 1),
            'readiness.full_op_rate'           => "ROUND(100.0*SUM(CASE WHEN t.readiness_code='FULL-OP' THEN 1 ELSE 0 END)/COUNT(*),1)",
            'readiness.down_rate'              => "ROUND(100.0*SUM(CASE WHEN t.readiness_code LIKE 'DOWN%' THEN 1 ELSE 0 END)/COUNT(*),1)",
            'supply.count'                     => 'COUNT(*)',
            'supply.total_cost'                => $this->sqlRound('SUM(t.estimated_cost)', 2),
            'supply.avg_days_fill'             => $this->sqlRound('AVG('.$this->sqlDaysApart('t.received_at','t.created_at').')', 1),
            'modernizations.count'             => 'COUNT(*)',
            'modernizations.total_cost'        => $this->sqlRound('SUM(t.estimated_cost)', 2),
            'modernizations.avg_cost'          => $this->sqlRound('AVG(t.estimated_cost)', 2),
            'modernizations.completion_rate'   => "ROUND(100.0*SUM(CASE WHEN t.stage='complete' THEN 1 ELSE 0 END)/COUNT(*),1)",
            'budget.total_authorized'          => $this->sqlRound('SUM(t.total_authorized)', 2),
            'budget.total_obligated'           => $this->sqlRound('SUM(l.obligated_amount)', 2),
            'budget.variance'                  => $this->sqlRound('SUM(t.total_authorized)-SUM(l.obligated_amount)', 2),
            'budget.obligation_rate'           => "ROUND(100.0*SUM(l.obligated_amount)/NULLIF(SUM(t.total_authorized),0),1)",
            'software.count'                   => 'COUNT(*)',
            'software.approval_rate'           => "ROUND(100.0*SUM(CASE WHEN t.status='approved' THEN 1 ELSE 0 END)/COUNT(*),1)",
            'software.avg_days_approve'        => $this->sqlRound('AVG('.$this->sqlDaysApart('t.approved_at','t.created_at').')', 1),
        ];
        return $m["$source.$yField"] ?? 'COUNT(*)';
    }

    private function runGenericQuery(string $xSource, string $xField, string $ySource, string $yField, string $scatterField, ?string $since, ?int $platformId, ?int $shopId): array {
        if (!$xSource) $xSource = $ySource;

        $sourceMeta = [
            'deficiencies'  => ['table'=>'ops_deficiencies',    'time_col'=>'created_at',   'platform_col'=>'platform_id', 'shop_col'=>'shop_id'],
            'assets'        => ['table'=>'ops_assets',           'time_col'=>'install_date', 'platform_col'=>'platform_id', 'shop_col'=>'shop_id'],
            'procedures'    => ['table'=>'ops_procedures',       'time_col'=>'next_due',     'platform_col'=>null,          'shop_col'=>null],
            'fleet'         => ['table'=>'ops_altofleet_nodes',  'time_col'=>'last_seen',    'platform_col'=>null,          'shop_col'=>null],
            'cves'          => ['table'=>'ops_cve_scan_results', 'time_col'=>'scanned_at',   'platform_col'=>null,          'shop_col'=>null],
            'readiness'     => ['table'=>'ops_asset_readiness',  'time_col'=>'calculated_at','platform_col'=>null,          'shop_col'=>null],
            'supply'        => ['table'=>'ops_supply_requests',  'time_col'=>'created_at',   'platform_col'=>'platform_id', 'shop_col'=>null],
            'modernizations'=> ['table'=>'ops_modernizations',   'time_col'=>'created_at',   'platform_col'=>'platform_id', 'shop_col'=>null],
            'budget'        => ['table'=>'ops_mmbp_budgets',     'time_col'=>null,            'platform_col'=>'platform_id', 'shop_col'=>null],
            'software'      => ['table'=>'ops_software_requests','time_col'=>'created_at',   'platform_col'=>null,          'shop_col'=>null],
        ];

        // Cross-source join definitions — keyed "xSource|ySource" (ASCII pipe)
        // fk/pk are raw SQL column references; platform_col/shop_col are on the xj alias
        $crossJoins = [
            'assets|deficiencies' => ['table'=>'ops_assets',          'fk'=>'t.asset_id', 'pk'=>'xj.id', 'platform_col'=>'platform_id', 'shop_col'=>'shop_id'],
            'assets|procedures'   => ['table'=>'ops_assets',          'fk'=>'t.asset_id', 'pk'=>'xj.id', 'platform_col'=>'platform_id', 'shop_col'=>'shop_id'],
            'assets|readiness'    => ['table'=>'ops_assets',          'fk'=>'t.asset_id', 'pk'=>'xj.id', 'platform_col'=>'platform_id', 'shop_col'=>'shop_id'],
            'fleet|cves'          => ['table'=>'ops_altofleet_nodes', 'fk'=>'t.node_id',  'pk'=>'xj.id', 'platform_col'=>null,           'shop_col'=>null],
        ];

        // X expressions for cross-source queries — use 'xj' alias for joined x-table.
        // Platform name uses 'xp' alias (a second JOIN ops_platforms on xj.platform_id).
        $crossXExprs = [
            'assets.name'          => 'xj.name',
            'assets.platform'      => "COALESCE(xp.name,'Unknown')",
            'assets.criticality'   => 'xj.criticality_code',
            'assets.status'        => 'xj.status',
            'assets.manufacturer'  => 'xj.manufacturer',
            'assets.install_month' => $this->sqlFmtMonth('xj.install_date'),
            'fleet.hostname'       => 'xj.hostname',
            'fleet.os_version'     => 'xj.os_version',
            'fleet.status'         => 'xj.status',
            'fleet.patch_state'    => "CASE WHEN xj.pending_update=1 THEN 'Pending' ELSE 'Current' END",
        ];

        if (!isset($sourceMeta[$ySource])) throw new \InvalidArgumentException("Unknown source: $ySource");
        $meta = $sourceMeta[$ySource];

        $crossKey  = $xSource.'|'.$ySource;
        $isCross   = ($xSource !== $ySource);
        $crossJoin = $isCross ? ($crossJoins[$crossKey] ?? null) : null;

        if ($isCross && !$crossJoin) {
            throw new \InvalidArgumentException("No join path from $xSource to $ySource. Try selecting X and Y from the same source.");
        }

        // Resolve X/Y expressions
        $xExpr = $isCross
            ? ($crossXExprs["$xSource.$xField"] ?? $this->xExpr($xSource, $xField) ?? null)
            : ($this->xExpr($ySource, $xField) ?? null);

        if (!$xExpr) throw new \InvalidArgumentException("Unknown field '$xField' for source '$xSource'.");

        $yExpr       = $this->yExpr($ySource, $yField);
        $scatterExpr = $scatterField ? ($this->yExpr($ySource, $scatterField) ?: null) : null;
        $allExprs    = $xExpr . $yExpr . ($scatterExpr ?? '');

        // Use IQueryBuilder so Nextcloud applies the configured table prefix automatically.
        // Pass $xExpr as a plain string to groupBy()/orderBy() — not createFunction() —
        // because quoteAlias(string) rejects non-string objects under strict_types=1.
        // quoteAlias() detects '(' / '.' in the expression and leaves it unquoted.
        $qb = $this->db->getQueryBuilder();

        $selects = [
            $qb->createFunction("$xExpr AS grp"),
            $qb->createFunction("$yExpr AS val"),
        ];
        if ($scatterExpr) $selects[] = $qb->createFunction("$scatterExpr AS x_val");

        $qb->select(...$selects)
           ->from($meta['table'], 't')
           ->groupBy($xExpr)
           ->orderBy($xExpr, 'ASC')
           ->setMaxResults(1000);

        // Cross-source LEFT JOIN (LEFT keeps unlinked y-rows, grouped as '—')
        if ($crossJoin) {
            $qb->leftJoin('t', $crossJoin['table'], 'xj',
                $qb->expr()->eq($crossJoin['fk'], $crossJoin['pk']));
            // Platform name for cross-source x expressions uses alias 'xp' (xj → platforms)
            if (str_contains($allExprs, 'xp.name') && !empty($crossJoin['platform_col'])) {
                $qb->leftJoin('xj', 'ops_platforms', 'xp',
                    $qb->expr()->eq('xj.'.$crossJoin['platform_col'], 'xp.id'));
            }
        }

        // Supplemental joins for same-source queries
        if (!$isCross) {
            if (str_contains($allExprs, 'p.name') && $meta['platform_col']) {
                $qb->leftJoin('t', 'ops_platforms', 'p',
                    $qb->expr()->eq('t.'.$meta['platform_col'], 'p.id'));
            }
            if ($ySource === 'cves' && str_contains($allExprs, 'n.hostname')) {
                $qb->leftJoin('t', 'ops_altofleet_nodes', 'n',
                    $qb->expr()->eq('t.node_id', 'n.id'));
            }
        }
        if ($ySource === 'budget') {
            $qb->leftJoin('t', 'ops_mmbp_lines', 'l',
                $qb->expr()->eq('l.budget_id', 't.id'));
        }
        if ($ySource === 'software' && str_contains($allExprs, 'c.tier')) {
            $qb->leftJoin('t', 'ops_software_catalog', 'c',
                $qb->expr()->eq('t.catalog_id', 'c.id'));
        }

        // Time filter — always on y-source main table
        if ($since && $meta['time_col']) {
            $qb->andWhere($qb->expr()->gte('t.'.$meta['time_col'],
                $qb->createNamedParameter($since)));
        }

        // Scope filter: cross-source → filter on xj columns; same-source → filter on t columns
        if ($isCross && $crossJoin) {
            if ($platformId && !empty($crossJoin['platform_col'])) {
                $qb->andWhere($qb->expr()->eq('xj.'.$crossJoin['platform_col'],
                    $qb->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
            }
            if ($shopId && !empty($crossJoin['shop_col'])) {
                $qb->andWhere($qb->expr()->eq('xj.'.$crossJoin['shop_col'],
                    $qb->createNamedParameter($shopId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
            }
        } else {
            if ($platformId && $meta['platform_col']) {
                $qb->andWhere($qb->expr()->eq('t.'.$meta['platform_col'],
                    $qb->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
            }
            if ($shopId && $meta['shop_col']) {
                $qb->andWhere($qb->expr()->eq('t.'.$meta['shop_col'],
                    $qb->createNamedParameter($shopId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
            }
        }

        $rows = $qb->executeQuery()->fetchAllAssociative();
        return array_map(function($r) use ($scatterExpr) {
            $item = ['label' => (string)($r['grp'] ?? '—'), 'value' => round((float)($r['val'] ?? 0), 2)];
            if ($scatterExpr) $item['x_val'] = round((float)($r['x_val'] ?? 0), 2);
            return $item;
        }, $rows);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function sinceDate(string $range): ?string {
        return match($range) {
            '7d'  => (new \DateTime('-7 days'))->format('Y-m-d H:i:s'),
            '30d' => (new \DateTime('-30 days'))->format('Y-m-d H:i:s'),
            '90d' => (new \DateTime('-90 days'))->format('Y-m-d H:i:s'),
            '1y'  => (new \DateTime('-1 year'))->format('Y-m-d H:i:s'),
            default => null,
        };
    }
}
