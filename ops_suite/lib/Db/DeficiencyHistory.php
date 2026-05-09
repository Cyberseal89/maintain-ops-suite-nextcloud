<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class DeficiencyHistory extends Entity implements \JsonSerializable {
    protected int    $deficiencyId = 0;
    protected string $entryText   = '';
    protected string $createdBy   = '';
    protected string $createdAt   = '';

    public function getDeficiencyId(): int           { return $this->deficiencyId; }
    public function setDeficiencyId(int $v): void    { $this->deficiencyId = $v; $this->markFieldUpdated('deficiencyId'); }
    public function getEntryText(): string           { return $this->entryText; }
    public function setEntryText(string $v): void    { $this->entryText = $v; $this->markFieldUpdated('entryText'); }
    public function getCreatedBy(): string           { return $this->createdBy; }
    public function setCreatedBy(string $v): void    { $this->createdBy = $v; $this->markFieldUpdated('createdBy'); }
    public function getCreatedAt(): string           { return $this->createdAt; }
    public function setCreatedAt(string $v): void    { $this->createdAt = $v; $this->markFieldUpdated('createdAt'); }

    public function jsonSerialize(): array {
        return [
            'id'            => $this->getId(),
            'deficiency_id' => $this->deficiencyId,
            'entry_text'    => $this->entryText,
            'entry'         => $this->entryText,   // alias for JS compatibility
            'created_by'    => $this->createdBy,
            'created_at'    => $this->createdAt,
        ];
    }
}
