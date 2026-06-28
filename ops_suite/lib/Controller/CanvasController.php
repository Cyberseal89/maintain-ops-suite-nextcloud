<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Canvas;
use OCA\OpsSuite\Db\CanvasMapper;
use OCA\OpsSuite\Db\Document;
use OCA\OpsSuite\Db\DocumentMapper;
use OCA\OpsSuite\Db\DocumentRevision;
use OCA\OpsSuite\Db\DocumentRevisionMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IDBConnection;
use OCP\IRequest;
use OCP\IUserSession;

class CanvasController extends Controller {

    public function __construct(
        string                           $appName,
        IRequest                         $request,
        private readonly CanvasMapper            $mapper,
        private readonly DocumentMapper          $docMapper,
        private readonly DocumentRevisionMapper  $revMapper,
        private readonly PermissionService       $permission,
        private readonly IUserSession            $userSession,
        private readonly IDBConnection           $db,
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $platformId  = $this->request->getParam('platform_id')  ? (int)$this->request->getParam('platform_id')  : null;
        $shopId      = $this->request->getParam('shop_id')       ? (int)$this->request->getParam('shop_id')       : null;
        $canvasType  = $this->request->getParam('canvas_type')  ?: null;
        $canvases = $this->mapper->findAll($platformId, $canvasType, $shopId);
        return new DataResponse(array_map(fn($c) => $c->jsonSerialize(), $canvases));
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
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $canvas = new Canvas();
        $canvas->setName($data['name'] ?? '');
        $canvas->setCanvasType($data['canvas_type'] ?? 'custom');
        $canvas->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $canvas->setShopId(isset($data['shop_id']) && $data['shop_id'] ? (int)$data['shop_id'] : null);
        $canvas->setSystemAssetId(isset($data['system_asset_id']) && $data['system_asset_id'] ? (int)$data['system_asset_id'] : null);
        $canvas->setCanvasData($data['canvas_data'] ?? null);
        $canvas->setVersion($data['version'] ?? 'A');
        $canvas->setIsLive((bool)($data['is_live'] ?? false));
        $canvas->setCreatedBy($uid);
        $canvas->setCreatedAt($now);
        $canvas->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($canvas)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $canvas = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();

        if (array_key_exists('name', $data))            $canvas->setName($data['name']);
        if (array_key_exists('canvas_type', $data))     $canvas->setCanvasType($data['canvas_type']);
        if (array_key_exists('platform_id', $data))     $canvas->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('shop_id', $data))         $canvas->setShopId($data['shop_id'] ? (int)$data['shop_id'] : null);
        if (array_key_exists('system_asset_id', $data)) $canvas->setSystemAssetId($data['system_asset_id'] ? (int)$data['system_asset_id'] : null);
        if (array_key_exists('canvas_data', $data))     $canvas->setCanvasData($data['canvas_data'] ?: null);
        if (array_key_exists('version', $data))         $canvas->setVersion($data['version']);
        if (array_key_exists('is_live', $data))         $canvas->setIsLive((bool)$data['is_live']);

        $canvas->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($canvas)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /**
     * @NoAdminRequired
     * GET /api/canvases/{id}/status — live status for all asset_ids on this canvas
     * Returns: { "asset_id": { sev: int|null, sev_count: int, loto: bool, overdue: bool } }
     */
    public function status(int $id): DataResponse {
        try {
            $canvas = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse([], Http::STATUS_NOT_FOUND);
        }

        $data = $canvas->getCanvasData();
        if (!$data) return new DataResponse([]);
        $cd = json_decode($data, true);
        $assetIds = array_values(array_unique(array_filter(
            array_map(fn($n) => isset($n['asset_id']) ? (int)$n['asset_id'] : null, $cd['nodes'] ?? [])
        )));
        if (!$assetIds) return new DataResponse([]);

        $result = [];
        foreach ($assetIds as $aid) {
            $result[$aid] = ['sev' => null, 'sev_count' => 0, 'loto' => false, 'overdue' => false];
        }

        // Deficiencies: open, grouped by asset_id
        $qb = $this->db->getQueryBuilder();
        $qb->select('asset_id', $qb->createFunction('MIN(severity) AS min_sev'), $qb->createFunction('COUNT(*) AS cnt'))
           ->from('ops_deficiencies')
           ->where($qb->expr()->in('asset_id', $qb->createNamedParameter($assetIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)))
           ->andWhere($qb->expr()->notIn('status', $qb->createNamedParameter(['closed','resolved'], \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_STR_ARRAY)))
           ->groupBy('asset_id');
        foreach ($qb->executeQuery()->fetchAllAssociative() as $row) {
            $aid = (int)$row['asset_id'];
            if (isset($result[$aid])) {
                $result[$aid]['sev']       = (int)substr($row['min_sev'], 4);
                $result[$aid]['sev_count'] = (int)$row['cnt'];
            }
        }

        // LOTO: active sessions linked to assets
        $qb2 = $this->db->getQueryBuilder();
        $qb2->select('asset_id')->from('ops_loto_sessions')
            ->where($qb2->expr()->in('asset_id', $qb2->createNamedParameter($assetIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)))
            ->andWhere($qb2->expr()->isNull('released_at'))
            ->groupBy('asset_id');
        foreach ($qb2->executeQuery()->fetchAllAssociative() as $row) {
            $aid = (int)$row['asset_id'];
            if (isset($result[$aid])) $result[$aid]['loto'] = true;
        }

        // Verification overdue: last_verified_at > 548 days ago or never verified
        $threshold = date('Y-m-d H:i:s', strtotime('-548 days'));
        $qb3 = $this->db->getQueryBuilder();
        $qb3->select('id', 'last_verified_at')->from('ops_assets')
            ->where($qb3->expr()->in('id', $qb3->createNamedParameter($assetIds, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT_ARRAY)));
        foreach ($qb3->executeQuery()->fetchAllAssociative() as $row) {
            $aid = (int)$row['id'];
            if (!isset($result[$aid])) continue;
            $lv = $row['last_verified_at'];
            $result[$aid]['overdue'] = (!$lv || $lv < $threshold);
        }

        return new DataResponse($result);
    }

    /**
     * @NoAdminRequired
     * POST /api/canvases/{id}/publish
     * Creates or updates a MIL-STD drawing document in the Doc Registry
     * and stamps a revision on it. Clears revision_required on the canvas.
     */
    public function publish(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $canvas = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data     = $this->request->getParams();
        $now      = date('Y-m-d H:i:s');
        $uid      = $this->userSession->getUser()?->getUID() ?? '';
        $revLabel = trim($data['revision'] ?? 'A') ?: 'A';
        $changeDesc = $data['change_desc'] ?? 'Initial publish';
        $baseline   = $data['baseline'] ?? null;

        $typeLabels = [
            'network'  => 'Network Topology',
            'hvac'     => 'HVAC/Mechanical Schematic',
            'power'    => 'Power One-Line Diagram',
            'rf'       => 'RF/Signal Flow Diagram',
            'physical' => 'Physical Layout Drawing',
            'custom'   => 'System Block Diagram',
        ];
        $typeLabel = $typeLabels[$canvas->getCanvasType()] ?? 'System Drawing';

        // Create or fetch the linked drawing document
        if ($canvas->getDrawingDocId()) {
            try {
                $doc = $this->docMapper->find($canvas->getDrawingDocId());
            } catch (DoesNotExistException) {
                $doc = null;
            }
        } else {
            $doc = null;
        }

        if ($doc === null) {
            $doc = new Document();
            $doc->setDocNumber('DWG-' . strtoupper(substr(uniqid(), -6)));
            $doc->setTitle($canvas->getName() . ' — ' . $typeLabel);
            $doc->setCategory('mil_std_drawing');
            $doc->setStatus('active');
            $doc->setPlatformId($canvas->getPlatformId());
            $doc->setCanvasId($canvas->getId());
            // Auto-attach to the system asset so it appears in the asset's doc list
            if ($canvas->getSystemAssetId()) {
                $doc->setAssetId($canvas->getSystemAssetId());
            }
            $doc->setApplicability('');
            $doc->setNotes('Auto-generated from System Canvas. Canvas ID: ' . $canvas->getId());
            $doc->setLocalUuid(null);
            $doc->setModernizationId(null);
            $doc->setCreatedBy($uid);
            $doc->setCreatedAt($now);
            $doc->setUpdatedAt($now);
            $doc = $this->docMapper->insert($doc);
        } else {
            $doc->setUpdatedAt($now);
            $this->docMapper->update($doc);
        }

        // Stamp the revision — canvas_data snapshot stored in notes
        $rev = new DocumentRevision();
        $rev->setDocumentId($doc->getId());
        $rev->setRevision($revLabel);
        $rev->setChangeDesc($changeDesc . ($baseline ? ' [Baseline: ' . $baseline . ']' : ''));
        $rev->setFilePath(null);
        $rev->setAuthor($uid);
        $rev->setApprovedBy($data['approved_by'] ?? null);
        $rev->setApprovedAt(!empty($data['approved_by']) ? $now : null);
        $rev->setCreatedAt($now);
        $this->revMapper->insert($rev);

        // Update document's current_rev
        $doc->setCurrentRev($revLabel);
        $doc->setUpdatedAt($now);
        $this->docMapper->update($doc);

        // Update canvas: link doc, clear revision_required, stamp publish
        $canvas->setDrawingDocId($doc->getId());
        $canvas->setRevisionRequired(false);
        $canvas->setPublishedAt($now);
        $canvas->setPublishedRev($revLabel);
        $canvas->setUpdatedAt($now);
        $this->mapper->update($canvas);

        return new DataResponse([
            'canvas'   => $canvas->jsonSerialize(),
            'document' => $doc->jsonSerialize(),
            'revision' => $rev->jsonSerialize(),
        ], Http::STATUS_CREATED);
    }
}
