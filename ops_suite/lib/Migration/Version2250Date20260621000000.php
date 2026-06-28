<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2250Date20260621000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_altofleet_nodes')) {
            return $schema;
        }

        $t = $schema->getTable('ops_altofleet_nodes');

        if (!$t->hasColumn('force_scan')) {
            $t->addColumn('force_scan', 'boolean', ['notnull' => true, 'default' => false]);
        }
        if (!$t->hasColumn('pending_update')) {
            $t->addColumn('pending_update', 'boolean', ['notnull' => true, 'default' => false]);
        }

        return $schema;
    }
}
