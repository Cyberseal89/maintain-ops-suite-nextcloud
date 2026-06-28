<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2260Date20260621000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_software_requests')) {
            $t = $schema->getTable('ops_software_requests');

            // Allow catalog_id to be NULL for ad-hoc / custom requests
            if ($t->hasColumn('catalog_id')) {
                $t->changeColumn('catalog_id', ['notnull' => false, 'default' => null]);
            }

            // Custom request description for unlisted software
            if (!$t->hasColumn('custom_description')) {
                $t->addColumn('custom_description', 'text', ['notnull' => false, 'default' => null]);
            }
        }

        return $schema;
    }
}
