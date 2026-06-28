<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Document;
use OCA\OpsSuite\Db\DocumentMapper;
use OCA\OpsSuite\Db\DocumentRevision;
use OCA\OpsSuite\Db\DocumentRevisionMapper;
use OCA\OpsSuite\Db\FmeaEntry;
use OCA\OpsSuite\Db\FmeaEntryMapper;
use OCA\OpsSuite\Db\FmeaWorksheet;
use OCA\OpsSuite\Db\FmeaWorksheetMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IDBConnection;
use OCP\IRequest;
use OCP\IUserSession;

class FmeaController extends Controller {

    public function __construct(
        string                          $appName,
        IRequest                        $request,
        private readonly FmeaWorksheetMapper    $wsMapper,
        private readonly FmeaEntryMapper        $entryMapper,
        private readonly DocumentMapper         $docMapper,
        private readonly DocumentRevisionMapper $revMapper,
        private readonly PermissionService      $permission,
        private readonly IUserSession           $userSession,
        private readonly IDBConnection          $db,
    ) {
        parent::__construct($appName, $request);
    }

    // ── Worksheets ────────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexWorksheets(): DataResponse {
        $canvasId = $this->request->getParam('canvas_id') ? (int)$this->request->getParam('canvas_id') : null;
        $assetId  = $this->request->getParam('asset_id')  ? (int)$this->request->getParam('asset_id')  : null;

        if ($canvasId) {
            $rows = $this->wsMapper->findByCanvas($canvasId);
        } elseif ($assetId) {
            $rows = $this->wsMapper->findByAsset($assetId);
        } else {
            $rows = [];
        }
        return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $rows));
    }

    /** @NoAdminRequired */
    public function showWorksheet(int $id): DataResponse {
        try {
            $ws      = $this->wsMapper->find($id);
            $entries = $this->entryMapper->findByWorksheet($id);
            $data    = $ws->jsonSerialize();
            $data['entries'] = array_map(fn($e) => $e->jsonSerialize(), $entries);
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired — find or create worksheet for a canvas node */
    public function findOrCreate(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data     = $this->request->getParams();
        $canvasId = (int)($data['canvas_id'] ?? 0);
        $nodeId   = trim($data['node_id'] ?? '');
        if (!$canvasId || !$nodeId) {
            return new DataResponse(['message' => 'canvas_id and node_id required'], Http::STATUS_BAD_REQUEST);
        }

        $ws = $this->wsMapper->findByCanvasNode($canvasId, $nodeId);
        if ($ws) {
            return new DataResponse($ws->jsonSerialize());
        }

        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';
        $ws  = new FmeaWorksheet();
        $ws->setCanvasId($canvasId);
        $ws->setNodeId($nodeId);
        $ws->setAssetId(isset($data['asset_id']) && $data['asset_id'] ? (int)$data['asset_id'] : null);
        $ws->setTitle($data['title'] ?? 'FMEA Worksheet');
        $ws->setStatus('draft');
        $ws->setCreatedBy($uid);
        $ws->setCreatedAt($now);
        $ws->setUpdatedAt($now);
        $ws = $this->wsMapper->insert($ws);
        return new DataResponse($ws->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateWorksheet(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $ws   = $this->wsMapper->find($id);
            $data = $this->request->getParams();
            if (array_key_exists('title',       $data)) $ws->setTitle($data['title']);
            if (array_key_exists('status',      $data)) $ws->setStatus($data['status']);
            if (array_key_exists('document_id', $data)) $ws->setDocumentId($data['document_id'] ? (int)$data['document_id'] : null);
            $ws->setUpdatedAt(date('Y-m-d H:i:s'));
            return new DataResponse($this->wsMapper->update($ws)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroyWorksheet(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->entryMapper->deleteByWorksheet($id);
            $this->wsMapper->delete($this->wsMapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Entries ───────────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexEntries(int $worksheetId): DataResponse {
        $entries = $this->entryMapper->findByWorksheet($worksheetId);
        return new DataResponse(array_map(fn($e) => $e->jsonSerialize(), $entries));
    }

    /** @NoAdminRequired */
    public function createEntry(int $worksheetId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        $sev  = max(1, min(10, (int)($data['severity']      ?? 1)));
        $occ  = max(1, min(10, (int)($data['occurrence']    ?? 1)));
        $det  = max(1, min(10, (int)($data['detectability'] ?? 1)));

        $entry = new FmeaEntry();
        $entry->setWorksheetId($worksheetId);
        $entry->setFunction($data['function']          ?? '');
        $entry->setFailureMode($data['failure_mode']   ?? '');
        $entry->setLocalEffect($data['local_effect']   ?? '');
        $entry->setSystemEffect($data['system_effect'] ?? '');
        $entry->setDetectionMethod($data['detection_method'] ?? '');
        $entry->setSeverity($sev);
        $entry->setOccurrence($occ);
        $entry->setDetectability($det);
        $entry->setRpn($sev * $occ * $det);
        $entry->setFailureModeId(isset($data['failure_mode_id']) && $data['failure_mode_id'] ? (int)$data['failure_mode_id'] : null);
        $entry->setRecommendedAction($data['recommended_action'] ?? '');
        $entry->setResponsibleParty($data['responsible_party']  ?? '');
        $entry->setActionTaken($data['action_taken'] ?? '');
        $entry->setNotes($data['notes'] ?? '');
        $entry->setSortOrder((int)($data['sort_order'] ?? 0));
        $entry->setCreatedAt($now);
        $entry->setUpdatedAt($now);

        $created = $this->entryMapper->insert($entry);

        // Keep worksheet updated_at current
        $ws = $this->wsMapper->find($worksheetId);
        $ws->setUpdatedAt($now);
        $this->wsMapper->update($ws);

        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateEntry(int $worksheetId, int $entryId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $entry = $this->entryMapper->find($entryId);
            $data  = $this->request->getParams();
            $now   = date('Y-m-d H:i:s');

            if (array_key_exists('function',          $data)) $entry->setFunction($data['function']);
            if (array_key_exists('failure_mode',      $data)) $entry->setFailureMode($data['failure_mode']);
            if (array_key_exists('local_effect',      $data)) $entry->setLocalEffect($data['local_effect']);
            if (array_key_exists('system_effect',     $data)) $entry->setSystemEffect($data['system_effect']);
            if (array_key_exists('detection_method',  $data)) $entry->setDetectionMethod($data['detection_method']);
            if (array_key_exists('recommended_action',$data)) $entry->setRecommendedAction($data['recommended_action']);
            if (array_key_exists('responsible_party', $data)) $entry->setResponsibleParty($data['responsible_party']);
            if (array_key_exists('action_taken',      $data)) $entry->setActionTaken($data['action_taken']);
            if (array_key_exists('notes',             $data)) $entry->setNotes($data['notes']);
            if (array_key_exists('failure_mode_id',   $data)) $entry->setFailureModeId($data['failure_mode_id'] ? (int)$data['failure_mode_id'] : null);
            if (array_key_exists('sort_order',        $data)) $entry->setSortOrder((int)$data['sort_order']);

            if (array_key_exists('severity', $data) || array_key_exists('occurrence', $data) || array_key_exists('detectability', $data)) {
                $sev = max(1, min(10, (int)($data['severity']      ?? $entry->getSeverity())));
                $occ = max(1, min(10, (int)($data['occurrence']    ?? $entry->getOccurrence())));
                $det = max(1, min(10, (int)($data['detectability'] ?? $entry->getDetectability())));
                $entry->setSeverity($sev); $entry->setOccurrence($occ); $entry->setDetectability($det);
                $entry->setRpn($sev * $occ * $det);
            }
            if (array_key_exists('revised_sev', $data) || array_key_exists('revised_occ', $data) || array_key_exists('revised_det', $data)) {
                $rs = $data['revised_sev'] !== null && $data['revised_sev'] !== '' ? max(1,min(10,(int)$data['revised_sev'])) : null;
                $ro = $data['revised_occ'] !== null && $data['revised_occ'] !== '' ? max(1,min(10,(int)$data['revised_occ'])) : null;
                $rd = $data['revised_det'] !== null && $data['revised_det'] !== '' ? max(1,min(10,(int)$data['revised_det'])) : null;
                $entry->setRevisedSev($rs); $entry->setRevisedOcc($ro); $entry->setRevisedDet($rd);
                $entry->setRevisedRpn(($rs ?? $entry->getSeverity()) * ($ro ?? $entry->getOccurrence()) * ($rd ?? $entry->getDetectability()));
            }

            $entry->setUpdatedAt($now);
            $updated = $this->entryMapper->update($entry);

            $ws = $this->wsMapper->find($worksheetId);
            $ws->setUpdatedAt($now);
            $this->wsMapper->update($ws);

            return new DataResponse($updated->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function destroyEntry(int $worksheetId, int $entryId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->entryMapper->delete($this->entryMapper->find($entryId));
            return new DataResponse(['deleted' => $entryId]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Publish ───────────────────────────────────────────────────────

    /**
     * @NoAdminRequired
     * POST /api/fmea/worksheets/{id}/publish
     * Publishes the FMEA worksheet as a controlled document in the Doc Registry.
     */
    public function publishWorksheet(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $ws = $this->wsMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data       = $this->request->getParams();
        $now        = date('Y-m-d H:i:s');
        $uid        = $this->userSession->getUser()?->getUID() ?? '';
        $revLabel   = trim($data['revision']    ?? 'A') ?: 'A';
        $changeDesc = $data['change_desc']      ?? 'Initial FMEA publish';

        if ($ws->getDocId()) {
            try {
                $doc = $this->docMapper->find($ws->getDocId());
            } catch (DoesNotExistException) {
                $doc = null;
            }
        } else {
            $doc = null;
        }

        if ($doc === null) {
            $doc = new Document();
            $doc->setDocNumber('FMEA-' . strtoupper(substr(uniqid(), -6)));
            $doc->setTitle($ws->getTitle());
            $doc->setCategory('fmea');
            $doc->setStatus('active');
            $doc->setAssetId($ws->getAssetId());
            $doc->setApplicability('');
            $doc->setNotes('Auto-generated FMEA worksheet. Worksheet ID: ' . $ws->getId());
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

        $rev = new DocumentRevision();
        $rev->setDocumentId($doc->getId());
        $rev->setRevision($revLabel);
        $rev->setChangeDesc($changeDesc);
        $rev->setFilePath(null);
        $rev->setAuthor($uid);
        $rev->setApprovedBy($data['approved_by'] ?? null);
        $rev->setApprovedAt(!empty($data['approved_by']) ? $now : null);
        $rev->setCreatedAt($now);
        $this->revMapper->insert($rev);

        $doc->setCurrentRev($revLabel);
        $doc->setUpdatedAt($now);
        $this->docMapper->update($doc);

        $ws->setDocId($doc->getId());
        $ws->setStatus('active');
        $ws->setUpdatedAt($now);
        $this->wsMapper->update($ws);

        return new DataResponse([
            'worksheet' => $ws->jsonSerialize(),
            'document'  => $doc->jsonSerialize(),
            'revision'  => $rev->jsonSerialize(),
        ], Http::STATUS_CREATED);
    }

    /**
     * Reads the title steps from a 900-series DM linked to this worksheet
     * and creates skeleton FMEA entries for any fault not already present.
     * The engineer then fills in severity/occurrence/detectability values.
     *
     * @NoAdminRequired
     */
    public function syncFromDm(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $ws = $this->wsMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Worksheet not found'], Http::STATUS_NOT_FOUND);
        }

        $dmId = $ws->getDocumentId();
        if (!$dmId) {
            return new DataResponse(['message' => 'No 900 DM linked to this worksheet. Link a Fault Description DM first.'], Http::STATUS_BAD_REQUEST);
        }

        // Fetch ALL steps from the 900 DM in sort order
        $qb = $this->db->getQueryBuilder();
        $qb->select('step_type', 'content', 'step_order')
           ->from('ops_dm_steps')
           ->where($qb->expr()->eq('document_id', $qb->createNamedParameter($dmId, \OCP\DB\QueryBuilder\IQueryBuilder::PARAM_INT)))
           ->orderBy('step_order', 'ASC');
        $result   = $qb->executeQuery();
        $allSteps = $result->fetchAllAssociative();
        $result->closeCursor();

        if (empty($allSteps)) {
            return new DataResponse(['message' => 'No steps found in the linked 900 DM.', 'created' => 0, 'updated' => 0]);
        }

        // Group steps into fault sections — each 'title' step opens a new section.
        // Within a section:  action steps → detection method
        //                    substep lines → local effect (observed results / isolations)
        //                    warning lines → notes (hazards)
        $sections = [];
        $current  = null;
        foreach ($allSteps as $step) {
            $type    = $step['step_type'] ?? '';
            $content = trim($step['content'] ?? '');
            if (!$content) continue;

            if ($type === 'title') {
                if ($current !== null) $sections[] = $current;
                $current = [
                    'title'      => $content,
                    'warnings'   => [],
                    'actions'    => [],
                    'substeps'   => [],
                    'sort_order' => (int)($step['step_order'] ?? 0),
                ];
            } elseif ($current !== null) {
                if ($type === 'warning') $current['warnings'][] = $content;
                if ($type === 'action')  $current['actions'][]  = $content;
                if ($type === 'substep') $current['substeps'][] = $content;
            }
        }
        if ($current !== null) $sections[] = $current;

        if (empty($sections)) {
            return new DataResponse(['message' => 'No fault title sections found in the 900 DM. Add "Fault Description" title steps to define fault modes.', 'created' => 0, 'updated' => 0]);
        }

        // Index existing entries by normalised failure_mode for merge lookup
        $existing = $this->entryMapper->findByWorksheet($id);
        $byMode   = [];
        foreach ($existing as $e) {
            $byMode[strtolower(trim($e->getFailureMode() ?? ''))] = $e;
        }

        $now     = date('Y-m-d H:i:s');
        $created = 0;
        $updated = 0;

        foreach ($sections as $idx => $sec) {
            $faultTitle      = $sec['title'];
            $detectionMethod = implode(' ', $sec['actions']);
            $localEffect     = implode(' ', $sec['substeps']);
            $warnings        = implode(' | ', $sec['warnings']);
            $notes           = ($warnings ? $warnings.' | ' : '').'Merged from DM #'.$dmId;

            $modeKey = strtolower($faultTitle);

            if (isset($byMode[$modeKey])) {
                // Enrich existing entry — fill blank fields only; never overwrite user edits.
                // Use null-coalesce because DB columns may return null even when typed string.
                $entry   = $byMode[$modeKey];
                $changed = false;

                if (!trim($entry->getDetectionMethod() ?? '') && $detectionMethod) {
                    $entry->setDetectionMethod($detectionMethod);
                    $changed = true;
                }
                if (!trim($entry->getLocalEffect() ?? '') && $localEffect) {
                    $entry->setLocalEffect($localEffect);
                    $changed = true;
                }
                if (!trim($entry->getNotes() ?? '')) {
                    $entry->setNotes($notes);
                    $changed = true;
                }

                if ($changed) {
                    $entry->setUpdatedAt($now);
                    $this->entryMapper->update($entry);
                    $updated++;
                }
            } else {
                // Create new FMEA entry pre-populated from the 900 DM section
                $entry = new FmeaEntry();
                $entry->setWorksheetId($id);
                $entry->setFunction('');
                $entry->setFailureMode($faultTitle);
                $entry->setLocalEffect($localEffect);
                $entry->setSystemEffect('');
                $entry->setDetectionMethod($detectionMethod);
                $entry->setSeverity(1);
                $entry->setOccurrence(1);
                $entry->setDetectability(1);
                $entry->setRpn(1);
                $entry->setRecommendedAction('');
                $entry->setResponsibleParty('');
                $entry->setActionTaken('');
                $entry->setNotes($notes);
                $entry->setSortOrder(($idx + 1) * 10);
                $entry->setCreatedAt($now);
                $entry->setUpdatedAt($now);
                $this->entryMapper->insert($entry);
                $created++;
            }
        }

        $ws->setUpdatedAt($now);
        $this->wsMapper->update($ws);

        if ($created === 0 && $updated === 0) {
            $msg = 'All fault modes already exist with complete data — nothing to merge.';
        } else {
            $parts = [];
            if ($created) $parts[] = "$created new entries created";
            if ($updated) $parts[] = "$updated existing entries enriched";
            $msg = 'Merge complete: '.implode(', ', $parts).'.';
        }

        return new DataResponse(['created' => $created, 'updated' => $updated, 'message' => $msg]);
    }
}
