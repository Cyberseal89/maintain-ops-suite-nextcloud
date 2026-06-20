<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getPersonnelId()      @method void setPersonnelId(int $v)
 * @method int     getSkillId()          @method void setSkillId(int $v)
 * @method int     getProficiencyLevel() @method void setProficiencyLevel(int $v)
 * @method ?string getCertifiedDate()    @method void setCertifiedDate(?string $v)
 * @method ?string getExpiryDate()       @method void setExpiryDate(?string $v)
 * @method ?string getNotes()            @method void setNotes(?string $v)
 * @method ?string getCreatedAt()        @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()        @method void setUpdatedAt(?string $v)
 */
class PersonnelSkill extends Entity implements \JsonSerializable {
    protected int     $personnelId      = 0;
    protected int     $skillId          = 0;
    protected int     $proficiencyLevel = 1;
    protected ?string $certifiedDate    = null;
    protected ?string $expiryDate       = null;
    protected ?string $notes            = null;
    protected ?string $createdAt        = null;
    protected ?string $updatedAt        = null;

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'personnel_id'      => $this->personnelId,
            'skill_id'          => $this->skillId,
            'proficiency_level' => $this->proficiencyLevel,
            'certified_date'    => $this->certifiedDate,
            'expiry_date'       => $this->expiryDate,
            'notes'             => $this->notes,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
