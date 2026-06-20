<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getId()
 * @method int     getWorksheetId()        @method void setWorksheetId(int $v)
 * @method string  getFunction()           @method void setFunction(string $v)
 * @method string  getFailureMode()        @method void setFailureMode(string $v)
 * @method string  getLocalEffect()        @method void setLocalEffect(string $v)
 * @method string  getSystemEffect()       @method void setSystemEffect(string $v)
 * @method string  getDetectionMethod()    @method void setDetectionMethod(string $v)
 * @method int     getSeverity()           @method void setSeverity(int $v)
 * @method int     getOccurrence()         @method void setOccurrence(int $v)
 * @method int     getDetectability()      @method void setDetectability(int $v)
 * @method int     getRpn()                @method void setRpn(int $v)
 * @method ?int    getFailureModeId()      @method void setFailureModeId(?int $v)
 * @method string  getRecommendedAction()  @method void setRecommendedAction(string $v)
 * @method string  getResponsibleParty()   @method void setResponsibleParty(string $v)
 * @method string  getActionTaken()        @method void setActionTaken(string $v)
 * @method ?int    getRevisedSev()         @method void setRevisedSev(?int $v)
 * @method ?int    getRevisedOcc()         @method void setRevisedOcc(?int $v)
 * @method ?int    getRevisedDet()         @method void setRevisedDet(?int $v)
 * @method ?int    getRevisedRpn()         @method void setRevisedRpn(?int $v)
 * @method string  getNotes()              @method void setNotes(string $v)
 * @method int     getSortOrder()          @method void setSortOrder(int $v)
 * @method ?string getCreatedAt()          @method void setCreatedAt(?string $v)
 * @method ?string getUpdatedAt()          @method void setUpdatedAt(?string $v)
 */
class FmeaEntry extends Entity implements \JsonSerializable {

    protected int     $worksheetId      = 0;
    protected string  $function         = '';
    protected string  $failureMode      = '';
    protected string  $localEffect      = '';
    protected string  $systemEffect     = '';
    protected string  $detectionMethod  = '';
    protected int     $severity         = 1;
    protected int     $occurrence       = 1;
    protected int     $detectability    = 1;
    protected int     $rpn              = 1;
    protected ?int    $failureModeId    = null;
    protected string  $recommendedAction = '';
    protected string  $responsibleParty  = '';
    protected string  $actionTaken      = '';
    protected ?int    $revisedSev       = null;
    protected ?int    $revisedOcc       = null;
    protected ?int    $revisedDet       = null;
    protected ?int    $revisedRpn       = null;
    protected string  $notes            = '';
    protected int     $sortOrder        = 0;
    protected ?string $createdAt        = null;
    protected ?string $updatedAt        = null;

    public function jsonSerialize(): array {
        return [
            'id'                 => $this->id,
            'worksheet_id'       => $this->worksheetId,
            'function'           => $this->function,
            'failure_mode'       => $this->failureMode,
            'local_effect'       => $this->localEffect,
            'system_effect'      => $this->systemEffect,
            'detection_method'   => $this->detectionMethod,
            'severity'           => $this->severity,
            'occurrence'         => $this->occurrence,
            'detectability'      => $this->detectability,
            'rpn'                => $this->rpn,
            'failure_mode_id'    => $this->failureModeId,
            'recommended_action' => $this->recommendedAction,
            'responsible_party'  => $this->responsibleParty,
            'action_taken'       => $this->actionTaken,
            'revised_sev'        => $this->revisedSev,
            'revised_occ'        => $this->revisedOcc,
            'revised_det'        => $this->revisedDet,
            'revised_rpn'        => $this->revisedRpn,
            'notes'              => $this->notes,
            'sort_order'         => $this->sortOrder,
            'created_at'         => $this->createdAt,
            'updated_at'         => $this->updatedAt,
        ];
    }
}
