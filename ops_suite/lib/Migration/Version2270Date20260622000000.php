<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2270Date20260622000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_altofleet_nodes')) {
            $t = $schema->getTable('ops_altofleet_nodes');
            if (!$t->hasColumn('trivy_db_ready')) {
                $t->addColumn('trivy_db_ready', 'boolean', ['notnull' => false, 'default' => null]);
            }
        }

        return $schema;
    }
}
