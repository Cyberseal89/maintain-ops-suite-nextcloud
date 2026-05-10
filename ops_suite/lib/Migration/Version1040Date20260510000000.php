<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Adds modernization tables and links deficiencies to modernizations
 */
class Version1040Date20260510000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_modernizations ─────────────────────────────────────
        if (!$schema->hasTable('ops_modernizations')) {
            $t = $schema->createTable('ops_modernizations');
            $t->addColumn('id',                   Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('title',                Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('description',          Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('platform_id',          Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('status',               Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'design']);
            $t->addColumn('asset_ids',            Types::TEXT,     ['notnull' => false, 'default' => '[]']);
            $t->addColumn('start_date',           Types::DATE,     ['notnull' => false]);
            $t->addColumn('target_completion',    Types::DATE,     ['notnull' => false]);
            $t->addColumn('assigned_to',          Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approver',             Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approved_by',          Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approved_at',          Types::DATETIME, ['notnull' => false]);
            $t->addColumn('est_parts_cost',       Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('est_labor_cost',       Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('est_contractor_cost',  Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('actual_parts_cost',    Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('actual_labor_cost',    Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('actual_contractor_cost',Types::FLOAT,   ['notnull' => false, 'default' => 0]);
            $t->addColumn('completion_notes',     Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',           Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',           Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',           Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['status'],      'opss_m_status_idx');
            $t->addIndex(['platform_id'], 'opss_m_platform_idx');
            $t->addIndex(['assigned_to'], 'opss_m_assign_idx');
        }

        // ── ops_modernization_docs ─────────────────────────────────
        if (!$schema->hasTable('ops_modernization_docs')) {
            $t = $schema->createTable('ops_modernization_docs');
            $t->addColumn('id',                Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('modernization_id',  Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('doc_type',          Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'other']);
            $t->addColumn('title',             Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('file_ref',          Types::STRING,   ['notnull' => false, 'length' => 512, 'default' => '']);
            $t->addColumn('status',            Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'pending']);
            $t->addColumn('notes',             Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',        Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',        Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['modernization_id'], 'opss_md_mod_idx');
            $t->addIndex(['doc_type'],         'opss_md_type_idx');
        }

        // ── ops_modernization_procedures ───────────────────────────
        if (!$schema->hasTable('ops_modernization_procedures')) {
            $t = $schema->createTable('ops_modernization_procedures');
            $t->addColumn('id',                Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('modernization_id',  Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('procedure_id',      Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('notes',             Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',        Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',        Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['modernization_id'], 'opss_mp_mod_idx');
            $t->addIndex(['procedure_id'],     'opss_mp_proc_idx');
        }

        // ── Add modernization fields to deficiencies ───────────────
        if ($schema->hasTable('ops_deficiencies')) {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasColumn('modernization_id')) {
                $t->addColumn('modernization_id',          Types::INTEGER, ['notnull' => false, 'default' => null]);
            }
            if (!$t->hasColumn('deferred_from_modernization')) {
                $t->addColumn('deferred_from_modernization', Types::SMALLINT, ['notnull' => false, 'default' => 0]);
            }
        }

        return $schema;
    }
}
