# Lessons -- 340B dashboard

Patterns to avoid repeating:

- **Single padding layer:** On mobile, `.dashboard-inner` is the ONLY element with horizontal padding. `main`, `#pdf-capture-root`, `.dashboard-grid` must have `padding-left: 0; padding-right: 0`. Double padding consumed ~80px on a 390px phone.
- **Single overflow clip:** `body:has(> .dashboard)` applies `overflow-x: clip`. No other element should set `overflow-x: hidden` or `clip`.
- **Cascade order matters:** Narrower breakpoints (<=480px) must come AFTER wider ones (<=768px) in the file, or the wider rule wins by source order. A <=768px block at line 7324 was killing the <=480px `.kpi-value` sizing.
- **No font-size below 10px:** iOS Safari auto-zooms text below ~10px. The map legend was set to 0.52rem (8.32px) which triggered unwanted zoom. Floor all text at `0.625rem` (10px); prefer `var(--text-xs)` (11px) for labels.
- **Spacing tokens must step DOWN on smaller screens:** `--dash-section-y` and `--dash-card-pad` were accidentally inverted (more space on mobile than desktop). Desktop: generous. Tablet: moderate. Phone: compact.
- **Grid gap increases when stacked:** `--dash-grid-gap` was static at 0.75rem. When cards stack vertically on mobile, they need more gap (1rem) to visually separate.
- **Touch target 44px minimum:** `.pa-district-legend__chip` was reduced to 40px at <=600px. All interactive elements must stay >= 44px per Apple HIG.
- **Touch device guards on ALL maps:** The PA district map was missing `hoverCapable` checks and `@media (hover: none)` tooltip hiding. The US map had these. Both maps must follow the same pattern.
- **No `!important` on broad selectors:** `[class*="stat-card"] { grid-template-columns: 1fr !important }` matched too many elements and blocked tablet 2-column layouts. Use specific class selectors.
- **Prose max-width 65ch:** On iPad (736px content), card text ran 87-92 characters per line. Added `max-width: 65ch` for optimal readability.
- **Map legends stay horizontal on mobile:** Stacking legend items vertically made the legend look "huge." Keep them as a compact horizontal-wrap pill.
- **preserveAspectRatio on all SVG maps:** The PA district SVG was missing the explicit attribute (relied on browser default).
- **prefers-reduced-motion:** Map container `.map-wrap` reveal animation was not suppressed for reduced-motion users.
