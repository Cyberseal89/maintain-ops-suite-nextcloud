<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

class SoftwareRequest extends Entity implements \JsonSerializable {
    protected $nodeId;
    protected $catalogId;
    protected $requestedBy;
    protected $status;
    protected $deficiencyId;
    protected $customDescription;
    protected $approvedBy;
    protected $approvedAt;
    protected $installedAt;
    protected $notes;
    protected $createdAt;
    protected $updatedAt;

    public function __construct() {}

    public function jsonSerialize(): array {
        return [
            'id'            => $this->id,
            'node_id'       => (int)$this->nodeId,
            'catalog_id'    => (int)$this->catalogId,
            'requested_by'  => $this->requestedBy,
            'status'        => $this->status,
            'deficiency_id'      => $this->deficiencyId ? (int)$this->deficiencyId : null,
            'custom_description' => $this->customDescription,
            'approved_by'        => $this->approvedBy,
            'approved_at'   => $this->approvedAt,
            'installed_at'  => $this->installedAt,
            'notes'         => $this->notes,
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];
    }
}
