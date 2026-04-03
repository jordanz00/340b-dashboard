# Design System Agent — HAP 340B dashboard suite

## Goal

Keep **340B** (and related OW-style surfaces that share `340b.css` / tokens) **CEO-briefing ready**: intentional **8px-based rhythm**, **HAP brand colors** for meaning, **tokenized cool neutrals** for structure, **quiet chrome** (hairlines, `--hap-shadow-xs`), **≥44px tap targets**, and **no invented facts** in copy. **HAP PDF style guides** and **`state-data.js`** always override generic design advice.

## Output (when invoked)

- UI inconsistency list (spacing, surfaces, type, a11y).
- Exact CSS changes referencing **`hap-design-tokens.css`** and scoped **`340b.css`** rules (prefer `.dashboard …`).

---

## Dashboard density knobs (340B)

Defined on **`.dashboard`** in `340b.css` (tune here instead of one-off margins):

| Token | Role |
|-------|------|
| `--dash-grid-gap` | `.dashboard .dashboard-grid` column gap |
| `--dash-section-y` | Vertical margin on major bands (map hero, key findings, etc.) |
| `--dash-card-pad` | Padding inside large hero cards (map hero, community benefit, etc.) |
| `--dash-main-pad-y-end` | Bottom padding on `.dashboard main` (largest “empty” lever) |

**`.dashboard`** also sets `--hap-leading-relaxed` to `var(--hap-leading-dek)` so executive deks sit tighter next to KPIs without changing global `:root` for OW until sign-off.

---

## Neutral ramp + label hierarchy (`hap-design-tokens.css`)

Use **semantic HAP colors** for brand and topic meaning (primary blue, teal finance, orange risk, etc.). Use **neutrals** for page structure and secondary copy:

| Token | Use |
|-------|-----|
| `--hap-surface-page` | Page wash / outer field |
| `--hap-surface-subtle` | Quiet bands, strips |
| `--hap-surface-raised` | Card faces (often same as white) |
| `--hap-label-primary` | Primary headings/body emphasis |
| `--hap-label-secondary` | Descriptions, deks |
| `--hap-label-tertiary` | Meta, captions |
| `--hap-separator` | Hairlines between regions |
| `--hap-leading-dek` | Line-height for deks next to dense stats |

**Rules:** No new one-off grays in components—add to tokens if a new step is needed. After swaps, spot-check **contrast** on white and subtle gray bands; keep **focus rings** `--hap-focus-ring` (HAP blue). **Print:** backgrounds must not flatten to mud; `print-color-adjust` on maps stays required.

---

## Minimal surfaces

- Prefer **one** border per visual frame; avoid card + inner panel + extra border unless hierarchy demands it.
- Default elevation: `--hap-border-default` / `--hap-separator` + `--hap-shadow-xs`. Reserve `--hap-shadow-md` for hover/focus on `.hap-card-interactive` (and similar).
- **Card lift on hover** only under `@media (hover: hover) and (pointer: fine)` so touch layouts do not feel “broken” without hover.

---

## Cross-device compatibility (QA matrix)

**Viewport:** `340b.html` uses `width=device-width, initial-scale=1` and `viewport-fit=cover` for notches.

**Layout:**

- **≤900px:** Sidebar becomes horizontal strip; verify sticky stack vs header.
- **≤768px / 700px / 640px / 560px / 480px:** Key findings, oversight pair, PA metrics, selection summary, impact grids stack without horizontal page scroll.
- **Landscape + short height (`max-height: 460px`):** `.map-hero-section` and `.utility-toolbar` use reduced vertical padding (scoped under `.dashboard`).

**Overflow:** `.hap-page-content` uses `overflow-x: clip` to suppress stray horizontal bleed; **do not** set `overflow-x: hidden` on map roots. Wide tables stay in `.table-scroll` / `overflow-x: auto`.

**Touch:** `touch-action: manipulation` on primary controls where already applied; keep `min-height: var(--hap-tap-min)` on pills, toolbar actions, chips, scenario buttons.

**Motion:** Respect `prefers-reduced-motion` for reveal/stagger/hover motion.

**Browser QA (realistic for static app):** Primary — Safari iOS, Chrome Android, Chrome/Edge Windows, Safari macOS. Secondary — Firefox (layout + print smoke).

---

## Editorial checklist (external style guides are **subordinate** to HAP)

When touching copy, prefer **plain English**, **active voice**, and **consistent UI verbs** (*choose*, *select*, *tap*). Avoid *e.g.* / *i.e.* / *etc.* in user-facing strings where *for example* / *that is* / *and so on* reads cleaner. Use **serial comma** in lists of three or more. Prefer **inclusive** terms (e.g. deny list / allow list; they/them for unknown actors) per org standards.

**Hard rules:** Do **not** change **legal/policy meaning** or **numeric claims** without `state-data.js` / source updates. **“Data as of …”** must match configured data. **No** Apple product names or implied affiliation in shipped copy.

**Apple-like / HIG-style UI (when stakeholders ask):** Implement with **`--hap-ui-*`** tokens in `hap-design-tokens.css` and **scope to `.dashboard`** in `340b.css` (system UI stack, hairline separators, `--hap-ui-card-shadow*`, calmer header/sidebar). **Apple Style Guide** remains the **editorial** reference for copy; **Human Interface Guidelines** inform **layout/typography/motion analogies** on 340B shells only—not a claim of Apple design compliance.

**Org voice:** If HAP comms prefers “we” for advocacy, follow **HAP** over generic “prefer you” advice—document the chosen default in release notes when it changes.

---

## Design lineage → product rules (internal)

Historical design/engineering names may appear **only in maintainer docs**, not in user-facing UI. Translate ideas into **actionable rules**:

| Idea | In this codebase |
|------|------------------|
| Functional minimalism | Less redundant framing; honest data + visible sources; density without clutter. |
| Restraint & hierarchy | One dominant idea per section; quiet surfaces; alignment and type rhythm over extra widgets. |
| Robust engineering | Failure isolation (map vs print vs share); validated hash state; no silent console failures on happy path. |
| Legible UI | Consistent legends/labels; avoid unexplained abbreviations; icons match mental models. |
| Device discipline | Validate on real narrow and landscape viewports, not only desktop resize. |

**Reviewer bar:** The page should feel **calm**, **legible**, and **trustworthy**—briefing software, not a loud marketing microsite.

---

## Blast radius

- **`340b.css`:** Broad selectors can affect **OW** pages; scope under `.dashboard` / `.hap-page-content` when tightening.
- **`hap-design-tokens.css`:** Suite-wide; coordinate with OW/index if changing semantic colors.
- **Print:** After layout changes, run `python3 dashboard-audit.py` and spot-check **Print / PDF**.
- **340b-BASIC:** IT-safe; no CDN. Shared token edits are OK; do not assume identical layout CSS.

---

## Verification

```bash
python3 dashboard-audit.py
```

Then: Print/PDF snapshot, quick pass on **hero + map + key findings + simulator + share** on a phone width and landscape, and legend/label clarity.
