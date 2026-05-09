<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()         @method void setName(string $v)
 * @method string  getDescription()  @method void setDescription(string $v)
 * @method string  getLocation()     @method void setLocation(string $v)
 * @method string  getGroupName()    @method void setGroupName(string $v)
 * @method string  getCreatedBy()    @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()    @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()    @method void setUpdatedAt(string $v)
 */
class Platform extends Entity implements \JsonSerializable {
    protected string $name        = '';
    protected string $description = '';
    protected string $location    = '';
    protected string $groupName   = '';
    protected string $createdBy   = '';
    protected string $createdAt   = '';
    protected string $updatedAt   = '';

    public function jsonSerialize(): array {
        return [
            'id'          => $this->getId(),
            'name'        => $this->name,
            'description' => $this->description,
            'location'    => $this->location,
            'group_name'  => $this->groupName,
            'created_by'  => $this->createdBy,
            'created_at'  => $this->createdAt,
            'updated_at'  => $this->updatedAt,
        ];
    }
}
