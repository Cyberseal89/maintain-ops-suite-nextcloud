<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

// Named SystemInterface to avoid collision with PHP's 'interface' keyword
class SystemInterface extends Entity implements \JsonSerializable {
    protected string  $interfaceCode   = '';
    protected int     $fromAssetId     = 0;
    protected ?int    $modernizationId = null;
    protected int     $toAssetId     = 0;
    protected string  $interfaceType = 'data';
    protected ?string $specification = null;
    protected ?string $standard      = null;
    protected string  $status        = 'active';
    protected ?int    $canvasId      = null;
    protected ?string $drawingRef    = null;
    protected string  $notes         = '';
    protected string  $createdBy     = '';
    protected string  $createdAt     = '';
    protected string  $updatedAt     = '';

    public function getInterfaceCode(): string          { return $this->interfaceCode; }
    public function setInterfaceCode(string $v): void   { $this->interfaceCode = $v; $this->markFieldUpdated('interfaceCode'); }
    public function getFromAssetId(): int               { return $this->fromAssetId; }
    public function setFromAssetId(int $v): void        { $this->fromAssetId = $v; $this->markFieldUpdated('fromAssetId'); }
    public function getModernizationId(): ?int          { return $this->modernizationId; }
    public function setModernizationId(?int $v): void   { $this->modernizationId = $v; $this->markFieldUpdated('modernizationId'); }
    public function getToAssetId(): int                 { return $this->toAssetId; }
    public function setToAssetId(int $v): void          { $this->toAssetId = $v; $this->markFieldUpdated('toAssetId'); }
    public function getInterfaceType(): string          { return $this->interfaceType; }
    public function setInterfaceType(string $v): void   { $this->interfaceType = $v; $this->markFieldUpdated('interfaceType'); }
    public function getSpecification(): ?string         { return $this->specification; }
    public function setSpecification(?string $v): void  { $this->specification = $v; $this->markFieldUpdated('specification'); }
    public function getStandard(): ?string              { return $this->standard; }
    public function setStandard(?string $v): void       { $this->standard = $v; $this->markFieldUpdated('standard'); }
    public function getStatus(): string                 { return $this->status; }
    public function setStatus(string $v): void          { $this->status = $v; $this->markFieldUpdated('status'); }
    public function getCanvasId(): ?int                 { return $this->canvasId; }
    public function setCanvasId(?int $v): void          { $this->canvasId = $v; $this->markFieldUpdated('canvasId'); }
    public function getDrawingRef(): ?string            { return $this->drawingRef; }
    public function setDrawingRef(?string $v): void     { $this->drawingRef = $v; $this->markFieldUpdated('drawingRef'); }
    public function getNotes(): string                  { return $this->notes; }
    public function setNotes(string $v): void           { $this->notes = $v; $this->markFieldUpdated('notes'); }
    public function getCreatedBy(): string              { return $this->createdBy; }
    public function setCreatedBy(string $v): void       { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string              { return $this->createdAt; }
    public function setCreatedAt(string $v): void       { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }
    public function getUpdatedAt(): string              { return $this->updatedAt; }
    public function setUpdatedAt(string $v): void       { $this->updatedAt = $v; $this->markFieldUpdated('updatedAt'); }

    public function jsonSerialize(): array {
        return [
            'id'              => $this->getId(),
            'interface_code'  => $this->interfaceCode,
            'from_asset_id'   => $this->fromAssetId,
            'modernization_id'=> $this->modernizationId,
            'to_asset_id'    => $this->toAssetId,
            'interface_type' => $this->interfaceType,
            'specification'  => $this->specification,
            'standard'       => $this->standard,
            'status'         => $this->status,
            'canvas_id'      => $this->canvasId,
            'drawing_ref'    => $this->drawingRef,
            'notes'          => $this->notes,
            'created_by'     => $this->createdBy,
            'created_at'     => $this->createdAt,
            'updated_at'     => $this->updatedAt,
        ];
    }
}
