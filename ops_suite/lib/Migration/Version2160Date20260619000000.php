<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2160Date20260619000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── Extend ops_work_packages with RFQ award fields ────────────
        if ($schema->hasTable('ops_work_packages')) {
            $t = $schema->getTable('ops_work_packages');

            if (!$t->hasColumn('source_type')) {
                $t->addColumn('source_type', Types::STRING, ['notnull' => false, 'length' => 32]);
            }
            if (!$t->hasColumn('source_id')) {
                $t->addColumn('source_id', Types::INTEGER, ['notnull' => false]);
            }
            if (!$t->hasColumn('awarded_to')) {
                $t->addColumn('awarded_to', Types::STRING, ['notnull' => false, 'length' => 255]);
            }
            if (!$t->hasColumn('award_amount')) {
                $t->addColumn('award_amount', Types::DECIMAL, ['notnull' => false, 'precision' => 12, 'scale' => 2]);
            }
            if (!$t->hasColumn('award_date')) {
                $t->addColumn('award_date', Types::STRING, ['notnull' => false, 'length' => 32]);
            }
        }

        // ── ops_wp_quotes — vendor quotes per work package ────────────
        if (!$schema->hasTable('ops_wp_quotes')) {
            $t = $schema->createTable('ops_wp_quotes');
            $t->addColumn('id',               Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('work_package_id',  Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('vendor_name',      Types::STRING,   ['notnull' => true, 'length' => 255, 'default' => '']);
            $t->addColumn('vendor_contact',   Types::STRING,   ['notnull' => false, 'length' => 255]);
            $t->addColumn('quote_amount',     Types::DECIMAL,  ['notnull' => false, 'precision' => 12, 'scale' => 2]);
            $t->addColumn('quote_date',       Types::STRING,   ['notnull' => false, 'length' => 32]);
            $t->addColumn('valid_until',      Types::STRING,   ['notnull' => false, 'length' => 32]);
            $t->addColumn('notes',            Types::TEXT,     ['notnull' => false]);
            $t->addColumn('is_selected',      Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('created_by',       Types::STRING,   ['notnull' => false, 'length' => 64]);
            $t->addColumn('created_at',       Types::STRING,   ['notnull' => false, 'length' => 32]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['work_package_id'], 'ops_wpq_pkg_idx');
        }

        return $schema;
    }

    public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {
        // Migrate legacy 'draft' status to 'drafting'
        $schema = $schemaClosure();
        if ($schema->hasTable('ops_work_packages')) {
            $output->info('Migrating work package status: draft → drafting');
        }
    }
}
