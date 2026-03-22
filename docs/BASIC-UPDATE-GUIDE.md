# Basic Dashboard Update Guide (340b-BASIC.html)

**For:** Anyone who needs to change text or numbers on the Basic 340B dashboard—no coding experience required.

**File you will edit:** `340b-BASIC.html` (in the same folder as this project).

---

## Before you start

1. **Back up the file.** Copy `340b-BASIC.html` to `340b-BASIC-backup.html` before making changes.
2. **Use a plain text editor** (e.g. Notepad, TextEdit in “Plain Text” mode, or VS Code). Do not use Word or Google Docs—they can insert invisible characters and break the page.
3. **Search to find the right spot.** Use your editor’s “Find” (Ctrl+F or Cmd+F) and search for the exact phrase you want to change, or the section name below.
4. **Terms you don’t recognize?** See **[GLOSSARY.md](../GLOSSARY.md)** (CONFIG, STATE_340B, BASIC vs full dashboard, etc.).

---

## Section-by-section: what to change and where

Each section in the HTML is marked with a comment like `<!-- ========== SECTION NAME ========== -->`. You can search for that to jump to the right place.

---

### 1. Page title (browser tab)

**Find:** `<title>340B Drug Pricing Program | HAP Advocacy Dashboard (Basic)</title>`

**Change:** Only the text between `<title>` and `</title>`. Example:  
`<title>340B Drug Pricing Program | HAP Advocacy Dashboard (Basic)</title>`

---

### 2. Header — HAP name and report title

**Find:** `The Hospital and Healthsystem Association of Pennsylvania`  
**Change:** The organization name if it ever changes.

**Find:** `<h1>340B Drug Pricing Program</h1>`  
**Change:** Only the text between `<h1>` and `</h1>` if you need a different main title.

---

### 3. Overview — “What is 340B?”

**Find:** `340B empowers Pennsylvania hospitals`  
**Change:** The sentence that follows to update the overview.

**Find:** `7%` (inside the stat block under Overview)  
**Change:** The number if the market-share stat changes. Leave the `<p class="stat-value">` and `</p>` tags; only change the number between them.

---

### 4. HAP Position

**Find:** `Protect the 340B discount and hospital–pharmacy partnerships.`  
**Change:** The HAP position statement if it changes.

**Find:** `HAP calls on lawmakers to defend 340B`  
**Change:** The supporting sentence.

**Find:** `Ask leaders:`  
**Change:** The “ask” line that follows if needed.

---

### 5. Key findings strip — “The numbers that matter”

**Find:** `key-findings-list`  
You’ll see a list (`<ul>...</ul>`) with four items:

- 21 states protect the discount; 29 don't yet  
- **$7.95B** in community benefits…  
- **72** Pennsylvania hospitals…  
- **7%** of U.S. outpatient drug spending…

**Change:** Only the text inside each `<li>...</li>`. Do not remove the `<li>` or `</li>` tags. Update numbers (e.g. 21, 29, 7.95, 72, 7) when data changes.

---

### 6. Bottom line takeaway

**Find:** `Bottom line:`  
**Change:** The full sentence after it to update the one-line takeaway.

---

### 7. Executive strip — three cards

**Find:** `What we're fighting for`  
**Change:** The line under it (the “value” line) and the “note” line if needed.

**Find:** `Where things stand`  
**Change:** The line that says “21 states have enacted…” to match the current state counts. Update “21” and “29” when state laws change.

**Find:** `Why trust this`  
**Change:** The “value” and “note” lines if your sources or messaging change.

---

### 8. Map section

**Find:** `Who protects the 340B discount—and who doesn't`  
**Change:** The headline if desired.

**Find:** `Click a state to see whether it has enacted contract pharmacy protection.`  
**Change:** The subtext under the map if needed.

**Find:** `Blue = state protects the discount. Gray = no state law protecting it yet.`  
**Change:** Only if you want different legend text.

**Recent legal signals:** Find `Courts`, `2025 hybrid`, and `Vetoes` and edit the `<p>` text under each. Do not remove the `<h4>` or `<p>` tags.

**About this data:** Find `Last updated:` and change the date (e.g. “March 2025”) when you refresh the data.

---

### 9. KPI strip — four big numbers

**Find:** `kpi-strip`  
You’ll see four blocks with:

- 7% — 340B share…  
- $7.95B — 340B community benefits (2024)  
- 200+ — HRSA audits in 2024  
- 72 — PA hospitals in 340B  

**Change:** Only the numbers and the short description text inside each `kpi-value` and `kpi-desc`. Do not remove the `<p class="kpi-label">`, `<p class="kpi-value">`, or `<p class="kpi-desc">` tags.

---

### 10. Why this matters — three cards

**Eligible providers:** Find `Who depends on 340B` and the bullet list (Children’s and cancer hospitals, Rural critical-access…, Federally qualified…). Change only the list text inside the `<li>...</li>` tags.

**Oversight credibility:** Find `Federal oversight remains real` and the two stats (200+ Audited, 6% Audited). Change the numbers and the sentence about HAP parity.

**Pennsylvania operating stakes:** Find `340B remains materially relevant in PA` and the stats (72 hospitals, 49%, 53%, 49%). Change only the numbers and the short labels; leave the structure (e.g. `<p class="stat-value">`) intact.

---

### 11. Community benefit

**Find:** `Reinvesting savings`  
**Change:** The benefit list (23% average savings, Free or reduced-price prescriptions, etc.) by editing the text inside each `benefit-item-text`.

**Find:** `Total community benefits (2024)`  
**Change:** The year if needed.

**Find:** `$7.95B`  
**Change:** The dollar amount when you have a new figure.

**Find:** `9% increase over 2023`  
**Change:** The percentage and year when you update the community benefit stats.

---

### 12. Pennsylvania Impact Mode (current status)

**Find:** `340B impact estimates for PA`  
**Change:** The intro sentence if needed.

**Find:** `Exposed` and the line “72 PA hospitals participate…”  
**Change:** The status word and the sentence under “72 PA hospitals — program status” if the message changes.

**Find:** `180` (Pharmacies affected)  
**Change:** The number and the note under it.

**Find:** `Constrained` (Patient access)  
**Change:** The word and the note under it.

**Find:** `At risk` (Community benefit)  
**Change:** The phrase and the note under it.

**Find:** `PA has no contract pharmacy protection.`  
**Change:** The full narrative sentence in that block if the summary message changes.

---

### 13. Policy Impact Simulator (current snapshot)

**Find:** `What happens if we protect the discount—or don't?`  
**Change:** The headline or subtext if needed.

**Find:** `Programs continue with moderate risk.`  
**Change:** The one-line takeaway.

**Find:** `4.5K`, `Mixed`, `Uneven`  
**Change:** These values and their short notes (Hospital–pharmacy partnerships, Patient access…, Hospital program stability…) when the advocacy message changes.

**Find:** `Patchwork: some hospitals and patients benefit`  
**Change:** The closing narrative line if needed.

---

### 14. Access to care

**Find:** `Contract pharmacy restrictions hit patient access`  
**Change:** The paragraph below it. Keep the sentence structure; only change the wording. Do not remove the `<p>` and `</p>` tags.

---

### 15. Pennsylvania safeguards

**Find:** `PA already prevents duplicate discounts`  
**Change:** The three bullet points. Edit only the text inside each `<li>...</li>`. Do not remove the `<ul>`, `<li>`, or `</li>` tags.

---

## What NOT to change

- **Do not delete** any `<>` brackets (tags) like `<p>`, `</p>`, `<h2>`, `</h2>`, `<div>`, `</div>`, `<section>`, `</section>`, `<article>`, `</article>`, or any `class="..."` or `id="..."` inside tags. Removing or breaking tags can break the layout or hide content.
- **Do not edit** the `<script src="...">` or `<link rel="stylesheet" ...>` lines unless you are told to add or remove a specific file.
- **Do not edit** the long meta tag that says `Content-Security-Policy` unless your IT or security team asks you to.

---

## After you save

1. Save the file as **340b-BASIC.html** (same name, same location).
2. Open the file in your browser (double-click the file or drag it into the browser window) to check that:
   - All sections still appear.
   - Numbers and text show your updates.
   - The map still loads and you can click states.
3. If something looks wrong or missing, restore from `340b-BASIC-backup.html` and try again, changing only the text you need.

---

## Need more help?

- For **state-by-state map data** (which states are blue or gray), the Basic version reads from `state-data.js`. Updating that file requires following the instructions in **[NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md)** and **state-data.js** (CODE MAP at the top).
- For **full interactive features** (print, PDF, scenario switchers), use the full dashboard: **340b.html**.
- For the **full project map** (which file to edit for what), see **[NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md)** and **[docs/INDEX.md](INDEX.md)**.
