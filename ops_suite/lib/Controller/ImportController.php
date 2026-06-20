<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\ImportJob;
use OCA\OpsSuite\Db\ImportJobMapper;
use OCA\OpsSuite\Service\ImportService;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class ImportController extends Controller {

    public function __construct(
        string                    $appName,
        IRequest                  $request,
        private readonly ImportJobMapper  $jobMapper,
        private readonly ImportService   $importService,
        private readonly PermissionService $permission,
        private readonly IUserSession    $userSession,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @NoAdminRequired
     * GET /api/imports — list recent import jobs for current user
     */
    public function index(): DataResponse {
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $jobs = $this->jobMapper->findRecent($uid);
        return new DataResponse(array_map(fn($j) => $j->jsonSerialize(), $jobs));
    }

    /**
     * @NoAdminRequired
     * GET /api/imports/{id}
     */
    public function show(int $id): DataResponse {
        try {
            return new DataResponse($this->jobMapper->find($id)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /**
     * @NoAdminRequired
     * POST /api/imports — create job from Nextcloud file path
     * Body: { file_path, file_format, import_type, platform_id? }
     */
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $d    = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');

        if (empty($d['file_path'])) {
            return new DataResponse(['message' => 'file_path is required'], Http::STATUS_BAD_REQUEST);
        }

        $format = strtolower($d['file_format'] ?? 'csv');
        if (!in_array($format, ['csv', 'json'], true)) {
            return new DataResponse(['message' => 'file_format must be csv or json'], Http::STATUS_BAD_REQUEST);
        }

        $job = new ImportJob();
        $job->setPlatformId(isset($d['platform_id']) && $d['platform_id'] ? (int)$d['platform_id'] : null);
        $job->setImportType($d['import_type'] ?? 'assets');
        $job->setFileFormat($format);
        $job->setFilePath($d['file_path']);
        $job->setOriginalName($d['original_name'] ?? null);
        $job->setStatus('pending');
        $job->setCreatedBy($uid);
        $job->setCreatedAt($now);
        $job->setUpdatedAt($now);

        $inserted = $this->jobMapper->insert($job);

        // Immediately analyze to detect headers and auto-map
        try {
            $inserted = $this->importService->analyzeFile($inserted);
        } catch (\Throwable $e) {
            $inserted->setStatus('failed');
            $inserted->setErrorMessage($e->getMessage());
            $inserted->setUpdatedAt(date('Y-m-d H:i:s'));
            $inserted = $this->jobMapper->update($inserted);
        }

        return new DataResponse($inserted->jsonSerialize(), Http::STATUS_CREATED);
    }

    /**
     * @NoAdminRequired
     * PUT /api/imports/{id}/map — save column mapping and run validation
     * Body: { column_map: { sourceHeader: targetField } }
     */
    public function map(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $job = $this->jobMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $d = $this->request->getParams();
        if (!isset($d['column_map']) || !is_array($d['column_map'])) {
            return new DataResponse(['message' => 'column_map is required'], Http::STATUS_BAD_REQUEST);
        }

        $job->setColumnMap(json_encode($d['column_map']));
        $job->setUpdatedAt(date('Y-m-d H:i:s'));
        $this->jobMapper->update($job);

        // Run validation
        try {
            $job = $this->importService->validate($job);
        } catch (\Throwable $e) {
            $job->setStatus('failed');
            $job->setErrorMessage($e->getMessage());
            $job->setUpdatedAt(date('Y-m-d H:i:s'));
            $job = $this->jobMapper->update($job);
        }

        return new DataResponse($job->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * POST /api/imports/{id}/execute — run the import
     */
    public function execute(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $job = $this->jobMapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        if (!in_array($job->getStatus(), ['ready', 'mapping'], true)) {
            return new DataResponse(['message' => 'Job must be in ready or mapping status to execute'], Http::STATUS_BAD_REQUEST);
        }

        try {
            $job = $this->importService->execute($job);
        } catch (\Throwable $e) {
            $job->setStatus('failed');
            $job->setErrorMessage($e->getMessage());
            $job->setUpdatedAt(date('Y-m-d H:i:s'));
            $job = $this->jobMapper->update($job);
        }

        return new DataResponse($job->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * DELETE /api/imports/{id}
     */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->jobMapper->delete($this->jobMapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /**
     * @NoAdminRequired
     * GET /api/imports/fields?type=assets|deficiencies — target fields for mapping UI
     */
    public function fields(): DataResponse {
        $type     = $this->request->getParam('type', 'assets');
        $baseType = explode('/', $type, 2)[0];
        $fields   = $baseType === 'deficiencies'
            ? ImportService::DEFICIENCY_FIELDS
            : ImportService::ASSET_FIELDS;
        return new DataResponse($fields);
    }

    /**
     * @NoAdminRequired
     * GET /api/imports/profiles — available import profiles/presets
     */
    public function profiles(): DataResponse {
        return new DataResponse([
            [
                'id'          => 'assets',
                'label'       => 'Assets — Generic CSV/JSON',
                'description' => 'Import asset records from any CSV or JSON file. Columns auto-mapped from common header names.',
                'base_type'   => 'assets',
            ],
            [
                'id'          => 'assets/mb0001',
                'label'       => 'Assets — MB0001 / 3M CSMP Export',
                'description' => 'Import from a Navy 3M / CSMP asset export. Recognizes ESWBS/HSC, JCN, Work Center, Nomenclature, and standard 3M column names. HSC hierarchy is built automatically after import.',
                'base_type'   => 'assets',
            ],
            [
                'id'          => 'deficiencies',
                'label'       => 'Deficiencies — Generic CSV/JSON',
                'description' => 'Import deficiency records. Each row must reference an existing asset by name, serial number, asset code, or ASSET-NNNN label.',
                'base_type'   => 'deficiencies',
            ],
            [
                'id'          => 'deficiencies/mb0001',
                'label'       => 'Deficiencies — MB0001 / 3M CSMP (CSMP/open work)',
                'description' => 'Import outstanding work items from a 3M CSMP export. JCN is used to match back to imported assets. Priority maps to severity (1=SEV-1 … 5=SEV-5).',
                'base_type'   => 'deficiencies',
            ],
        ]);
    }
}
