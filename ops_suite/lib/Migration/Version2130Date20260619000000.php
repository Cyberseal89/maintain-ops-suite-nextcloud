<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Doctrine\DBAL\Types\Types;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2130Date20260619000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_mmbp_budget')) {
            $t = $schema->createTable('ops_mmbp_budget');
            $t->addColumn('id',                Types::BIGINT,  ['autoincrement'=>true,'notnull'=>true,'unsigned'=>true]);
            $t->addColumn('platform_id',       Types::BIGINT,  ['notnull'=>false,'default'=>null]);
            $t->addColumn('shop_id',           Types::BIGINT,  ['notnull'=>false,'default'=>null]);
            $t->addColumn('fiscal_year',       Types::INTEGER, ['notnull'=>true]);
            $t->addColumn('entry_type',        Types::STRING,  ['notnull'=>true,'length'=>16,'default'=>'platform']); // 'platform' | 'shop'
            $t->addColumn('total_authorized',  Types::DECIMAL, ['notnull'=>true,'precision'=>14,'scale'=>2,'default'=>'0.00']);
            $t->addColumn('funded_obligation', Types::DECIMAL, ['notnull'=>true,'precision'=>14,'scale'=>2,'default'=>'0.00']);
            $t->addColumn('ufr_amount',        Types::DECIMAL, ['notnull'=>true,'precision'=>14,'scale'=>2,'default'=>'0.00']);
            $t->addColumn('notes',             Types::TEXT,    ['notnull'=>false,'default'=>null]);
            $t->addColumn('created_at',        Types::STRING,  ['notnull'=>true,'length'=>32,'default'=>'']);
            $t->addColumn('updated_at',        Types::STRING,  ['notnull'=>true,'length'=>32,'default'=>'']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['platform_id', 'fiscal_year'], 'ops_mmbp_platform_fy');
            $t->addIndex(['shop_id',     'fiscal_year'], 'ops_mmbp_shop_fy');
        }

        return $schema;
    }
}
