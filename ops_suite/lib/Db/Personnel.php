<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method ?string getNextcloudUid()    @method void setNextcloudUid(?string $v)
 * @method string  getFirstName()       @method void setFirstName(string $v)
 * @method string  getLastName()        @method void setLastName(string $v)
 * @method ?string getRole()            @method void setRole(?string $v)
 * @method ?int    getShopId()          @method void setShopId(?int $v)
 * @method ?int    getPlatformId()      @method void setPlatformId(?int $v)
 * @method ?string getEmail()           @method void setEmail(?string $v)
 * @method ?string getPhone()           @method void setPhone(?string $v)
 * @method string  getStatus()          @method void setStatus(string $v)
 * @method ?string getNotes()           @method void setNotes(?string $v)
 * @method ?string getCreatedAt()       @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()       @method void setUpdatedAt(?string $v)
 */
class Personnel extends Entity implements \JsonSerializable {
    protected ?string $nextcloudUid = null;
    protected string  $firstName    = '';
    protected string  $lastName     = '';
    protected ?string $role         = null;
    protected ?int    $shopId       = null;
    protected ?int    $platformId   = null;
    protected ?string $email        = null;
    protected ?string $phone        = null;
    protected string  $status       = 'active';
    protected ?string $notes        = null;
    protected ?string $createdAt    = null;
    protected ?string $updatedAt    = null;

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'nextcloud_uid'  => $this->nextcloudUid,
            'first_name'     => $this->firstName,
            'last_name'      => $this->lastName,
            'full_name'      => trim($this->firstName . ' ' . $this->lastName),
            'role'           => $this->role,
            'shop_id'        => $this->shopId,
            'platform_id'    => $this->platformId,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'status'         => $this->status,
            'notes'          => $this->notes,
            'created_at'     => $this->createdAt,
            'updated_at'     => $this->updatedAt,
        ];
    }
}
