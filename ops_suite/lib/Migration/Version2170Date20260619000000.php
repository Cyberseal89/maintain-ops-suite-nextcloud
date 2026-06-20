<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2170Date20260619000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_personnel ─────────────────────────────────────────────
        if (!$schema->hasTable('ops_personnel')) {
            $t = $schema->createTable('ops_personnel');
            $t->addColumn('id',             Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('nextcloud_uid',  Types::STRING,  ['notnull' => false, 'length' => 64]);
            $t->addColumn('first_name',     Types::STRING,  ['notnull' => true,  'length' => 100, 'default' => '']);
            $t->addColumn('last_name',      Types::STRING,  ['notnull' => true,  'length' => 100, 'default' => '']);
            $t->addColumn('role',           Types::STRING,  ['notnull' => false, 'length' => 64]);
            $t->addColumn('shop_id',        Types::INTEGER, ['notnull' => false]);
            $t->addColumn('platform_id',    Types::INTEGER, ['notnull' => false]);
            $t->addColumn('email',          Types::STRING,  ['notnull' => false, 'length' => 255]);
            $t->addColumn('phone',          Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('status',         Types::STRING,  ['notnull' => true,  'length' => 32, 'default' => 'active']);
            $t->addColumn('notes',          Types::TEXT,    ['notnull' => false]);
            $t->addColumn('created_at',     Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('updated_at',     Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['shop_id'],     'ops_pers_shop_idx');
            $t->addIndex(['platform_id'], 'ops_pers_plat_idx');
        }

        // ── ops_skills_catalog ────────────────────────────────────────
        if (!$schema->hasTable('ops_skills_catalog')) {
            $t = $schema->createTable('ops_skills_catalog');
            $t->addColumn('id',          Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('code',        Types::STRING,  ['notnull' => true,  'length' => 32, 'default' => '']);
            $t->addColumn('name',        Types::STRING,  ['notnull' => true,  'length' => 255, 'default' => '']);
            $t->addColumn('category',    Types::STRING,  ['notnull' => false, 'length' => 64]);
            $t->addColumn('description', Types::TEXT,    ['notnull' => false]);
            $t->addColumn('created_at',  Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('updated_at',  Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['code'], 'ops_skill_code_uidx');
        }

        // ── ops_personnel_skills ──────────────────────────────────────
        if (!$schema->hasTable('ops_personnel_skills')) {
            $t = $schema->createTable('ops_personnel_skills');
            $t->addColumn('id',                Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('personnel_id',      Types::INTEGER, ['notnull' => true]);
            $t->addColumn('skill_id',          Types::INTEGER, ['notnull' => true]);
            $t->addColumn('proficiency_level', Types::INTEGER, ['notnull' => true, 'default' => 1]);
            $t->addColumn('certified_date',    Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('expiry_date',       Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('notes',             Types::TEXT,    ['notnull' => false]);
            $t->addColumn('created_at',        Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('updated_at',        Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['personnel_id'], 'ops_ps_pers_idx');
            $t->addIndex(['skill_id'],     'ops_ps_skill_idx');
        }

        // ── ops_manpower_requirements ─────────────────────────────────
        if (!$schema->hasTable('ops_manpower_requirements')) {
            $t = $schema->createTable('ops_manpower_requirements');
            $t->addColumn('id',              Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('source_type',     Types::STRING,  ['notnull' => true, 'length' => 32, 'default' => '']);
            $t->addColumn('source_id',       Types::INTEGER, ['notnull' => true]);
            $t->addColumn('skill_id',        Types::INTEGER, ['notnull' => false]);
            $t->addColumn('qty_required',    Types::INTEGER, ['notnull' => true, 'default' => 1]);
            $t->addColumn('duration_hours',  Types::DECIMAL, ['notnull' => false, 'precision' => 8, 'scale' => 2]);
            $t->addColumn('notes',           Types::TEXT,    ['notnull' => false]);
            $t->addColumn('created_at',      Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->addColumn('updated_at',      Types::STRING,  ['notnull' => false, 'length' => 32]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['source_type', 'source_id'], 'ops_mr_source_idx');
            $t->addIndex(['skill_id'],                 'ops_mr_skill_idx');
        }

        return $schema;
    }
}
