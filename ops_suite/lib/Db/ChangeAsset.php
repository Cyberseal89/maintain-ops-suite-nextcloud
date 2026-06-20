<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getChangeId()       @method void setChangeId(int $v)
 * @method int     getAssetId()        @method void setAssetId(int $v)
 * @method string  getAction()         @method void setAction(string $v)
 * @method ?string getBeforeVersion()  @method void setBeforeVersion(?string $v)
 * @method ?string getAfterVersion()   @method void setAfterVersion(?string $v)
 * @method ?string getNotes()          @method void setNotes(?string $v)
 */
class ChangeAsset extends Entity implements \JsonSerializable {
    protected int     $changeId       = 0;
    protected int     $assetId        = 0;
    protected string  $action         = 'modify';
    protected ?string $beforeVersion  = null;
    protected ?string $afterVersion   = null;
    protected ?string $notes          = null;

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'change_id'      => $this->changeId,
            'asset_id'       => $this->assetId,
            'action'         => $this->action,
            'before_version' => $this->beforeVersion,
            'after_version'  => $this->afterVersion,
            'notes'          => $this->notes,
        ];
    }
}
