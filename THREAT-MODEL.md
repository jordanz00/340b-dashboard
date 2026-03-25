# Dashboard Threat Model

This project is a **static** advocacy dashboard. The primary risks are **client-side**: misleading or unsafe behavior, not server compromise.

## What this project does not currently have

- No database connection  
- No login or auth flow  
- No server-side routes  
- No webhook handlers  
- No secret management layer  

If any of those are added later, this threat model must be expanded and reviewed under [SECURITY-FORCE.md](SECURITY-FORCE.md).

---

## Risk catalog (explicit)

### Cross-site scripting (XSS)

| Risk | Description |
|------|-------------|
| **DOM injection** | Untrusted strings written with `innerHTML` or similar could execute script in the user’s browser. |
| **Mitigation** | Use `textContent`, `createElement`, and attribute setters. Dashboard audit forbids unsafe patterns in core files. |

### Malicious URL parameters and hash

| Risk | Description |
|------|-------------|
| **Fake state** | A crafted `#state-XX` could try to drive UI into unexpected states. |
| **Mitigation** | `getHashState()` allowlists **known state codes** from `state-data.js`; unknown codes are ignored. |

### localStorage tampering

| Risk | Description |
|------|-------------|
| **Data tampering** | Another script on the same origin could write to `localStorage` keys used by the print view. |
| **Quota / corruption** | Large or invalid JSON could break `JSON.parse`. |
| **Mitigation** | **Namespaced key** `hap340b:printSnapshot` (legacy read: `hap340bPrint`). **Schema checks** in `print.html` (`isValidPayload`, `payloadVersion`, bounded `mapSvg` length and text fields). **Try/catch** on parse. |

### Static hosting and supply chain

| Risk | Description |
|------|-------------|
| **Remote scripts** | CDN compromise or network MITM could alter behavior. |
| **Mitigation** | **BASIC:** local scripts only (verified by `dashboard-audit.py`). **Advanced:** vendor libraries vendored under `assets/vendor/`. |

### Data injection (content)

| Risk | Description |
|------|-------------|
| **Misleading metrics** | Edited `state-data.js` or copy could misrepresent policy facts. |
| **Mitigation** | Human release gate; source citations in methodology; version control and review for data changes. |

### Print/PDF surface

| Risk | Description |
|------|-------------|
| **Misleading PDF** | Print output could diverge from live page or show partial state. |
| **Mitigation** | Print pipeline uses validated snapshot; map as **data URL image** from validated SVG string, not arbitrary HTML. |

---

## Highest-risk surfaces in the current codebase

1. **DOM rendering** — Use safe DOM APIs; avoid string-based HTML insertion for dynamic content.  
2. **URL-driven state** — `#state-PA` must not create fake UI state; invalid hashes must be ignored.  
3. **Share flow** — Clipboard and share must expose only the **canonical** public URL.  
4. **External assets** — Prefer local assets; BASIC must not rely on remote scripts.  
5. **Print/PDF output** — Must reflect validated snapshot state.  
6. **Source credibility** — Legal-status wording and dates must stay aligned across `state-data.js`, `340b.html`, and print.  
7. **Copy and metadata drift** — Executive and print surfaces must not drift out of sync.

---

## Mitigations summary

| Category | Mitigation |
|----------|------------|
| XSS / DOM | Safe APIs; audit blocks risky patterns |
| Hash / state | Allowlist state codes |
| localStorage | Namespace key; validate payload; bounded fields |
| Supply chain | Local vendor files; BASIC = no remote scripts |
| Trust | Human review before publish |

---

## Security checks to run

- `python3 dashboard-audit.py`  
- `semgrep scan --config auto` (after security-sensitive changes)  

---

## What "safe" means here

For this static site, "safe" means reducing avoidable browser-side risk:

- Local assets by default  
- Strict link handling (`rel="noopener noreferrer"` on `target="_blank"`)  
- Safe DOM rendering  
- Validated URL-driven state  
- Documented security boundaries  
- Repeatable scans before release  

It does not mean a mathematical guarantee against all compromise.

---

## Human release gate

Before publishing, a human should still confirm:

- Print preview reads correctly end-to-end  
- Default print state context is acceptable  
- Legal-status sources are current  
- Policymaker and hospital-leader framing remains precise  

---

## Maintenance note

The goal is not "zero maintenance." The goal is a small, honest system that makes regressions easier to catch before release.
