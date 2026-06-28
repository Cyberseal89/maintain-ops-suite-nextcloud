<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2290Date20260622000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if (!$schema->hasTable('ops_dm_steps')) {
            $t = $schema->createTable('ops_dm_steps');
            $t->addColumn('id',          Types::BIGINT,  ['autoincrement' => true, 'notnull' => true, 'unsigned' => true]);
            // FK to ops_documents (doc_type = 'data_module')
            $t->addColumn('document_id', Types::BIGINT,  ['notnull' => true, 'unsigned' => true]);
            // Ordering within the DM — gaps allowed for reordering (10, 20, 30...)
            $t->addColumn('step_order',  Types::INTEGER, ['notnull' => true, 'default' => 10]);
            // warning | caution | note | title | action | expected_result | substep
            $t->addColumn('step_type',   Types::STRING,  ['length' => 30, 'notnull' => true, 'default' => 'action']);
            $t->addColumn('content',     Types::TEXT,    ['notnull' => false, 'default' => null]);
            // JSON arrays: tool names and NSN/part references used in this step
            $t->addColumn('tool_refs',   Types::TEXT,    ['notnull' => false, 'default' => null]);
            $t->addColumn('part_refs',   Types::TEXT,    ['notnull' => false, 'default' => null]);
            $t->addColumn('created_at',  Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',  Types::DATETIME, ['notnull' => false]);

            $t->setPrimaryKey(['id']);
            $t->addIndex(['document_id', 'step_order'], 'ops_dm_steps_doc_order');
        }

        return $schema;
    }
}
