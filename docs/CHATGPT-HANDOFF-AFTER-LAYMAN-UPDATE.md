# ChatGPT Handoff — Where We Are After the Layman / Simulator Overhaul

**Date:** March 2025  
**Purpose:** Give ChatGPT (or the next AI/maintainer) a clear picture of the dashboard after the latest big update: layman’s terms, Policy Impact Simulator overhaul, declutter, and “asset” positioning for HAP advocates in Harrisburg and D.C.

---

## 1. What This Dashboard Is

- **Product:** HAP 340B Advocacy Dashboard — state-by-state view of who protects the federal 340B discount and what that means for hospitals and patients.
- **Audience:** HAP association members, advocates in Harrisburg (PA) and Washington D.C., hospital leaders, and lawmakers. Many are not policy experts; copy is in **plain language**.
- **Goal:** A **must-use, shareable asset** that shows the issue is real and the dashboard is a full-featured tool for advocacy (share link, print, PDF, map, simulator).
- **Tech:** Static HTML/CSS/JS; GitHub Pages; D3/TopoJSON map; html2canvas + jsPDF for PDF image download.
- **Repo:** https://github.com/jordanz00/340b-dashboard  
- **Live:** https://jordanz00.github.io/340b-dashboard/340b.html  

---

## 2. What Just Changed (This Update)

### Policy Impact Simulator — Full overhaul
- **Headline:** "What happens if we protect the discount—or don’t?"
- **Sub:** "Tap a scenario below. See how each path affects hospitals, pharmacies, and patients—in plain terms."
- **Badge:** "Advocacy tool" so it reads as a utility.
- **Scenarios (plain language):**  
  - "Protect the discount everywhere" (best outcome)  
  - "Keep today’s mix" (current patchwork)  
  - "Weaken or remove protections" (worst outcome)  
- **Result cards:** "Hospital–pharmacy partnerships," "Patient access to affordable meds," "Hospital program stability" with short notes in layman’s terms.
- **Takeaways:** One line per scenario (Best / Today’s reality / Worst).
- **Style:** Stronger card (shadow, gradient, badge); scenario-based colors (primary for expand, accent for rollback); section stands out more.

### Layman’s terms across the page
- **340B:** First use = "340B is a federal discount drug program. It lets safety-net hospitals stretch limited dollars so more patients get affordable medications—at no extra cost to taxpayers."
- **Intro card:** Subtitle added: "A federal discount drug program that helps hospitals serve more patients."
- **HAP position:** "Protect the 340B discount and hospital–pharmacy partnerships"; "HAP backs strong 340B protections so our member hospitals can keep working with community pharmacies…"
- **Key findings:** Title "The numbers that matter"; bullets in plain language (e.g. "21 states protect the discount; 29 don’t yet," "72 Pennsylvania hospitals use 340B to serve patients").
- **Exec takeaway:** "Bottom line: What happens to 340B in the states directly affects whether hospitals can keep getting discount meds to patients—including 72 hospitals in Pennsylvania."
- **Executive strip:** "What we're fighting for" / "Where things stand" / "Why trust this" with short, clear headlines and notes.
- **Map:** "Who protects the 340B discount—and who doesn’t"; "Click a state to see whether it protects the discount—and what that means for hospitals and patients."
- **Map legend:** "Blue = state protects the discount. Gray = no state law protecting it yet."
- **Selection summary:** "Click a state on the map or in the list below to see the details."

### Declutter and hierarchy
- Redundant or jargon-heavy lines removed or shortened.
- One main idea per section; labels simplified.
- Methodology and print source summary shortened.

### Docs added
- **docs/100-CRITICAL-CHOICES.md** — 100 prioritized choices (simulator, layman, declutter, style, usefulness, technical) for the next phase. Many are "Done"; the rest are for future iterations or audit.
- **This handoff** — So ChatGPT knows current state and constraints.

---

## 3. Protected Systems — Do NOT Change

| System | What | Why |
|--------|------|-----|
| **print.html** | Dedicated print view; reads snapshot from localStorage | Layout and flow are set; changes break print/PDF. |
| **downloadPdfAsImage()** | 340b.js: 3-page A4 PDF via html2canvas + jsPDF | Page breaks and capture logic are finalized. |
| **preparePrintSnapshot()** / **openPrintView()** | Print prep and launch | Core print pipeline. |
| **hap340bPrint** | localStorage key for print payload | print.html depends on it. |
| **Map** | SVG, injection, state selection; no overflow:hidden on .map-wrap / .us-map-wrap | Print/PDF and layout depend on it. |

Improvements elsewhere (copy, simulator copy, new sections, CSS that doesn’t touch map/print) are fine.

---

## 4. File Map (Where to Edit)

| Goal | File(s) |
|------|--------|
| Change intro, HAP ask, map hero, exec strip copy | state-data.js CONFIG.copy; keep 340b.html initial content in sync to avoid pop |
| Change simulator scenarios and copy | modules/impact-data.js |
| Change simulator UI (headline, sub, labels) | modules/impact-ui.js |
| Simulator or page style | 340b.css |
| Change key findings, map legend, section titles | 340b.html (and sync any CONFIG-driven text in state-data.js + inline CONFIG in 340b.html) |
| Change state data (who has protection) | state-data.js STATE_340B; then update 21/29 and executive landscape line in 340b.html |
| Run audit | `python3 dashboard-audit.py` |
| See all prioritized next steps | docs/100-CRITICAL-CHOICES.md |
| Avoid text/number pop on load | NOVICE-MAINTAINER.md "Avoid text/number pop on load" |

---

## 5. Tone and Principles

- **Layman first:** Assume the reader has never heard of "contract pharmacy" or "340B integrity." Use "discount," "hospital–pharmacy partnerships," "protects the discount," "affordable meds."
- **One idea per block:** Each section has one main message; avoid repeating the same idea in multiple places.
- **Asset, not brochure:** The dashboard should feel like a **tool** (map, simulator, share, print, PDF) that advocates use in meetings and share with lawmakers.
- **Members and advocates:** Messaging should show HAP members that the issue is real and that the dashboard is a serious asset for them and for HAP in Harrisburg and D.C.

---

## 6. What’s Next (Optional)

- Use **100-CRITICAL-CHOICES.md** for the next design or content pass (e.g. talking points, share UX, glossary, mobile/tablet audit).
- Keep **initial HTML in 340b.html** in sync with state-data.js and with computed counts (21/29) when CONFIG or STATE_340B changes.
- After any change that affects copy or counts, run the audit and do a quick manual check (map, filters, share, print, PDF, simulator).

---

## 7. Quick Reference

- **CONFIG and copy:** state-data.js  
- **Simulator data:** modules/impact-data.js  
- **Simulator UI:** modules/impact-ui.js  
- **Initial HTML (no pop):** 340b.html; inline CONFIG in 340b.html  
- **Protected:** print.html, downloadPdfAsImage(), preparePrintSnapshot(), openPrintView(), map SVG, .map-wrap overflow  
- **Critical choices list:** docs/100-CRITICAL-CHOICES.md  

End of handoff.
