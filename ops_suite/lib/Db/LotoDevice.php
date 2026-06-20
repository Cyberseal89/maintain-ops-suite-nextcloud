<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class LotoDevice extends Entity implements \JsonSerializable {

    protected ?string $deviceType       = null;
    protected ?string $serialNumber     = null;
    protected ?string $color            = null;
    protected ?string $keyNumber        = null;
    protected ?string $description      = null;
    protected ?string $status           = null;
    protected ?int    $assignedSessionId = null;
    protected ?string $notes            = null;
    protected ?string $createdAt        = null;
    protected ?string $updatedAt        = null;

    public function jsonSerialize(): array {
        return [
            'id'                  => $this->getId(),
            'device_type'         => $this->deviceType,
            'serial_number'       => $this->serialNumber,
            'color'               => $this->color,
            'key_number'          => $this->keyNumber,
            'description'         => $this->description,
            'status'              => $this->status,
            'assigned_session_id' => $this->assignedSessionId,
            'notes'               => $this->notes,
            'created_at'          => $this->createdAt,
            'updated_at'          => $this->updatedAt,
        ];
    }
}
