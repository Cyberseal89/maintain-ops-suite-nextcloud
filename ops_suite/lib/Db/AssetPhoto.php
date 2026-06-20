<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class AssetPhoto extends Entity implements \JsonSerializable {
    protected int     $assetId      = 0;
    protected string  $photoType    = 'condition';
    protected ?int    $linkedDefId  = null;
    protected ?int    $linkedPmId   = null;
    protected ?int    $linkedChgId  = null;
    protected string  $filePath     = '';
    protected ?string $thumbnailPath= null;
    protected ?string $caption      = null;
    protected int     $isPrimary    = 0;
    protected int     $sortOrder    = 0;
    protected ?string $takenAt      = null;
    protected string  $takenBy      = '';
    protected ?string $locationLat  = null;
    protected ?string $locationLng  = null;
    protected string  $createdAt    = '';

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'asset_id'       => $this->assetId,
            'photo_type'     => $this->photoType,
            'linked_def_id'  => $this->linkedDefId,
            'linked_pm_id'   => $this->linkedPmId,
            'linked_chg_id'  => $this->linkedChgId,
            'file_path'      => $this->filePath,
            'thumbnail_path' => $this->thumbnailPath,
            'caption'        => $this->caption,
            'is_primary'     => (bool)$this->isPrimary,
            'sort_order'     => $this->sortOrder,
            'taken_at'       => $this->takenAt,
            'taken_by'       => $this->takenBy,
            'location_lat'   => $this->locationLat !== null ? (float)$this->locationLat : null,
            'location_lng'   => $this->locationLng !== null ? (float)$this->locationLng : null,
            'created_at'     => $this->createdAt,
        ];
    }
}
