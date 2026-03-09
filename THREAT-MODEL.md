# Dashboard Threat Model

This project is a static dashboard, so the main risk is not server compromise. The main risk is shipping unsafe or misleading client-side behavior.

## What this project does not currently have

- No database connection
- No login or auth flow
- No server-side routes
- No webhook handlers
- No secret management layer

If any of those are added later, this threat model must be expanded.

## Highest-risk surfaces in the current codebase

1. DOM rendering
Use safe DOM APIs. Avoid string-based HTML insertion for dynamic content.

2. URL-driven state
The dashboard uses hash state like `#state-PA`. Invalid or unexpected hashes must not create fake UI state.

3. Share flow
Clipboard, share-sheet, and prompt fallbacks should expose only the canonical public URL and should not leak private parameters.

4. External assets
Prefer local assets. Corporate and nonprofit deployments should not rely on remote fonts, hosted scripts, or runtime third-party data fetches unless there is a documented exception and explicit review.

5. Print/PDF output
Print should reflect the final rendered document state, not partial animation or hidden content.

6. Source credibility
Source dates, legal-status wording, and printed policy framing must stay aligned so the dashboard does not become visually polished but substantively misleading.

7. Copy and metadata drift
High-salience copy, metadata text, executive summary cues, and print-only trust surfaces must not drift out of sync across `state-data.js`, `340b.html`, and the print path.

## Security checks to run

- `python3 dashboard-audit.py`
- `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .`

## What "safe" means here

For this static site, "safe" means reducing avoidable browser-side risk:

- local assets by default
- strict link handling
- safe DOM rendering
- validated URL-driven state
- documented security boundaries
- repeatable scans before release

It does not honestly mean a mathematical guarantee that no compromise is ever possible.

## Human release gate

Before publishing, a human should still confirm:

- the print preview reads correctly end-to-end
- the default print state context is acceptable
- the legal-status sources are current
- the policymaker and hospital-leader framing still sounds precise and credible

## Maintenance note

The goal is not "zero maintenance." The goal is a small, honest system that makes regressions easier to catch before release.
