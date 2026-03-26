# UI — 340B Dashboard

**Main dashboard files live at repository root** so the live URL (e.g. `https://jordanz00.github.io/340b-dashboard/340b.html`) does not change.

| Root file    | Role |
|-------------|------|
| `340b.html` | Main page structure, content, and script order |
| `340b.css`  | Design system, layout, components, print styles |
| `340b.js`   | Map, filters, selection, print/PDF, share, tooltips |
| `print.html`| Dedicated print view (receives payload via localStorage) |
| `print-view.css` | Print view layout |

This folder holds **UI component documentation** and, in the future, optional modular fragments (e.g. reusable chart wrappers) that the root scripts can load. Do not move the main files into `ui/` unless you change the hosting path (e.g. GitHub Pages publishing from `ui/`).

## Where to edit

- **Content and structure:** `340b.html`
- **Look and feel:** `340b.css`
- **Behavior (map, filters, buttons):** `340b.js`
- **Data and copy:** `state-data.js` and `data/dataset-metadata.js`
- **Chart/map options:** `config/settings.js`

See [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md) and [docs/OPERATIONS_MANUAL.md](../docs/OPERATIONS_MANUAL.md).
