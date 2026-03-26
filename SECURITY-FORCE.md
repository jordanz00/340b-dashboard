# SECURITY-FORCE — Multi-Agent Static Dashboard Review

This document defines a **collaborative security review system** for the **HAP 340B Advocacy Dashboard**: a 100% static site (HTML/CSS/JavaScript) intended for **government, hospital IT, and air-gapped** environments.

It complements:

- [THREAT-MODEL.md](THREAT-MODEL.md) — assets, risks, and mitigations  
- [SECURE-FORCE.md](SECURE-FORCE.md) — operational rules, SAST, and checklists  
- [SECURITY.md](SECURITY.md) — project-specific hosting and BASIC constraints  

---

## Supervisor agent (final approval)

**Role:** Senior cybersecurity and static-web reviewer.

**Responsibilities:**

- Reviews **all** material changes before release (especially auth, storage, URL state, print/PDF, new scripts).
- Consolidates findings from the agents below; resolves conflicts.
- **Blocks** release if any **non-negotiable** is violated: static-only architecture, BASIC = no external scripts, safe DOM patterns, validated hash/state.
- Ensures `python3 dashboard-audit.py` passes and recommends Semgrep after security-sensitive edits.

**Final approval criteria (summary):**

| Gate | Requirement |
|------|-------------|
| Static | No required backend; no secrets in source |
| BASIC | No CDN/remote scripts; CSP-compatible |
| DOM | No `innerHTML`/`outerHTML`/`eval`/`new Function` with untrusted data; prefer `textContent` / `createElement` |
| State | `#state-XX` allowlisted; invalid hash handled safely |
| Print | Payload validated in `print.html`; bounded SVG size |
| Audit | `dashboard-audit.py` PASS |

---

## Agent team

### 1. Static integrity agent

- Confirms the project stays **100% static** (no APIs, databases, or server logic in the shipped pages).
- Flags accidental **fetch/XHR**, WebSockets, or embedded third-party analytics.

### 2. Frontend security agent

- Scans for **XSS** patterns: unsafe DOM APIs, inline event handlers with dynamic data, string-built HTML.
- Verifies dynamic UI uses **safe APIs** consistent with [SECURE-FORCE.md](SECURE-FORCE.md).

### 3. Dependency audit agent

- **Advanced (`340b.html`):** Confirms D3, TopoJSON, html2canvas, jsPDF are **local** under `assets/vendor/` (no CDN).
- **BASIC (`340b-BASIC.html`):** Confirms **only** local scripts; no `http(s)` script URLs.
- Flags supply-chain risk from **unpinned** or **edited** vendor files without review.

### 4. Data integrity agent

- Validates **`state-data.js`** shape and conventions (state codes, documented fields).
- Ensures dashboard copy does not assert data that the data file does not support.

### 5. UX consistency agent

- Ensures security fixes do not **break** layout, print, map, or navigation.
- Confirms design tokens and accessibility basics remain coherent after changes.

### 6. Print/PDF safety agent

- Verifies **print.html** CSP, payload validation (`isValidPayload`), and **textContent** for snapshot fields.
- Confirms map rendering uses **data URL from validated SVG string** (not raw HTML injection from untrusted input).

### 7. Navigation and state agent

- Validates **URL hash** parsing (`#state-XX`), **share URL** canonicalization, and **no routing** that executes user-controlled code.

---

## Workflow

1. **Change** — Developer or AI edits code (prefer small, reviewable diffs).
2. **Parallel scan** — Run `python3 dashboard-audit.py`; run `semgrep scan --config auto` when touching scripts, storage, or print.
3. **Agent pass** — Each agent above checks its scope (can be human roles or automated scripts).
4. **Supervisor** — Aggregates results; approves or sends back for fixes.
5. **Release** — Tag/commit only after supervisor sign-off and audit PASS.

---

## Content Security Policy (CSP) guidance

For **static hosting**, CSP is often set via **`<meta http-equiv="Content-Security-Policy">`** on entry pages. Recommended **baseline** (adjust per environment):

- `default-src 'self'`
- `script-src 'self'` — for BASIC, avoid `'unsafe-inline'` for scripts; advanced build may allow inline only where unavoidable and reviewed.
- `style-src 'self' 'unsafe-inline'` — often needed for print/layout; review if tightening.
- `img-src 'self' data:` — allows SVG data URLs for print map image.
- `object-src 'none'`
- `base-uri 'self'`
- `connect-src` — use `'none'` on BASIC if no network access is required from scripts.

Prefer **HTTP header CSP** in production if your host supports it, so policy is consistent without duplicating meta tags.

---

## Related automation

- `dashboard-audit.py` — unsafe patterns, BASIC remote scripts, print storage namespace, documentation presence, links, CSP meta hints.
