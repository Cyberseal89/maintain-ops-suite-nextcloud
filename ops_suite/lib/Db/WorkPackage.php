<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class WorkPackage extends Entity implements \JsonSerializable {
    protected string  $title       = '';
    protected string  $description = '';
    protected ?int    $platformId  = null;
    protected string  $status      = 'draft';
    protected string  $packageType = 'mixed';
    protected string  $assignedTo  = '';
    protected string  $approver    = '';
    protected string  $rfqNumber   = '';
    protected ?string $rfqDueDate  = null;
    protected string  $notes       = '';
    protected string  $createdBy   = '';
    protected string  $createdAt   = '';
    protected string  $updatedAt   = '';

    public function jsonSerialize(): array {
        return [
            'id'           => $this->getId(),
            'title'        => $this->title,
            'description'  => $this->description,
            'platform_id'  => $this->platformId,
            'status'       => $this->status,
            'package_type' => $this->packageType,
            'assigned_to'  => $this->assignedTo,
            'approver'     => $this->approver,
            'rfq_number'   => $this->rfqNumber,
            'rfq_due_date' => $this->rfqDueDate,
            'notes'        => $this->notes,
            'created_by'   => $this->createdBy,
            'created_at'   => $this->createdAt,
            'updated_at'   => $this->updatedAt,
        ];
    }
}
