<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCA\OpsSuite\Db\Asset;
use OCA\OpsSuite\Db\AssetMapper;
use OCA\OpsSuite\Db\AssetReadiness;
use OCA\OpsSuite\Db\AssetReadinessMapper;
use OCA\OpsSuite\Db\DeficiencyMapper;
use OCP\AppFramework\Db\DoesNotExistException;

/**
 * Calculates and persists operational readiness per asset.
 *
 * Readiness codes (MBSE-006):
 *   FULL-OP    All systems operational, no open critical deficiencies
 *   DEG-OP-MIN Degraded but meets minimum operational threshold (bypass active)
 *   DEG-OP-BEL Degraded below minimum (DE asset with SEV-1/2, no bypass)
 *   DOWN-OP    Mission non-capable (CR asset with SEV-1 deficiency, no bypass)
 *   DOWN-MX    Down for scheduled maintenance
 *   DOWN-UNS   Down unscheduled
 */
class ReadinessService {

    public function __construct(
        private readonly AssetMapper          $assetMapper,
        private readonly AssetReadinessMapper $readinessMapper,
        private readonly DeficiencyMapper     $deficiencyMapper,
    ) {}

    /**
     * Recalculate and persist readiness for an asset.
     * Called after any deficiency open/close or bypass state change.
     */
    public function recalculate(int $assetId): AssetReadiness {
        try {
            $asset = $this->assetMapper->find($assetId);
        } catch (DoesNotExistException) {
            throw new \InvalidArgumentException("Asset {$assetId} not found");
        }

        $criticality = $asset->getCriticalityCode() ?? '';
        $bypass      = (bool)($asset->getBypassState() ?? 0);

        // Fetch open deficiencies for this asset
        $openDefs = $this->deficiencyMapper->findOpenByAsset($assetId);

        $crSev1 = $crSev2 = $deSev1 = $deSev2 = 0;
        foreach ($openDefs as $def) {
            $sev = $def->getSeverity();
            if ($criticality === 'CR') {
                if ($sev === 'SEV-1') $crSev1++;
                if ($sev === 'SEV-2') $crSev2++;
            }
            if ($criticality === 'DE') {
                if ($sev === 'SEV-1') $deSev1++;
                if ($sev === 'SEV-2') $deSev2++;
            }
        }
        $openTotal = count($openDefs);

        // ── Readiness determination ──────────────────────────────
        $code = match(true) {
            // CR asset with SEV-1 and no bypass → mission non-capable
            $criticality === 'CR' && $crSev1 > 0 && !$bypass => 'DOWN-OP',

            // CR asset with SEV-2 and no bypass → below minimum
            $criticality === 'CR' && $crSev2 > 0 && !$bypass => 'DEG-OP-BEL',

            // DE asset with SEV-1 and no bypass → below minimum
            $criticality === 'DE' && $deSev1 > 0 && !$bypass => 'DEG-OP-BEL',

            // Any critical deficiency but bypass is active → minimum capable
            ($crSev1 > 0 || $crSev2 > 0 || $deSev1 > 0 || $deSev2 > 0) && $bypass => 'DEG-OP-MIN',

            // DE asset with SEV-2 only → minimum degraded
            $criticality === 'DE' && $deSev2 > 0 => 'DEG-OP-MIN',

            // Any other open deficiencies → minor degradation still operational
            $openTotal > 0 => 'DEG-OP-MIN',

            // Clean
            default => 'FULL-OP',
        };

        $narrative = $this->buildNarrative($asset, $code, $openTotal, $bypass, $crSev1, $crSev2);

        // Upsert readiness record
        try {
            $r = $this->readinessMapper->findByAsset($assetId);
        } catch (DoesNotExistException) {
            $r = new AssetReadiness();
            $r->setAssetId($assetId);
        }

        $r->setReadinessCode($code);
        $r->setNarrative($narrative);
        $r->setOpenCrSev1($crSev1);
        $r->setOpenCrSev2($crSev2);
        $r->setOpenDeSev1($deSev1);
        $r->setOpenDeSev2($deSev2);
        $r->setOpenTotal($openTotal);
        $r->setBypassActive($bypass ? 1 : 0);
        $r->setCalculatedAt(date('Y-m-d H:i:s'));

        return $r->getId() ? $this->readinessMapper->update($r) : $this->readinessMapper->insert($r);
    }

    private function buildNarrative(
        Asset $asset, string $code, int $openTotal,
        bool $bypass, int $crSev1, int $crSev2
    ): string {
        $name        = $asset->getName();
        $criticality = $asset->getCriticalityCode() ?? 'unclassified';

        return match($code) {
            'FULL-OP'    => "{$name} is fully operational with no open deficiencies.",
            'DEG-OP-MIN' => $bypass
                ? "{$name} is operating at minimum capability with a bypass workaround in place. {$openTotal} open deficiency(s) pending resolution."
                : "{$name} has {$openTotal} open deficiency(s) causing minor degradation. Mission capability is maintained.",
            'DEG-OP-BEL' => "{$name} ({$criticality}) is degraded below minimum operational threshold. {$openTotal} open deficiency(s) require immediate attention.",
            'DOWN-OP'    => "{$name} is mission non-capable. {$crSev1} SEV-1 deficiency(s) on a mission-critical asset require immediate corrective action.",
            'DOWN-MX'    => "{$name} is down for scheduled maintenance.",
            'DOWN-UNS'   => "{$name} is down unscheduled.",
            default      => "{$name} readiness status: {$code}.",
        };
    }
}
