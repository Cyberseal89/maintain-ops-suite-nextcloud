<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Migration;
use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2180Date20260619000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_training_requirements')) {
            $t = $schema->createTable('ops_training_requirements');
            $t->addColumn('id',           Types::INTEGER,  ['autoincrement'=>true,'notnull'=>true,'unsigned'=>true]);
            $t->addColumn('source_type',  Types::STRING,   ['notnull'=>true,'length'=>32,'default'=>'standalone']); // modernization | procedure | standalone
            $t->addColumn('source_id',    Types::INTEGER,  ['notnull'=>false,'unsigned'=>true]);
            $t->addColumn('title',        Types::STRING,   ['notnull'=>true,'length'=>255]);
            $t->addColumn('description',  Types::TEXT,     ['notnull'=>false]);
            $t->addColumn('training_type',Types::STRING,   ['notnull'=>true,'length'=>32,'default'=>'initial']); // initial | recurrent | upgrade | qualification
            $t->addColumn('s6000t_task_code', Types::STRING, ['notnull'=>false,'length'=>64]);
            $t->addColumn('s6000t_wuc',   Types::STRING,   ['notnull'=>false,'length'=>32]); // Work Unit Code
            $t->addColumn('skill_level',  Types::INTEGER,  ['notnull'=>false,'unsigned'=>true]);
            $t->addColumn('man_hours',    Types::DECIMAL,  ['notnull'=>false,'precision'=>6,'scale'=>2]);
            $t->addColumn('required_by_date', Types::STRING, ['notnull'=>false,'length'=>10]);
            $t->addColumn('status',       Types::STRING,   ['notnull'=>true,'length'=>32,'default'=>'pending']); // pending | in_progress | complete | waived
            $t->addColumn('assigned_to',  Types::STRING,   ['notnull'=>false,'length'=>64]); // NC uid
            $t->addColumn('completed_date', Types::STRING, ['notnull'=>false,'length'=>10]);
            $t->addColumn('platform_id',  Types::INTEGER,  ['notnull'=>false,'unsigned'=>true]);
            $t->addColumn('notes',        Types::TEXT,     ['notnull'=>false]);
            $t->addColumn('created_at',   Types::STRING,   ['notnull'=>false,'length'=>20]);
            $t->addColumn('updated_at',   Types::STRING,   ['notnull'=>false,'length'=>20]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['source_type','source_id'], 'ops_tr_source_idx');
            $t->addIndex(['status'],                  'ops_tr_status_idx');
            $t->addIndex(['assigned_to'],             'ops_tr_assigned_idx');
            $t->addIndex(['platform_id'],             'ops_tr_plat_idx');
        }

        return $schema;
    }
}
