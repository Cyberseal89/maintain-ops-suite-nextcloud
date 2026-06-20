<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getId()
 * @method int     getFmeaEntryId()         @method void setFmeaEntryId(int $v)
 * @method int     getWorksheetId()         @method void setWorksheetId(int $v)
 * @method string  getFailureVisibility()   @method void setFailureVisibility(string $v)
 * @method string  getFailureConsequence()  @method void setFailureConsequence(string $v)
 * @method string  getTaskType()            @method void setTaskType(string $v)
 * @method string  getTaskInterval()        @method void setTaskInterval(string $v)
 * @method string  getIntervalBasis()       @method void setIntervalBasis(string $v)
 * @method ?int    getLinkedProcedureId()   @method void setLinkedProcedureId(?int $v)
 * @method string  getRationale()           @method void setRationale(string $v)
 * @method string  getApprovedBy()          @method void setApprovedBy(string $v)
 * @method ?string getApprovedAt()          @method void setApprovedAt(?string $v)
 * @method string  getCreatedBy()           @method void setCreatedBy(string $v)
 * @method ?string getCreatedAt()           @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()           @method void setUpdatedAt(?string $v)
 */
class RcmDecision extends Entity implements \JsonSerializable {

    protected int     $fmeaEntryId        = 0;
    protected int     $worksheetId        = 0;
    protected string  $failureVisibility  = 'evident';
    protected string  $failureConsequence = 'operational';
    protected string  $taskType           = 'on_condition';
    protected string  $taskInterval       = '';
    protected string  $intervalBasis      = '';
    protected ?int    $linkedProcedureId  = null;
    protected string  $rationale          = '';
    protected string  $approvedBy         = '';
    protected ?string $approvedAt         = null;
    protected string  $createdBy          = '';
    protected ?string $createdAt          = null;
    protected ?string $updatedAt          = null;

    public function jsonSerialize(): array {
        return [
            'id'                  => $this->id,
            'fmea_entry_id'       => $this->fmeaEntryId,
            'worksheet_id'        => $this->worksheetId,
            'failure_visibility'  => $this->failureVisibility,
            'failure_consequence' => $this->failureConsequence,
            'task_type'           => $this->taskType,
            'task_interval'       => $this->taskInterval,
            'interval_basis'      => $this->intervalBasis,
            'linked_procedure_id' => $this->linkedProcedureId,
            'rationale'           => $this->rationale,
            'approved_by'         => $this->approvedBy,
            'approved_at'         => $this->approvedAt,
            'created_by'          => $this->createdBy,
            'created_at'          => $this->createdAt,
            'updated_at'          => $this->updatedAt,
        ];
    }
}
