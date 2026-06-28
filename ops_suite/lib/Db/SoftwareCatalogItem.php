<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Db;
use OCP\AppFramework\Db\Entity;

class SoftwareCatalogItem extends Entity implements \JsonSerializable {
    protected $name;
    protected $packageName;
    protected $description;
    protected $category;
    protected $tier;
    protected $icon;
    protected $autoApprove;
    protected $enabled;
    protected $createdAt;
    protected $updatedAt;

    public function __construct() {
        $this->addType('autoApprove', 'boolean');
        $this->addType('enabled', 'boolean');
    }

    public function jsonSerialize(): array {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'package_name' => $this->packageName,
            'description'  => $this->description,
            'category'     => $this->category,
            'tier'         => (int)$this->tier,
            'tier_label'   => $this->tierLabel(),
            'icon'         => $this->icon,
            'auto_approve' => (bool)$this->autoApprove,
            'enabled'      => (bool)$this->enabled,
            'created_at'   => $this->createdAt,
            'updated_at'   => $this->updatedAt,
        ];
    }

    public function tierLabel(): string {
        return match((int)$this->tier) {
            1 => 'Free',
            2 => 'Standard',
            3 => 'Professional',
            4 => 'Restricted',
            default => 'Unknown',
        };
    }
}
