<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()            @method void setName(string $v)
 * @method string  getAssetType()       @method void setAssetType(string $v)
 * @method string  getManufacturer()    @method void setManufacturer(string $v)
 * @method string  getModel()           @method void setModel(string $v)
 * @method string  getSerialNumber()    @method void setSerialNumber(string $v)
 * @method string  getVersion()         @method void setVersion(string $v)
 * @method string  getLocation()        @method void setLocation(string $v)
 * @method string  getIpAddress()       @method void setIpAddress(string $v)
 * @method ?string getInstallDate()     @method void setInstallDate(?string $v)
 * @method ?string getWarrantyExpiry()  @method void setWarrantyExpiry(?string $v)
 * @method string  getStatus()          @method void setStatus(string $v)
 * @method string  getNotes()           @method void setNotes(string $v)
 * @method string  getTags()            @method void setTags(string $v)
 * @method string  getLinkedAssets()    @method void setLinkedAssets(string $v)
 * @method string  getCreatedBy()       @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()       @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()       @method void setUpdatedAt(string $v)
 * @method ?int    getPlatformId()   @method void setPlatformId(?int \$v)
 */
class Asset extends Entity implements \JsonSerializable {
    protected string  $name           = '';
    protected string  $assetType      = 'hardware';
    protected string  $manufacturer   = '';
    protected string  $model          = '';
    protected string  $serialNumber   = '';
    protected string  $version        = '';
    protected string  $location       = '';
    protected string  $ipAddress      = '';
    protected ?string $installDate    = null;
    protected ?string $warrantyExpiry = null;
    protected string  $status         = 'operational';
    protected string  $notes          = '';
    protected string  $tags           = '';
    protected string  $linkedAssets   = '';
    protected string  $createdBy      = '';
    protected string  $createdAt      = '';
    protected ?string $lastVerifiedAt  = null;
    protected string  $verifiedBy      = '';
    protected string  $uii             = '';
    protected int     $iuidCompliant   = 0;
    protected string  $cageCode        = '';
    protected string  $updatedAt      = '';
    protected ?int    $tdpSourceAssetId = null;
    protected ?int     $platformId     = null;

    public function jsonSerialize(): array {
        $id = $this->getId();
        return [
            'id'              => $id,
            'asset_id_label'  => sprintf('ASSET-%04d', $id),
            'name'            => $this->name,
            'asset_type'      => $this->assetType,
            'manufacturer'    => $this->manufacturer,
            'model'           => $this->model,
            'serial_number'   => $this->serialNumber,
            'version'         => $this->version,
            'location'        => $this->location,
            'ip_address'      => $this->ipAddress,
            'install_date'    => $this->installDate,
            'warranty_expiry' => $this->warrantyExpiry,
            'status'          => $this->status,
            'notes'           => $this->notes,
            'tags'            => $this->tags,
            'linked_assets'   => $this->linkedAssets,
            'created_by'      => $this->createdBy,
            'created_at'      => $this->createdAt,
            'updated_at'      => $this->updatedAt,
            'tdp_source_asset_id' => $this->tdpSourceAssetId,
            'platform_id'     => $this->platformId,
            'last_verified_at'=> $this->lastVerifiedAt,
            'verified_by'     => $this->verifiedBy,
            'uii'             => $this->uii,
            'iuid_compliant'  => (bool)$this->iuidCompliant,
            'cage_code'       => $this->cageCode,
        ];
    }
}
