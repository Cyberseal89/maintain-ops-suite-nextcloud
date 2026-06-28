<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getId()
 * @method string  getTitle()          @method void setTitle(string $v)
 * @method ?string getDescription()    @method void setDescription(?string $v)
 * @method string  getCreatedBy()      @method void setCreatedBy(string $v)
 * @method string  getVisibility()     @method void setVisibility(string $v)
 * @method ?string getCreatedAt()      @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()      @method void setUpdatedAt(?string $v)
 */
class ReportDashboard extends Entity implements \JsonSerializable {

    protected string  $title       = '';
    protected ?string $description = null;
    protected string  $createdBy   = '';
    protected string  $visibility  = 'personal';
    protected ?string $createdAt   = null;
    protected ?string $updatedAt   = null;

    public function jsonSerialize(): array {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'created_by'  => $this->createdBy,
            'visibility'  => $this->visibility,
            'created_at'  => $this->createdAt,
            'updated_at'  => $this->updatedAt,
        ];
    }
}
