<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2220Date20260620000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_altofleet_nodes')) {
            $t = $schema->createTable('ops_altofleet_nodes');
            $t->addColumn('id',                'integer', ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('local_uuid',        'string',  ['notnull' => true,  'length' => 36,  'default' => '']);
            $t->addColumn('asset_id',          'integer', ['notnull' => false, 'default' => null]);
            $t->addColumn('platform_id',       'integer', ['notnull' => false, 'default' => null]);
            $t->addColumn('shop_id',           'integer', ['notnull' => false, 'default' => null]);
            $t->addColumn('hostname',          'string',  ['notnull' => true,  'length' => 255, 'default' => '']);
            $t->addColumn('ip_address',        'string',  ['notnull' => true,  'length' => 45,  'default' => '']);
            $t->addColumn('mac_address',       'string',  ['notnull' => true,  'length' => 17,  'default' => '']);
            $t->addColumn('agent_version',     'string',  ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->addColumn('os_name',           'string',  ['notnull' => true,  'length' => 128, 'default' => '']);
            $t->addColumn('os_version',        'string',  ['notnull' => true,  'length' => 128, 'default' => '']);
            $t->addColumn('os_pretty_name',    'string',  ['notnull' => true,  'length' => 255, 'default' => '']);
            $t->addColumn('architecture',      'string',  ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->addColumn('cpu_count',         'integer', ['notnull' => true,  'default' => 0]);
            $t->addColumn('memory_mb',         'integer', ['notnull' => true,  'default' => 0]);
            $t->addColumn('disk_gb',           'integer', ['notnull' => true,  'default' => 0]);
            $t->addColumn('disk_free_gb',      'integer', ['notnull' => true,  'default' => 0]);
            $t->addColumn('cpu_pct',           'decimal', ['notnull' => true,  'default' => 0, 'precision' => 5, 'scale' => 2]);
            $t->addColumn('memory_pct',        'decimal', ['notnull' => true,  'default' => 0, 'precision' => 5, 'scale' => 2]);
            $t->addColumn('disk_pct',          'decimal', ['notnull' => true,  'default' => 0, 'precision' => 5, 'scale' => 2]);
            $t->addColumn('uptime_secs',       'bigint',  ['notnull' => true,  'default' => 0]);
            $t->addColumn('services',          'text',    ['notnull' => true,  'default' => '{}']);
            $t->addColumn('threshold_alerts',  'text',    ['notnull' => true,  'default' => '[]']);
            $t->addColumn('status',            'string',  ['notnull' => true,  'length' => 20,  'default' => 'new']);
            $t->addColumn('last_seen',         'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('last_full_checkin', 'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('registered_by',     'string',  ['notnull' => true,  'length' => 128, 'default' => '']);
            $t->addColumn('registered_at',     'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('created_at',        'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->addColumn('updated_at',        'string',  ['notnull' => true,  'length' => 24,  'default' => '']);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['local_uuid'], 'ops_altofleet_uuid_idx');
            $t->addIndex(['status'],           'ops_altofleet_status_idx');
            $t->addIndex(['platform_id'],      'ops_altofleet_platform_idx');
        }

        return $schema;
    }
}
