<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2340Date20260623000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        // S1000D linkage columns:
        // ops_deficiencies.document_id → 520 (Fault Isolation Procedure) DM
        // ops_fmea_worksheets.document_id → 900 (Fault Description) DM
        // ops_assets.asset_type extended to include 'software' for system-level documentation anchors

        if ($schema->hasTable('ops_deficiencies')) {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasColumn('document_id')) {
                $t->addColumn('document_id', Types::BIGINT, [
                    'notnull' => false,
                    'unsigned' => true,
                    'default' => null,
                ]);
            }
        }

        if ($schema->hasTable('ops_fmea_worksheets')) {
            $t = $schema->getTable('ops_fmea_worksheets');
            if (!$t->hasColumn('document_id')) {
                $t->addColumn('document_id', Types::BIGINT, [
                    'notnull' => false,
                    'unsigned' => true,
                    'default' => null,
                ]);
            }
        }

        return $schema;
    }
}
