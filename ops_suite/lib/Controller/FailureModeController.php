<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\FailureMode;
use OCA\OpsSuite\Db\FailureModeMapper;
use OCA\OpsSuite\Migration\SeedFailureModes;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IDBConnection;
use OCP\IRequest;

class FailureModeController extends Controller {

    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly FailureModeMapper   $mapper,
        private readonly PermissionService   $permission,
        private readonly IDBConnection       $db,
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $category = $this->request->getParam('category') ?: null;
        $modes    = $this->mapper->findAll($category);
        $counts   = $this->mapper->occurrenceCounts();
        return new DataResponse(array_map(function($m) use ($counts) {
            $data = $m->jsonSerialize();
            $data['occurrence_count'] = $counts[$m->getId()] ?? 0;
            return $data;
        }, $modes));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $m    = $this->mapper->find($id);
            $data = $m->jsonSerialize();
            $counts = $this->mapper->occurrenceCounts();
            $data['occurrence_count'] = $counts[$id] ?? 0;
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

        $mode = new FailureMode();
        $mode->setCode($data['code'] ?? '');
        $mode->setName($data['name'] ?? '');
        $mode->setCategory($data['category'] ?? 'general');
        $mode->setSubcategory($data['subcategory'] ?? null);
        $mode->setDescription($data['description'] ?? null);
        $mode->setAppliesToType($data['applies_to_type'] ?? null);
        $mode->setCreatedAt($now);
        $mode->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($mode)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $mode = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();

        if (array_key_exists('code', $data))           $mode->setCode($data['code']);
        if (array_key_exists('name', $data))           $mode->setName($data['name']);
        if (array_key_exists('category', $data))       $mode->setCategory($data['category']);
        if (array_key_exists('subcategory', $data))    $mode->setSubcategory($data['subcategory'] ?: null);
        if (array_key_exists('description', $data))    $mode->setDescription($data['description'] ?: null);
        if (array_key_exists('applies_to_type', $data))$mode->setAppliesToType($data['applies_to_type'] ?: null);

        $mode->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($mode)->jsonSerialize());
    }

    /**
     * @NoAdminRequired
     * POST /api/failure-modes/seed — inserts missing default S5000F modes (idempotent by code).
     */
    public function seed(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }

        $seeder   = new SeedFailureModes($this->db);
        $modes    = $seeder->getDefaultModes();
        $now      = date('Y-m-d H:i:s');
        $inserted = 0;
        $skipped  = 0;

        foreach ($modes as [$code, $name, $category, $subcategory, $appliesToType, $description]) {
            if ($this->mapper->codeExists($code)) {
                $skipped++;
                continue;
            }
            $mode = new FailureMode();
            $mode->setCode($code);
            $mode->setName($name);
            $mode->setCategory($category);
            $mode->setSubcategory($subcategory);
            $mode->setAppliesToType($appliesToType);
            $mode->setDescription($description);
            $mode->setCreatedAt($now);
            $mode->setUpdatedAt($now);
            try {
                $this->mapper->insert($mode);
                $inserted++;
            } catch (\Throwable) {
                $skipped++;
            }
        }

        return new DataResponse([
            'inserted' => $inserted,
            'skipped'  => $skipped,
            'total'    => $this->mapper->countAll(),
        ]);
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
}
