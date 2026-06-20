<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class ModAsset extends Entity implements \JsonSerializable {
    protected int     $modId         = 0;
    protected int     $assetId       = 0;
    protected string  $action        = 'modify';
    protected ?string $beforeVersion = null;
    protected ?string $afterVersion  = null;
    protected string  $notes         = '';

    public function getModId(): int               { return $this->modId; }
    public function setModId(int $v): void        { $this->modId = $v; $this->markFieldUpdated('modId'); }
    public function getAssetId(): int             { return $this->assetId; }
    public function setAssetId(int $v): void      { $this->assetId = $v; $this->markFieldUpdated('assetId'); }
    public function getAction(): string           { return $this->action; }
    public function setAction(string $v): void    { $this->action = $v; $this->markFieldUpdated('action'); }
    public function getBeforeVersion(): ?string   { return $this->beforeVersion; }
    public function setBeforeVersion(?string $v): void { $this->beforeVersion = $v; $this->markFieldUpdated('beforeVersion'); }
    public function getAfterVersion(): ?string    { return $this->afterVersion; }
    public function setAfterVersion(?string $v): void  { $this->afterVersion = $v; $this->markFieldUpdated('afterVersion'); }
    public function getNotes(): string            { return $this->notes; }
    public function setNotes(string $v): void     { $this->notes = $v; $this->markFieldUpdated('notes'); }

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'mod_id'         => $this->modId,
            'asset_id'       => $this->assetId,
            'action'         => $this->action,
            'before_version' => $this->beforeVersion,
            'after_version'  => $this->afterVersion,
            'notes'          => $this->notes,
        ];
    }
}
