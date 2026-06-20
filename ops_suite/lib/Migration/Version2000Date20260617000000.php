<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 0A — Asset Coding + Shops + Offline-Sync Foundation
 *
 * New tables:
 *   ops_shops            — disciplines within a platform (IT, HVAC, Comms, etc.)
 *   ops_shop_sequences   — per-shop counters driving asset_code generation
 *
 * Extend ops_assets:
 *   asset_code, local_uuid, shop_id, parent_id, depth,
 *   system_position, hierarchy_path
 *
 * Extend ops_deficiencies + ops_procedures:
 *   local_uuid — offline-first sync ID (SYNC-003/004/006)
 */
class Version2000Date20260617000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_shops ──────────────────────────────────────────────
        if (!$schema->hasTable('ops_shops')) {
            $t = $schema->createTable('ops_shops');
            $t->addColumn('id',          Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('platform_id', Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('name',        Types::STRING,   ['notnull' => true,  'length' => 128]);
            $t->addColumn('code',        Types::STRING,   ['notnull' => true,  'length' => 8]);
            $t->addColumn('discipline',  Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('description', Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('supervisor',  Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_by',  Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => '']);
            $t->addColumn('created_at',  Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',  Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['platform_id'], 'opss_sh_plat_idx');
            $t->addUniqueIndex(['platform_id', 'code'], 'opss_sh_plat_code_uq');
        }

        // ── ops_shop_sequences ─────────────────────────────────────
        // Tracks the next sequence number per (shop_id, parent_asset_id) pair.
        // parent_asset_id = 0 means root level within the shop.
        if (!$schema->hasTable('ops_shop_sequences')) {
            $t = $schema->createTable('ops_shop_sequences');
            $t->addColumn('id',              Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('shop_id',         Types::INTEGER, ['notnull' => true]);
            $t->addColumn('parent_asset_id', Types::INTEGER, ['notnull' => true, 'default' => 0]);
            $t->addColumn('next_seq',        Types::INTEGER, ['notnull' => true, 'default' => 1]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['shop_id', 'parent_asset_id'], 'opss_seq_shop_parent_uq');
        }

        // ── Extend ops_assets ──────────────────────────────────────
        if ($schema->hasTable('ops_assets')) {
            $t = $schema->getTable('ops_assets');

            // Structured code: HW-C1-001, HW-C1-001-002, etc.
            if (!$t->hasColumn('asset_code')) {
                $t->addColumn('asset_code', Types::STRING, ['notnull' => false, 'length' => 32, 'default' => null]);
            }
            // UUID assigned by client for offline-first sync (SYNC-003/006)
            if (!$t->hasColumn('local_uuid')) {
                $t->addColumn('local_uuid', Types::STRING, ['notnull' => false, 'length' => 36, 'default' => null]);
            }
            // FK → ops_shops
            if (!$t->hasColumn('shop_id')) {
                $t->addColumn('shop_id', Types::INTEGER, ['notnull' => false, 'default' => null]);
            }
            // FK → ops_assets (self-referential parent)
            if (!$t->hasColumn('parent_id')) {
                $t->addColumn('parent_id', Types::INTEGER, ['notnull' => false, 'default' => null]);
            }
            // 0=system, 1=subsystem, 2=component, 3=sub-component
            if (!$t->hasColumn('depth')) {
                $t->addColumn('depth', Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            }
            // Position at this level: "001", "002", etc.
            if (!$t->hasColumn('system_position')) {
                $t->addColumn('system_position', Types::STRING, ['notnull' => false, 'length' => 16, 'default' => null]);
            }
            // Full path: "C1/001/002" for fast subtree queries
            if (!$t->hasColumn('hierarchy_path')) {
                $t->addColumn('hierarchy_path', Types::STRING, ['notnull' => false, 'length' => 255, 'default' => null]);
            }

            if (!$t->hasIndex('opss_a_shop_idx'))   $t->addIndex(['shop_id'],    'opss_a_shop_idx');
            if (!$t->hasIndex('opss_a_parent_idx'))  $t->addIndex(['parent_id'],  'opss_a_parent_idx');
            if (!$t->hasIndex('opss_a_code_idx'))    $t->addIndex(['asset_code'], 'opss_a_code_idx');
            if (!$t->hasIndex('opss_a_uuid_idx'))    $t->addIndex(['local_uuid'], 'opss_a_uuid_idx');
        }

        // ── Extend ops_deficiencies (offline sync) ─────────────────
        if ($schema->hasTable('ops_deficiencies')) {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasColumn('local_uuid')) {
                $t->addColumn('local_uuid', Types::STRING, ['notnull' => false, 'length' => 36, 'default' => null]);
            }
            if (!$t->hasIndex('opss_d_uuid_idx')) $t->addIndex(['local_uuid'], 'opss_d_uuid_idx');
        }

        // ── Extend ops_procedures (offline sync) ───────────────────
        if ($schema->hasTable('ops_procedures')) {
            $t = $schema->getTable('ops_procedures');
            if (!$t->hasColumn('local_uuid')) {
                $t->addColumn('local_uuid', Types::STRING, ['notnull' => false, 'length' => 36, 'default' => null]);
            }
            if (!$t->hasIndex('opss_p_uuid_idx')) $t->addIndex(['local_uuid'], 'opss_p_uuid_idx');
        }

        return $schema;
    }
}
