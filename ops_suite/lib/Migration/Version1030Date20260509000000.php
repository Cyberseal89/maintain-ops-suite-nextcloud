<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Adds ops_platforms table and platform_id to assets, procedures, deficiencies
 */
class Version1030Date20260509000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_platforms ─────────────────────────────────────────
        if (!$schema->hasTable('ops_platforms')) {
            $t = $schema->createTable('ops_platforms');
            $t->addColumn('id',           Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',         Types::STRING,   ['notnull' => true, 'length' => 255]);
            $t->addColumn('description',  Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('location',     Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => '']);
            $t->addColumn('group_name',   Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_by',   Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_at',   Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',   Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['group_name'], 'opss_pl_group_idx');
        }

        // Add platform_id to existing tables
        foreach (['ops_assets', 'ops_procedures', 'ops_deficiencies'] as $table) {
            if ($schema->hasTable($table)) {
                $t = $schema->getTable($table);
                if (!$t->hasColumn('platform_id')) {
                    $t->addColumn('platform_id', Types::INTEGER, ['notnull' => false, 'default' => null]);
                }
            }
        }

        return $schema;
    }
}
