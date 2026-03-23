# Mark VII Release Audit Evidence (Deterministic + Manual)

**Timestamp (UTC):** 2026-03-23T09:42:00Z

## Deterministic Validation (Required)

Command executed:

```bash
python3 dashboard-audit.py
```

**Result:** `PASS`

Deterministic checks that passed:
- Unsafe DOM / inline-handler patterns: PASS
- Hidden zero-width/BOM characters: PASS
- External link hardening (`target="_blank"` + `rel="noopener noreferrer"`): PASS
- Entry-page CSP + referrer hardening: PASS
- Print/PDF regression guards present: PASS
- `unpkg.com` remote script/font infrastructure: PASS (no remote infra flagged)
- Prompt library presence checks: PASS

## Evidence: Remote Infrastructure Removed

Deterministic evidence extracted from workspace sources:
- Search target: `[340b.html](https://…/340b.html)`
- Pattern: `unpkg.com`
- **Matches:** `0`

## Evidence: HAP Pennsylvania Metric Integrity (No value drift)

This release evidence records that the following approved executive metric strings remain present in the dashboard sources. Counts are included to support quick spot-checking.

Approved metric set:
- `7.95B` (community benefits)
- `72` (PA hospitals)
- `179` (HRSA covered entity audits)
- `7%` (U.S. outpatient drug market share)

Occurrences in source (workspace text search counts):
- In `340b.html`
  - `7.95B`: 7
  - `72`: 9
  - `179`: 7
  - `7%`: 3
- In `340b-BASIC.html`
  - `7.95B`: 3
  - `72`: 6
  - `179`: 2
  - `7%`: 3

Note: This evidence confirms presence without indicating numeric recomputation. No metric/data source files were modified as part of this release-prep phase.

## Execution Traces (Task-Level Artifacts)

Associated per-task traces (created earlier in this Mark VII process):
- `docs/execution-traces/V1-LOCAL-VENDOR-LIBS-execution-trace.json`
- `docs/execution-traces/V2-CSP-AND-SCRIPT-TAGS-execution-trace.json`
- `docs/execution-traces/V3-JS-COMPAT-CHECK-execution-trace.json`

## Manual Validation Checklist (Human Required)

These items cannot be fully verified deterministically without a browser/print renderer:

1. **Print/PDF page fit:** Confirm the document fits in exactly **2 pages** with no excessive whitespace. (FAIL)
2. **Map visibility:** Confirm the map is visible on the expected page (no blank map region). (FAIL)
3. **Download PDF (image):** Click `Download PDF (image)` and confirm:
   - map is included
   - the rendered PDF is not blank on any page (FAIL)
4. **Invalid hash behavior:** Confirm `#state-XX` (invalid) results in empty selection without console errors. (FAIL)

**Status (recorded):** FAIL.

## Risks / Deferred Items
- Manual Print/PDF renderer differences may change pagination/whitespace. Human validation remains required before publishing.

