<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method ?int    getPlatformId()    @method void setPlatformId(?int $v)
 * @method string  getName()          @method void setName(string $v)
 * @method string  getCode()          @method void setCode(string $v)
 * @method string  getDiscipline()    @method void setDiscipline(string $v)
 * @method string  getDescription()   @method void setDescription(string $v)
 * @method string  getSupervisor()    @method void setSupervisor(string $v)
 * @method string  getCreatedBy()     @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()     @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()     @method void setUpdatedAt(string $v)
 */
class Shop extends Entity implements \JsonSerializable {
    protected ?int   $platformId  = null;
    protected string $name        = '';
    protected string $code        = '';
    protected string $discipline  = '';
    protected string $description = '';
    protected string $supervisor  = '';
    protected string $createdBy   = '';
    protected string $createdAt   = '';
    protected string $updatedAt   = '';

    public function jsonSerialize(): array {
        return [
            'id'          => $this->getId(),
            'platform_id' => $this->platformId,
            'name'        => $this->name,
            'code'        => $this->code,
            'discipline'  => $this->discipline,
            'description' => $this->description,
            'supervisor'  => $this->supervisor,
            'created_by'  => $this->createdBy,
            'created_at'  => $this->createdAt,
            'updated_at'  => $this->updatedAt,
        ];
    }
}
