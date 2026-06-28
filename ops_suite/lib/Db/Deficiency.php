<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class Deficiency extends Entity implements \JsonSerializable {
    protected string  $summary                = '';
    protected string  $description            = '';
    protected int     $assetId                = 0;
    protected string  $severity               = 'SEV-3';
    protected string  $status                 = 'open';
    protected string  $discoveryMethod        = 'walkdown';
    protected string  $assignedTo             = '';
    protected string  $reviewedBy             = '';
    protected string  $requirementsToResolve  = '';
    protected string  $outsideEntityRequired  = '';
    protected float   $estPartsCost           = 0;
    protected float   $estLaborCost           = 0;
    protected float   $manDaysInternal        = 0;
    protected float   $manDaysExternal        = 0;
    protected float   $scheduledOutageHours   = 0;
    protected ?string $targetCompletion       = null;
    protected int     $linkedProcedureId      = 0;
    protected float   $actualPartsCost    = 0;
    protected float   $actualLaborCost    = 0;
    protected float   $actualManDays      = 0;
    protected string  $rootCause          = '';
    protected string  $correctiveAction   = '';
    protected string  $closedBy           = '';
    protected ?string $closedAt           = null;
    protected ?int     $platformId         = null;
    protected ?int     $modernizationId             = null;
    protected int      $deferredFromModernization   = 0;
    protected ?int     $failureModeId               = null;
    protected ?string  $failureMode                 = null;
    protected string   $budgetStatus                = 'unbudgeted';
    protected ?int     $budgetFiscalYear             = null;
    protected ?int    $documentId              = null;  // 520 DM — fault isolation procedure
    protected ?string $localUuid              = null;
    protected string  $createdBy              = '';
    protected string  $createdAt              = '';
    protected string  $updatedAt              = '';

    public function getSummary(): string              { return $this->summary; }
    public function setSummary(string $v): void       { $this->summary = $v; $this->markFieldUpdated('summary'); }
    public function getDescription(): string          { return $this->description; }
    public function setDescription(string $v): void   { $this->description = $v; $this->markFieldUpdated('description'); }
    public function getAssetId(): int                 { return $this->assetId; }
    public function setAssetId(int $v): void          { $this->assetId = $v; $this->markFieldUpdated('assetId'); }
    public function getSeverity(): string             { return $this->severity; }
    public function setSeverity(string $v): void      { $this->severity = $v; $this->markFieldUpdated('severity'); }
    public function getStatus(): string               { return $this->status; }
    public function setStatus(string $v): void        { $this->status = $v; $this->markFieldUpdated('status'); }
    public function getDiscoveryMethod(): string      { return $this->discoveryMethod; }
    public function setDiscoveryMethod(string $v): void { $this->discoveryMethod = $v; $this->markFieldUpdated('discoveryMethod'); }
    public function getAssignedTo(): string           { return $this->assignedTo; }
    public function setAssignedTo(string $v): void    { $this->assignedTo = $v; $this->markFieldUpdated('assignedTo'); }
    public function getReviewedBy(): string           { return $this->reviewedBy; }
    public function setReviewedBy(string $v): void    { $this->reviewedBy = $v; $this->markFieldUpdated('reviewedBy'); }
    public function getRequirementsToResolve(): string        { return $this->requirementsToResolve; }
    public function setRequirementsToResolve(string $v): void { $this->requirementsToResolve = $v; $this->markFieldUpdated('requirementsToResolve'); }
    public function getOutsideEntityRequired(): string        { return $this->outsideEntityRequired; }
    public function setOutsideEntityRequired(string $v): void { $this->outsideEntityRequired = $v; $this->markFieldUpdated('outsideEntityRequired'); }
    public function getEstPartsCost(): float          { return $this->estPartsCost; }
    public function setEstPartsCost(float $v): void   { $this->estPartsCost = $v; $this->markFieldUpdated('estPartsCost'); }
    public function getEstLaborCost(): float          { return $this->estLaborCost; }
    public function setEstLaborCost(float $v): void   { $this->estLaborCost = $v; $this->markFieldUpdated('estLaborCost'); }
    public function getManDaysInternal(): float       { return $this->manDaysInternal; }
    public function setManDaysInternal(float $v): void{ $this->manDaysInternal = $v; $this->markFieldUpdated('manDaysInternal'); }
    public function getManDaysExternal(): float       { return $this->manDaysExternal; }
    public function setManDaysExternal(float $v): void{ $this->manDaysExternal = $v; $this->markFieldUpdated('manDaysExternal'); }
    public function getScheduledOutageHours(): float          { return $this->scheduledOutageHours; }
    public function setScheduledOutageHours(float $v): void   { $this->scheduledOutageHours = $v; $this->markFieldUpdated('scheduledOutageHours'); }
    public function getTargetCompletion(): ?string    { return $this->targetCompletion; }
    public function setTargetCompletion(?string $v): void { $this->targetCompletion = $v; $this->markFieldUpdated('targetCompletion'); }
    public function getLinkedProcedureId(): int       { return $this->linkedProcedureId; }
    public function setLinkedProcedureId(int $v): void{ $this->linkedProcedureId = $v; $this->markFieldUpdated('linkedProcedureId'); }
    public function getFailureMode(): ?string           { return $this->failureMode; }
    public function setFailureMode(?string $v): void    { $this->failureMode = $v; $this->markFieldUpdated('failureMode'); }
    public function getBudgetStatus(): string           { return $this->budgetStatus; }
    public function setBudgetStatus(string $v): void    { $this->budgetStatus = $v; $this->markFieldUpdated('budgetStatus'); }
    public function getBudgetFiscalYear(): ?int         { return $this->budgetFiscalYear; }
    public function setBudgetFiscalYear(?int $v): void  { $this->budgetFiscalYear = $v; $this->markFieldUpdated('budgetFiscalYear'); }
    public function getDocumentId(): ?int               { return $this->documentId; }
    public function setDocumentId(?int $v): void        { $this->documentId = $v; $this->markFieldUpdated('documentId'); }
    public function getLocalUuid(): ?string             { return $this->localUuid; }
    public function setLocalUuid(?string $v): void    { $this->localUuid = $v; $this->markFieldUpdated('localUuid'); }
    public function getCreatedBy(): string            { return $this->createdBy; }
    public function setCreatedBy(string $v): void     { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string            { return $this->createdAt; }
    public function setCreatedAt(string $v): void     { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }
    public function getUpdatedAt(): string            { return $this->updatedAt; }
    public function setUpdatedAt(string $v): void     { $this->updatedAt = $v; $this->markFieldUpdated('updatedAt'); }

    public function jsonSerialize(): array {
        $id = $this->getId();
        return [
            'id'                      => $id,
            'def_id_label'            => sprintf('DEF-%04d', $id),
            'summary'                 => $this->summary,
            'description'             => $this->description,
            'asset_id'                => $this->assetId,
            'severity'                => $this->severity,
            'status'                  => $this->status,
            'discovery_method'        => $this->discoveryMethod,
            'assigned_to'             => $this->assignedTo,
            'reviewed_by'             => $this->reviewedBy,
            'requirements_to_resolve' => $this->requirementsToResolve,
            'outside_entity_required' => $this->outsideEntityRequired,
            'est_parts_cost'          => $this->estPartsCost,
            'est_labor_cost'          => $this->estLaborCost,
            'est_total_cost'          => round($this->estPartsCost + $this->estLaborCost, 2),
            'man_days_internal'       => $this->manDaysInternal,
            'man_days_external'       => $this->manDaysExternal,
            'total_man_days'          => round($this->manDaysInternal + $this->manDaysExternal, 1),
            'scheduled_outage_hours'  => $this->scheduledOutageHours,
            'target_completion'       => $this->targetCompletion,
            'linked_procedure_id'     => $this->linkedProcedureId,
            'actual_parts_cost'   => $this->actualPartsCost,
            'actual_labor_cost'   => $this->actualLaborCost,
            'actual_man_days'     => $this->actualManDays,
            'root_cause'          => $this->rootCause,
            'corrective_action'   => $this->correctiveAction,
            'closed_by'           => $this->closedBy,
            'closed_at'           => $this->closedAt,
            'platform_id'         => $this->platformId,
            'modernization_id'           => $this->modernizationId,
            'failure_mode_id'            => $this->failureModeId,
            'failure_mode'               => $this->failureMode,
            'budget_status'              => $this->budgetStatus,
            'budget_fiscal_year'         => $this->budgetFiscalYear,
            'deferred_from_modernization' => $this->deferredFromModernization,
            'document_id'             => $this->documentId,
            'local_uuid'              => $this->localUuid,
            'created_by'              => $this->createdBy,
            'created_at'              => $this->createdAt,
            'updated_at'              => $this->updatedAt,
        ];
    }
}
