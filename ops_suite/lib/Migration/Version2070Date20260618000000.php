<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\IDBConnection;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version2070Date20260618000000 extends SimpleMigrationStep {

    public function __construct(private readonly IDBConnection $db) {}

    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── ops_failure_modes (S5000F taxonomy) ──────────────────────
        if (!$schema->hasTable('ops_failure_modes')) {
            $t = $schema->createTable('ops_failure_modes');
            $t->addColumn('id',               Types::INTEGER, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('code',             Types::STRING,  ['length' => 32,  'notnull' => true]);
            $t->addColumn('name',             Types::STRING,  ['length' => 255, 'notnull' => true]);
            $t->addColumn('category',         Types::STRING,  ['length' => 32,  'default' => 'general']);
            $t->addColumn('subcategory',      Types::STRING,  ['length' => 64,  'notnull' => false]);
            $t->addColumn('description',      Types::TEXT,    ['notnull' => false]);
            $t->addColumn('applies_to_type',  Types::STRING,  ['length' => 16,  'notnull' => false]);
            $t->addColumn('created_at',       Types::DATETIME, ['notnull' => false]);
            $t->addColumn('updated_at',       Types::DATETIME, ['notnull' => false]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['code'], 'ops_failure_modes_code_uidx');
            $t->addIndex(['category'], 'ops_failure_modes_cat_idx');
        }

        // ── extend ops_deficiencies with failure_mode_id ─────────────
        if ($schema->hasTable('ops_deficiencies')) {
            $t = $schema->getTable('ops_deficiencies');
            if (!$t->hasColumn('failure_mode_id')) {
                $t->addColumn('failure_mode_id', Types::INTEGER, ['notnull' => false]);
            }
        }

        return $schema;
    }

    public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void {
        $now = date('Y-m-d H:i:s');

        // S5000F-aligned failure mode taxonomy — skip if already seeded
        $check = $this->db->getQueryBuilder();
        $check->select($check->createFunction('COUNT(*) AS cnt'))->from('ops_failure_modes');
        $r = $check->executeQuery(); $row = $r->fetch(); $r->closeCursor();
        if ((int)($row['cnt'] ?? 0) > 0) return;

        $modes = [
            // ── Electrical ────────────────────────────────────────────
            ['FM-EL-001','Power Supply Failure',        'electrical', 'Power',       'hardware', 'Loss of regulated voltage output from power supply unit.'],
            ['FM-EL-002','Overvoltage / Surge',         'electrical', 'Power',       'hardware', 'Voltage exceeds rated maximum — component damage risk.'],
            ['FM-EL-003','Undervoltage / Brownout',     'electrical', 'Power',       'hardware', 'Sustained voltage below operating threshold causing instability.'],
            ['FM-EL-004','Short Circuit',               'electrical', 'Fault',       'hardware', 'Unintended low-resistance path drawing excess current.'],
            ['FM-EL-005','Open Circuit',                'electrical', 'Fault',       'hardware', 'Break in conductor interrupting current flow.'],
            ['FM-EL-006','Ground Fault',                'electrical', 'Fault',       'hardware', 'Unintended connection to ground creating shock or damage hazard.'],
            ['FM-EL-007','Connector / Terminal Failure','electrical', 'Connection',  'hardware', 'Intermittent or complete loss of electrical contact at connector.'],
            ['FM-EL-008','Fuse / Breaker Trip',         'electrical', 'Protection',  'hardware', 'Overcurrent protection device operated — root cause investigation required.'],
            ['FM-EL-009','Battery / Capacitor Failure', 'electrical', 'Storage',     'hardware', 'Degraded charge capacity or complete failure of energy storage.'],
            ['FM-EL-010','EMI / RFI Interference',      'electrical', 'Interference','hardware', 'Electromagnetic or RF interference degrading equipment operation.'],

            // ── Mechanical ────────────────────────────────────────────
            ['FM-ME-001','Bearing Failure',             'mechanical', 'Rotating',    'hardware', 'Bearing wear, spalling, or seizure causing noise, vibration, or lockup.'],
            ['FM-ME-002','Belt / Drive Failure',        'mechanical', 'Rotating',    'hardware', 'Belt slippage, breakage, or misalignment in drive system.'],
            ['FM-ME-003','Seal / Gasket Leak',          'mechanical', 'Sealing',     'hardware', 'Loss of fluid or pressure containment through degraded seal.'],
            ['FM-ME-004','Structural Crack / Fracture', 'mechanical', 'Structural',  'hardware', 'Material failure under load — fatigue, impact, or overload.'],
            ['FM-ME-005','Fastener Loosening / Loss',   'mechanical', 'Structural',  'hardware', 'Bolt, screw, or fastener backing out or missing — vibration or improper torque.'],
            ['FM-ME-006','Valve Stuck / Failed',        'mechanical', 'Fluid',       'hardware', 'Control or isolation valve fails to open, close, or modulate.'],
            ['FM-ME-007','Fan / Blower Failure',        'mechanical', 'Cooling',     'hardware', 'Reduction or loss of airflow from fan or blower assembly.'],
            ['FM-ME-008','Pump Failure',                'mechanical', 'Fluid',       'hardware', 'Loss of fluid flow or pressure from pump — cavitation, wear, or seizure.'],
            ['FM-ME-009','Vibration / Misalignment',    'mechanical', 'Rotating',    'hardware', 'Excessive vibration from shaft misalignment, imbalance, or mounting.'],

            // ── Software ──────────────────────────────────────────────
            ['FM-SW-001','Application Crash',           'software',   'Stability',   'software', 'Software process terminates unexpectedly — exception, memory fault, or deadlock.'],
            ['FM-SW-002','Memory Leak',                 'software',   'Resource',    'software', 'Gradual memory consumption leading to degraded performance or crash.'],
            ['FM-SW-003','Configuration Corruption',    'software',   'Config',      'software', 'Configuration file or database corrupted — incorrect or missing values.'],
            ['FM-SW-004','Authentication Failure',      'software',   'Security',    'software', 'System or service fails to authenticate users or peer systems.'],
            ['FM-SW-005','Service Unavailable',         'software',   'Availability','software', 'Background service or daemon fails to start or stops responding.'],
            ['FM-SW-006','Data Corruption',             'software',   'Data',        'software', 'Stored or transmitted data integrity lost — bitflip, write error, or logic fault.'],
            ['FM-SW-007','CVE / Vulnerability',         'software',   'Security',    'software', 'Known vulnerability identified requiring patch or mitigation.'],

            // ── Firmware ──────────────────────────────────────────────
            ['FM-FW-001','Failed Firmware Update',      'firmware',   'Update',      'firmware', 'Firmware flash interrupted or rejected — device may be bricked or degraded.'],
            ['FM-FW-002','Firmware Incompatibility',    'firmware',   'Compatibility','firmware','Firmware version incompatible with hardware revision or peer system.'],
            ['FM-FW-003','Boot Failure',                'firmware',   'Startup',     'firmware', 'Device fails to complete boot sequence — bootloader or initialization fault.'],
            ['FM-FW-004','Feature Regression',         'firmware',   'Stability',   'firmware', 'Previously working function broken after firmware update.'],

            // ── Environmental ─────────────────────────────────────────
            ['FM-EN-001','Overtemperature',             'environmental','Thermal',   null,       'Component temperature exceeds rated limit — cooling failure or ambient condition.'],
            ['FM-EN-002','Moisture / Water Intrusion',  'environmental','Moisture',  null,       'Water or condensation ingress causing corrosion or short circuit.'],
            ['FM-EN-003','Contamination / Debris',      'environmental','Contamination',null,    'Foreign material ingress degrading performance or causing mechanical binding.'],
            ['FM-EN-004','Vibration Damage (External)', 'environmental','Vibration', null,       'Damage caused by external vibration source — vehicle, structure, or adjacent equipment.'],
            ['FM-EN-005','Lightning / ESD Strike',      'environmental','Surge',     null,       'Electrostatic discharge or lightning damage to electronics.'],

            // ── Operator ──────────────────────────────────────────────
            ['FM-OP-001','Improper Operation',          'operator',   'Procedure',   null,       'Equipment operated outside of established procedures or parameters.'],
            ['FM-OP-002','Incorrect Configuration',     'operator',   'Config',      null,       'System misconfigured by operator — wrong settings, mode, or parameter.'],
            ['FM-OP-003','Physical Damage (Operator)',  'operator',   'Damage',      null,       'Equipment physically damaged during operator handling or use.'],

            // ── Wear / Age ────────────────────────────────────────────
            ['FM-WR-001','End of Service Life',         'wear',       'Age',         null,       'Component has reached or exceeded rated operational life.'],
            ['FM-WR-002','Contact / Brush Wear',        'wear',       'Contact',     'hardware', 'Worn electrical contacts or carbon brushes increasing resistance or causing arcing.'],
            ['FM-WR-003','Surface Wear',                'wear',       'Mechanical',  'hardware', 'Loss of material from friction surfaces — bushings, gears, or slides.'],

            // ── Corrosion ─────────────────────────────────────────────
            ['FM-CO-001','Galvanic Corrosion',          'corrosion',  'Galvanic',    'hardware', 'Electrochemical corrosion from dissimilar metals in contact with electrolyte.'],
            ['FM-CO-002','Oxidation / Rust',            'corrosion',  'Oxidation',   'hardware', 'Surface oxidation degrading conductivity, sealing, or structural integrity.'],
            ['FM-CO-003','Chemical Corrosion',          'corrosion',  'Chemical',    'hardware', 'Material attack from process fluids, cleaning agents, or atmospheric chemicals.'],

            // ── Contamination ─────────────────────────────────────────
            ['FM-CT-001','Fluid Contamination',         'contamination','Fluid',     'hardware', 'Hydraulic, lubrication, or coolant fluid contaminated with particles or water.'],
            ['FM-CT-002','Filter Clogging',             'contamination','Filter',    'hardware', 'Filter element blocked reducing flow or pressure below operational limit.'],

            // ── General ───────────────────────────────────────────────
            ['FM-GN-001','Unknown / Under Investigation','general',  null,           null,       'Failure mode not yet determined — investigation in progress.'],
            ['FM-GN-002','Intermittent Fault',          'general',   'Intermittent', null,       'Non-reproducible fault occurring randomly — difficult to isolate.'],
            ['FM-GN-003','Multiple / Combined Failure', 'general',   'Combined',     null,       'Two or more simultaneous or cascading failure modes.'],
        ];

        foreach ($modes as [$code, $name, $category, $subcategory, $appliesToType, $description]) {
            $qb = $this->db->getQueryBuilder();
            $qb->insert('ops_failure_modes')
               ->values([
                   'code'            => $qb->createNamedParameter($code),
                   'name'            => $qb->createNamedParameter($name),
                   'category'        => $qb->createNamedParameter($category),
                   'subcategory'     => $qb->createNamedParameter($subcategory),
                   'applies_to_type' => $qb->createNamedParameter($appliesToType),
                   'description'     => $qb->createNamedParameter($description),
                   'created_at'      => $qb->createNamedParameter($now),
                   'updated_at'      => $qb->createNamedParameter($now),
               ]);
            $qb->executeStatement();
        }
    }
}
