<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\EnergySource;
use OCA\OpsSuite\Db\EnergySourceMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class EnergySourceController extends Controller {
    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly EnergySourceMapper $mapper,
        private readonly PermissionService  $permission,
        private readonly IUserSession       $userSession,
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $assetId    = $this->request->getParam('asset_id')    ? (int)$this->request->getParam('asset_id')    : null;
        $sourceType = $this->request->getParam('source_type') ?: null;
        $rows = $this->mapper->findAll($assetId, $sourceType);
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
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $entry = new EnergySource();
        $entry->setName($data['name'] ?? '');
        $entry->setSourceType($data['source_type'] ?? 'electrical');
        $entry->setAssetId(isset($data['asset_id']) && $data['asset_id'] ? (int)$data['asset_id'] : null);
        $entry->setPanelName($data['panel_name'] ?: null);
        $entry->setBreakerNumber($data['breaker_number'] ?: null);
        $entry->setVoltageV(isset($data['voltage_v']) && $data['voltage_v'] !== '' ? (float)$data['voltage_v'] : null);
        $entry->setCurrentA(isset($data['current_a']) && $data['current_a'] !== '' ? (float)$data['current_a'] : null);
        $entry->setPressurePsi(isset($data['pressure_psi']) && $data['pressure_psi'] !== '' ? (float)$data['pressure_psi'] : null);
        $entry->setLocation($data['location'] ?: null);
        $entry->setIsolationProcedure($data['isolation_procedure'] ?: null);
        $entry->setNotes($data['notes'] ?: null);
        $entry->setCreatedBy($uid);
        $entry->setCreatedAt($now);
        $entry->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($entry)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $entry = $this->mapper->find($id);
            $data  = $this->request->getParams();

            if (array_key_exists('name',                $data)) $entry->setName($data['name']);
            if (array_key_exists('source_type',         $data)) $entry->setSourceType($data['source_type']);
            if (array_key_exists('asset_id',            $data)) $entry->setAssetId($data['asset_id'] ? (int)$data['asset_id'] : null);
            if (array_key_exists('panel_name',          $data)) $entry->setPanelName($data['panel_name'] ?: null);
            if (array_key_exists('breaker_number',      $data)) $entry->setBreakerNumber($data['breaker_number'] ?: null);
            if (array_key_exists('voltage_v',           $data)) $entry->setVoltageV($data['voltage_v'] !== '' && $data['voltage_v'] !== null ? (float)$data['voltage_v'] : null);
            if (array_key_exists('current_a',           $data)) $entry->setCurrentA($data['current_a'] !== '' && $data['current_a'] !== null ? (float)$data['current_a'] : null);
            if (array_key_exists('pressure_psi',        $data)) $entry->setPressurePsi($data['pressure_psi'] !== '' && $data['pressure_psi'] !== null ? (float)$data['pressure_psi'] : null);
            if (array_key_exists('location',            $data)) $entry->setLocation($data['location'] ?: null);
            if (array_key_exists('isolation_procedure', $data)) $entry->setIsolationProcedure($data['isolation_procedure'] ?: null);
            if (array_key_exists('notes',               $data)) $entry->setNotes($data['notes'] ?: null);
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
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['deleted' => $id]);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }
}
