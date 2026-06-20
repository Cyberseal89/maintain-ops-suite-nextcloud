# Maintain Ops Suite — User Manual
**Version 3.2.2 | Alto Technologies LLC**

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Asset Registry (Library)](#asset-registry)
5. [Preventive Maintenance](#preventive-maintenance)
6. [Deficiency Tracking](#deficiency-tracking)
7. [LOTO / Tagout](#loto--tagout)
8. [Modernizations](#modernizations)
9. [Availability Projects & Gantt](#availability-projects--gantt)
10. [Work Packages & RFQ](#work-packages--rfq)
11. [Supply & Warehouse](#supply--warehouse)
12. [The Library (Documents)](#the-library)
13. [System Canvas](#system-canvas)
14. [Failure Modes](#failure-modes)
15. [Data Import](#data-import)
16. [Platforms & Shops (Admin)](#platforms--shops)
17. [Settings](#settings)
18. [Mobile App (Field Technician)](#mobile-app)
19. [Appendix](#appendix)

---

## 1. Overview

Maintain Ops Suite is an integrated operations management platform built on Nextcloud. It provides the following core modules:

- **Asset Registry** — Hardware, software, and firmware digital twin with hierarchy, criticality, bypass/redundancy config, photos, and 3D models
- **Preventive Maintenance (PM)** — Schedule, track, and complete PM procedures with SOP attachment
- **Deficiency Tracking** — Log, manage, troubleshoot, and close deficiencies (SEV-1 through SEV-5)
- **LOTO / Tagout** — Lockout/tagout session management with device inventory, verify workflow, and audit print
- **Modernizations** — Asset upgrade projects with 5-stage lifecycle and Technical Data Package (TDP) management
- **Availability Projects** — Project manage multiple work items with a visual Gantt chart
- **Work Packages** — Bundle PMs and modernizations into RFQ-ready packages
- **Supply & Warehouse** — Supply requisitions, inventory management, and cycle counting
- **The Library** — Document registry with revision tracking and SOP management
- **System Canvas** — Draw live system architecture diagrams linked to real asset records
- **Failure Modes** — S5000F-based failure mode taxonomy, customizable per installation
- **Data Import** — Bulk-load asset records from CSV or JSON files

The platform has two interfaces:
- **Nextcloud Web UI** — For managers, planners, and administrators
- **Android Mobile App** *(Pending release)* — For field technicians

---

## 2. Getting Started

### Accessing the Web UI
1. Log in to your Nextcloud instance.
2. Click **Maintain Ops Suite** in the top navigation bar.
3. You will land on the Dashboard.

### First-Time Setup (Admin)
Before any operational data can be created, an administrator must complete setup:

1. **Create a Platform** — Go to *Admin → Platforms & Shops*. Create at least one Platform and link it to a Nextcloud group. Users in that group will see the platform's data.
2. **Create Shops** — Add shop codes under the platform. Shop codes become the prefix for all asset identifiers (e.g., `SHB` → `SHB-0001`).
3. **Seed the Library** — Upload baseline SOP documents before creating PM procedures.
4. **Customize Failure Modes** — Review the seeded S5000F taxonomy under *Admin → Failure Modes* and add any custom modes specific to your equipment.
5. **Import Existing Assets** — Use *Admin → Data Import* to bulk-load existing asset rosters from CSV or JSON.

> **Tip:** The platform selector in the header filters ALL views. If you see no data, verify your selected platform is correct and that your Nextcloud account belongs to the linked group.

---

## 3. Dashboard

The Dashboard provides at-a-glance fleet health metrics:

- **Asset Count** — Total assets registered on the selected platform
- **Open Deficiencies** — Count of open deficiencies, color-coded by severity
- **Overdue PMs** — PM procedures past their next-due date
- **Low Stock Items** — Inventory items below minimum threshold
- **Readiness Summary** — Assets in FULL-OP, DEG-OP, and DOWN-OP states

Select a platform from the header dropdown to filter all dashboard metrics to that platform.

---

## 4. Asset Registry

The Asset Registry is your equipment and software digital twin. Every piece of hardware, software, or firmware is tracked here.

### Creating an Asset
1. Click **+ New Asset**.
2. Select **Asset Type**: Hardware / Software / Firmware.
3. Fill in Name, Manufacturer, Model, Serial Number, Version/Build, Location, IP Address.
4. Set **Install Date** and **Warranty Expiry** for lifecycle tracking.
5. Assign a **Platform** and optionally a **Shop** — the shop determines the auto-generated asset ID prefix.
6. Optionally set a **Parent Asset** to create a hierarchy (e.g., NIC card nested under a server chassis).
7. Save — the system assigns a sequential identifier.

### Criticality Codes
| Code | Label | Description |
|------|-------|-------------|
| **CR** | Critical | Failure directly impacts mission/operations. Highest resolution priority. |
| **DE** | Degraded | Functional but below full capacity. Active deficiency or bypass is logged. |
| **RD** | Redundant | Backup system; reduces impact of primary failure. |
| **SP** | Spare | Held in reserve, not currently deployed. |
| **AD** | Administrative | Support equipment with no direct mission criticality. |

### Bypass & Degraded Mode Configuration
- **Bypass Available** — Indicates the asset can be isolated without total loss of capability.
- **Bypass Method** — Procedure steps to achieve the bypass.
- **Degraded Capability %** — Operational capacity when running in bypass/degraded mode.
- **Failover Asset** — For RD components: which redundant asset takes over on failure.
- **Failover Time (mins)** — Expected switchover time.
- **Failover Procedure** — Steps to execute the switchover.

### Parent / Child Hierarchy
- Assign a **Parent Asset** to nest assets in a hierarchy.
- Parent assets display a collapsible child list on their detail page.
- The asset code includes depth and system position for hierarchical identification.

### UII / IUID Compliance
- **UII** — Unique Item Identifier per ISO/IEC 15459 (auto-generated if CAGE code and serial number are provided).
- **CAGE Code** — 5-character manufacturer identifier in the UII namespace.
- **IUID Compliant** — Set to Yes once the item is physically marked with a compliant 2D data matrix label.

### Photos
- Attach condition, installation, deficiency, pre-maintenance, or post-maintenance photos.
- Click **+ Add Photo** on the asset detail page.
- Use the **Browse** button to select from Nextcloud Files.
- Set one photo as **Primary** — it appears as the asset thumbnail.

### 3D Models
- Link GLTF/GLB, STEP, OBJ, or FBX files to an asset for 3D visualization.
- GLTF/GLB files render immediately in the in-browser Three.js viewer.
- Other formats are queued for conversion (`pending` status).
- **Hotspots** can be placed on the 3D model and linked to deficiencies, PMs, or interfaces.

### Verification Cycles
- Assets require an **18-month verification** — the system tracks last-verified date automatically.
- Click **Verify Asset** on the detail page to record today as the new verification timestamp.
- Assets approaching or exceeding the 18-month threshold are flagged in the registry list.

### Readiness States
The readiness engine calculates operational state from criticality and open deficiencies:
- **FULL-OP** — No open deficiencies affecting capability.
- **DEG-OP** — Open deficiency exists; asset is functional but impaired.
- **DOWN-OP** — Asset is non-functional due to a critical open deficiency.

---

## 5. Preventive Maintenance

### Creating a PM Procedure
1. Go to **All Procedures** → **+ New PM**.
2. Link to an **Asset** from the Registry.
3. Set **Periodicity**: Weekly / Monthly / Quarterly / Semi-Annual / Annual.
4. Optionally attach an **SOP** from the Library.
5. Assign a responsible **Technician**.
6. Enter the **Last Completed Date** — next-due is auto-calculated.

### Periodicity Reference
| Setting | Interval |
|---------|----------|
| Weekly | 7 days |
| Monthly | 30 days |
| Quarterly | 90 days |
| Semi-Annual | 180 days |
| Annual | 365 days |

### PM Closeout Workflow
1. Click **Complete** on the PM record.
2. Fill in: actual completion date, labor hours, parts cost, labor cost, completion notes.
3. If anomalies were found, click **Create Deficiency** to log a linked deficiency record.
4. Save — last-completed date updates and next-due is recalculated.

### Initiating LOTO from a PM
Click **Initiate LOTO** on the PM detail page to create a pre-linked LOTO session for the associated asset before beginning work.

---

## 6. Deficiency Tracking

### Severity Levels
| Level | Label | Description |
|-------|-------|-------------|
| SEV-1 | Mission Critical | Complete loss of capability; immediate response required. |
| SEV-2 | Significant | Major degradation; workaround may exist but impact is high. |
| SEV-3 | Moderate | Equipment functional but impaired. |
| SEV-4 | Minor | Minimal operational impact. |
| SEV-5 | Cosmetic | No functional impact. |

### Discovery Methods
- PM Inspection, Walkdown, Self-Reported, External Audit, Automated Alert

### Creating a Deficiency
1. Go to **Deficiencies** → **+ New Deficiency**.
2. Select **Severity**, **Discovery Method**, linked **Asset**, location.
3. Provide a description, initial cost estimate, man-days, and outside entity requirement if applicable.
4. Save.

### Troubleshooting Log
- Append-only sequential log of diagnostic steps on each deficiency.
- Each entry records: technician, date/time, action taken, result observed.
- Cannot be altered — provides audit integrity.

### Deficiency Closeout
1. Click **Close Out**.
2. Document **Root Cause**, **Corrective Action**, and **Failure Mode** (from S5000F taxonomy).
3. Enter actual labor hours, parts cost, and labor cost.
4. Set resolution date and confirm the asset is back in service.

### Escalating to Modernization
- If a capital upgrade is required, click **Escalate to Mod**.
- This creates a new Modernization project pre-linked to the deficiency.
- The deficiency status changes to *Escalated* — it stays open until the mod is complete.

### Initiating LOTO from a Deficiency
- Click **Initiate LOTO** on the deficiency detail.
- A LOTO session is created pre-linked to the deficiency and associated asset.

---

## 7. LOTO / Tagout

### Session Types
- **Lockout** — Physical lock applied to an energy isolation point.
- **Tagout** — Warning tag applied where a lockout device cannot be used.
- **Combination** — Both lock and tag applied at the same isolation point.
- **Group** — Multiple technicians each apply their own lock to a shared hasp.

### Tag Number Format
All sessions receive a system-generated tag number: `LOTO-2026-0001`

- Year segment reflects the calendar year the session was initiated.
- Sequence resets to 0001 each calendar year.
- Tag numbers are unique per platform.

### Session Lifecycle
1. **Initiate** — Create the session; select type; link to source PM or Deficiency.
2. **Assign Devices** — Select isolation devices from Device Inventory.
3. **Verify** — Record the energy verification method and result. System timestamps the verification.
4. **Print Audit Sheet** — Generate a printable record for posting at the work site.
5. **Release** — All devices returned to Available; session status set to Released.

### Device Inventory
- Manage physical lock and tag devices under **LOTO → Device Inventory**.
- Each device: serial number (unique), color, key number, type, status (Available / In Use / Out of Service).
- Devices are automatically marked **In Use** when assigned to a session and returned to **Available** on release.

### Verify Workflow
- After devices are applied, a **Verify** step confirms energy isolation is achieved.
- Verification method, result, and timestamp are recorded.
- Bulk verification via **Print Audit** also marks all active sessions verified.

### Print Audit Sheet
- Click **Print Audit** from the Active Sessions tab.
- Generates a formatted audit record of all active sessions.
- The printout includes: tag number, asset, isolation points, device list, applied-by, verified-by, timestamps.
- All printed sessions are automatically logged as verified.

---

## 8. Modernizations

### 5-Stage Lifecycle
| Stage | Description |
|-------|-------------|
| **Design** | Concept development, technical feasibility, initial cost estimate |
| **Planning** | Detailed work scope, resource allocation, schedule |
| **Approval** | Formal authorization gate — system records approval timestamp automatically |
| **Execution** | Active work in progress; linked supply and LOTO sessions typically active here |
| **Complete** | All work done, TDP finalized, asset record updated |

### Technical Data Package (TDP)
- Each modernization has a TDP tab organizing documents by category:
  - Drawings, Tech Manuals, Test Plans, Training Materials, PM SOPs, Other
- Documents are stored in the Library — TDP holds references, not raw files.
- Revisions auto-update when the Library document is revised.
- Print the complete TDP package from the modernization detail page.

### Linked Records
- **Deficiencies** — link open deficiencies to scope the mod and include their costs in cost roll-up.
- **Supply Requests** — associate requisitions for a single view of all parts ordered for the project.
- When the mod reaches Complete, linked open deficiencies are prompted for closeout.

---

## 9. Availability Projects & Gantt

### Creating an Availability Window
1. Go to **Avail Projects** → **+ New Availability Project**.
2. Set **Start Date** and **End Date** of the maintenance window.
3. Provide project name, description, and project lead.
4. Save — the Gantt chart will display the full window as the timeline.

### Adding Work Items
1. Click **+ Add Work Item** inside the project.
2. Select item type: PM Procedure / Modernization / Deficiency / Milestone.
3. Link the specific record (or enter milestone text).
4. Set planned start and end dates within the window.
5. System warns if dates fall outside the availability window.

### Gantt Chart Features
- Color-coded bars: blue = PM, purple = Modernization, yellow = Deficiency, diamond = Milestone.
- Click any bar to open a detail popup with status and navigation links.
- Draw finish-to-start dependency arrows between work items.
- Milestone markers displayed as vertical diamonds at the planned date.

---

## 10. Work Packages & RFQ

### Creating a Work Package
1. Go to **Work Packages** → **+ New Work Package**.
2. Provide a package name, description, and required-by date.
3. Add line items (PMs or Modernizations).
4. The system enforces **one-to-one assignment** — an item cannot appear in two active packages.
5. Cost estimates roll up automatically to the package total.

### Auto-Generated RFQ Numbers
Format: `RFQ-2026-0001` — sequential per platform per calendar year. Cannot be manually changed.

### PDF Export
Click **Export RFQ** for a print-ready PDF including:
- RFQ number, scope summary, line items with cost estimates, terms and conditions, signature blocks.

---

## 11. Supply & Warehouse

### Requisitions
1. Click **+ New Requisition**.
2. Fill in Part Name, NSN, CAGE Code, Manufacturer Part Number, Unit of Measure, Quantity.
3. Link to a Modernization, Deficiency, or PM for cost roll-up traceability.
4. Auto-generated SRFQ number: `SRFQ-2026-0001`.
5. Click **Export SRFQ** for a vendor-ready supply RFQ PDF.

### Quarterly Revalidation
Requisitions with no activity in 90 days are flagged under **Validations Due**. Revalidate or cancel each flagged requisition to prevent stale orders.

### Inventory Management
- Track on-hand stock per part number with minimum quantity thresholds.
- Items below threshold are flagged in red on the Inventory list.
- Full transaction history is available per item.

### Stock Transactions
| Transaction | Description |
|-------------|-------------|
| **Receive** | Record incoming stock against a requisition |
| **Issue** | Record parts issued to a PM, Deficiency, or Modernization |
| **Return** | Record unused parts returned to stock |
| **Adjust** | Correct on-hand quantity following a count or audit finding |

### Cycle Counting (A/B/C)
| Class | Frequency | Description |
|-------|-----------|-------------|
| **A** | Monthly | High-value or high-usage parts |
| **B** | Quarterly | Moderate value/usage |
| **C** | Annual | Low-cost, low-movement items |

---

## 12. The Library

The Library is the central document registry for all technical documents.

### Document Categories
Drawing, Tech Manual, Specification, SOP, Test Plan, Training Material, Other

### Uploading a Document
1. Click **+ New Document**.
2. Fill in title, document number, category, and revision identifier (e.g., Rev A, v2.1).
3. Click **Browse** to select the file from Nextcloud Files.
4. Set status: Draft / Active / Superseded / Archived.

### Revision Tracking
- Increment the revision identifier when uploading a new version.
- Set the old revision to **Superseded** — it is retained for traceability.
- PMs and TDPs reference documents by ID — they always display the current Active revision.

### SOP Attachment
- SOPs in the Library can be linked to PM Procedures via the SOP field on the PM record.
- They can also be included in Modernization TDPs under the *PM SOPs* category.

---

## 13. System Canvas

The System Canvas lets you draw system architecture diagrams using real assets as nodes.

### Creating a Diagram
1. Go to **System Canvas** → **+ New Canvas**.
2. Click **Add Asset Node** to place an asset from the Registry onto the canvas.
3. Use the **Interface Line** tool to draw connections between nodes.
4. Label interface lines with type: electrical, data, mechanical, fluid, RF, HVAC, network, etc.
5. Drag nodes to arrange the layout — positions are saved automatically.

### Asset Nodes
- Each node links to a real asset record. Click to open the asset detail in a side panel.
- Node color reflects current status: green = nominal, yellow = degraded, red = open deficiency, gray = bypassed.

---

## 14. Failure Modes

The Failure Mode Taxonomy provides structured classification for deficiency closeouts, based on S5000F / ASD reliability taxonomy conventions.

### Standard Categories
Electrical, Mechanical, Software, Firmware, Environmental, Operator Error, Wear / Age, Corrosion, Contamination, General

### Creating Custom Failure Modes
1. Go to **Admin → Failure Modes** (admin access required).
2. Click **+ New Failure Mode**.
3. Provide code, name, category, subcategory, and description.
4. Custom modes appear alongside standard taxonomy in the deficiency closeout form.

### Fleet Analytics
- Each mode shows a **Fleet Count** badge: total deficiencies closed against it.
- Modes with 5+ occurrences are flagged in red — indicating a systemic pattern.
- Use counts to prioritize modernization projects and PM schedule adjustments.

---

## 15. Data Import

### Overview
The Data Import tool allows bulk-loading of asset records from CSV or JSON files. Column mapping and validation are performed before any records are written to the database.

### Supported Formats
- **CSV** — Comma-separated values. First row must be column headers.
- **JSON** — Array of objects format (`[{"name": "Server A", ...}]`).

### Import Workflow
1. Go to **Admin → Data Import** → **+ New Import**.
2. Browse and select your file from Nextcloud Files.
3. The system detects headers and auto-maps columns using common name aliases.
4. On the **Column Mapping** screen, confirm or correct each source column → target field assignment.
5. Click **Validate** — the system checks each row for required fields and valid values.
6. Review any validation errors listed by row number.
7. Click **Run Import** — valid rows are inserted; rows with errors are skipped.
8. A completion summary shows imported vs. skipped counts.

### Column Mapping Reference
| Target Field | Required | Accepted Values / Format |
|-------------|----------|--------------------------|
| Asset Name | **Yes** | Any text |
| Asset Type | No | `hardware` / `software` / `firmware` |
| Manufacturer | No | Any text |
| Model | No | Any text |
| Serial Number | No | Any text |
| Version / Build | No | Any text |
| Location | No | Any text |
| IP Address | No | Any text |
| Install Date | No | `YYYY-MM-DD` preferred |
| Warranty Expiry | No | `YYYY-MM-DD` preferred |
| Status | No | `operational` / `degraded` / `offline` / `maintenance` / `decommissioned` |
| Notes | No | Any text |
| Tags | No | Comma-separated tags |
| Criticality Code | No | `CR` / `DE` / `RD` / `SP` / `AD` |
| UII | No | ISO/IEC 15459 format |
| CAGE Code | No | 5-character CAGE code |
| IUID Compliant | No | `0` or `1` |

### Auto-Mapped Header Aliases
The system recognizes common column name variations: `S/N`, `Serial #`, `SN`, `Make`, `MFR`, `IP Addr`, `Install Date`, `Warranty Exp`, `Crit`, `CAGE`, and many others.

> **Tip:** Run a test import with 10–20 rows first to validate your column mapping before importing a large roster. Past import jobs are listed with their full results for reference.

---

## 16. Platforms & Shops

### Creating a Platform (Admin)
1. Go to **Admin → Platforms & Shops** → **+ New Platform**.
2. Enter platform name, location, and description.
3. Link to a **Nextcloud Group** — members of this group will see the platform.
4. Save.

### Multi-Site Access
- Users with membership in multiple platform groups can switch between platforms using the header selector.
- Cross-platform data sharing is not supported — each platform is a fully isolated data scope.
- Admin users (Nextcloud admins) can see all platforms regardless of group membership.

### Creating Shops
Under a Platform, add one or more Shops:
1. Click **+ New Shop** on the Platform detail page.
2. Enter shop code (e.g., `SHB`), shop name, discipline, and supervisor.
3. Save.

> **Important:** Shop codes cannot be changed after assets have been created under them. The code becomes a permanent part of every asset ID assigned to that shop.

---

## 17. Settings

The Settings page provides platform-level configuration for your Maintain Ops Suite instance. Access via **Admin → Settings**.

---

## 18. Mobile App (Field Technician)

The Maintain Ops Suite Android app pairs with your Nextcloud installation for field access.

### Field Capabilities
- **Complete PMs** — Record completion, log hours, add notes.
- **Log Deficiencies** — Create deficiency records from the field with photos.
- **Close Deficiencies** — Complete closeout forms including root cause and corrective action.
- **Check Supply Status** — View requisition status and inventory levels.

### Trial & Subscription
- **7-day free trial** included on first install.
- After the trial, a subscription is required for **write access** (logging, completing, closing records).
- **Read-only access** remains free.
- Plans: Monthly ($9.99/mo) or Annual ($79.99/yr).

---

## 19. Appendix

### Keyboard & Navigation Tips
- The left sidebar provides navigation between all modules.
- The platform dropdown in the header filters all data to the selected platform.
- Use the search/filter bar at the top of list views to narrow results.
- Press **Escape** to close any open modal.

### Data Retention
- All records are retained indefinitely unless manually deleted by an admin.
- Closed deficiencies, completed PMs, released LOTO sessions, and completed modernizations are fully searchable from their respective list views.
- Import job records are retained for reference and can be manually deleted from *Admin → Data Import*.

### Criticality vs. Readiness
- **Criticality** is a static classification set by an administrator (CR, DE, RD, SP, AD).
- **Readiness** is a dynamic state calculated by the system from open deficiencies and bypass flags.
- A Critical (CR) asset with no open deficiencies is in **FULL-OP** state.
- A Critical (CR) asset with an open deficiency is in **DEG-OP** or **DOWN-OP** depending on severity.

### Asset Code Format
Assets assigned to a shop receive a code in the format:
```
SHOPCODE-NNNN
```
Child assets append their position:
```
SHOPCODE-NNNN-NN
```
Where `NNNN` is the sequential parent number and `NN` is the child position within the parent.

### Contact & Support
- **Issues / Feature Requests:** https://github.com/Cyberseal89/maintain-ops-suite-nextcloud/issues
- **Developer:** Alto Technologies LLC — contact@altotechnologiesllc.com
- **Website:** https://altotechnologiesllc.com
