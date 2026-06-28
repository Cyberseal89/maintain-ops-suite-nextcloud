<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCA\OpsSuite\Db\DocumentMapper;
use OCP\IDBConnection;

/**
 * Generates and validates S1000D Data Module Codes (DMC).
 *
 * DMC structure used in MOS:
 *   DMC-[ModelCode]-[SysDiffCode]-[SNS]-[DisassyCode]-[InfoCode][Variant]-[ItemLoc]
 *
 * Example:
 *   DMC-ALTO-A-HW-C1-001-00-200A-A
 *
 * Field mapping:
 *   ModelCode    — platform short name (default: ALTO)
 *   SysDiffCode  — always 'A' (standard configuration)
 *   SNS          — asset_id_label from ops_assets (e.g., HW-C1-001)
 *   DisassyCode  — always '00' (assembly level, not disassembled)
 *   InfoCode     — S1000D information code (040, 200, 300, 520, 900...)
 *   Variant      — info_code_variant (A, B, C...) differentiates multiple DMs of same type on same asset
 *   ItemLoc      — always 'A'
 */
class DmcService {

    // S1000D Information Codes supported in MOS
    public const INFO_CODES = [
        '040' => 'Description and Operation',
        '200' => 'Maintenance Procedure — Organizational',
        '300' => 'Illustrated Parts Data',
        '520' => 'Troubleshooting',
        '720' => 'Removal Procedure',
        '730' => 'Installation Procedure',
        '900' => 'Fault Isolation',
    ];

    // Maps MOS document category to the most appropriate S1000D info code
    public const CATEGORY_TO_INFO_CODE = [
        'tech_manual'    => '040',
        'sop'            => '200',
        'test_plan'      => '520',
        'drawing'        => '040',
        'spec'           => '040',
        'training'       => '040',
        'mil_std_drawing'=> '040',
        'fmea'           => '900',
        'other'          => '040',
    ];

    public function __construct(private IDBConnection $db) {}

    /**
     * Generate a DMC for a Data Module given its asset and info code.
     * If a DMC already exists for this combination, auto-increments the variant (A→B→C...).
     */
    public function generate(int $assetId, string $infoCode, string $variant = 'A', string $modelCode = 'ALTO'): string {
        $sns = $this->getAssetSns($assetId);
        $candidate = $this->buildDmc($modelCode, $sns, $infoCode, $variant);

        // Ensure uniqueness — increment variant if already taken
        $usedVariants = $this->getUsedVariants($assetId, $infoCode);
        while (in_array($variant, $usedVariants, true) && $variant !== 'Z') {
            $variant = $this->nextVariant($variant);
            $candidate = $this->buildDmc($modelCode, $sns, $infoCode, $variant);
        }

        return $candidate;
    }

    /**
     * Parse a DMC string back into its components.
     * Returns null if the string doesn't match expected format.
     */
    public function parse(string $dmc): ?array {
        // DMC-ALTO-A-HW-C1-001-00-200A-A
        if (!str_starts_with($dmc, 'DMC-')) return null;
        $parts = explode('-', substr($dmc, 4));
        if (count($parts) < 6) return null;

        $itemLoc   = array_pop($parts);
        $infoBlock = array_pop($parts);  // e.g., '200A'
        $dissCode  = array_pop($parts);  // '00'
        $modelCode = array_shift($parts);
        $sysDiff   = array_shift($parts);
        $sns       = implode('-', $parts);

        $infoCode = substr($infoBlock, 0, 3);
        $variant  = substr($infoBlock, 3) ?: 'A';

        return [
            'model_code'  => $modelCode,
            'sys_diff'    => $sysDiff,
            'sns'         => $sns,
            'diss_code'   => $dissCode,
            'info_code'   => $infoCode,
            'variant'     => $variant,
            'item_loc'    => $itemLoc,
        ];
    }

    public function infoCodeLabel(string $infoCode): string {
        return self::INFO_CODES[$infoCode] ?? $infoCode;
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private function buildDmc(string $modelCode, string $sns, string $infoCode, string $variant): string {
        $modelCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', $modelCode) ?: 'ALTO');
        return sprintf('DMC-%s-A-%s-00-%s%s-A', $modelCode, strtoupper($sns), $infoCode, $variant);
    }

    private function getAssetSns(int $assetId): string {
        $qb = $this->db->getQueryBuilder();
        $qb->select('asset_id_label')->from('ops_assets')
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($assetId)));
        $row = $qb->executeQuery()->fetchAssociative();
        if (!$row || empty($row['asset_id_label'])) {
            return sprintf('ASSET-%04d', $assetId);
        }
        // Sanitize: uppercase, keep only alphanumeric and hyphens
        return strtoupper(preg_replace('/[^A-Z0-9\-]/', '', strtoupper($row['asset_id_label'])));
    }

    private function getUsedVariants(int $assetId, string $infoCode): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('info_code_variant')->from('ops_documents')
           ->where($qb->expr()->eq('asset_id',   $qb->createNamedParameter($assetId)))
           ->andWhere($qb->expr()->eq('info_code', $qb->createNamedParameter($infoCode)))
           ->andWhere($qb->expr()->eq('doc_type',  $qb->createNamedParameter('data_module')));
        return array_column($qb->executeQuery()->fetchAllAssociative(), 'info_code_variant');
    }

    private function nextVariant(string $v): string {
        return chr(ord($v) + 1);
    }
}
