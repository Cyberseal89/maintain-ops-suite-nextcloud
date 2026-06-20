<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Db;

use OCP\AppFramework\Db\Entity;

/**
 * @method int     getAssetId()       @method void setAssetId(int $v)
 * @method string  getReadinessCode() @method void setReadinessCode(string $v)
 * @method string  getNarrative()     @method void setNarrative(string $v)
 * @method int     getOpenCrSev1()    @method void setOpenCrSev1(int $v)
 * @method int     getOpenCrSev2()    @method void setOpenCrSev2(int $v)
 * @method int     getOpenDeSev1()    @method void setOpenDeSev1(int $v)
 * @method int     getOpenDeSev2()    @method void setOpenDeSev2(int $v)
 * @method int     getOpenTotal()     @method void setOpenTotal(int $v)
 * @method int     getBypassActive()  @method void setBypassActive(int $v)
 * @method ?string getCalculatedAt()  @method void setCalculatedAt(?string $v)
 */
class AssetReadiness extends Entity implements \JsonSerializable {
    protected int     $assetId       = 0;
    protected string  $readinessCode = 'FULL-OP';
    protected string  $narrative     = '';
    protected int     $openCrSev1    = 0;
    protected int     $openCrSev2    = 0;
    protected int     $openDeSev1    = 0;
    protected int     $openDeSev2    = 0;
    protected int     $openTotal     = 0;
    protected int     $bypassActive  = 0;
    protected ?string $calculatedAt  = null;

    public function jsonSerialize(): array {
        return [
            'id'             => $this->getId(),
            'asset_id'       => $this->assetId,
            'readiness_code' => $this->readinessCode,
            'narrative'      => $this->narrative,
            'open_cr_sev1'   => $this->openCrSev1,
            'open_cr_sev2'   => $this->openCrSev2,
            'open_de_sev1'   => $this->openDeSev1,
            'open_de_sev2'   => $this->openDeSev2,
            'open_total'     => $this->openTotal,
            'bypass_active'  => (bool)$this->bypassActive,
            'calculated_at'  => $this->calculatedAt,
        ];
    }
}
