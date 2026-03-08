# 340B Advocacy Dashboard — Improvement Prompts

Use these prompts with Cursor or any AI assistant to systematically elevate the HAP 340B dashboard. Each prompt is self-contained and references the project context (340b.html, 340b.css, 340b.js).

---

## Master Prompt (Run First)

> **Context:** This is the HAP 340B Advocacy Dashboard — a single-page briefing for lawmakers and hospital CEOs. It has an interactive US map (D3.js), state-by-state contract pharmacy protection data, KPI cards with count-up animations, and sections for Overview, HAP Position, Policy, and Community Benefit. Files: 340b.html, 340b.css, 340b.js.
>
> **Task:** Audit the entire project and produce a prioritized improvement plan covering: (1) visual design and hierarchy, (2) interactivity and micro-interactions, (3) performance and smoothness, (4) accessibility and WCAG compliance, (5) presentation mode and print output, (6) data operations and maintainability. For each area, list 2–3 concrete, actionable improvements with file/line references where possible. Output as a structured markdown checklist I can work through.

---

## Design

### D1. Visual hierarchy and typography

> Improve the visual hierarchy of the 340B dashboard so key messages (72 PA hospitals, $7.95B community benefits, contract pharmacy protection) stand out more for busy executives. Refine typography scale, contrast, and spacing in 340b.css. Ensure the hero map section and KPI strip feel like the primary focal points. Keep the HAP brand colors (primary #0066a1, accent #e87500) and professional tone.

### D2. Card and component polish

> Polish the card components (Overview, HAP Position, Eligibility, Oversight, etc.) in the 340B dashboard. Add subtle depth, better hover states, and consistent icon treatment. Improve the benefit-grid and community-benefit-hero so they feel more cohesive. Ensure cards have clear visual separation and a refined, executive-ready aesthetic. Do not change the content or structure, only styling in 340b.css.

### D3. Map visual design

> Improve the visual design of the US map in the 340B dashboard. Enhance the protection vs. no-protection color contrast for clarity. Add a subtle gradient or depth to state fills. Improve the map legend and state-detail-panel styling so they feel integrated with the rest of the dashboard. Consider a light border or shadow treatment for the map container. Update 340b.css and any inline D3 styling in 340b.js if needed.

### D4. Dark mode refinement

> Refine the dark mode for the 340B dashboard. Ensure all sections (map, KPI cards, benefit grid, state lists, trends) have proper contrast and readability. Fix any elements that look broken or low-contrast in dark mode. Add smooth transitions when toggling dark mode. Update 340b.css for .dashboard.dark-mode and related selectors.

---

## Functionality

### F1. State chip → map sync

> Add two-way sync between state chips and the map in the 340B dashboard. When a user clicks a state chip in the state-lists-wrap, highlight that state on the map and populate the state-detail-panel with the same info. When a state is selected on the map, visually highlight the corresponding chip in the state list. Implement in 340b.js, using existing STATE_340B and state-chip elements.

### F2. Filter and search states

> Add a filter/search for the state lists in the 340B dashboard. Allow users to filter by "protection" or "no protection," and optionally search by state name or abbreviation. Update the state-list-grid display dynamically. Keep the UI minimal (e.g., a small input and toggle) so it doesn’t clutter the briefing. Implement in 340b.html and 340b.js.

### F3. Keyboard navigation for map

> Add full keyboard navigation for the US map in the 340B dashboard. Users should be able to Tab through states, press Enter/Space to select, and use Arrow keys to move between adjacent states. Ensure focus indicators are visible and the state-detail-panel updates on selection. Implement in 340b.js, preserving existing mouse/touch behavior.

### F4. URL hash for state selection

> Add URL hash support for the 340B dashboard map. When a state is selected (e.g., PA), update the URL to #state-PA. On load, if the URL contains #state-XX, automatically select that state on the map and scroll to the map section. Implement in 340b.js using the History API or location.hash.

---

## Interactivity

### I1. Micro-interactions and feedback

> Add subtle micro-interactions to the 340B dashboard: (1) KPI cards — light scale or glow on hover, (2) state chips — brief pulse or color shift on hover/click, (3) nav links — smooth underline or indicator on active, (4) buttons (Print, Present, Dark) — clear pressed/active feedback. Use CSS transitions and, if needed, minimal JS. Respect prefers-reduced-motion.

### I2. Map hover and click feedback

> Improve map interaction feedback in the 340B dashboard. On hover, add a subtle scale or stroke highlight to the state. On click, add a brief "selected" state (e.g., ring or border) that persists until another state or area is clicked. Ensure the map-tooltip follows the cursor smoothly. Update 340b.js and 340b.css.

### I3. Scroll-triggered reveals

> Add gentle scroll-triggered reveal animations to sections (intro cards, KPI strip, benefit grid, trends) in the 340B dashboard. Elements should fade in and translate up slightly as they enter the viewport. Use IntersectionObserver. Respect prefers-reduced-motion and disable animations when set. Implement in 340b.js, with styles in 340b.css.

### I4. Count-up enhancement

> Enhance the count-up animation in the 340B dashboard. Use a smoother easing curve and consider a slight overshoot for a more polished feel. Ensure decimals (e.g., 7.95) animate correctly. Add an optional subtle suffix fade-in. Keep the existing IntersectionObserver trigger. Update 340b.js.

---

## Smoothness & Performance

### S1. Map load and render performance

> Optimize the map load and render in the 340B dashboard. Ensure the loading skeleton shows until the map is fully drawn. Consider lazy-loading the D3/topojson scripts or the map data. Reduce layout thrashing when the map renders. Ensure the domino animation doesn’t cause jank. Profile and fix any performance bottlenecks in 340b.js.

### S2. Scroll and layout smoothness

> Improve scroll and layout smoothness in the 340B dashboard. Add will-change or contain hints only where beneficial. Ensure the sticky header doesn’t cause layout shifts. Fix any content jumping when the map loads or when sections animate. Use content-visibility for below-the-fold sections if supported. Update 340b.css and 340b.js.

### S3. Reduced motion and accessibility

> Audit and improve reduced-motion support in the 340B dashboard. Ensure all animations (count-up, domino, hover transforms, scroll reveals) are disabled or simplified when prefers-reduced-motion: reduce. Add a user preference toggle if appropriate. Verify with @media (prefers-reduced-motion: reduce) in 340b.css and 340b.js.

---

## Operations & Maintainability

### O1. Data source abstraction

> Refactor the 340B dashboard so state data (STATE_340B, STATES_WITH_PROTECTION) lives in a single, easy-to-update source. Consider a small JSON file (e.g., state-data.json) or a data module at the top of 340b.js. Add a brief comment or README note on how to update state law data when new laws pass. Keep the current structure otherwise.

### O2. Configuration object

> Add a central config object at the top of 340b.js for: dashboard title, data freshness date, CDN URLs, map dimensions, animation durations. Update 340b.html and 340b.js to use these values instead of hardcoding. This makes future updates (e.g., "March 2026") easier.

### O3. Error handling and fallbacks

> Improve error handling in the 340B dashboard. If the map fails to load, show a clear message with a retry button. If D3/topojson fail, show a static fallback (e.g., a simple list or table of states). Ensure the rest of the page remains usable. Add a console warning (not error) for non-critical issues. Update 340b.js.

---

## Presentation & Print

### P1. Presentation mode enhancements

> Enhance presentation mode in the 340B dashboard. Add subtle slide transitions when scrolling between sections. Ensure the map and KPI strip are prominent. Consider a "focus mode" that dims non-active sections. Improve the exit button visibility and keyboard shortcut (Escape). Update 340b.css and 340b.js.

### P2. Print and PDF optimization

> Optimize print and PDF output for the 340B dashboard. Ensure the map renders at good resolution. Add page-break hints so sections don’t split awkwardly. Include a print header/footer with title and date. Ensure colors and contrast work in grayscale. Update @media print in 340b.css.

### P3. Share and export

> Add a "Copy link" or "Share" action that copies the current URL (including state hash if applicable) to the clipboard. Optionally add a "Download as PDF" that triggers the browser print dialog with print-optimized settings. Implement in 340b.js and add a small button in the nav or footer.

---

## Self-Improvement (Meta Prompts)

### M1. Iterative design pass

> Using the 340B dashboard (340b.html, 340b.css, 340b.js), run a design pass: (1) List every interactive element and verify it has clear hover/focus/active states. (2) List every section and verify visual hierarchy (what should be seen first, second, third). (3) Propose 3 specific CSS changes to improve clarity and polish. Implement the changes.

### M2. Accessibility audit

> Perform an accessibility audit of the 340B dashboard. Check: (1) color contrast (WCAG AA), (2) focus indicators, (3) ARIA labels and roles, (4) keyboard operability, (5) screen reader flow. Fix any issues found in 340b.html, 340b.css, and 340b.js. Add or improve aria-live for dynamic content (state panel, tooltips).

### M3. Cross-browser and device check

> Review the 340B dashboard for cross-browser and device compatibility. Ensure: (1) map works on Safari (iOS and desktop), (2) sticky header works on mobile, (3) touch targets are at least 44×44px, (4) no horizontal scroll on narrow viewports. Add any needed -webkit prefixes or fallbacks in 340b.css and 340b.js.

### M4. Next-level polish

> Take the 340B dashboard to the next level. Identify the 5 highest-impact improvements across design, interactivity, and UX. Implement them without changing the core content or data. Prioritize changes that a CEO or lawmaker would notice in a 30-second scan.

---

## Usage Tips

1. **Run the Master Prompt first** to get a prioritized plan.
2. **Apply prompts in order** within each category (Design → Functionality → Interactivity → etc.) for coherent improvements.
3. **Re-run M1–M4** periodically to catch regressions and find new polish opportunities.
4. **Combine prompts** when it makes sense (e.g., D2 + I1 for card polish and micro-interactions).
