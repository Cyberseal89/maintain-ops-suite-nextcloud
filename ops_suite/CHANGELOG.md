## 1.3.3 – 2026-05-09
### Added
- Deficiency closeout details card in web UI
- Root cause and corrective action display for closed deficiencies

## 1.3.2 – 2026-05-09
### Added
- Deficiency closeout fields (root cause, corrective action, actual costs, closed by, closed at)
- Automatic closed_by and closed_at on status change to closed

## 1.3.1 – 2026-05-09
### Added
- Deficiency closeout modal in web UI with root cause and corrective action fields

## 1.3.0 – 2026-05-09
### Added
- Deficiency closeout workflow (root cause, corrective action, actual costs)
- DB migration for deficiency closeout fields
- Close deficiency modal in web UI

## 1.2.3 – 2026-05-09
### Added
- Procedure detail view with clickable rows in web UI
- Closeout data displayed in procedure detail panel

## 1.2.2 – 2026-05-09
### Added
- Procedure detail view in web UI showing all fields including closeout data

## 1.2.1 – 2026-05-09
### Added
- PM closeout modal in web UI with hours, parts cost, labor cost, and notes

## 1.2.0 – 2026-05-09
### Added
- PM closeout fields (actual_hours, actual_parts_cost, actual_labor_cost, completion_notes)
- DB migration for PM closeout fields
- Complete PM endpoint accepts closeout data

## 1.1.1 – 2026-05-09
### Fixed
- Dashboard myStats endpoint uses uid query param directly

## 1.1.0 – 2026-05-09
### Added
- Per-user dashboard stats endpoint (myStats)
- assigned_to filter on procedures and deficiencies
- Field workflow routes (Log Deficiency, Schedule Maintenance)

## 1.0.4 – 2026-05-08
### Added
- Initial release
- Configuration Tracker, Preventive Maintenance, Deficiency Tracking modules
- REST API for Android mobile client
