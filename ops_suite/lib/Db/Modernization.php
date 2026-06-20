<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getTitle()               @method void setTitle(string $v)
 * @method string  getDescription()         @method void setDescription(string $v)
 * @method ?int    getPlatformId()          @method void setPlatformId(?int $v)
 * @method string  getStatus()              @method void setStatus(string $v)
 * @method ?string getModCode()             @method void setModCode(?string $v)
 * @method ?int    getShopId()              @method void setShopId(?int $v)
 * @method string  getModType()             @method void setModType(string $v)
 * @method string  getPriority()            @method void setPriority(string $v)
 * @method ?string getInitiatorUid()        @method void setInitiatorUid(?string $v)
 * @method ?int    getLinkedDefId()         @method void setLinkedDefId(?int $v)
 * @method ?int    getLinkedReqId()         @method void setLinkedReqId(?int $v)
 * @method ?string getImpactAnalysisJson()  @method void setImpactAnalysisJson(?string $v)
 * @method ?string getTrainingDelta()       @method void setTrainingDelta(?string $v)
 * @method ?string getStartDate()           @method void setStartDate(?string $v)
 * @method ?string getTargetCompletion()    @method void setTargetCompletion(?string $v)
 * @method string  getAssignedTo()          @method void setAssignedTo(string $v)
 * @method string  getApprover()            @method void setApprover(string $v)
 * @method string  getApprovedBy()          @method void setApprovedBy(string $v)
 * @method ?string getApprovedAt()          @method void setApprovedAt(?string $v)
 * @method ?string getCompletedAt()         @method void setCompletedAt(?string $v)
 * @method float   getEstPartsCost()        @method void setEstPartsCost(float $v)
 * @method float   getEstLaborCost()        @method void setEstLaborCost(float $v)
 * @method float   getEstContractorCost()   @method void setEstContractorCost(float $v)
 * @method float   getActualPartsCost()     @method void setActualPartsCost(float $v)
 * @method float   getActualLaborCost()     @method void setActualLaborCost(float $v)
 * @method float   getActualContractorCost()@method void setActualContractorCost(float $v)
 * @method string  getCompletionNotes()     @method void setCompletionNotes(string $v)
 * @method string  getBudgetStatus()        @method void setBudgetStatus(string $v)
 * @method ?int    getBudgetFiscalYear()    @method void setBudgetFiscalYear(?int $v)
 * @method string  getCreatedBy()           @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()           @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()           @method void setUpdatedAt(string $v)
 */
class Modernization extends Entity implements \JsonSerializable {
    protected ?string $assetIds             = null; // legacy column — keep for hydration compat
    protected string  $title                = '';
    protected string  $description          = '';
    protected ?int    $platformId           = null;
    protected string  $status               = 'drafting';
    protected ?string $modCode              = null;
    protected ?int    $shopId               = null;
    protected string  $modType              = 'modification';
    protected string  $priority             = 'routine';
    protected ?string $initiatorUid         = null;
    protected ?int    $linkedDefId          = null;
    protected ?int    $linkedReqId          = null;
    protected ?string $impactAnalysisJson   = null;
    protected ?string $trainingDelta        = null;
    protected ?string $startDate            = null;
    protected ?string $targetCompletion     = null;
    protected string  $assignedTo           = '';
    protected string  $approver             = '';
    protected string  $approvedBy           = '';
    protected ?string $approvedAt           = null;
    protected ?string $completedAt          = null;
    protected float   $estPartsCost         = 0;
    protected float   $estLaborCost         = 0;
    protected float   $estContractorCost    = 0;
    protected float   $actualPartsCost      = 0;
    protected float   $actualLaborCost      = 0;
    protected float   $actualContractorCost = 0;
    protected string  $completionNotes      = '';
    protected string  $budgetStatus        = 'unbudgeted';
    protected ?int    $budgetFiscalYear     = null;
    protected string  $createdBy            = '';
    protected string  $createdAt            = '';
    protected string  $updatedAt            = '';

    public function jsonSerialize(): array {
        $estTotal    = $this->estPartsCost + $this->estLaborCost + $this->estContractorCost;
        $actualTotal = $this->actualPartsCost + $this->actualLaborCost + $this->actualContractorCost;
        return [
            'id'                     => $this->getId(),
            'title'                  => $this->title,
            'description'            => $this->description,
            'platform_id'            => $this->platformId,
            'status'                 => $this->status,
            'mod_code'               => $this->modCode,
            'shop_id'                => $this->shopId,
            'mod_type'               => $this->modType,
            'priority'               => $this->priority,
            'initiator_uid'          => $this->initiatorUid,
            'linked_def_id'          => $this->linkedDefId,
            'linked_req_id'          => $this->linkedReqId,
            'impact_analysis_json'   => $this->impactAnalysisJson,
            'training_delta'         => $this->trainingDelta,
            'start_date'             => $this->startDate,
            'target_completion'      => $this->targetCompletion,
            'assigned_to'            => $this->assignedTo,
            'approver'               => $this->approver,
            'approved_by'            => $this->approvedBy,
            'approved_at'            => $this->approvedAt,
            'completed_at'           => $this->completedAt,
            'est_parts_cost'         => $this->estPartsCost,
            'est_labor_cost'         => $this->estLaborCost,
            'est_contractor_cost'    => $this->estContractorCost,
            'actual_parts_cost'      => $this->actualPartsCost,
            'actual_labor_cost'      => $this->actualLaborCost,
            'actual_contractor_cost' => $this->actualContractorCost,
            'est_total'              => $estTotal,
            'actual_total'           => $actualTotal,
            'completion_notes'       => $this->completionNotes,
            'budget_status'          => $this->budgetStatus,
            'budget_fiscal_year'     => $this->budgetFiscalYear,
            'created_by'             => $this->createdBy,
            'created_at'             => $this->createdAt,
            'updated_at'             => $this->updatedAt,
        ];
    }
}
