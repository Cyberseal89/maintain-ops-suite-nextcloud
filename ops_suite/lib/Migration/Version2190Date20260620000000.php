<?php
declare(strict_types=1);
namespace OCA\OpsSuite\Migration;
use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2190Date20260620000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_canvases: drawing publish fields ──────────────────
        if ($schema->hasTable('ops_canvases')) {
            $t = $schema->getTable('ops_canvases');
            if (!$t->hasColumn('drawing_doc_id')) {
                $t->addColumn('drawing_doc_id',   Types::INTEGER, ['notnull'=>false,'unsigned'=>true]);
            }
            if (!$t->hasColumn('revision_required')) {
                $t->addColumn('revision_required', Types::BOOLEAN, ['notnull'=>true,'default'=>false]);
            }
            if (!$t->hasColumn('published_at')) {
                $t->addColumn('published_at',      Types::STRING,  ['notnull'=>false,'length'=>20]);
            }
            if (!$t->hasColumn('published_rev')) {
                $t->addColumn('published_rev',     Types::STRING,  ['notnull'=>false,'length'=>16]);
            }
        }

        // ── ops_documents: canvas back-link ───────────────────────
        if ($schema->hasTable('ops_documents')) {
            $t = $schema->getTable('ops_documents');
            if (!$t->hasColumn('canvas_id')) {
                $t->addColumn('canvas_id', Types::INTEGER, ['notnull'=>false,'unsigned'=>true]);
            }
        }

        return $schema;
    }
}
