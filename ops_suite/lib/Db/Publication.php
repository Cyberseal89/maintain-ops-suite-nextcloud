<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * A Publication is an ordered collection of S1000D Data Modules that together
 * form a complete technical manual (Maintenance Manual, Fault Manual, IPD, etc.).
 *
 * pub_type values: MM (Maintenance Manual) | FM (Fault Manual) | IPD (Illustrated Parts Data) | OM (Operators Manual)
 * status values:   draft | review | approved | cancelled
 *
 * @method string  getPubCode()           @method void setPubCode(string $v)
 * @method string  getTitle()             @method void setTitle(string $v)
 * @method ?int    getAssetId()           @method void setAssetId(?int $v)
 * @method ?int    getPlatformId()        @method void setPlatformId(?int $v)
 * @method string  getPubType()           @method void setPubType(string $v)
 * @method int     getIssueNumber()       @method void setIssueNumber(int $v)
 * @method string  getStatus()            @method void setStatus(string $v)
 * @method bool    getReIssueRequired()   @method void setReIssueRequired(bool $v)
 * @method ?string getNotes()             @method void setNotes(?string $v)
 * @method ?string getCreatedBy()         @method void setCreatedBy(?string $v)
 * @method ?string getCreatedAt()         @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()         @method void setUpdatedAt(?string $v)
 */
class Publication extends Entity implements \JsonSerializable {
    protected string  $pubCode        = '';
    protected string  $title          = '';
    protected ?int    $assetId        = null;
    protected ?int    $platformId     = null;
    protected string  $pubType        = 'MM';
    protected int     $issueNumber    = 1;
    protected string  $status         = 'draft';
    protected bool    $reIssueRequired = false;
    protected ?string $notes          = null;
    protected ?string $createdBy      = null;
    protected ?string $createdAt      = null;
    protected ?string $updatedAt      = null;

    public function __construct() {
        $this->addType('reIssueRequired', 'boolean');
    }

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'pub_code'          => $this->pubCode,
            'title'             => $this->title,
            'asset_id'          => $this->assetId,
            'platform_id'       => $this->platformId,
            'pub_type'          => $this->pubType,
            'issue_number'      => $this->issueNumber,
            'status'            => $this->status,
            're_issue_required' => (bool)$this->reIssueRequired,
            'notes'             => $this->notes,
            'created_by'        => $this->createdBy,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
