<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2330Date20260623000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        // ops_publications is absorbed into ops_documents (doc_type='publication').
        // ops_publication_dms.publication_id now references ops_documents.id directly.
        if ($schema->hasTable('ops_publications')) {
            $schema->dropTable('ops_publications');
        }

        return $schema;
    }
}
