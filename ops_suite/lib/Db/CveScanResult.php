<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int    getId()
 * @method int    getNodeId()             @method void setNodeId(int $v)
 * @method string getCveId()              @method void setCveId(string $v)
 * @method string getSeverity()           @method void setSeverity(string $v)
 * @method string getPackageName()        @method void setPackageName(string $v)
 * @method string getInstalledVersion()   @method void setInstalledVersion(string $v)
 * @method string getFixedVersion()       @method void setFixedVersion(string $v)
 * @method string getDescription()        @method void setDescription(string $v)
 * @method string getCvssScore()          @method void setCvssScore(string $v)
 * @method string getScannedAt()          @method void setScannedAt(string $v)
 * @method ?int   getDeficiencyId()       @method void setDeficiencyId(?int $v)
 * @method bool   getResolved()           @method void setResolved(bool $v)
 * @method string getCreatedAt()          @method void setCreatedAt(string $v)
 */
class CveScanResult extends Entity implements \JsonSerializable {
    protected int    $nodeId           = 0;
    protected string $cveId            = '';
    protected string $severity         = 'UNKNOWN';
    protected string $packageName      = '';
    protected string $installedVersion = '';
    protected string $fixedVersion     = '';
    protected string $description      = '';
    protected string $cvssScore        = '';
    protected string $scannedAt        = '';
    protected ?int   $deficiencyId     = null;
    protected bool   $resolved         = false;
    protected string $createdAt        = '';

    public function jsonSerialize(): array {
        return [
            'id'                => $this->id,
            'node_id'           => $this->nodeId,
            'cve_id'            => $this->cveId,
            'severity'          => $this->severity,
            'package_name'      => $this->packageName,
            'installed_version' => $this->installedVersion,
            'fixed_version'     => $this->fixedVersion,
            'description'       => $this->description,
            'cvss_score'        => $this->cvssScore,
            'scanned_at'        => $this->scannedAt,
            'deficiency_id'     => $this->deficiencyId,
            'resolved'          => $this->resolved,
            'created_at'        => $this->createdAt,
        ];
    }
}
