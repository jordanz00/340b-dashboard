# Design iteration checklist

Run this **on every release** after content or data changes (15–20 minutes). It keeps the dashboard visually consistent and CEO-presentable without redesigning from scratch each time.

**Primary page for communications:** [340b-BASIC.html](../340b-BASIC.html) — verify first. Then spot-check [340b.html](../340b.html) if you ship the full dashboard.

---

## 1. Typography and hierarchy

- [ ] Page title and H1 read clearly; no awkward wrapping on mobile (320px width).
- [ ] Card titles (`card-title`) vs body text hierarchy is obvious.
- [ ] KPI numbers are readable; no clipped text in stat blocks.

---

## 2. Color and contrast

- [ ] Links use primary blue and are visible on white/light backgrounds.
- [ ] Orange accent (`--accent`) for highlights does not reduce readability of nearby text.
- [ ] Map: protected vs non-protected colors are distinguishable (blue vs gray).

---

## 3. Spacing and rhythm

- [ ] Sections breathe: use existing `--space-*` rhythm; no random one-off margins unless fixing a bug.
- [ ] Map hero and KPI strip align with content max width (`--content-max`).

---

## 4. Mobile and touch

- [ ] No horizontal scroll on `340b-BASIC.html` at 375px width.
- [ ] Nav links / buttons meet ~44px min touch target where possible (see `.basic-dashboard-nav a` on BASIC).
- [ ] Map remains legible; legend text does not overflow badly.

---

## 5. BASIC vs full (shared sections)

- [ ] If you changed copy in **state-data.js** or shared HTML, **BASIC** and **full** opening sections do not contradict each other (or document intentional differences).

---

## 6. After this checklist

1. [QA-CHECKLIST.md](../QA-CHECKLIST.md) (full dashboard if applicable)
2. `python3 dashboard-audit.py`
3. Deploy **BASIC** first for comms; full dashboard as needed

See [CEO-SHOWCASE.md](CEO-SHOWCASE.md) for stakeholder messaging.
