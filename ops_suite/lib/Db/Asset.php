<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()               @method void setName(string $v)
 * @method string  getAssetType()          @method void setAssetType(string $v)
 * @method string  getManufacturer()       @method void setManufacturer(string $v)
 * @method string  getModel()              @method void setModel(string $v)
 * @method string  getSerialNumber()       @method void setSerialNumber(string $v)
 * @method string  getVersion()            @method void setVersion(string $v)
 * @method string  getLocation()           @method void setLocation(string $v)
 * @method string  getIpAddress()          @method void setIpAddress(string $v)
 * @method ?string getInstallDate()        @method void setInstallDate(?string $v)
 * @method ?string getWarrantyExpiry()     @method void setWarrantyExpiry(?string $v)
 * @method string  getStatus()             @method void setStatus(string $v)
 * @method string  getNotes()              @method void setNotes(string $v)
 * @method string  getTags()               @method void setTags(string $v)
 * @method string  getLinkedAssets()       @method void setLinkedAssets(string $v)
 * @method string  getCreatedBy()          @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()          @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()          @method void setUpdatedAt(string $v)
 * @method ?int    getPlatformId()         @method void setPlatformId(?int $v)
 * @method ?string getAssetCode()          @method void setAssetCode(?string $v)
 * @method ?string getLocalUuid()          @method void setLocalUuid(?string $v)
 * @method ?int    getShopId()             @method void setShopId(?int $v)
 * @method ?int    getParentId()           @method void setParentId(?int $v)
 * @method int     getDepth()              @method void setDepth(int $v)
 * @method ?string getSystemPosition()     @method void setSystemPosition(?string $v)
 * @method ?string getHierarchyPath()      @method void setHierarchyPath(?string $v)
 * @method ?string getCriticalityCode()    @method void setCriticalityCode(?string $v)
 * @method int     getBypassState()        @method void setBypassState(int $v)
 * @method int     getRedundancyAvailable() @method void setRedundancyAvailable(int $v)
 * @method ?string getHscCode()            @method void setHscCode(?string $v)
 */
class Asset extends Entity implements \JsonSerializable {
    protected string  $name                = '';
    protected string  $assetType           = 'hardware';
    protected string  $manufacturer        = '';
    protected string  $model               = '';
    protected string  $serialNumber        = '';
    protected string  $version             = '';
    protected string  $location            = '';
    protected string  $ipAddress           = '';
    protected ?string $installDate         = null;
    protected ?string $warrantyExpiry      = null;
    protected string  $status              = 'operational';
    protected string  $notes               = '';
    protected string  $tags                = '';
    protected string  $linkedAssets        = '';
    protected string  $createdBy           = '';
    protected string  $createdAt           = '';
    protected ?string $lastVerifiedAt      = null;
    protected string  $verifiedBy          = '';
    protected string  $uii                 = '';
    protected int     $iuidCompliant       = 0;
    protected string  $cageCode            = '';
    protected string  $updatedAt           = '';
    protected ?int    $tdpSourceAssetId    = null;
    protected ?int    $platformId          = null;
    // Sprint 0A — asset coding + shops + offline sync
    protected ?string $assetCode           = null;
    protected ?string $localUuid           = null;
    protected ?int    $shopId              = null;
    protected ?int    $parentId            = null;
    protected int     $depth               = 0;
    protected ?string $systemPosition      = null;
    protected ?string $hierarchyPath       = null;
    // Sprint 0B — criticality + readiness
    protected ?string $criticalityCode     = null;
    protected int     $bypassState         = 0;
    protected int     $redundancyAvailable = 0;
    // Sprint 1E — hierarchy completion (MOS-REQ-002 §3.4)
    protected ?string $displayId           = null;
    protected ?string $syncStatus          = 'confirmed';
    protected int     $createdOffline      = 0;
    protected int     $isSystemNode        = 0;
    protected int     $sortOrder           = 0;
    protected int     $bypassPossible      = 0;
    protected ?string $bypassMethod        = null;
    protected ?string $degradedCapability  = null;
    protected ?string $degradedNotes       = null;
    protected ?int    $failoverAssetId     = null;
    protected ?string $redundancyType      = null;
    protected ?int    $failoverTimeMins    = null;
    protected ?string $failoverProcedure   = null;
    // Sprint 2B — 3M/ESWBS system coding
    protected ?string $hscCode             = null;

    public function jsonSerialize(): array {
        $id = $this->getId();
        return [
            'id'                   => $id,
            'asset_id_label'       => sprintf('ASSET-%04d', $id),
            'asset_code'           => $this->assetCode,
            'local_uuid'           => $this->localUuid,
            'name'                 => $this->name,
            'asset_type'           => $this->assetType,
            'manufacturer'         => $this->manufacturer,
            'model'                => $this->model,
            'serial_number'        => $this->serialNumber,
            'version'              => $this->version,
            'location'             => $this->location,
            'ip_address'           => $this->ipAddress,
            'install_date'         => $this->installDate,
            'warranty_expiry'      => $this->warrantyExpiry,
            'status'               => $this->status,
            'notes'                => $this->notes,
            'tags'                 => $this->tags,
            'linked_assets'        => $this->linkedAssets,
            'created_by'           => $this->createdBy,
            'created_at'           => $this->createdAt,
            'updated_at'           => $this->updatedAt,
            'tdp_source_asset_id'  => $this->tdpSourceAssetId,
            'platform_id'          => $this->platformId,
            'shop_id'              => $this->shopId,
            'parent_id'            => $this->parentId,
            'depth'                => $this->depth,
            'system_position'      => $this->systemPosition,
            'hierarchy_path'       => $this->hierarchyPath,
            'criticality_code'     => $this->criticalityCode,
            'bypass_state'         => (bool)$this->bypassState,
            'redundancy_available' => (bool)$this->redundancyAvailable,
            'display_id'           => $this->displayId,
            'sync_status'          => $this->syncStatus,
            'created_offline'      => (bool)$this->createdOffline,
            'is_system_node'       => (bool)$this->isSystemNode,
            'sort_order'           => $this->sortOrder,
            'bypass_possible'      => (bool)$this->bypassPossible,
            'bypass_method'        => $this->bypassMethod,
            'degraded_capability'  => $this->degradedCapability !== null ? (float)$this->degradedCapability : null,
            'degraded_notes'       => $this->degradedNotes,
            'failover_asset_id'    => $this->failoverAssetId,
            'redundancy_type'      => $this->redundancyType,
            'failover_time_mins'   => $this->failoverTimeMins,
            'failover_procedure'   => $this->failoverProcedure,
            'last_verified_at'     => $this->lastVerifiedAt,
            'verified_by'          => $this->verifiedBy,
            'uii'                  => $this->uii,
            'iuid_compliant'       => (bool)$this->iuidCompliant,
            'cage_code'            => $this->cageCode,
            'hsc_code'             => $this->hscCode,
        ];
    }
}
