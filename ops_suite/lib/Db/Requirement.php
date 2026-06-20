<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class Requirement extends Entity implements \JsonSerializable {
    protected string  $reqCode           = '';
    protected int     $assetId           = 0;
    protected ?int    $modernizationId   = null;
    protected string  $title             = '';
    protected string  $description       = '';
    protected string  $reqType           = 'functional';
    protected ?string $threshold         = null;
    protected ?string $objective         = null;
    protected ?string $unit              = null;
    protected ?int    $verifiedByPmId    = null;
    protected ?string $lastVerifiedAt    = null;
    protected ?string $lastVerifiedValue = null;
    protected string  $status            = 'untested';
    protected string  $priority          = 'P1';
    protected string  $notes             = '';
    protected string  $createdBy         = '';
    protected string  $createdAt         = '';
    protected string  $updatedAt         = '';

    public function getReqCode(): string            { return $this->reqCode; }
    public function setReqCode(string $v): void     { $this->reqCode = $v; $this->markFieldUpdated('reqCode'); }
    public function getAssetId(): int               { return $this->assetId; }
    public function setAssetId(int $v): void        { $this->assetId = $v; $this->markFieldUpdated('assetId'); }
    public function getModernizationId(): ?int      { return $this->modernizationId; }
    public function setModernizationId(?int $v): void { $this->modernizationId = $v; $this->markFieldUpdated('modernizationId'); }
    public function getTitle(): string              { return $this->title; }
    public function setTitle(string $v): void       { $this->title = $v; $this->markFieldUpdated('title'); }
    public function getDescription(): string        { return $this->description; }
    public function setDescription(string $v): void { $this->description = $v; $this->markFieldUpdated('description'); }
    public function getReqType(): string            { return $this->reqType; }
    public function setReqType(string $v): void     { $this->reqType = $v; $this->markFieldUpdated('reqType'); }
    public function getThreshold(): ?string         { return $this->threshold; }
    public function setThreshold(?string $v): void  { $this->threshold = $v; $this->markFieldUpdated('threshold'); }
    public function getObjective(): ?string         { return $this->objective; }
    public function setObjective(?string $v): void  { $this->objective = $v; $this->markFieldUpdated('objective'); }
    public function getUnit(): ?string              { return $this->unit; }
    public function setUnit(?string $v): void       { $this->unit = $v; $this->markFieldUpdated('unit'); }
    public function getVerifiedByPmId(): ?int       { return $this->verifiedByPmId; }
    public function setVerifiedByPmId(?int $v): void{ $this->verifiedByPmId = $v; $this->markFieldUpdated('verifiedByPmId'); }
    public function getLastVerifiedAt(): ?string    { return $this->lastVerifiedAt; }
    public function setLastVerifiedAt(?string $v): void { $this->lastVerifiedAt = $v; $this->markFieldUpdated('lastVerifiedAt'); }
    public function getLastVerifiedValue(): ?string { return $this->lastVerifiedValue; }
    public function setLastVerifiedValue(?string $v): void { $this->lastVerifiedValue = $v; $this->markFieldUpdated('lastVerifiedValue'); }
    public function getStatus(): string             { return $this->status; }
    public function setStatus(string $v): void      { $this->status = $v; $this->markFieldUpdated('status'); }
    public function getPriority(): string           { return $this->priority; }
    public function setPriority(string $v): void    { $this->priority = $v; $this->markFieldUpdated('priority'); }
    public function getNotes(): string              { return $this->notes; }
    public function setNotes(string $v): void       { $this->notes = $v; $this->markFieldUpdated('notes'); }
    public function getCreatedBy(): string          { return $this->createdBy; }
    public function setCreatedBy(string $v): void   { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string          { return $this->createdAt; }
    public function setCreatedAt(string $v): void   { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }
    public function getUpdatedAt(): string          { return $this->updatedAt; }
    public function setUpdatedAt(string $v): void   { $this->updatedAt = $v; $this->markFieldUpdated('updatedAt'); }

    public function jsonSerialize(): array {
        return [
            'id'                  => $this->getId(),
            'req_code'            => $this->reqCode,
            'asset_id'            => $this->assetId,
            'modernization_id'    => $this->modernizationId,
            'title'               => $this->title,
            'description'         => $this->description,
            'req_type'            => $this->reqType,
            'threshold'           => $this->threshold,
            'objective'           => $this->objective,
            'unit'                => $this->unit,
            'verified_by_pm_id'   => $this->verifiedByPmId,
            'last_verified_at'    => $this->lastVerifiedAt,
            'last_verified_value' => $this->lastVerifiedValue,
            'status'              => $this->status,
            'priority'            => $this->priority,
            'notes'               => $this->notes,
            'created_by'          => $this->createdBy,
            'created_at'          => $this->createdAt,
            'updated_at'          => $this->updatedAt,
        ];
    }
}
