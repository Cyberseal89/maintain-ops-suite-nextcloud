# Maintain Ops Suite — User Manual
**Version 1.7.4 | Alto Technologies LLC**

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
9. [Platforms](#platforms)
10. [Settings](#settings)
11. [Mobile App (Field Technician)](#mobile-app)

---

## 1. Overview

Maintain Ops Suite is an integrated operations management platform built on Nextcloud. It provides five core modules:

- **Configuration Registry** — Track all hardware, software, and firmware assets
- **Preventive Maintenance (PM)** — Schedule, track, and complete PM procedures
- **Deficiency Tracking** — Log, manage, and close deficiencies found in the field
- **Modernizations** — Manage asset upgrade projects with full TDP package tracking
- **Availability Projects** — Project manage multiple work items with Gantt scheduling

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
2. Enter your Nextcloud server URL
3. Log in and grant access when prompted
4. Complete the onboarding slides

---

## 3. Dashboard

### Platform Filter
Buttons at the top scope all data to one or more platforms. Select All or individual platforms. Multiple selections allowed.

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
   - Linked Assets (digital twin cross-references), Tags, Notes
3. Click **Create Asset**

### Asset Detail Actions
- **✏ Edit Asset** — Modify configuration
- **+ Log Deficiency** — Log a deficiency against this asset
- **+ PM Procedure** — Add a PM procedure
- **🔧 Create Modernization** — Start a modernization project

---

## 5. Preventive Maintenance

### Completing a PM
1. Click **✓ Done** from the PM Dashboard or procedures list
2. Fill in the closeout modal:
   - Hours Spent, Parts Cost ($), Labor Cost ($), Completion Notes
3. Click **✓ Mark Complete**
4. Next due date is automatically calculated

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

### Closing a Deficiency
Click **✓ Close**. Fill in:
- **Root Cause** (required)
- **Corrective Action Taken** (required)
- Actual Parts Cost, Labor Cost, Man-Days

A history entry is automatically created summarizing the closeout.

### Escalating to Modernization
Click **🔧 Escalate to Modernization** from any deficiency detail to create a linked modernization.

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
- **Linked Deficiencies** — Associated deficiencies

### TDP Document Types
Drawings · Tech Manuals · Test Plan · Training · SOPs · Other

Each document tracks: title, file reference (Nextcloud path or URL), status (Pending/In Progress/Complete), notes.

---

## 8. Availability Projects

### Creating a Project
Go to **📅 Avail Projects** → **+ New Project**. Start Date and End Date are required (defines the availability window).

### Adding Items
Click **+ Add Item**. Select type:
- **PM Procedure** — Pulls in next due date
- **Modernization** — Pulls in start/target dates
- **Deficiency** — Pulls in target completion date
- **Milestone** — Point-in-time marker

Out-of-window warnings are shown if item dates fall outside the project window.

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
Point-in-time markers for key events: "100% Modernization Complete", "PM Lock", "System Online", "Inspection Day", etc.

---

## 9. Platforms

Platforms represent physical locations or organizational units (e.g. NAS Pensacola, Norfolk).

### How Platforms Work
- Assets belong to exactly one platform
- PMs and deficiencies inherit platform from their linked asset
- Users see only their assigned platforms' data
- Access controlled via Nextcloud group membership

### Creating a Platform (Admin)
Go to **Admin → Platforms** → **+ New Platform**. Set the Nextcloud Group Name to link it to a user group.

To grant a user access: add them to the platform's Nextcloud group in **Nextcloud Settings → Users**.

---

## 10. Settings

### Access Control
Set the **Editor Group** — only members can create/edit/delete records. Admins always have full access.

### PMS Procedures Folder
SOP documents are stored in the **PMS Procedures** folder in Nextcloud Files, auto-created for each user on login.

---

## 11. Mobile App (Field Technician)

### Dashboard
Platform filter buttons · My Work cards (open deficiencies, overdue PMs, total PMs) · Read-only banner if subscription needed.

### Completing a PM
Open PM → tap **✓ Mark Complete** → fill in hours, costs, notes → tap **✓ Mark Complete**.

### Logging a Deficiency
Tap **+ Log Deficiency** → fill in summary, asset, severity, discovery method, description → tap **Log Deficiency**.

### Closing a Deficiency
Open deficiency → tap **Closed** → fill in root cause (required), corrective action (required), actual costs → tap **✓ Close Deficiency**.

### Subscription
7-day free trial included. After trial, read-only mode until subscribed.
- **Monthly** — $9.99/month
- **Annual** — $79.99/year (save 33%)

---

## Appendix: Status Reference

| Module | Statuses |
|--------|----------|
| Assets | Operational · Degraded · Offline · In Maintenance · Decommissioned |
| Deficiencies | Open · In Work · Waiting Parts · Waiting Approval · Scheduled · Closed · Cancelled |
| Modernizations | Design · Planning · Approval · Execution · Complete |
| Avail Projects | Planning · Approved · In Progress · Complete |

---

*Maintain Ops Suite v1.7.4 | Alto Technologies LLC*  
*Support: https://github.com/Cyberseal89/maintain-ops-suite-nextcloud/issues*
