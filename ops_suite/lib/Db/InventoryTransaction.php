<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

class InventoryTransaction extends Entity implements \JsonSerializable {
    protected int    $inventoryId     = 0;
    protected string $transactionType = '';
    protected float  $quantity        = 0;
    protected string $referenceType   = '';
    protected ?int   $referenceId     = null;
    protected string $notes           = '';
    protected string $createdBy       = '';
    protected string $createdAt       = '';

    public function jsonSerialize(): array {
        return [
            'id'               => $this->getId(),
            'inventory_id'     => $this->inventoryId,
            'transaction_type' => $this->transactionType,
            'quantity'         => $this->quantity,
            'reference_type'   => $this->referenceType,
            'reference_id'     => $this->referenceId,
            'notes'            => $this->notes,
            'created_by'       => $this->createdBy,
            'created_at'       => $this->createdAt,
        ];
    }
}
