<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version1080Date20260510000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        // ── Asset verification fields ──────────────────────────────
        if ($schema->hasTable('ops_assets')) {
            $t = $schema->getTable('ops_assets');
            if (!$t->hasColumn('last_verified_at')) {
                $t->addColumn('last_verified_at', Types::DATETIME, ['notnull' => false, 'default' => null]);
            }
            if (!$t->hasColumn('verified_by')) {
                $t->addColumn('verified_by', Types::STRING, ['notnull' => false, 'length' => 64, 'default' => '']);
            }
        }

        // ── Asset IUID/UII fields (ISO 15459/16022) ──────────────────
        if ($schema->hasTable('ops_assets')) {
            $t = $schema->getTable('ops_assets');
            if (!$t->hasColumn('uii')) {
                $t->addColumn('uii', Types::STRING, ['notnull' => false, 'length' => 128, 'default' => '']);
            }
            if (!$t->hasColumn('iuid_compliant')) {
                $t->addColumn('iuid_compliant', Types::SMALLINT, ['notnull' => false, 'default' => 0]);
            }
            if (!$t->hasColumn('cage_code')) {
                $t->addColumn('cage_code', Types::STRING, ['notnull' => false, 'length' => 32, 'default' => '']);
            }
        }

        // ── Inventory cycle count fields ───────────────────────────
        if ($schema->hasTable('ops_inventory')) {
            $t = $schema->getTable('ops_inventory');
            if (!$t->hasColumn('count_class')) {
                $t->addColumn('count_class', Types::STRING, ['notnull' => false, 'length' => 16, 'default' => 'C']);
            }
            if (!$t->hasColumn('last_counted_at')) {
                $t->addColumn('last_counted_at', Types::DATETIME, ['notnull' => false, 'default' => null]);
            }
            if (!$t->hasColumn('counted_by')) {
                $t->addColumn('counted_by', Types::STRING, ['notnull' => false, 'length' => 64, 'default' => '']);
            }
            if (!$t->hasColumn('next_count_due')) {
                $t->addColumn('next_count_due', Types::DATE, ['notnull' => false, 'default' => null]);
            }
        }

        // ── Supply request item procurement fields ─────────────────
        if ($schema->hasTable('ops_supply_req_items')) {
            $t = $schema->getTable('ops_supply_req_items');
            if (!$t->hasColumn('manufacturer')) {
                $t->addColumn('manufacturer', Types::STRING, ['notnull' => false, 'length' => 128, 'default' => '']);
            }
            if (!$t->hasColumn('nsn')) {
                $t->addColumn('nsn', Types::STRING, ['notnull' => false, 'length' => 64, 'default' => '']);
            }
            if (!$t->hasColumn('cage_code')) {
                $t->addColumn('cage_code', Types::STRING, ['notnull' => false, 'length' => 32, 'default' => '']);
            }
            if (!$t->hasColumn('unit_of_measure')) {
                $t->addColumn('unit_of_measure', Types::STRING, ['notnull' => false, 'length' => 32, 'default' => 'each']);
            }
        }

        return $schema;
    }
}
