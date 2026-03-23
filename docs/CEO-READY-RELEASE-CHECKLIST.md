# CEO-Ready Release Checklist (Mark VII)

**Timestamp (UTC):** 2026-03-23T13:44:00Z

## Deterministic Gate (Must Pass)

**Command:** `python3 dashboard-audit.py`  
**Result:** PASS

Deterministic audit highlights:
- No unsafe DOM patterns detected
- No hidden zero-width/BOM characters detected
- External links are properly hardened (`rel="noopener noreferrer"`)
- Entry-page CSP + referrer hardening present
- Print/PDF regression guards present in print CSS
- **Remote dependency check:** main dashboard no longer references remote `unpkg.com` infrastructure

Evidence:
- `unpkg.com` occurrences in `[340b.html](https://…/340b.html)`: **0**

## Preserved Metric Integrity (No Value Drift)

The following approved HAP Pennsylvania metrics were preserved (no edits to metric copy/values):
- **$7.95B** community benefits (2024)
- **72** Pennsylvania hospitals in 340B
- **179** HRSA covered entity audits (FY 2024)
- **7%** U.S. outpatient drug market share

Deterministic presence spot-check counts in source HTML:
- In `340b.html`:
  - `7.95B`: 7 occurrences
  - `72`: 9 occurrences
  - `179`: 7 occurrences
  - `7%`: 3 occurrences
- In `340b-BASIC.html`:
  - `7.95B`: 3 occurrences
  - `72`: 6 occurrences
  - `179`: 2 occurrences
  - `7%`: present (3 occurrences by `7%` substring match)

## Manual Validation Checklist (Human Required)

Record of completion status:
- **Print/PDF page fit (2 pages):** FAIL.
- **Map visibility (Print/PDF):** FAIL.
- **Download PDF(image) rendering (no blank pages):** FAIL.

## Release Risks / Deferred Items
- Manual Print/PDF pagination and rendering correctness vary by browser/print engine; must be verified before distribution.

