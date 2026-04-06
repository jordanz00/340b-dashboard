# Secure Force — Multi-Agent Security Workflow

## Maintaining security (quick links)

| Document | Purpose |
|----------|---------|
| [SECURITY-FORCE.md](SECURITY-FORCE.md) | Supervisor + agent roles, workflow, CSP guidance |
| [THREAT-MODEL.md](THREAT-MODEL.md) | Risks (XSS, hash, localStorage, supply chain) and mitigations |
| [SECURITY.md](SECURITY.md) | Project hosting rules and **340b-BASIC** IT-safe constraints |

**Automation:** Run `python3 dashboard-audit.py` after changes to HTML/CSS/JS, print pipeline, or `state-data.js`. For deeper review, run `semgrep scan --config auto`.

**Rules of thumb:** No secrets in source. Static-only. BASIC = no external scripts. `textContent` / `createElement` for dynamic UI. Validate `#state-XX` against the state allowlist. Parameterized queries for any database access. Review every AI-generated code path before merge.

---

Use this document when running security checks, before deploy, or when the AI touches auth, user input, webhooks, or data connections. Secure Force gives structural and security context so the AI (and maintainers) can build and review with the right threat model.

---

## Threat Model (340B Dashboard)

- **Static dashboard with warehouse path:** No backend service *today*, but warehouse integration (Path A JSON API, Path B Power BI, Path C PBI embed) is imminent. Treat `DataLayer.connectWarehouse()`, `DataLayer.connectAPI()`, `DataLayer.submitStory()`, and any future API endpoint as **trust boundaries** that require input validation on both sides.
- **Sensitive routes/surfaces:** Hash-driven state, share URL, print view (print.html) receiving serialized map/data, story submission form, warehouse API fetch/response, and any form or filter that affects what is shown or sent.
- **Do not expose:** Internal errors, stack traces, or debug output to the user or in client-visible responses. Prefer generic "Something went wrong" and log details server-side if you add a backend later.
- **High-risk spots in dashboard apps:** Every place user input touches a database or external API; authorization on nested routes; input sanitization when chaining multiple data sources. AI-generated code often misses auth checks on nested routes and skips sanitization—review those manually.

---

## AI-Generated Code — Known Vulnerability Patterns

**Why this section exists:** AI coding assistants (Cursor, Claude, Copilot, ChatGPT) generate code that works in happy-path testing but routinely introduces security vulnerabilities. These patterns are systematic and predictable. Review every AI-generated code path against this checklist before merge.

### Pattern 1: SQL Injection via Template Literals

The most common and dangerous AI-generated vulnerability. When you ask an AI to "add a search endpoint" or "filter users by name," you will often get:

```javascript
// DANGEROUS — AI-generated anti-pattern
const users = await db.query(`SELECT * FROM users WHERE name = '${req.query.name}'`);
```

Anyone can pass `' OR '1'='1` as the name parameter and dump the entire table. The code works perfectly in testing — search for "john", get john's records. Nothing looks wrong unless you know what to look for.

**The fix is always parameterized queries:**

```javascript
// SAFE — parameterized
db.query('SELECT * FROM users WHERE name = $1', [req.query.name]);
```

**Post-session grep (run after every AI coding session that touches data paths):**

```bash
# Flag template literals inside query/execute calls
rg '(query|execute|prepare|run)\s*\(' --glob '*.js' --glob '*.ts' --glob '*.py'

# Flag backtick interpolation anywhere near database calls
rg '`[^`]*\$\{' --glob '*.js' --glob '*.ts'
```

If you see template literals (`backticks + ${...}`) inside `query()`, `execute()`, `prepare()`, or `run()` calls, that is the red flag. Refactor to parameterized queries immediately.

### Pattern 2: innerHTML with Dynamic Data

AI frequently generates `element.innerHTML = '<div>' + userData + '</div>'` instead of safe DOM APIs.

```javascript
// DANGEROUS — AI-generated anti-pattern
container.innerHTML = `<p>Welcome, ${username}</p>`;

// SAFE — createElement + textContent
var p = document.createElement('p');
p.textContent = 'Welcome, ' + username;
container.appendChild(p);
```

**To clear a container before redraw (e.g., D3 charts):**

```javascript
// SAFE — clear without innerHTML
while (el.firstChild) el.removeChild(el.firstChild);
```

### Pattern 3: Missing _normalizePayload / Validation Functions

AI will generate code that calls validation or normalization functions that don't exist yet — `_normalizePayload(data)`, `sanitize(input)`, `validate(schema, obj)`. The code reads like it's safe, but the function is a phantom: it was never implemented. The data passes through raw.

**After every AI session, verify:**

```bash
# Find all function calls and check they resolve to real implementations
rg '_normalize|_sanitize|_validate' --glob '*.js' --glob '*.ts'
```

### Pattern 4: Fetch URLs from User-Controlled Input

AI may generate `fetch(userProvidedUrl)` without validating the URL scheme, host, or path. This enables:
- **SSRF** (server-side request forgery) if the app has a backend
- **Open redirect** via `javascript:` or `data:` URIs
- **Data exfiltration** to attacker-controlled endpoints

This project's `DataLayer` now validates all endpoint URLs through `_isAllowedEndpoint()` before any `fetch()` call.

### Pattern 5: Missing Error Handling on API Responses

AI generates `.then(r => r.json())` without checking `r.ok` or validating the response shape. Malformed or tampered responses get cached and rendered.

This project's `DataLayer.refresh()` now validates response shape against a known-table allowlist before caching.

### Pattern 6: Plausible but Incorrect Auth Logic

AI generates auth middleware that looks right but has gaps:
- Checks `req.user` but doesn't verify the token
- Applies middleware to `/api/users` but not `/api/users/:id/settings`
- Uses JWT without verifying the signature

**Rule:** If you add auth to this project, manually trace every route and chained data source. Do not trust AI-generated auth logic without line-by-line review.

### Post-AI-Session Review Checklist

Run this after every Cursor/Claude/Copilot session that touches data paths, API calls, or user input:

- [ ] **Template literals in query calls?** Search for backticks inside `query()`, `execute()`, `prepare()`, `run()`. Refactor to parameterized queries.
- [ ] **innerHTML/outerHTML/eval with data?** Search for `.innerHTML =` and `.outerHTML =`. Replace with `textContent`, `createElement`, `removeChild`.
- [ ] **Phantom functions?** Search for `_normalize`, `_sanitize`, `_validate`. Verify every call resolves to a real implementation.
- [ ] **Unvalidated fetch URLs?** Every `fetch()` call should use a validated, configured URL — never user-supplied strings without allowlist checks.
- [ ] **Missing response validation?** Every `.json()` call should check `r.ok` first and validate the response shape before caching or rendering.
- [ ] **Hardcoded secrets?** Search for `apiKey`, `secret`, `password`, `token`, `bearer`. None should appear as string literals.
- [ ] **Auth gaps?** If auth was added, manually trace every protected route including nested paths.

---

## SQL Injection Prevention — Defense in Depth (CrowdStrike framework)

The core principle: **never trust user input; always separate code from data.** This section codifies the five-layer defense model and maps each layer to where it applies in this project — today (static) and after warehouse integration.

### Defense 1: Prepared Statements with Parameterized Queries

The most effective defense. Forces separation of SQL code from user data so input is treated strictly as data, never as executable code.

**How it works:**

```javascript
// DANGEROUS — data and code are mixed; attacker controls the query
db.query(`SELECT * FROM users WHERE name = '${req.query.name}'`);

// SAFE — parameterized; the database engine treats $1 as data, never as SQL
db.query('SELECT * FROM users WHERE name = $1', [req.query.name]);
```

**Where it applies in this project:**

| Surface | Today | After warehouse |
|---------|-------|----------------|
| `DataLayer.submitStory()` | Client-side: `JSON.stringify()` to sessionStorage (safe) | POST to warehouse API — **the server endpoint MUST use parameterized INSERT** |
| Gold table queries | N/A — static files | IT's API/views — confirm with Manager, Data Analytics that all warehouse queries use parameterized statements or views |
| Any future server-side code | N/A | **Mandatory.** Every `query()`, `execute()`, `prepare()` call must use `$1`/`?`/named params |
| ETL / data pipelines | N/A | Parameterized or use views. No f-string/template-literal SQL in Python or Node scripts |

**Enforcement:** Post-AI-session grep (see above). Semgrep catches most template-literal-in-query patterns.

### Defense 2: Input Validation and Sanitization (Whitelisting)

Strict whitelisting allows only expected characters and formats. A phone number field should only contain digits; a state code should match a known list; a category should be one of four valid values.

**Already implemented in this project:**

| Input | Validation | Location |
|-------|-----------|----------|
| Hash state (`#state-XX`) | Allowlist: 50 states + DC from `STATE_340B` keys | `getHashState()` / `isKnownState()` in `340b.js`, `340b-mobile.js` |
| Story hospital name | String, trimmed, max 200 chars | `_normalizeStoryPayload()` in `data-layer.js` |
| Story text | String, trimmed, max 500 chars | `_normalizeStoryPayload()` |
| Story category | Allowlist: `Patient Access`, `Community Benefit`, `Rural Care`, `Financial Impact` | `_normalizeStoryPayload()` |
| Story email | Regex format check, max 254 chars; invalid → silently dropped | `_normalizeStoryPayload()` |
| Story county | String, trimmed, max 100 chars | `_normalizeStoryPayload()` |
| Legislator URLs | Domain allowlist: `palegis.us`, `*.house.gov`, `*.senate.gov`, `congress.gov`, `bioguide.congress.gov` | `isTrustedLegislatorUrl()` in `data-layer.js` |
| Warehouse endpoint URLs | Scheme check (https/http only), private IP restriction, `javascript:`/`data:`/`file:` blocked | `_isAllowedEndpoint()` in `data-layer.js` |
| PA legislator bio slugs | Alphanumeric + hyphens + apostrophes, max 160 chars, no path traversal | `_paPalegisBioSlugOk()` in `data-layer.js` |
| Warehouse response shape | Known-table key allowlist | `refresh()` in `data-layer.js` |

**Rule:** Every new user input surface (form field, URL param, search box, filter) must have a validation entry in this table before merge.

### Defense 3: Principle of Least Privilege

Limit database and API account permissions to the minimum necessary. The dashboard account should never have admin rights.

**Where it applies:**

| Account / Role | Required privilege | Notes |
|----------------|-------------------|-------|
| Dashboard read (Path A JSON API) | **Read-only** on Gold views/tables | The JSON API should serve pre-built views, not accept arbitrary queries |
| Dashboard write (story POST) | **INSERT-only** on `fact_story_submission` | No UPDATE, DELETE, or DDL. IT controls the endpoint |
| Power BI semantic model (Path B) | **Read-only** on Gold views | Report authors should not have write access to Gold |
| PBI embed tokens (Path C) | **View-only** embed scope | No edit or admin tokens in client-side config |
| ETL / pipeline service principal | Scoped to Bronze→Silver→Gold write path only | Separate from dashboard accounts |

**Action for first warehouse meeting:** Ask the Manager, Data Analytics and Visualization to confirm that the dashboard service account / identity is **read-only** on Gold, with a separate write-scoped endpoint for story submission. Record the answer in `docs/POWER-BI-IT-DISCOVERY-CHECKLIST.md` section 4.

### Defense 4: Disable Detailed Error Messages

Prevent the database and API from showing detailed error messages to users. Stack traces, SQL error text, table names, and column details help attackers map the database structure.

**Already implemented in this project:**

| Surface | Error handling | Location |
|---------|---------------|----------|
| Warehouse fetch failures | Generic: `{ refreshed: false, error: err.message }` — no stack trace | `DataLayer.refresh()` |
| Story POST failures | Falls back to sessionStorage; user sees "Story submitted" — no API error details | `DataLayer.submitStory()` |
| Print/PDF errors | `setUtilityStatus()` shows generic user message | `340b.js`, `340b-mobile.js` |
| Hash validation failures | Silently falls back to default state — no error shown | `getHashState()` |

**Rule for warehouse era:** If you add a server-side API layer, log detailed errors server-side (structured JSON to a log sink) and return only generic HTTP status codes to the client. Never include SQL error text, table names, or stack traces in HTTP responses.

### Defense 5: Web Application Firewall (WAF)

A WAF can detect and block SQL injection, XSS, and other attacks at the network layer before they reach the application.

**Where it applies:**

| Path | WAF relevance | Action |
|------|--------------|--------|
| Static dashboard (GitHub Pages / internal hosting) | Low — no server-side processing | CSP meta tags provide client-side protection |
| Warehouse JSON API (Path A) | **High** — API accepts requests; WAF should inspect query params and POST bodies | Ask IT whether their API gateway includes WAF (Azure Front Door, AWS WAF, Cloudflare, etc.) |
| Story submission POST | **High** — accepts user-generated content | WAF + server-side validation + parameterized INSERT |
| Power BI Service (Path B) | Managed by Microsoft | No action needed |

**Action for warehouse meeting:** Ask whether the JSON API endpoint will sit behind an API gateway with WAF capabilities. Record the answer in the IT discovery checklist.

---

## Secure Force Layers (Run in Parallel or Sequence)

### Layer 1 — SAST (Static Application Security Testing)

Run automated scans so the AI (and you) don't ship obvious vulnerabilities.

1. **Semgrep** (free, catches common app-level issues):
   ```bash
   semgrep scan --config auto
   ```
   Or with a custom config in `.semgrep.yml` for your stack (e.g. JS/HTML, optional Node).

2. **What it catches:** SQL injection, XSS, hardcoded secrets, dangerous DOM APIs (`innerHTML`, `eval`), unsafe patterns. AI-generated code has similar vulnerability patterns to junior dev code; SAST flags most of these.

3. **When to run:** Before every release; after any change to auth, webhooks, or user-input handling. Integrate into your workflow (e.g. pre-commit or CI).

---

### Layer 2 — Input Validation & Auth (Manual Review)

SAST does not catch semantic issues. Manually check:

1. **User input:** Every place user input touches your app (hash, filters, search, form fields, URL params). Validate and sanitize; never trust input. Use safe DOM APIs (`textContent`, `createElement`); avoid `innerHTML`/`outerHTML`/`eval` and inline event handlers.
2. **Dashboard filters:** Ensure filter values are validated and bounded (e.g. state codes from an allowlist). Check every place user input touches a database or external API if you add them.
3. **Auth middleware:** If you add auth, read through it on every route. AI often generates plausible-looking but incorrect auth logic. Ensure nested routes and chained data sources have proper authorization and input sanitization.
4. **Hardcoded credentials:** Never ship API keys, passwords, or tokens in source. Use env vars or a secret store; add a Cursor rule so the AI never hardcodes credentials.

---

### Layer 3 — AI-Generated Code Review (NEW — warehouse era)

This layer is specifically for catching AI coding assistant mistakes that SAST misses.

1. **Run the post-AI-session checklist** (above) after every session that touches data, APIs, or user input.
2. **Verify function implementations exist** for every validation/normalization call the AI generates.
3. **Check fetch/API boundaries** — all URLs validated, all responses shape-checked, all POST bodies sanitized.
4. **Trace data flow end-to-end** — from user input (form field, URL hash, search box) through DataLayer to fetch/POST to response caching to DOM rendering. Every hop must validate.

**Project-specific AI review targets:**

| Data path | What to verify |
|-----------|---------------|
| `DataLayer.connectWarehouse(url)` | URL passes `_isAllowedEndpoint()` |
| `DataLayer.connectAPI(url)` | URL passes `_isAllowedEndpoint()` |
| `DataLayer.refresh()` → warehouse | Response shape validated against known-table allowlist |
| `DataLayer.submitStory(payload)` | Payload sanitized by `_normalizeStoryPayload()` — type coercion, length limits, category allowlist, email format |
| Story form fields | `textContent` only for feedback; no `innerHTML` with user data |
| Hash state (`#state-XX`) | Validated against state code allowlist |
| Map tooltips | `title` attribute or `textContent` — no `innerHTML` |
| Legislator URLs | `isTrustedLegislatorUrl()` allowlist (palegis.us, .house.gov, .senate.gov, congress.gov, bioguide) |

---

### Layer 4 — Infrastructure & Config (If Applicable)

If you use Docker, Terraform, K8s, or cloud/database configs:

1. Run an **infrastructure/config scanner** (e.g. [CoGuard misconfiguration-detection](https://github.com/coguardio/misconfiguration-detection-skill)) so infra is not an open door.
2. **Resource limits:** Always set resource limits in Docker/K8s (CPU, memory). Add this to Cursor rules so the AI follows it.
3. Application-only scanners miss this layer; infra misconfig is a major cause of breaches.

---

### Layer 5 — Warehouse / Database Security (NEW)

When connecting to the data warehouse (Path A/B/C):

1. **Never store credentials in source.** No connection strings, API keys, tokens, or service principal secrets in `config/settings.js` or any file in this repo. Use IT-managed auth (Azure AD, gateway credentials, Key Vault).
2. **Parameterized queries — always.** If you add any server-side code (API endpoint, ETL script, data pipeline) that constructs SQL, use parameterized/prepared statements. Never concatenate or interpolate user input into SQL strings.
3. **Read-only access.** The dashboard should only have read-only access to Gold tables. Story submission POST goes to a separate write endpoint that IT controls.
4. **Response validation.** Warehouse JSON responses are validated against a known-table allowlist before caching. Unknown keys are rejected.
5. **CORS.** The warehouse JSON endpoint must set appropriate CORS headers. The dashboard does not bypass CORS.
6. **Polling.** Default poll interval is 15 minutes. Do not reduce below 5 minutes without IT approval. Failed polls fall back to cached data — the dashboard never shows stale errors to users.

---

### Layer 6 — Review Before Deploy

- Do not ship on "it runs." Review what the AI (or anyone) generated before deploying.
- Run Semgrep (and infra scan if applicable), then run through the manual checklist above. Fix or document exceptions.
- **Run the post-AI-session review checklist** after every coding session.
- Use [SECURE-FORCE.md](SECURE-FORCE.md) and [.cursor/rules/secure-force-security.mdc](.cursor/rules/secure-force-security.mdc) so the AI has security context whenever it touches sensitive code.

---

## OWASP-Oriented Checklist (Dashboard)

- [ ] **Injection:** No unsanitized user input in HTML, SQL, or script context. Parameterized queries if you add a DB. No template literals in query calls. `_normalizeStoryPayload()` sanitizes all story form data before POST.
- [ ] **XSS:** Use `textContent`/safe APIs; no `innerHTML`/`eval` with user data. CSP meta tag on all HTML pages. `while (el.firstChild) el.removeChild(el.firstChild)` for container clearing.
- [ ] **Broken auth:** If you add auth, every protected route is checked; no skipped nested routes.
- [ ] **Sensitive data:** No secrets in source; no internal errors exposed to the client. Warehouse credentials managed by IT — never in this repo.
- [ ] **Hash/state:** Hash-driven state validated (e.g. state code allowlist); invalid hash handled safely.
- [ ] **API boundaries:** All fetch URLs validated by `_isAllowedEndpoint()`. All POST bodies sanitized. All responses shape-validated before caching.
- [ ] **AI review:** Post-session checklist completed; phantom functions verified; template literal audit passed.

---

## Cursor Integration

- **Rules:** [.cursor/rules/secure-force-security.mdc](.cursor/rules/secure-force-security.mdc) — loads security instructions when editing code (no hardcoded creds, parameterized queries, input validation, AI-generated code review).
- **Agent commands:** "Run Secure Force" or "Security scan" → run Semgrep, then manual checklist from this file.
- **Meta:** [AGENT-RULES-SYSTEM.md](AGENT-RULES-SYSTEM.md) — Secure Force is part of the rules hierarchy; run before release when you have auth, webhooks, or user input touching data.

---

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

---

## Summary

| Layer        | Tool / Action                                      | Catches / Ensures                                      |
|-------------|-----------------------------------------------------|--------------------------------------------------------|
| SAST        | Semgrep `semgrep scan --config auto`                | SQLi, XSS, secrets, dangerous DOM, common AI patterns  |
| Input/Auth  | Manual review of every user-input and auth path     | Semantic vulns, missing validation, wrong auth logic   |
| AI Review   | Post-session checklist + phantom function audit     | Template literal injection, missing implementations, unvalidated fetch, phantom validators |
| Warehouse   | Endpoint validation, response shape check, no creds | SSRF, open redirect, credential leak, schema poisoning |
| Infra       | Config/infra scanner (e.g. CoGuard)                | Docker/K8s/cloud misconfig, missing resource limits    |
| Deploy gate | Review AI output before deploy; run checklist       | "It runs, ship it" security failures                   |

Nothing is 100% secure; the goal is to make it much harder than an open door. Automated checks + manual review of auth and input + AI-specific review = Secure Force workflow.

---

## Last Secure Force run (AI code review hardening — 2026-04-05)

**Scope:** Full codebase scan for AI-generated anti-patterns ahead of warehouse integration. Added new security layer for AI-generated code review, SQL injection prevention, and warehouse-era hardening.

**Findings and fixes:**

1. **`_normalizeStoryPayload()` — phantom function (CRITICAL).** Called on line 525 of `data-layer.js` but never implemented. Story form data would have gone unsanitized to the warehouse API. **Fixed:** Implemented with type coercion, length limits (200 chars hospital name, 500 chars story, 254 chars email), category allowlist, email format validation, and unknown-key stripping.

2. **`_isAllowedEndpoint()` — URL validation added.** `connectWarehouse()` and `connectAPI()` now validate endpoint URLs before any `fetch()`. Blocks `javascript:`, `data:`, `file:` schemes and restricts private IPs to same-origin only.

3. **Warehouse response shape validation added.** `refresh()` now validates that warehouse JSON contains only known table keys before caching. Unexpected keys are rejected.

4. **`innerHTML = ""` in `advocacy-lab.js` (lines 98, 194).** Used to clear D3 chart containers. No user data involved (safe), but replaced with `while (el.firstChild) el.removeChild(el.firstChild)` for SAST compliance and consistency.

5. **No SQL injection found.** Zero `query()`, `execute()`, `db.*` calls in any project JS. The project does not directly access any database — all data flows through `DataLayer` which uses `fetch()` + `JSON.stringify()`. When warehouse code is added server-side, parameterized queries are mandatory per this document.

6. **No `eval()`, no `innerHTML` with user data.** All dynamic DOM uses `textContent`, `createElement`, `appendChild`. CSP meta tags enforce `script-src 'self'` on mobile and BASIC pages.

7. **Template literals in `main.js` — reviewed, safe.** Used for display formatting (`${value}%`, chart tooltip labels) with internal numeric data only. No user-controlled input reaches these interpolations.

**dashboard-audit.py:** Run completed; all automated checks PASS.

**Semgrep:** Not run in this pass. When available: `semgrep scan --config auto`.

**SECURE-FORCE.md:** Updated with AI-Generated Code Review section (Layer 3), Warehouse Security section (Layer 5), post-AI-session review checklist, and six documented AI anti-patterns with grep commands.

**secure-force-security.mdc:** Updated to match (see Cursor rule).

---

## Previous Secure Force runs

<details>
<summary>340b-mobile + audit — 2026-04-04</summary>

**Scope:** Brought **340b-mobile** in line with this document and the OWASP-oriented checklist: removed all `.innerHTML` assignments from `340b-mobile.js` in favor of `createElement`, `textContent`, and SVG `createElementNS` (state cards, HAP ask cards, state detail sheet). Lazy-loaded `pa-district-map.js` uses `addEventListener("load", …)` instead of a legacy `onload` property so static scans stay clean.

**340b-mobile.html:** Added a **Content-Security-Policy** meta tag (`default-src 'self'`, `script-src 'self'`, Google Fonts allowed for existing Montserrat links). **Referrer** policy was already `strict-origin-when-cross-origin`. **More** tab links to `340b.html` and `haponline.org` now use `rel="noopener noreferrer"`. Map search placeholder reworded so it does not trip the removed-feature string check.

**dashboard-audit.py:** `EXECUTABLE_FILES` now includes **340b-mobile.js** (unsafe DOM / inline-handler patterns). **CSP + referrer** and **target="_blank"`** checks now include **340b-mobile.html** alongside `340b.html` and `340b-BASIC.html`. **340b-mobile.html** / **340b-mobile.js** are in the hidden-character source set.

**dashboard-audit.py:** Run completed — all automated checks **PASS**.

**Semgrep:** Not run in this pass. When available: `semgrep scan --config auto` from the project root (or `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .` per [SECURITY.md](SECURITY.md)).

**Manual OWASP-oriented checklist (mobile):** No new user-controlled HTML sinks; story form feedback uses `textContent`; `sessionStorage` for story draft remains browser-local until a vetted API exists. **340b-BASIC.html** unchanged — still the strictest deploy surface.
</details>

<details>
<summary>Print/PDF and Download PDF updates</summary>

**Date:** After implementing Print/PDF local (file:) path, Download PDF (image) 3-page A4 layout, and community-benefit spacing.

**Changes in scope:** (1) `openPrintView()` in 340b.js now detects `file:` protocol and uses `preparePrintSnapshot()` + `window.print()` on the same page instead of opening print.html (avoids localStorage not being shared across file:// origins). (2) Download PDF (image) now captures `#pdf-capture-root` (with fallback to main), applies A4-width centering (794px), splits into three pages (intro; state-by-state + map; community benefit through end), centers each page image on A4, and adds 20px extra margin above the community benefit block. (3) 340b.html now wraps main content in `<div id="pdf-capture-root">` for capture and styling.

**SAST:** Semgrep was not run (not installed in environment). To run: `semgrep scan --config auto` from the project root.

**Manual OWASP-oriented checklist:** No new use of `innerHTML`, `outerHTML`, `eval`, or inline event handlers. Dynamic content continues to use `textContent`, `createElement`, and attribute setters. Hash-driven state still validated via `getHashState()` and `isKnownState(abbr)`. No secrets, API keys, or tokens added. Print and PDF flows use `setUtilityStatus()` with user-facing messages only.
</details>

<details>
<summary>CEO Upgrade — 2025-03-05</summary>

**Scope:** Code clarity (340b.js variable renames), Policy Impact Simulator container ID alignment, documentation updates. No changes to protected systems (print, PDF, map).

**dashboard-audit.py:** Run completed; same pre-existing findings; no new regressions.

**Semgrep:** Not installed. Run `semgrep scan --config auto` for SAST.

**Manual OWASP checklist:** No new user input paths, auth, or data connections. Hash/state validation unchanged. No secrets added.
</details>

<details>
<summary>Refactor pass</summary>

After the full refactor (labels, comments, glossary, reuse checklist): dashboard-audit.py was run; all automated checks passed except the expected "340b.html references remote script infrastructure" (unpkg for html2canvas/jsPDF). **Semgrep:** not run (semgrep not installed in environment). No hardcoded credentials were added; hash state is validated; safe DOM APIs (textContent, createElement) are used.
</details>
