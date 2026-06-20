<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class WpQuote extends Entity implements \JsonSerializable {
    protected int     $workPackageId = 0;
    protected string  $vendorName    = '';
    protected ?string $vendorContact = null;
    protected ?string $quoteAmount   = null;
    protected ?string $quoteDate     = null;
    protected ?string $validUntil    = null;
    protected ?string $notes         = null;
    protected int     $isSelected    = 0;
    protected ?string $createdBy     = null;
    protected ?string $createdAt     = null;

    public function jsonSerialize(): array {
        return [
            'id'              => $this->getId(),
            'work_package_id' => $this->workPackageId,
            'vendor_name'     => $this->vendorName,
            'vendor_contact'  => $this->vendorContact,
            'quote_amount'    => $this->quoteAmount !== null ? (float)$this->quoteAmount : null,
            'quote_date'      => $this->quoteDate,
            'valid_until'     => $this->validUntil,
            'notes'           => $this->notes,
            'is_selected'     => (bool)$this->isSelected,
            'created_by'      => $this->createdBy,
            'created_at'      => $this->createdAt,
        ];
    }
}
