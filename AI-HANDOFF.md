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

## Important constraint

This project is a static dashboard. Do not assume backend auth, databases, or webhook infrastructure exist unless the user explicitly adds them.
