# HAP 340B Advocacy Dashboard — Full Handoff for ChatGPT

**Purpose:** Give ChatGPT complete context to help polish this dashboard for the CEO of The Hospital and Healthsystem Association of Pennsylvania (HAP). Use this document when pasting context into ChatGPT. Cursor handles code edits; ChatGPT can draft copy, strategy, and UX recommendations for Cursor to implement.

---

## 1. Project Context

- **Organization:** The Hospital and Healthsystem Association of Pennsylvania (HAP)
- **Dashboard:** 340B Drug Pricing Program Advocacy Dashboard
- **Audience:** Hospital CEOs, HAP leadership, lawmakers, policy advocacy teams
- **Repository:** https://github.com/jordanz00/340b-dashboard
- **Platform:** Static HTML/CSS/JS, GitHub Pages
- **Live URL:** https://jordanz00.github.io/340b-dashboard/340b.html

The dashboard explains 340B contract pharmacy protections across states. It must feel **next-level professional** — the kind of tool a hospital CEO would trust and use in advocacy meetings. It should be polished, clear, and impressive.

---

## 2. Current State (As of Latest Cursor Session)

### What Works

- **Interactive US map** — Click states; see protection status (blue = protected, gray = no protection)
- **State filters** — All / Protection / No protection
- **Share links** — Copy URL with state hash
- **Print / PDF** — Opens print.html with full snapshot
- **Download PDF (image)** — 3-page A4 export (html2canvas + jsPDF)
- **Policy Impact Simulator** — Three scenarios (Expand / Current / Remove protections); national impact metrics; gradient design
- **Pennsylvania Impact Mode** — PA-specific metrics; program status (Protected / Exposed / At risk), pharmacies, patient access, community benefit

### What Was Removed

- **Executive Mode** — Toggle button was removed. It did not work reliably and was confusing. Do not suggest reinstating it.

### Key Metrics on Dashboard

- 72 PA hospitals in 340B
- $7.95B national community benefits from 340B hospitals (2024)
- 7% of U.S. outpatient drug market
- 25 states with contract pharmacy protection (count from STATE_340B)

---

## 3. What “Next-Level” Means for HAP CEO

The user’s bar: **“If I was my CEO, I would be like that’s nice and move on. You need to WOW me.”**

Target outcome: When the CEO opens this dashboard, they should feel it is:

- **Authoritative** — Trustworthy data, clear sourcing
- **Executive-ready** — Clean hierarchy, readable at a glance
- **Actionable** — Obvious what to do (e.g., share, print, advocate)
- **Polished** — Typography, spacing, and layout feel intentional
- **Memorable** — Strong headlines and policy narrative, not generic

---

## 4. Protected Systems — Do Not Break

**Cursor implements code. ChatGPT must NOT suggest changes that touch these.**

| System | Location | Rule |
|--------|----------|------|
| Print pipeline | 340b.js: `preparePrintSnapshot()`, `openPrintView()`; `print.html`; `hap340bPrint` localStorage | Do not modify |
| PDF image export | 340b.js: `downloadPdfAsImage()` | Do not modify without explicit user permission |
| Map | SVG structure, map injection, state selection in 340b.js | Do not modify |
| CSS | `.map-wrap`, `.us-map-wrap` | Never add `overflow:hidden` |

Any suggestion that affects these must be flagged as “requires user permission” or rephrased to avoid them.

---

## 5. What ChatGPT Can Do (No Code Changes)

### 5.1 Copy and Messaging

- **Headlines and subheads** — Stronger, more executive-friendly
- **Policy narrative** — Clearer story for lawmakers (1–2 sentences per section)
- **KPI labels** — Clear, consistent wording
- **Simulator descriptions** — Scenario copy that explains impact in plain language
- **Source/trust copy** — “Why trust this view” and methodology wording

**Where copy lives:** `state-data.js` (CONFIG.copy), `340b.html` (inline text), `modules/impact-data.js`, `modules/pa-impact-data.js`

### 5.2 Structure and Flow

- **Section order** — Suggest better sequence for CEO flow (e.g., “Key Findings” before or after map)
- **Narrative arc** — What should the CEO see first, second, third?
- **Call-to-action** — What should the CEO do after viewing? (share, print, schedule meeting?)

### 5.3 UX and Presentation Ideas

- **Visual hierarchy** — What should stand out most? (map, KPIs, PA section?)
- **Readability** — Font sizes, line lengths, contrast
- **Mobile vs desktop** — Priority for CEO (likely desktop/laptop for meetings)

ChatGPT can propose ideas; Cursor will implement in 340b.html and 340b.css.

### 5.4 Policy Accuracy

- **340B terminology** — Ensure wording matches HAP’s advocacy stance
- **State law nuances** — Clarify “contract pharmacy protection,” “PBM,” etc.
- **Data recency** — Note when state law data was last updated (e.g., March 2025)

---

## 6. What Cursor Handles (Code Implementation)

- Edits to 340b.html, 340b.css, 340b.js, state-data.js
- Changes to modules/ (impact-data.js, impact-ui.js, pa-impact-data.js, pa-impact-engine.js, pa-impact-ui.js)
- Layout, spacing, typography in CSS
- Any DOM or script changes

---

## 7. Collaboration Workflow

1. **User** pastes this handoff (or a summary) into ChatGPT.
2. **ChatGPT** suggests:
   - New copy (exact text)
   - Structural changes (e.g., “move X above Y”)
   - UX improvements (described, not coded)
3. **User** brings those suggestions to Cursor.
4. **Cursor** implements them, respecting protected systems.

Example prompt for Cursor: *“ChatGPT suggested this headline for the Policy Impact Simulator: [exact text]. Update modules/impact-ui.js and any related copy to use it.”*

---

## 8. Specific Areas to Polish (ChatGPT Focus)

### 8.1 Opening (First Screen)

- **Overview / What is 340B** — Is the lead paragraph compelling for a CEO? One sentence that hooks.
- **HAP Position** — Is the “HAP asks lawmakers” line clear and actionable?

### 8.2 Key Findings Strip

- Current: bullet list with counts and facts
- Goal: CEO can skim and get the story in 5 seconds

### 8.3 Executive Proof Strip (Three Cards)

- Policy priority
- National landscape
- Why trust this view

Are the labels and one-liners strong enough for an executive?

### 8.4 Map Section

- **Map hero headline** — “340B contract pharmacy protection across the U.S.”
- **Subtext** — “Select a state for details. 72 Pennsylvania hospitals participate in 340B.”
- Is this the right framing for a CEO?

### 8.5 Policy Impact Simulator

- **Headline:** “Model the impact of policy choices”
- **Sub:** “Compare three scenarios: expand protections nationwide, maintain current status, or roll back…”
- Do the scenario labels and result copy tell a clear story?

### 8.6 Pennsylvania Impact Mode

- **Headline:** “340B impact estimates for PA”
- First metric: “72 PA hospitals — program status” (Protected / Exposed / At risk)
- Are the narratives concise and executive-friendly?

### 8.7 Community Benefit Section

- $7.95B hero stat
- Four benefit items (savings, prescriptions, mammography, dental)
- Is the messaging aligned with HAP’s advocacy?

### 8.8 Access and PA Safeguards

- Two cards side by side
- Do they support the main narrative without overwhelming?

---

## 9. File Reference for ChatGPT

| Purpose | File | What to Suggest |
|---------|------|-----------------|
| Intro/overview copy | state-data.js CONFIG.copy | Exact replacement text |
| Section headlines | 340b.html | Exact replacement text |
| HAP ask, methodology | state-data.js, 340b.html | Exact replacement text |
| Policy Impact Simulator copy | modules/impact-data.js | Scenario labels, narratives, notes |
| PA Impact Mode copy | modules/pa-impact-data.js | Scenario labels, narratives, notes |

---

## 10. Output Format for ChatGPT

When ChatGPT suggests changes, it should:

1. **Specify the file** (e.g., `state-data.js`, `modules/impact-data.js`)
2. **Specify the element** (e.g., `overviewLead`, `executiveStrip.priorityValue`)
3. **Provide exact replacement text** (not “something like…”)
4. **Flag** if the suggestion would require touching protected systems (and avoid those)
5. **Include 1–2 sentences** on why the change helps the CEO

Example:
> **File:** state-data.js, CONFIG.copy.overviewLead  
> **Current:** "The 340B Drug Pricing Program allows eligible hospitals..."  
> **Proposed:** "340B lets safety-net hospitals buy drugs at discounted prices to serve low-income patients—at no cost to taxpayers."  
> **Why:** Shorter, clearer, leads with benefit. CEO grasps value in one sentence.

---

## 11. What Cursor Needs From ChatGPT

1. **Copy edits** — Exact strings for headlines, paragraphs, labels
2. **Structural suggestions** — “Put Key Findings above the map” (user confirms, Cursor implements)
3. **UX principles** — “Prioritize KPIs visually so they pop” (Cursor applies in CSS)
4. **No code** — ChatGPT does not write HTML/CSS/JS; Cursor does

---

## 12. Summary for Quick Paste to ChatGPT

**Short version to paste:**

> I'm polishing the HAP 340B Advocacy Dashboard for the CEO of The Hospital and Healthsystem Association of Pennsylvania. It's a static dashboard (GitHub Pages) showing 340B contract pharmacy protection by state, with an interactive map, Policy Impact Simulator, and Pennsylvania Impact Mode.  
>  
> My bar: it must WOW a hospital CEO, not just be "nice."  
>  
> **Do not touch:** Print pipeline, PDF image export, map logic. Executive Mode was removed.  
>  
> **I need from you:** (1) Stronger copy for headlines, KPI labels, policy narratives. (2) Suggestions for section order and visual hierarchy. (3) Exact replacement text I can give to Cursor to implement.  
>  
> Full context is in docs/CHATGPT-HANDOFF-FULL.md. Start by reviewing the opening (What is 340B, HAP Position), Key Findings, and Policy Impact Simulator, and suggest specific copy improvements with exact text and file locations.
