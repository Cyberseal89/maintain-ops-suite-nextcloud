<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2360Date20260626000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();
        $table  = $schema->getTable('ops_procedures');

        // Trigger type: calendar (default) | meter | as_required
        if (!$table->hasColumn('trigger_type')) {
            $table->addColumn('trigger_type', Types::STRING, [
                'length'  => 20,
                'notnull' => true,
                'default' => 'calendar',
            ]);
        }

        // Meter-based fields
        if (!$table->hasColumn('meter_type')) {
            $table->addColumn('meter_type', Types::STRING, [
                'length'  => 50,
                'notnull' => false,
                'default' => null,
                // odometer | flight_hours | engine_hours | operating_hours | cycles | custom
            ]);
        }
        if (!$table->hasColumn('meter_unit')) {
            $table->addColumn('meter_unit', Types::STRING, [
                'length'  => 30,
                'notnull' => false,
                'default' => null,
                // miles, km, hours, FH, cycles, etc.
            ]);
        }
        if (!$table->hasColumn('meter_interval')) {
            $table->addColumn('meter_interval', Types::DECIMAL, [
                'precision' => 12,
                'scale'     => 2,
                'notnull'   => false,
                'default'   => null,
                // trigger every N units
            ]);
        }
        if (!$table->hasColumn('meter_last_value')) {
            $table->addColumn('meter_last_value', Types::DECIMAL, [
                'precision' => 12,
                'scale'     => 2,
                'notnull'   => false,
                'default'   => null,
                // reading recorded at last completion
            ]);
        }
        if (!$table->hasColumn('meter_next_due_value')) {
            $table->addColumn('meter_next_due_value', Types::DECIMAL, [
                'precision' => 12,
                'scale'     => 2,
                'notnull'   => false,
                'default'   => null,
                // meter_last_value + meter_interval; overdue when current >= this
            ]);
        }

        // As-required / condition-based fields
        if (!$table->hasColumn('trigger_condition')) {
            $table->addColumn('trigger_condition', Types::TEXT, [
                'notnull' => false,
                'default' => null,
                // human-readable description of what triggers this PM
            ]);
        }
        if (!$table->hasColumn('trigger_source_id')) {
            $table->addColumn('trigger_source_id', Types::INTEGER, [
                'notnull' => false,
                'default' => null,
                // FK to another ops_procedures row (the meter check PM that can trigger this)
            ]);
        }
        if (!$table->hasColumn('trigger_threshold')) {
            $table->addColumn('trigger_threshold', Types::DECIMAL, [
                'precision' => 12,
                'scale'     => 2,
                'notnull'   => false,
                'default'   => null,
                // fire this as_required PM when trigger_source meter_last_value >= this value
            ]);
        }
        // Track whether this as_required PM has been flagged due by a meter check
        if (!$table->hasColumn('pending_trigger')) {
            $table->addColumn('pending_trigger', Types::SMALLINT, [
                'notnull' => true,
                'default' => 0,
                // 1 = flagged due by a meter reading crossing trigger_threshold
            ]);
        }

        return $schema;
    }
}
