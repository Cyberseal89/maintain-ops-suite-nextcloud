<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getId()
 * @method void    setId(int $id)
 * @method int|null getPlatformId()
 * @method void    setPlatformId(?int $v)
 * @method string  getImportType()
 * @method void    setImportType(string $v)
 * @method string  getFileFormat()
 * @method void    setFileFormat(string $v)
 * @method string  getFilePath()
 * @method void    setFilePath(string $v)
 * @method string|null getOriginalName()
 * @method void    setOriginalName(?string $v)
 * @method string  getStatus()
 * @method void    setStatus(string $v)
 * @method string|null getColumnMap()
 * @method void    setColumnMap(?string $v)
 * @method string|null getDetectedHeaders()
 * @method void    setDetectedHeaders(?string $v)
 * @method string|null getPreviewRows()
 * @method void    setPreviewRows(?string $v)
 * @method int|null getTotalRows()
 * @method void    setTotalRows(?int $v)
 * @method int|null getValidRows()
 * @method void    setValidRows(?int $v)
 * @method int|null getErrorRows()
 * @method void    setErrorRows(?int $v)
 * @method int|null getImportedRows()
 * @method void    setImportedRows(?int $v)
 * @method string|null getValidationErrors()
 * @method void    setValidationErrors(?string $v)
 * @method string|null getErrorMessage()
 * @method void    setErrorMessage(?string $v)
 * @method string  getCreatedBy()
 * @method void    setCreatedBy(string $v)
 * @method string  getCreatedAt()
 * @method void    setCreatedAt(string $v)
 * @method string  getUpdatedAt()
 * @method void    setUpdatedAt(string $v)
 * @method string|null getCompletedAt()
 * @method void    setCompletedAt(?string $v)
 */
class ImportJob extends Entity implements \JsonSerializable {

    protected ?int    $platformId       = null;
    protected string  $importType       = 'assets';
    protected string  $fileFormat       = 'csv';
    protected string  $filePath         = '';
    protected ?string $originalName     = null;
    protected string  $status           = 'pending';
    protected ?string $columnMap        = null;
    protected ?string $detectedHeaders  = null;
    protected ?string $previewRows      = null;
    protected ?int    $totalRows        = null;
    protected ?int    $validRows        = null;
    protected ?int    $errorRows        = null;
    protected ?int    $importedRows     = null;
    protected ?string $validationErrors = null;
    protected ?string $errorMessage     = null;
    protected string  $createdBy        = '';
    protected string  $createdAt        = '';
    protected string  $updatedAt        = '';
    protected ?string $completedAt      = null;

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'platform_id'       => $this->platformId,
            'import_type'       => $this->importType,
            'file_format'       => $this->fileFormat,
            'file_path'         => $this->filePath,
            'original_name'     => $this->originalName,
            'status'            => $this->status,
            'column_map'        => $this->columnMap ? json_decode($this->columnMap, true) : null,
            'detected_headers'  => $this->detectedHeaders ? json_decode($this->detectedHeaders, true) : [],
            'preview_rows'      => $this->previewRows ? json_decode($this->previewRows, true) : [],
            'total_rows'        => $this->totalRows,
            'valid_rows'        => $this->validRows,
            'error_rows'        => $this->errorRows,
            'imported_rows'     => $this->importedRows,
            'validation_errors' => $this->validationErrors ? json_decode($this->validationErrors, true) : [],
            'error_message'     => $this->errorMessage,
            'created_by'        => $this->createdBy,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
            'completed_at'      => $this->completedAt,
        ];
    }
}
