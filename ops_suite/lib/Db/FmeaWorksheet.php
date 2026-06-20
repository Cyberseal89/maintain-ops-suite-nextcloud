<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getId()
 * @method int     getCanvasId()       @method void setCanvasId(int $v)
 * @method string  getNodeId()         @method void setNodeId(string $v)
 * @method ?int    getAssetId()        @method void setAssetId(?int $v)
 * @method string  getTitle()          @method void setTitle(string $v)
 * @method string  getStatus()         @method void setStatus(string $v)
 * @method ?int    getDocId()          @method void setDocId(?int $v)
 * @method string  getCreatedBy()      @method void setCreatedBy(string $v)
 * @method ?string getCreatedAt()      @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()      @method void setUpdatedAt(?string $v)
 */
class FmeaWorksheet extends Entity implements \JsonSerializable {

    protected int     $canvasId  = 0;
    protected string  $nodeId    = '';
    protected ?int    $assetId   = null;
    protected string  $title     = 'FMEA Worksheet';
    protected string  $status    = 'draft';
    protected ?int    $docId     = null;
    protected string  $createdBy = '';
    protected ?string $createdAt = null;
    protected ?string $updatedAt = null;

    public function jsonSerialize(): array {
        return [
            'id'         => $this->id,
            'canvas_id'  => $this->canvasId,
            'node_id'    => $this->nodeId,
            'asset_id'   => $this->assetId,
            'title'      => $this->title,
            'status'     => $this->status,
            'doc_id'     => $this->docId,
            'created_by' => $this->createdBy,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
