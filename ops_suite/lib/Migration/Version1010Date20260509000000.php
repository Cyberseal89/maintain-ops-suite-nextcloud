<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Adds closeout fields to ops_procedures:
 * actual_hours, actual_parts_cost, actual_labor_cost, completion_notes
 */
class Version1010Date20260509000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_procedures')) {
            $t = $schema->getTable('ops_procedures');
            if (!$t->hasColumn('actual_hours')) {
                $t->addColumn('actual_hours', Types::FLOAT, ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('actual_parts_cost')) {
                $t->addColumn('actual_parts_cost', Types::FLOAT, ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('actual_labor_cost')) {
                $t->addColumn('actual_labor_cost', Types::FLOAT, ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('completion_notes')) {
                $t->addColumn('completion_notes', Types::TEXT, ['notnull' => false, 'default' => '']);
            }
        }

        return $schema;
    }
}
