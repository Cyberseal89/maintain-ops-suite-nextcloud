<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 0E — Config Change Schema
 *
 * New tables:
 *   ops_changes        — configuration change records with CCB workflow
 *   ops_change_assets  — assets affected by a change and the action taken on each
 */
class Version2040Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_changes ───────────────────────────────────────────
        if (!$schema->hasTable('ops_changes')) {
            $t = $schema->createTable('ops_changes');
            $t->addColumn('id',           Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);

            // CHG-C1-001 — shop-scoped change code
            $t->addColumn('change_code',  Types::STRING,   ['notnull' => true,  'length' => 32]);

            $t->addColumn('shop_id',      Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('platform_id',  Types::INTEGER,  ['notnull' => false, 'default' => null]);

            // upgrade | replacement | repair | modification | decommission | addition | reconfiguration
            $t->addColumn('change_type',  Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'modification']);

            $t->addColumn('title',        Types::STRING,   ['notnull' => true,  'length' => 255]);
            $t->addColumn('description',  Types::TEXT,     ['notnull' => false, 'default' => '']);

            $t->addColumn('initiator_uid',Types::STRING,   ['notnull' => true,  'length' => 64, 'default' => '']);

            // draft | impact_analysis | ccb_review | approved | execution | verification | complete | rejected | abandoned
            $t->addColumn('stage',        Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'draft']);

            // routine | urgent | emergency
            $t->addColumn('priority',     Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'routine']);

            $t->addColumn('estimated_cost', Types::DECIMAL, ['notnull' => false, 'default' => null, 'precision' => 12, 'scale' => 2]);
            $t->addColumn('actual_cost',    Types::DECIMAL, ['notnull' => false, 'default' => null, 'precision' => 12, 'scale' => 2]);

            // Optional source linkages
            $t->addColumn('linked_def_id',  Types::INTEGER, ['notnull' => false, 'default' => null]);
            $t->addColumn('linked_req_id',  Types::INTEGER, ['notnull' => false, 'default' => null]);

            // Impact analysis results (JSON string — populated Phase 2)
            $t->addColumn('impact_analysis_json', Types::TEXT, ['notnull' => false, 'default' => null]);

            $t->addColumn('training_delta',  Types::TEXT,   ['notnull' => false, 'default' => '']);

            $t->addColumn('approved_by',     Types::STRING, ['notnull' => false, 'length' => 64,  'default' => null]);
            $t->addColumn('approved_at',     Types::STRING, ['notnull' => false, 'length' => 32,  'default' => null]);
            $t->addColumn('completed_at',    Types::STRING, ['notnull' => false, 'length' => 32,  'default' => null]);

            $t->addColumn('created_by',      Types::STRING, ['notnull' => true,  'length' => 64, 'default' => '']);
            $t->addColumn('created_at',      Types::STRING, ['notnull' => true,  'length' => 32, 'default' => '']);
            $t->addColumn('updated_at',      Types::STRING, ['notnull' => true,  'length' => 32, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['change_code'], 'opss_chg_code_uq');
            $t->addIndex(['stage'],       'opss_chg_stage_idx');
            $t->addIndex(['platform_id'], 'opss_chg_plat_idx');
            $t->addIndex(['shop_id'],     'opss_chg_shop_idx');
            $t->addIndex(['change_type'], 'opss_chg_type_idx');
        }

        // ── ops_change_assets ─────────────────────────────────────
        if (!$schema->hasTable('ops_change_assets')) {
            $t = $schema->createTable('ops_change_assets');
            $t->addColumn('id',             Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('change_id',      Types::INTEGER, ['notnull' => true]);
            $t->addColumn('asset_id',       Types::INTEGER, ['notnull' => true]);

            // modify | add | remove | replace
            $t->addColumn('action',         Types::STRING,  ['notnull' => true, 'length' => 16, 'default' => 'modify']);

            // Config snapshot before/after (version label or free text)
            $t->addColumn('before_version', Types::STRING,  ['notnull' => false, 'length' => 64, 'default' => null]);
            $t->addColumn('after_version',  Types::STRING,  ['notnull' => false, 'length' => 64, 'default' => null]);

            $t->addColumn('notes',          Types::TEXT,    ['notnull' => false, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addIndex(['change_id'], 'opss_chga_chg_idx');
            $t->addIndex(['asset_id'],  'opss_chga_asset_idx');
        }

        return $schema;
    }
}
