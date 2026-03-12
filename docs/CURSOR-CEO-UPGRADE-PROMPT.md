# 340B Advocacy Dashboard — Cursor CEO-Level Upgrade (Budget-Conscious)

**Copy-paste this entire document into Cursor as your prompt.**

---

## Objective

Upgrade HAP 340B Advocacy Dashboard to executive-quality, maintainable, visually clear, and feature-rich while conserving Cursor compute budget.

## Constraints

- Avoid full repo multi-agent runs; use incremental single-file edits.
- Preserve finalized print / PDF flows and map structure.
- Maintain existing layout and design.
- Maximize impact per low-cost edit.

---

## Protected Systems — Do Not Modify

- **Print:** `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` localStorage, `print.html`
- **PDF image export:** `downloadPdfAsImage()`, html2canvas, jsPDF 3-page layout
- **Map:** SVG structure, map injection, state selection
- **CSS:** Never add `overflow:hidden` to `.map-wrap` or `.us-map-wrap`

---

## Safe Improvement Areas

- `340b.html` — content, new panels
- `340b.css` — spacing, typography, visual hierarchy
- `340b.js` — readability, section headers, comments, variable renaming
- `state-data.js` — data, dates, copy
- `config/settings.js` — feature flags
- `docs/` — README, NOVICE-MAINTAINER, OPERATIONS_MANUAL

---

## Operational Strategy

1. **Plan once** — Use existing architecture; avoid repeated full-repo runs.
2. **Single-file edits** — Limit context to the file being updated.
3. **Incremental integration** — Add features in isolated modules.
4. **Testing** — After each edit run `python3 dashboard-audit.py` and manually verify: map, filters, share links, Print/PDF, Download PDF.

**Budget rule:** Prompt only for single-file edits, syntax fixes, or small module generation. Avoid multi-agent full-repo runs.

---

## Tasks (Incremental)

### 1. Code Clarity (340b.js)

Add section headers:
```js
/* ======================================
   MAP INITIALIZATION
   ====================================== */
```

Rename unclear variables: `break1Y` → `page1EndY`

Replace magic numbers with constants:
```js
const PAGE_1_END_RATIO = 0.4; // used when #state-laws is missing
```

Add inline comments for non-obvious logic. Keep functions focused.

### 2. Policy Impact Simulator

HTML (after Community Impact):
```html
<section id="policy-impact-simulator" class="span-12 scroll-reveal">
  <h2>Policy Impact Simulator</h2>
  <p>Explore how policy scenarios may affect hospitals, pharmacies, and patient access.</p>
  <div id="policy-impact-simulator-root"></div>
</section>
```

Modules (isolated): `modules/impact-data.js`, `modules/impact-simulator.js`, `modules/impact-ui.js` — load after 340b.js. Do not modify core dashboard logic.

### 3. Pennsylvania Impact Mode

Modules: `modules/pa-impact-data.js`, `modules/pa-impact-engine.js`, `modules/pa-impact-ui.js`. Same pattern: data, engine, UI. Section id: `pa-impact-mode`.

### 4. Documentation

Update NOVICE-MAINTAINER.md and OPERATIONS_MANUAL.md with new module locations, section headers, constants, and safe-editing workflow.

### 5. CEO Checklist (Pre-Release)

- [ ] Dashboard loads with clear hierarchy and spacing
- [ ] Map, filters, state selection work
- [ ] Print/PDF and Download PDF (image) work
- [ ] Simulator panels appear and render data
- [ ] Documentation allows novice to update data safely
- [ ] Code has section headers, constants, inline comments

---

## Outcome

Executive-ready dashboard, clear maintainable code, analytical simulators, maximum impact for minimal Cursor cost.
