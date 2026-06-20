<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class MmbpBudget extends Entity implements \JsonSerializable {
    protected ?int    $platformId      = null;
    protected ?int    $shopId          = null;
    protected int     $fiscalYear      = 0;
    protected string  $entryType       = 'platform'; // 'platform' | 'shop'
    protected string  $totalAuthorized = '0.00';
    protected string  $fundedObligation= '0.00';
    protected string  $ufrAmount       = '0.00';
    protected ?string $notes           = null;
    protected string  $createdAt       = '';
    protected string  $updatedAt       = '';

    public function getPlatformId(): ?int              { return $this->platformId; }
    public function setPlatformId(?int $v): void       { $this->platformId = $v; $this->markFieldUpdated('platformId'); }
    public function getShopId(): ?int                  { return $this->shopId; }
    public function setShopId(?int $v): void           { $this->shopId = $v; $this->markFieldUpdated('shopId'); }
    public function getFiscalYear(): int               { return $this->fiscalYear; }
    public function setFiscalYear(int $v): void        { $this->fiscalYear = $v; $this->markFieldUpdated('fiscalYear'); }
    public function getEntryType(): string             { return $this->entryType; }
    public function setEntryType(string $v): void      { $this->entryType = $v; $this->markFieldUpdated('entryType'); }
    public function getTotalAuthorized(): string       { return $this->totalAuthorized; }
    public function setTotalAuthorized(string $v): void{ $this->totalAuthorized = $v; $this->markFieldUpdated('totalAuthorized'); }
    public function getFundedObligation(): string      { return $this->fundedObligation; }
    public function setFundedObligation(string $v): void{ $this->fundedObligation = $v; $this->markFieldUpdated('fundedObligation'); }
    public function getUfrAmount(): string             { return $this->ufrAmount; }
    public function setUfrAmount(string $v): void      { $this->ufrAmount = $v; $this->markFieldUpdated('ufrAmount'); }
    public function getNotes(): ?string                { return $this->notes; }
    public function setNotes(?string $v): void         { $this->notes = $v; $this->markFieldUpdated('notes'); }
    public function getCreatedAt(): string             { return $this->createdAt; }
    public function setCreatedAt(string $v): void      { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }
    public function getUpdatedAt(): string             { return $this->updatedAt; }
    public function setUpdatedAt(string $v): void      { $this->updatedAt = $v; $this->markFieldUpdated('updatedAt'); }

    public function jsonSerialize(): array {
        return [
            'id'               => $this->getId(),
            'platform_id'      => $this->platformId,
            'shop_id'          => $this->shopId,
            'fiscal_year'      => $this->fiscalYear,
            'entry_type'       => $this->entryType,
            'total_authorized' => (float)$this->totalAuthorized,
            'funded_obligation'=> (float)$this->fundedObligation,
            'ufr_amount'       => (float)$this->ufrAmount,
            'notes'            => $this->notes,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
