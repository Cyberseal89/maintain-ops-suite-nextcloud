<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2230Date20260620000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_software_catalog')) {
            $t = $schema->createTable('ops_software_catalog');
            $t->addColumn('id',           'integer', ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('name',         'string',  ['notnull' => true,  'length' => 255, 'default' => '']);
            $t->addColumn('package_name', 'string',  ['notnull' => true,  'length' => 255, 'default' => '']);
            $t->addColumn('description',  'text',    ['notnull' => true,  'default' => '']);
            $t->addColumn('category',     'string',  ['notnull' => true,  'length' => 64,  'default' => 'General']);
            $t->addColumn('tier',         'integer', ['notnull' => true,  'default' => 1]);
            $t->addColumn('icon',         'string',  ['notnull' => true,  'length' => 64,  'default' => '📦']);
            $t->addColumn('auto_approve', 'boolean', ['notnull' => true,  'default' => false]);
            $t->addColumn('enabled',      'boolean', ['notnull' => true,  'default' => true]);
            $t->addColumn('created_at',   'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('updated_at',   'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['tier'],     'ops_sw_catalog_tier_idx');
            $t->addIndex(['category'], 'ops_sw_catalog_cat_idx');
            $t->addIndex(['enabled'],  'ops_sw_catalog_enabled_idx');
        }

        if (!$schema->hasTable('ops_software_requests')) {
            $t = $schema->createTable('ops_software_requests');
            $t->addColumn('id',            'integer', ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('node_id',       'integer', ['notnull' => true]);
            $t->addColumn('catalog_id',    'integer', ['notnull' => true]);
            $t->addColumn('requested_by',  'string',  ['notnull' => true,  'length' => 128, 'default' => '']);
            $t->addColumn('status',        'string',  ['notnull' => true,  'length' => 32,  'default' => 'pending']);
            $t->addColumn('deficiency_id', 'integer', ['notnull' => false, 'default' => null]);
            $t->addColumn('approved_by',   'string',  ['notnull' => true,  'length' => 128, 'default' => '']);
            $t->addColumn('approved_at',   'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('installed_at',  'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('notes',         'text',    ['notnull' => true,  'default' => '']);
            $t->addColumn('created_at',    'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('updated_at',    'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['node_id'],    'ops_sw_req_node_idx');
            $t->addIndex(['catalog_id'], 'ops_sw_req_catalog_idx');
            $t->addIndex(['status'],     'ops_sw_req_status_idx');
        }

        return $schema;
    }
}
