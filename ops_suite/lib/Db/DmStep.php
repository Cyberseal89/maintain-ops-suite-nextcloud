<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * A single authored step within a Data Module (200-series procedural DM).
 *
 * step_type values:
 *   title           — section heading within the procedure
 *   warning         — safety warning (rendered prominently, before affected step)
 *   caution         — equipment protection notice
 *   note            — informational aside
 *   action          — the actual task step the technician performs
 *   expected_result — what the technician should observe after the action
 *   substep         — indented child step under an action
 *
 * @method int     getDocumentId()          @method void setDocumentId(int $v)
 * @method int     getStepOrder()           @method void setStepOrder(int $v)
 * @method string  getStepType()            @method void setStepType(string $v)
 * @method ?string getContent()             @method void setContent(?string $v)
 * @method ?string getToolRefs()            @method void setToolRefs(?string $v)
 * @method ?string getPartRefs()            @method void setPartRefs(?string $v)
 * @method ?string getCreatedAt()           @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()           @method void setUpdatedAt(?string $v)
 */
class DmStep extends Entity implements \JsonSerializable {
    protected int     $documentId = 0;
    protected int     $stepOrder  = 10;
    protected string  $stepType   = 'action';
    protected ?string $content    = null;
    protected ?string $toolRefs   = null;  // JSON array of tool names
    protected ?string $partRefs   = null;  // JSON array of NSN/part references
    protected ?string $createdAt  = null;
    protected ?string $updatedAt  = null;

    public function jsonSerialize(): array {
        return [
            'id'          => $this->getId(),
            'document_id' => $this->documentId,
            'step_order'  => $this->stepOrder,
            'step_type'   => $this->stepType,
            'content'     => $this->content,
            'tool_refs'   => json_decode($this->toolRefs  ?: '[]', true),
            'part_refs'   => json_decode($this->partRefs  ?: '[]', true),
            'created_at'  => $this->createdAt,
            'updated_at'  => $this->updatedAt,
        ];
    }
}
