<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Creates the four Ops Suite tables.
 * Table names are WITHOUT the oc_ prefix — Nextcloud adds that automatically.
 * Index names are globally unique to avoid collisions with any previous installs.
 * Safe to re-run: checks hasTable() and hasIndex() before creating anything.
 */
class Version1000Date20260101000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_assets ──────────────────────────────────────────────
        // Final table name in DB: oc_ops_assets
        if (!$schema->hasTable('ops_assets')) {
            $t = $schema->createTable('ops_assets');
            $t->addColumn('id',              Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',            Types::STRING,   ['notnull' => true,  'length' => 255]);
            $t->addColumn('asset_type',      Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => 'hardware']);
            $t->addColumn('manufacturer',    Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('model',           Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('serial_number',   Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('version',         Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('location',        Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('ip_address',      Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('install_date',    Types::DATE,     ['notnull' => false]);
            $t->addColumn('warranty_expiry', Types::DATE,     ['notnull' => false]);
            $t->addColumn('status',          Types::STRING,   ['notnull' => true,  'length' => 64,  'default' => 'operational']);
            $t->addColumn('notes',           Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('tags',            Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('linked_assets',   Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',      Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_at',      Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',      Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['asset_type'], 'opss_a_type_idx');
            $t->addIndex(['status'],     'opss_a_status_idx');
        } else {
            $t = $schema->getTable('ops_assets');
            if (!$t->hasIndex('opss_a_type_idx'))   $t->addIndex(['asset_type'], 'opss_a_type_idx');
            if (!$t->hasIndex('opss_a_status_idx')) $t->addIndex(['status'],     'opss_a_status_idx');
        }

        // ── ops_procedures ──────────────────────────────────────────
        // Final table name in DB: oc_ops_procedures
        if (!$schema->hasTable('ops_procedures')) {
            $t = $schema->createTable('ops_procedures');
            $t->addColumn('id',                        Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',                      Types::STRING,   ['notnull' => true,  'length' => 255]);
            $t->addColumn('asset_id',                  Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('category',                  Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('periodicity',               Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => 'monthly']);
            $t->addColumn('last_completed',            Types::DATE,     ['notnull' => false]);
            $t->addColumn('next_due',                  Types::DATE,     ['notnull' => false]);
            $t->addColumn('assigned_to',               Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('document_ref',              Types::STRING,   ['notnull' => false, 'length' => 512, 'default' => '']);
            $t->addColumn('description',               Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('est_hours',                 Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('create_deficiency_on_fail', Types::SMALLINT, ['notnull' => false, 'default' => 0]);
            $t->addColumn('created_by',                Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_at',                Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',                Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['asset_id'],    'opss_p_asset_idx');
            $t->addIndex(['next_due'],    'opss_p_due_idx');
            $t->addIndex(['assigned_to'], 'opss_p_assign_idx');
        } else {
            $t = $schema->getTable('ops_procedures');
            if (!$t->hasIndex('opss_p_asset_idx'))  $t->addIndex(['asset_id'],    'opss_p_asset_idx');
            if (!$t->hasIndex('opss_p_due_idx'))    $t->addIndex(['next_due'],    'opss_p_due_idx');
            if (!$t->hasIndex('opss_p_assign_idx')) $t->addIndex(['assigned_to'], 'opss_p_assign_idx');
        }

        // ── ops_deficiencies ────────────────────────────────────────
        // Final table name in DB: oc_ops_deficiencies
        if (!$schema->hasTable('ops_deficiencies')) {
            $t = $schema->createTable('ops_deficiencies');
            $t->addColumn('id',                      Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('summary',                 Types::STRING,   ['notnull' => true,  'length' => 512]);
            $t->addColumn('description',             Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('asset_id',                Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('severity',                Types::STRING,   ['notnull' => true,  'length' => 16,  'default' => 'SEV-3']);
            $t->addColumn('status',                  Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => 'open']);
            $t->addColumn('discovery_method',        Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => 'walkdown']);
            $t->addColumn('assigned_to',             Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('reviewed_by',             Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('requirements_to_resolve', Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('outside_entity_required', Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('est_parts_cost',          Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('est_labor_cost',          Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('man_days_internal',       Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('man_days_external',       Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('scheduled_outage_hours',  Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('target_completion',       Types::DATE,     ['notnull' => false]);
            $t->addColumn('linked_procedure_id',     Types::INTEGER,  ['notnull' => false, 'default' => 0]);
            $t->addColumn('created_by',              Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_at',              Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',              Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['asset_id'],    'opss_d_asset_idx');
            $t->addIndex(['severity'],    'opss_d_sev_idx');
            $t->addIndex(['status'],      'opss_d_status_idx');
            $t->addIndex(['assigned_to'], 'opss_d_assign_idx');
        } else {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasIndex('opss_d_asset_idx'))  $t->addIndex(['asset_id'],    'opss_d_asset_idx');
            if (!$t->hasIndex('opss_d_sev_idx'))    $t->addIndex(['severity'],    'opss_d_sev_idx');
            if (!$t->hasIndex('opss_d_status_idx')) $t->addIndex(['status'],      'opss_d_status_idx');
            if (!$t->hasIndex('opss_d_assign_idx')) $t->addIndex(['assigned_to'], 'opss_d_assign_idx');
        }

        // ── ops_deficiency_history ──────────────────────────────────
        // Final table name in DB: oc_ops_deficiency_history
        if (!$schema->hasTable('ops_deficiency_history')) {
            $t = $schema->createTable('ops_deficiency_history');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('deficiency_id',  Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('entry_text',     Types::TEXT,     ['notnull' => true]);
            $t->addColumn('created_by',     Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',     Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['deficiency_id'], 'opss_dh_def_idx');
        } else {
            $t = $schema->getTable('ops_deficiency_history');
            if (!$t->hasIndex('opss_dh_def_idx')) $t->addIndex(['deficiency_id'], 'opss_dh_def_idx');
        }

        return $schema;
    }
}
