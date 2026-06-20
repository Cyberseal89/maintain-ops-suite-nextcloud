<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getCode()        @method void setCode(string $v)
 * @method string  getName()        @method void setName(string $v)
 * @method ?string getCategory()    @method void setCategory(?string $v)
 * @method ?string getDescription() @method void setDescription(?string $v)
 * @method ?string getCreatedAt()   @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()   @method void setUpdatedAt(?string $v)
 */
class SkillsCatalog extends Entity implements \JsonSerializable {
    protected string  $code        = '';
    protected string  $name        = '';
    protected ?string $category    = null;
    protected ?string $description = null;
    protected ?string $createdAt   = null;
    protected ?string $updatedAt   = null;

    public function jsonSerialize(): array {
        return [
            'id'          => $this->getId(),
            'code'        => $this->code,
            'name'        => $this->name,
            'category'    => $this->category,
            'description' => $this->description,
            'created_at'  => $this->createdAt,
            'updated_at'  => $this->updatedAt,
        ];
    }
}
