<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2280Date20260622000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        if ($schema->hasTable('ops_documents')) {
            $t = $schema->getTable('ops_documents');

            // Lane discriminator: 'external' (PDF/file attachment) | 'data_module' (S1000D authored DM)
            if (!$t->hasColumn('doc_type')) {
                $t->addColumn('doc_type', Types::STRING, ['length' => 20, 'notnull' => true, 'default' => 'external']);
            }
            // S1000D Data Module Code — auto-generated from asset SNS + info code
            if (!$t->hasColumn('dmc')) {
                $t->addColumn('dmc', Types::STRING, ['length' => 120, 'notnull' => false, 'default' => null]);
            }
            // S1000D Information Code (040=description, 200=procedure, 300=parts, 520=troubleshoot, 900=fault)
            if (!$t->hasColumn('info_code')) {
                $t->addColumn('info_code', Types::STRING, ['length' => 10, 'notnull' => false, 'default' => null]);
            }
            // Variant suffix on info code (A, B, C...) — differentiates multiple DMs of same type on same asset
            if (!$t->hasColumn('info_code_variant')) {
                $t->addColumn('info_code_variant', Types::STRING, ['length' => 2, 'notnull' => false, 'default' => 'A']);
            }
            // S1000D issue number — replaces letter-based current_rev for DMs (external docs keep current_rev)
            if (!$t->hasColumn('issue_number')) {
                $t->addColumn('issue_number', Types::SMALLINT, ['notnull' => true, 'default' => 1]);
            }
            // In-work counter: 0 = released, >0 = draft in progress
            if (!$t->hasColumn('in_work_number')) {
                $t->addColumn('in_work_number', Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            }
            // Set true when this DM's issue advances — cleared when linked PMs/publications are reviewed
            if (!$t->hasColumn('dmc_review_flag')) {
                $t->addColumn('dmc_review_flag', Types::BOOLEAN, ['notnull' => true, 'default' => false]);
            }
        }

        return $schema;
    }
}
