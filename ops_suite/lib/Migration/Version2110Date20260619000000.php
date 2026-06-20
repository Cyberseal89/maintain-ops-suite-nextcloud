<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Doctrine\DBAL\Types\Types;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 2A — Data Import Core
 * Creates ops_import_jobs and ops_import_rows tables.
 */
class Version2110Date20260619000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, \Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_import_jobs ───────────────────────────────────────────
        if (!$schema->hasTable('ops_import_jobs')) {
            $t = $schema->createTable('ops_import_jobs');
            $t->addColumn('id',            Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('platform_id',   Types::INTEGER, ['notnull' => false, 'default' => null]);
            $t->addColumn('import_type',   Types::STRING,  ['notnull' => true,  'length' => 32,  'default' => 'assets']);
            // csv | xlsx | json
            $t->addColumn('file_format',   Types::STRING,  ['notnull' => true,  'length' => 8]);
            $t->addColumn('file_path',     Types::TEXT,    ['notnull' => true]);
            $t->addColumn('original_name', Types::STRING,  ['notnull' => false, 'length' => 255, 'default' => null]);
            // pending | mapping | validating | ready | importing | done | failed
            $t->addColumn('status',        Types::STRING,  ['notnull' => true,  'length' => 16,  'default' => 'pending']);
            // JSON: {sourceCol: targetField, ...}
            $t->addColumn('column_map',    Types::TEXT,    ['notnull' => false, 'default' => null]);
            // JSON: detected headers from the uploaded file
            $t->addColumn('detected_headers', Types::TEXT, ['notnull' => false, 'default' => null]);
            // JSON: first N preview rows (raw strings)
            $t->addColumn('preview_rows',  Types::TEXT,    ['notnull' => false, 'default' => null]);
            $t->addColumn('total_rows',    Types::INTEGER, ['notnull' => false, 'default' => null]);
            $t->addColumn('valid_rows',    Types::INTEGER, ['notnull' => false, 'default' => null]);
            $t->addColumn('error_rows',    Types::INTEGER, ['notnull' => false, 'default' => null]);
            $t->addColumn('imported_rows', Types::INTEGER, ['notnull' => false, 'default' => null]);
            // JSON: array of {row, field, message} validation errors
            $t->addColumn('validation_errors', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->addColumn('error_message', Types::TEXT,    ['notnull' => false, 'default' => null]);
            $t->addColumn('created_by',    Types::STRING,  ['notnull' => true,  'length' => 64,  'default' => '']);
            $t->addColumn('created_at',    Types::STRING,  ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->addColumn('updated_at',    Types::STRING,  ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->addColumn('completed_at',  Types::STRING,  ['notnull' => false, 'default' => null]);

            $t->setPrimaryKey(['id']);
            $t->addIndex(['platform_id'], 'opss_ij_plat_idx');
            $t->addIndex(['status'],      'opss_ij_status_idx');
            $t->addIndex(['import_type'], 'opss_ij_type_idx');
            $t->addIndex(['created_by'],  'opss_ij_user_idx');
        }

        return $schema;
    }
}
