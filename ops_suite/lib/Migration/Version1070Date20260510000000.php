<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version1070Date20260510000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_supply_requests ────────────────────────────────────
        if (!$schema->hasTable('ops_supply_requests')) {
            $t = $schema->createTable('ops_supply_requests');
            $t->addColumn('id',            Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('title',         Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('platform_id',   Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('source_type',   Types::STRING,   ['notnull' => false, 'length' => 32, 'default' => 'manual']);
            $t->addColumn('source_id',     Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('status',        Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'draft']);
            $t->addColumn('priority',      Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'routine']);
            $t->addColumn('rfq_number',    Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('needed_by',     Types::DATE,     ['notnull' => false]);
            $t->addColumn('requested_by',  Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approved_by',   Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approved_at',   Types::DATETIME, ['notnull' => false]);
            $t->addColumn('notes',         Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',    Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',    Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',    Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['status'],      'opss_sr_status_idx');
            $t->addIndex(['platform_id'], 'opss_sr_platform_idx');
            $t->addIndex(['source_type', 'source_id'], 'opss_sr_source_idx');
        }

        // ── ops_supply_request_items ───────────────────────────────
        if (!$schema->hasTable('ops_supply_req_items')) {
            $t = $schema->createTable('ops_supply_req_items');
            $t->addColumn('id',                 Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('request_id',         Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('item_name',          Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('part_number',        Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => '']);
            $t->addColumn('description',        Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('quantity_requested', Types::FLOAT,    ['notnull' => true, 'default' => 1]);
            $t->addColumn('quantity_received',  Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('unit_cost_est',      Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('unit_cost_actual',   Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('vendor',             Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => '']);
            $t->addColumn('status',             Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'pending']);
            $t->addColumn('notes',              Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_at',         Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['request_id'], 'opss_sri_req_idx');
        }

        // ── ops_inventory ──────────────────────────────────────────
        if (!$schema->hasTable('ops_inventory')) {
            $t = $schema->createTable('ops_inventory');
            $t->addColumn('id',               Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('platform_id',      Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('item_name',        Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('part_number',      Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => '']);
            $t->addColumn('description',      Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('category',         Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'other']);
            $t->addColumn('quantity_on_hand', Types::FLOAT,    ['notnull' => true, 'default' => 0]);
            $t->addColumn('quantity_reserved',Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('reorder_point',    Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('unit_cost',        Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            $t->addColumn('location',         Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => '']);
            $t->addColumn('vendor',           Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => '']);
            $t->addColumn('lead_time_days',   Types::INTEGER,  ['notnull' => false, 'default' => 0]);
            $t->addColumn('created_by',       Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',       Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',       Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['platform_id'], 'opss_inv_platform_idx');
            $t->addIndex(['category'],    'opss_inv_cat_idx');
        }

        // ── ops_inventory_transactions ─────────────────────────────
        if (!$schema->hasTable('ops_inv_transactions')) {
            $t = $schema->createTable('ops_inv_transactions');
            $t->addColumn('id',               Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('inventory_id',     Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('transaction_type', Types::STRING,   ['notnull' => true, 'length' => 32]);
            $t->addColumn('quantity',         Types::FLOAT,    ['notnull' => true, 'default' => 0]);
            $t->addColumn('reference_type',   Types::STRING,   ['notnull' => false, 'length' => 32, 'default' => '']);
            $t->addColumn('reference_id',     Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('notes',            Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',       Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',       Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['inventory_id'],     'opss_invt_inv_idx');
            $t->addIndex(['transaction_type'], 'opss_invt_type_idx');
        }

        return $schema;
    }
}
