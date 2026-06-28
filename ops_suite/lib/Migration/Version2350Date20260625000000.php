<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2350Date20260625000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        // ── ops_report_dashboards ─────────────────────────────────────────
        if (!$schema->hasTable('ops_report_dashboards')) {
            $t = $schema->createTable('ops_report_dashboards');
            $t->addColumn('id', Types::BIGINT, ['autoincrement' => true, 'notnull' => true, 'unsigned' => true]);
            $t->addColumn('title', Types::STRING, ['length' => 255, 'notnull' => true]);
            $t->addColumn('description', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->addColumn('created_by', Types::STRING, ['length' => 64, 'notnull' => true]);
            $t->addColumn('visibility', Types::STRING, ['length' => 16, 'notnull' => true, 'default' => 'personal']);
            $t->addColumn('created_at', Types::DATETIME, ['notnull' => false, 'default' => null]);
            $t->addColumn('updated_at', Types::DATETIME, ['notnull' => false, 'default' => null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['created_by'], 'ops_rptdash_owner_idx');
            $t->addIndex(['visibility'], 'ops_rptdash_vis_idx');
        }

        // ── ops_report_widgets ────────────────────────────────────────────
        if (!$schema->hasTable('ops_report_widgets')) {
            $t = $schema->createTable('ops_report_widgets');
            $t->addColumn('id', Types::BIGINT, ['autoincrement' => true, 'notnull' => true, 'unsigned' => true]);
            $t->addColumn('dashboard_id', Types::BIGINT, ['notnull' => true, 'unsigned' => true]);
            $t->addColumn('title', Types::STRING, ['length' => 255, 'notnull' => true]);
            $t->addColumn('metric', Types::STRING, ['length' => 64, 'notnull' => true]);
            $t->addColumn('chart_type', Types::STRING, ['length' => 32, 'notnull' => true, 'default' => 'bar']);
            $t->addColumn('time_range', Types::STRING, ['length' => 8, 'notnull' => true, 'default' => '30d']);
            $t->addColumn('group_by', Types::STRING, ['length' => 32, 'notnull' => false, 'default' => null]);
            $t->addColumn('filters', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->addColumn('pos_x', Types::INTEGER, ['notnull' => true, 'default' => 0]);
            $t->addColumn('pos_y', Types::INTEGER, ['notnull' => true, 'default' => 0]);
            $t->addColumn('width', Types::INTEGER, ['notnull' => true, 'default' => 2]);
            $t->addColumn('height', Types::INTEGER, ['notnull' => true, 'default' => 2]);
            $t->addColumn('created_at', Types::DATETIME, ['notnull' => false, 'default' => null]);
            $t->addColumn('updated_at', Types::DATETIME, ['notnull' => false, 'default' => null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['dashboard_id'], 'ops_rptwdg_dash_idx');
            $t->addIndex(['metric'], 'ops_rptwdg_metric_idx');
        }

        return $schema;
    }
}
