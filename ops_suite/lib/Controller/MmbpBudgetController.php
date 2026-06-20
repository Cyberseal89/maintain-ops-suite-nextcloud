<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\MmbpBudget;
use OCA\OpsSuite\Db\MmbpBudgetMapper;
use OCA\OpsSuite\Db\MmbpLine;
use OCA\OpsSuite\Db\MmbpLineMapper;
use OCA\OpsSuite\Db\WorkPackageMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IDBConnection;
use OCP\IRequest;

class MmbpBudgetController extends Controller {
    public function __construct(
        string                     $appName,
        IRequest                   $request,
        private readonly MmbpBudgetMapper  $mapper,
        private readonly MmbpLineMapper    $lineMapper,
        private readonly WorkPackageMapper $wpMapper,
        private readonly PermissionService $permission,
        private readonly IDBConnection     $db
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * GET /api/budget/summary — aggregate funded/UFR costs from deficiencies, supply requests, modernizations
     */
    public function summary(): DataResponse {
        $platformId = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $fiscalYear = $this->request->getParam('fiscal_year') ? (int)$this->request->getParam('fiscal_year') : null;

        $result = ['deficiencies' => [], 'supply_requests' => [], 'modernizations' => [], 'work_packages' => []];

        // Deficiencies
        $qb = $this->db->getQueryBuilder();
        $qb->select('budget_status', 'platform_id',
                    $qb->createFunction('SUM(est_parts_cost + est_labor_cost) AS total_cost'),
                    $qb->createFunction('COUNT(*) AS record_count'))
           ->from('ops_deficiencies')
           ->where($qb->expr()->neq('budget_status', $qb->createNamedParameter('unbudgeted')))
           ->andWhere($qb->expr()->isNotNull('budget_fiscal_year'));
        if ($platformId) $qb->andWhere($qb->expr()->eq('platform_id', $qb->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb->andWhere($qb->expr()->eq('budget_fiscal_year', $qb->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        $qb->groupBy('budget_status', 'platform_id');
        $rows = $qb->executeQuery()->fetchAllAssociative();
        foreach ($rows as $r) {
            $result['deficiencies'][] = [
                'budget_status' => $r['budget_status'],
                'platform_id'   => $r['platform_id'],
                'total_cost'    => (float)$r['total_cost'],
                'count'         => (int)$r['record_count'],
            ];
        }

        // Supply requests (join to line items for cost)
        $qb2 = $this->db->getQueryBuilder();
        $qb2->select('sr.budget_status', 'sr.platform_id', 'sr.shop_id',
                     $qb2->createFunction('SUM(sri.quantity * sri.unit_cost) AS total_cost'),
                     $qb2->createFunction('COUNT(DISTINCT sr.id) AS record_count'))
            ->from('ops_supply_requests', 'sr')
            ->join('sr', 'ops_supply_request_items', 'sri', $qb2->expr()->eq('sr.id', 'sri.supply_request_id'))
            ->where($qb2->expr()->neq('sr.budget_status', $qb2->createNamedParameter('unbudgeted')))
            ->andWhere($qb2->expr()->isNotNull('sr.budget_fiscal_year'));
        if ($platformId) $qb2->andWhere($qb2->expr()->eq('sr.platform_id', $qb2->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb2->andWhere($qb2->expr()->eq('sr.budget_fiscal_year', $qb2->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        $qb2->groupBy('sr.budget_status', 'sr.platform_id', 'sr.shop_id');
        $rows2 = $qb2->executeQuery()->fetchAllAssociative();
        foreach ($rows2 as $r) {
            $result['supply_requests'][] = [
                'budget_status' => $r['budget_status'],
                'platform_id'   => $r['platform_id'],
                'shop_id'       => $r['shop_id'],
                'total_cost'    => (float)$r['total_cost'],
                'count'         => (int)$r['record_count'],
            ];
        }

        // Modernizations
        $qb3 = $this->db->getQueryBuilder();
        $qb3->select('budget_status', 'platform_id', 'shop_id',
                     $qb3->createFunction('SUM(est_parts_cost + est_labor_cost + est_contractor_cost) AS total_cost'),
                     $qb3->createFunction('COUNT(*) AS record_count'))
            ->from('ops_modernizations')
            ->where($qb3->expr()->neq('budget_status', $qb3->createNamedParameter('unbudgeted')))
            ->andWhere($qb3->expr()->isNotNull('budget_fiscal_year'));
        if ($platformId) $qb3->andWhere($qb3->expr()->eq('platform_id', $qb3->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb3->andWhere($qb3->expr()->eq('budget_fiscal_year', $qb3->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        $qb3->groupBy('budget_status', 'platform_id', 'shop_id');
        $rows3 = $qb3->executeQuery()->fetchAllAssociative();
        foreach ($rows3 as $r) {
            $result['modernizations'][] = [
                'budget_status' => $r['budget_status'],
                'platform_id'   => $r['platform_id'],
                'shop_id'       => $r['shop_id'],
                'total_cost'    => (float)$r['total_cost'],
                'count'         => (int)$r['record_count'],
            ];
        }

        // Work packages — awarded status counts as funded obligation
        $qb4 = $this->db->getQueryBuilder();
        $qb4->select('platform_id',
                     $qb4->createFunction('SUM(award_amount) AS total_cost'),
                     $qb4->createFunction('COUNT(*) AS record_count'))
            ->from('ops_work_packages')
            ->where($qb4->expr()->eq('status', $qb4->createNamedParameter('awarded')))
            ->andWhere($qb4->expr()->isNotNull('award_amount'));
        if ($platformId) $qb4->andWhere($qb4->expr()->eq('platform_id', $qb4->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) {
            // Use award_date year; filter rows where YEAR(award_date) = fiscalYear
            $qb4->andWhere($qb4->expr()->like('award_date', $qb4->createNamedParameter($fiscalYear.'-%')));
        }
        $qb4->groupBy('platform_id');
        $rows4 = $qb4->executeQuery()->fetchAllAssociative();
        foreach ($rows4 as $r) {
            $result['work_packages'][] = [
                'budget_status' => 'funded',
                'platform_id'   => $r['platform_id'],
                'shop_id'       => null,
                'total_cost'    => (float)$r['total_cost'],
                'count'         => (int)$r['record_count'],
            ];
        }

        return new DataResponse($result);
    }

    /**
     * @NoAdminRequired
     * GET /api/budget/drilldown — individual records for a budget cell
     */
    public function drilldown(): DataResponse {
        $platformId  = $this->request->getParam('platform_id')  ? (int)$this->request->getParam('platform_id')  : null;
        $shopId      = $this->request->getParam('shop_id')      ? (int)$this->request->getParam('shop_id')      : null;
        $fiscalYear  = $this->request->getParam('fiscal_year')  ? (int)$this->request->getParam('fiscal_year')  : null;
        $budgetStatus= $this->request->getParam('budget_status') ?: null;

        $items = [];

        // Deficiencies
        $qb = $this->db->getQueryBuilder();
        $qb->select('d.id', 'd.summary AS title', 'd.severity', 'd.budget_status', 'd.budget_fiscal_year', 'd.status AS record_status',
                    $qb->createFunction('(d.est_parts_cost + d.est_labor_cost) AS cost'))
           ->from('ops_deficiencies', 'd');
        if ($platformId) $qb->andWhere($qb->expr()->eq('d.platform_id', $qb->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb->andWhere($qb->expr()->eq('d.budget_fiscal_year', $qb->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($budgetStatus) $qb->andWhere($qb->expr()->eq('d.budget_status', $qb->createNamedParameter($budgetStatus)));
        else $qb->andWhere($qb->expr()->neq('d.budget_status', $qb->createNamedParameter('unbudgeted')))->andWhere($qb->expr()->isNotNull('d.budget_fiscal_year'));
        $qb->orderBy('d.severity', 'ASC');
        foreach ($qb->executeQuery()->fetchAllAssociative() as $r) {
            $items[] = ['record_type' => 'deficiency', 'id' => (int)$r['id'], 'title' => $r['title'], 'detail' => $r['severity'], 'cost' => (float)$r['cost'], 'status' => $r['record_status'], 'nav_route' => 'def-detail', 'nav_param' => $r['id']];
        }

        // Supply requests
        $qb2 = $this->db->getQueryBuilder();
        $qb2->select('sr.id', 'sr.title', 'sr.status AS record_status', 'sr.budget_status', 'sr.budget_fiscal_year',
                     $qb2->createFunction('SUM(sri.quantity * sri.unit_cost) AS cost'))
            ->from('ops_supply_requests', 'sr')
            ->join('sr', 'ops_supply_request_items', 'sri', $qb2->expr()->eq('sr.id', 'sri.supply_request_id'));
        if ($platformId) $qb2->andWhere($qb2->expr()->eq('sr.platform_id', $qb2->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($shopId)     $qb2->andWhere($qb2->expr()->eq('sr.shop_id', $qb2->createNamedParameter($shopId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb2->andWhere($qb2->expr()->eq('sr.budget_fiscal_year', $qb2->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($budgetStatus) $qb2->andWhere($qb2->expr()->eq('sr.budget_status', $qb2->createNamedParameter($budgetStatus)));
        else $qb2->andWhere($qb2->expr()->neq('sr.budget_status', $qb2->createNamedParameter('unbudgeted')))->andWhere($qb2->expr()->isNotNull('sr.budget_fiscal_year'));
        $qb2->groupBy('sr.id', 'sr.title', 'sr.status', 'sr.budget_status', 'sr.budget_fiscal_year');
        foreach ($qb2->executeQuery()->fetchAllAssociative() as $r) {
            $items[] = ['record_type' => 'supply_request', 'id' => (int)$r['id'], 'title' => $r['title'], 'detail' => 'SR', 'cost' => (float)$r['cost'], 'status' => $r['record_status'], 'nav_route' => 'supply-detail', 'nav_param' => (int)$r['id']];
        }

        // Modernizations
        $qb3 = $this->db->getQueryBuilder();
        $qb3->select('id', 'title', 'status AS record_status', 'budget_status', 'budget_fiscal_year',
                     $qb3->createFunction('(est_parts_cost + est_labor_cost + est_contractor_cost) AS cost'))
            ->from('ops_modernizations');
        if ($platformId) $qb3->andWhere($qb3->expr()->eq('platform_id', $qb3->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($shopId)     $qb3->andWhere($qb3->expr()->eq('shop_id', $qb3->createNamedParameter($shopId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb3->andWhere($qb3->expr()->eq('budget_fiscal_year', $qb3->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($budgetStatus) $qb3->andWhere($qb3->expr()->eq('budget_status', $qb3->createNamedParameter($budgetStatus)));
        else $qb3->andWhere($qb3->expr()->neq('budget_status', $qb3->createNamedParameter('unbudgeted')))->andWhere($qb3->expr()->isNotNull('budget_fiscal_year'));
        foreach ($qb3->executeQuery()->fetchAllAssociative() as $r) {
            $items[] = ['record_type' => 'modernization', 'id' => (int)$r['id'], 'title' => $r['title'], 'detail' => 'Mod', 'cost' => (float)$r['cost'], 'status' => $r['record_status'], 'nav_route' => 'mod-detail', 'nav_param' => $r['id']];
        }

        // Work packages (awarded = funded obligation)
        if (!$budgetStatus || $budgetStatus === 'funded') {
            $wps = $this->wpMapper->findAwarded($platformId);
            foreach ($wps as $wp) {
                $row = $wp->jsonSerialize();
                $items[] = ['record_type' => 'work_package', 'id' => $row['id'], 'title' => $row['name'] ?? ('WP #'.$row['id']), 'detail' => 'WP', 'cost' => (float)($row['award_amount'] ?? 0), 'status' => 'awarded', 'nav_route' => 'wp-detail', 'nav_param' => $row['id']];
            }
        }

        usort($items, fn($a, $b) => ($b['cost'] ?? 0) <=> ($a['cost'] ?? 0));
        return new DataResponse(['items' => $items]);
    }

    /**
     * @NoAdminRequired
     * GET /api/budget/ufr-export — returns all UFR-tagged records for export
     */
    public function ufrExport(): DataResponse {
        $platformId = $this->request->getParam('platform_id') ? (int)$this->request->getParam('platform_id') : null;
        $fiscalYear = $this->request->getParam('fiscal_year') ? (int)$this->request->getParam('fiscal_year') : null;

        $result = ['fiscal_year' => $fiscalYear, 'platform_id' => $platformId, 'items' => [], 'total_ufr' => 0.0];

        // Deficiencies UFR
        $qb = $this->db->getQueryBuilder();
        $qb->select('d.id', 'd.summary', 'd.severity', 'd.platform_id', 'd.budget_fiscal_year',
                    $qb->createFunction('(d.est_parts_cost + d.est_labor_cost) AS cost'))
           ->from('ops_deficiencies', 'd')
           ->where($qb->expr()->eq('d.budget_status', $qb->createNamedParameter('ufr')));
        if ($platformId) $qb->andWhere($qb->expr()->eq('d.platform_id', $qb->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb->andWhere($qb->expr()->eq('d.budget_fiscal_year', $qb->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        $rows = $qb->executeQuery()->fetchAllAssociative();
        foreach ($rows as $r) {
            $cost = (float)$r['cost'];
            $result['items'][] = ['type' => 'deficiency', 'id' => (int)$r['id'], 'title' => $r['summary'], 'severity' => $r['severity'], 'platform_id' => $r['platform_id'], 'fiscal_year' => $r['budget_fiscal_year'], 'estimated_cost' => $cost];
            $result['total_ufr'] += $cost;
        }

        // Supply requests UFR
        $qb2 = $this->db->getQueryBuilder();
        $qb2->select('sr.id', 'sr.title', 'sr.platform_id', 'sr.shop_id', 'sr.budget_fiscal_year',
                     $qb2->createFunction('SUM(sri.quantity * sri.unit_cost) AS cost'))
            ->from('ops_supply_requests', 'sr')
            ->join('sr', 'ops_supply_request_items', 'sri', $qb2->expr()->eq('sr.id', 'sri.supply_request_id'))
            ->where($qb2->expr()->eq('sr.budget_status', $qb2->createNamedParameter('ufr')))
            ->groupBy('sr.id', 'sr.title', 'sr.platform_id', 'sr.shop_id', 'sr.budget_fiscal_year');
        if ($platformId) $qb2->andWhere($qb2->expr()->eq('sr.platform_id', $qb2->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb2->andWhere($qb2->expr()->eq('sr.budget_fiscal_year', $qb2->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        $rows2 = $qb2->executeQuery()->fetchAllAssociative();
        foreach ($rows2 as $r) {
            $cost = (float)$r['cost'];
            $result['items'][] = ['type' => 'supply_request', 'id' => (int)$r['id'], 'title' => $r['title'], 'platform_id' => $r['platform_id'], 'shop_id' => $r['shop_id'], 'fiscal_year' => $r['budget_fiscal_year'], 'estimated_cost' => $cost];
            $result['total_ufr'] += $cost;
        }

        // Modernizations UFR
        $qb3 = $this->db->getQueryBuilder();
        $qb3->select('id', 'title', 'platform_id', 'shop_id', 'budget_fiscal_year',
                     $qb3->createFunction('(est_parts_cost + est_labor_cost + est_contractor_cost) AS cost'))
            ->from('ops_modernizations')
            ->where($qb3->expr()->eq('budget_status', $qb3->createNamedParameter('ufr')));
        if ($platformId) $qb3->andWhere($qb3->expr()->eq('platform_id', $qb3->createNamedParameter($platformId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        if ($fiscalYear) $qb3->andWhere($qb3->expr()->eq('budget_fiscal_year', $qb3->createNamedParameter($fiscalYear, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)));
        $rows3 = $qb3->executeQuery()->fetchAllAssociative();
        foreach ($rows3 as $r) {
            $cost = (float)$r['cost'];
            $result['items'][] = ['type' => 'modernization', 'id' => (int)$r['id'], 'title' => $r['title'], 'platform_id' => $r['platform_id'], 'shop_id' => $r['shop_id'], 'fiscal_year' => $r['budget_fiscal_year'], 'estimated_cost' => $cost];
            $result['total_ufr'] += $cost;
        }

        usort($result['items'], fn($a, $b) => ($b['estimated_cost'] ?? 0) <=> ($a['estimated_cost'] ?? 0));
        return new DataResponse($result);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $platformId  = $this->request->getParam('platform_id')  ? (int)$this->request->getParam('platform_id')  : null;
        $shopId      = $this->request->getParam('shop_id')      ? (int)$this->request->getParam('shop_id')      : null;
        $fiscalYear  = $this->request->getParam('fiscal_year')  ? (int)$this->request->getParam('fiscal_year')  : null;
        $entryType   = $this->request->getParam('entry_type')   ?: null;
        $rows = $this->mapper->findAll($platformId, $shopId, $fiscalYear, $entryType);
        return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $rows));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            return new DataResponse($this->mapper->find($id)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        $entry = new MmbpBudget();
        $entry->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $entry->setShopId(isset($data['shop_id']) && $data['shop_id'] ? (int)$data['shop_id'] : null);
        $entry->setFiscalYear((int)($data['fiscal_year'] ?? date('Y')));
        $entry->setEntryType($data['entry_type'] ?? ($entry->getShopId() ? 'shop' : 'platform'));
        $entry->setTotalAuthorized((string)($data['total_authorized'] ?? '0'));
        $entry->setFundedObligation((string)($data['funded_obligation'] ?? '0'));
        $entry->setUfrAmount((string)($data['ufr_amount'] ?? '0'));
        $entry->setNotes($data['notes'] ?? null);
        $entry->setCreatedAt($now);
        $entry->setUpdatedAt($now);

        $created = $this->mapper->insert($entry);
        return new DataResponse($created->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $entry = $this->mapper->find($id);
            $data  = $this->request->getParams();

            if (array_key_exists('platform_id',       $data)) $entry->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
            if (array_key_exists('shop_id',           $data)) $entry->setShopId($data['shop_id'] ? (int)$data['shop_id'] : null);
            if (array_key_exists('fiscal_year',       $data)) $entry->setFiscalYear((int)$data['fiscal_year']);
            if (array_key_exists('entry_type',        $data)) $entry->setEntryType($data['entry_type']);
            if (array_key_exists('total_authorized',  $data)) $entry->setTotalAuthorized((string)$data['total_authorized']);
            if (array_key_exists('funded_obligation', $data)) $entry->setFundedObligation((string)$data['funded_obligation']);
            if (array_key_exists('ufr_amount',        $data)) $entry->setUfrAmount((string)$data['ufr_amount']);
            if (array_key_exists('notes',             $data)) $entry->setNotes($data['notes'] ?: null);
            $entry->setUpdatedAt(date('Y-m-d H:i:s'));

            return new DataResponse($this->mapper->update($entry)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->lineMapper->deleteByBudget($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Budget line items ─────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexLines(int $id): DataResponse {
        $lines = $this->lineMapper->findByBudget($id);
        return new DataResponse(array_map(fn($l) => $l->jsonSerialize(), $lines));
    }

    /** @NoAdminRequired */
    public function createLine(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        $line = new MmbpLine();
        $line->setBudgetId($id);
        $line->setLineType($data['line_type'] ?? 'other');
        $line->setDescription($data['description'] ?? '');
        $line->setAuthorizedAmount((float)($data['authorized_amount'] ?? 0));
        $line->setObligatedAmount((float)($data['obligated_amount'] ?? 0));
        $line->setUfrAmount((float)($data['ufr_amount'] ?? 0));
        $line->setNotes($data['notes'] ?: null);
        $line->setCreatedAt($now);
        $line->setUpdatedAt($now);

        return new DataResponse($this->lineMapper->insert($line)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateLine(int $id, int $lineId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $line = $this->lineMapper->find($lineId);
            $data = $this->request->getParams();

            if (array_key_exists('line_type',         $data)) $line->setLineType($data['line_type']);
            if (array_key_exists('description',       $data)) $line->setDescription($data['description'] ?? '');
            if (array_key_exists('authorized_amount', $data)) $line->setAuthorizedAmount((float)$data['authorized_amount']);
            if (array_key_exists('obligated_amount',  $data)) $line->setObligatedAmount((float)$data['obligated_amount']);
            if (array_key_exists('ufr_amount',        $data)) $line->setUfrAmount((float)$data['ufr_amount']);
            if (array_key_exists('notes',             $data)) $line->setNotes($data['notes'] ?: null);
            $line->setUpdatedAt(date('Y-m-d H:i:s'));

            return new DataResponse($this->lineMapper->update($line)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroyLine(int $id, int $lineId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->lineMapper->delete($this->lineMapper->find($lineId));
            return new DataResponse(['deleted' => $lineId]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
