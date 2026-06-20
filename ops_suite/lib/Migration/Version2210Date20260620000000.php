<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2210Date20260620000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_rcm_decisions')) {
            $t = $schema->createTable('ops_rcm_decisions');
            $t->addColumn('id',                Types::INTEGER, ['autoincrement'=>true,'notnull'=>true,'unsigned'=>true]);
            $t->addColumn('fmea_entry_id',     Types::INTEGER, ['notnull'=>true,'unsigned'=>true]);
            $t->addColumn('worksheet_id',      Types::INTEGER, ['notnull'=>true,'unsigned'=>true]);
            // MSG-3 / S4000P decision tree fields
            $t->addColumn('failure_visibility',  Types::STRING, ['notnull'=>true,'length'=>20,'default'=>'evident']);
            $t->addColumn('failure_consequence', Types::STRING, ['notnull'=>true,'length'=>30,'default'=>'operational']);
            $t->addColumn('task_type',           Types::STRING, ['notnull'=>true,'length'=>30,'default'=>'on_condition']);
            $t->addColumn('task_interval',       Types::STRING, ['notnull'=>true,'length'=>128,'default'=>'']);
            $t->addColumn('interval_basis',      Types::TEXT,   ['notnull'=>true,'default'=>'']);
            $t->addColumn('linked_procedure_id', Types::INTEGER,['notnull'=>false,'unsigned'=>true,'default'=>null]);
            $t->addColumn('rationale',           Types::TEXT,   ['notnull'=>true,'default'=>'']);
            $t->addColumn('approved_by',         Types::STRING, ['notnull'=>true,'length'=>128,'default'=>'']);
            $t->addColumn('approved_at',         Types::STRING, ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->addColumn('created_by',          Types::STRING, ['notnull'=>true,'length'=>64,'default'=>'']);
            $t->addColumn('created_at',          Types::STRING, ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->addColumn('updated_at',          Types::STRING, ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['fmea_entry_id'],  'rcm_entry_idx');
            $t->addIndex(['worksheet_id'],   'rcm_ws_idx');
            $t->addUniqueIndex(['fmea_entry_id'], 'rcm_entry_unique');
        }

        return $schema;
    }
}
