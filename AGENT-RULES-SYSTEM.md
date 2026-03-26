# 340B Dashboard — Rules and Update System

Use this document to keep the dashboard, prompts, and improvement pipeline organized and stable. Run in Agent mode for maintenance tasks.

---

## Rules Hierarchy

```
AGENT-RULES-SYSTEM.md (this file) — meta rules, update workflow
    │
    ├── SECURE-FORCE.md — multi-agent security (SAST, input/auth review, infra, deploy gate)
    ├── AGENT-TEMPLATE.md — 50 improvements (batches A–E)
    ├── ULTRA-prompts.md — structured waves (v01–v12)
    ├── 340b-dashboard-prompts.md — master prompt library
    └── DAILY-IMPROVEMENT.md — periodic improvement workflow
```

---

## Update Workflow

### Before Any Change

1. Read [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) — know which files to edit
2. Run `python3 dashboard-audit.py` — baseline must pass
3. Confirm Print/PDF and Download PDF (image) work — map visible, no blank pages
4. When touching auth, user input, or data connections: read [SECURE-FORCE.md](SECURE-FORCE.md); run Semgrep and manual checklist before release

### After Any Change (Print, Map, PDF)

1. Open Print/PDF preview — verify map visible, 2–4 pages max
2. Click Download PDF (image) — verify map and full content across pages
3. Run `python3 dashboard-audit.py`

### Release Gate

Do not publish if:
- Print view shows "Map not available"
- PDF image has incomplete map
- `dashboard-audit.py` fails
- After auth, user input, or data-connection changes: Secure Force checklist (Semgrep + manual review) has not been run

---

## Stability Rules

### Print and PDF

| Rule | Files | Check |
|------|-------|-------|
| Map in print view | print.html, 340b.js | localStorage payload; DOMParser/importNode for SVG |
| Map in PDF image | 340b.js | showMapWrapImmediately; overflow:visible; 900ms delay |

### Do Not

- Remove or change `hap340bPrint` localStorage flow without updating print.html
- Add `overflow: hidden` to `.map-wrap` or `.us-map-wrap`
- Change scroll-reveal opacity/IntersectionObserver logic
- Put PDF-specific CSS in 340b.css (inject in JS during capture)

### Must Preserve

- Print payload key: `hap340bPrint`
- preparePrintSnapshot order: finalizeCountUpValues → revealAllAnimatedSections → preparePrintSelectionState → buildPrintIntroSnapshot → drawMap
- CONFIG.lastUpdated as single source for dates

---

## Improvement Run Order

1. **ULTRA waves** — v03 → v04 → v05 → v06 → v07 (in order)
2. **50 Improvements** — Batch A → B → C → D → E (via [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md))
3. **Ad-hoc** — Use [340b-dashboard-prompts.md](340b-dashboard-prompts.md) for targeted prompts

---

## Agent Mode Commands

| Command | Action |
|---------|--------|
| "Run Agent Batch A" | Execute AGENT-TEMPLATE Batch A (SEO) |
| "Run the 50 improvements" | Execute batches A–E in order |
| "Run Secure Force" / "Security scan" | Run Semgrep; run SECURE-FORCE.md checklist (input/auth, no hardcoded creds, review before deploy) |
| "Fix print/PDF" | Apply stability rules; verify map visibility |
| "Update handoff" | Mark ULTRA wave complete; update DAILY-IMPROVEMENT |
| "Audit and stabilize" | Run dashboard-audit; verify Print and PDF image |

---

## File Roles (Quick Ref)

| File | Purpose |
|------|---------|
| state-data.js | Dates, state law data, config |
| 340b.html | Content, structure |
| 340b.js | Map, buttons, print/PDF flow |
| 340b.css | Layout, print styles |
| print.html | Dedicated print view |
| print-view.css | Print view layout |
