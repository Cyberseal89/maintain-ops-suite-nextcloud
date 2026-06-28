<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Document;
use OCA\OpsSuite\Db\DocumentMapper;
use OCA\OpsSuite\Db\DocumentRevision;
use OCA\OpsSuite\Db\DocumentRevisionMapper;
use OCA\OpsSuite\Db\DmStep;
use OCA\OpsSuite\Db\DmStepMapper;
use OCA\OpsSuite\Db\PublicationDm;
use OCA\OpsSuite\Db\PublicationDmMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class DocumentController extends Controller {
    public function __construct(
        string                          $appName,
        IRequest                        $request,
        private readonly DocumentMapper         $mapper,
        private readonly DocumentRevisionMapper $revMapper,
        private readonly DmStepMapper           $stepMapper,
        private readonly PublicationDmMapper    $pubDmMapper,
        private readonly PermissionService      $permission,
        private readonly IUserSession           $userSession
    ) {
        parent::__construct($appName, $request);
    }

    // ── Documents ─────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $assetId         = $this->request->getParam('asset_id')         ? (int)$this->request->getParam('asset_id')         : null;
        $modernizationId = $this->request->getParam('modernization_id') ? (int)$this->request->getParam('modernization_id') : null;
        $category        = $this->request->getParam('category')         ?: null;
        $status          = $this->request->getParam('status')           ?: null;
        $platformParam   = $this->request->getParam('platform_ids', '');
        $platformIds     = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];

        $docType = $this->request->getParam('doc_type') ?: null;
        $docs = $this->mapper->findAll($assetId, $category, $status, $platformIds, $modernizationId, null, $docType);
        return new DataResponse(array_map(fn($d) => $d->jsonSerialize(), $docs));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $doc  = $this->mapper->find($id);
            $data = $doc->jsonSerialize();
            $data['revisions'] = array_map(
                fn($r) => $r->jsonSerialize(),
                $this->revMapper->findForDocument($id)
            );
            return new DataResponse($data);
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

        // Idempotent POST for offline sync
        if (!empty($data['local_uuid'])) {
            try {
                return new DataResponse($this->mapper->findByLocalUuid($data['local_uuid'])->jsonSerialize());
            } catch (DoesNotExistException) {}
        }

        $doc = new Document();
        $doc->setDocNumber($data['doc_number'] ?? $this->generateDocNumber());
        $doc->setTitle($data['title'] ?? '');
        $doc->setCategory($data['category'] ?? 'other');
        $doc->setStatus($data['status'] ?? 'draft');
        $doc->setCurrentRev($data['current_rev'] ?: null);
        $doc->setAssetId(isset($data['asset_id']) && $data['asset_id'] ? (int)$data['asset_id'] : null);
        $doc->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $doc->setModernizationId(isset($data['modernization_id']) && $data['modernization_id'] ? (int)$data['modernization_id'] : null);
        $doc->setApplicability($data['applicability'] ?? '');
        $doc->setNotes($data['notes'] ?? '');
        $doc->setLocalUuid($data['local_uuid'] ?: null);
        // S1000D Data Module fields
        $doc->setDocType($data['doc_type'] ?? 'external');
        $doc->setDmc($data['dmc'] ?: null);
        $doc->setInfoCode($data['info_code'] ?: null);
        $doc->setInfoCodeVariant($data['info_code_variant'] ?? 'A');
        $doc->setIssueNumber(isset($data['issue_number']) ? (int)$data['issue_number'] : 1);
        $doc->setInWorkNumber(isset($data['in_work_number']) ? (int)$data['in_work_number'] : 0);
        $doc->setDmcReviewFlag((bool)($data['dmc_review_flag'] ?? false));
        // Publication fields
        $doc->setPubCode($data['pub_code'] ?: null);
        $doc->setPubType($data['pub_type'] ?: null);
        $doc->setReIssueRequired((bool)($data['re_issue_required'] ?? false));
        $doc->setCreatedBy($uid);
        $doc->setCreatedAt($now);
        $doc->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($doc)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $doc = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();

        if (array_key_exists('title', $data))         $doc->setTitle($data['title']);
        if (array_key_exists('category', $data))      $doc->setCategory($data['category']);
        if (array_key_exists('status', $data))        $doc->setStatus($data['status']);
        if (array_key_exists('current_rev', $data))   $doc->setCurrentRev($data['current_rev'] ?: null);
        if (array_key_exists('asset_id', $data))         $doc->setAssetId($data['asset_id'] ? (int)$data['asset_id'] : null);
        if (array_key_exists('platform_id', $data))      $doc->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('modernization_id', $data)) $doc->setModernizationId($data['modernization_id'] ? (int)$data['modernization_id'] : null);
        if (array_key_exists('applicability', $data)) $doc->setApplicability($data['applicability']);
        if (array_key_exists('notes', $data))         $doc->setNotes($data['notes']);
        // S1000D Data Module fields
        if (array_key_exists('doc_type', $data))         $doc->setDocType($data['doc_type']);
        if (array_key_exists('dmc', $data))              $doc->setDmc($data['dmc'] ?: null);
        if (array_key_exists('info_code', $data))        $doc->setInfoCode($data['info_code'] ?: null);
        if (array_key_exists('info_code_variant', $data))$doc->setInfoCodeVariant($data['info_code_variant'] ?? 'A');
        if (array_key_exists('issue_number', $data))     $doc->setIssueNumber((int)$data['issue_number']);
        if (array_key_exists('in_work_number', $data))   $doc->setInWorkNumber((int)$data['in_work_number']);
        if (array_key_exists('dmc_review_flag', $data))   $doc->setDmcReviewFlag((bool)$data['dmc_review_flag']);
        if (array_key_exists('pub_code', $data))           $doc->setPubCode($data['pub_code'] ?: null);
        if (array_key_exists('pub_type', $data))           $doc->setPubType($data['pub_type'] ?: null);
        if (array_key_exists('re_issue_required', $data))  $doc->setReIssueRequired((bool)$data['re_issue_required']);

        // When a DM is released (in_work_number → 0), flag containing publications
        if (array_key_exists('in_work_number', $data) && (int)$data['in_work_number'] === 0
            && ($doc->getDocType() === 'data_module')) {
            $this->mapper->flagReIssueForPublications($id);
        }

        $doc->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($doc)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->revMapper->deleteForDocument($id);
            $this->pubDmMapper->deleteByPublication($id); // if it's a publication, remove all its DM entries
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Revisions ─────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function getRevisions(int $id): DataResponse {
        $revs = $this->revMapper->findForDocument($id);
        return new DataResponse(array_map(fn($r) => $r->jsonSerialize(), $revs));
    }

    /** @NoAdminRequired */
    public function addRevision(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $doc = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $rev = new DocumentRevision();
        $rev->setDocumentId($id);
        $rev->setRevision($data['revision'] ?? 'A');
        $rev->setChangeDesc($data['change_desc'] ?? '');
        $rev->setFilePath($data['file_path'] ?: null);
        $rev->setAuthor($data['author'] ?: $uid);
        $rev->setApprovedBy($data['approved_by'] ?: null);
        $rev->setApprovedAt($data['approved_at'] ?: null);
        $rev->setCreatedAt(date('Y-m-d H:i:s'));

        $created = $this->revMapper->insert($rev);

        // Keep doc's current_rev in sync with the new revision label
        $doc->setCurrentRev($rev->getRevision());
        $doc->setUpdatedAt(date('Y-m-d H:i:s'));
        $this->mapper->update($doc);

        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateRevision(int $id, int $revId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $rev = $this->revMapper->find($revId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('change_desc', $data)) $rev->setChangeDesc($data['change_desc']);
        if (array_key_exists('file_path', $data))   $rev->setFilePath($data['file_path'] ?: null);
        if (array_key_exists('approved_by', $data)) $rev->setApprovedBy($data['approved_by'] ?: null);
        if (array_key_exists('approved_at', $data)) $rev->setApprovedAt($data['approved_at'] ?: null);
        return new DataResponse($this->revMapper->update($rev)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function deleteRevision(int $id, int $revId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->revMapper->delete($this->revMapper->find($revId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── DM Steps ──────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function getSteps(int $id): DataResponse {
        return new DataResponse(array_map(fn($s) => $s->jsonSerialize(), $this->stepMapper->findByDocument($id)));
    }

    /** @NoAdminRequired */
    public function saveSteps(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $steps = $this->request->getParam('steps', []);
        if (!is_array($steps)) {
            return new DataResponse(['message' => 'steps must be an array'], Http::STATUS_BAD_REQUEST);
        }

        $this->stepMapper->deleteByDocument($id);

        $saved = [];
        foreach ($steps as $raw) {
            $s = new DmStep();
            $s->setDocumentId($id);
            $s->setStepOrder((int)($raw['step_order'] ?? 10));
            $s->setStepType((string)($raw['step_type'] ?? 'action'));
            $s->setContent((string)($raw['content'] ?? ''));
            $s->setToolRefs(is_array($raw['tool_refs'] ?? null)
                ? json_encode($raw['tool_refs'])
                : ($raw['tool_refs'] ?? '[]'));
            $s->setPartRefs(is_array($raw['part_refs'] ?? null)
                ? json_encode($raw['part_refs'])
                : ($raw['part_refs'] ?? '[]'));
            $saved[] = $this->stepMapper->insert($s)->jsonSerialize();
        }
        return new DataResponse($saved);
    }

    // ── Publication DM management ─────────────────────────────────

    /** @NoAdminRequired */
    public function listPubDms(int $id): DataResponse {
        return new DataResponse($this->enrichPubDms($id));
    }

    /** @NoAdminRequired */
    public function addPubDm(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d     = $this->request->getParams();
        $docId = (int)($d['document_id'] ?? 0);
        if (!$docId) return new DataResponse(['message' => 'document_id required'], Http::STATUS_BAD_REQUEST);

        $chapter = (int)($d['chapter'] ?? 1);
        $section = (int)($d['section'] ?? 1);
        $existing = $this->pubDmMapper->findByPublication($id);
        $inChap   = array_filter($existing, fn($e) => $e->getChapter() === $chapter && $e->getSection() === $section);
        $nextSeq  = $inChap ? (max(array_map(fn($e) => $e->getSequence(), $inChap)) + 10) : 10;

        $pdm = new PublicationDm();
        $pdm->setPublicationId($id);
        $pdm->setDocumentId($docId);
        $pdm->setChapter($chapter);
        $pdm->setSection($section);
        $pdm->setSequence(isset($d['sequence']) ? (int)$d['sequence'] : $nextSeq);
        $pdm->setChapterTitle($d['chapter_title'] ?? null);

        return new DataResponse($this->pubDmMapper->insert($pdm)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updatePubDm(int $id, int $dmId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $pdm = $this->pubDmMapper->find($dmId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $d = $this->request->getParams();
        if (array_key_exists('chapter', $d))       $pdm->setChapter((int)$d['chapter']);
        if (array_key_exists('section', $d))       $pdm->setSection((int)$d['section']);
        if (array_key_exists('sequence', $d))      $pdm->setSequence((int)$d['sequence']);
        if (array_key_exists('chapter_title', $d)) $pdm->setChapterTitle($d['chapter_title'] ?: null);
        return new DataResponse($this->pubDmMapper->update($pdm)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function removePubDm(int $id, int $dmId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->pubDmMapper->delete($this->pubDmMapper->find($dmId));
            return new DataResponse(['message' => 'Removed']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /**
     * POST /api/documents/{id}/pub-dms/reorder
     * Body: { dms: [{id, chapter, section, sequence, chapter_title}] }
     */
    /** @NoAdminRequired */
    public function reorderPubDms(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $dms = $this->request->getParam('dms', []);
        if (!is_array($dms)) return new DataResponse(['message' => 'dms must be array'], Http::STATUS_BAD_REQUEST);
        foreach ($dms as $item) {
            try {
                $pdm = $this->pubDmMapper->find((int)$item['id']);
                if (array_key_exists('chapter', $item))       $pdm->setChapter((int)$item['chapter']);
                if (array_key_exists('section', $item))       $pdm->setSection((int)$item['section']);
                if (array_key_exists('sequence', $item))      $pdm->setSequence((int)$item['sequence']);
                if (array_key_exists('chapter_title', $item)) $pdm->setChapterTitle($item['chapter_title'] ?: null);
                $this->pubDmMapper->update($pdm);
            } catch (DoesNotExistException) {}
        }
        return new DataResponse($this->enrichPubDms($id));
    }

    /**
     * POST /api/documents/{id}/release
     * Advances publication issue number and clears re_issue_required.
     */
    /** @NoAdminRequired */
    public function releasePub(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $doc = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $doc->setIssueNumber($doc->getIssueNumber() + 1);
        $doc->setStatus('released');
        $doc->setReIssueRequired(false);
        $doc->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($doc)->jsonSerialize());
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function enrichPubDms(int $pubId): array {
        $entries = $this->pubDmMapper->findByPublication($pubId);
        $result  = [];
        foreach ($entries as $e) {
            $row = $e->jsonSerialize();
            try {
                $doc = $this->mapper->find($e->getDocumentId());
                $row['doc_title']       = $doc->getTitle();
                $row['doc_type']        = $doc->getDocType();
                $row['dmc']             = $doc->getDmc();
                $row['info_code']       = $doc->getInfoCode();
                $row['issue_number']    = $doc->getIssueNumber();
                $row['in_work_number']  = $doc->getInWorkNumber();
                $row['dmc_review_flag'] = $doc->getDmcReviewFlag();
                $row['status']          = $doc->getStatus();
            } catch (\Exception) {
                $row['doc_title'] = '[Document not found]';
            }
            $result[] = $row;
        }
        return $result;
    }

    private function generateDocNumber(): string {
        return 'DOC-' . strtoupper(substr(uniqid(), -6));
    }
}
