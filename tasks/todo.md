# 340B mobile polish — execution checklist

**Baseline viewports (capture screenshots before/after):** 390px (iPhone), 360px (Android small).

## Sections to spot-check

- [ ] Hero US map + `.map-legend-compact` (tiered CSS ≤700px / ≤430px)
- [ ] State detail panel + state list chips
- [ ] PA district map + legend chips (≤600px layout + `visualViewport` redraw)
- [ ] Key findings strip
- [ ] No body horizontal scroll (except table-scroll regions)

## Verification

- [x] `python3 dashboard-audit.py` PASS
- [ ] `340b-BASIC.html` loads (local scripts only) — spot-check in browser
- [ ] Print / PDF smoke (optional)

## Done

Implemented: `--dashboard-inner-max` + removed duplicate Mark VI width overrides; mobile US map legend, static fallback grid columns, PA map min-height/legend grid, `pa-district-map.js` visualViewport listener; executive summary padding ≤768px; card body line-height ≤768px.
