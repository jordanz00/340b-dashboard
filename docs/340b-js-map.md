# 340b.js — Function map (advanced maintainers)

**You do not need this file** to maintain **[340b-BASIC.html](../340b-BASIC.html)**. Use it when you must debug **[340b.js](../340b.js)** (full dashboard).

Functions live inside one IIFE in [340b.js](../340b.js). Search for `function name` to jump.

---

## Startup

| Function | Purpose |
|----------|---------|
| `init` | Entry: `cacheDom`, data check, `runTaskSafely` chains, event listeners |
| `cacheDom` | Caches all `getElementById` / query refs used everywhere |

---

## Config and copy on screen

| Function | Purpose |
|----------|---------|
| `applyConfigCopy` | Pushes CONFIG.copy into intro, exec strip, methodology text |
| `updateExecutiveProofStrip` | Protection / no-protection counts in exec cards |
| `updateMetadata` | Title, meta, freshness strings |
| `applyAboutDataPanel` | “About data” panel from dataset metadata |
| `applyPolicyInsights` | Policy insights strip |

---

## State data helpers

| Function | Purpose |
|----------|---------|
| `getStateAbbr`, `getStateName`, `getStateData`, `isKnownState` | Map feature → state record |
| `getSortedStates`, `validateStateData` | Lists and validation |
| `buildStateSummaryText`, `buildStateDetailSummary`, `buildStateImpactNote` | Detail panel copy |

---

## Map

| Function | Purpose |
|----------|---------|
| `drawMap` | D3 + topojson render |
| `bindMapEvents`, `setupMapKeyboardNav` | Click, hover, keyboard |
| `highlightMapState` | Selected state styling |
| `setMapBusy`, `showMapSkeleton`, `hideMapSkeleton`, `showMapWrapImmediately` | Loading states |
| `buildMapFallback`, `showMapError` | Errors |
| `setupMapVisibilityObserver` | Scroll-in / domino timing |
| `getMapSvgString` | Serialize SVG for print payload |

---

## Selection and filters

| Function | Purpose |
|----------|---------|
| `selectState`, `clearSelection` | Core selection |
| `updateSelectionSummary`, `renderStateDetail`, `renderEmptyStateDetail` | Panel |
| `updateMapContext` | Map headline when state selected |
| `renderStateChips`, `createStateChip`, `initStateChipTooltips` | State lists |
| `applyStateFilter`, `initStateFilter`, `updateListBlockVisibility` | All / protection / none |

---

## Share and URL hash

| Function | Purpose |
|----------|---------|
| `updateUrlHash`, `getHashState`, `buildShareUrl`, `syncSelectionFromHash` | `#state-XX` |

---

## Print / PDF tab (print.html)

| Function | Purpose |
|----------|---------|
| `openPrintView` | Opens print tab, storage key `hap340bPrint` |
| `preparePrintSnapshot` | Finalizes DOM before capture / print |
| `getPrintViewPayload` | Object passed to print view |
| `gatherPrintPayloadSummaryAndKpis` | KPI + list snapshot |
| `buildPrintIntroSnapshot`, `buildPrintStateSummary` | Print-only blocks |
| `cloneMapForPrint` | Clone map for print path |
| `preparePrintSelectionState` | PA default when printing |

---

## Download PDF (image)

| Function | Purpose |
|----------|---------|
| `downloadPdfAsImage` | html2canvas + jsPDF multi-page |
| `initDownloadPdf` | Button wiring |

---

## Other utilities

| Function | Purpose |
|----------|---------|
| `initShare`, `initPrint`, `initExportMapSvg`, `initDatasetDownload` | Toolbar buttons |
| `finalizeCountUpValues`, `initCountUp`, `initScrollReveal` | Animations |
| `handleBeforePrint`, `handleAfterPrint`, `handleKeydown`, `handleResize` | Global handlers |

---

## See also

- [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md) — protected systems; do not rename print payload keys casually
- [GLOSSARY.md](../GLOSSARY.md) — terms (print snapshot, hap340bPrint)
