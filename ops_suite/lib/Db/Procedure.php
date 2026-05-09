<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()                     @method void setName(string $v)
 * @method int     getAssetId()                  @method void setAssetId(int $v)
 * @method string  getCategory()                 @method void setCategory(string $v)
 * @method string  getPeriodicity()              @method void setPeriodicity(string $v)
 * @method ?string getLastCompleted()            @method void setLastCompleted(?string $v)
 * @method ?string getNextDue()                  @method void setNextDue(?string $v)
 * @method string  getAssignedTo()               @method void setAssignedTo(string $v)
 * @method string  getDocumentRef()              @method void setDocumentRef(string $v)
 * @method string  getDescription()              @method void setDescription(string $v)
 * @method float   getEstHours()                 @method void setEstHours(float $v)
 * @method int     getCreateDeficiencyOnFail()   @method void setCreateDeficiencyOnFail(int $v)
 * @method string  getCreatedBy()                @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()                @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()                @method void setUpdatedAt(string $v)
 */
class Procedure extends Entity implements \JsonSerializable {
    protected string  $name                    = '';
    protected int     $assetId                 = 0;
    protected string  $category                = '';
    protected string  $periodicity             = 'monthly';
    protected ?string $lastCompleted           = null;
    protected ?string $nextDue                 = null;
    protected string  $assignedTo              = '';
    protected string  $documentRef             = '';
    protected string  $description             = '';
    protected float   $estHours                = 0;
    protected int     $createDeficiencyOnFail  = 0;
    protected string  $createdBy               = '';
    protected string  $createdAt               = '';
    protected string  $updatedAt               = '';

    public function jsonSerialize(): array {
        $id    = $this->getId();
        $today = new \DateTime();
        $status = 'current';
        if ($this->nextDue) {
            $due  = new \DateTime($this->nextDue);
            $diff = (int)$today->diff($due)->days;
            if ($due < $today)        { $status = 'overdue'; }
            elseif ($diff <= 7)       { $status = 'due_soon'; }
        }
        return [
            'id'                        => $id,
            'proc_id_label'             => sprintf('PM-%04d', $id),
            'name'                      => $this->name,
            'asset_id'                  => $this->assetId,
            'category'                  => $this->category,
            'periodicity'               => $this->periodicity,
            'last_completed'            => $this->lastCompleted,
            'next_due'                  => $this->nextDue,
            'assigned_to'               => $this->assignedTo,
            'document_ref'              => $this->documentRef,
            'description'               => $this->description,
            'est_hours'                 => $this->estHours,
            'create_deficiency_on_fail' => $this->createDeficiencyOnFail,
            'created_by'                => $this->createdBy,
            'created_at'                => $this->createdAt,
            'updated_at'                => $this->updatedAt,
            'computed_status'           => $status,
        ];
    }
}
