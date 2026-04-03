# Documentation — Start Here

This is the **navigation hub** for the 340B Advocacy Dashboard. For day-to-day edits, see the root [README.md](../README.md) and [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md).

---

## START HERE

| If you are… | Read this |
|-------------|-----------|
| **CEO, comms, or leadership briefing** | [CEO-SHOWCASE.md](CEO-SHOWCASE.md) — BASIC-first, talking points, IT deploy |
| **CEO-ready copy polish (ChatGPT / Cursor)** | [CHATGPT-CEO-READINESS-BRIEF.md](CHATGPT-CEO-READINESS-BRIEF.md) — mission, copy system, timeline priority, performance bar, execution prompt |
| **Design pass each release** | [DESIGN-ITERATION-CHECKLIST.md](DESIGN-ITERATION-CHECKLIST.md) |
| **Debugging full dashboard JS (advanced)** | [340b-js-map.md](340b-js-map.md) |
| **Brand new to the project** | [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md) — code map, what file to edit, “I want to…” tree |
| **Changing dates or state law data** | [DATA-UPDATE.md](../DATA-UPDATE.md) |
| **Editing the Basic (IT-safe) page only** | [BASIC-UPDATE-GUIDE.md](BASIC-UPDATE-GUIDE.md) |
| **Looking up a term** | [GLOSSARY.md](../GLOSSARY.md) |
| **Finding where config lives** | [CONFIG-INDEX.md](../CONFIG-INDEX.md) |
| **Refactoring daily / learning labels** | [REFACTORING-CODEBASE-MANUAL.md](../REFACTORING-CODEBASE-MANUAL.md) and [ULTRA-prompts.md](../ULTRA-prompts.md) (waves v13–v22) |
| **Architecture overview** | [docs/README.md](README.md) (this folder’s architecture) |
| **Operations (multi-agent, republishing)** | [OPERATIONS_MANUAL.md](OPERATIONS_MANUAL.md) |
| **Security** | [SECURITY.md](../SECURITY.md), [SECURE-FORCE.md](../SECURE-FORCE.md) |
| **Power BI + warehouse (internal BI)** | [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md) → [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md) → [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) → [../powerbi/README.md](../powerbi/README.md) |

---

## Quick file map (dashboard code)

| File | Role |
|------|------|
| [state-data.js](../state-data.js) | CONFIG, STATE_340B, lookups |
| [340b.html](../340b.html) | Structure and visible content |
| [340b.js](../340b.js) | Map, filters, print/PDF/share |
| [340b.css](../340b.css) | Layout and print styles |
| [print.html](../print.html) + [print-view.css](../print-view.css) | Print view tab |
| [340b-BASIC.html](../340b-BASIC.html) | **Primary for comms** — locked-down hosting (no CDN) |

---

## Folder map

| Folder | Purpose |
|--------|---------|
| [modules/](../modules/) | PA Impact + Policy Simulator scripts |
| [config/](../config/) | Settings and chart defaults (see CONFIG-INDEX) |
| [data/](../data/) | Dataset metadata and provenance |
| [assets/vendor/](../assets/vendor/) | D3, TopoJSON, map data |
| [powerbi/](../powerbi/) | Power BI theme, DAX samples, Gold DDL reference |
