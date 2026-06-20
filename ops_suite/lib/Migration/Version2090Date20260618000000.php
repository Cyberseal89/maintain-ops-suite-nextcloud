<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2090Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── Lock/Tag device inventory ─────────────────────────────────
        if (!$schema->hasTable('ops_loto_devices')) {
            $t = $schema->createTable('ops_loto_devices');
            $t->addColumn('id',                  Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('device_type',         Types::STRING,   ['length' => 20,  'default' => 'lock']); // lock|tag|hasp
            $t->addColumn('serial_number',       Types::STRING,   ['length' => 64,  'notnull' => true]);
            $t->addColumn('color',               Types::STRING,   ['length' => 32,  'notnull' => false]);
            $t->addColumn('key_number',          Types::STRING,   ['length' => 64,  'notnull' => false]);
            $t->addColumn('description',         Types::STRING,   ['length' => 255, 'notnull' => false]);
            $t->addColumn('status',              Types::STRING,   ['length' => 20,  'default' => 'available']); // available|in_use|lost|retired
            $t->addColumn('assigned_session_id', Types::INTEGER,  ['notnull' => false]);
            $t->addColumn('notes',               Types::TEXT,     ['notnull' => false]);
            $t->addColumn('created_at',          Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',          Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['serial_number'], 'ops_loto_dev_serial_uidx');
            $t->addIndex(['status'],              'ops_loto_dev_status_idx');
        }

        // ── Add audit / verify columns to loto_sessions ───────────────
        if ($schema->hasTable('ops_loto_sessions')) {
            $t = $schema->getTable('ops_loto_sessions');
            if (!$t->hasColumn('last_verified_at'))
                $t->addColumn('last_verified_at', Types::DATETIME, ['notnull' => false]);
            if (!$t->hasColumn('last_verified_by'))
                $t->addColumn('last_verified_by', Types::STRING,   ['length' => 64, 'notnull' => false]);
            if (!$t->hasColumn('device_ids'))
                $t->addColumn('device_ids',       Types::TEXT,     ['notnull' => false]); // JSON array of ops_loto_devices ids
        }

        return $schema;
    }
}
