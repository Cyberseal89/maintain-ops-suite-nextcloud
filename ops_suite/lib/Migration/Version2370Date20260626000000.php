<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2370Date20260626000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();
        $table  = $schema->getTable('ops_procedures');

        // FK to a 520 Troubleshooting DM — used to auto-link deficiencies
        if (!$table->hasColumn('ts_document_id')) {
            $table->addColumn('ts_document_id', Types::INTEGER, [
                'notnull' => false,
                'default' => null,
            ]);
        }

        return $schema;
    }
}
