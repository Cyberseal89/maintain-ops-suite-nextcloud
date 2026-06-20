<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class Document extends Entity implements \JsonSerializable {
    protected string  $docNumber     = '';
    protected string  $title         = '';
    protected string  $category      = 'other';
    protected string  $status        = 'draft';
    protected ?string $currentRev    = null;
    protected ?int    $assetId       = null;
    protected ?int    $platformId    = null;
    protected string  $applicability = '';
    protected string  $notes         = '';
    protected ?string $localUuid       = null;
    protected ?int    $modernizationId = null;
    protected ?int    $canvasId        = null;
    protected string  $createdBy       = '';
    protected string  $createdAt     = '';
    protected string  $updatedAt     = '';

    public function getDocNumber(): string          { return $this->docNumber; }
    public function setDocNumber(string $v): void   { $this->docNumber = $v; $this->markFieldUpdated('docNumber'); }
    public function getTitle(): string              { return $this->title; }
    public function setTitle(string $v): void       { $this->title = $v; $this->markFieldUpdated('title'); }
    public function getCategory(): string           { return $this->category; }
    public function setCategory(string $v): void    { $this->category = $v; $this->markFieldUpdated('category'); }
    public function getStatus(): string             { return $this->status; }
    public function setStatus(string $v): void      { $this->status = $v; $this->markFieldUpdated('status'); }
    public function getCurrentRev(): ?string        { return $this->currentRev; }
    public function setCurrentRev(?string $v): void { $this->currentRev = $v; $this->markFieldUpdated('currentRev'); }
    public function getAssetId(): ?int              { return $this->assetId; }
    public function setAssetId(?int $v): void       { $this->assetId = $v; $this->markFieldUpdated('assetId'); }
    public function getPlatformId(): ?int           { return $this->platformId; }
    public function setPlatformId(?int $v): void    { $this->platformId = $v; $this->markFieldUpdated('platformId'); }
    public function getApplicability(): string      { return $this->applicability; }
    public function setApplicability(string $v): void { $this->applicability = $v; $this->markFieldUpdated('applicability'); }
    public function getNotes(): string              { return $this->notes; }
    public function setNotes(string $v): void       { $this->notes = $v; $this->markFieldUpdated('notes'); }
    public function getLocalUuid(): ?string           { return $this->localUuid; }
    public function setLocalUuid(?string $v): void    { $this->localUuid = $v; $this->markFieldUpdated('localUuid'); }
    public function getModernizationId(): ?int        { return $this->modernizationId; }
    public function setModernizationId(?int $v): void { $this->modernizationId = $v; $this->markFieldUpdated('modernizationId'); }
    public function getCanvasId(): ?int               { return $this->canvasId; }
    public function setCanvasId(?int $v): void        { $this->canvasId = $v; $this->markFieldUpdated('canvasId'); }
    public function getCreatedBy(): string            { return $this->createdBy; }
    public function setCreatedBy(string $v): void   { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string          { return $this->createdAt; }
    public function setCreatedAt(string $v): void   { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }
    public function getUpdatedAt(): string          { return $this->updatedAt; }
    public function setUpdatedAt(string $v): void   { $this->updatedAt = $v; $this->markFieldUpdated('updatedAt'); }

    public function jsonSerialize(): array {
        return [
            'id'            => $this->getId(),
            'doc_number'    => $this->docNumber,
            'title'         => $this->title,
            'category'      => $this->category,
            'status'        => $this->status,
            'current_rev'   => $this->currentRev,
            'asset_id'      => $this->assetId,
            'platform_id'   => $this->platformId,
            'applicability' => $this->applicability,
            'notes'         => $this->notes,
            'local_uuid'       => $this->localUuid,
            'modernization_id' => $this->modernizationId,
            'canvas_id'        => $this->canvasId,
            'created_by'       => $this->createdBy,
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];
    }
}
