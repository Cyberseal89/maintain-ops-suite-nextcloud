<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int    getBudgetId()          @method void setBudgetId(int $v)
 * @method string getLineType()          @method void setLineType(string $v)
 * @method string getDescription()       @method void setDescription(string $v)
 * @method float  getAuthorizedAmount()  @method void setAuthorizedAmount(float $v)
 * @method float  getObligatedAmount()   @method void setObligatedAmount(float $v)
 * @method float  getUfrAmount()         @method void setUfrAmount(float $v)
 * @method ?string getNotes()            @method void setNotes(?string $v)
 * @method string getCreatedAt()         @method void setCreatedAt(string $v)
 * @method string getUpdatedAt()         @method void setUpdatedAt(string $v)
 */
class MmbpLine extends Entity implements \JsonSerializable {
    protected int     $budgetId         = 0;
    protected string  $lineType         = 'other';
    protected string  $description      = '';
    protected float   $authorizedAmount = 0.0;
    protected float   $obligatedAmount  = 0.0;
    protected float   $ufrAmount        = 0.0;
    protected ?string $notes            = null;
    protected string  $createdAt        = '';
    protected string  $updatedAt        = '';

    public function jsonSerialize(): array {
        return [
            'id'                => $this->getId(),
            'budget_id'         => $this->budgetId,
            'line_type'         => $this->lineType,
            'description'       => $this->description,
            'authorized_amount' => (float)$this->authorizedAmount,
            'obligated_amount'  => (float)$this->obligatedAmount,
            'ufr_amount'        => (float)$this->ufrAmount,
            'notes'             => $this->notes,
            'created_at'        => $this->createdAt,
            'updated_at'        => $this->updatedAt,
        ];
    }
}
