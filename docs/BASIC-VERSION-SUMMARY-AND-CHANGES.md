# 340b-BASIC.html — Full change summary and BASIC version summary

This document provides (1) a full detailed summary of all changes made for the Basic dashboard update, and (2) a full detailed summary of the BASIC version itself—how it was cleaned up, what content was added, what interactivity remains, and how design was preserved.

---

## Part 1: Full detailed summary of all changes

### 1.1 340b-BASIC.html

- **Content added below the KPI strip** (all as static HTML with clear section comments):
  - **Why this matters to health system leaders** — Section subhead and three cards:
    - **Eligible providers — Who depends on 340B:** Bullet list (Children's and cancer hospitals; Rural critical-access and safety-net hospitals; Federally qualified health centers).
    - **Oversight credibility — Federal oversight remains real:** 200+ hospitals audited, 6% manufacturers audited, plus HAP parity sentence.
    - **Pennsylvania operating stakes — 340B remains materially relevant in PA:** 72 hospitals (30%), Rural 49%, Operating at a loss 53%, Labor & delivery 49%.
  - **Community benefit — Reinvesting savings:** Benefit grid (23% savings, free/reduced prescriptions, mobile mammography & cancer screening, dental & preventive services); hero block with **Total community benefits (2024) $7.95B** and “9% increase over 2023 — reinvested in community health.”
  - **Pennsylvania Impact Mode:** Static snapshot of **Current status** only: 72 PA hospitals — Exposed; Pharmacies affected 180; Patient access Constrained; Community benefit At risk; narrative “PA has no contract pharmacy protection…” Uses existing CSS classes (`pa-impact-header`, `pa-impact-grid`, `pa-impact-card`, `pa-impact-narrative`). No scenario buttons or pa-impact-ui.js.
  - **Policy Impact Simulator:** Static snapshot of **Keep today's mix** only: takeaway “Programs continue with moderate risk”; three result cards (Hospital–pharmacy partnerships 4.5K, Patient access Mixed, Hospital program stability Uneven); narrative “Patchwork: some hospitals and patients benefit; many stay exposed.” Uses existing `impact-simulator-*` and `impact-results-grid` / `impact-result-card` classes. No scenario buttons or impact-ui.js.
  - **Access to care — Contract pharmacy restrictions hit patient access:** Single paragraph (federal rules, one contract pharmacy limit, impact on rural/underserved).
  - **Pennsylvania safeguards — PA already prevents duplicate discounts:** Three bullet points (manufacturers not required to give both 340B and Medicaid rebate; DHS 340B Drug Exclusion List; contract pharmacies and Medicare Advantage rebates).

- **Structure and maintainability:**
  - Every major section is labeled with an HTML comment, e.g. `<!-- ========== WHY THIS MATTERS ========== -->`, so a novice can Find the section to edit.
  - No new JavaScript was added for PA Impact or Simulator; both are plain HTML.
  - PA Impact block uses the same card grid and narrative layout as the full dashboard so 340b.css styles apply without new rules.
  - Simulator block uses `data-scenario="current"` and existing impact-result-* classes for consistent look.

- **Scripts and security:**
  - Only these scripts load: `state-data.js`, `assets/vendor/d3.min.js`, `assets/vendor/topojson-client.min.js`, `assets/vendor/states-10m.js`, `340b-basic-map.js`. No print, PDF, share, or module scripts.
  - CSP kept as `script-src 'self'`; no CDN; no localStorage for print.

- **No changes** were made to 340b.html, 340b.js, print.html, or the full dashboard; all edits are confined to the Basic version.

### 1.2 docs/BASIC-UPDATE-GUIDE.md (new file)

- Step-by-step guide for **non-coders** and people new to HTML.
- Explains: back up the file, use a plain text editor, use Find to locate sections.
- **Section-by-section instructions** aligned with the HTML comments in 340b-BASIC.html: what to change (e.g. title, key findings, KPI numbers, community benefit amount, PA Impact narrative, Simulator takeaway, access to care, PA safeguards) and what **not** to change (tags, `class`/`id`, script/link lines, CSP).
- Includes “After you save” (reopen in browser, verify map and content) and a pointer to state-data.js and NOVICE-MAINTAINER.md for map data and full dashboard.

### 1.3 NOVICE-MAINTAINER.md

- New subsection **“340b-BASIC.html (Basic version)”** with:
  - **Purpose:** Single-page, employer/locked-down hosting; same content as full dashboard minus print/PDF/share and scenario toggles; local scripts only.
  - **What’s in it:** List of all sections (header through footer), including Why this matters, community benefit, PA Impact static snapshot, Simulator static snapshot, access, PA safeguards.
  - **How to edit:** Open 340b-BASIC.html; use comments to find sections; change only text/numbers inside tags; link to **docs/BASIC-UPDATE-GUIDE.md** for step-by-step instructions.
  - **Map data:** Same state-data.js; STATE_340B drives map; PA Impact and Simulator copy on Basic are static HTML, not from pa-impact-data.js or impact-data.js.
- **“What file to edit”** table: New row for “Basic page only (text/numbers on 340b-BASIC.html)” → edit 340b-BASIC.html, see BASIC-UPDATE-GUIDE.md. Simulator/PA impact rows clarified as “full dashboard.”

### 1.4 SECURE-FORCE.md

- New section **“340b-BASIC.html — Most secure deployable version”** before the Summary table.
- Describes BASIC as the recommended version when employer locks down scripting, CDNs, or backend.
- Table covering: Scripts (local only, no CDN), CSP (script-src 'self', no connect-src), Backend (none), Storage (no localStorage for print), Print/PDF (none), User input (map click only, state allowlist), Mobile (responsive, same 340b.css), Content (full advocacy content as static HTML), Maintainability (single HTML + map script; links to BASIC-UPDATE-GUIDE and NOVICE-MAINTAINER).
- Deploy recommendation: use 340b-BASIC when CSP/IT forbids third-party or inline script, no backend/APIs, or when a novice must update content without touching print/PDF/share. Same OWASP/SAST review applies.

---

## Part 2: Full detailed summary of the BASIC version (cleanup, content, interactivity, design)

### 2.1 What the BASIC version is

- **Single-file dashboard** (one HTML file plus shared 340b.css and a small set of local scripts) that presents the same advocacy narrative as the full 340b dashboard for hospital and association CEOs, in a form that can be deployed on locked-down employer sites and maintained by non-coders.

### 2.2 How it was cleaned up

- **Minimal scripting:** Only five script sources, all from the same origin: state-data.js (data), D3, TopoJSON, states-10m (map geometry), 340b-basic-map.js (map drawing and state click). No print, PDF, share, hash routing, or module loaders.
- **No PA Impact or Simulator JavaScript:** The full dashboard’s scenario switchers (pa-impact-ui.js, impact-ui.js) and their data modules are not loaded. PA Impact and Policy Simulator appear as **static snapshots** (Current status and Keep today’s mix) so the message is present without extra script or backend.
- **Clear section labels:** Every major block in 340b-BASIC.html has an HTML comment (e.g. `<!-- ========== KPI STRIP ========== -->`, `<!-- ========== WHY THIS MATTERS ========== -->`). This makes it easy to Find and edit the right place and aligns with BASIC-UPDATE-GUIDE.md.
- **Reuse of existing CSS:** No new stylesheet. All new sections use existing classes from 340b.css (supporting-section, card, card--compact, stat-block, pa-impact-*, impact-simulator-*, impact-result-*, benefit-grid, community-benefit-hero, etc.) so the look matches the full dashboard and stays consistent.

### 2.3 Content added

- **Below the KPIs,** in order:
  1. **Why this matters to health system leaders** — Three cards: Eligible providers (who depends on 340B), Oversight credibility (federal oversight, 200+ / 6%, HAP parity), Pennsylvania operating stakes (72 hospitals, 30%, rural/loss/labor stats).
  2. **Community benefit** — Reinvesting savings: benefit grid (23%, free/reduced Rx, mammography, dental) and big stat $7.95B (2024), 9% increase.
  3. **Pennsylvania Impact Mode** — Single static view: “Current status” with Exposed, 180 pharmacies, Constrained access, At risk community benefit, and the PA narrative.
  4. **Policy Impact Simulator** — Single static view: “Keep today’s mix” with 4.5K partnerships, Mixed access, Uneven stability, and the “Patchwork” narrative.
  5. **Access to care** — Contract pharmacy restrictions and one-pharmacy limits.
  6. **Pennsylvania safeguards** — PA prevents duplicate discounts (three bullets).

- **Above the KPIs:** Unchanged from previous Basic version (intro, key findings, exec strip, map, recent legal signals, methodology, KPI strip). No content was removed; only additions and structural clarity.

### 2.4 Interactivity preserved

- **Interactive US map** is the only interactive feature: click a state to see detail; tooltip and state-detail area update from 340b-basic-map.js using state-data.js. No share link, no URL hash, no print/PDF.
- **Everything else** is static HTML: no buttons to switch scenarios, no filters, no count-up animations. This keeps the page simple and safe for locked-down environments while still conveying the full advocacy story.

### 2.5 Design preserved

- **Same 340b.css:** Typography, colors, spacing, breakpoints, and card/stat/section styles are shared with the full dashboard. BASIC uses the same header, nav, intro cards, exec strip, map hero, KPI strip, and footer styling.
- **Same section hierarchy:** Supporting cards, community benefit block, PA Impact card, Simulator card, and access/safeguards cards use the same class names and layout patterns as the full site so the “professional for hospital CEOs and association” look is unchanged.
- **Mobile responsive:** The Basic page uses the same responsive rules in 340b.css as the full dashboard, so it remains mobile-friendly and usable on small screens.

### 2.6 Ease of updatability

- **Novice coders:** Can follow BASIC-UPDATE-GUIDE.md to update text and numbers by section without touching tags or script.
- **Non-coders:** The guide explains what to search for, what to change, and what to avoid; backup and reopen-in-browser steps are included.
- **Map data:** Still driven by state-data.js (STATE_340B); changing state law status is documented in NOVICE-MAINTAINER.md and state-data.js CODE MAP. PA Impact and Simulator copy on the Basic page are edited directly in 340b-BASIC.html, not in module files.

---

## SECURE-FORCE.md updates (reference)

The following block was **added** to SECURE-FORCE.md (before the Summary table). You can confirm it in the file.

```markdown
## 340b-BASIC.html — Most secure deployable version

When your employer locks down scripting, blocks CDNs, or disallows backend/APIs, **340b-BASIC.html** is the recommended dashboard to deploy. It is the most secure, compatible, and maintainable option for restricted hosting.

| Aspect | 340b-BASIC.html |
|--------|------------------|
| **Scripts** | Local only: `state-data.js`, `assets/vendor/d3.min.js`, `topojson-client.min.js`, `states-10m.js`, `340b-basic-map.js`. No unpkg, no third-party CDN. |
| **CSP** | `script-src 'self'`; no `unsafe-inline` for scripts; no `connect-src` (no network calls from script). |
| **Backend** | None. No APIs, no database, no auth, no webhooks. |
| **Storage** | No localStorage for print payload; no sessionStorage. Map and state detail are in-memory only. |
| **Print/PDF** | No print view or PDF generation. Reduces attack surface (no html2canvas/jsPDF, no new window, no cross-origin or file:// issues). |
| **User input** | Only map click (state selection). State code is validated against allowlist from state-data.js before use. No forms, no free-text input. |
| **Mobile** | Same responsive 340b.css as full dashboard; mobile-friendly and tested for small viewports. |
| **Content** | Full advocacy content (KPIs, Why this matters, community benefit, PA Impact snapshot, Simulator snapshot, access, PA safeguards) as static HTML. No dynamic content from user input. |
| **Maintainability** | Single HTML file + one small map script. Edits are in 340b-BASIC.html and optionally state-data.js; see [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md) and [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md). |

**Deploy recommendation:** Prefer 340b-BASIC.html when (a) CSP or IT policy forbids third-party scripts or inline script, (b) you cannot run a backend or use external APIs, or (c) you need a single, auditable set of files that a novice can update without touching print/PDF or share logic. Run the OWASP-oriented checklist below on the Basic version before deploy; the same SAST and manual review apply.
```

This positions 340b-BASIC.html as the most secure, employer-website-ready, mobile-responsive version when scripting and backend are locked down.
