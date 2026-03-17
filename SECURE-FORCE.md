# Secure Force — Multi-Agent Security Workflow

Use this document when running security checks, before deploy, or when the AI touches auth, user input, webhooks, or data connections. Secure Force gives structural and security context so the AI (and maintainers) can build and review with the right threat model.

---

## Threat Model (340B Dashboard)

- **Static dashboard:** No backend service, no database, no auth system unless explicitly added. Primary surfaces: URL hash (`#state-XX`), share/clipboard, print/PDF, localStorage for print payload, and any future API or backend you add.
- **Sensitive routes/surfaces:** Hash-driven state, share URL, print view (print.html) receiving serialized map/data, any form or filter that affects what is shown or sent.
- **Do not expose:** Internal errors, stack traces, or debug output to the user or in client-visible responses. Prefer generic "Something went wrong" and log details server-side if you add a backend later.
- **High-risk spots in dashboard apps:** Every place user input touches a database or external API; authorization on nested routes; input sanitization when chaining multiple data sources. AI-generated code often misses auth checks on nested routes and skips sanitization—review those manually.

---

## Secure Force Layers (Run in Parallel or Sequence)

### Layer 1 — SAST (Static Application Security Testing)

Run automated scans so the AI (and you) don’t ship obvious vulnerabilities.

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

### Layer 3 — Infrastructure & Config (If Applicable)

If you use Docker, Terraform, K8s, or cloud/database configs:

1. Run an **infrastructure/config scanner** (e.g. [CoGuard misconfiguration-detection](https://github.com/coguardio/misconfiguration-detection-skill)) so infra is not an open door.
2. **Resource limits:** Always set resource limits in Docker/K8s (CPU, memory). Add this to Cursor rules so the AI follows it.
3. Application-only scanners miss this layer; infra misconfig is a major cause of breaches.

---

### Layer 4 — Review Before Deploy

- Do not ship on "it runs." Review what the AI (or anyone) generated before deploying.
- Run Semgrep (and infra scan if applicable), then run through the manual checklist above. Fix or document exceptions.
- Use [SECURE-FORCE.md](SECURE-FORCE.md) and [.cursor/rules/secure-force-security.mdc](.cursor/rules/secure-force-security.mdc) so the AI has security context whenever it touches sensitive code.

---

## OWASP-Oriented Checklist (Dashboard)

- [ ] **Injection:** No unsanitized user input in HTML, SQL, or script context. Parameterized queries if you add a DB.
- [ ] **XSS:** Use `textContent`/safe APIs; no `innerHTML`/`eval` with user data. CSP if you add one.
- [ ] **Broken auth:** If you add auth, every protected route is checked; no skipped nested routes.
- [ ] **Sensitive data:** No secrets in source; no internal errors exposed to the client.
- [ ] **Hash/state:** Hash-driven state validated (e.g. state code allowlist); invalid hash handled safely.

---

## Cursor Integration

- **Rules:** [.cursor/rules/secure-force-security.mdc](.cursor/rules/secure-force-security.mdc) — loads security instructions when editing code (no hardcoded creds, parameterized queries, input validation).
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
| Infra       | Config/infra scanner (e.g. CoGuard)                | Docker/K8s/cloud misconfig, missing resource limits    |
| Deploy gate | Review AI output before deploy; run checklist       | "It runs, ship it" security failures                   |

Nothing is 100% secure; the goal is to make it much harder than an open door. Automated checks + manual review of auth and input = baseline Secure Force workflow.

---

## Last Secure Force run (CEO Upgrade — 2025-03-05)

**Scope:** Code clarity (340b.js variable renames), Policy Impact Simulator container ID alignment, documentation updates. No changes to protected systems (print, PDF, map).

**dashboard-audit.py:** Run completed; same pre-existing findings; no new regressions.

**Semgrep:** Not installed. Run `semgrep scan --config auto` for SAST.

**Manual OWASP checklist:** No new user input paths, auth, or data connections. Hash/state validation unchanged. No secrets added.

---

## Last Secure Force run (refactor pass)

After the full refactor (labels, comments, glossary, reuse checklist): dashboard-audit.py was run; all automated checks passed except the expected "340b.html references remote script infrastructure" (unpkg for html2canvas/jsPDF). **Semgrep:** not run (semgrep not installed in environment). To complete Secure Force: install Semgrep (`pip install semgrep` or see semgrep.dev) and run `semgrep scan --config auto`, then run through the OWASP-oriented checklist above. No hardcoded credentials were added; hash state is validated; safe DOM APIs (textContent, createElement) are used.

---

## Last Secure Force run (Print/PDF and Download PDF updates)

**Date:** After implementing Print/PDF local (file:) path, Download PDF (image) 3-page A4 layout, and community-benefit spacing.

**Changes in scope:** (1) `openPrintView()` in 340b.js now detects `file:` protocol and uses `preparePrintSnapshot()` + `window.print()` on the same page instead of opening print.html (avoids localStorage not being shared across file:// origins). (2) Download PDF (image) now captures `#pdf-capture-root` (with fallback to main), applies A4-width centering (794px), splits into three pages (intro; state-by-state + map; community benefit through end), centers each page image on A4, and adds 20px extra margin above the community benefit block. (3) 340b.html now wraps main content in `<div id="pdf-capture-root">` for capture and styling.

**SAST:** Semgrep was not run (not installed in environment). To run: `semgrep scan --config auto` from the project root.

**Manual OWASP-oriented checklist:**
- **Injection / XSS:** No new use of `innerHTML`, `outerHTML`, `eval`, or inline event handlers. Dynamic content continues to use `textContent`, `createElement`, and attribute setters.
- **Hash/state:** Hash-driven state (`#state-XX`) is still validated via `getHashState()` and `isKnownState(abbr)` (allowlist from STATE_340B); invalid codes are ignored.
- **Sensitive data:** No secrets, API keys, or tokens added. Print payload in localStorage remains non-sensitive (display-only map and summary data).
- **Error handling:** Print and PDF flows use `setUtilityStatus()` with user-facing messages only; no stack traces or internal errors exposed.
- **localStorage:** Used only for the print view payload; failures (e.g. quota) are caught and reported with a generic message.

**Recommendations:** (1) For production, consider serving CSP via HTTP response headers if desired, so the same HTML works locally without a meta tag. (2) For environments that restrict remote script, consider local copies of html2canvas and jsPDF instead of unpkg.
