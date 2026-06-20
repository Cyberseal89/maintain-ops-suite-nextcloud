<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2080Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_loto_sessions')) {
            $t = $schema->createTable('ops_loto_sessions');
            $t->addColumn('id',                 Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('asset_id',           Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('session_type',       Types::STRING,   ['length' => 20,  'default' => 'deficiency']); // deficiency|pm|general
            $t->addColumn('status',             Types::STRING,   ['length' => 20,  'default' => 'active']);     // active|released
            $t->addColumn('tag_number',         Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('lock_number',        Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('equipment_name',     Types::STRING,   ['length' => 255, 'notnull' => false]);
            $t->addColumn('location',           Types::STRING,   ['length' => 255, 'notnull' => false]);
            $t->addColumn('work_description',   Types::TEXT,     ['notnull' => false]);
            $t->addColumn('hazards',            Types::TEXT,     ['notnull' => false]);
            $t->addColumn('energy_sources',     Types::TEXT,     ['notnull' => false]); // JSON array
            $t->addColumn('steps_completed',    Types::TEXT,     ['notnull' => false]); // JSON array of completed step keys
            $t->addColumn('linked_def_id',      Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('linked_proc_id',     Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('initiated_by',       Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('initiated_at',       Types::DATETIME, ['notnull' => false]);
            $t->addColumn('authorized_by',      Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('expected_release',   Types::DATE,     ['notnull' => false]);
            $t->addColumn('released_by',        Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('released_at',        Types::DATETIME, ['notnull' => false]);
            $t->addColumn('release_notes',      Types::TEXT,     ['notnull' => false]);
            $t->addColumn('created_at',         Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',         Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['asset_id'],     'ops_loto_asset_idx');
            $t->addIndex(['status'],       'ops_loto_status_idx');
            $t->addIndex(['initiated_by'], 'ops_loto_user_idx');
        }

        return $schema;
    }
}
