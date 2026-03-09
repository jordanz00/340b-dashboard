# AI Handoff Notes

This repo now uses a simple three-layer memory system for AI-assisted maintenance:

## Layer 1: Persistent rules

- `.cursor/rules/project-security-context.mdc`
- `.cursor/rules/web-dashboard-files.mdc`

These give future AI sessions the standing security and maintenance context for this project.

## Layer 2: Repo documentation

- `README.md`
- `SECURITY.md`
- `THREAT-MODEL.md`
- `QA-CHECKLIST.md`
- `NOVICE-MAINTAINER.md`

These explain the real workflow, risk model, and release checks.

## Layer 3: Repeatable checks

- `dashboard-audit.py`
- local Semgrep scan in `./.venv-semgrep/`

These provide lightweight evidence instead of relying on memory alone.

## Highest-risk maintenance surfaces

When future AI or human maintainers touch this project, pay extra attention to:

- print/PDF preparation and page-flow behavior
- URL hash state and selection recovery
- share-link output and fallback behavior
- map rendering and local vendor assets
- source-date credibility and legal-status wording

These are the places most likely to create visible regressions or trust problems.

## What still requires human review

The current tooling helps, but it does not replace a human release pass.

- Open the print preview and inspect the exported document visually.
- Confirm the selected-state print context still makes sense.
- Verify source dates and source links against the real legal-status sources.
- Re-read audience-facing copy for lawmakers, hospital CEOs, and administrators.

## Prompt-to-outcome shorthand

Recent prompt waves mainly drove these outcomes:

- `v15-v16`: print continuity, print-only Pennsylvania default, and compact print state summary
- `v17-v18`: clearer neutral-state language, source-verification guidance, and manual review honesty
- `v19-v20`: stronger release discipline, prompt specificity, and small-system maintenance guidance
- `v21-v30`: stronger executive scan hierarchy, tighter state-context storytelling, more config-driven high-salience copy, and clearer trust-signal placement

## Important constraint

This project is a static dashboard. Do not assume backend auth, databases, or webhook infrastructure exist unless the user explicitly adds them.
