# Simulator modules (PA Impact + Policy Impact)

These scripts power the **Pennsylvania Impact Mode** and **Policy Impact Simulator** panels on the full dashboard ([340b.html](../340b.html)). They load **after** [340b.js](../340b.js) and do not change the core map or print/PDF flow.

---

## Pennsylvania Impact Mode (`pa-impact-*`)

| File | Role |
|------|------|
| [pa-impact-data.js](pa-impact-data.js) | PA baseline anchors (`PA_ANCHORS`) and per-scenario estimates (`PA_SCENARIO_ESTIMATES`). **Edit here** to change scenario text and numbers. |
| [pa-impact-engine.js](pa-impact-engine.js) | Pure logic: reads scenario data and computes display values. |
| [pa-impact-ui.js](pa-impact-ui.js) | Renders the PA Impact panel into `#pa-impact-mode-root` (deferred). |

---

## Policy Impact Simulator (`impact-*`)

| File | Role |
|------|------|
| [impact-data.js](impact-data.js) | National scenario definitions and estimated values. **Edit here** to change simulator copy and metrics. |
| [impact-simulator.js](impact-simulator.js) | Pure logic for national impact. |
| [impact-ui.js](impact-ui.js) | Renders into `#policy-impact-simulator-root` (deferred). |

Scenario keys must stay aligned between `pa-impact-data.js` and `impact-data.js` (e.g. expand / current / remove).

---

## 340b-BASIC.html

The Basic page **does not** load these modules. PA Impact and the Policy Simulator appear as **static HTML** in [340b-BASIC.html](../340b-BASIC.html). To change that copy, edit the Basic file or see [docs/BASIC-UPDATE-GUIDE.md](../docs/BASIC-UPDATE-GUIDE.md).

---

## See also

- [NOVICE-CODE-TOUR.md](../NOVICE-CODE-TOUR.md) — plain-language tour of the whole codebase
- [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md) — what to edit, release order
- [GLOSSARY.md](../GLOSSARY.md) — terms (PA Impact, Simulator, CONFIG)
