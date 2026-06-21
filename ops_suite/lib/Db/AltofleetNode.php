<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int    getId()
 * @method string getLocalUuid()          @method void setLocalUuid(string $v)
 * @method ?int   getAssetId()            @method void setAssetId(?int $v)
 * @method ?int   getPlatformId()         @method void setPlatformId(?int $v)
 * @method ?int   getShopId()             @method void setShopId(?int $v)
 * @method string getHostname()           @method void setHostname(string $v)
 * @method string getIpAddress()          @method void setIpAddress(string $v)
 * @method string getMacAddress()         @method void setMacAddress(string $v)
 * @method string getAgentVersion()       @method void setAgentVersion(string $v)
 * @method string getOsName()             @method void setOsName(string $v)
 * @method string getOsVersion()          @method void setOsVersion(string $v)
 * @method string getOsPrettyName()       @method void setOsPrettyName(string $v)
 * @method string getArchitecture()       @method void setArchitecture(string $v)
 * @method int    getCpuCount()           @method void setCpuCount(int $v)
 * @method int    getMemoryMb()           @method void setMemoryMb(int $v)
 * @method int    getDiskGb()             @method void setDiskGb(int $v)
 * @method int    getDiskFreeGb()         @method void setDiskFreeGb(int $v)
 * @method float  getCpuPct()             @method void setCpuPct(float $v)
 * @method float  getMemoryPct()          @method void setMemoryPct(float $v)
 * @method float  getDiskPct()            @method void setDiskPct(float $v)
 * @method int    getUptimeSecs()         @method void setUptimeSecs(int $v)
 * @method string getServices()           @method void setServices(string $v)
 * @method string getThresholdAlerts()    @method void setThresholdAlerts(string $v)
 * @method string getStatus()             @method void setStatus(string $v)
 * @method string getLastSeen()           @method void setLastSeen(string $v)
 * @method string  getLastFullCheckin()    @method void setLastFullCheckin(string $v)
 * @method ?string getLastCveScan()        @method void setLastCveScan(?string $v)
 * @method string getRegisteredBy()       @method void setRegisteredBy(string $v)
 * @method string getRegisteredAt()       @method void setRegisteredAt(string $v)
 * @method string getCreatedAt()          @method void setCreatedAt(string $v)
 * @method string getUpdatedAt()          @method void setUpdatedAt(string $v)
 */
class AltofleetNode extends Entity implements \JsonSerializable {
    protected string $localUuid       = '';
    protected ?int   $assetId         = null;
    protected ?int   $platformId      = null;
    protected ?int   $shopId          = null;
    protected string $hostname        = '';
    protected string $ipAddress       = '';
    protected string $macAddress      = '';
    protected string $agentVersion    = '';
    protected string $osName          = '';
    protected string $osVersion       = '';
    protected string $osPrettyName    = '';
    protected string $architecture    = '';
    protected int    $cpuCount        = 0;
    protected int    $memoryMb        = 0;
    protected int    $diskGb          = 0;
    protected int    $diskFreeGb      = 0;
    protected float  $cpuPct          = 0.0;
    protected float  $memoryPct       = 0.0;
    protected float  $diskPct         = 0.0;
    protected int    $uptimeSecs      = 0;
    protected string $services        = '{}';
    protected string $thresholdAlerts = '[]';
    protected string $status          = 'new';
    protected string $lastSeen        = '';
    protected string  $lastFullCheckin = '';
    protected ?string $lastCveScan    = null;
    protected string $registeredBy   = '';
    protected string $registeredAt    = '';
    protected string $createdAt       = '';
    protected string $updatedAt       = '';

    public function jsonSerialize(): array {
        return [
            'id'                => $this->id,
            'local_uuid'        => $this->localUuid,
            'asset_id'          => $this->assetId,
            'platform_id'       => $this->platformId,
            'shop_id'           => $this->shopId,
            'hostname'          => $this->hostname,
            'ip_address'        => $this->ipAddress,
            'mac_address'       => $this->macAddress,
            'agent_version'     => $this->agentVersion,
            'os_name'           => $this->osName,
            'os_version'        => $this->osVersion,
            'os_pretty_name'    => $this->osPrettyName,
            'architecture'      => $this->architecture,
            'cpu_count'         => $this->cpuCount,
            'memory_mb'         => $this->memoryMb,
            'disk_gb'           => $this->diskGb,
            'disk_free_gb'      => $this->diskFreeGb,
            'cpu_pct'           => (float)$this->cpuPct,
            'memory_pct'        => (float)$this->memoryPct,
            'disk_pct'          => (float)$this->diskPct,
            'uptime_secs'       => $this->uptimeSecs,
            'services'          => json_decode($this->services        ?: '{}', true),
            'threshold_alerts'  => json_decode($this->thresholdAlerts ?: '[]', true),
            'status'            => $this->status,
            'last_seen'         => $this->lastSeen,
            'last_full_checkin' => $this->lastFullCheckin,
            'last_cve_scan'     => $this->lastCveScan,
            'registered_by'     => $this->registeredBy,
            'registered_at'     => $this->registeredAt,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
