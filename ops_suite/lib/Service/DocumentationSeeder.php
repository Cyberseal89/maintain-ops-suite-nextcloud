<?php
declare(strict_types=1);

namespace OCA\OpsSuite\Service;

use OCP\IDBConnection;
use OCP\DB\QueryBuilder\IQueryBuilder;

/**
 * Seeds the MOS Technical Specification and User Manual as S1000D publications
 * inside the system itself. Safe to call multiple times — skips if publications
 * already exist. Triggered from Settings by an administrator.
 */
class DocumentationSeeder {

    public function __construct(private readonly IDBConnection $db) {}

    public function seed(string $uid): array {
        $now = date('Y-m-d H:i:s');

        // ── 1. Check if already seeded ─────────────────────────────────────
        $existing = $this->findDocByCode('MOS-SM-001');
        if ($existing) {
            return ['status' => 'already_seeded', 'message' => 'MOS documentation already exists in the Library.'];
        }

        // ── 2. Create the MOS System asset ─────────────────────────────────
        $assetId = $this->insertAsset([
            'name'          => 'Maintain Ops Suite',
            'asset_type'    => 'software',
            'manufacturer'  => 'Alto Technologies LLC',
            'model'         => 'v3.29.0',
            'status'        => 'active',
            'location'      => 'Nextcloud Server',
            'asset_code'    => 'MOS-SW-001',
            'description'   => 'The Maintain Ops Suite platform itself — anchor for all MOS technical documentation.',
            'created_by'    => $uid,
            'created_at'    => $now,
            'updated_at'    => $now,
        ]);

        // ── 3. Author all Data Modules ──────────────────────────────────────
        $dms = $this->createAllDms($assetId, $uid, $now);

        // ── 4. Assemble publications ────────────────────────────────────────
        $smId = $this->createPublication('MOS-SM-001', 'Maintain Ops Suite — Technical Specification', 'SM', $assetId, $uid, $now);
        $omId = $this->createPublication('MOS-OM-001', 'Maintain Ops Suite — User Manual',             'OM', $assetId, $uid, $now);

        $this->assemblePub($smId, $this->smChapters($dms));
        $this->assemblePub($omId, $this->omChapters($dms));

        return [
            'status'   => 'seeded',
            'message'  => 'MOS Technical Specification (SM) and User Manual (OM) created.',
            'asset_id' => $assetId,
            'sm_id'    => $smId,
            'om_id'    => $omId,
            'dm_count' => count($dms),
        ];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLICATION CHAPTER MAPS
    // ══════════════════════════════════════════════════════════════════════════

    private function smChapters(array $dms): array {
        return [
            ['title' => 'System Overview',         'dms' => [$dms['sm_overview']]],
            ['title' => 'Data Architecture',       'dms' => [$dms['sm_asset_codes'], $dms['sm_dmc'], $dms['sm_data_model']]],
            ['title' => 'Access Control',          'dms' => [$dms['sm_access']]],
            ['title' => 'Module Logic',            'dms' => [$dms['sm_pm_logic'], $dms['sm_def_matrix'], $dms['sm_fmea_chain'], $dms['sm_supply']]],
        ];
    }

    private function omChapters(array $dms): array {
        return [
            ['title' => 'Getting Started',           'dms' => [$dms['om_start']]],
            ['title' => 'Configuration Registry',    'dms' => [$dms['om_assets'], $dms['om_asset_codes']]],
            ['title' => 'Maintenance Management',    'dms' => [$dms['om_pm'], $dms['om_deficiency']]],
            ['title' => 'Safety Operations',         'dms' => [$dms['om_loto']]],
            ['title' => 'Technical Documentation',   'dms' => [$dms['om_dm'], $dms['om_publication']]],
            ['title' => 'Supply Chain',              'dms' => [$dms['om_supply']]],
        ];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DM FACTORY
    // ══════════════════════════════════════════════════════════════════════════

    private function createAllDms(int $assetId, string $uid, string $now): array {
        $dms = [];

        // ── Tech Spec DMs (040 series) ──────────────────────────────────────

        $dms['sm_overview'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040A-A', '040', 'A', 'System Overview & Architecture', [
            ['title',    'MOS-SM-01: System Overview & Architecture', 1],
            ['action',   'Maintain Ops Suite (MOS) is an integrated operations management platform built on the Nextcloud AppFramework. It provides a unified interface for configuration management, preventive maintenance, deficiency tracking, modernization projects, supply chain control, LOTO/safety management, and S1000D technical documentation.', 2],
            ['title',    '1. Platform Architecture', 3],
            ['action',   'MOS is a server-side PHP 8.2 application using the Nextcloud AppFramework (QBMapper ORM, Controller/Service pattern). The frontend is a single-page application delivered as a compiled JavaScript bundle (~14,000+ lines). All data is stored in Nextcloud\'s underlying database (MySQL/MariaDB/PostgreSQL).', 4],
            ['note',     'App ID: ops_suite. All database tables are prefixed with ops_. Nextcloud\'s oc_ table prefix applies at the DB level.', 5],
            ['title',    '2. Core Modules', 6],
            ['tech_char','Configuration Registry|Asset management with digital twin tracking — hardware, software, firmware. Supports IUID/UII, DoD asset identification, and 18-month verification cycles.', 7],
            ['tech_char','Preventive Maintenance|PM procedure scheduling linked to assets. Tracks periodicity, last completed, next due, assigned technician, SOP documents, and S1000D DM linkage.', 8],
            ['tech_char','Deficiency Tracking|Formal deficiency lifecycle management. SEV-1 through SEV-5 severity, full closeout workflow, linked PM and 520-series DM linkage.', 9],
            ['tech_char','Modernization Projects|Five-stage upgrade project lifecycle (Design → Planning → Approval → Execution → Complete) with TDP management.', 10],
            ['tech_char','Supply & Warehouse|NSN/CAGE requisition workflow, inventory management with A/B/C cycle counting, and vendor RFQ generation.', 11],
            ['tech_char','LOTO / Safety|Lockout/Tagout session management with step verification, energy source tracking, label/form printing, and audit reporting.', 12],
            ['tech_char','S1000D Library|Full S1000D data module authoring and publication assembly. Supports info codes 040/200/300/520/720/730/900. IETM viewer with print/PDF.', 13],
            ['tech_char','System Canvas / FMEA|Block diagram system modeling with FMEA worksheet generation, RPN analysis, and RCM decision tracking.', 14],
            ['tech_char','Availability & Gantt|Visual project scheduling within defined availability windows with dependency tracking.', 15],
            ['tech_char','Work Packages|Bundle PMs and modernizations for external quoting. Auto-generates RFQ exports.', 16],
            ['title',    '3. Technology Stack', 17],
            ['tech_char','Server Runtime|PHP 8.2 — Nextcloud AppFramework', 18],
            ['tech_char','Database ORM|Nextcloud QBMapper (IQueryBuilder)', 19],
            ['tech_char','Frontend|Vanilla JavaScript ES6 — Single compiled bundle', 20],
            ['tech_char','Database|MySQL 8.0+ / MariaDB 10.5+ / PostgreSQL 14+', 21],
            ['tech_char','Nextcloud Compatibility|NC 27 – 33', 22],
            ['tech_char','Authentication|Nextcloud session — CSRF token on all state-changing API calls', 23],
        ]);

        $dms['sm_asset_codes'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040B-A', '040', 'B', 'Asset Code Structure & Field Definitions', [
            ['title',    'MOS-SM-02: Asset Code Structure', 1],
            ['action',   'The asset_code field provides a human-readable, structured identifier for each configuration item. It is separate from the system-assigned asset_id (numeric auto-increment) and the asset_id_label (formatted as ASSET-NNNN).', 2],
            ['note',     'Asset codes are optional but strongly recommended for any organization following a formal configuration management plan. They become the basis for DMC generation.', 3],
            ['title',    '1. Recommended Asset Code Format', 4],
            ['action',   'The recommended format is: {SITE}-{TYPE}-{SEQ}', 5],
            ['tech_char','SITE|2–4 character site or platform identifier (e.g., PLT1, SITE, BLDG)', 6],
            ['tech_char','TYPE|Equipment type abbreviation (e.g., GEN = Generator, UPS, RTR = Router, SW = Switch, HVAC, PMP = Pump)', 7],
            ['tech_char','SEQ|Zero-padded sequence number within that type at that site (e.g., 001, 002)', 8],
            ['action',   'Example: PLT1-GEN-001 = Platform 1, Generator #1. PLT1-UPS-001 = Platform 1, UPS #1.', 9],
            ['title',    '2. Key Asset Fields', 10],
            ['tech_char','asset_id|System-assigned numeric primary key. Never changes once assigned.', 11],
            ['tech_char','asset_id_label|Display label formatted as ASSET-{NNNN}. Auto-generated. Used in DMC construction.', 12],
            ['tech_char','asset_code|User-defined structured code per the format above.', 13],
            ['tech_char','name|Human-readable equipment name (e.g., "Primary Generator Unit 1").', 14],
            ['tech_char','asset_type|Enumerated type: hardware | software | firmware | infrastructure | vehicle | facility.', 15],
            ['tech_char','status|operational | degraded | offline | decommissioned | spare.', 16],
            ['tech_char','manufacturer|OEM or original manufacturer name.', 17],
            ['tech_char','model|Model number or designation.', 18],
            ['tech_char','serial_number|Manufacturer serial number — used for IUID/UII compliance.', 19],
            ['tech_char','location|Physical location description.', 20],
            ['tech_char','ip_address|Management IP address if applicable (network assets).', 21],
            ['tech_char','warranty_expiry|Warranty expiration date (YYYY-MM-DD).', 22],
            ['tech_char','last_verified_at|Date of last physical verification. System flags assets overdue at 18 months.', 23],
            ['tech_char','criticality_code|CR (Critical) | DE (Degraded) | RD (Redundant) | SP (Support) | AD (Administrative).', 24],
            ['tech_char','tdp_source_asset_id|Links to another asset\'s TDP folder. Use for identical equipment sharing documentation.', 25],
            ['title',    '3. IUID / UII Compliance', 26],
            ['action',   'For DoD and defense contractor use, the serial_number and manufacturer fields feed IUID (Item Unique Identification) compliance. Assets requiring UII tracking should have serial numbers populated. The system tracks the manufacturer, model, and serial_number triplet as the basis for UII construction per MIL-STD-130.', 27],
        ]);

        $dms['sm_dmc'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040C-A', '040', 'C', 'S1000D DMC Numbering Convention in MOS', [
            ['title',    'MOS-SM-03: DMC Numbering Convention', 1],
            ['action',   'MOS generates Data Module Codes (DMCs) following the S1000D Issue 6 naming structure adapted for the platform. The DMC uniquely identifies every data module and is stored in the dmc field of ops_documents.', 2],
            ['title',    '1. DMC Structure', 3],
            ['action',   'Format: DMC-{ModelIdentCode}-{SystemDiffCode}-{AssetSNS}-{SubsystemCode}-{InfoCode}{InfoCodeVariant}-{ItemLocationCode}', 4],
            ['tech_char','ModelIdentCode|ALTO — Alto Technologies LLC model identification code.', 5],
            ['tech_char','SystemDiffCode|A — standard system differentiator.', 6],
            ['tech_char','AssetSNS|Derived from the linked asset\'s asset_code field, uppercased, non-alphanumeric characters stripped. E.g., PLT1-GEN-001 → PLT1GEN001.', 7],
            ['tech_char','SubsystemCode|00 — not subdivided at subsystem level in current implementation.', 8],
            ['tech_char','InfoCode|3-digit S1000D info code identifying DM type (see section 2).', 9],
            ['tech_char','InfoCodeVariant|A–Z — differentiates multiple DMs of the same type for the same asset. Auto-assigned on creation.', 10],
            ['tech_char','ItemLocationCode|A — standard item location.', 11],
            ['action',   'Example: DMC-ALTO-A-PLT1GEN001-00-200A-A = Maintenance Procedure, first DM, for asset PLT1-GEN-001.', 12],
            ['title',    '2. Info Code Definitions', 13],
            ['tech_char','040|Description and Operation — system/component description, technical characteristics, theory of operation.', 14],
            ['tech_char','200|Maintenance Procedure — scheduled and unscheduled maintenance procedures.', 15],
            ['tech_char','300|Illustrated Parts Data — parts list with NSN, part numbers, quantities, and units.', 16],
            ['tech_char','520|Troubleshooting — fault isolation procedures, sequential diagnostic steps. Links to Deficiencies.', 17],
            ['tech_char','720|Removal Procedure — step-by-step component removal. Links to PM Procedures.', 18],
            ['tech_char','730|Installation Procedure — step-by-step component installation. Links to PM Procedures.', 19],
            ['tech_char','900|Fault Description — fault reference data, fault codes, effects, probable causes. Links to FMEA.', 20],
            ['title',    '3. Issue and In-Work Numbering', 21],
            ['tech_char','issue_number|Starts at 1. Advances by 1 each time a DM is formally revised and released.', 22],
            ['tech_char','in_work_number|0 = Released. >0 = In-Work draft (not published). Resets to 0 on release.', 23],
            ['tech_char','dmc_review_flag|Set to true when issue_number advances. Cleared when the linked PM or publication acknowledges the change.', 24],
            ['note',     'When a DM\'s issue number advances, all publications containing that DM are automatically flagged with re_issue_required = true.', 25],
        ]);

        $dms['sm_access'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040D-A', '040', 'D', 'Platform, Group & Role Access Model', [
            ['title',    'MOS-SM-04: Access Control Model', 1],
            ['action',   'MOS uses Nextcloud\'s group-based access control. Each role is mapped to a Nextcloud group in Settings. The system resolves the user\'s effective role at login and caches it for the session.', 2],
            ['title',    '1. Role Hierarchy', 3],
            ['tech_char','Administrator|Full system access — all CRUD, settings, CCB approval, platform management.', 4],
            ['tech_char','Multi-Site Manager|Cross-site oversight — admin capabilities without Nextcloud admin.', 5],
            ['tech_char','Platform Manager|Platform-scoped — manages a site, approves CCB transitions.', 6],
            ['tech_char','Shop Supervisor|Shop-scoped — full write within assigned shops.', 7],
            ['tech_char','Lead Technician|Senior tech — full write, shop-scoped.', 8],
            ['tech_char','Technician|Standard write — create/close work, log deficiencies.', 9],
            ['tech_char','Quality Inspector|Write for inspections and deficiency closeout.', 10],
            ['tech_char','Safety Officer|Write for LOTO and safety records.', 11],
            ['tech_char','Logistics Coordinator|Write for supply requests and inventory.', 12],
            ['tech_char','Maintenance Planner|Write for PM scheduling and work packages.', 13],
            ['tech_char','Contractor|Limited write — log deficiencies and PM closeout only.', 14],
            ['tech_char','Read Only|View only — no create, edit, or delete.', 15],
            ['title',    '2. Publication Access', 16],
            ['action',   'The S1000D Library uses a simplified two-level gate. The canWrite() function (cached per session) returns true for any role with write access. Technicians and Read Only users land on the IETM view by default. The Builder tab is only visible to users where canWrite() returns true.', 17],
            ['title',    '3. Platform Scoping', 18],
            ['action',   'Each record in MOS can carry a platform_id linking it to a named platform (site, location, or organizational unit). Platforms are linked to Nextcloud groups. Users only see data for their assigned platform group unless they hold a cross-platform role.', 19],
            ['note',     'Nextcloud administrators always receive Administrator access regardless of group configuration.', 20],
        ]);

        $dms['sm_pm_logic'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040E-A', '040', 'E', 'PM Scheduling Logic & Due Date Calculation', [
            ['title',    'MOS-SM-05: PM Scheduling Logic', 1],
            ['action',   'The PM module calculates next_due automatically from last_completed and periodicity. The system compares next_due to today\'s date to determine overdue status and drives dashboard alerts.', 2],
            ['title',    '1. Periodicity Values', 3],
            ['tech_char','daily|Next due = last_completed + 1 day.', 4],
            ['tech_char','weekly|Next due = last_completed + 7 days.', 5],
            ['tech_char','monthly|Next due = last_completed + 1 calendar month.', 6],
            ['tech_char','quarterly|Next due = last_completed + 3 calendar months.', 7],
            ['tech_char','semi_annual|Next due = last_completed + 6 calendar months.', 8],
            ['tech_char','annual|Next due = last_completed + 12 calendar months.', 9],
            ['title',    '2. Overdue Logic', 10],
            ['action',   'A PM is flagged overdue when next_due < today\'s date. The dashboard Readiness tile counts overdue PMs and displays a warning if any SEV-1 or SEV-2 linked deficiencies are open. The PM list shows overdue items with a red badge.', 11],
            ['title',    '3. Auto-Deficiency on Fail', 12],
            ['action',   'If create_deficiency_on_fail = 1 on a PM procedure, the system automatically opens a linked deficiency when the PM is marked failed during closeout. The deficiency inherits the asset_id and is assigned to the same technician.', 13],
            ['title',    '4. DM Review Flag', 14],
            ['action',   'When a linked 200/720/730 DM advances its issue number, the PM procedure\'s dmc_review_flag is set. A banner appears in the PM detail view prompting the technician to review the updated procedure before completing the next PM.', 15],
        ]);

        $dms['sm_def_matrix'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040F-A', '040', 'F', 'Deficiency Severity Matrix & Status Workflow', [
            ['title',    'MOS-SM-06: Deficiency Severity & Workflow', 1],
            ['title',    '1. Severity Matrix', 2],
            ['tech_char','SEV-1|Mission Critical — asset non-operational; immediate action required. Highest priority.', 3],
            ['tech_char','SEV-2|Major Degradation — asset operating in degraded mode; significant risk.', 4],
            ['tech_char','SEV-3|Moderate — asset operational but deficiency requires scheduled correction.', 5],
            ['tech_char','SEV-4|Minor — cosmetic or low-impact; plan correction in next maintenance window.', 6],
            ['tech_char','SEV-5|Observation — document only; no immediate action required.', 7],
            ['title',    '2. Status Workflow', 8],
            ['tech_char','open|Initial state when deficiency is logged.', 9],
            ['tech_char','in_work|Actively being investigated or corrected.', 10],
            ['tech_char','waiting_parts|Corrective action identified; awaiting parts from supply.', 11],
            ['tech_char','waiting_approval|Corrective action pending CCB or management approval.', 12],
            ['tech_char','closed|Deficiency resolved — root cause, corrective action, and actual costs recorded.', 13],
            ['title',    '3. Closeout Requirements', 14],
            ['action',   'Closing a deficiency requires: root_cause, corrective_action, actual_parts_cost, actual_labor_cost, actual_man_days, and reviewed_by fields to be populated. The system records closed_by and closed_at automatically on status change to closed.', 15],
            ['title',    '4. S1000D Linkage', 16],
            ['action',   'Each deficiency can link to a 520-series (Troubleshooting) Data Module via document_id. This provides the technician a direct link to the authoritative fault isolation procedure for the asset. The linked DM appears as a chip in the Linked Configuration section of the deficiency detail.', 17],
        ]);

        $dms['sm_fmea_chain'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040G-A', '040', 'G', 'FMEA → 900 → 520 → Deficiency Linkage Chain', [
            ['title',    'MOS-SM-07: Analytical Linkage Chain', 1],
            ['action',   'MOS implements a full analytical chain from engineering failure analysis through field troubleshooting. Each level produces formal documentation that feeds the next.', 2],
            ['title',    '1. FMEA (Failure Mode and Effects Analysis)', 3],
            ['action',   'FMEA worksheets live on System Canvas nodes. An engineer analyzes each component\'s failure modes, effects, severity (S), probability (P), and detectability (D). The Risk Priority Number (RPN = S × P × D) drives prioritization. FMEA entries above RPN 200 are Critical; above 100 are High.', 4],
            ['title',    '2. 900-Series DM — Fault Description', 5],
            ['action',   'The 900-series Data Module documents the maintenance-facing view of the failure modes identified in the FMEA. It lists known fault codes, symptoms, probable causes, effects, and pointers to corrective procedures. It is the reference document a technician consults when a fault manifests. Link from FMEA worksheet → 900 DM via the document_id field on ops_fmea_worksheets.', 6],
            ['title',    '3. 520-Series DM — Troubleshooting Procedure', 7],
            ['action',   'The 520-series Data Module is procedural — it walks the technician step-by-step through fault isolation. Each step has a check, a pass result, and a fail result leading to the next step or corrective action. Link from Deficiency → 520 DM via the document_id field on ops_deficiencies.', 8],
            ['title',    '4. Deficiency', 9],
            ['action',   'A deficiency represents a live instance of a fault being worked in the field. It captures discovery method, severity, troubleshooting history, linked PM (if found during PM), linked 520 DM (the procedure used to isolate it), root cause, corrective action, and actual costs.', 10],
            ['note',     'Chain summary: FMEA (engineering analysis) → 900 DM (known fault reference) → 520 DM (how to find it) → Deficiency (live fault record) → 200/720/730 DM (how to fix it).', 11],
        ]);

        $dms['sm_supply'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040H-A', '040', 'H', 'Supply Requisition & Inventory Control Rules', [
            ['title',    'MOS-SM-08: Supply & Inventory Control', 1],
            ['title',    '1. Requisition Workflow', 2],
            ['tech_char','requested|Initial state — requisition submitted by technician or auto-generated.', 3],
            ['tech_char','approved|Approved by supervisor or logistics coordinator.', 4],
            ['tech_char','ordered|Purchase order placed with vendor.', 5],
            ['tech_char','received|Item received and added to inventory.', 6],
            ['tech_char','cancelled|Requisition voided.', 7],
            ['action',   'SRFQ numbers are auto-generated in the format SRFQ-YYYYNNN (year + 3-digit sequence). Professional RFQ exports include line items, NSN, CAGE code, quantity, unit of measure, cost estimate, terms, and signature blocks.', 8],
            ['title',    '2. Inventory Management', 9],
            ['tech_char','A-class|High-value or high-turnover items — cycle counted monthly.', 10],
            ['tech_char','B-class|Medium-value/turnover — cycle counted quarterly.', 11],
            ['tech_char','C-class|Low-value/turnover — cycle counted annually.', 12],
            ['action',   'Stock transactions are recorded for all movements: receive, issue, return, and adjust. Each transaction records quantity, unit cost, performed_by, and reference (requisition ID or manual note).', 13],
            ['title',    '3. Quarterly Revalidation', 14],
            ['action',   'Open requisitions older than 90 days are flagged for revalidation. A revalidation_required flag is set and a banner appears on the requisition. The logistics coordinator must confirm the requirement is still valid or cancel the requisition to prevent stale open orders.', 15],
        ]);

        $dms['sm_data_model'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-300A-A', '300', 'A', 'Data Model Reference — Key Tables & Fields', [
            ['part_item', json_encode(['item'=>'1','nsn'=>'','part_num'=>'ops_assets','nomenclature'=>'Configuration items — hardware, software, firmware, infrastructure','qty'=>1,'unit'=>'TABLE','remarks'=>'Primary asset registry. asset_code, asset_type, status, criticality_code, last_verified_at, tdp_source_asset_id']), 1],
            ['part_item', json_encode(['item'=>'2','nsn'=>'','part_num'=>'ops_procedures','nomenclature'=>'PM procedure definitions linked to assets','qty'=>1,'unit'=>'TABLE','remarks'=>'document_id → 200/720/730 DM. periodicity, next_due, last_completed, dmc_review_flag']), 2],
            ['part_item', json_encode(['item'=>'3','nsn'=>'','part_num'=>'ops_deficiencies','nomenclature'=>'Deficiency lifecycle records','qty'=>1,'unit'=>'TABLE','remarks'=>'document_id → 520 DM. severity, status, linked_procedure_id, failure_mode_id, root_cause, corrective_action']), 3],
            ['part_item', json_encode(['item'=>'4','nsn'=>'','part_num'=>'ops_documents','nomenclature'=>'Unified document & DM library','qty'=>1,'unit'=>'TABLE','remarks'=>'doc_type: external|data_module|publication. info_code, dmc, issue_number, in_work_number, pub_code, pub_type']), 4],
            ['part_item', json_encode(['item'=>'5','nsn'=>'','part_num'=>'ops_dm_steps','nomenclature'=>'S1000D data module content steps','qty'=>1,'unit'=>'TABLE','remarks'=>'step_type: title|action|warning|caution|note|tech_char|expected_result|substep|symptom|probable_cause|corrective_action|part_item']), 5],
            ['part_item', json_encode(['item'=>'6','nsn'=>'','part_num'=>'ops_publication_dms','nomenclature'=>'Publication → DM junction table','qty'=>1,'unit'=>'TABLE','remarks'=>'publication_id → ops_documents (doc_type=publication). chapter, section, sequence, chapter_title']), 6],
            ['part_item', json_encode(['item'=>'7','nsn'=>'','part_num'=>'ops_fmea_worksheets','nomenclature'=>'FMEA worksheets per canvas node','qty'=>1,'unit'=>'TABLE','remarks'=>'document_id → 900 DM. canvas_id, node_id, asset_id, doc_id (published report)']), 7],
            ['part_item', json_encode(['item'=>'8','nsn'=>'','part_num'=>'ops_canvases','nomenclature'=>'System architecture diagrams','qty'=>1,'unit'=>'TABLE','remarks'=>'drawing_doc_id → external document. is_live flag for live status overlays']), 8],
            ['part_item', json_encode(['item'=>'9','nsn'=>'','part_num'=>'ops_supply_requests','nomenclature'=>'Supply requisitions','qty'=>1,'unit'=>'TABLE','remarks'=>'srfq_number, status: requested|approved|ordered|received|cancelled. revalidation_required']), 9],
            ['part_item', json_encode(['item'=>'10','nsn'=>'','part_num'=>'ops_inventory','nomenclature'=>'Warehouse inventory items','qty'=>1,'unit'=>'TABLE','remarks'=>'cycle_class: A|B|C. reorder_point, qty_on_hand. Linked to supply_items via part_number/nsn']), 10],
            ['part_item', json_encode(['item'=>'11','nsn'=>'','part_num'=>'ops_loto_sessions','nomenclature'=>'LOTO/Tagout safety sessions','qty'=>1,'unit'=>'TABLE','remarks'=>'session_type: lockout|pm|deficiency. steps_completed (JSON), energy_sources (JSON), tag_number, lock_number']), 11],
            ['part_item', json_encode(['item'=>'12','nsn'=>'','part_num'=>'ops_modernizations','nomenclature'=>'Asset upgrade/modernization projects','qty'=>1,'unit'=>'TABLE','remarks'=>'stage: design|planning|approval|execution|complete. approved_at auto-set on stage transition.']), 12],
        ]);

        // ── User Manual DMs ─────────────────────────────────────────────────

        $dms['om_start'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-040I-A', '040', 'I', 'Getting Started — Navigation & Roles', [
            ['title',    'MOS-OM-01: Getting Started', 1],
            ['action',   'Maintain Ops Suite is accessed through your Nextcloud instance. Click the MOS icon in the Nextcloud top navigation bar. The application opens in a full-screen single-page interface with a left sidebar navigation.', 2],
            ['title',    '1. Sidebar Navigation', 3],
            ['tech_char','Dashboard|Overview of readiness, overdue PMs, open deficiencies, and recent activity.', 4],
            ['tech_char','Assets|Configuration registry — view, create, and manage assets.', 5],
            ['tech_char','PM Procedures|Preventive maintenance scheduling and completion.', 6],
            ['tech_char','Deficiencies|Deficiency logging, tracking, and closeout.', 7],
            ['tech_char','Modernizations|Upgrade project management and TDP control.', 8],
            ['tech_char','Supply|Requisitions, inventory, and vendor RFQ.', 9],
            ['tech_char','LOTO|Lockout/Tagout session management.', 10],
            ['tech_char','Library|S1000D document and publication management.', 11],
            ['tech_char','System Canvas|Architecture diagrams and FMEA worksheets.', 12],
            ['tech_char','Availability|Gantt-based availability window and work scheduling.', 13],
            ['tech_char','Settings|Access control, organization settings, and admin tools (admin only).', 14],
            ['title',    '2. Understanding Your Role', 15],
            ['action',   'Your role determines what you can create, edit, and delete. Contact your administrator if you believe your role is incorrect. Roles are mapped to Nextcloud groups — your role changes when your group membership changes.', 16],
            ['note',     'If you can see the interface but cannot create or edit records, you have Read Only access. Administrators can update your group assignment in Nextcloud\'s user management.', 17],
        ]);

        $dms['om_assets'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200A-A', '200', 'A', 'Creating & Managing Assets', [
            ['title',    'MOS-OM-02: Creating & Managing Assets', 1],
            ['warning',  'WARNING: Assets are the foundation of all MOS data. Incorrect asset records will propagate errors to PMs, deficiencies, and documentation. Verify asset information against the equipment nameplate and procurement records before creating.', 2],
            ['title',    '1. Creating a New Asset', 3],
            ['action',   'Step 1 — Navigate to Assets in the left sidebar.', 4],
            ['action',   'Step 2 — Click "+ Add Asset" in the page header.', 5],
            ['action',   'Step 3 — Complete the required fields: Name, Asset Type, and Status.', 6],
            ['action',   'Step 4 — Enter optional fields: Asset Code (see DM-03), Manufacturer, Model, Serial Number, Location, and IP Address.', 7],
            ['action',   'Step 5 — Set Criticality Code if applicable (CR/DE/RD/SP/AD).', 8],
            ['action',   'Step 6 — Click "Create Asset".', 9],
            ['expected_result','The asset appears in the asset list with a system-assigned ASSET-NNNN label.', 10],
            ['title',    '2. Asset Verification', 11],
            ['action',   'Step 1 — Open the asset detail by clicking the asset name.', 12],
            ['action',   'Step 2 — Click "✓ Verify" in the asset header.', 13],
            ['action',   'Step 3 — Confirm the physical verification.', 14],
            ['expected_result','last_verified_at updates to today. The 18-month verification clock resets.', 15],
            ['note',     'Assets not verified within 18 months are flagged on the Dashboard with a Verification Due warning.', 16],
            ['title',    '3. Asset Hierarchy', 17],
            ['action',   'To set an asset as a child of another (subsystem), open the asset form and select a Parent Asset. Child assets inherit the TDP source of their parent if tdp_source_asset_id is set on the parent.', 18],
        ]);

        $dms['om_asset_codes'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200B-A', '200', 'B', 'Building an Asset Code', [
            ['title',    'MOS-OM-03: Building an Asset Code', 1],
            ['action',   'The asset_code field gives your equipment a structured, human-readable identifier. It is used in DMC generation, reporting, and cross-referencing. Use a consistent format across your organization.', 2],
            ['title',    '1. Recommended Format: {SITE}-{TYPE}-{SEQ}', 3],
            ['action',   'Step 1 — Determine your site or platform code. Use 2–4 uppercase characters (e.g., PLT1, BLDG, SITE).', 4],
            ['action',   'Step 2 — Choose a type abbreviation for the equipment category (e.g., GEN, UPS, RTR, SW, HVAC, PMP, SRV, NET).', 5],
            ['action',   'Step 3 — Assign a zero-padded sequence number starting at 001.', 6],
            ['action',   'Step 4 — Combine: {SITE}-{TYPE}-{SEQ}. Example: PLT1-GEN-001.', 7],
            ['action',   'Step 5 — Enter this value in the Asset Code field when creating or editing the asset.', 8],
            ['expected_result','When you create a Data Module for this asset, the DMC auto-generates using this code.', 9],
            ['title',    '2. Examples', 10],
            ['tech_char','PLT1-GEN-001|Platform 1, Primary Generator, Unit 1', 11],
            ['tech_char','PLT1-UPS-001|Platform 1, UPS System, Unit 1', 12],
            ['tech_char','PLT1-RTR-001|Platform 1, Core Router, Unit 1', 13],
            ['tech_char','PLT1-SW-001|Platform 1, Distribution Switch, Unit 1', 14],
            ['tech_char','PLT1-HVAC-001|Platform 1, HVAC System, Unit 1', 15],
            ['note',     'Avoid special characters other than hyphens. The DMC generator strips non-alphanumeric characters, so PLT1-GEN-001 becomes PLT1GEN001 in the DMC.', 16],
        ]);

        $dms['om_pm'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200C-A', '200', 'C', 'Scheduling & Completing a PM', [
            ['title',    'MOS-OM-04: Scheduling & Completing a PM', 1],
            ['title',    '1. Creating a PM Procedure', 2],
            ['action',   'Step 1 — Navigate to PM Procedures.', 3],
            ['action',   'Step 2 — Click "+ Add PM Procedure".', 4],
            ['action',   'Step 3 — Enter the procedure name (e.g., "Monthly Generator Oil Check").', 5],
            ['action',   'Step 4 — Select the linked asset.', 6],
            ['action',   'Step 5 — Select the category (Mechanical, Electrical, etc.) and periodicity (Monthly, Quarterly, Annual, etc.).', 7],
            ['action',   'Step 6 — Set Last Completed date if the PM has been done previously.', 8],
            ['action',   'Step 7 — Optionally link an SOP document (Browse for a file in PMS Procedures folder) or an S1000D Procedure DM (200/720/730).', 9],
            ['action',   'Step 8 — Assign to a technician and set Estimated Hours.', 10],
            ['action',   'Step 9 — Click "Create PM Procedure".', 11],
            ['expected_result','Next Due date auto-calculates from Last Completed + Periodicity. The PM appears in the schedule list.', 12],
            ['title',    '2. Completing a PM', 13],
            ['action',   'Step 1 — Open the PM Procedure from the list.', 14],
            ['action',   'Step 2 — Click "✓ Complete PM".', 15],
            ['action',   'Step 3 — Enter actual hours, parts cost, labor cost, and completion notes.', 16],
            ['action',   'Step 4 — Set result to Pass or Fail.', 17],
            ['action',   'Step 5 — Click "Submit Completion".', 18],
            ['expected_result','Last Completed updates to today. Next Due recalculates. If result is Fail and auto-deficiency is enabled, a deficiency is opened automatically.', 19],
            ['note',     'If the linked DM has a dmc_review_flag, a banner prompts you to review the updated procedure before completing.', 20],
        ]);

        $dms['om_deficiency'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200D-A', '200', 'D', 'Logging & Closing a Deficiency', [
            ['title',    'MOS-OM-05: Logging & Closing a Deficiency', 1],
            ['title',    '1. Logging a Deficiency', 2],
            ['action',   'Step 1 — Navigate to Deficiencies.', 3],
            ['action',   'Step 2 — Click "+ Log Deficiency".', 4],
            ['action',   'Step 3 — Select the affected asset.', 5],
            ['action',   'Step 4 — Enter a summary (one-line description of the fault).', 6],
            ['action',   'Step 5 — Select Severity (SEV-1 through SEV-5).', 7],
            ['action',   'Step 6 — Select Discovery Method (Walkdown, PM Procedure, User Report, etc.).', 8],
            ['action',   'Step 7 — Enter full description, requirements to resolve, and estimated costs.', 9],
            ['action',   'Step 8 — Assign to a technician and set target completion if known.', 10],
            ['action',   'Step 9 — Optionally link a 520 Troubleshooting DM for fault isolation guidance.', 11],
            ['action',   'Step 10 — Click "Log Deficiency".', 12],
            ['expected_result','Deficiency is assigned a DEF-NNNN number and appears in the open deficiency list.', 13],
            ['title',    '2. Working a Deficiency', 14],
            ['action',   'Update status to "In Work" when investigation begins. Add troubleshooting history entries to document findings. Link supply requests for required parts.', 15],
            ['title',    '3. Closing a Deficiency', 16],
            ['caution',  'CAUTION: All required closeout fields must be completed before the system will accept closure. Incomplete closeouts are rejected.', 17],
            ['action',   'Step 1 — Open the deficiency detail.', 18],
            ['action',   'Step 2 — Click "✓ Close".', 19],
            ['action',   'Step 3 — Enter Root Cause, Corrective Action, Actual Parts Cost, Actual Labor Cost, and Actual Man-Days.', 20],
            ['action',   'Step 4 — Enter Reviewed By (name or UID of the person verifying the closeout).', 21],
            ['action',   'Step 5 — Click "Close Deficiency".', 22],
            ['expected_result','Status changes to closed. closed_by and closed_at are recorded. The deficiency moves to the Closed filter in the list.', 23],
        ]);

        $dms['om_loto'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200E-A', '200', 'E', 'Running a LOTO Session', [
            ['title',    'MOS-OM-06: Running a LOTO Session', 1],
            ['warning',  'WARNING: MOS LOTO records document compliance but do NOT replace physical lockout/tagout actions. Always perform physical energy isolation per your site\'s OSHA 29 CFR 1910.147 procedures before and after using this system.', 2],
            ['title',    '1. Starting a LOTO Session', 3],
            ['action',   'Step 1 — Navigate to LOTO.', 4],
            ['action',   'Step 2 — Click "+ New Session".', 5],
            ['action',   'Step 3 — Select the equipment/asset.', 6],
            ['action',   'Step 4 — Select session type: Lockout, PM Tagout, or Deficiency Tagout.', 7],
            ['action',   'Step 5 — Enter Tag Number and Lock Number.', 8],
            ['action',   'Step 6 — Select all applicable energy sources (Electrical, Hydraulic, Pneumatic, etc.).', 9],
            ['action',   'Step 7 — Enter Authorized By and Expected Release.', 10],
            ['action',   'Step 8 — Click "Start Session".', 11],
            ['expected_result','Session is created in Active status. LOTO checklist steps appear.', 12],
            ['title',    '2. Completing LOTO Steps', 13],
            ['action',   'Work through each step in the checklist, checking off each item as physically completed. Steps include: notify affected personnel, identify energy sources, isolate energy, apply lockout devices, release stored energy, verify isolation, and apply danger tags.', 14],
            ['title',    '3. Releasing a LOTO Session', 15],
            ['action',   'Step 1 — Verify all steps are completed and personnel are clear.', 16],
            ['action',   'Step 2 — Open the active session.', 17],
            ['action',   'Step 3 — Click "Release Session".', 18],
            ['action',   'Step 4 — Confirm the release.', 19],
            ['expected_result','Session status changes to Released with timestamp. The session moves to the completed list.', 20],
            ['note',     'Print the LOTO Form ("🖨 Print Form") for a hard-copy record. Print the LOTO Label ("🏷 Print Label") to affix to the equipment.', 21],
        ]);

        $dms['om_dm'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200F-A', '200', 'F', 'Authoring a Data Module', [
            ['title',    'MOS-OM-07: Authoring a Data Module', 1],
            ['action',   'Data Modules (DMs) are the atomic unit of S1000D technical content. Each DM covers one subject for one asset with one info code. They are assembled into Publications for delivery.', 2],
            ['title',    '1. Creating a Data Module', 3],
            ['action',   'Step 1 — Navigate to Library.', 4],
            ['action',   'Step 2 — Click "+ Add to Library".', 5],
            ['action',   'Step 3 — Select "📘 Data Module".', 6],
            ['action',   'Step 4 — Select the linked asset.', 7],
            ['action',   'Step 5 — Select the Info Code (040/200/300/520/720/730/900). The system shows a description of each type.', 8],
            ['action',   'Step 6 — Enter the title for this DM.', 9],
            ['action',   'Step 7 — Click "Create Data Module".', 10],
            ['expected_result','The DM is created with a DMC auto-generated from the asset code and info code. The DM opens with a pre-populated S1000D template for the selected info code type.', 11],
            ['title',    '2. Editing DM Content', 12],
            ['action',   'Step 1 — Open the DM from the Library list.', 13],
            ['action',   'Step 2 — Click "✏ Edit Content".', 14],
            ['action',   'Step 3 — The focus editor opens showing all steps in the template.', 15],
            ['action',   'Step 4 — Click any step to edit its text. Replace bracketed placeholder text with actual content.', 16],
            ['action',   'Step 5 — Use the step type buttons to add new steps of the correct type (Title, Warning, Caution, Note, Action, etc.).', 17],
            ['action',   'Step 6 — Click "Save" when done.', 18],
            ['title',    '3. Releasing a DM', 19],
            ['action',   'When the DM content is finalized, open the DM detail and click "✏ Edit" → set "In-Work" toggle OFF → "Save & Advance". This increments the issue number and sets in_work_number to 0 (Released).', 20],
            ['note',     'All publications containing this DM will be flagged with re_issue_required = true when the issue advances. Review and re-release affected publications.', 21],
        ]);

        $dms['om_publication'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200G-A', '200', 'G', 'Building & Publishing a Technical Manual', [
            ['title',    'MOS-OM-08: Building & Publishing a Technical Manual', 1],
            ['action',   'A Publication assembles multiple Data Modules into a complete technical manual (Maintenance Manual, Operator Manual, IPD, etc.) delivered as an Interactive Electronic Technical Manual (IETM).', 2],
            ['title',    '1. Creating a Publication', 3],
            ['action',   'Step 1 — Navigate to Library.', 4],
            ['action',   'Step 2 — Click "+ Add to Library".', 5],
            ['action',   'Step 3 — Select "📖 Publication".', 6],
            ['action',   'Step 4 — Enter the publication title, pub code (e.g., MOS-SM-001), and select pub type (MM, FM, IPD, OM, SM).', 7],
            ['action',   'Step 5 — Click "Create Publication".', 8],
            ['expected_result','Publication opens on the Builder tab (write users) or IETM tab (read users).', 9],
            ['title',    '2. Assembling the Manual', 10],
            ['action',   'Step 1 — In the Builder tab, click "+ Chapter" to add the first chapter. Enter a chapter title.', 11],
            ['action',   'Step 2 — Click "+ Add DM" on the chapter to arm it (the chapter highlights purple).', 12],
            ['action',   'Step 3 — Click a Data Module in the left panel to add it to the armed chapter.', 13],
            ['action',   'Step 4 — Repeat for each chapter and DM.', 14],
            ['action',   'Step 5 — Use ↑ ↓ arrows to reorder DMs within a chapter.', 15],
            ['action',   'Step 6 — Click "🚀 Release Issue N" to release the publication.', 16],
            ['expected_result','Publication issue number advances. Status changes to Released.', 17],
            ['title',    '3. Viewing as IETM', 18],
            ['action',   'Click the "📖 IETM View" tab. The manual renders as a structured document with left-side navigation, chapter headings, and formatted DM content. Click "🖨 Print / Save PDF" to open the print dialog.', 19],
            ['note',     'The IETM opens in a new window. Your browser\'s print dialog can save to PDF. Allow popups for this site if the window is blocked.', 20],
        ]);

        $dms['om_supply'] = $this->createDm($assetId, $uid, $now,
            'DMC-ALTO-A-MOSSW001-00-200H-A', '200', 'H', 'Processing a Supply Requisition', [
            ['title',    'MOS-OM-09: Processing a Supply Requisition', 1],
            ['title',    '1. Creating a Requisition', 2],
            ['action',   'Step 1 — Navigate to Supply.', 3],
            ['action',   'Step 2 — Click "+ New Request".', 4],
            ['action',   'Step 3 — Select the linked asset (what the part is for).', 5],
            ['action',   'Step 4 — Enter part details: NSN, CAGE code, Part Number, Nomenclature, Quantity, and Unit of Measure.', 6],
            ['action',   'Step 5 — Enter the estimated unit cost.', 7],
            ['action',   'Step 6 — Add justification/notes and set priority.', 8],
            ['action',   'Step 7 — Click "Submit Request".', 9],
            ['expected_result','Requisition is assigned an SRFQ-YYYYNNN number and enters Requested status.', 10],
            ['title',    '2. Approving & Ordering', 11],
            ['action',   'A logistics coordinator or supervisor reviews the request. Click "Approve" to advance to Approved. Click "Mark Ordered" when the PO is placed. The "📄 RFQ Export" button generates a printable vendor RFQ.', 12],
            ['title',    '3. Receiving Parts', 13],
            ['action',   'Step 1 — When parts arrive, open the requisition.', 14],
            ['action',   'Step 2 — Click "Mark Received".', 15],
            ['action',   'Step 3 — Enter actual quantity received and actual unit cost.', 16],
            ['action',   'Step 4 — Confirm receipt.', 17],
            ['expected_result','Requisition status changes to Received. If the part is tracked in inventory, stock on hand updates automatically.', 18],
            ['note',     'Requisitions open longer than 90 days are flagged for revalidation. A banner appears requiring the coordinator to confirm the requirement is still active.', 19],
        ]);

        return $dms;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private function createDm(int $assetId, string $uid, string $now,
        string $dmc, string $infoCode, string $variant, string $title, array $steps): int
    {
        $docNumber = $dmc;
        $qb = $this->db->getQueryBuilder();
        $qb->insert('ops_documents')->values([
            'doc_number'        => $qb->createNamedParameter($docNumber),
            'title'             => $qb->createNamedParameter($title),
            'category'          => $qb->createNamedParameter('tech_manual'),
            'status'            => $qb->createNamedParameter('active'),
            'asset_id'          => $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT),
            'doc_type'          => $qb->createNamedParameter('data_module'),
            'dmc'               => $qb->createNamedParameter($dmc),
            'info_code'         => $qb->createNamedParameter($infoCode),
            'info_code_variant' => $qb->createNamedParameter($variant),
            'issue_number'      => $qb->createNamedParameter(1, IQueryBuilder::PARAM_INT),
            'in_work_number'    => $qb->createNamedParameter(0, IQueryBuilder::PARAM_INT),
            'dmc_review_flag'   => $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL),
            'pub_code'          => $qb->createNamedParameter(null, IQueryBuilder::PARAM_NULL),
            'pub_type'          => $qb->createNamedParameter(null, IQueryBuilder::PARAM_NULL),
            're_issue_required' => $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL),
            'notes'             => $qb->createNamedParameter(''),
            'applicability'     => $qb->createNamedParameter(''),
            'created_by'        => $qb->createNamedParameter($uid),
            'created_at'        => $qb->createNamedParameter($now),
            'updated_at'        => $qb->createNamedParameter($now),
        ]);
        $qb->executeStatement();
        $dmId = (int)$this->db->lastInsertId('ops_documents');

        foreach ($steps as [$stepType, $content, $order]) {
            $sq = $this->db->getQueryBuilder();
            $sq->insert('ops_dm_steps')->values([
                'document_id' => $sq->createNamedParameter($dmId, IQueryBuilder::PARAM_INT),
                'step_order'  => $sq->createNamedParameter($order, IQueryBuilder::PARAM_INT),
                'step_type'   => $sq->createNamedParameter($stepType),
                'content'     => $sq->createNamedParameter($content),
                'created_at'  => $sq->createNamedParameter($now),
                'updated_at'  => $sq->createNamedParameter($now),
            ]);
            $sq->executeStatement();
        }

        // Initial revision record
        $rq = $this->db->getQueryBuilder();
        $rq->insert('ops_document_revisions')->values([
            'document_id' => $rq->createNamedParameter($dmId, IQueryBuilder::PARAM_INT),
            'revision'    => $rq->createNamedParameter('1'),
            'change_desc' => $rq->createNamedParameter('Initial Data Module — MOS system documentation seed.'),
            'approved_by' => $rq->createNamedParameter($uid),
            'created_at'  => $rq->createNamedParameter($now),
        ]);
        try { $rq->executeStatement(); } catch (\Throwable) {}

        return $dmId;
    }

    private function createPublication(string $pubCode, string $title, string $pubType, int $assetId, string $uid, string $now): int {
        $qb = $this->db->getQueryBuilder();
        $qb->insert('ops_documents')->values([
            'doc_number'        => $qb->createNamedParameter($pubCode),
            'title'             => $qb->createNamedParameter($title),
            'category'          => $qb->createNamedParameter('tech_manual'),
            'status'            => $qb->createNamedParameter('draft'),
            'asset_id'          => $qb->createNamedParameter($assetId, IQueryBuilder::PARAM_INT),
            'doc_type'          => $qb->createNamedParameter('publication'),
            'dmc'               => $qb->createNamedParameter(null, IQueryBuilder::PARAM_NULL),
            'info_code'         => $qb->createNamedParameter(null, IQueryBuilder::PARAM_NULL),
            'info_code_variant' => $qb->createNamedParameter('A'),
            'issue_number'      => $qb->createNamedParameter(1, IQueryBuilder::PARAM_INT),
            'in_work_number'    => $qb->createNamedParameter(1, IQueryBuilder::PARAM_INT),
            'dmc_review_flag'   => $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL),
            'pub_code'          => $qb->createNamedParameter($pubCode),
            'pub_type'          => $qb->createNamedParameter($pubType),
            're_issue_required' => $qb->createNamedParameter(false, IQueryBuilder::PARAM_BOOL),
            'notes'             => $qb->createNamedParameter(''),
            'applicability'     => $qb->createNamedParameter(''),
            'created_by'        => $qb->createNamedParameter($uid),
            'created_at'        => $qb->createNamedParameter($now),
            'updated_at'        => $qb->createNamedParameter($now),
        ]);
        $qb->executeStatement();
        return (int)$this->db->lastInsertId('ops_documents');
    }

    /** $chapters = [['title'=>'...', 'dms'=>[id1,id2,...]], ...] */
    private function assemblePub(int $pubId, array $chapters): void {
        $chNum = 0;
        foreach ($chapters as $chap) {
            $chNum++;
            $seq = 10;
            foreach ($chap['dms'] as $dmId) {
                $qb = $this->db->getQueryBuilder();
                $qb->insert('ops_publication_dms')->values([
                    'publication_id' => $qb->createNamedParameter($pubId,  IQueryBuilder::PARAM_INT),
                    'document_id'    => $qb->createNamedParameter($dmId,   IQueryBuilder::PARAM_INT),
                    'chapter'        => $qb->createNamedParameter($chNum,  IQueryBuilder::PARAM_INT),
                    'section'        => $qb->createNamedParameter(1,       IQueryBuilder::PARAM_INT),
                    'sequence'       => $qb->createNamedParameter($seq,    IQueryBuilder::PARAM_INT),
                    'chapter_title'  => $qb->createNamedParameter($chap['title']),
                ]);
                try { $qb->executeStatement(); } catch (\Throwable) {}
                $seq += 10;
            }
        }
    }

    private function insertAsset(array $fields): int {
        $qb = $this->db->getQueryBuilder();
        $vals = [];
        foreach ($fields as $col => $val) {
            $vals[$col] = $qb->createNamedParameter($val);
        }
        $qb->insert('ops_assets')->values($vals);
        $qb->executeStatement();
        return (int)$this->db->lastInsertId('ops_assets');
    }

    private function findDocByCode(string $pubCode): ?array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id')->from('ops_documents')
           ->where($qb->expr()->eq('pub_code', $qb->createNamedParameter($pubCode)))
           ->setMaxResults(1);
        $r = $qb->executeQuery();
        $row = $r->fetch();
        $r->closeCursor();
        return $row ?: null;
    }
}
