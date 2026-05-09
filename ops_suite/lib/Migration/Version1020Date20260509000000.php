<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Adds deficiency closeout fields:
 * actual_parts_cost, actual_labor_cost, actual_man_days,
 * root_cause, corrective_action, closed_by, closed_at
 */
class Version1020Date20260509000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_deficiencies')) {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasColumn('actual_parts_cost')) {
                $t->addColumn('actual_parts_cost', Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('actual_labor_cost')) {
                $t->addColumn('actual_labor_cost', Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('actual_man_days')) {
                $t->addColumn('actual_man_days',   Types::FLOAT,    ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('root_cause')) {
                $t->addColumn('root_cause',        Types::TEXT,     ['notnull' => false, 'default' => '']);
            }
            if (!$t->hasColumn('corrective_action')) {
                $t->addColumn('corrective_action', Types::TEXT,     ['notnull' => false, 'default' => '']);
            }
            if (!$t->hasColumn('closed_by')) {
                $t->addColumn('closed_by',         Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => '']);
            }
            if (!$t->hasColumn('closed_at')) {
                $t->addColumn('closed_at',         Types::DATETIME, ['notnull' => false]);
            }
        }

        return $schema;
    }
}
