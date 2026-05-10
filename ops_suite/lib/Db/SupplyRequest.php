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
    protected ?string $lastRevalidatedAt = null;
    protected ?string $revalidationDue   = null;
    protected string  $createdBy         = '';
    protected string  $createdAt   = '';
    protected string  $updatedAt   = '';

    public function jsonSerialize(): array {
        return [
            'id'           => $this->getId(),
            'title'        => $this->title,
            'platform_id'  => $this->platformId,
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
            'last_revalidated_at' => $this->lastRevalidatedAt,
            'revalidation_due'    => $this->revalidationDue,
            'created_by'          => $this->createdBy,
            'created_at'   => $this->createdAt,
            'updated_at'   => $this->updatedAt,
        ];
    }
}
