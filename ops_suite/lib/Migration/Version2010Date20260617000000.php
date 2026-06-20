<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 0B — Criticality + Readiness
 *
 * Extend ops_assets:
 *   criticality_code      — CR | DE | RD | SP | AD
 *   bypass_state          — 0=normal, 1=bypassed
 *   redundancy_available  — 0=no, 1=yes
 *
 * New table ops_asset_readiness:
 *   Stores the current calculated readiness state per asset.
 *   Recalculated whenever a deficiency opens/closes or bypass changes.
 */
class Version2010Date20260617000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── Extend ops_assets ──────────────────────────────────────
        if ($schema->hasTable('ops_assets')) {
            $t = $schema->getTable('ops_assets');

            // CR=mission critical, DE=direct effect, RD=readiness degrader,
            // SP=support, AD=administrative
            if (!$t->hasColumn('criticality_code')) {
                $t->addColumn('criticality_code', Types::STRING, [
                    'notnull' => false, 'length' => 4, 'default' => null
                ]);
            }
            // Asset is operationally bypassed (workaround in place)
            if (!$t->hasColumn('bypass_state')) {
                $t->addColumn('bypass_state', Types::SMALLINT, [
                    'notnull' => true, 'default' => 0
                ]);
            }
            // Redundant path exists (affects readiness calc)
            if (!$t->hasColumn('redundancy_available')) {
                $t->addColumn('redundancy_available', Types::SMALLINT, [
                    'notnull' => true, 'default' => 0
                ]);
            }
            if (!$t->hasIndex('opss_a_crit_idx')) $t->addIndex(['criticality_code'], 'opss_a_crit_idx');
        }

        // ── ops_asset_readiness ────────────────────────────────────
        if (!$schema->hasTable('ops_asset_readiness')) {
            $t = $schema->createTable('ops_asset_readiness');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('asset_id',       Types::INTEGER,  ['notnull' => true]);

            // FULL-OP | DEG-OP-MIN | DEG-OP-BEL | DOWN-OP | DOWN-MX | DOWN-UNS
            $t->addColumn('readiness_code', Types::STRING,   ['notnull' => true, 'length' => 16, 'default' => 'FULL-OP']);

            // Machine-generated plain English narrative (MBSE-006)
            $t->addColumn('narrative',      Types::TEXT,     ['notnull' => false, 'default' => '']);

            // Counts driving the calculation
            $t->addColumn('open_cr_sev1',   Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('open_cr_sev2',   Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('open_de_sev1',   Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('open_de_sev2',   Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('open_total',     Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('bypass_active',  Types::SMALLINT, ['notnull' => true, 'default' => 0]);

            $t->addColumn('calculated_at',  Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['asset_id'], 'opss_ar_asset_uq');
            $t->addIndex(['readiness_code'], 'opss_ar_code_idx');
        }

        return $schema;
    }
}
