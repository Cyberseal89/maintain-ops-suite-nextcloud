<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\Document;
use OCA\OpsSuite\Db\DocumentMapper;
use OCA\OpsSuite\Db\DocumentRevision;
use OCA\OpsSuite\Db\DocumentRevisionMapper;
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

        $docs = $this->mapper->findAll($assetId, $category, $status, $platformIds, $modernizationId);
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

    // ── Helpers ───────────────────────────────────────────────────

    private function generateDocNumber(): string {
        return 'DOC-' . strtoupper(substr(uniqid(), -6));
    }
}
