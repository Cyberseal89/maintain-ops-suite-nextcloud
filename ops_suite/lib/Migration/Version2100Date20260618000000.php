<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 1E — 3D Models, Photos, Asset Hierarchy completion
 *
 * 1. Extend ops_assets with remaining Sprint 0A/0B fields from MOS-REQ-002:
 *    display_id, sync_status, bypass_possible, bypass_method,
 *    degraded_capability, degraded_notes, failover_asset_id, redundancy_type,
 *    failover_time_mins, failover_procedure, is_system_node, created_offline, sort_order
 *
 * 2. Create ops_3d_models  — extends Document Registry; one model → many assets
 * 3. Create ops_model_hotspots — clickable 3D world-space annotations
 * 4. Create ops_asset_photos  — structured photo gallery per asset
 */
class Version2100Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_assets — hierarchy + criticality completion ───────────
        if ($schema->hasTable('ops_assets')) {
            $t = $schema->getTable('ops_assets');

            // Offline-first sync
            if (!$t->hasColumn('display_id'))
                $t->addColumn('display_id',       Types::STRING,  ['notnull' => false, 'length' => 32,  'default' => null]);
            if (!$t->hasColumn('sync_status'))
                $t->addColumn('sync_status',      Types::STRING,  ['notnull' => false, 'length' => 16,  'default' => 'confirmed']);
            if (!$t->hasColumn('created_offline'))
                $t->addColumn('created_offline',  Types::SMALLINT,['notnull' => true,  'default' => 0]);
            if (!$t->hasColumn('is_system_node'))
                $t->addColumn('is_system_node',   Types::SMALLINT,['notnull' => true,  'default' => 0]);
            if (!$t->hasColumn('sort_order'))
                $t->addColumn('sort_order',       Types::INTEGER, ['notnull' => false, 'default' => 0]);

            // Bypass / degraded mode (Sprint 0B completion)
            if (!$t->hasColumn('bypass_possible'))
                $t->addColumn('bypass_possible',  Types::SMALLINT,['notnull' => true,  'default' => 0]);
            if (!$t->hasColumn('bypass_method'))
                $t->addColumn('bypass_method',    Types::TEXT,    ['notnull' => false, 'default' => null]);
            if (!$t->hasColumn('degraded_capability'))
                $t->addColumn('degraded_capability', Types::DECIMAL, ['notnull' => false, 'precision' => 5, 'scale' => 2, 'default' => null]);
            if (!$t->hasColumn('degraded_notes'))
                $t->addColumn('degraded_notes',   Types::TEXT,    ['notnull' => false, 'default' => null]);

            // Redundancy / failover (Sprint 0B completion)
            if (!$t->hasColumn('failover_asset_id'))
                $t->addColumn('failover_asset_id',   Types::INTEGER, ['notnull' => false, 'default' => null]);
            if (!$t->hasColumn('redundancy_type'))
                $t->addColumn('redundancy_type',     Types::STRING,  ['notnull' => false, 'length' => 16, 'default' => null]); // auto|standby|spare|procedure
            if (!$t->hasColumn('failover_time_mins'))
                $t->addColumn('failover_time_mins',  Types::INTEGER, ['notnull' => false, 'default' => null]);
            if (!$t->hasColumn('failover_procedure'))
                $t->addColumn('failover_procedure',  Types::TEXT,    ['notnull' => false, 'default' => null]);

            if (!$t->hasIndex('opss_a_display_idx'))
                $t->addIndex(['display_id'], 'opss_a_display_idx');
            if (!$t->hasIndex('opss_a_sysnode_idx'))
                $t->addIndex(['is_system_node'], 'opss_a_sysnode_idx');
            if (!$t->hasIndex('opss_a_failover_idx'))
                $t->addIndex(['failover_asset_id'], 'opss_a_failover_idx');
        }

        // ── ops_3d_models ─────────────────────────────────────────────
        // Extends Document Registry — one model doc applies to many assets of same type.
        // document_id FK → ops_documents.id
        if (!$schema->hasTable('ops_3d_models')) {
            $t = $schema->createTable('ops_3d_models');
            $t->addColumn('id',                Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('document_id',       Types::INTEGER,  ['notnull' => true]);   // FK → ops_documents
            $t->addColumn('asset_id',          Types::INTEGER,  ['notnull' => false, 'default' => null]); // direct link shortcut
            // STEP|OBJ|FBX|GLTF|GLB|STL|PLY
            $t->addColumn('source_format',     Types::STRING,   ['notnull' => true,  'length' => 8,   'default' => 'GLTF']);
            $t->addColumn('source_file_path',  Types::TEXT,     ['notnull' => true]);   // Nextcloud path to original file
            $t->addColumn('gltf_file_path',    Types::TEXT,     ['notnull' => false, 'default' => null]); // Converted GLTF (null = source is already GLTF)
            $t->addColumn('thumbnail_path',    Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('poly_count',        Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('file_size_mb',      Types::DECIMAL,  ['notnull' => false, 'precision' => 8, 'scale' => 2, 'default' => null]);
            $t->addColumn('model_version',     Types::STRING,   ['notnull' => false, 'length' => 16,  'default' => 'v1.0']);
            // pending|processing|ready|failed
            $t->addColumn('conversion_status', Types::STRING,   ['notnull' => true,  'length' => 16,  'default' => 'ready']);
            $t->addColumn('conversion_error',  Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('description',       Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('created_by',        Types::STRING,   ['notnull' => true,  'length' => 64,  'default' => '']);
            $t->addColumn('created_at',        Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->addColumn('updated_at',        Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['document_id'],       'opss_3dm_doc_idx');
            $t->addIndex(['asset_id'],          'opss_3dm_asset_idx');
            $t->addIndex(['conversion_status'], 'opss_3dm_status_idx');
        }

        // ── ops_model_hotspots ────────────────────────────────────────
        // Clickable 3D world-space annotations on a model.
        // linked_type: asset | interface | document | deficiency | requirement
        if (!$schema->hasTable('ops_model_hotspots')) {
            $t = $schema->createTable('ops_model_hotspots');
            $t->addColumn('id',           Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('model_id',     Types::INTEGER,  ['notnull' => true]);  // FK → ops_3d_models
            $t->addColumn('label',        Types::STRING,   ['notnull' => true,  'length' => 128]);
            $t->addColumn('position_x',   Types::DECIMAL,  ['notnull' => true,  'precision' => 10, 'scale' => 6, 'default' => '0']);
            $t->addColumn('position_y',   Types::DECIMAL,  ['notnull' => true,  'precision' => 10, 'scale' => 6, 'default' => '0']);
            $t->addColumn('position_z',   Types::DECIMAL,  ['notnull' => true,  'precision' => 10, 'scale' => 6, 'default' => '0']);
            $t->addColumn('linked_type',  Types::STRING,   ['notnull' => false, 'length' => 16,  'default' => null]);
            $t->addColumn('linked_id',    Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('hotspot_color',Types::STRING,   ['notnull' => false, 'length' => 7,   'default' => '#38bdf8']);
            $t->addColumn('notes',        Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('created_at',   Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['model_id'], 'opss_hs_model_idx');
        }

        // ── ops_asset_photos ──────────────────────────────────────────
        // Structured photo history per asset.
        // photo_type: install|condition|deficiency|pre_maint|post_maint|scan|damage
        if (!$schema->hasTable('ops_asset_photos')) {
            $t = $schema->createTable('ops_asset_photos');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('asset_id',       Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('photo_type',     Types::STRING,   ['notnull' => true,  'length' => 16,  'default' => 'condition']);
            $t->addColumn('linked_def_id',  Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('linked_pm_id',   Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('linked_chg_id',  Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('file_path',      Types::TEXT,     ['notnull' => true]);  // Nextcloud path
            $t->addColumn('thumbnail_path', Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('caption',        Types::TEXT,     ['notnull' => false, 'default' => null]);
            $t->addColumn('is_primary',     Types::SMALLINT, ['notnull' => true,  'default' => 0]);
            $t->addColumn('sort_order',     Types::INTEGER,  ['notnull' => false, 'default' => 0]);
            $t->addColumn('taken_at',       Types::STRING,   ['notnull' => false, 'length' => 32,  'default' => null]);
            $t->addColumn('taken_by',       Types::STRING,   ['notnull' => true,  'length' => 64,  'default' => '']);
            $t->addColumn('location_lat',   Types::DECIMAL,  ['notnull' => false, 'precision' => 10, 'scale' => 7, 'default' => null]);
            $t->addColumn('location_lng',   Types::DECIMAL,  ['notnull' => false, 'precision' => 10, 'scale' => 7, 'default' => null]);
            $t->addColumn('created_at',     Types::STRING,   ['notnull' => true,  'length' => 32,  'default' => '']);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['asset_id'],    'opss_ph_asset_idx');
            $t->addIndex(['photo_type'],  'opss_ph_type_idx');
            $t->addIndex(['is_primary'],  'opss_ph_primary_idx');
            $t->addIndex(['linked_def_id'], 'opss_ph_def_idx');
        }

        return $schema;
    }
}
