# Mark VII Post-Sprint Validation

**Timestamp (UTC):** 2026-03-23T13:35:10Z

## Scope
Deterministic validation and auditability hardening for the **Mark VII Improvements** plan, focused on:
1) removing remaining remote `unpkg.com` infrastructure from the main dashboard for deterministic audit passes, and  
2) preserving HAP Pennsylvania metric integrity (no metric/value edits).

## Tasks Executed (from plan)
- `V1-LOCAL-VENDOR-LIBS` — Added local `html2canvas`/`jsPDF` artifacts under `assets/vendor/` + locks + execution trace.
- `V2-CSP-AND-SCRIPT-TAGS` — Updated `[340b.html](/Users/jordanzabady/Desktop/Cursor Projects/340b.html)` CSP + script tags to load local vendor files; removed `unpkg.com` references.
- `V3-JS-COMPAT-CHECK` — Verified `340b.js` detection logic aligns with UMD globals exposed by the localized vendor artifacts.

## Deterministic Audit Results
Run: `python3 dashboard-audit.py`

**Result:** `PASS`

Key audit checks that passed:
- No unsafe DOM patterns found (`innerHTML`, inline handlers, etc.)
- No hidden zero-width/BOM characters detected
- All `target="_blank"` links include `rel="noopener noreferrer"`
- App entry pages include CSP + referrer hardening
- Print/PDF regression guards exist in `340b.css` / print assets
- **Remote asset infrastructure check:** removed (no remote script/font infrastructure remains)
- Print/PDF structure checks detect expected print header + intro snapshot layout
- Prompt library presence checks pass

## Remote Reference Verification
Search: `unpkg.com` in `[340b.html](/Users/jordanzabady/Desktop/Cursor Projects/340b.html)`

- **Matches found:** `0`

## Metric Integrity Gate (HAP PA metrics)
Verified presence (and no conflicting values introduced) for the approved HAP Pennsylvania metrics across:
- `[340b.html](/Users/jordanzabady/Desktop/Cursor Projects/340b.html)`
- `[340b-BASIC.html](/Users/jordanzabady/Desktop/Cursor Projects/340b-BASIC.html)`

Approved metric set (must remain unchanged):
- `7.95B` community benefits
- `72` Pennsylvania hospitals
- `179` HRSA oversight audits (covered entities)
- `7%` U.S. drug market share

Evidence highlights:
- `340b.html` contains `$7.95B` in KPI + key findings + print-source summary, and `72`, `179`, and `7%` values in KPI/exec/supporting areas.
- `340b-BASIC.html` contains `$7.95B`, `72`, and `179` in its KPI/key findings surfaces and `7.95B` in community hero.

## Execution Trace Artifacts
Execution traces created:
- `docs/execution-traces/V1-LOCAL-VENDOR-LIBS-execution-trace.json`
- `docs/execution-traces/V2-CSP-AND-SCRIPT-TAGS-execution-trace.json`
- `docs/execution-traces/V3-JS-COMPAT-CHECK-execution-trace.json`

## Manual Regression Gate (still required)
Run the following human checks before publishing:
- Open Print/PDF and confirm the document fits in exactly **2 pages** with no excessive white space.
- Confirm page 1 includes: header, intro cards, executive strip, map, selection summary, state detail.
- Confirm page 2 includes: state summary, trends, KPIs, supporting cards, community benefit, access, PA safeguards, methodology, sources.
- Confirm “default Pennsylvania context” prints when no state is selected.
- Click **Download PDF (image)** and confirm the output shows map + full content without blank pages.

## Remaining Risks / Deferred Items
- Manual checks above are not executed by the deterministic audit script and must be completed by a human reviewer.
- If any environment differs (mobile viewport dimensions, printing engine behavior), rerun the manual gate for layout regressions.

