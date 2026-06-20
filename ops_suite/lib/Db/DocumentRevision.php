<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class DocumentRevision extends Entity implements \JsonSerializable {
    protected int     $documentId  = 0;
    protected string  $revision    = '';
    protected string  $changeDesc  = '';
    protected ?string $filePath    = null;
    protected string  $author      = '';
    protected ?string $approvedBy  = null;
    protected ?string $approvedAt  = null;
    protected string  $createdAt   = '';

    public function getDocumentId(): int            { return $this->documentId; }
    public function setDocumentId(int $v): void     { $this->documentId = $v; $this->markFieldUpdated('documentId'); }
    public function getRevision(): string           { return $this->revision; }
    public function setRevision(string $v): void    { $this->revision = $v; $this->markFieldUpdated('revision'); }
    public function getChangeDesc(): string         { return $this->changeDesc; }
    public function setChangeDesc(string $v): void  { $this->changeDesc = $v; $this->markFieldUpdated('changeDesc'); }
    public function getFilePath(): ?string          { return $this->filePath; }
    public function setFilePath(?string $v): void   { $this->filePath = $v; $this->markFieldUpdated('filePath'); }
    public function getAuthor(): string             { return $this->author; }
    public function setAuthor(string $v): void      { $this->author = $v; $this->markFieldUpdated('author'); }
    public function getApprovedBy(): ?string        { return $this->approvedBy; }
    public function setApprovedBy(?string $v): void { $this->approvedBy = $v; $this->markFieldUpdated('approvedBy'); }
    public function getApprovedAt(): ?string        { return $this->approvedAt; }
    public function setApprovedAt(?string $v): void { $this->approvedAt = $v; $this->markFieldUpdated('approvedAt'); }
    public function getCreatedAt(): string          { return $this->createdAt; }
    public function setCreatedAt(string $v): void   { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }

    public function jsonSerialize(): array {
        return [
            'id'          => $this->getId(),
            'document_id' => $this->documentId,
            'revision'    => $this->revision,
            'change_desc' => $this->changeDesc,
            'file_path'   => $this->filePath,
            'author'      => $this->author,
            'approved_by' => $this->approvedBy,
            'approved_at' => $this->approvedAt,
            'created_at'  => $this->createdAt,
        ];
    }
}
