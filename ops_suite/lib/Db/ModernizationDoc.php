<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getModernizationId()  @method void setModernizationId(int $v)
 * @method string  getDocType()          @method void setDocType(string $v)
 * @method string  getTitle()            @method void setTitle(string $v)
 * @method string  getFileRef()          @method void setFileRef(string $v)
 * @method string  getStatus()           @method void setStatus(string $v)
 * @method string  getNotes()            @method void setNotes(string $v)
 * @method string  getCreatedBy()        @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()        @method void setCreatedAt(string $v)
 */
class ModernizationDoc extends Entity implements \JsonSerializable {
    protected int    $modernizationId = 0;
    protected string $docType         = 'other';
    protected string $title           = '';
    protected string $fileRef         = '';
    protected string $status          = 'pending';
    protected string $notes           = '';
    protected string $createdBy       = '';
    protected string $createdAt       = '';

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'modernization_id'  => $this->modernizationId,
            'doc_type'          => $this->docType,
            'title'             => $this->title,
            'file_ref'          => $this->fileRef,
            'status'            => $this->status,
            'notes'             => $this->notes,
            'created_by'        => $this->createdBy,
            'created_at'        => $this->createdAt,
        ];
    }
}
