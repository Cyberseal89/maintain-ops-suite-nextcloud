<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()                  @method void setName(string $v)
 * @method string  getCategory()              @method void setCategory(string $v)
 * @method ?string getManufacturer()          @method void setManufacturer(?string $v)
 * @method ?string getModelNumber()           @method void setModelNumber(?string $v)
 * @method string  getAssetType()             @method void setAssetType(string $v)
 * @method ?string getDefaultCriticality()    @method void setDefaultCriticality(?string $v)
 * @method ?string getNsn()                   @method void setNsn(?string $v)
 * @method ?string getCageCode()              @method void setCageCode(?string $v)
 * @method ?string getInterfaceTemplates()    @method void setInterfaceTemplates(?string $v)
 * @method ?string getPmTemplates()           @method void setPmTemplates(?string $v)
 * @method ?string getSpecs()                 @method void setSpecs(?string $v)
 * @method ?string getIconSvg()               @method void setIconSvg(?string $v)
 * @method ?string getCreatedAt()             @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()             @method void setUpdatedAt(?string $v)
 */
class ComponentLibraryItem extends Entity implements \JsonSerializable {
    protected string  $name                = '';
    protected string  $category            = 'custom';
    protected ?string $manufacturer        = null;
    protected ?string $modelNumber         = null;
    protected string  $assetType           = 'hardware';
    protected ?string $defaultCriticality  = null;
    protected ?string $nsn                 = null;
    protected ?string $cageCode            = null;
    protected ?string $interfaceTemplates  = null;
    protected ?string $pmTemplates         = null;
    protected ?string $specs               = null;
    protected ?string $iconSvg             = null;
    protected ?string $createdAt           = null;
    protected ?string $updatedAt           = null;

    public function jsonSerialize(): array {
        return [
            'id'                  => $this->getId(),
            'name'                => $this->name,
            'category'            => $this->category,
            'manufacturer'        => $this->manufacturer,
            'model_number'        => $this->modelNumber,
            'asset_type'          => $this->assetType,
            'default_criticality' => $this->defaultCriticality,
            'nsn'                 => $this->nsn,
            'cage_code'           => $this->cageCode,
            'interface_templates' => $this->interfaceTemplates ? json_decode($this->interfaceTemplates, true) : null,
            'pm_templates'        => $this->pmTemplates        ? json_decode($this->pmTemplates, true)        : null,
            'specs'               => $this->specs              ? json_decode($this->specs, true)              : null,
            'icon_svg'            => $this->iconSvg,
            'created_at'          => $this->createdAt,
            'updated_at'          => $this->updatedAt,
        ];
    }
}
