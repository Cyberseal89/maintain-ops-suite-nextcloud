<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Sprint 0D — MBSE Stubs
 *
 * New tables:
 *   ops_requirements      — functional/performance/interface requirements on system nodes
 *   ops_interfaces        — directed connections between two assets
 *   ops_req_traceability  — links requirements to any other record type
 */
class Version2030Date20260618000000 extends SimpleMigrationStep {

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_requirements ──────────────────────────────────────
        if (!$schema->hasTable('ops_requirements')) {
            $t = $schema->createTable('ops_requirements');
            $t->addColumn('id',                 Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);

            // REQ-C1-001-001 — shop + asset seq + req seq
            $t->addColumn('req_code',           Types::STRING,   ['notnull' => true,  'length' => 32]);

            // Top-level system node this requirement belongs to
            $t->addColumn('asset_id',           Types::INTEGER,  ['notnull' => true]);

            $t->addColumn('title',              Types::STRING,   ['notnull' => true,  'length' => 255]);
            $t->addColumn('description',        Types::TEXT,     ['notnull' => false, 'default' => '']);

            // functional | performance | interface | environmental | reliability
            $t->addColumn('req_type',           Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'functional']);

            // Threshold/objective for measurable requirements
            $t->addColumn('threshold',          Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => null]);
            $t->addColumn('objective',          Types::STRING,   ['notnull' => false, 'length' => 128, 'default' => null]);
            $t->addColumn('unit',               Types::STRING,   ['notnull' => false, 'length' => 32,  'default' => null]);

            // PM procedure that verifies this requirement
            $t->addColumn('verified_by_pm_id',  Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('last_verified_at',   Types::STRING,   ['notnull' => false, 'length' => 32, 'default' => null]);
            $t->addColumn('last_verified_value',Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => null]);

            // met | degraded | not_met | untested
            $t->addColumn('status',             Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'untested']);

            $t->addColumn('priority',           Types::STRING,   ['notnull' => true,  'length' => 4,  'default' => 'P1']);
            $t->addColumn('notes',              Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',         Types::STRING,   ['notnull' => true,  'length' => 64, 'default' => '']);
            $t->addColumn('created_at',         Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);
            $t->addColumn('updated_at',         Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['req_code'], 'opss_req_code_uq');
            $t->addIndex(['asset_id'],  'opss_req_asset_idx');
            $t->addIndex(['status'],    'opss_req_status_idx');
            $t->addIndex(['req_type'],  'opss_req_type_idx');
        }

        // ── ops_interfaces ────────────────────────────────────────
        if (!$schema->hasTable('ops_interfaces')) {
            $t = $schema->createTable('ops_interfaces');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);

            // IF-C1-001-01 — shop + source asset seq + if seq
            $t->addColumn('interface_code', Types::STRING,   ['notnull' => true,  'length' => 32]);

            $t->addColumn('from_asset_id',  Types::INTEGER,  ['notnull' => true]);
            $t->addColumn('to_asset_id',    Types::INTEGER,  ['notnull' => true]);

            // power | rf | data | control | pneumatic | hydraulic | mechanical | hvac | network
            $t->addColumn('interface_type', Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'data']);

            // e.g. "28VDC 5A", "GigE 1Gbps", "50Ω N-type 0-512MHz"
            $t->addColumn('specification',  Types::STRING,   ['notnull' => false, 'length' => 255, 'default' => null]);

            // e.g. "MIL-STD-1553", "RS-232", "IEEE 802.3"
            $t->addColumn('standard',       Types::STRING,   ['notnull' => false, 'length' => 64,  'default' => null]);

            // active | bypassed | open | terminated
            $t->addColumn('status',         Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'active']);

            // Canvas linkage — populated in Sprint 0F
            $t->addColumn('canvas_id',      Types::INTEGER,  ['notnull' => false, 'default' => null]);
            $t->addColumn('drawing_ref',    Types::STRING,   ['notnull' => false, 'length' => 64, 'default' => null]);

            $t->addColumn('notes',          Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',     Types::STRING,   ['notnull' => true,  'length' => 64, 'default' => '']);
            $t->addColumn('created_at',     Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);
            $t->addColumn('updated_at',     Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['interface_code'], 'opss_if_code_uq');
            $t->addIndex(['from_asset_id'], 'opss_if_from_idx');
            $t->addIndex(['to_asset_id'],   'opss_if_to_idx');
            $t->addIndex(['status'],        'opss_if_status_idx');
        }

        // ── ops_req_traceability ──────────────────────────────────
        if (!$schema->hasTable('ops_req_traceability')) {
            $t = $schema->createTable('ops_req_traceability');
            $t->addColumn('id',             Types::INTEGER,  ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('req_id',         Types::INTEGER,  ['notnull' => true]);

            // asset | interface | procedure | deficiency | change | document
            $t->addColumn('traced_to_type', Types::STRING,   ['notnull' => true,  'length' => 16]);
            $t->addColumn('traced_to_id',   Types::INTEGER,  ['notnull' => true]);

            // satisfies | verified_by | allocated_to | derived_from | breaks
            $t->addColumn('trace_type',     Types::STRING,   ['notnull' => true,  'length' => 16, 'default' => 'satisfies']);

            $t->addColumn('notes',          Types::TEXT,     ['notnull' => false, 'default' => '']);
            $t->addColumn('created_by',     Types::STRING,   ['notnull' => true,  'length' => 64, 'default' => '']);
            $t->addColumn('created_at',     Types::STRING,   ['notnull' => true,  'length' => 32, 'default' => '']);

            $t->setPrimaryKey(['id']);
            $t->addIndex(['req_id'],         'opss_trac_req_idx');
            $t->addIndex(['traced_to_type', 'traced_to_id'], 'opss_trac_target_idx');
        }

        return $schema;
    }
}
