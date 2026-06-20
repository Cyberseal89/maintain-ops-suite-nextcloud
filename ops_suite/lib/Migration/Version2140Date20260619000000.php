<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Doctrine\DBAL\Types\Types;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2140Date20260619000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // Deficiencies — failure_mode text + budget fields
        if ($schema->hasTable('ops_deficiencies')) {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasColumn('failure_mode')) {
                $t->addColumn('failure_mode', Types::STRING, ['notnull'=>false,'length'=>120,'default'=>null]);
            }
            if (!$t->hasColumn('budget_status')) {
                $t->addColumn('budget_status', Types::STRING, ['notnull'=>true,'length'=>20,'default'=>'unbudgeted']);
            }
            if (!$t->hasColumn('budget_fiscal_year')) {
                $t->addColumn('budget_fiscal_year', Types::INTEGER, ['notnull'=>false,'default'=>null]);
            }
        }

        // Supply requests — shop linkage + budget fields
        if ($schema->hasTable('ops_supply_requests')) {
            $t = $schema->getTable('ops_supply_requests');
            if (!$t->hasColumn('shop_id')) {
                $t->addColumn('shop_id', Types::BIGINT, ['notnull'=>false,'default'=>null]);
            }
            if (!$t->hasColumn('budget_status')) {
                $t->addColumn('budget_status', Types::STRING, ['notnull'=>true,'length'=>20,'default'=>'unbudgeted']);
            }
            if (!$t->hasColumn('budget_fiscal_year')) {
                $t->addColumn('budget_fiscal_year', Types::INTEGER, ['notnull'=>false,'default'=>null]);
            }
        }

        // Modernizations — budget fields (shop_id already exists)
        if ($schema->hasTable('ops_modernizations')) {
            $t = $schema->getTable('ops_modernizations');
            if (!$t->hasColumn('budget_status')) {
                $t->addColumn('budget_status', Types::STRING, ['notnull'=>true,'length'=>20,'default'=>'unbudgeted']);
            }
            if (!$t->hasColumn('budget_fiscal_year')) {
                $t->addColumn('budget_fiscal_year', Types::INTEGER, ['notnull'=>false,'default'=>null]);
            }
        }

        return $schema;
    }
}
