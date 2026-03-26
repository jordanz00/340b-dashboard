# 340B Advocacy Dashboard — CEO & Communications Brief

**Audience:** Hospital association leadership, communications, and IT.  
**Primary product for external storytelling:** **[340b-BASIC.html](../340b-BASIC.html)** (IT-safe, local scripts only).

---

## What this is

A **static, browser-based advocacy dashboard** for the 340B Drug Pricing Program: state-by-state contract pharmacy protection, Pennsylvania context, community benefit, and policy framing—presented for lawmakers and hospital executives.

- **Communications / default link:** `340b-BASIC.html` — full narrative, interactive U.S. map, no third-party CDN, suitable for locked-down employer hosting. See [SECURE-FORCE.md](../SECURE-FORCE.md).
- **Full interactive dashboard:** `340b.html` — adds Print/PDF, share link, Download PDF (image), and live scenario modules. More powerful; more moving parts. **Advanced / optional** for teams that need those tools.

---

## Why it matters to HAP

340B policy is complex. This dashboard **translates** state-level protection status, PA hospital stakes, and community benefit into a **single, credible, visually clear** experience—aligned with MultiState / ASHP / Essential Hospitals sourcing (as documented on-page).

---

## What you maintain (communications owner)

| Task | Where |
|------|--------|
| Copy and numbers on the **primary** page | [340b-BASIC.html](../340b-BASIC.html) — [BASIC-UPDATE-GUIDE.md](BASIC-UPDATE-GUIDE.md) |
| Dates and **state law** (map colors, filters on full site) | [state-data.js](../state-data.js) — [DATA-UPDATE.md](../DATA-UPDATE.md) |
| Look and spacing | [340b.css](../340b.css) + design checklist [DESIGN-ITERATION-CHECKLIST.md](DESIGN-ITERATION-CHECKLIST.md) |

You do **not** need to touch `340b.js` or print flows to update the **BASIC** story.

---

## What IT should deploy

- **Maximum security / no CDN:** Deploy **`340b-BASIC.html`** plus `340b.css`, `state-data.js`, `340b-basic-map.js`, and `assets/vendor/` (D3, TopoJSON, states). No unpkg.
- **Full features:** Deploy the whole repo and use `340b.html` if Print/PDF and CDN-based PDF image are approved.

---

## Hosted links (replace with your live URLs)

- Basic (comms default): `https://YOUR-HOST/340b-BASIC.html`
- Full dashboard: `https://YOUR-HOST/340b.html`

---

## Talking points (30 seconds)

1. **Problem:** Stakeholders need a clear, defensible view of **where** 340B contract pharmacy protections exist and **why** Pennsylvania hospitals matter.
2. **What we built:** A **professional advocacy dashboard** with an interactive U.S. map, executive-ready copy, and sourced methodology—available in a **locked-down–friendly** version for our website.
3. **Who it helps:** Lawmakers, hospital CEOs, and our own team for briefings and digital communications.
4. **Trust & security:** The **Basic** version uses **local scripts only**—no dependency on external script CDNs—so it fits strict IT policies while staying mobile-friendly.

---

## Talking points (2 minutes)

- **340B** is a federal discount program; **state laws** on contract pharmacy protection vary. The map makes **enacted protection vs. no state law** visible at a glance.
- **Pennsylvania** context (hospital counts, community benefit figures) is woven in for **HAP’s** advocacy story.
- **Two tiers:** **BASIC** = story + map + security for broad deployment. **Full** = print, share, PDF image, and interactive simulators for power users.
- **Maintenance:** Data lives in one main data file (`state-data.js`); Basic page text is edited in one HTML file with section labels—documented for non-developers in **BASIC-UPDATE-GUIDE**.

---

## Related docs

- [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md) — what file to edit
- [docs/INDEX.md](INDEX.md) — all documentation links
- [docs/BASIC-UPDATE-GUIDE.md](BASIC-UPDATE-GUIDE.md) — step-by-step Basic edits
