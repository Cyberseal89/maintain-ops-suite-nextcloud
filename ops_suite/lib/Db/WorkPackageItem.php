<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class WorkPackageItem extends Entity implements \JsonSerializable {
    protected int    $packageId = 0;
    protected string $itemType  = '';
    protected int    $itemId    = 0;
    protected string $notes     = '';
    protected string $createdBy = '';
    protected string $createdAt = '';

    public function jsonSerialize(): array {
        return [
            'id'         => $this->getId(),
            'package_id' => $this->packageId,
            'item_type'  => $this->itemType,
            'item_id'    => $this->itemId,
            'notes'      => $this->notes,
            'created_by' => $this->createdBy,
            'created_at' => $this->createdAt,
        ];
    }
}
