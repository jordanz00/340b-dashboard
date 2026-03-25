# Daily Improvement Workflow — 340B Dashboard

Use this workflow when you want a periodic improvement pass. Run it manually (or via a scheduled reminder) to apply the next ULTRA wave and keep the project improving.

---

## When to Run

- When you want a "daily" or periodic improvement cycle.
- When you have time to review changes before committing.
- After major features to catch regressions and polish.

---

## 50 Improvements (Agent Mode)

For the 50-improvement agent workflow (batches A–E), use [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md). For rules and release gates, see [AGENT-RULES-SYSTEM.md](AGENT-RULES-SYSTEM.md).

1. Run in Cursor Agent mode: "Run Agent Batch A" (or B, C, D, E).
2. Each batch implements 10 items; follow the pre-flight and post-flight checklists in AGENT-TEMPLATE.md.
3. Batches align with ULTRA v08–v12. After each batch: run audit, update ULTRA handoff, optionally commit.

---

## Secure Force (Security Scan)

Before release, or when you touch auth, user input, or data connections, run the **Secure Force** multi-agent security workflow:

1. **SAST:** Run `semgrep scan --config auto` and fix or document findings.
2. **Manual review:** Use [SECURE-FORCE.md](SECURE-FORCE.md) — threat model, OWASP checklist, input validation and auth review. Check every user-input path and protected route.
3. **No hardcoded creds:** Ensure no API keys or secrets in source; use env or secret store.
4. **Review before deploy:** Do not ship on "it runs"; review AI-generated auth and input handling.

Cursor rules [secure-force-security.mdc](.cursor/rules/secure-force-security.mdc) and [secure-force-sast.mdc](.cursor/rules/secure-force-sast.mdc) load security context when editing sensitive files. Agent command: "Run Secure Force" or "Security scan".

---

## Novice refactor (daily learning)

Use [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md) for the full guide. For **daily refactoring**, pick one prompt from **ULTRA v13–v22** in [ULTRA-prompts.md](ULTRA-prompts.md); apply it; test (open page, Print/PDF, Download PDF image); then run audit after each full wave. One prompt per day keeps changes small and safe.

---

## Steps

1. **Identify next wave**  
   Open [ULTRA-prompts.md](ULTRA-prompts.md). Find the next wave to run (v03, v04, v05, v06, v07, or v08–v12 for 50 improvements). Check the Usage section for status. For 50-improvement batches, use [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md) instead. **For novice-focused refactor,** choose the next unrun wave from **v13–v22** and run one prompt per day.

2. **Run the wave**  
   Apply each prompt in that wave: implement changes or document gaps. Prefer ULTRA-prompts.md over ad-hoc requests for improvement tasks.

3. **Update handoff**  
   In ULTRA-prompts.md, mark the wave as run (e.g. "ULTRA v03 has been run") and add a short summary of changes.

4. **Run audit**  
   ```bash
   python3 dashboard-audit.py
   ```  
   Fix any failures before committing.

5. **Test Download PDF (image)**  
   Click "Download PDF (image)" in the dashboard. If it shows "PDF capture failed. Try Print / PDF instead.", treat as a regression: check console for html2canvas/jsPDF errors, ensure scripts load (e.g. unpkg or local vendor), and prefer the Print/PDF path as fallback. Include this in the release gate so the feature either works or fails with clear user feedback.

6. **Preview (optional)**  
   If you requested "preview before implementation," review the changes and approve before commit.

7. **Commit and push**  
   Example message:  
   `ULTRA v03: print map visibility, page breaks, Download PDF map`

---

## Level-Up Notification

When a wave is completed and the next wave is written, consider the project "leveled up" once. You can:

- Note it in the commit message.
- Add a line in this file: "Last improvement: ULTRA v0X on [date]." For novice refactor: "Last refactor: ULTRA v13.1 on [date]" (or the last prompt you ran).
- Optionally notify yourself (e.g. via GitHub issue or calendar) that the next wave is ready.

---

## Scalability, Readability, Layman Understanding

Each wave should consider:

- **Scalability:** Structure, design tokens, maintainability. New sections follow existing patterns.
- **Text readability:** Font sizes, contrast, line height. WCAG AA where applicable.
- **Layman understanding:** Plain language, abbreviation expansion (non-state), clarity for lawmakers and CEOs.

---

## Automation (Optional)

- **GitHub Action:** Add a workflow that runs on a schedule (e.g. daily) and creates an issue: "Daily improvement: run next ULTRA wave — see DAILY-IMPROVEMENT.md." That gives you a reminder without running code automatically.
- **Cursor rule:** Use `.cursor/rules/ultra-daily-improvement.mdc` so the AI prefers ULTRA-prompts.md when working on improvement tasks.
- **Agent rules:** Use `.cursor/rules/agent-a-seo.mdc` through `agent-e-analytics.mdc` for 50-improvement batches; use `agent-rules-system.mdc` for stability and release gates.
