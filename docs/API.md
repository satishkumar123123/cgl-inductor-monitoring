# API Reference — CGL Dashboard Backend

Base URL (local): `http://localhost:5000`

All protected endpoints require header: `Authorization: Bearer <JWT>`

## Auth

### POST /api/auth/login
Body:
```json
{ "username": "admin", "password": "admin123" }
```
Response:
```json
{ "token": "<jwt>", "user": { "id": "...", "name": "Site Admin", "username": "admin", "role": "Admin" } }
```

### GET /api/auth/me
Returns the currently authenticated user.

## Data

### POST /api/data
Create a new day's record. Body matches the `DailyInductorData` schema
(see `backend/models/DailyInductorData.js`). Fails with 409 if the date
already exists — use PUT instead.

### GET /api/data/:date
Load one day's record, e.g. `GET /api/data/2026-06-30`. 404 if not found.

### PUT /api/data/:date
Upsert (create or update) a day's record. Used by the dashboard's Save and
Update actions.

### DELETE /api/data/:date
Admin role only. Deletes the record for that date.

## Excel Upload

### POST /api/upload-excel
`multipart/form-data`:
- `file` — `.xlsx` / `.xls`
- `date` — `YYYY-MM-DD`

Response:
```json
{
  "message": "Imported successfully",
  "fileName": "plant-sheet.xlsx",
  "uploadedTime": "...",
  "rowsImported": 14,
  "unmatched": ["Some Unrecognised Row"],
  "errors": ["Main Pot · Inductor A (high) · Power = \"N/A\""],
  "record": { "...": "full saved document" }
}
```

## History

### GET /api/history?from=YYYY-MM-DD&to=YYYY-MM-DD&search=text
Returns a lightweight list of saved dates (no nested readings) for the
History page — filterable by date range and free-text search across date,
createdByName, remarks, and status.

## Reports (PM Pot / Main Pot Analysis)

### GET /api/reports/pm-pot/:date
Builds the PM Pot Analysis Report payload (readings for Inductor A/B ×
High/Intermediate, computed stats, and automatic industrial observations)
from the existing `daily_inductor_data` record for that date. 404 if no data
has been saved for that date yet.

Runs through the **Industrial Analysis Engine** (`services/analysisService.js`),
which also compares against the previous saved day (if any) to detect a power
trend. Response includes, beyond `entries`:

- `stats` — `avgCurrent`, `avgVoltage`, `avgPower`, `avgPF`, `totalPower`,
  `maxCurrent`/`minCurrent`, `highestPowerInductor`/`lowestPowerInductor`,
  `currentBalancePercent`, `voltageBalancePercent`
- `observations` — array of `{ id, message, severity }` where `severity` is
  one of `critical` / `warning` / `good` / `info` (current & voltage
  imbalance, PF status, power increasing/decreasing vs the previous day,
  per-inductor overload/underload, impedance-high, resistance variation,
  conductance abnormal, and hard safety-limit flags)
- `healthScore` — 0–100
- `equipmentStatus` — `Excellent` / `Good` / `Normal` / `Needs Attention` / `Critical`
- `statusColor` — `green` / `cyan` / `blue` / `orange` / `red` (for badge styling)
- `recommendations` — plain-English corrective actions derived from the observations

### GET /api/reports/main-pot/:date
Same as above, but for the Main Pot (Inductors A–D).

### POST /api/reports/log
Body: `{ reportType, date, format, stats, observations }`. Called whenever a
report is generated/downloaded/printed. Writes one entry to
`generated_reports` and, for PM/Main Pot reports, one entry to
`analysis_history` in the same call.

### GET /api/reports/preview/:reportType/:date
`reportType` is `pm-pot` or `main-pot`. Returns the same payload as the full
report endpoints — used by Report History's **Preview** action to show a
quick read-only view without navigating away.

### GET /api/reports/history?reportType=&from=&to=&page=&pageSize=
Paginated (default `pageSize=50`, max `200`). Returns
`{ history, total, page, pageSize, totalPages }`. Backed by the
**`report_history`** collection (renamed from the earlier `generated_reports`).

### DELETE /api/reports/history/:id
Admin only. Deletes a report history entry (does not affect the underlying saved data).

## Audit Logs

### GET /api/audit-logs?user=&method=&from=&to=&page=&pageSize=
Admin only. Every mutating request (POST/PUT/PATCH/DELETE) across the whole
API is logged automatically by `middleware/auditLogger.js` — no controller
needs to remember to call anything. Returns
`{ logs, total, page, pageSize, totalPages }`. Backed by the `audit_logs`
collection.

## Power Consumption

### POST /api/power · GET /api/power/:date · PUT /api/power/:date · DELETE /api/power/:date
Standard CRUD for the `daily_power_consumption` collection — one document
per date with `mainPotPower`, `pmPotPower`, `overallPower` (auto-derived),
`metalCharging`, `drossGeneration`, `operatorName`, `shift`, `remarks`, plus
derived `powerPerTon` and `drossPercent`. DELETE is Admin only.

### GET /api/power?from=&to=&month=&year=&shift=
Flexible listing used to feed the Power Consumption page's trend charts.

### GET /api/power/monthly?year=&month=
Aggregated monthly summary (Module 4): `totalProduction`, `totalPower`,
`avgPower`, `avgProduction`, `avgDross`, `powerPerTon`, `drossPercent`,
`highestConsumptionDay` / `lowestConsumptionDay` (by overall power),
`bestEfficiencyDay` / `worstEfficiencyDay` (by power-per-ton — best = lowest,
worst = highest), plus the raw daily records for that month.

### GET /api/power/yearly?year=
Aggregated yearly summary (Module 5): totals, averages, `powerPerTon`,
`drossPercent`, the same day-level `highestConsumptionDay` /
`lowestConsumptionDay` / `bestEfficiencyDay` / `worstEfficiencyDay` fields as
the monthly report (computed across every day in the year), and a
month-by-month breakdown for charting/comparison.

## Analytics

### GET /api/analytics?from=&to=&month=&year=&shift=
Powers the Analytics Dashboard. Combines `daily_power_consumption` records
with each day's average Inductor PF (pulled from `daily_inductor_data`) into
one dataset.

- `from`/`to`, or `month`+`year`, or `year` alone narrows the trend records and summary cards.
- `shift` applies everywhere, including the monthly/yearly comparison charts.
- Monthly/yearly comparison charts always aggregate the **full history** (shift filter still applies) so they stay meaningful even when the date filter is narrowed to a single day.

Response shape:
```json
{
  "records": [{ "date": "2026-06-30", "shift": "A", "mainPotPower": 0, "pmPotPower": 0, "overallPower": 0, "metalCharging": 0, "drossGeneration": 0, "powerPerTon": 0, "drossPercent": 0, "avgPF": 0.98 }],
  "summary": { "avgProduction": 0, "avgPower": 0, "avgDross": 0, "avgPF": 0, "highestProduction": {}, "lowestProduction": {}, "highestPower": {}, "lowestPower": {} },
  "monthlyComparison": [{ "month": "2026-06", "power": 0, "production": 0 }],
  "yearlyComparison": [{ "year": "2026", "power": 0, "production": 0 }]
}
```
