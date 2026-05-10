<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version1060Date20260510000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_work_packages ──────────────────────────────────────
        if (!$schema->hasTable('ops_work_packages')) {
            $t = $schema->createTable('ops_work_packages');
            $t->addColumn('id',           Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('title',        Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('description',  Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('platform_id',  Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('status',       Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'draft']);
            $t->addColumn('package_type', Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'mixed']);
            $t->addColumn('assigned_to',  Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approver',     Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('rfq_number',   Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('rfq_due_date', Types::DATE,     ['notnull' => false]);
            $t->addColumn('notes',        Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',   Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',   Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',   Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['status'],      'opss_wp_status_idx');
            $t->addIndex(['platform_id'], 'opss_wp_platform_idx');
        }

        // ── ops_work_package_items ─────────────────────────────────
        if (!$schema->hasTable('ops_wp_items')) {
            $t = $schema->createTable('ops_wp_items');
            $t->addColumn('id',         Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('package_id', Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('item_type',  Types::STRING,   ['notnull' => true, 'length' => 32]);
            $t->addColumn('item_id',    Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('notes',      Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by', Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at', Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['package_id'], 'opss_wpi_pkg_idx');
            $t->addIndex(['item_type', 'item_id'], 'opss_wpi_item_idx');
        }

        return $schema;
    }
}
