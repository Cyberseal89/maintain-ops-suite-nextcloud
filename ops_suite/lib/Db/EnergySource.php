<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method string  getName()               @method void setName(string $v)
 * @method string  getSourceType()         @method void setSourceType(string $v)
 * @method ?int    getAssetId()            @method void setAssetId(?int $v)
 * @method ?string getPanelName()          @method void setPanelName(?string $v)
 * @method ?string getBreakerNumber()      @method void setBreakerNumber(?string $v)
 * @method ?float  getVoltageV()           @method void setVoltageV(?float $v)
 * @method ?float  getCurrentA()           @method void setCurrentA(?float $v)
 * @method ?float  getPressurePsi()        @method void setPressurePsi(?float $v)
 * @method ?string getLocation()           @method void setLocation(?string $v)
 * @method ?string getIsolationProcedure() @method void setIsolationProcedure(?string $v)
 * @method ?string getNotes()              @method void setNotes(?string $v)
 * @method string  getCreatedBy()          @method void setCreatedBy(string $v)
 * @method string  getCreatedAt()          @method void setCreatedAt(string $v)
 * @method string  getUpdatedAt()          @method void setUpdatedAt(string $v)
 */
class EnergySource extends Entity implements \JsonSerializable {
    protected string  $name               = '';
    protected string  $sourceType         = 'electrical';
    protected ?int    $assetId            = null;
    protected ?string $panelName          = null;
    protected ?string $breakerNumber      = null;
    protected ?float  $voltageV           = null;
    protected ?float  $currentA           = null;
    protected ?float  $pressurePsi        = null;
    protected ?string $location           = null;
    protected ?string $isolationProcedure = null;
    protected ?string $notes              = null;
    protected string  $createdBy          = '';
    protected string  $createdAt          = '';
    protected string  $updatedAt          = '';

    public function jsonSerialize(): array {
        return [
            'id'                  => $this->getId(),
            'name'                => $this->name,
            'source_type'         => $this->sourceType,
            'asset_id'            => $this->assetId,
            'panel_name'          => $this->panelName,
            'breaker_number'      => $this->breakerNumber,
            'voltage_v'           => $this->voltageV !== null ? (float)$this->voltageV : null,
            'current_a'           => $this->currentA !== null ? (float)$this->currentA : null,
            'pressure_psi'        => $this->pressurePsi !== null ? (float)$this->pressurePsi : null,
            'location'            => $this->location,
            'isolation_procedure' => $this->isolationProcedure,
            'notes'               => $this->notes,
            'created_by'          => $this->createdBy,
            'created_at'          => $this->createdAt,
            'updated_at'          => $this->updatedAt,
        ];
    }
}
