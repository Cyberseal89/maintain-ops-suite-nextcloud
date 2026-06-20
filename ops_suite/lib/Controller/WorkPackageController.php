<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Controller;

use OCA\OpsSuite\Db\WorkPackageMapper;
use OCA\OpsSuite\Db\WorkPackageItemMapper;
use OCA\OpsSuite\Db\WpQuoteMapper;
use OCA\OpsSuite\Db\WpQuote;
use OCA\OpsSuite\Db\ProcedureMapper;
use OCA\OpsSuite\Db\ModernizationMapper;
use OCA\OpsSuite\Db\DeficiencyMapper;
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

    private const TRANSITIONS = [
        'drafting'        => ['rfq_issued', 'complete'],
        'draft'           => ['rfq_issued', 'complete'],   // legacy value
        'rfq_issued'      => ['quotes_received', 'drafting'],
        'quotes_received' => ['awarded', 'rfq_issued'],
        'awarded'         => ['in_progress'],
        'in_progress'     => ['complete'],
        'complete'        => [],
        'submitted'       => ['rfq_issued', 'complete'],   // legacy value
        'approved'        => ['in_progress', 'complete'],  // legacy value
    ];

    public function __construct(
        string                       $appName,
        IRequest                     $request,
        private readonly WorkPackageMapper     $mapper,
        private readonly WorkPackageItemMapper $itemMapper,
        private readonly WpQuoteMapper         $quoteMapper,
        private readonly ProcedureMapper       $procMapper,
        private readonly ModernizationMapper   $modMapper,
        private readonly DeficiencyMapper      $defMapper,
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

        $result = [];
        foreach ($packages as $pkg) {
            $data  = $pkg->jsonSerialize();
            $items = $this->itemMapper->findForPackage($pkg->getId());
            $data['item_count']   = count($items);
            $data['est_total']    = $this->calcEstTotal($items);
            $data['quote_count']  = count($this->quoteMapper->findForPackage($pkg->getId()));
            $result[] = $data;
        }
        return new DataResponse($result);
    }

    /** @NoAdminRequired */
    public function show(int $id): DataResponse {
        try {
            $pkg    = $this->mapper->find($id);
            $items  = $this->itemMapper->findForPackage($id);
            $quotes = $this->quoteMapper->findForPackage($id);
            $data   = $pkg->jsonSerialize();
            $data['items']       = $this->enrichItems($items);
            $data['est_total']   = $this->calcEstTotal($items);
            $data['quotes']      = array_map(fn($q) => $q->jsonSerialize(), $quotes);
            $data['source_label']= $this->resolveSourceLabel($pkg->getSourceType(), $pkg->getSourceId());
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

        $rfqNumber = 'RFQ-' . strtoupper(substr(md5(uniqid()), 0, 8));

        $pkg = new WorkPackage();
        $pkg->setTitle($data['title'] ?? '');
        $pkg->setDescription($data['description'] ?? '');
        $pkg->setPlatformId(isset($data['platform_id']) && $data['platform_id'] ? (int)$data['platform_id'] : null);
        $pkg->setStatus('drafting');
        $pkg->setPackageType($data['package_type'] ?? 'mixed');
        $pkg->setAssignedTo($data['assigned_to'] ?? '');
        $pkg->setApprover($data['approver'] ?? '');
        $pkg->setRfqNumber($rfqNumber);
        $pkg->setRfqDueDate($data['rfq_due_date'] ?: null);
        $pkg->setNotes($data['notes'] ?? '');
        $pkg->setSourceType($data['source_type'] ?: null);
        $pkg->setSourceId(isset($data['source_id']) && $data['source_id'] ? (int)$data['source_id'] : null);
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

        // Status transition validation
        if (array_key_exists('status', $data) && $data['status'] !== $pkg->getStatus()) {
            $allowed = self::TRANSITIONS[$pkg->getStatus()] ?? [];
            if (!empty($allowed) && !in_array($data['status'], $allowed, true)) {
                return new DataResponse([
                    'message' => 'Invalid transition: ' . $pkg->getStatus() . ' → ' . $data['status'],
                ], Http::STATUS_UNPROCESSABLE_ENTITY);
            }
            $pkg->setStatus($data['status']);
        }

        if (array_key_exists('title', $data))        $pkg->setTitle($data['title']);
        if (array_key_exists('description', $data))  $pkg->setDescription($data['description']);
        if (array_key_exists('platform_id', $data))  $pkg->setPlatformId($data['platform_id'] ? (int)$data['platform_id'] : null);
        if (array_key_exists('package_type', $data)) $pkg->setPackageType($data['package_type']);
        if (array_key_exists('assigned_to', $data))  $pkg->setAssignedTo($data['assigned_to']);
        if (array_key_exists('approver', $data))     $pkg->setApprover($data['approver']);
        if (array_key_exists('rfq_due_date', $data)) $pkg->setRfqDueDate($data['rfq_due_date'] ?: null);
        if (array_key_exists('notes', $data))        $pkg->setNotes($data['notes']);
        if (array_key_exists('source_type', $data))  $pkg->setSourceType($data['source_type'] ?: null);
        if (array_key_exists('source_id', $data))    $pkg->setSourceId($data['source_id'] ? (int)$data['source_id'] : null);

        $pkg->setUpdatedAt(date('Y-m-d H:i:s'));
        return new DataResponse($this->mapper->update($pkg)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroy(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->quoteMapper->deleteForPackage($id);
            $this->itemMapper->deleteForPackage($id);
            $this->mapper->delete($this->mapper->find($id));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Items ─────────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function addItem(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data     = $this->request->getParams();
        $itemType = $data['item_type'] ?? '';
        $itemId   = (int)($data['item_id'] ?? 0);
        $uid      = $this->userSession->getUser()?->getUID() ?? '';

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

    // ── Vendor Quotes ─────────────────────────────────────────────

    /** @NoAdminRequired */
    public function indexQuotes(int $id): DataResponse {
        $quotes = $this->quoteMapper->findForPackage($id);
        return new DataResponse(array_map(fn($q) => $q->jsonSerialize(), $quotes));
    }

    /** @NoAdminRequired */
    public function createQuote(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        $data = $this->request->getParams();
        $uid  = $this->userSession->getUser()?->getUID() ?? '';

        $quote = new WpQuote();
        $quote->setWorkPackageId($id);
        $quote->setVendorName($data['vendor_name'] ?? '');
        $quote->setVendorContact($data['vendor_contact'] ?: null);
        $quote->setQuoteAmount(isset($data['quote_amount']) && $data['quote_amount'] !== '' ? (string)(float)$data['quote_amount'] : null);
        $quote->setQuoteDate($data['quote_date'] ?: null);
        $quote->setValidUntil($data['valid_until'] ?: null);
        $quote->setNotes($data['notes'] ?: null);
        $quote->setIsSelected(0);
        $quote->setCreatedBy($uid);
        $quote->setCreatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->quoteMapper->insert($quote)->jsonSerialize(), Http::STATUS_CREATED);
    }

    /** @NoAdminRequired */
    public function updateQuote(int $id, int $quoteId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $quote = $this->quoteMapper->find($quoteId);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
        $data = $this->request->getParams();
        if (array_key_exists('vendor_name', $data))    $quote->setVendorName($data['vendor_name']);
        if (array_key_exists('vendor_contact', $data)) $quote->setVendorContact($data['vendor_contact'] ?: null);
        if (array_key_exists('quote_amount', $data))   $quote->setQuoteAmount($data['quote_amount'] !== '' ? (string)(float)$data['quote_amount'] : null);
        if (array_key_exists('quote_date', $data))     $quote->setQuoteDate($data['quote_date'] ?: null);
        if (array_key_exists('valid_until', $data))    $quote->setValidUntil($data['valid_until'] ?: null);
        if (array_key_exists('notes', $data))          $quote->setNotes($data['notes'] ?: null);

        return new DataResponse($this->quoteMapper->update($quote)->jsonSerialize());
    }

    /** @NoAdminRequired */
    public function destroyQuote(int $id, int $quoteId): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $this->quoteMapper->delete($this->quoteMapper->find($quoteId));
            return new DataResponse(['message' => 'Deleted']);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }
    }

    // ── Award ─────────────────────────────────────────────────────

    /** @NoAdminRequired */
    public function award(int $id): DataResponse {
        if (!$this->permission->canWrite()) {
            return new DataResponse(['message' => 'Insufficient permissions'], Http::STATUS_FORBIDDEN);
        }
        try {
            $pkg = $this->mapper->find($id);
        } catch (DoesNotExistException) {
            return new DataResponse(['message' => 'Not found'], Http::STATUS_NOT_FOUND);
        }

        $data       = $this->request->getParams();
        $quoteId    = isset($data['quote_id']) && $data['quote_id'] ? (int)$data['quote_id'] : null;
        $awardedTo  = $data['awarded_to'] ?? '';
        $awardAmount= isset($data['award_amount']) && $data['award_amount'] !== '' ? (float)$data['award_amount'] : null;
        $awardDate  = $data['award_date'] ?: date('Y-m-d');

        if (!$awardedTo) {
            return new DataResponse(['message' => 'awarded_to is required'], Http::STATUS_BAD_REQUEST);
        }

        // Mark selected quote
        if ($quoteId) {
            $this->quoteMapper->clearSelected($id);
            try {
                $quote = $this->quoteMapper->find($quoteId);
                $quote->setIsSelected(1);
                $this->quoteMapper->update($quote);
                if ($awardAmount === null && $quote->getQuoteAmount() !== null) {
                    $awardAmount = (float)$quote->getQuoteAmount();
                }
            } catch (DoesNotExistException) {}
        }

        $pkg->setAwardedTo($awardedTo);
        $pkg->setAwardAmount($awardAmount !== null ? (string)$awardAmount : null);
        $pkg->setAwardDate($awardDate);
        $pkg->setStatus('awarded');
        $pkg->setUpdatedAt(date('Y-m-d H:i:s'));

        return new DataResponse($this->mapper->update($pkg)->jsonSerialize());
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function enrichItems(array $items): array {
        $result = [];
        foreach ($items as $item) {
            $data = $item->jsonSerialize();
            try {
                switch ($item->getItemType()) {
                    case 'pm':
                        $linked = $this->procMapper->find($item->getItemId());
                        $data['linked_title']     = $linked->getName();
                        $data['linked_est_hours'] = $linked->getEstHours();
                        $data['linked_next_due']  = $linked->getNextDue();
                        break;
                    case 'modernization':
                        $linked = $this->modMapper->find($item->getItemId());
                        $data['linked_title']            = $linked->getTitle();
                        $data['linked_est_parts']        = $linked->getEstPartsCost();
                        $data['linked_est_labor']        = $linked->getEstLaborCost();
                        $data['linked_est_contractor']   = $linked->getEstContractorCost();
                        $data['linked_est_total']        = $linked->getEstPartsCost() + $linked->getEstLaborCost() + $linked->getEstContractorCost();
                        $data['linked_target']           = $linked->getTargetCompletion();
                        $data['linked_status']           = $linked->getStatus();
                        break;
                    case 'deficiency':
                        $linked = $this->defMapper->find($item->getItemId());
                        $data['linked_title']  = $linked->getSummary();
                        $data['linked_status'] = $linked->getStatus();
                        $data['linked_target'] = $linked->getTargetCompletion();
                        break;
                }
            } catch (\Exception) {}
            $result[] = $data;
        }
        return $result;
    }

    private function calcEstTotal(array $items): float {
        $total = 0.0;
        foreach ($items as $item) {
            try {
                if ($item->getItemType() === 'modernization') {
                    $linked = $this->modMapper->find($item->getItemId());
                    $total += $linked->getEstPartsCost() + $linked->getEstLaborCost() + $linked->getEstContractorCost();
                }
            } catch (\Exception) {}
        }
        return $total;
    }

    private function resolveSourceLabel(?string $sourceType, ?int $sourceId): ?string {
        if (!$sourceType || !$sourceId) return null;
        try {
            return match($sourceType) {
                'modernization' => $this->modMapper->find($sourceId)->getTitle(),
                'deficiency'    => $this->defMapper->find($sourceId)->getSummary(),
                default         => null,
            };
        } catch (\Exception) {
            return null;
        }
    }
}
