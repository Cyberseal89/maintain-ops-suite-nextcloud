<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\LotoDevice;
use OCA\OpsSuite\Db\LotoDeviceMapper;
use OCA\OpsSuite\Db\LotoSession;
use OCA\OpsSuite\Db\LotoSessionMapper;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;
use Psr\Log\LoggerInterface;

class LotoController extends Controller {

    public function __construct(
        string                      $appName,
        IRequest                    $request,
        private readonly LotoSessionMapper  $mapper,
        private readonly LotoDeviceMapper   $deviceMapper,
        private readonly PermissionService  $permission,
        private readonly IUserSession       $userSession,
        private readonly \OCP\IDBConnection $db,
        private readonly LoggerInterface    $logger
    ) {
        parent::__construct($appName, $request);
    }

    // ── Session endpoints ─────────────────────────────────────────────

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $status      = $this->request->getParam('status')   ?: null;
        $assetId     = $this->request->getParam('asset_id') ? (int)$this->request->getParam('asset_id') : null;
        $platParam   = $this->request->getParam('platform_ids', '');
        $platformIds = $platParam ? array_map('intval', explode(',', $platParam)) : [];
        return new DataResponse(array_map(
            fn($s) => $s->jsonSerialize(),
            $this->mapper->findAll($status, $assetId, $platformIds)
        ));
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $session = $this->mapper->find($id)->jsonSerialize();
            // Attach device details — guard against non-array device_ids
            $deviceIds = is_array($session['device_ids'] ?? null) ? $session['device_ids'] : [];
            if (!empty($deviceIds)) {
                $devices = [];
                foreach ($deviceIds as $did) {
                    try { $devices[] = $this->deviceMapper->find((int)$did)->jsonSerialize(); }
                    catch (\Throwable) {}
                }
                $session['devices'] = $devices;
            } else {
                $session['devices'] = [];
            }
            return new DataResponse($session);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        } catch (\Throwable $e) {
            $this->logger->error('LotoController::show('.$id.') failed: '.$e->getMessage(), ['exception' => $e]);
            return new DataResponse(['message' => 'Error: '.$e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    /** @NoAdminRequired */
    public function create(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';

        $s = new LotoSession();
        $s->setAssetId(isset($d['asset_id']) && $d['asset_id'] ? (int)$d['asset_id'] : null);
        $s->setSessionType($d['session_type'] ?? 'deficiency');
        $s->setStatus('active');
        $s->setTagNumber($this->generateTagNumber());
        $s->setLockNumber($d['lock_number'] ?: null);
        $s->setEquipmentName($d['equipment_name'] ?: null);
        $s->setLocation($d['location'] ?: null);
        $s->setWorkDescription($d['work_description'] ?: null);
        $s->setHazards($d['hazards'] ?: null);
        $s->setEnergySources(isset($d['energy_sources']) ? json_encode($d['energy_sources']) : json_encode([]));
        $s->setStepsCompleted(json_encode([]));
        $s->setLinkedDefId(isset($d['linked_def_id']) && $d['linked_def_id'] ? (int)$d['linked_def_id'] : null);
        $s->setLinkedProcId(isset($d['linked_proc_id']) && $d['linked_proc_id'] ? (int)$d['linked_proc_id'] : null);
        $s->setInitiatedBy($uid);
        $s->setInitiatedAt($now);
        $s->setAuthorizedBy($d['authorized_by'] ?: null);
        $s->setExpectedRelease($d['expected_release'] ?: null);
        $s->setCreatedAt($now);
        $s->setUpdatedAt($now);

        // Device IDs — mark selected devices as in_use
        $deviceIds = isset($d['device_ids']) && is_array($d['device_ids']) ? $d['device_ids'] : [];
        $s->setDeviceIds(json_encode(array_map('intval', $deviceIds)));

        $saved = $this->mapper->insert($s);

        if (!empty($deviceIds)) {
            $this->assignDevicesToSession(array_map('intval', $deviceIds), $saved->getId());
        }

        return new DataResponse($saved->jsonSerialize(), Http::STATUS_CREATED);
        } catch (\Throwable $e) {
            $this->logger->error('LotoController::create() failed: '.$e->getMessage(), ['exception' => $e]);
            return new DataResponse(['message' => 'Failed to create LOTO session: '.$e->getMessage()], Http::STATUS_INTERNAL_SERVER_ERROR);
        }
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $s = $this->mapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $d = $this->request->getParams();
        if (array_key_exists('tag_number',       $d)) $s->setTagNumber($d['tag_number'] ?: null);
        if (array_key_exists('lock_number',       $d)) $s->setLockNumber($d['lock_number'] ?: null);
        if (array_key_exists('equipment_name',    $d)) $s->setEquipmentName($d['equipment_name'] ?: null);
        if (array_key_exists('location',          $d)) $s->setLocation($d['location'] ?: null);
        if (array_key_exists('work_description',  $d)) $s->setWorkDescription($d['work_description'] ?: null);
        if (array_key_exists('hazards',           $d)) $s->setHazards($d['hazards'] ?: null);
        if (array_key_exists('energy_sources',    $d)) $s->setEnergySources(json_encode($d['energy_sources']));
        if (array_key_exists('steps_completed',   $d)) $s->setStepsCompleted(json_encode($d['steps_completed']));
        if (array_key_exists('authorized_by',     $d)) $s->setAuthorizedBy($d['authorized_by'] ?: null);
        if (array_key_exists('expected_release',  $d)) $s->setExpectedRelease($d['expected_release'] ?: null);

        if (array_key_exists('device_ids', $d) && is_array($d['device_ids'])) {
            $oldIds = $s->getDeviceIds() ? json_decode($s->getDeviceIds(), true) : [];
            $newIds = array_map('intval', $d['device_ids']);
            $removed = array_diff($oldIds, $newIds);
            $added   = array_diff($newIds, $oldIds);
            $this->releaseDevices($removed);
            $this->assignDevicesToSession($added, $id);
            $s->setDeviceIds(json_encode($newIds));
        }

        $s->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->mapper->update($s)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function release(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $s = $this->mapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';

        // Release all assigned devices
        $deviceIds = $s->getDeviceIds() ? json_decode($s->getDeviceIds(), true) : [];
        $this->releaseDevices($deviceIds);

        $s->setStatus('released');
        $s->setReleasedBy($uid);
        $s->setReleasedAt($now);
        $s->setReleaseNotes($d['release_notes'] ?: null);
        $s->setUpdatedAt($now);

        return new DataResponse($this->mapper->update($s)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function verify(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $s = $this->mapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $now = date('Y-m-d H:i:s');
        $uid = $this->userSession->getUser()?->getUID() ?? '';

        $s->setLastVerifiedAt($now);
        $s->setLastVerifiedBy($uid);
        $s->setUpdatedAt($now);

        return new DataResponse($this->mapper->update($s)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $s = $this->mapper->find($id);
            $deviceIds = $s->getDeviceIds() ? json_decode($s->getDeviceIds(), true) : [];
            $this->releaseDevices($deviceIds);
            $this->mapper->delete($s);
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Device inventory endpoints ────────────────────────────────────

    /** @NoAdminRequired */
    public function indexDevices(): DataResponse {
        $status     = $this->request->getParam('status')      ?: null;
        $deviceType = $this->request->getParam('device_type') ?: null;
        return new DataResponse(array_map(
            fn($d) => $d->jsonSerialize(),
            $this->deviceMapper->findAll($status, $deviceType)
        ));
    }

    /** @NoAdminRequired */
    public function showDevice(int $deviceId): DataResponse {
        try {
            return new DataResponse($this->deviceMapper->find($deviceId)->jsonSerialize());
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createDevice(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $d   = $this->request->getParams();
        $now = date('Y-m-d H:i:s');

        $dev = new LotoDevice();
        $dev->setDeviceType($d['device_type'] ?? 'lock');
        $dev->setSerialNumber($d['serial_number'] ?? '');
        $dev->setColor($d['color'] ?: null);
        $dev->setKeyNumber($d['key_number'] ?: null);
        $dev->setDescription($d['description'] ?: null);
        $dev->setStatus('available');
        $dev->setNotes($d['notes'] ?: null);
        $dev->setCreatedAt($now);
        $dev->setUpdatedAt($now);

        try {
            return new DataResponse($this->deviceMapper->insert($dev)->jsonSerialize(), Http::STATUS_CREATED);
        } catch (\Throwable $e) {
            return new DataResponse(['message' => 'Serial number already exists or invalid data'], Http::STATUS_CONFLICT);
        }
    }

    /** @NoAdminRequired */
    public function updateDevice(int $deviceId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $dev = $this->deviceMapper->find($deviceId); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $d = $this->request->getParams();
        if (array_key_exists('device_type',  $d)) $dev->setDeviceType($d['device_type']);
        if (array_key_exists('color',        $d)) $dev->setColor($d['color'] ?: null);
        if (array_key_exists('key_number',   $d)) $dev->setKeyNumber($d['key_number'] ?: null);
        if (array_key_exists('description',  $d)) $dev->setDescription($d['description'] ?: null);
        if (array_key_exists('status',       $d)) $dev->setStatus($d['status']);
        if (array_key_exists('notes',        $d)) $dev->setNotes($d['notes'] ?: null);
        $dev->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->deviceMapper->update($dev)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyDevice(int $deviceId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->deviceMapper->delete($this->deviceMapper->find($deviceId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function generateTagNumber(): string {
        $year = date('Y');
        // Find highest tag number for this year
        $qb = $this->db->getQueryBuilder();
        $qb->select('tag_number')
           ->from('ops_loto_sessions')
           ->where($qb->expr()->like('tag_number', $qb->createNamedParameter("LOTO-{$year}-%")))
           ->orderBy('id', 'DESC')
           ->setMaxResults(1);
        $result = $qb->executeQuery();
        $last   = $result->fetchOne();
        $result->closeCursor();

        $seq = 1;
        if ($last) {
            $parts = explode('-', $last);
            $seq   = ((int)end($parts)) + 1;
        }
        return sprintf('LOTO-%s-%04d', $year, $seq);
    }

    private function assignDevicesToSession(array $deviceIds, int $sessionId): void {
        foreach ($deviceIds as $did) {
            try {
                $dev = $this->deviceMapper->find($did);
                $dev->setStatus('in_use');
                $dev->setAssignedSessionId($sessionId);
                $dev->setUpdatedAt(date('Y-m-d H:i:s'));
                $this->deviceMapper->update($dev);
            } catch (\Throwable) {}
        }
    }

    private function releaseDevices(array $deviceIds): void {
        foreach ($deviceIds as $did) {
            try {
                $dev = $this->deviceMapper->find((int)$did);
                $dev->setStatus('available');
                $dev->setAssignedSessionId(null);
                $dev->setUpdatedAt(date('Y-m-d H:i:s'));
                $this->deviceMapper->update($dev);
            } catch (\Throwable) {}
        }
    }
}
