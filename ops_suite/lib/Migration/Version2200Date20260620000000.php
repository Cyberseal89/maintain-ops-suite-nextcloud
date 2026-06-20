<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2200Date20260620000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── FMEA Worksheets ──────────────────────────────────────────────
        if (!$schema->hasTable('ops_fmea_worksheets')) {
            $t = $schema->createTable('ops_fmea_worksheets');
            $t->addColumn('id',          Types::INTEGER,  ['autoincrement'=>true,'notnull'=>true,'unsigned'=>true]);
            $t->addColumn('canvas_id',   Types::INTEGER,  ['notnull'=>true,'unsigned'=>true]);
            $t->addColumn('node_id',     Types::STRING,   ['notnull'=>true,'length'=>64]);
            $t->addColumn('asset_id',    Types::INTEGER,  ['notnull'=>false,'unsigned'=>true,'default'=>null]);
            $t->addColumn('title',       Types::STRING,   ['notnull'=>true,'length'=>256,'default'=>'FMEA Worksheet']);
            $t->addColumn('status',      Types::STRING,   ['notnull'=>true,'length'=>20,'default'=>'draft']);
            $t->addColumn('doc_id',      Types::INTEGER,  ['notnull'=>false,'unsigned'=>true,'default'=>null]);
            $t->addColumn('created_by',  Types::STRING,   ['notnull'=>true,'length'=>64,'default'=>'']);
            $t->addColumn('created_at',  Types::STRING,   ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->addColumn('updated_at',  Types::STRING,   ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['canvas_id'], 'fmea_ws_canvas_idx');
            $t->addIndex(['asset_id'],  'fmea_ws_asset_idx');
            $t->addUniqueIndex(['canvas_id','node_id'], 'fmea_ws_unique');
        }

        // ── FMEA Entries ─────────────────────────────────────────────────
        if (!$schema->hasTable('ops_fmea_entries')) {
            $t = $schema->createTable('ops_fmea_entries');
            $t->addColumn('id',               Types::INTEGER, ['autoincrement'=>true,'notnull'=>true,'unsigned'=>true]);
            $t->addColumn('worksheet_id',     Types::INTEGER, ['notnull'=>true,'unsigned'=>true]);
            $t->addColumn('function',         Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('failure_mode',     Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('local_effect',     Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('system_effect',    Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('detection_method', Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('severity',         Types::INTEGER, ['notnull'=>true,'default'=>1]);
            $t->addColumn('occurrence',       Types::INTEGER, ['notnull'=>true,'default'=>1]);
            $t->addColumn('detectability',    Types::INTEGER, ['notnull'=>true,'default'=>1]);
            $t->addColumn('rpn',              Types::INTEGER, ['notnull'=>true,'default'=>1]);
            $t->addColumn('failure_mode_id',  Types::INTEGER, ['notnull'=>false,'unsigned'=>true,'default'=>null]);
            $t->addColumn('recommended_action', Types::TEXT,  ['notnull'=>true,'default'=>'']);
            $t->addColumn('responsible_party',  Types::STRING,['notnull'=>true,'length'=>128,'default'=>'']);
            $t->addColumn('action_taken',     Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('revised_sev',      Types::INTEGER, ['notnull'=>false,'default'=>null]);
            $t->addColumn('revised_occ',      Types::INTEGER, ['notnull'=>false,'default'=>null]);
            $t->addColumn('revised_det',      Types::INTEGER, ['notnull'=>false,'default'=>null]);
            $t->addColumn('revised_rpn',      Types::INTEGER, ['notnull'=>false,'default'=>null]);
            $t->addColumn('notes',            Types::TEXT,    ['notnull'=>true,'default'=>'']);
            $t->addColumn('sort_order',       Types::INTEGER, ['notnull'=>true,'default'=>0]);
            $t->addColumn('created_at',       Types::STRING,  ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->addColumn('updated_at',       Types::STRING,  ['notnull'=>false,'length'=>20,'default'=>null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['worksheet_id'],   'fmea_entry_ws_idx');
            $t->addIndex(['failure_mode_id'],'fmea_entry_fm_idx');
        }

        return $schema;
    }
}
