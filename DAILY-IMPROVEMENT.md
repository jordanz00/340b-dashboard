# Daily Improvement Workflow — 340B Dashboard

Use this workflow when you want a periodic improvement pass. Run it manually (or via a scheduled reminder) to apply the next ULTRA wave and keep the project improving.

---

## When to Run

- When you want a "daily" or periodic improvement cycle.
- When you have time to review changes before committing.
- After major features to catch regressions and polish.

---

## Steps

1. **Identify next wave**  
   Open [ULTRA-prompts.md](ULTRA-prompts.md). Find the next wave to run (v03, then v04, v05, v06, v07…). Check the Usage section for status.

2. **Run the wave**  
   Apply each prompt in that wave: implement changes or document gaps. Prefer ULTRA-prompts.md over ad-hoc requests for improvement tasks.

3. **Update handoff**  
   In ULTRA-prompts.md, mark the wave as run (e.g. "ULTRA v03 has been run") and add a short summary of changes.

4. **Run audit**  
   ```bash
   python3 dashboard-audit.py
   ```  
   Fix any failures before committing.

5. **Preview (optional)**  
   If you requested "preview before implementation," review the changes and approve before commit.

6. **Commit and push**  
   Example message:  
   `ULTRA v03: print map visibility, page breaks, Download PDF map`

---

## Level-Up Notification

When a wave is completed and the next wave is written, consider the project "leveled up" once. You can:

- Note it in the commit message.
- Add a line in this file: "Last improvement: ULTRA v0X on [date]."
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
