# Operational Playbook (SOP) — 340B Dashboard Delivery

**Purpose:** Provide a repeatable, CTO-style workflow for improving the 340B dashboard safely: bounded file ownership, deterministic validation, execution traces, and recorded manual QA.

---

## 1) Release Contract (Non-negotiables)
- **No metric integrity drift:** Do not change HAP Pennsylvania metrics/state-law values unless explicitly approved.
- **Apple/Jony Ive clarity:** Maintain executive readability, strong hierarchy, and restrained accents.
- **Accessibility is required:** focus-visible cues, no color-only meaning for state/status, keyboard support for map interactions.
- **Print/PDF stability:** do not change print/PDF pipeline logic unless explicitly allowed by a task.

---

## 2) Task Scoping Rules (Bounded Ownership)
- Every improvement is implemented as an isolated task with:
  - Exact **Allowed Files**
  - Explicit **Forbidden** scope
  - Required **lock file** for any write
  - Required **execution trace** output under `docs/execution-traces/`
  - Deterministic gate: `python3 dashboard-audit.py`
  - Manual gate: Print/PDF map + `Download PDF (image)` rendering
- **No overlapping file ownership** between parallel tasks.

---

## 3) Execution Protocol (CTO Steps)
1. **Create locks first**
   - Create required lock file(s) in `locks/` before any edits.
2. **Apply the task-only edits**
   - Edit only the allowed files for that task.
3. **Write execution trace (source of truth)**
   - Create `docs/execution-traces/<TASK-ID>.json` containing:
     - files modified
     - lock acquisition/removal
     - deterministic checks run
     - any errors
4. **Remove the lock**
   - Remove lock file(s) after successful trace + verification.
5. **Run deterministic audit gate**
   - Run `python3 dashboard-audit.py` and record PASS/FAIL.
6. **Record manual QA**
   - Print/PDF page fit (2 pages)
   - Map visibility on print
   - `Download PDF (image)` rendering (no blank pages)

---

## 4) Deterministic Validation Rules (Must Record)
After any change set that affects runtime or PDF export:
- Run `python3 dashboard-audit.py`:
  - Must be PASS for deterministic gate success.
- Evidence checks to record in the task docs (as applicable):
  - `unpkg.com` matches = 0 in `340b.html` (if remote infra is removed)
  - Preserved metric integrity strings remain present:
    - `7.95B`, `72`, `179`, `7%`

---

## 5) Manual Validation Checklist (Always Required)
Record outcomes before release:
1. **Print/PDF page fit:** exactly 2 pages, no excessive whitespace.
2. **Map visibility:** map renders on the expected page.
3. **Download PDF (image):** output is not blank and includes map + full content.
4. **Invalid hash behavior:** invalid `#state-XX` does not break selection UI and produces no console errors.

---

## 6) How to Summarize for ChatGPT (Optimization Output Template)
When reporting to ChatGPT for future optimization, include:
- **What changed** (only the task-level diffs category)
- **How it was done** (lock-safe scope + deterministic gate)
- **What passed** deterministically (`dashboard-audit.py`)
- **What remains manual** (Print/PDF + Download PDF (image) rendering)
- **Preserved metric integrity** statement (explicit metric list)

Example response format:
1. Summary: 3–5 sentences.
2. Deterministic results: PASS/FAIL + key evidence.
3. Manual QA: completed/pending with 4 checklist items.
4. Next steps: deferred items.

---

## 7) Current Manual QA Status (from QA-V6)
Manual QA items are recorded as:
- Print/PDF page fit: FAIL.
- Map visibility: FAIL.
- Download PDF (image) rendering: FAIL.
- Invalid hash behavior: FAIL.

