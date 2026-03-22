# Refactoring Codebase Manual — 340B Dashboard

This manual is for a novice coder who is learning on their own and using this dashboard as a first showcase project. It explains how to refactor the codebase daily so that everything stays easy to understand, modify, update, maintain, and export for other dashboard-style projects.

---

## 1. Who this is for

You are a **novice coder** with limited professional experience, learning on your own. You understand some basic concepts (variables, functions, HTML, CSS) and you want to:

- **Understand every part** of this project so nothing feels like a black box.
- **Change things safely** without breaking the dashboard or the print/PDF flow.
- **Reuse what you learn** so you can build or adapt similar dashboards later.

This manual and the 100 refactor prompts (ULTRA v13–v22) are designed so you can work through them at your own pace—one prompt per day is enough. The goal is crystal clarity: labels everywhere, simple structure, and a codebase you can show off as one of your first projects using these tools.

---

## 2. This project as your showcase

**What this dashboard does:** It shows 340B drug-pricing policy by state: an interactive US map, state lists with filters (All / Protection / No protection), key numbers (e.g. 72 PA hospitals, $7.95B community benefits), and supporting copy. Users can share a link, print or save as PDF, and download the map as SVG.

**Why it’s a good first project:**

- **Data + HTML + CSS + JS** — You see how one data file (`state-data.js`) drives the page, how HTML defines structure, CSS controls layout and print, and JavaScript handles the map, buttons, and print/PDF.
- **No backend** — Everything runs in the browser. You don’t need a server or database to understand or change it.
- **Print and PDF** — You learn how a “print snapshot” is prepared and how the Download PDF (image) flow works, which are useful patterns for other reports or dashboards.

The **100 novice refactor prompts** (ULTRA v13–v22 in [ULTRA-prompts.md](ULTRA-prompts.md)) turn this project into a learning and showcase piece: they add labels, comments, and small simplifications so that every file is easy to read and explain. You can run one prompt per day and watch the codebase become clearer over time.

---

## 3. Code map (where everything lives)

Use this table to decide **which file to open** when you want to change something.

| File | Role | Edit this when… |
|------|------|------------------|
| **state-data.js** | Data only | You need to change dates, share URL, state law records, or high-level copy (titles, descriptions). Do not use this file for layout, colors, or button behavior. |
| **340b.html** | Structure and content | You need to change visible text, headings, sections, links, or the order of blocks on the page. |
| **340b.js** | Behavior and logic | You need to change how the map works, how buttons behave, filters, print/PDF/share logic, or any “when the user does X, the app does Y.” |
| **340b.css** | Layout and print | You need to change spacing, colors, breakpoints, or how the page looks when printed (Print/PDF or Download PDF image). |
| **print.html** | Print view page | You need to change the dedicated print view (the page that opens when the user clicks Print/PDF). The map and data are injected from 340b.js via localStorage; see [AGENT-RULES-SYSTEM.md](AGENT-RULES-SYSTEM.md) before changing that flow. |
| **print-view.css** | Print view layout | You need to change the layout or styling of the print view page. |

For more detail (including which functions to check when print or share is wrong), see [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md). **340b.html** uses section comments only (no file-level CODE MAP); structure: header → toolbar → main (intro, executive, map hero, state lists, KPI, supporting, community benefit, policy) → footer; the ids 340b.js requires are listed in cacheDom() and the Reuse checklist below.

---

## 4. How to refactor daily

Do **one small change per day** so you stay safe and can learn from each step.

1. **Pick one prompt** from the current “novice refactor” wave in [ULTRA-prompts.md](ULTRA-prompts.md) (waves v13–v22). Start with v13.1, then v13.2, and so on; or jump to the wave that matches what you want to improve (labels, simplify, docs, etc.).
2. **Apply only that prompt.** Do not mix in other edits. Read the prompt, do exactly what it says (add a comment, add a label, split one function, etc.).
3. **Test.** Open the page in a browser. Click Print/PDF and Download PDF (image). If you changed something that might affect layout or behavior, run `python3 dashboard-audit.py` and fix any failures.
4. **Commit or note.** Commit your change with a message like `Novice refactor v13.1: add comment above preparePrintSnapshot`. Or add a line in [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md) under “Last improvement”: “Last refactor: ULTRA v13.1 on [date].”
5. **Next day, next prompt.** Repeat. After you finish a full wave (e.g. all 10 prompts in v13), run the audit and the print gate once more, then move to the next wave.

One prompt per day keeps the diff small and makes it easy to see what each change did. If something breaks, you know which prompt caused it.

---

## 5. Labeling and clarity rules

We label the code so a novice can scan a file and know what each part does.

- **Every main file** has a short **CODE MAP** or “What’s in this file” at the top (see 340b.js, 340b.css, state-data.js). If you add a new section, add a line to that map.
- **Sections in code** are marked with clear comments, e.g. `/* --- Print preparation --- */` or `<!-- Utility toolbar -->`. Use the same style so the project stays consistent.
- **Non-obvious logic** gets a one-line “why” comment: e.g. “Wait for map SVG so the PDF capture includes the full map.”
- **No jargon without explanation.** If a term (e.g. “print snapshot,” “count-up”) appears in code or docs, it should have a one-sentence explanation in this manual or in a comment.

The ULTRA v13–v16 prompts add many of these labels and comments; v19 adds a glossary so terms are defined in one place.

---

## 6. Simplifying the code

We keep the code easy to follow by following a few principles:

- **One concern per function** where possible. If a function does two things (e.g. “build data and then update the DOM”), consider splitting it into two functions with clear names.
- **Names that describe purpose.** A function named `updateSelectionSummary()` is clearer than `doUpdate()`. Use the same idea for variables and CSS classes.
- **Avoid deep nesting.** If you have many levels of `if` or callbacks, see if you can flatten the logic or extract a helper.
- **File size.** 340b.js is one main file by design so all behavior lives in one place. If you split something out, keep a single entry point and document where the split logic lives.

The **simplify** prompts in ULTRA v17 (340b.js) and v18 (CSS and design tokens) apply these ideas in small steps without changing what the page does.

---

## 7. Easy to update and change

Use this decision tree when you want to change something:

- **“I want to change…”**
  - **…dates, state data, or high-level copy** → [state-data.js](state-data.js)
  - **…visible text, headings, or section order** → [340b.html](340b.html)
  - **…how a button or the map works** → [340b.js](340b.js)
  - **…spacing, colors, or print layout** → [340b.css](340b.css)
  - **…the print view page** → [print.html](print.html) and [print-view.css](print-view.css)

If you’re not sure, open the **code map** at the top of [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) or the table in section 3 above.

---

## 8. Export and reuse for other projects

You can use this dashboard as a template for another project (e.g. a different policy dashboard or a different dataset). The detailed checklist is in **section 10 (Reuse checklist)** below. The ULTRA **v20** prompts in [ULTRA-prompts.md](ULTRA-prompts.md) expand the same ideas.

---

## 9. Glossary (central reference)

All terms are defined in **[GLOSSARY.md](GLOSSARY.md)** (CONFIG, STATE_340B, print snapshot, count-up, hap340bPrint, PA Impact, Policy Simulator, BASIC vs full dashboard, etc.). Use that file as the single source of truth so definitions stay in one place.

---

## 10. Reuse checklist (use this project as a template)

**Config locations:** Where each setting lives (state-data, config/, data/) is summarized in **[CONFIG-INDEX.md](CONFIG-INDEX.md)**.

**Files to copy:** 340b.html, 340b.css, 340b.js, state-data.js. Optionally print.html and print-view.css. If using the map, copy assets/vendor (D3, TopoJSON, states).

**What to rename:** CONFIG (dashboardTitle, shareTitle, shareUrlBase, dataFreshness, lastUpdated, copy), page title and meta in 340b.html, STATE_340B or your data object name, and any HAP-specific text.

**What to keep as-is:** DOM ids used by 340b.js: #us-map, #state-lists-wrap, #community-benefit, #methodology-content, #main-content, #state-laws, and the rest referenced in cacheDom(). The preparePrintSnapshot and openPrintView flow; the localStorage key hap340bPrint; the order of steps in preparePrintSnapshot.

**Data shape:** STATE_340B keys are two-letter state codes. Each state has y (year or null), pbm (boolean), cp (boolean), notes (string). FIPS_TO_ABBR and STATE_NAMES must exist for the map to work.

**Print view dependency:** `print.html` reads one localStorage key (`hap340bPrint`) and expects the payload shape produced by `getPrintViewPayload()` in 340b.js. Changing the payload keys or the storage key requires coordinated changes in both 340b.js and print.html.

**Print payload schema (getPrintViewPayload → print.html ids):** selectionTitle → pv-selection-title, selectionText → pv-selection-text, mapSvg → pv-map-container (injected as SVG or fallback text), protectionCount → pv-protection-count, noProtectionCount → pv-no-protection-count, statesWithList → pv-states-with-list, statesWithoutList → pv-states-without-list, kpiDrug → pv-kpi-drug, kpiBenefit → pv-kpi-benefit, kpiOversight → pv-kpi-oversight, kpiPA → pv-kpi-pa, dataFreshness → pv-data-freshness, methodologyDate → pv-methodology-date.

**Script order:** state-data.js first, then D3/TopoJSON/states if using the map, then html2canvas and jsPDF if using Download PDF (image), then 340b.js last.

**Common pitfalls:** (1) Changing DOM ids that 340b.js expects will break the map or PDF breaks. (2) Removing or renaming CONFIG keys without updating 340b.js will cause errors. (3) Changing the print payload shape without updating print.html will break the print view.

---

## 11. The 100 novice refactor prompts

The **100 prompts** live in [ULTRA-prompts.md](ULTRA-prompts.md) as **ULTRA v13 through v22**. Each wave has 10 prompts and a theme:

| Wave | Theme |
|------|--------|
| v13 | Labels and comments — 340b.js |
| v14 | Labels and comments — 340b.css |
| v15 | Labels and comments — state-data.js and data layer |
| v16 | Labels and comments — 340b.html |
| v17 | Simplify — 340b.js patterns |
| v18 | Simplify — CSS and design tokens |
| v19 | Documentation and glossary |
| v20 | Export and reuse |
| v21 | Learning aids and inline explanations |
| v22 | Daily refactor workflow and safety |

**How to use them:** Run one prompt per day, or run a full wave (10 prompts) in one session. After each wave, run `python3 dashboard-audit.py` and test Print/PDF and Download PDF (image). Then move to the next wave. You do not need to run earlier ULTRA waves (v01–v12) first; v13–v22 are written so a novice can start with them anytime.

---

## 12. Quick reference

- **Run the audit:** `python3 dashboard-audit.py` — do this after meaningful edits and after each full novice refactor wave.
- **Print gate:** Before you publish, open **Print/PDF** and **Download PDF (image)** and confirm the map is visible and there are no blank or broken pages.
- **Where to read next:**
  - [docs/INDEX.md](docs/INDEX.md) — documentation navigation (“start here” hub)
  - [GLOSSARY.md](GLOSSARY.md) — all terms in one place
  - [CONFIG-INDEX.md](CONFIG-INDEX.md) — where each config file lives
  - [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) — which file to edit for what; release order; debugging.
  - [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md) — how to run improvement waves and the novice refactor daily.
  - [ULTRA-prompts.md](ULTRA-prompts.md) — the 100 novice refactor prompts (v13–v22) and all other ULTRA waves.
  - [REFACTOR-IMPROVEMENTS.md](REFACTOR-IMPROVEMENTS.md) — summary of past refactor and PDF improvements.
  - [AGENT-RULES-SYSTEM.md](AGENT-RULES-SYSTEM.md) — stability rules and release gate.

---

*This manual is part of the 340B Advocacy Dashboard project. For a daily refactoring and learning workflow, pick one prompt from ULTRA v13–v22 each day and follow the steps in section 4.*
