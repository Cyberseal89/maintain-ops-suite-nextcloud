<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class ProjectItem extends Entity implements \JsonSerializable {
    protected int     $projectId    = 0;
    protected string  $itemType     = '';
    protected ?int    $itemId       = null;
    protected string  $title        = '';
    protected ?string $plannedStart = null;
    protected ?string $plannedEnd   = null;
    protected ?string $actualStart  = null;
    protected ?string $actualEnd    = null;
    protected int     $sequence     = 0;
    protected string  $dependsOn    = '[]';
    protected string  $status       = 'pending';
    protected string  $notes        = '';
    protected string  $createdBy    = '';
    protected string  $createdAt    = '';

    public function jsonSerialize(): array {
        return [
            'id'            => $this->getId(),
            'project_id'    => $this->projectId,
            'item_type'     => $this->itemType,
            'item_id'       => $this->itemId,
            'title'         => $this->title,
            'planned_start' => $this->plannedStart,
            'planned_end'   => $this->plannedEnd,
            'actual_start'  => $this->actualStart,
            'actual_end'    => $this->actualEnd,
            'sequence'      => $this->sequence,
            'depends_on'    => $this->dependsOn,
            'status'        => $this->status,
            'notes'         => $this->notes,
            'created_by'    => $this->createdBy,
            'created_at'    => $this->createdAt,
        ];
    }
}
