<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2320Date20260623000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_documents')) {
            $t = $schema->getTable('ops_documents');

            // Publication fields — populated when doc_type = 'publication'
            if (!$t->hasColumn('pub_code')) {
                $t->addColumn('pub_code', Types::STRING, ['notnull' => false, 'length' => 100, 'default' => null]);
            }
            if (!$t->hasColumn('pub_type')) {
                $t->addColumn('pub_type', Types::STRING, ['notnull' => false, 'length' => 20, 'default' => null]);
            }
            if (!$t->hasColumn('re_issue_required')) {
                $t->addColumn('re_issue_required', Types::BOOLEAN, ['notnull' => true, 'default' => false]);
            }
        }

        return $schema;
    }
}
