<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2240Date20260620000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        // Add last_cve_scan to nodes table (nullable — no default issue on ALTER TABLE)
        if ($schema->hasTable('ops_altofleet_nodes')) {
            $t = $schema->getTable('ops_altofleet_nodes');
            if ($t->hasColumn('last_cve_scan')) {
                // First migration attempt may have committed NOT NULL — correct it
                $t->changeColumn('last_cve_scan', [
                    'type'    => \Doctrine\DBAL\Types\Type::getType('string'),
                    'length'  => 24,
                    'notnull' => false,
                    'default' => null,
                ]);
            } else {
                $t->addColumn('last_cve_scan', 'string', [
                    'notnull' => false,
                    'length'  => 24,
                    'default' => null,
                ]);
            }
        }

        if (!$schema->hasTable('ops_cve_scan_results')) {
            $t = $schema->createTable('ops_cve_scan_results');
            $t->addColumn('id',                'integer', ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('node_id',           'integer', ['notnull' => true,  'default' => 0]);
            $t->addColumn('cve_id',            'string',  ['notnull' => false, 'length' => 64,  'default' => null]);
            $t->addColumn('severity',          'string',  ['notnull' => true,  'length' => 16,  'default' => 'UNKNOWN']);
            $t->addColumn('package_name',      'string',  ['notnull' => false, 'length' => 128, 'default' => null]);
            $t->addColumn('installed_version', 'string',  ['notnull' => false, 'length' => 64,  'default' => null]);
            $t->addColumn('fixed_version',     'string',  ['notnull' => false, 'length' => 64,  'default' => null]);
            $t->addColumn('description',       'text',    ['notnull' => false, 'default' => null]);
            $t->addColumn('cvss_score',        'string',  ['notnull' => false, 'length' => 8,   'default' => null]);
            $t->addColumn('scanned_at',        'string',  ['notnull' => false, 'length' => 24,  'default' => null]);
            $t->addColumn('deficiency_id',     'integer', ['notnull' => false, 'default' => null]);
            $t->addColumn('resolved',          'boolean', ['notnull' => true,  'default' => false]);
            $t->addColumn('created_at',        'string',  ['notnull' => false, 'length' => 24,  'default' => null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['node_id'],  'ops_cve_node_idx');
            $t->addIndex(['severity'], 'ops_cve_sev_idx');
            $t->addIndex(['resolved'], 'ops_cve_resolved_idx');
        }

        return $schema;
    }
}
