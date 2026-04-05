# Print and export pipelines (340B)

Two paths exist; both should stay aligned with `state-data.js` (`HAP_STATIC_METRICS`, `CONFIG`) and `DataLayer`.

## Desktop (`340b.html` + `340b.js` → `print.html`)

- The advanced dashboard writes a normalized snapshot to session/local storage.
- `print.html` reads the payload, renders KPIs and map as safe `textContent` / validated SVG image, then offers **Print** or **Download PDF** (html2canvas + jsPDF when present).

## Mobile (`340b-mobile.html` + `340b-mobile.js`)

- **Advocacy report:** `generateReport()` builds a temporary `.print-report` in the DOM and calls `window.print()`; then removes the node.
- **CSV / Gold JSON:** More tab — CSV from `downloadCsv()`; **Export Gold JSON** calls `DataLayer.exportJSON()` (includes `_meta` for source and validation status).

## Parity rule

When KPI numbers change, update **`HAP_STATIC_METRICS`** in `state-data.js` once; mobile binds `[data-metric-key]` from `DataLayer`, and print/report strings use `staticMetric()` helpers where refactored.
