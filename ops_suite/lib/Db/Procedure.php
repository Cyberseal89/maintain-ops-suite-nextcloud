<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string   getName()                     @method void setName(string $v)
 * @method int      getAssetId()                  @method void setAssetId(int $v)
 * @method string   getCategory()                 @method void setCategory(string $v)
 * @method string   getPeriodicity()              @method void setPeriodicity(string $v)
 * @method ?string  getLastCompleted()            @method void setLastCompleted(?string $v)
 * @method ?string  getNextDue()                  @method void setNextDue(?string $v)
 * @method string   getAssignedTo()               @method void setAssignedTo(string $v)
 * @method string   getDocumentRef()              @method void setDocumentRef(string $v)
 * @method string   getDescription()              @method void setDescription(string $v)
 * @method float    getEstHours()                 @method void setEstHours(float $v)
 * @method int      getCreateDeficiencyOnFail()   @method void setCreateDeficiencyOnFail(int $v)
 * @method float    getActualHours()              @method void setActualHours(float $v)
 * @method float    getActualPartsCost()          @method void setActualPartsCost(float $v)
 * @method float    getActualLaborCost()          @method void setActualLaborCost(float $v)
 * @method string   getCompletionNotes()          @method void setCompletionNotes(string $v)
 * @method string   getCreatedBy()                @method void setCreatedBy(string $v)
 * @method string   getCreatedAt()                @method void setCreatedAt(string $v)
 * @method string   getUpdatedAt()                @method void setUpdatedAt(string $v)
 * @method ?string  getLocalUuid()                @method void setLocalUuid(?string $v)
 * @method ?int     getDocumentId()               @method void setDocumentId(?int $v)
 * @method bool     getDmcReviewFlag()            @method void setDmcReviewFlag(bool $v)
 * @method string   getTriggerType()              @method void setTriggerType(string $v)
 * @method ?string  getMeterType()                @method void setMeterType(?string $v)
 * @method ?string  getMeterUnit()                @method void setMeterUnit(?string $v)
 * @method ?float   getMeterInterval()            @method void setMeterInterval(?float $v)
 * @method ?float   getMeterLastValue()           @method void setMeterLastValue(?float $v)
 * @method ?float   getMeterNextDueValue()        @method void setMeterNextDueValue(?float $v)
 * @method ?string  getTriggerCondition()         @method void setTriggerCondition(?string $v)
 * @method ?int     getTriggerSourceId()          @method void setTriggerSourceId(?int $v)
 * @method ?float   getTriggerThreshold()         @method void setTriggerThreshold(?float $v)
 * @method int      getPendingTrigger()           @method void setPendingTrigger(int $v)
 * @method ?int     getTsDocumentId()             @method void setTsDocumentId(?int $v)
 */
class Procedure extends Entity implements \JsonSerializable {
    protected string  $name                   = '';
    protected int     $assetId                = 0;
    protected string  $category               = '';
    protected string  $periodicity            = 'monthly';
    protected ?string $lastCompleted          = null;
    protected ?string $nextDue                = null;
    protected string  $assignedTo             = '';
    protected string  $documentRef            = '';  // Legacy: raw file path — kept for existing PMs
    protected string  $description            = '';
    protected float   $estHours               = 0;
    protected int     $createDeficiencyOnFail = 0;
    protected float   $actualHours            = 0;
    protected float   $actualPartsCost        = 0;
    protected float   $actualLaborCost        = 0;
    protected string  $completionNotes        = '';
    protected string  $createdBy              = '';
    protected string  $createdAt              = '';
    protected string  $updatedAt              = '';
    protected ?int    $platformId             = null;
    protected ?string $localUuid              = null;
    // S1000D DM link
    protected ?int    $documentId             = null;
    protected bool    $dmcReviewFlag          = false;

    // Trigger / scheduling type: calendar | meter | as_required
    protected string  $triggerType            = 'calendar';

    // Meter-based fields (triggerType = 'meter')
    protected ?string $meterType              = null;  // odometer|flight_hours|engine_hours|operating_hours|cycles|custom
    protected ?string $meterUnit              = null;  // miles, km, hours, FH, cycles, …
    protected ?float  $meterInterval          = null;  // trigger every N units
    protected ?float  $meterLastValue         = null;  // reading at last completion
    protected ?float  $meterNextDueValue      = null;  // last + interval; overdue when current >= this

    // As-required / condition-based fields (triggerType = 'as_required')
    protected ?string $triggerCondition       = null;  // human-readable condition description
    protected ?int    $triggerSourceId        = null;  // FK to meter PM that can trigger this
    protected ?float  $triggerThreshold       = null;  // fire when source meter_last_value >= this
    protected int     $pendingTrigger         = 0;     // 1 = flagged due by meter reading
    // FK to 520 Troubleshooting DM — pre-fills deficiency when PM logs an issue
    protected ?int    $tsDocumentId           = null;

    public function __construct() {
        $this->addType('dmcReviewFlag', 'boolean');
    }

    public function jsonSerialize(): array {
        $id     = $this->getId();
        $today  = new \DateTime();
        $ttype  = $this->triggerType ?: 'calendar';

        // Status computation differs by trigger type
        $status = 'current';
        if ($ttype === 'meter') {
            // Meter PMs: overdue when next_due_value is set and current value is known to exceed it.
            // next_due_value being set means the meter is actively tracked.
            // We flag 'pending' if the due-value is reached (evaluated on completion).
            if ($this->meterNextDueValue !== null && $this->meterLastValue !== null
                    && $this->meterLastValue >= $this->meterNextDueValue) {
                $status = 'overdue';
            }
            // Also respect calendar next_due as a secondary check-in reminder
            if ($status === 'current' && $this->nextDue) {
                $due  = new \DateTime($this->nextDue);
                $diff = (int)$today->diff($due)->days;
                if ($due < $today)  { $status = 'overdue'; }
                elseif ($diff <= 7) { $status = 'due_soon'; }
            }
        } elseif ($ttype === 'as_required') {
            $status = $this->pendingTrigger ? 'due_soon' : 'current';
        } else {
            if ($this->nextDue) {
                $due  = new \DateTime($this->nextDue);
                $diff = (int)$today->diff($due)->days;
                if ($due < $today)  { $status = 'overdue'; }
                elseif ($diff <= 7) { $status = 'due_soon'; }
            }
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
            'actual_hours'              => $this->actualHours,
            'actual_parts_cost'         => $this->actualPartsCost,
            'actual_labor_cost'         => $this->actualLaborCost,
            'completion_notes'          => $this->completionNotes,
            'created_by'                => $this->createdBy,
            'created_at'                => $this->createdAt,
            'updated_at'                => $this->updatedAt,
            'platform_id'               => $this->platformId,
            'local_uuid'                => $this->localUuid,
            'computed_status'           => $status,
            'document_id'               => $this->documentId,
            'dmc_review_flag'           => (bool)$this->dmcReviewFlag,
            // Trigger / CBM fields
            'trigger_type'              => $ttype,
            'meter_type'                => $this->meterType,
            'meter_unit'                => $this->meterUnit,
            'meter_interval'            => $this->meterInterval !== null ? (float)$this->meterInterval : null,
            'meter_last_value'          => $this->meterLastValue !== null ? (float)$this->meterLastValue : null,
            'meter_next_due_value'      => $this->meterNextDueValue !== null ? (float)$this->meterNextDueValue : null,
            'trigger_condition'         => $this->triggerCondition,
            'trigger_source_id'         => $this->triggerSourceId,
            'trigger_threshold'         => $this->triggerThreshold !== null ? (float)$this->triggerThreshold : null,
            'pending_trigger'           => (bool)$this->pendingTrigger,
            'ts_document_id'            => $this->tsDocumentId,
        ];
    }
}
