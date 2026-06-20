<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method ?int    getAssetId()          @method void setAssetId(?int $v)
 * @method string  getSessionType()      @method void setSessionType(string $v)
 * @method string  getStatus()           @method void setStatus(string $v)
 * @method ?string getTagNumber()        @method void setTagNumber(?string $v)
 * @method ?string getLockNumber()       @method void setLockNumber(?string $v)
 * @method ?string getEquipmentName()    @method void setEquipmentName(?string $v)
 * @method ?string getLocation()         @method void setLocation(?string $v)
 * @method ?string getWorkDescription()  @method void setWorkDescription(?string $v)
 * @method ?string getHazards()          @method void setHazards(?string $v)
 * @method ?string getEnergySources()    @method void setEnergySources(?string $v)
 * @method ?string getEnergySourceIds()  @method void setEnergySourceIds(?string $v)
 * @method ?string getStepsCompleted()   @method void setStepsCompleted(?string $v)
 * @method ?string getDeviceIds()        @method void setDeviceIds(?string $v)
 * @method ?int    getLinkedDefId()      @method void setLinkedDefId(?int $v)
 * @method ?int    getLinkedProcId()     @method void setLinkedProcId(?int $v)
 * @method ?string getInitiatedBy()      @method void setInitiatedBy(?string $v)
 * @method ?string getInitiatedAt()      @method void setInitiatedAt(?string $v)
 * @method ?string getAuthorizedBy()     @method void setAuthorizedBy(?string $v)
 * @method ?string getExpectedRelease()  @method void setExpectedRelease(?string $v)
 * @method ?string getReleasedBy()       @method void setReleasedBy(?string $v)
 * @method ?string getReleasedAt()       @method void setReleasedAt(?string $v)
 * @method ?string getReleaseNotes()     @method void setReleaseNotes(?string $v)
 * @method ?string getLastVerifiedAt()   @method void setLastVerifiedAt(?string $v)
 * @method ?string getLastVerifiedBy()   @method void setLastVerifiedBy(?string $v)
 * @method ?string getCreatedAt()        @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()        @method void setUpdatedAt(?string $v)
 */
class LotoSession extends Entity implements \JsonSerializable {
    protected ?int    $assetId          = null;
    protected string  $sessionType      = 'deficiency';
    protected string  $status           = 'active';
    protected ?string $tagNumber        = null;
    protected ?string $lockNumber       = null;
    protected ?string $equipmentName    = null;
    protected ?string $location         = null;
    protected ?string $workDescription  = null;
    protected ?string $hazards          = null;
    protected ?string $energySources    = null;
    protected ?string $energySourceIds  = null;
    protected ?string $stepsCompleted   = null;
    protected ?string $deviceIds        = null;
    protected ?int    $linkedDefId      = null;
    protected ?int    $linkedProcId     = null;
    protected ?string $initiatedBy      = null;
    protected ?string $initiatedAt      = null;
    protected ?string $authorizedBy     = null;
    protected ?string $expectedRelease  = null;
    protected ?string $releasedBy       = null;
    protected ?string $releasedAt       = null;
    protected ?string $releaseNotes     = null;
    protected ?string $lastVerifiedAt   = null;
    protected ?string $lastVerifiedBy   = null;
    protected ?string $createdAt        = null;
    protected ?string $updatedAt        = null;

    public function jsonSerialize(): array {
        return [
            'id'               => $this->getId(),
            'asset_id'         => $this->assetId,
            'session_type'     => $this->sessionType,
            'status'           => $this->status,
            'tag_number'       => $this->tagNumber,
            'lock_number'      => $this->lockNumber,
            'equipment_name'   => $this->equipmentName,
            'location'         => $this->location,
            'work_description' => $this->workDescription,
            'hazards'          => $this->hazards,
            'energy_sources'   => $this->energySources ? json_decode($this->energySources, true) : [],
            'steps_completed'  => $this->stepsCompleted ? json_decode($this->stepsCompleted, true) : [],
            'device_ids'       => $this->deviceIds ? json_decode($this->deviceIds, true) : [],
            'linked_def_id'    => $this->linkedDefId,
            'linked_proc_id'   => $this->linkedProcId,
            'initiated_by'     => $this->initiatedBy,
            'initiated_at'     => $this->initiatedAt,
            'authorized_by'    => $this->authorizedBy,
            'expected_release' => $this->expectedRelease,
            'released_by'      => $this->releasedBy,
            'released_at'      => $this->releasedAt,
            'release_notes'    => $this->releaseNotes,
            'last_verified_at' => $this->lastVerifiedAt,
            'last_verified_by' => $this->lastVerifiedBy,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
