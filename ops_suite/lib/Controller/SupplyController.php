<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\SupplyRequestMapper;
use OCA\OpsSuite\Db\SupplyRequestItemMapper;
use OCA\OpsSuite\Db\InventoryItemMapper;
use OCA\OpsSuite\Db\InventoryTransactionMapper;
use OCA\OpsSuite\Db\SupplyRequest;
use OCA\OpsSuite\Db\SupplyRequestItem;
use OCA\OpsSuite\Db\InventoryItem;
use OCA\OpsSuite\Db\InventoryTransaction;
use OCA\OpsSuite\Service\PermissionService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Db\DoesNotExistException;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;
use OCP\IUserSession;

class SupplyController extends Controller {
    public function __construct(
        string                          $appName,
        IRequest                        $request,
        private readonly SupplyRequestMapper      $mapper,
        private readonly SupplyRequestItemMapper  $itemMapper,
        private readonly InventoryItemMapper      $invMapper,
        private readonly InventoryTransactionMapper $txMapper,
        private readonly PermissionService        $permission,
        private readonly IUserSession             $userSession
    ) {
        parent::__construct($appName, $request);
    }

    // ── Supply Requests ───────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexRequests(): DataResponse {
        $status   = $this->request->getParam('status')   ?: null;
        $priority = $this->request->getParam('priority') ?: null;
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds   = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];
        $requests = $this->mapper->findAll($status, $priority, $platformIds);
        $result = [];
        foreach ($requests as $req) {
            $data  = $req->jsonSerialize();
            $items = $this->itemMapper->findForRequest($req->getId());
            $data['item_count'] = count($items);
            $data['est_total']  = array_sum(array_map(fn($i) => $i->getQuantityRequested() * $i->getUnitCostEst(), $items));
            $result[] = $data;
        }
        return new DataResponse($result);
    }

    /** @NoAdminRequired */
    public function showRequest(int $id): DataResponse {
        try {
            $req   = $this->mapper->find($id);
            $items = $this->itemMapper->findForRequest($id);
            $data  = $req->jsonSerialize();
            $data['items']     = array_map(fn($i) => $i->jsonSerialize(), $items);
            $data['est_total'] = array_sum(array_map(fn($i) => $i->getQuantityRequested() * $i->getUnitCostEst(), $items));
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createRequest(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';
        $rfq  = 'SRFQ-' . strtoupper(substr(md5(uniqid()), 0, 8));

        $req = new SupplyRequest();
        $req->setTitle($data['title'] ?? '');
        $req->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $req->setSourceType($data['source_type'] ?? 'manual');
        $req->setSourceId(isset($data['source_id']) && $data['source_id'] ? (int)$data['source_id'] : null);
        $req->setStatus($data['status'] ?? 'draft');
        $req->setPriority($data['priority'] ?? 'routine');
        $req->setRfqNumber($rfq);
        $req->setNeededBy($data['needed_by'] ?: null);
        $req->setRequestedBy($data['requested_by'] ?? $uid);
        $req->setNotes($data['notes'] ?? '');
        $req->setCreatedBy($uid);
        $req->setCreatedAt($now);
        $req->setUpdatedAt($now);

        return new DataResponse($this->mapper->insert($req)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateRequest(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $req = $this->mapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $data = $this->request->getParams();
        if (array_key_exists('title', $data))        $req->setTitle($data['title']);
        if (array_key_exists('status', $data))       $req->setStatus($data['status']);
        if (array_key_exists('priority', $data))     $req->setPriority($data['priority']);
        if (array_key_exists('needed_by', $data))    $req->setNeededBy($data['needed_by'] ?: null);
        if (array_key_exists('requested_by', $data)) $req->setRequestedBy($data['requested_by']);
        if (array_key_exists('notes', $data))        $req->setNotes($data['notes']);
        if (array_key_exists('platform_id', $data))  $req->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);

        // Auto-set approved_by when status moves to approved
        $uid = $this->userSession->getUser()?->getUID() ?? '';
        if (isset($data['status']) && $data['status'] === 'approved' && $req->getStatus() !== 'approved') {
            $req->setApprovedBy($uid);
            $req->setApprovedAt(date('Y-m-d H:i:s'));
        }
        $req->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($req)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyRequest(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->itemMapper->deleteForRequest($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function addRequestItem(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $item = new SupplyRequestItem();
        $item->setRequestId($id);
        $item->setItemName($data['item_name'] ?? '');
        $item->setPartNumber($data['part_number'] ?? '');
        $item->setDescription($data['description'] ?? '');
        $item->setQuantityRequested((float)($data['quantity_requested'] ?? 1));
        $item->setUnitCostEst((float)($data['unit_cost_est'] ?? 0));
        $item->setVendor($data['vendor'] ?? '');
        $item->setStatus('pending');
        $item->setNotes($data['notes'] ?? '');
        $item->setCreatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->itemMapper->insert($item)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateRequestItem(int $id, int $itemId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $item = $this->itemMapper->find($itemId); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }
        $data = $this->request->getParams();
        if (array_key_exists('item_name', $data))          $item->setItemName($data['item_name']);
        if (array_key_exists('part_number', $data))        $item->setPartNumber($data['part_number']);
        if (array_key_exists('description', $data))        $item->setDescription($data['description']);
        if (array_key_exists('quantity_requested', $data)) $item->setQuantityRequested((float)$data['quantity_requested']);
        if (array_key_exists('quantity_received', $data))  $item->setQuantityReceived((float)$data['quantity_received']);
        if (array_key_exists('unit_cost_est', $data))      $item->setUnitCostEst((float)$data['unit_cost_est']);
        if (array_key_exists('unit_cost_actual', $data))   $item->setUnitCostActual((float)$data['unit_cost_actual']);
        if (array_key_exists('vendor', $data))             $item->setVendor($data['vendor']);
        if (array_key_exists('status', $data))             $item->setStatus($data['status']);
        if (array_key_exists('notes', $data))              $item->setNotes($data['notes']);
        return new DataResponse($this->itemMapper->update($item)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function deleteRequestItem(int $id, int $itemId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->itemMapper->delete($this->itemMapper->find($itemId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Inventory ─────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexInventory(): DataResponse {
        $category    = $this->request->getParam('category') ?: null;
        $belowReorder = (bool)$this->request->getParam('below_reorder');
        $platformParam = $this->request->getParam('platform_ids', '');
        $platformIds   = $platformParam ? array_map('intval', explode(',', $platformParam)) : [];
        $items = $this->invMapper->findAll($category, $platformIds, $belowReorder);
        return new DataResponse(array_map(fn($i) => $i->jsonSerialize(), $items));
    }

    /** @NoAdminRequired */
    public function showInventory(int $id): DataResponse {
        try {
            $item = $this->invMapper->find($id);
            $data = $item->jsonSerialize();
            $data['transactions'] = array_map(fn($t) => $t->jsonSerialize(), $this->txMapper->findForItem($id));
            return new DataResponse($data);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    /** @NoAdminRequired */
    public function createInventory(): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $now  = date('Y-m-d H:i:s');
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $item = new InventoryItem();
        $item->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $item->setItemName($data['item_name'] ?? '');
        $item->setPartNumber($data['part_number'] ?? '');
        $item->setDescription($data['description'] ?? '');
        $item->setCategory($data['category'] ?? 'other');
        $item->setQuantityOnHand((float)($data['quantity_on_hand'] ?? 0));
        $item->setReorderPoint((float)($data['reorder_point'] ?? 0));
        $item->setUnitCost((float)($data['unit_cost'] ?? 0));
        $item->setLocation($data['location'] ?? '');
        $item->setVendor($data['vendor'] ?? '');
        $item->setLeadTimeDays((int)($data['lead_time_days'] ?? 0));
        $item->setCreatedBy($uid);
        $item->setCreatedAt($now);
        $item->setUpdatedAt($now);

        $created = $this->invMapper->insert($item);

        // Record initial stock transaction if quantity > 0
        if ($created->getQuantityOnHand() > 0) {
            $tx = new InventoryTransaction();
            $tx->setInventoryId($created->getId());
            $tx->setTransactionType('receive');
            $tx->setQuantity($created->getQuantityOnHand());
            $tx->setNotes('Initial stock entry');
            $tx->setCreatedBy($uid);
            $tx->setCreatedAt($now);
            $this->txMapper->insert($tx);
        }

        return new DataResponse($created->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateInventory(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $item = $this->invMapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }
        $data = $this->request->getParams();
        if (array_key_exists('item_name', $data))    $item->setItemName($data['item_name']);
        if (array_key_exists('part_number', $data))  $item->setPartNumber($data['part_number']);
        if (array_key_exists('description', $data))  $item->setDescription($data['description']);
        if (array_key_exists('category', $data))     $item->setCategory($data['category']);
        if (array_key_exists('reorder_point', $data))$item->setReorderPoint((float)$data['reorder_point']);
        if (array_key_exists('unit_cost', $data))    $item->setUnitCost((float)$data['unit_cost']);
        if (array_key_exists('location', $data))     $item->setLocation($data['location']);
        if (array_key_exists('vendor', $data))       $item->setVendor($data['vendor']);
        if (array_key_exists('lead_time_days', $data))$item->setLeadTimeDays((int)$data['lead_time_days']);
        $item->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->invMapper->update($item)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function transactInventory(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try { $item = $this->invMapper->find($id); }
        catch (DoesNotExistException) { return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND); }

        $data = $this->request->getParams();
        $type = $data['transaction_type'] ?? '';
        $qty  = (float)($data['quantity'] ?? 0);
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        if (!in_array($type, ['receive','issue','adjust','return'])) {
            return new DataResponse(['message' => 'Invalid transaction type'], Http::STATUS_BAD_REQUEST);
        }
        if ($qty <= 0) {
            return new DataResponse(['message' => 'Quantity must be positive'], Http::STATUS_BAD_REQUEST);
        }

        // Update quantity
        $current = $item->getQuantityOnHand();
        if ($type === 'receive' || $type === 'return') {
            $item->setQuantityOnHand($current + $qty);
        } elseif ($type === 'issue') {
            if ($current < $qty) {
                return new DataResponse(['message' => 'Insufficient stock'], Http::STATUS_CONFLICT);
            }
            $item->setQuantityOnHand($current - $qty);
        } elseif ($type === 'adjust') {
            $item->setQuantityOnHand($qty); // adjust sets absolute value
        }
        $item->setUpdatedAt(date('Y-m-d H:i:s'));
        $this->invMapper->update($item);

        // Record transaction
        $tx = new InventoryTransaction();
        $tx->setInventoryId($id);
        $tx->setTransactionType($type);
        $tx->setQuantity($qty);
        $tx->setReferenceType($data['reference_type'] ?? '');
        $tx->setReferenceId(isset($data['reference_id']) && $data['reference_id'] ? (int)$data['reference_id'] : null);
        $tx->setNotes($data['notes'] ?? '');
        $tx->setCreatedBy($uid);
        $tx->setCreatedAt(date('Y-m-d H:i:s'));
        $this->txMapper->insert($tx);

        return new DataResponse($item->jsonSerialize());
    }
}
