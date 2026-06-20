<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\IDBConnection;
use OCP\Migration\IOutput;
use OCP\Migration\IRepairStep;

/**
 * Repair step — ensures the ops_failure_modes table exists and seeds the
 * S5000F taxonomy if the table is empty. Safe to run multiple times.
 *
 * Runs automatically on every `occ upgrade` and via the admin seed button.
 * Also creates the table if the schema migration hasn't run yet (e.g. manual
 * zip installs that didn't trigger occ upgrade).
 */
class SeedFailureModes implements IRepairStep {

    public function __construct(private readonly IDBConnection $db) {}

    public function getName(): string {
        return 'Seed S5000F failure mode taxonomy';
    }

    public function run(IOutput $output): void {
        // ── 1. Ensure table exists ────────────────────────────────────
        $tableReady = false;
        try {
            $qb = $this->db->getQueryBuilder();
            $qb->select('id')->from('ops_failure_modes')->setMaxResults(1);
            $r = $qb->executeQuery();
            $r->closeCursor();
            $tableReady = true;
        } catch (\Throwable $e) {
            // Table doesn't exist — try to create it
            $output->info('ops_failure_modes table missing — attempting schema creation…');
            $tableReady = $this->ensureTable($output);
        }

        if (!$tableReady) {
            $output->warning('Could not create ops_failure_modes table. Run occ upgrade to apply migrations.');
            return;
        }

        // ── 2. Check if already seeded ───────────────────────────────
        try {
            $qb = $this->db->getQueryBuilder();
            $qb->select('id')->from('ops_failure_modes')->setMaxResults(1);
            $r = $qb->executeQuery();
            $row = $r->fetch();
            $r->closeCursor();
            if ($row !== false) {
                $output->info('Failure modes already seeded — skipping.');
                return;
            }
        } catch (\Throwable $e) {
            $output->warning('Cannot check failure modes: ' . $e->getMessage());
            return;
        }

        // ── 3. Seed ───────────────────────────────────────────────────
        $now   = date('Y-m-d H:i:s');
        $modes = $this->getModes();
        $inserted = 0;

        foreach ($modes as [$code, $name, $category, $subcategory, $appliesToType, $description]) {
            try {
                $qb = $this->db->getQueryBuilder();
                $qb->insert('ops_failure_modes')->values([
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
                $inserted++;
            } catch (\Throwable $e) {
                // Duplicate code — skip
            }
        }

        $output->info("Seeded {$inserted} failure modes.");
    }

    /**
     * Creates the ops_failure_modes table by delegating to the schema migration.
     * Uses the internal SchemaWrapper the same way NC migrations do.
     */
    private function ensureTable(IOutput $output): bool {
        try {
            // \OC\DB\Connection is the concrete implementation always used by NC
            if (!($this->db instanceof \OC\DB\Connection)) {
                return false;
            }

            $migration = new Version2070Date20260618000000($this->db);
            $schemaClosure = fn(): ISchemaWrapper => new \OC\DB\SchemaWrapper($this->db);

            $schema = $migration->changeSchema($output, $schemaClosure, []);
            if ($schema !== null) {
                $this->db->migrateToSchema($schema->getWrappedSchema());
            }

            $output->info('ops_failure_modes table created.');
            return true;
        } catch (\Throwable $e) {
            $output->warning('Schema creation failed: ' . $e->getMessage());
            return false;
        }
    }

    public function getDefaultModes(): array { return $this->getModes(); }

    private function getModes(): array {
        return [
            ['FM-EL-001','Power Supply Failure',           'electrical',    'Power',          'hardware', 'Loss of regulated voltage output from power supply unit.'],
            ['FM-EL-002','Overvoltage / Surge',            'electrical',    'Power',          'hardware', 'Voltage exceeds rated maximum — component damage risk.'],
            ['FM-EL-003','Undervoltage / Brownout',        'electrical',    'Power',          'hardware', 'Sustained voltage below operating threshold causing instability.'],
            ['FM-EL-004','Short Circuit',                  'electrical',    'Fault',          'hardware', 'Unintended low-resistance path drawing excess current.'],
            ['FM-EL-005','Open Circuit',                   'electrical',    'Fault',          'hardware', 'Break in conductor interrupting current flow.'],
            ['FM-EL-006','Ground Fault',                   'electrical',    'Fault',          'hardware', 'Unintended connection to ground creating shock or damage hazard.'],
            ['FM-EL-007','Connector / Terminal Failure',   'electrical',    'Connection',     'hardware', 'Intermittent or complete loss of electrical contact at connector.'],
            ['FM-EL-008','Fuse / Breaker Trip',            'electrical',    'Protection',     'hardware', 'Overcurrent protection device operated — root cause investigation required.'],
            ['FM-EL-009','Battery / Capacitor Failure',    'electrical',    'Storage',        'hardware', 'Degraded charge capacity or complete failure of energy storage.'],
            ['FM-EL-010','EMI / RFI Interference',         'electrical',    'Interference',   'hardware', 'Electromagnetic or RF interference degrading equipment operation.'],
            ['FM-ME-001','Bearing Failure',                'mechanical',    'Rotating',       'hardware', 'Bearing wear, spalling, or seizure causing noise, vibration, or lockup.'],
            ['FM-ME-002','Belt / Drive Failure',           'mechanical',    'Rotating',       'hardware', 'Belt slippage, breakage, or misalignment in drive system.'],
            ['FM-ME-003','Seal / Gasket Leak',             'mechanical',    'Sealing',        'hardware', 'Loss of fluid or pressure containment through degraded seal.'],
            ['FM-ME-004','Structural Crack / Fracture',    'mechanical',    'Structural',     'hardware', 'Material failure under load — fatigue, impact, or overload.'],
            ['FM-ME-005','Fastener Loosening / Loss',      'mechanical',    'Structural',     'hardware', 'Bolt, screw, or fastener backing out or missing — vibration or improper torque.'],
            ['FM-ME-006','Valve Stuck / Failed',           'mechanical',    'Fluid',          'hardware', 'Control or isolation valve fails to open, close, or modulate.'],
            ['FM-ME-007','Fan / Blower Failure',           'mechanical',    'Cooling',        'hardware', 'Reduction or loss of airflow from fan or blower assembly.'],
            ['FM-ME-008','Pump Failure',                   'mechanical',    'Fluid',          'hardware', 'Loss of fluid flow or pressure from pump — cavitation, wear, or seizure.'],
            ['FM-ME-009','Vibration / Misalignment',       'mechanical',    'Rotating',       'hardware', 'Excessive vibration from shaft misalignment, imbalance, or mounting.'],
            ['FM-SW-001','Application Crash',              'software',      'Stability',      'software', 'Software process terminates unexpectedly — exception, memory fault, or deadlock.'],
            ['FM-SW-002','Memory Leak',                    'software',      'Resource',       'software', 'Gradual memory consumption leading to degraded performance or crash.'],
            ['FM-SW-003','Configuration Corruption',       'software',      'Config',         'software', 'Configuration file or database corrupted — incorrect or missing values.'],
            ['FM-SW-004','Authentication Failure',         'software',      'Security',       'software', 'System or service fails to authenticate users or peer systems.'],
            ['FM-SW-005','Service Unavailable',            'software',      'Availability',   'software', 'Background service or daemon fails to start or stops responding.'],
            ['FM-SW-006','Data Corruption',                'software',      'Data',           'software', 'Stored or transmitted data integrity lost — bitflip, write error, or logic fault.'],
            ['FM-SW-007','CVE / Vulnerability',            'software',      'Security',       'software', 'Known vulnerability identified requiring patch or mitigation.'],
            ['FM-FW-001','Failed Firmware Update',         'firmware',      'Update',         'firmware', 'Firmware flash interrupted or rejected — device may be bricked or degraded.'],
            ['FM-FW-002','Firmware Incompatibility',       'firmware',      'Compatibility',  'firmware', 'Firmware version incompatible with hardware revision or peer system.'],
            ['FM-FW-003','Boot Failure',                   'firmware',      'Startup',        'firmware', 'Device fails to complete boot sequence — bootloader or initialization fault.'],
            ['FM-FW-004','Feature Regression',             'firmware',      'Stability',      'firmware', 'Previously working function broken after firmware update.'],
            ['FM-EN-001','Overtemperature',                'environmental', 'Thermal',        null,       'Component temperature exceeds rated limit — cooling failure or ambient condition.'],
            ['FM-EN-002','Moisture / Water Intrusion',     'environmental', 'Moisture',       null,       'Water or condensation ingress causing corrosion or short circuit.'],
            ['FM-EN-003','Contamination / Debris',         'environmental', 'Contamination',  null,       'Foreign material ingress degrading performance or causing mechanical binding.'],
            ['FM-EN-004','Vibration Damage (External)',    'environmental', 'Vibration',      null,       'Damage caused by external vibration source — vehicle, structure, or adjacent equipment.'],
            ['FM-EN-005','Lightning / ESD Strike',         'environmental', 'Surge',          null,       'Electrostatic discharge or lightning damage to electronics.'],
            ['FM-OP-001','Improper Operation',             'operator',      'Procedure',      null,       'Equipment operated outside of established procedures or parameters.'],
            ['FM-OP-002','Incorrect Configuration',        'operator',      'Config',         null,       'System misconfigured by operator — wrong settings, mode, or parameter.'],
            ['FM-OP-003','Physical Damage (Operator)',     'operator',      'Damage',         null,       'Equipment physically damaged during operator handling or use.'],
            ['FM-WR-001','End of Service Life',            'wear',          'Age',            null,       'Component has reached or exceeded rated operational life.'],
            ['FM-WR-002','Contact / Brush Wear',           'wear',          'Contact',        'hardware', 'Worn electrical contacts or carbon brushes increasing resistance or causing arcing.'],
            ['FM-WR-003','Surface Wear',                   'wear',          'Mechanical',     'hardware', 'Loss of material from friction surfaces — bushings, gears, or slides.'],
            ['FM-CO-001','Galvanic Corrosion',             'corrosion',     'Galvanic',       'hardware', 'Electrochemical corrosion from dissimilar metals in contact with electrolyte.'],
            ['FM-CO-002','Oxidation / Rust',               'corrosion',     'Oxidation',      'hardware', 'Surface oxidation degrading conductivity, sealing, or structural integrity.'],
            ['FM-CO-003','Chemical Corrosion',             'corrosion',     'Chemical',       'hardware', 'Material attack from process fluids, cleaning agents, or atmospheric chemicals.'],
            ['FM-CT-001','Fluid Contamination',            'contamination', 'Fluid',          'hardware', 'Hydraulic, lubrication, or coolant fluid contaminated with particles or water.'],
            ['FM-CT-002','Filter Clogging',                'contamination', 'Filter',         'hardware', 'Filter element blocked reducing flow or pressure below operational limit.'],
            ['FM-GN-001','Unknown / Under Investigation',  'general',       null,             null,       'Failure mode not yet determined — investigation in progress.'],
            ['FM-GN-002','Intermittent Fault',             'general',       'Intermittent',   null,       'Non-reproducible fault occurring randomly — difficult to isolate.'],
            ['FM-GN-003','Multiple / Combined Failure',    'general',       'Combined',       null,       'Two or more simultaneous or cascading failure modes.'],
        ];
    }
}
