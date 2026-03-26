# UI Components — 340B Dashboard (100X)

Logical components used by the dashboard. Markup and behavior live in **340b.html** and **340b.js**; this folder documents boundaries for reuse and maintainability.

## Component map

| Component        | Location in 340b.js / 340b.html              | Purpose                                      |
|-----------------|-----------------------------------------------|----------------------------------------------|
| **Map**         | `drawMap()`, map lifecycle, tooltips          | Interactive US map, state click, hover        |
| **Charts**      | `fillAdoptionsChart()`                        | Adoptions-by-year bar chart                  |
| **Ranked table**| `fillRankedStateTable()`, `initRankedTableSort()` | Sortable state-by-year table              |
| **KPI cards**   | `.kpi-strip .kpi-card` in HTML, count-up in JS | Executive metrics row                       |
| **State chips** | `renderStateChips()`, filter blocks            | State list with protection/no-protection     |
| **Executive strip** | `.executive-proof-strip` in HTML           | Policy priority, landscape, trust            |
| **Print/PDF**   | `openPrintView()`, `print/print.html`         | Print view and PDF export                    |

## For maintainers

- To change **map** behavior: edit the "Map lifecycle" section in **340b.js** and **340b.css** (`.map-wrap`, `.state-box`, etc.).
- To change **charts**: edit `fillAdoptionsChart()` in **340b.js** and **analytics/policy-insights.js** or **data/historical-trends.js**; styles in **340b.css** (`.adoptions-chart-*`).
- To add a **new component**: add the section in **340b.html**, styles in **340b.css**, and init/fill logic in **340b.js**; use `safeText()` for any dynamic text.

No separate component files are required; the single-page dashboard keeps everything in 340b.html, 340b.css, and 340b.js for simplicity and compatibility with static hosting.
