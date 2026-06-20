<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Gap 3 — ops_energy_sources (structured LOTO energy source registry)
 * Gap 4 — ops_mmbp_lines (budget line items: TM, training, parts, labor, contractor, other)
 * Gap 2 — ops_shop_users (shop-scoped user assignments)
 */
class Version2150Date20260619000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_energy_sources ────────────────────────────────────────
        if (!$schema->hasTable('ops_energy_sources')) {
            $t = $schema->createTable('ops_energy_sources');
            $t->addColumn('id',                  Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',                Types::STRING,   ['length' => 255, 'notnull' => true]);
            // electrical|pneumatic|hydraulic|thermal|chemical|gravity|spring|radiation
            $t->addColumn('source_type',         Types::STRING,   ['length' => 30,  'default' => 'electrical']);
            $t->addColumn('asset_id',            Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('panel_name',          Types::STRING,   ['length' => 128, 'notnull' => false]);
            $t->addColumn('breaker_number',      Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('voltage_v',           Types::DECIMAL,  ['precision' => 10, 'scale' => 2, 'notnull' => false]);
            $t->addColumn('current_a',           Types::DECIMAL,  ['precision' => 10, 'scale' => 2, 'notnull' => false]);
            $t->addColumn('pressure_psi',        Types::DECIMAL,  ['precision' => 10, 'scale' => 2, 'notnull' => false]);
            $t->addColumn('location',            Types::STRING,   ['length' => 255, 'notnull' => false]);
            $t->addColumn('isolation_procedure', Types::TEXT,     ['notnull' => false]);
            $t->addColumn('notes',               Types::TEXT,     ['notnull' => false]);
            $t->addColumn('created_by',          Types::STRING,   ['length' => 64,  'default' => '']);
            $t->addColumn('created_at',          Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',          Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['asset_id'],    'ops_es_asset_idx');
            $t->addIndex(['source_type'], 'ops_es_type_idx');
        }

        // ── ops_mmbp_lines ────────────────────────────────────────────
        if (!$schema->hasTable('ops_mmbp_lines')) {
            $t = $schema->createTable('ops_mmbp_lines');
            $t->addColumn('id',                Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('budget_id',         Types::INTEGER, ['notnull' => true]);
            // TM|training|parts|labor|contractor|other
            $t->addColumn('line_type',         Types::STRING,  ['length' => 30, 'default' => 'other']);
            $t->addColumn('description',       Types::STRING,  ['length' => 255, 'default' => '']);
            $t->addColumn('authorized_amount', Types::DECIMAL, ['precision' => 14, 'scale' => 2, 'default' => '0.00']);
            $t->addColumn('obligated_amount',  Types::DECIMAL, ['precision' => 14, 'scale' => 2, 'default' => '0.00']);
            $t->addColumn('ufr_amount',        Types::DECIMAL, ['precision' => 14, 'scale' => 2, 'default' => '0.00']);
            $t->addColumn('notes',             Types::TEXT,    ['notnull' => false]);
            $t->addColumn('created_at',        Types::DATETIME,['notnull' => false]);
            $t->addColumn('updated_at',        Types::DATETIME,['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['budget_id'], 'ops_mmbpl_budget_idx');
        }

        // ── ops_shop_users ────────────────────────────────────────────
        if (!$schema->hasTable('ops_shop_users')) {
            $t = $schema->createTable('ops_shop_users');
            $t->addColumn('id',         Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('user_uid',   Types::STRING,  ['length' => 64, 'notnull' => true]);
            $t->addColumn('shop_id',    Types::INTEGER, ['notnull' => true]);
            $t->addColumn('created_at', Types::DATETIME,['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['user_uid', 'shop_id'], 'ops_su_uid_shop_uidx');
            $t->addIndex(['user_uid'], 'ops_su_uid_idx');
            $t->addIndex(['shop_id'],  'ops_su_shop_idx');
        }

        // ── Add energy_source_ids to loto_sessions if not present ─────
        if ($schema->hasTable('ops_loto_sessions')) {
            $t = $schema->getTable('ops_loto_sessions');
            if (!$t->hasColumn('energy_source_ids')) {
                $t->addColumn('energy_source_ids', Types::TEXT, ['notnull' => false]);
            }
        }

        return $schema;
    }
}
