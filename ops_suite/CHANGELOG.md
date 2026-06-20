# Changelog

All notable changes to Maintain Ops Suite are documented here.

## [Unreleased]

## [2.5.1] - 2026-06-18
### Added
- The Library: "📂 Browse" button on document create/edit form opens a full Nextcloud file browser to attach a file to the revision
- Generic showFileBrowser() helper replaces the SOP-picker-specific pattern — reusable across any form that needs to pick a Nextcloud file
- Revision history table now shows the attached filename as a clickable link to open/view the file

## [2.5.0] - 2026-06-18
### Added
- Sprint 0D: MBSE Stubs — Requirements, Interfaces, and Traceability
- ops_requirements table with auto-generated REQ-{SHOP}-{ASSET}-{SEQ} codes, req types, threshold/objective/unit, verification tracking, and met/degraded/not_met/untested status
- ops_interfaces table with auto-generated IF-{SHOP}-{ASSET}-{SEQ} codes, directed from/to asset linkage, type, specification, standard, canvas ref (populated Sprint 0F)
- ops_req_traceability table linking requirements to any record type with trace type (satisfies/verified_by/allocated_to/derived_from/breaks)
- Requirements list, detail, and form views under new Systems sidebar section
- Interfaces list and form views
- Traceability panel on requirement detail with add/remove links
- MbseController handles all three resources; SystemInterface class named to avoid PHP keyword collision

## [2.4.2] - 2026-06-18
### Changed
- Document form now shows asset dropdown (searchable by asset code and name) for linking
- Revision is now fully automatic — every save auto-advances Rev A→B→C; create starts at Rev A
- Edit form shows "what changed?" field and saves a revision record on every update
- Separate "Add Revision" button removed from document detail — revisions are implicit in edits
- Edit button on detail page relabeled "Edit & Advance Revision" to make behavior clear

## [2.4.1] - 2026-06-18
### Fixed
- Document forms now use correct DOM helpers (formBuilder() reference removed — was causing silent failure on New Document button)
### Changed
- Document Registry renamed to "The Library"
- Shops moved into Platforms page as a second tab — sidebar entry consolidated to "Platforms & Shops"

## [2.4.0] - 2026-06-18
### Added
- Sprint 0C: Document Registry — formal document management with doc numbers, categories, revision history, and approval tracking
- ops_documents and ops_document_revisions tables
- Full CRUD API at /api/documents with nested /revisions endpoints
- Document Registry page in sidebar (Configuration section)
- Documents tab on asset detail panels with inline doc list
- Idempotent POST (local_uuid) for offline sync readiness

## [2.3.3] - 2026-06-18
### Fixed
- Added missing local_uuid property to Deficiency and Procedure entities — SELECT * after migration returned the new column but undeclared properties caused PHP 8.2 dynamic-property errors (HTTP 500 on dashboard and asset creation)

## [2.3.2] - 2026-06-18
### Fixed
- Removed ORDER BY asset_code from AssetMapper::findAll() — column doesn't exist until migrations run, causing HTTP 500 on all asset queries including dashboard

## [2.3.1] - 2026-06-18
### Added
- Shop Registry — disciplines within platforms (C1, IT1, HV1, etc.) with CRUD management page
- Asset coding system — auto-generated TYPE-SHOP-POSITION codes (HW-C1-001, SW-IT1-003, etc.)
- Asset hierarchy — parent_id, depth, system_position, hierarchy_path for nested asset trees
- Criticality codes — CR / DE / RD / SP / AD on assets with readiness engine
- Readiness engine — calculates FULL-OP / DEG-OP-MIN / DEG-OP-BEL / DOWN-OP per asset from open deficiencies and bypass state; plain-English narrative auto-generated
- local_uuid on assets, deficiencies, procedures — foundation for offline-first sync (SYNC-006 idempotent POST)
- GET /api/assets/{id}/readiness and PUT /api/assets/{id}/criticality endpoints

## [2.2.3] - 2026-06-01
### Changed
- Bumped Nextcloud max-version to 33 (Hub 10 Winter)

## [2.2.2] - 2026-05-11
### Fixed
- File links now use DAV URL directly, removing dependency on internal serve endpoint

## [2.2.1] - 2026-05-11
### Fixed
- Direct DAV URL used for TDP file links to bypass CSP restrictions on serve endpoint

## [2.2.0] - 2026-05-11
### Changed
- TDP file viewer simplified to open files in a new tab instead of inline modal

## [2.1.0] - 2026-05-11
### Added
- Inline file viewer modal for PDFs and images in TDP section
- Custom file serve endpoint for inline PDF/image rendering

## [2.0.5] - 2026-05-10
### Added
- TDP folder structure auto-created per asset with categorized subfolders on asset creation

## [2.0.4] - 2026-05-10
### Added
- Organization settings panel (org name, address, contact — used in RFQ exports)
- About page in sidebar
### Changed
- PM SOP field renamed for clarity

## [2.0.3] - 2026-05-10
### Added
- App Store screenshots
- Comprehensive README with module overviews, API docs, standards alignment, and roadmap

## [2.0.2] - 2026-05-10
### Added
- Supply requests linked on deficiency and modernization detail panels
- Mobile supply request status tracking

## [2.0.0] - 2026-05-10
### Added
- Supply/Warehouse module fully integrated into web UI

## [1.9.0] - 2026-05-10
### Added
- Asset verification workflow with 18-month cycle tracking
- UII auto-generation on asset creation (ISO 15459 compliant)
- CAGE code, IUID, and UII fields on assets
- Inventory cycle count classification (A/B/C) and stock transaction history
- Validations due view for overdue verifications

## [1.8.0] - 2026-05-10
### Added
- Work Packages module: bundle PMs and modernizations for external quoting
- Auto-generated RFQ numbers and one-click professional RFQ PDF export
- One-to-one item assignment constraint to prevent double-booking
- Supply/Warehouse module: requisitions, inventory management, stock transactions
- NSN, CAGE code, manufacturer, and UOM fields on supply items
- Supply RFQ export for vendor quoting
- Inventory cycle counting with A/B/C classification and revalidation tracking

## [1.7.0] - 2026-05-10
### Added
- Availability Projects module with visual Gantt chart
- Add PMs, modernizations, deficiencies, and milestones to availability windows
- Color-coded bars with dependency arrows and detail popups
- Out-of-window warnings for schedule realism
- User Manual served from sidebar

## [1.6.0] - 2026-05-10
### Added
- Modernizations module: full lifecycle management for asset upgrade projects
- Five-stage workflow (Design → Planning → Approval → Execution → Complete)
- Technical Data Package (TDP) management with document category subfolders
- Link deficiencies and supply requests to modernization projects
- Create Modernization directly from asset or deficiency detail views

## [1.5.0] - 2026-05-10
### Added
- Platform filtering applied across all list endpoints (assets, procedures, deficiencies)
- Platform selector on dashboard for scoped stats view

## [1.4.0] - 2026-05-09
### Added
- Platform Management module with multi-site support
- Nextcloud group-based access control per platform
- Users see only data for their assigned platforms
- Platform dropdown on asset, procedure, and deficiency forms

## [1.3.0] - 2026-05-09
### Added
- Deficiency closeout workflow (root cause, corrective action, actual costs)
- Closeout modal in web UI with closed-by and closed-at tracking
- Closeout details card in deficiency detail view

## [1.2.0] - 2026-05-09
### Added
- PM closeout fields (actual hours, parts cost, labor cost, completion notes)
- PM closeout modal in web UI
- Procedure detail view with closeout data display

## [1.1.0] - 2026-05-09
### Added
- Per-user dashboard stats endpoint
- assigned_to filter on procedures and deficiencies
- Field workflow routes (Log Deficiency, Schedule Maintenance)

## [1.0.4] - 2026-05-08
### Added
- Initial release
- Configuration Tracker with UII/IUID support and warranty tracking
- Preventive Maintenance scheduling with next-due date calculation
- Deficiency Tracking with SEV-1 through SEV-5 severity levels
- REST API for Android mobile client
