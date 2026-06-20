<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

class SupplyRequest extends Entity implements \JsonSerializable {
    protected string  $title       = '';
    protected ?int    $platformId  = null;
    protected string  $sourceType  = 'manual';
    protected ?int    $sourceId    = null;
    protected string  $status      = 'draft';
    protected string  $priority    = 'routine';
    protected string  $rfqNumber   = '';
    protected ?string $neededBy    = null;
    protected string  $requestedBy = '';
    protected string  $approvedBy  = '';
    protected ?string $approvedAt  = null;
    protected string  $notes       = '';
    protected ?int    $shopId             = null;
    protected string  $budgetStatus       = 'unbudgeted';
    protected ?int    $budgetFiscalYear   = null;
    protected ?string $lastRevalidatedAt = null;
    protected ?string $revalidationDue   = null;
    protected string  $createdBy         = '';
    protected string  $createdAt   = '';
    protected string  $updatedAt   = '';

    public function getShopId(): ?int                  { return $this->shopId; }
    public function setShopId(?int $v): void           { $this->shopId = $v; $this->markFieldUpdated('shopId'); }
    public function getBudgetStatus(): string          { return $this->budgetStatus; }
    public function setBudgetStatus(string $v): void   { $this->budgetStatus = $v; $this->markFieldUpdated('budgetStatus'); }
    public function getBudgetFiscalYear(): ?int        { return $this->budgetFiscalYear; }
    public function setBudgetFiscalYear(?int $v): void { $this->budgetFiscalYear = $v; $this->markFieldUpdated('budgetFiscalYear'); }

    public function jsonSerialize(): array {
        return [
            'id'           => $this->getId(),
            'title'        => $this->title,
            'platform_id'  => $this->platformId,
            'shop_id'      => $this->shopId,
            'source_type'  => $this->sourceType,
            'source_id'    => $this->sourceId,
            'status'       => $this->status,
            'priority'     => $this->priority,
            'rfq_number'   => $this->rfqNumber,
            'needed_by'    => $this->neededBy,
            'requested_by' => $this->requestedBy,
            'approved_by'  => $this->approvedBy,
            'approved_at'  => $this->approvedAt,
            'notes'        => $this->notes,
            'budget_status'      => $this->budgetStatus,
            'budget_fiscal_year' => $this->budgetFiscalYear,
            'last_revalidated_at' => $this->lastRevalidatedAt,
            'revalidation_due'    => $this->revalidationDue,
            'created_by'          => $this->createdBy,
            'created_at'   => $this->createdAt,
            'updated_at'   => $this->updatedAt,
        ];
    }
}
