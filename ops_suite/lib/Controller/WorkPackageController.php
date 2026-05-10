<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\WorkPackageMapper;
use OCA\OpsSuite\Db\WorkPackageItemMapper;
use OCA\OpsSuite\Db\ProcedureMapper;
use OCA\OpsSuite\Db\ModernizationMapper;
use OCA\OpsSuite\Db\WorkPackage;
use OCA\OpsSuite\Db\WorkPackageItem;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class WorkPackageController extends Controller {
    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly WorkPackageMapper     $mapper,
        private readonly WorkPackageItemMapper $itemMapper,
        private readonly ProcedureMapper       $procMapper,
        private readonly ModernizationMapper   $modMapper,
        private readonly PermissionService     $permission,
        private readonly IUserSession          $userSession
    ) {
        parent::__construct($appName, $request);
    }

    /** @NoAdminRequired */
    public function index(): DataResponse {
        $status = $this->request->getParam('status') ?: null;
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];
        $packages = $this->mapper->findAll($status, $platformIds);

        // Enrich with item counts and cost rollup
        $result = [];
        foreach ($packages as $pkg) {
            $data  = $pkg->jsonSerialize();
            $items = $this->itemMapper->findForPackage($pkg->getId());
            $data['item_count'] = count($items);
            $data['est_total']  = $this->calcEstTotal($items);
            $result[] = $data;
        }
        return new DataResponse($result);
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $pkg   = $this->mapper->find($id);
            $items = $this->itemMapper->findForPackage($id);
            $data  = $pkg->jsonSerialize();
            $data['items']     = $this->enrichItems($items);
            $data['est_total'] = $this->calcEstTotal($items);
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

        // Auto-generate RFQ number
        $rfqNumber = 'RFQ-' . strtoupper(substr(md5(uniqid()), 0, 8));

        $pkg = new WorkPackage();
        $pkg->setTitle($data['title'] ?? '');
        $pkg->setDescription($data['description'] ?? '');
        $pkg->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $pkg->setStatus($data['status'] ?? 'draft');
        $pkg->setPackageType($data['package_type'] ?? 'mixed');
        $pkg->setAssignedTo($data['assigned_to'] ?? '');
        $pkg->setApprover($data['approver'] ?? '');
        $pkg->setRfqNumber($rfqNumber);
        $pkg->setRfqDueDate($data['rfq_due_date'] ?: null);
        $pkg->setNotes($data['notes'] ?? '');
        $pkg->setCreatedBy($uid);
        $pkg->setCreatedAt($now);
        $pkg->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($pkg)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function update(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $pkg = $this->mapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $data = $this->request->getParams();
        if (array_key_exists('title', $data))        $pkg->setTitle($data['title']);
        if (array_key_exists('description', $data))  $pkg->setDescription($data['description']);
        if (array_key_exists('platform_id', $data))  $pkg->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('status', $data))       $pkg->setStatus($data['status']);
        if (array_key_exists('package_type', $data)) $pkg->setPackageType($data['package_type']);
        if (array_key_exists('assigned_to', $data))  $pkg->setAssignedTo($data['assigned_to']);
        if (array_key_exists('approver', $data))     $pkg->setApprover($data['approver']);
        if (array_key_exists('rfq_due_date', $data)) $pkg->setRfqDueDate($data['rfq_due_date'] ?: null);
        if (array_key_exists('notes', $data))        $pkg->setNotes($data['notes']);
        $pkg->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($pkg)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->itemMapper->deleteForPackage($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function addItem(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data     = $this->request->getParams();
        $itemType = $data['item_type'] ?? '';
        $itemId   = (int)($data['item_id'] ?? 0);
        $uid      = $this->userSession->getUser()?->getUID() ?? '';

        // Check one-to-one constraint
        $existing = $this->itemMapper->findByItem($itemType, $itemId);
        if ($existing) {
            return new DataResponse([
                'message' => 'This item is already in work package #' . $existing->getPackageId()
            ], Http::STATUS_CONFLICT);
        }

        $item = new WorkPackageItem();
        $item->setPackageId($id);
        $item->setItemType($itemType);
        $item->setItemId($itemId);
        $item->setNotes($data['notes'] ?? '');
        $item->setCreatedBy($uid);
        $item->setCreatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->itemMapper->insert($item)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function removeItem(int $id, int $itemId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->itemMapper->delete($this->itemMapper->find($itemId));
            return new DataResponse(['message' => 'Removed']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function enrichItems(array $items): array {
        $result = [];
        foreach ($items as $item) {
            $data = $item->jsonSerialize();
            try {
                if ($item->getItemType() === 'pm') {
                    $linked = $this->procMapper->find($item->getItemId());
                    $data['linked_title']    = $linked->getName();
                    $data['linked_est_hours']= $linked->getEstHours();
                    $data['linked_next_due'] = $linked->getNextDue();
                } elseif ($item->getItemType() === 'modernization') {
                    $linked = $this->modMapper->find($item->getItemId());
                    $data['linked_title']       = $linked->getTitle();
                    $data['linked_est_parts']   = $linked->getEstPartsCost();
                    $data['linked_est_labor']   = $linked->getEstLaborCost();
                    $data['linked_est_contractor'] = $linked->getEstContractorCost();
                    $data['linked_est_total']   = $linked->getEstPartsCost() + $linked->getEstLaborCost() + $linked->getEstContractorCost();
                    $data['linked_target']      = $linked->getTargetCompletion();
                }
            } catch (\Exception $e) {}
            $result[] = $data;
        }
        return $result;
    }

    private function calcEstTotal(array $items): float {
        $total = 0;
        foreach ($items as $item) {
            try {
                if ($item->getItemType() === 'modernization') {
                    $linked = $this->modMapper->find($item->getItemId());
                    $total += $linked->getEstPartsCost() + $linked->getEstLaborCost() + $linked->getEstContractorCost();
                }
            } catch (\Exception $e) {}
        }
        return $total;
    }
}
