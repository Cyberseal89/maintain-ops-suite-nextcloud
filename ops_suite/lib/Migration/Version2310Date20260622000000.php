<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2310Date20260622000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_procedures')) {
            $t = $schema->getTable('ops_procedures');

            // FK to a 200-series Data Module in ops_documents — replaces raw document_ref file path
            // Nullable: existing PMs keep document_ref until migrated to a DM
            if (!$t->hasColumn('document_id')) {
                $t->addColumn('document_id', Types::BIGINT, ['notnull' => false, 'unsigned' => true, 'default' => null]);
            }
            // Set true when the linked DM advances to a new issue — shows review banner on PM detail
            if (!$t->hasColumn('dmc_review_flag')) {
                $t->addColumn('dmc_review_flag', Types::BOOLEAN, ['notnull' => true, 'default' => false]);
            }
        }

        return $schema;
    }
}
