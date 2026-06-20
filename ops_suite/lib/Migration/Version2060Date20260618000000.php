<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2060Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_canvases ──────────────────────────────────────────────
        if (!$schema->hasTable('ops_canvases')) {
            $t = $schema->createTable('ops_canvases');
            $t->addColumn('id',              Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',            Types::STRING,   ['length' => 255, 'notnull' => true]);
            $t->addColumn('canvas_type',     Types::STRING,   ['length' => 16,  'notnull' => true, 'default' => 'custom']);
            $t->addColumn('platform_id',     Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('shop_id',         Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('system_asset_id', Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('canvas_data',     Types::TEXT,     ['notnull' => false]);
            $t->addColumn('version',         Types::STRING,   ['length' => 16,  'default' => 'A']);
            $t->addColumn('is_live',         Types::BOOLEAN,  ['notnull' => true, 'default' => false]);
            $t->addColumn('last_synced_at',  Types::DATETIME, ['notnull' => false]);
            $t->addColumn('created_by',      Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('created_at',      Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',      Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['platform_id'],     'ops_canvases_platform_idx');
            $t->addIndex(['shop_id'],         'ops_canvases_shop_idx');
            $t->addIndex(['system_asset_id'], 'ops_canvases_asset_idx');
        }

        // ── ops_component_library ─────────────────────────────────────
        if (!$schema->hasTable('ops_component_library')) {
            $t = $schema->createTable('ops_component_library');
            $t->addColumn('id',                  Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',                Types::STRING,  ['length' => 128, 'notnull' => true]);
            $t->addColumn('category',            Types::STRING,  ['length' => 32,  'default' => 'custom']);
            $t->addColumn('manufacturer',        Types::STRING,  ['length' => 128, 'notnull' => false]);
            $t->addColumn('model_number',        Types::STRING,  ['length' => 128, 'notnull' => false]);
            $t->addColumn('asset_type',          Types::STRING,  ['length' => 8,   'default' => 'hardware']);
            $t->addColumn('default_criticality', Types::STRING,  ['length' => 4,   'notnull' => false]);
            $t->addColumn('nsn',                 Types::STRING,  ['length' => 16,  'notnull' => false]);
            $t->addColumn('cage_code',           Types::STRING,  ['length' => 5,   'notnull' => false]);
            $t->addColumn('interface_templates', Types::TEXT,    ['notnull' => false]);
            $t->addColumn('pm_templates',        Types::TEXT,    ['notnull' => false]);
            $t->addColumn('specs',               Types::TEXT,    ['notnull' => false]);
            $t->addColumn('icon_svg',            Types::TEXT,    ['notnull' => false]);
            $t->addColumn('created_at',          Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',          Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['category'], 'ops_complib_category_idx');
        }

        return $schema;
    }
}
