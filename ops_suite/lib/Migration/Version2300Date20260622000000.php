<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2300Date20260622000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        $schema = $schemaClosure();

        // Publications — ordered collections of DMs that form a complete technical manual
        if (!$schema->hasTable('ops_publications')) {
            $t = $schema->createTable('ops_publications');
            $t->addColumn('id',                Types::BIGINT,   ['autoincrement' => true, 'notnull' => true, 'unsigned' => true]);
            // e.g., 'MM-ALTO-HW-C1-001' — Manual type prefix + platform + system code
            $t->addColumn('pub_code',          Types::STRING,   ['length' => 80,  'notnull' => true, 'default' => '']);
            $t->addColumn('title',             Types::STRING,   ['length' => 255, 'notnull' => true, 'default' => '']);
            // System-level asset this publication covers (the top of the PBS for this manual)
            $t->addColumn('asset_id',          Types::BIGINT,   ['notnull' => false, 'unsigned' => true, 'default' => null]);
            $t->addColumn('platform_id',       Types::BIGINT,   ['notnull' => false, 'unsigned' => true, 'default' => null]);
            // Publication type: 'MM'=Maintenance Manual, 'IPD'=Illustrated Parts Data, 'FM'=Fault Manual, 'OM'=Operators Manual
            $t->addColumn('pub_type',          Types::STRING,   ['length' => 10, 'notnull' => true, 'default' => 'MM']);
            $t->addColumn('issue_number',      Types::SMALLINT, ['notnull' => true, 'default' => 1]);
            // draft | review | approved | cancelled
            $t->addColumn('status',            Types::STRING,   ['length' => 20, 'notnull' => true, 'default' => 'draft']);
            // Set true when any constituent DM issue advances — clears on re-export/re-approval
            $t->addColumn('re_issue_required', Types::BOOLEAN,  ['notnull' => true, 'default' => false]);
            $t->addColumn('notes',             Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('created_by',        Types::STRING,   ['length' => 64, 'notnull' => false, 'default' => null]);
            $t->addColumn('created_at',        Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',        Types::DATETIME, ['notnull' => false]);

            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['pub_code'], 'ops_publications_pub_code');
            $t->addIndex(['asset_id'],    'ops_publications_asset');
            $t->addIndex(['platform_id'], 'ops_publications_platform');
        }

        // Publication ↔ Data Module junction — defines chapter/section ordering within a publication
        if (!$schema->hasTable('ops_publication_dms')) {
            $t = $schema->createTable('ops_publication_dms');
            $t->addColumn('id',             Types::BIGINT,  ['autoincrement' => true, 'notnull' => true, 'unsigned' => true]);
            $t->addColumn('publication_id', Types::BIGINT,  ['notnull' => true, 'unsigned' => true]);
            // Must be a document with doc_type = 'data_module'
            $t->addColumn('document_id',    Types::BIGINT,  ['notnull' => true, 'unsigned' => true]);
            $t->addColumn('chapter',        Types::SMALLINT, ['notnull' => true, 'default' => 1]);
            $t->addColumn('section',        Types::SMALLINT, ['notnull' => true, 'default' => 1]);
            // Ordering within a section — gaps allowed (10, 20, 30...)
            $t->addColumn('sequence',       Types::SMALLINT, ['notnull' => true, 'default' => 10]);
            // Optional override title for this DM in this context (DM title used if null)
            $t->addColumn('chapter_title',  Types::STRING,  ['length' => 255, 'notnull' => false, 'default' => null]);

            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['publication_id', 'document_id'], 'ops_pub_dms_unique');
            $t->addIndex(['publication_id', 'chapter', 'section', 'sequence'], 'ops_pub_dms_order');
        }

        return $schema;
    }
}
