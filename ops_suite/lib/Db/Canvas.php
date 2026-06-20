<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()             @method void setName(string $v)
 * @method string  getCanvasType()       @method void setCanvasType(string $v)
 * @method ?int    getPlatformId()       @method void setPlatformId(?int $v)
 * @method ?int    getShopId()           @method void setShopId(?int $v)
 * @method ?int    getSystemAssetId()    @method void setSystemAssetId(?int $v)
 * @method ?string getCanvasData()       @method void setCanvasData(?string $v)
 * @method string  getVersion()          @method void setVersion(string $v)
 * @method bool    getIsLive()           @method void setIsLive(bool $v)
 * @method ?string getLastSyncedAt()     @method void setLastSyncedAt(?string $v)
 * @method ?string getCreatedBy()        @method void setCreatedBy(?string $v)
 * @method ?string getCreatedAt()        @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()        @method void setUpdatedAt(?string $v)
 */
class Canvas extends Entity implements \JsonSerializable {
    protected string  $name           = '';
    protected string  $canvasType     = 'custom';
    protected ?int    $platformId     = null;
    protected ?int    $shopId         = null;
    protected ?int    $systemAssetId  = null;
    protected ?string $canvasData     = null;
    protected string  $version        = 'A';
    protected bool    $isLive         = false;
    protected ?string $lastSyncedAt   = null;
    protected ?string $createdBy      = null;
    protected ?string $createdAt      = null;
    protected ?string $updatedAt      = null;

    public function jsonSerialize(): array {
        return [
            'id'              => $this->getId(),
            'name'            => $this->name,
            'canvas_type'     => $this->canvasType,
            'platform_id'     => $this->platformId,
            'shop_id'         => $this->shopId,
            'system_asset_id' => $this->systemAssetId,
            'canvas_data'     => $this->canvasData,
            'version'         => $this->version,
            'is_live'         => $this->isLive,
            'last_synced_at'  => $this->lastSyncedAt,
            'created_by'      => $this->createdBy,
            'created_at'      => $this->createdAt,
            'updated_at'      => $this->updatedAt,
        ];
    }
}
