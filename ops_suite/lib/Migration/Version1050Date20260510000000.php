<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version1050Date20260510000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_avail_projects ─────────────────────────────────────
        if (!$schema->hasTable('ops_avail_projects')) {
            $t = $schema->createTable('ops_avail_projects');
            $t->addColumn('id',          Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('title',       Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('description', Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('platform_id', Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('status',      Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'planning']);
            $t->addColumn('start_date',  Types::DATE,     ['notnull' => false]);
            $t->addColumn('end_date',    Types::DATE,     ['notnull' => false]);
            $t->addColumn('assigned_to', Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('approver',    Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_by',  Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',  Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',  Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['status'],      'opss_ap_status_idx');
            $t->addIndex(['platform_id'], 'opss_ap_platform_idx');
        }

        // ── ops_project_items ──────────────────────────────────────
        if (!$schema->hasTable('ops_project_items')) {
            $t = $schema->createTable('ops_project_items');
            $t->addColumn('id',            Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('project_id',    Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('item_type',     Types::STRING,   ['notnull' => true, 'length' => 32]);
            $t->addColumn('item_id',       Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('title',         Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('planned_start', Types::DATE,     ['notnull' => false]);
            $t->addColumn('planned_end',   Types::DATE,     ['notnull' => false]);
            $t->addColumn('actual_start',  Types::DATE,     ['notnull' => false]);
            $t->addColumn('actual_end',    Types::DATE,     ['notnull' => false]);
            $t->addColumn('sequence',      Types::INTEGER,  ['notnull' => false, 'default' => 0]);
            $t->addColumn('depends_on',    Types::TEXT,     ['notnull' => false, 'default' => '[]']);
            $t->addColumn('status',        Types::STRING,   ['notnull' => true, 'length' => 32, 'default' => 'pending']);
            $t->addColumn('notes',         Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',    Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            $t->addColumn('created_at',    Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['project_id'],  'opss_pi_proj_idx');
            $t->addIndex(['item_type'],   'opss_pi_type_idx');
            $t->addIndex(['item_id'],     'opss_pi_item_idx');
        }

        return $schema;
    }
}
