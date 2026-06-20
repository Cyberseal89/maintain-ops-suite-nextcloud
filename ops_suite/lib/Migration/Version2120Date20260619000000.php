<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Doctrine\DBAL\Types\Types;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 2B — MB0001 / HSC Import
 * Adds hsc_code column to ops_assets for 3M/ESWBS system coding.
 */
class Version2120Date20260619000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_assets')) {
            $t = $schema->getTable('ops_assets');
            if (!$t->hasColumn('hsc_code')) {
                $t->addColumn('hsc_code', Types::STRING, [
                    'notnull' => false,
                    'length'  => 20,
                    'default' => null,
                ]);
            }
        }

        return $schema;
    }
}
