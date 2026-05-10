# Maintain Ops Suite — User Manual
**Version 2.0.3 | Alto Technologies LLC**

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Configuration Registry (Assets)](#configuration-registry)
5. [Preventive Maintenance](#preventive-maintenance)
6. [Deficiency Tracking](#deficiency-tracking)
7. [Modernizations](#modernizations)
8. [Availability Projects](#availability-projects)
9. [Work Packages](#work-packages)
10. [Supply & Warehouse](#supply-warehouse)
11. [Validations Due](#validations-due)
12. [Platforms](#platforms)
13. [Settings](#settings)
14. [Mobile App (Field Technician)](#mobile-app)
15. [Appendix](#appendix)

---

## 1. Overview

Maintain Ops Suite is an integrated operations management platform built on Nextcloud. It provides seven core modules:

- **Configuration Registry** — Track all hardware, software, and firmware assets with IUID compliance
- **Preventive Maintenance (PM)** — Schedule, track, and complete PM procedures
- **Deficiency Tracking** — Log, manage, and close deficiencies found in the field
- **Modernizations** — Manage asset upgrade projects with full TDP package tracking
- **Availability Projects** — Project manage multiple work items with Gantt scheduling
- **Work Packages** — Bundle PMs and modernizations into RFQ-ready packages
- **Supply & Warehouse** — Supply requisitions, inventory management, and cycle counting

The platform has two interfaces:
- **Nextcloud Web UI** — For managers, planners, and administrators
- **Android Mobile App** — For field technicians in the field

---

## 2. Getting Started

### Accessing the Web UI
1. Log in to your Nextcloud instance
2. Click **Maintain Ops Suite** in the top navigation bar
3. You will land on the Dashboard

### First-Time Setup (Admin)
1. **Create Platforms** — Go to Admin → Platforms → + New Platform
2. **Set Editor Group** — Go to Settings → Access Control
3. **Register Assets** — Go to Configuration Registry → Register New Asset

### Mobile App Setup
1. Install the Maintain Ops Suite app on your Android device
2. Enter your Nextcloud server URL (e.g. `https://cloud.example.com`)
3. Log in and grant access when prompted
4. Complete the onboarding slides

---

## 3. Dashboard

### Platform Filter
Buttons at the top scope all data to one or more platforms. Select All or specific platforms. Multiple selections allowed. The selected platform carries through to all list views, create forms, and reports.

### Stats Cards
- **Total Assets** — With HW/SW/FW breakdown
- **PM Due This Week** — Coming due in 7 days
- **PM Overdue** — Past due with last 30-day completions
- **Open Deficiencies** — Total open with SEV-1/SEV-2 counts

### Overdue PM Table
Lists overdue procedures with name, asset, days overdue, and assigned technician.

### Critical Deficiencies
Highest severity open deficiencies for immediate attention.

---

## 4. Configuration Registry (Assets)

### Registering a New Asset
1. Go to **Configuration Registry** → **+ Register New Asset**
2. Fill in:
   - **Asset Name** (required), **Asset Type** (HW/SW/FW), **Platform**
   - Manufacturer, Model, Serial Number, Version
   - Location, IP Address, Install Date, Warranty Expiry
   - **Status** — Operational, Degraded, Offline, In Maintenance, Decommissioned
   - **UII** — Unique Item Identifier (ISO 15459) — auto-generated if not provided
   - **CAGE Code** — 5-character contractor identifier
   - **IUID Compliant** — Mark if asset meets DoD IUID requirements
   - Linked Assets (digital twin cross-references), Tags, Notes
3. Click **Create Asset**

> **UII Auto-Generation:** If no UII is provided, the system auto-generates one. If CAGE code and serial number are both present, it formats as `//CAGE/SERIAL` (ISO 15459 compliant). Otherwise it generates `//ALTO/{UUID}`.

### Asset Detail View
Shows all configuration fields plus:
- **Last Verified** — Date, days ago, and who verified. Shows ⚠ OVERDUE if more than 18 months since last verification
- **UII** — Unique Item Identifier
- **IUID Compliant** — Compliance status
- **CAGE Code** — Contractor identifier
- Linked assets, PM procedures, open deficiencies

### Asset Detail Actions
- **✏ Edit Asset** — Modify configuration
- **+ Log Deficiency** — Log a deficiency against this asset
- **+ PM Procedure** — Add a PM procedure
- **🔧 Create Modernization** — Start a modernization project
- **✓ Verify Asset** — Opens verification modal

### Asset Verification
Every asset requires verification every **18 months**. When due, the asset appears on the Validations Due page.

1. Click **✓ Verify Asset** from the asset detail or Validations Due page
2. A modal opens showing last verification info with editable fields:
   - Location (update if changed)
   - Status
   - Serial Number
   - Verification Notes
3. Click **✓ Confirm Verification**
4. The verification is stamped with the current user and timestamp

---

## 5. Preventive Maintenance

### Completing a PM
1. Click **✓ Done** from the PM Dashboard or procedures list
2. Fill in the closeout modal: Hours Spent, Parts Cost, Labor Cost, Completion Notes
3. Click **✓ Mark Complete** — next due date is automatically calculated

### Procedure Detail
Shows all info plus **Last Closeout** — actual hours, costs, and notes from the most recent completion.

### Creating a PM Procedure
Go to **PM Procedures** → **+ New Procedure**. Fill in name, asset, category, periodicity, assigned technician, SOP document reference, description, estimated hours.

### Periodicities
As Required (manual) · Weekly (+7d) · Monthly (+30d) · Quarterly (+90d) · Semi-Annual (+180d) · Annual (+365d)

---

## 6. Deficiency Tracking

### Severity Levels
SEV-1 (Critical) · SEV-2 (High) · SEV-3 (Medium/default) · SEV-4 (Low) · SEV-5 (Informational)

### Logging a Deficiency
Go to **+ Log Deficiency**. Fill in summary, description, asset, severity, discovery method, assignment, cost estimates, target completion.

### Status Workflow
Open → In Work → Waiting Parts / Waiting Approval / Scheduled → Closed (or Cancelled)

### Deficiency Detail View
Shows all deficiency information plus:
- **Supply Requests** — All linked supply requisitions with SRFQ number, status, and needed-by date
- **Troubleshooting History** — Timeline of all notes and status changes
- **Closeout Details** (if closed) — Root cause, corrective action, actual costs

### Closing a Deficiency
Click **✓ Close**. Fill in Root Cause (required), Corrective Action Taken (required), Actual Parts Cost, Labor Cost, Man-Days.

### Escalating to Modernization
Click **🔧 Escalate to Modernization** from any deficiency detail to create a linked modernization project.

### Requesting Parts from a Deficiency
Click **🛒 Request Parts** to create a supply requisition linked to this deficiency. Add line items with item name, part number, NSN, CAGE code, manufacturer, quantity, and unit cost.

---

## 7. Modernizations

### Status Workflow
Design → Planning → Approval → Execution → Complete

### Creating a Modernization
- **From list:** + New Modernization
- **From asset:** 🔧 Create Modernization
- **From deficiency:** 🔧 Escalate to Modernization

### Modernization Detail
- **→ Advance** moves to next stage (approval timestamp auto-recorded on Approval → Execution)
- **Cost Summary** — Estimated vs actual (parts, labor, contractor, total)
- **Technical Data Package** — Supporting documents
- **Supply Requests** — All linked supply requisitions
- **Linked Deficiencies** — Associated deficiencies

### Requesting Parts from a Modernization
**Note:** The 🛒 Request Parts button is only available once the modernization reaches **Approval** stage or beyond. This prevents ordering parts for unapproved work.

### Technical Data Package (TDP)
Document Types: Drawings · Tech Manuals · Test Plan · Training · SOPs · Other

Each document tracks: title, file reference (Nextcloud path or URL), status (Pending/In Progress/Complete), notes.

---

## 8. Availability Projects

### Creating a Project
Go to **📅 Avail Projects** → **+ New Project**. Start Date and End Date are required (defines the availability window).

### Adding Items
Click **+ Add Item**. Select type: PM Procedure, Modernization, Deficiency, or Milestone.

Out-of-window warnings are shown if item dates fall outside the project window. Items are still added so conflicts are visible.

### Gantt Chart
| Color | Type |
|-------|------|
| Blue bars | PM Procedures |
| Purple bars | Modernizations |
| Red bars | Deficiencies |
| Yellow diamonds | Milestones |
| Orange dashed line | Today |
| Blue shading | Project window |

Click any bar to see a popup with item details and a link to the full record.

### Milestones
Point-in-time markers: "100% Modernization Complete", "PM Lock", "System Online", "Inspection Day", etc.

---

## 9. Work Packages

Work packages bundle PMs and/or modernizations together for RFQ export or availability project inclusion.

### Creating a Work Package
Go to **📦 Work Packages** → **+ New Work Package**. Fill in:
- Title, Scope of Work description
- Status — Draft, Submitted, Approved, Complete
- Package Type — Mixed, PMs Only, Modernizations Only
- Assigned To, Approver
- RFQ Response Due Date

> **RFQ Number** is auto-generated on creation (format: `RFQ-XXXXXXXX`).

### Adding Items
Click **+ Add Item**. Select PM Procedure or Modernization from the dropdown.

> **One-to-one constraint:** Each PM or modernization can only belong to one work package at a time. If already assigned, an error is shown.

### Exporting an RFQ
Click **📄 Export RFQ** to generate a professional Request for Quote document that opens in a new window for printing. The RFQ includes:
- Cover page with RFQ number, organization, date issued, response due date
- Project information table
- Scope of work description
- Line items with type, description, estimated hours, parts, labor, contractor costs
- Terms and conditions
- Signature block (Prepared By, Approved By, Vendor)

---

## 10. Supply & Warehouse

### Supply Requests

#### Creating a Supply Request
Go to **🛒 Supply Requests** → **+ New Request**. Fill in title, priority, needed-by date, requested by, and notes.

**Priority Levels:**
- Routine — Standard procurement timeline
- Urgent — Expedited processing needed
- Emergency — Immediate action required

> **SRFQ Number** is auto-generated on creation (format: `SRFQ-XXXXXXXX`).

#### Adding Line Items
Click **+ Add Item** on the supply request detail. Fill in:
- **Item Name** (required)
- **Part Number** — Manufacturer part number
- **NSN** — National Stock Number (format: 5945-01-234-5678)
- **Manufacturer** — Who makes the item
- **CAGE Code** — Contractor identifier
- **Unit of Measure** — Each, Box, Lot, Gallon, Liter, Feet, Meter, Pair, Set, Roll
- **Quantity** and **Estimated Unit Cost**
- **Preferred Vendor**

#### Supply Request Status Workflow
Draft → Submitted → Approved → Ordered → Partially Received → Received → Closed (or Cancelled)

#### Exporting a Supply RFQ
Click **📄 Export SRFQ** to generate a vendor-ready Request for Quote with all line items, quantities, delivery requirements, and signature blocks.

#### Quarterly Revalidation
Open supply requests are flagged for revalidation every **90 days** to confirm parts are still needed. These appear on the Validations Due page with two options:
- **✓ Still Needed** — Resets the 90-day revalidation clock
- **✕ Cancel** — Cancels the supply request

### Inventory Management

#### Adding Inventory Items
Go to **🗄 Inventory** → **+ Add Item**. Fill in:
- Item Name, Part Number, Category, Description
- Initial Quantity, Reorder Point
- Unit Cost, Location (shelf/bin), Vendor, Lead Time
- **Count Class** — Determines cycle count frequency:

| Class | Frequency | Best For |
|-------|-----------|----------|
| A — Daily | Every day | High-value/fast-moving items |
| A — Weekly | Every 7 days | High-value/fast-moving items |
| B — Monthly | Every 30 days | Mid-tier inventory |
| C — Quarterly | Every 90 days | Low-volume/slow-moving items |
| Full — Annual | Every 365 days | Full physical inventory |

#### Stock Transactions
Click **±** on any inventory item to record a transaction:
- **Receive** — Add stock (delivery received)
- **Issue** — Remove stock (issued to technician)
- **Return** — Return unused stock
- **Adjust** — Set absolute quantity (after physical count)

All transactions are logged with quantity, type, notes, and who performed them.

#### Inventory Detail View
Click any item name to see:
- Full item details and stock levels (On Hand, Reserved, Available, Reorder Point)
- Full transaction history with dates, types, quantities, and users

#### Low Stock Warning
Items below their reorder point are highlighted in orange on the inventory list and flagged on the Validations Due page.

---

## 11. Validations Due

The Validations Due page shows everything that needs attention in the next 7 days, organized into three sections.

### Asset Verifications Due
Assets that haven't been verified in 18+ months or are due within the next 7 days.

**Columns:** Asset ID, Name, Type, Platform, Location, Last Verified, Next Due, Verified By, Status, Action

Click **✓ Verify** to open the verification modal — update any fields and confirm.

### Inventory Cycle Counts Due
Inventory items due for cycle count based on their count class.

**Columns:** Item Name, Part #, Class, Platform, Location, On Hand, Last Counted, Next Due, Status, Action

Click **✓ Count** to enter the physical count quantity. The system records an adjust transaction and calculates the next count due date.

### Supply Requisitions — Revalidation Due
Open supply requests that haven't been revalidated in 90+ days.

- **✓ Still Needed** — Confirms parts are still required, resets 90-day clock
- **✕ Cancel** — Cancels the requisition as no longer needed

### Printing
Click **🖨 Print** to print the validations due list. Sidebar and buttons are hidden in the print view.

---

## 12. Platforms

Platforms represent physical locations or organizational units (e.g. NAS Pensacola, School District HQ).

### How Platforms Work
- Assets belong to exactly one platform
- PMs and deficiencies inherit platform from their linked asset
- Users see only their assigned platforms' data
- Access controlled via Nextcloud group membership

### Creating a Platform (Admin)
Go to **Admin → Platforms** → **+ New Platform**. Set the Nextcloud Group Name to link it to a user group. Add users to that group in **Nextcloud Settings → Users**.

---

## 13. Settings

### Access Control
Set the **Editor Group** — only members can create/edit/delete records. Nextcloud admins always have full access.

### PMS Procedures Folder
SOP documents are stored in the **PMS Procedures** folder in Nextcloud Files, auto-created for each user on login.

### User Manual
Available in the sidebar under **Admin → User Manual**.

---

## 14. Mobile App (Field Technician)

### Dashboard
Platform filter buttons · My Work cards (open deficiencies, overdue PMs, total PMs) · Read-only banner if subscription needed.

### Completing a PM
Open PM → tap **✓ Mark Complete** → fill in hours, costs, notes → tap **✓ Mark Complete**.

### Logging a Deficiency
Tap **+ Log Deficiency** → fill in summary, asset, severity, discovery method, description → tap **Log Deficiency**.

### Deficiency Detail
Shows all deficiency information including:
- Severity and status badges
- Cost and effort estimates
- **Supply Requests** — All linked supply requisitions with SRFQ number and live status. Shows "✓ Parts have arrived!" when status is Received.
- Troubleshooting history timeline
- Closeout details (if closed)

### Requesting Parts (Mobile)
From a deficiency detail, tap **🛒 Request Parts** to create a supply requisition:
1. Add line items with item name, part number, NSN, and quantity
2. Tap **+ Add Item** to add more lines
3. Tap **✓ Submit Request** — creates an SRFQ linked to this deficiency
4. A confirmation shows the generated SRFQ number

### Closing a Deficiency
Open deficiency → tap **Closed** → fill in root cause (required), corrective action (required), actual costs → tap **✓ Close Deficiency**.

### Subscription
7-day free trial included. After trial, read-only mode until subscribed.
- **Monthly** — $9.99/month
- **Annual** — $79.99/year (save 33%)

---

## 15. Appendix

### Asset Statuses
Operational · Degraded · Offline · In Maintenance · Decommissioned

### Deficiency Statuses
Open · In Work · Waiting Parts · Waiting Approval · Scheduled · Closed · Cancelled

### Modernization Stages
Design → Planning → Approval → Execution → Complete

### Availability Project Statuses
Planning · Approved · In Progress · Complete

### Work Package Statuses
Draft · Submitted · Approved · Complete

### Supply Request Statuses
Draft · Submitted · Approved · Ordered · Partially Received · Received · Closed · Cancelled

### Supply Request Priorities
Routine · Urgent · Emergency

### Inventory Count Classes
A-Daily · A-Weekly · B (Monthly) · C (Quarterly) · Full (Annual)

### PM Periodicities
As Required (manual) · Weekly (+7d) · Monthly (+30d) · Quarterly (+90d) · Semi-Annual (+180d) · Annual (+365d)

### RFQ Number Formats
- **Work Package RFQ:** `RFQ-XXXXXXXX` — Labor/services packages sent to contractors
- **Supply RFQ:** `SRFQ-XXXXXXXX` — Parts/materials packages sent to vendors

### Standards Reference
- **ISO/IEC 15459** — Unique Item Identifier (UII) format
- **ISO/IEC 16022** — Data Matrix barcode standard (planned)
- **ISO/IEC 15434** — Barcode data encoding syntax (planned)
- **MIL-STD-130** — DoD asset identification marking

---

*Maintain Ops Suite v2.0.3 | Alto Technologies LLC*
*Support: https://github.com/Cyberseal89/maintain-ops-suite-nextcloud/issues*
