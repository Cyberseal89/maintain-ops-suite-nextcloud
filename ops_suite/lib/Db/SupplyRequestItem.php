<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

class SupplyRequestItem extends Entity implements \JsonSerializable {
    protected int    $requestId         = 0;
    protected string $itemName          = '';
    protected string $partNumber        = '';
    protected string $description       = '';
    protected float  $quantityRequested = 1;
    protected float  $quantityReceived  = 0;
    protected float  $unitCostEst       = 0;
    protected float  $unitCostActual    = 0;
    protected string $vendor            = '';
    protected string $status            = 'pending';
    protected string $notes             = '';
    protected string $createdAt         = '';

    public function jsonSerialize(): array {
        return [
            'id'                 => $this->getId(),
            'request_id'         => $this->requestId,
            'item_name'          => $this->itemName,
            'part_number'        => $this->partNumber,
            'description'        => $this->description,
            'quantity_requested' => $this->quantityRequested,
            'quantity_received'  => $this->quantityReceived,
            'unit_cost_est'      => $this->unitCostEst,
            'unit_cost_actual'   => $this->unitCostActual,
            'est_total'          => $this->quantityRequested * $this->unitCostEst,
            'actual_total'       => $this->quantityReceived  * $this->unitCostActual,
            'vendor'             => $this->vendor,
            'status'             => $this->status,
            'notes'              => $this->notes,
            'created_at'         => $this->createdAt,
        ];
    }
}
