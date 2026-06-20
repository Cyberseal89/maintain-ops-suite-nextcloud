<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getChangeCode()           @method void setChangeCode(string $v)
 * @method ?int    getShopId()               @method void setShopId(?int $v)
 * @method ?int    getPlatformId()           @method void setPlatformId(?int $v)
 * @method string  getChangeType()           @method void setChangeType(string $v)
 * @method string  getTitle()                @method void setTitle(string $v)
 * @method string  getDescription()          @method void setDescription(string $v)
 * @method string  getInitiatorUid()         @method void setInitiatorUid(string $v)
 * @method string  getStage()                @method void setStage(string $v)
 * @method string  getPriority()             @method void setPriority(string $v)
 * @method ?float  getEstimatedCost()        @method void setEstimatedCost(?float $v)
 * @method ?float  getActualCost()           @method void setActualCost(?float $v)
 * @method ?int    getLinkedDefId()          @method void setLinkedDefId(?int $v)
 * @method ?int    getLinkedReqId()          @method void setLinkedReqId(?int $v)
 * @method ?string getImpactAnalysisJson()   @method void setImpactAnalysisJson(?string $v)
 * @method ?string getTrainingDelta()        @method void setTrainingDelta(?string $v)
 * @method ?string getApprovedBy()           @method void setApprovedBy(?string $v)
 * @method ?string getApprovedAt()           @method void setApprovedAt(?string $v)
 * @method ?string getCompletedAt()          @method void setCompletedAt(?string $v)
 * @method string  getCreatedBy()            @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()            @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()            @method void setUpdatedAt(string $v)
 */
class ConfigChange extends Entity implements \JsonSerializable {
    protected string  $changeCode          = '';
    protected ?int    $shopId              = null;
    protected ?int    $platformId          = null;
    protected string  $changeType          = 'modification';
    protected string  $title               = '';
    protected string  $description         = '';
    protected string  $initiatorUid        = '';
    protected string  $stage               = 'draft';
    protected string  $priority            = 'routine';
    protected ?float  $estimatedCost       = null;
    protected ?float  $actualCost          = null;
    protected ?int    $linkedDefId         = null;
    protected ?int    $linkedReqId         = null;
    protected ?string $impactAnalysisJson  = null;
    protected ?string $trainingDelta       = null;
    protected ?string $approvedBy          = null;
    protected ?string $approvedAt          = null;
    protected ?string $completedAt         = null;
    protected string  $createdBy           = '';
    protected string  $createdAt           = '';
    protected string  $updatedAt           = '';

    public function jsonSerialize(): array {
        return [
            'id'                   => $this->getId(),
            'change_code'          => $this->changeCode,
            'shop_id'              => $this->shopId,
            'platform_id'          => $this->platformId,
            'change_type'          => $this->changeType,
            'title'                => $this->title,
            'description'          => $this->description,
            'initiator_uid'        => $this->initiatorUid,
            'stage'                => $this->stage,
            'priority'             => $this->priority,
            'estimated_cost'       => $this->estimatedCost !== null ? (float)$this->estimatedCost : null,
            'actual_cost'          => $this->actualCost    !== null ? (float)$this->actualCost    : null,
            'linked_def_id'        => $this->linkedDefId,
            'linked_req_id'        => $this->linkedReqId,
            'impact_analysis_json' => $this->impactAnalysisJson,
            'training_delta'       => $this->trainingDelta,
            'approved_by'          => $this->approvedBy,
            'approved_at'          => $this->approvedAt,
            'completed_at'         => $this->completedAt,
            'created_by'           => $this->createdBy,
            'created_at'           => $this->createdAt,
            'updated_at'           => $this->updatedAt,
        ];
    }
}
