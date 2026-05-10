<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

class InventoryItem extends Entity implements \JsonSerializable {
    protected ?int    $platformId       = null;
    protected string  $itemName         = '';
    protected string  $partNumber       = '';
    protected string  $description      = '';
    protected string  $category         = 'other';
    protected float   $quantityOnHand   = 0;
    protected float   $quantityReserved = 0;
    protected float   $reorderPoint     = 0;
    protected float   $unitCost         = 0;
    protected string  $location         = '';
    protected string  $vendor           = '';
    protected int     $leadTimeDays     = 0;
    protected string  $createdBy        = '';
    protected string  $createdAt        = '';
    protected string  $updatedAt        = '';

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'platform_id'       => $this->platformId,
            'item_name'         => $this->itemName,
            'part_number'       => $this->partNumber,
            'description'       => $this->description,
            'category'          => $this->category,
            'quantity_on_hand'  => $this->quantityOnHand,
            'quantity_reserved' => $this->quantityReserved,
            'quantity_available'=> max(0, $this->quantityOnHand - $this->quantityReserved),
            'reorder_point'     => $this->reorderPoint,
            'below_reorder'     => $this->quantityOnHand <= $this->reorderPoint,
            'unit_cost'         => $this->unitCost,
            'total_value'       => $this->quantityOnHand * $this->unitCost,
            'location'          => $this->location,
            'vendor'            => $this->vendor,
            'lead_time_days'    => $this->leadTimeDays,
            'created_by'        => $this->createdBy,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
