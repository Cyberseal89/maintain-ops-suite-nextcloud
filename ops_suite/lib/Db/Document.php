<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class Document extends Entity implements \JsonSerializable {
    protected string  $docNumber       = '';
    protected string  $title           = '';
    protected string  $category        = 'other';
    protected string  $status          = 'draft';
    protected ?string $currentRev      = null;
    protected ?int    $assetId         = null;
    protected ?int    $platformId      = null;
    protected string  $applicability   = '';
    protected string  $notes           = '';
    protected ?string $localUuid       = null;
    protected ?int    $modernizationId = null;
    protected ?int    $canvasId        = null;
    protected string  $createdBy       = '';
    protected string  $createdAt       = '';
    protected string  $updatedAt       = '';

    // S1000D fields — only populated when doc_type = 'data_module' or 'publication'
    protected string  $docType         = 'external';   // 'external' | 'data_module' | 'publication'
    protected ?string $dmc             = null;          // Auto-generated DMC string
    protected ?string $infoCode        = null;          // 040 | 200 | 300 | 520 | 900 ...
    protected ?string $infoCodeVariant = 'A';           // A, B, C — differentiates same type/asset
    protected int     $issueNumber     = 1;             // S1000D issue (replaces letter rev for DMs)
    protected int     $inWorkNumber    = 0;             // 0 = released; >0 = in-work draft
    protected bool    $dmcReviewFlag   = false;         // True when issue advanced, clears on review
    // Publication fields — only populated when doc_type = 'publication'
    protected ?string $pubCode         = null;
    protected ?string $pubType         = null;          // MM | FM | IPD | OM | SM
    protected bool    $reIssueRequired = false;         // True when a constituent DM advanced an issue

    public function __construct() {
        $this->addType('dmcReviewFlag', 'boolean');
        $this->addType('reIssueRequired', 'boolean');
    }

    public function getDocNumber(): string            { return $this->docNumber; }
    public function setDocNumber(string $v): void     { $this->docNumber = $v; $this->markFieldUpdated('docNumber'); }
    public function getTitle(): string                { return $this->title; }
    public function setTitle(string $v): void         { $this->title = $v; $this->markFieldUpdated('title'); }
    public function getCategory(): string             { return $this->category; }
    public function setCategory(string $v): void      { $this->category = $v; $this->markFieldUpdated('category'); }
    public function getStatus(): string               { return $this->status; }
    public function setStatus(string $v): void        { $this->status = $v; $this->markFieldUpdated('status'); }
    public function getCurrentRev(): ?string          { return $this->currentRev; }
    public function setCurrentRev(?string $v): void   { $this->currentRev = $v; $this->markFieldUpdated('currentRev'); }
    public function getAssetId(): ?int                { return $this->assetId; }
    public function setAssetId(?int $v): void         { $this->assetId = $v; $this->markFieldUpdated('assetId'); }
    public function getPlatformId(): ?int             { return $this->platformId; }
    public function setPlatformId(?int $v): void      { $this->platformId = $v; $this->markFieldUpdated('platformId'); }
    public function getApplicability(): string        { return $this->applicability; }
    public function setApplicability(string $v): void { $this->applicability = $v; $this->markFieldUpdated('applicability'); }
    public function getNotes(): string                { return $this->notes; }
    public function setNotes(string $v): void         { $this->notes = $v; $this->markFieldUpdated('notes'); }
    public function getLocalUuid(): ?string           { return $this->localUuid; }
    public function setLocalUuid(?string $v): void    { $this->localUuid = $v; $this->markFieldUpdated('localUuid'); }
    public function getModernizationId(): ?int        { return $this->modernizationId; }
    public function setModernizationId(?int $v): void { $this->modernizationId = $v; $this->markFieldUpdated('modernizationId'); }
    public function getCanvasId(): ?int               { return $this->canvasId; }
    public function setCanvasId(?int $v): void        { $this->canvasId = $v; $this->markFieldUpdated('canvasId'); }
    public function getCreatedBy(): string            { return $this->createdBy; }
    public function setCreatedBy(string $v): void     { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string            { return $this->createdAt; }
    public function setCreatedAt(string $v): void     { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }
    public function getUpdatedAt(): string            { return $this->updatedAt; }
    public function setUpdatedAt(string $v): void     { $this->updatedAt = $v; $this->markFieldUpdated('updatedAt'); }

    public function getDocType(): string              { return $this->docType; }
    public function setDocType(string $v): void       { $this->docType = $v; $this->markFieldUpdated('docType'); }
    public function getDmc(): ?string                 { return $this->dmc; }
    public function setDmc(?string $v): void          { $this->dmc = $v; $this->markFieldUpdated('dmc'); }
    public function getInfoCode(): ?string            { return $this->infoCode; }
    public function setInfoCode(?string $v): void     { $this->infoCode = $v; $this->markFieldUpdated('infoCode'); }
    public function getInfoCodeVariant(): ?string     { return $this->infoCodeVariant; }
    public function setInfoCodeVariant(?string $v): void { $this->infoCodeVariant = $v; $this->markFieldUpdated('infoCodeVariant'); }
    public function getIssueNumber(): int             { return $this->issueNumber; }
    public function setIssueNumber(int $v): void      { $this->issueNumber = $v; $this->markFieldUpdated('issueNumber'); }
    public function getInWorkNumber(): int            { return $this->inWorkNumber; }
    public function setInWorkNumber(int $v): void     { $this->inWorkNumber = $v; $this->markFieldUpdated('inWorkNumber'); }
    public function getDmcReviewFlag(): bool          { return $this->dmcReviewFlag; }
    public function setDmcReviewFlag(bool $v): void   { $this->dmcReviewFlag = $v; $this->markFieldUpdated('dmcReviewFlag'); }
    public function getPubCode(): ?string             { return $this->pubCode; }
    public function setPubCode(?string $v): void      { $this->pubCode = $v; $this->markFieldUpdated('pubCode'); }
    public function getPubType(): ?string             { return $this->pubType; }
    public function setPubType(?string $v): void      { $this->pubType = $v; $this->markFieldUpdated('pubType'); }
    public function getReIssueRequired(): bool        { return $this->reIssueRequired; }
    public function setReIssueRequired(bool $v): void { $this->reIssueRequired = $v; $this->markFieldUpdated('reIssueRequired'); }

    public function jsonSerialize(): array {
        return [
            'id'               => $this->getId(),
            'doc_number'       => $this->docNumber,
            'title'            => $this->title,
            'category'         => $this->category,
            'status'           => $this->status,
            'current_rev'      => $this->currentRev,
            'asset_id'         => $this->assetId,
            'platform_id'      => $this->platformId,
            'applicability'    => $this->applicability,
            'notes'            => $this->notes,
            'local_uuid'       => $this->localUuid,
            'modernization_id' => $this->modernizationId,
            'canvas_id'        => $this->canvasId,
            'created_by'       => $this->createdBy,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
            // S1000D fields
            'doc_type'         => $this->docType,
            'dmc'              => $this->dmc,
            'info_code'        => $this->infoCode,
            'info_code_variant'=> $this->infoCodeVariant,
            'issue_number'     => $this->issueNumber,
            'in_work_number'   => $this->inWorkNumber,
            'dmc_review_flag'  => (bool)$this->dmcReviewFlag,
            // Publication fields
            'pub_code'          => $this->pubCode,
            'pub_type'          => $this->pubType,
            're_issue_required' => (bool)$this->reIssueRequired,
        ];
    }
}
