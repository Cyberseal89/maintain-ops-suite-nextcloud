<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class AvailProject extends Entity implements \JsonSerializable {
    protected string  $title       = '';
    protected string  $description = '';
    protected ?int    $platformId  = null;
    protected string  $status      = 'planning';
    protected ?string $startDate   = null;
    protected ?string $endDate     = null;
    protected string  $assignedTo  = '';
    protected string  $approver    = '';
    protected string  $createdBy   = '';
    protected string  $createdAt   = '';
    protected string  $updatedAt   = '';

    public function jsonSerialize(): array {
        return [
            'id'          => $this->getId(),
            'title'       => $this->title,
            'description' => $this->description,
            'platform_id' => $this->platformId,
            'status'      => $this->status,
            'start_date'  => $this->startDate,
            'end_date'    => $this->endDate,
            'assigned_to' => $this->assignedTo,
            'approver'    => $this->approver,
            'created_by'  => $this->createdBy,
            'created_at'  => $this->createdAt,
            'updated_at'  => $this->updatedAt,
        ];
    }
}
