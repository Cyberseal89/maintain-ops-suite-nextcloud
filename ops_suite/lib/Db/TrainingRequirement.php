<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

/**
 * @method int|null getSourceId()        @method void setSourceId(?int $v)
 * @method string   getSourceType()      @method void setSourceType(string $v)
 * @method string   getTitle()           @method void setTitle(string $v)
 * @method string|null getDescription()  @method void setDescription(?string $v)
 * @method string   getTrainingType()    @method void setTrainingType(string $v)
 * @method string|null getS6000tTaskCode() @method void setS6000tTaskCode(?string $v)
 * @method string|null getS6000tWuc()    @method void setS6000tWuc(?string $v)
 * @method int|null getSkillLevel()      @method void setSkillLevel(?int $v)
 * @method string|null getManHours()     @method void setManHours(?string $v)
 * @method string|null getRequiredByDate() @method void setRequiredByDate(?string $v)
 * @method string   getStatus()          @method void setStatus(string $v)
 * @method string|null getAssignedTo()   @method void setAssignedTo(?string $v)
 * @method string|null getCompletedDate() @method void setCompletedDate(?string $v)
 * @method int|null getPlatformId()      @method void setPlatformId(?int $v)
 * @method string|null getNotes()        @method void setNotes(?string $v)
 * @method string|null getCreatedAt()    @method void setCreatedAt(?string $v)
 * @method string|null getUpdatedAt()    @method void setUpdatedAt(?string $v)
 */
class TrainingRequirement extends Entity implements \JsonSerializable {
    protected $sourceType   = 'standalone';
    protected $sourceId;
    protected $title        = '';
    protected $description;
    protected $trainingType = 'initial';
    protected $s6000tTaskCode;
    protected $s6000tWuc;
    protected $skillLevel;
    protected $manHours;
    protected $requiredByDate;
    protected $status       = 'pending';
    protected $assignedTo;
    protected $completedDate;
    protected $platformId;
    protected $notes;
    protected $createdAt;
    protected $updatedAt;

    public function jsonSerialize(): array {
        return [
            'id'               => $this->id,
            'source_type'      => $this->sourceType,
            'source_id'        => $this->sourceId,
            'title'            => $this->title,
            'description'      => $this->description,
            'training_type'    => $this->trainingType,
            's6000t_task_code' => $this->s6000tTaskCode,
            's6000t_wuc'       => $this->s6000tWuc,
            'skill_level'      => $this->skillLevel ? (int)$this->skillLevel : null,
            'man_hours'        => $this->manHours !== null ? (float)$this->manHours : null,
            'required_by_date' => $this->requiredByDate,
            'status'           => $this->status,
            'assigned_to'      => $this->assignedTo,
            'completed_date'   => $this->completedDate,
            'platform_id'      => $this->platformId ? (int)$this->platformId : null,
            'notes'            => $this->notes,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
