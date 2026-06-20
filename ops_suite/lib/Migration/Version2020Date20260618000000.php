<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 0C — Document Registry
 *
 * New tables:
 *   ops_documents          — master document record (doc number, title, category, status)
 *   ops_document_revisions — revision history per document (rev letter, file path, approval)
 */
class Version2020Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_documents ──────────────────────────────────────────
        if (!$schema->hasTable('ops_documents')) {
            $t = $schema->createTable('ops_documents');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('doc_number',     Types::STRING,   ['notnull' => true,  'length' => 64]);
            $t->addColumn('title',          Types::STRING,   ['notnull' => true,  'length' => 255]);

            // drawing | tech_manual | spec | sop | test_plan | training | other
            $t->addColumn('category',       Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => 'other']);

            // draft | active | superseded | obsolete
            $t->addColumn('status',         Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'draft']);

            // Current revision label (mirrors latest ops_document_revisions.revision)
            $t->addColumn('current_rev',    Types::STRING,   ['notnull' => false, 'length' => 16, 'default' => null]);

            // Primary asset this document belongs to (nullable — can be org-level)
            $t->addColumn('asset_id',       Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('platform_id',    Types::INTEGER,  ['notnull' => false, 'default' => null]);

            // Free-text applicability (e.g. "All HW-C1-* assets", "HVAC systems")
            $t->addColumn('applicability',  Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('notes',          Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('local_uuid',     Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => null]);

            $t->addColumn('created_by',     Types::STRING,   ['notnull' => true,  'length' => 64, 'default' => '']);
            $t->addColumn('created_at',     Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);
            $t->addColumn('updated_at',     Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['doc_number'], 'opss_doc_number_uq');
            $t->addIndex(['asset_id'],    'opss_doc_asset_idx');
            $t->addIndex(['platform_id'], 'opss_doc_plat_idx');
            $t->addIndex(['status'],      'opss_doc_status_idx');
            $t->addIndex(['local_uuid'],  'opss_doc_uuid_idx');
        }

        // ── ops_document_revisions ─────────────────────────────────
        if (!$schema->hasTable('ops_document_revisions')) {
            $t = $schema->createTable('ops_document_revisions');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('document_id',    Types::INTEGER,  ['notnull' => true]);

            // Rev label: A, B, C … or 1, 1.1, 2 etc.
            $t->addColumn('revision',       Types::STRING,   ['notnull' => true, 'length' => 16]);
            $t->addColumn('change_desc',    Types::TEXT,     ['notnull' => false, 'default' => '']);

            // DAV path to the actual file
            $t->addColumn('file_path',      Types::STRING,   ['notnull' => false, 'length' => 1024, 'default' => null]);

            $t->addColumn('author',         Types::STRING,   ['notnull' => true,  'length' => 64, 'default' => '']);
            $t->addColumn('approved_by',    Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => null]);
            $t->addColumn('approved_at',    Types::STRING,   ['notnull' => false, 'length' => 32, 'default' => null]);

            $t->addColumn('created_at',     Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addIndex(['document_id'], 'opss_docrev_doc_idx');
        }

        return $schema;
    }
}
