<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

class ModelHotspot extends Entity implements \JsonSerializable {
    protected int     $modelId      = 0;
    protected string  $label        = '';
    protected string  $positionX    = '0';
    protected string  $positionY    = '0';
    protected string  $positionZ    = '0';
    protected ?string $linkedType   = null; // asset|interface|document|deficiency|requirement
    protected ?int    $linkedId     = null;
    protected ?string $hotspotColor = '#38bdf8';
    protected ?string $notes        = null;
    protected string  $createdAt    = '';

    public function jsonSerialize(): array {
        return [
            'id'            => $this->getId(),
            'model_id'      => $this->modelId,
            'label'         => $this->label,
            'position_x'    => (float)$this->positionX,
            'position_y'    => (float)$this->positionY,
            'position_z'    => (float)$this->positionZ,
            'linked_type'   => $this->linkedType,
            'linked_id'     => $this->linkedId,
            'hotspot_color' => $this->hotspotColor,
            'notes'         => $this->notes,
            'created_at'    => $this->createdAt,
        ];
    }
}
