<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getSourceType()     @method void setSourceType(string $v)
 * @method int     getSourceId()       @method void setSourceId(int $v)
 * @method ?int    getSkillId()        @method void setSkillId(?int $v)
 * @method int     getQtyRequired()    @method void setQtyRequired(int $v)
 * @method ?string getDurationHours()  @method void setDurationHours(?string $v)
 * @method ?string getNotes()          @method void setNotes(?string $v)
 * @method ?string getCreatedAt()      @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()      @method void setUpdatedAt(?string $v)
 */
class ManpowerRequirement extends Entity implements \JsonSerializable {
    protected string  $sourceType    = '';
    protected int     $sourceId      = 0;
    protected ?int    $skillId       = null;
    protected int     $qtyRequired   = 1;
    protected ?string $durationHours = null;
    protected ?string $notes         = null;
    protected ?string $createdAt     = null;
    protected ?string $updatedAt     = null;

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'source_type'    => $this->sourceType,
            'source_id'      => $this->sourceId,
            'skill_id'       => $this->skillId,
            'qty_required'   => $this->qtyRequired,
            'duration_hours' => $this->durationHours !== null ? (float)$this->durationHours : null,
            'notes'          => $this->notes,
            'created_at'     => $this->createdAt,
            'updated_at'     => $this->updatedAt,
        ];
    }
}
