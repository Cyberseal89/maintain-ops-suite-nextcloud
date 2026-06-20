<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class AssetModel extends Entity implements \JsonSerializable {
    protected int     $documentId       = 0;
    protected ?int    $assetId          = null;
    protected string  $sourceFormat     = 'GLTF';
    protected string  $sourceFilePath   = '';
    protected ?string $gltfFilePath     = null;
    protected ?string $thumbnailPath    = null;
    protected ?int    $polyCount        = null;
    protected ?string $fileSizeMb       = null;
    protected ?string $modelVersion     = 'v1.0';
    protected string  $conversionStatus = 'ready';
    protected ?string $conversionError  = null;
    protected ?string $description      = null;
    protected string  $createdBy        = '';
    protected string  $createdAt        = '';
    protected string  $updatedAt        = '';

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'document_id'       => $this->documentId,
            'asset_id'          => $this->assetId,
            'source_format'     => $this->sourceFormat,
            'source_file_path'  => $this->sourceFilePath,
            'gltf_file_path'    => $this->gltfFilePath,
            'thumbnail_path'    => $this->thumbnailPath,
            'poly_count'        => $this->polyCount,
            'file_size_mb'      => $this->fileSizeMb !== null ? (float)$this->fileSizeMb : null,
            'model_version'     => $this->modelVersion,
            'conversion_status' => $this->conversionStatus,
            'conversion_error'  => $this->conversionError,
            'description'       => $this->description,
            'created_by'        => $this->createdBy,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
