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

## Prompts v02

### V02.1 Utility Toolbar Relocation

> Remove print/share actions from the main navigation and place them in a dedicated page tools or accessibility-style toolbar that is easier to discover and use. Keep the top navigation focused on section navigation only. Update `340b.html` and `340b.css`.

### V02.2 Remove Dark Mode

> Remove dark mode entirely from the 340B dashboard, including UI controls, JS state, local storage usage, and CSS selectors. Ensure no dead code remains. Update `340b.html`, `340b.css`, and `340b.js`.

### V02.3 Remove Presentation Mode

> Remove presentation mode entirely from the 340B dashboard. Delete the UI, styles, and JS behavior so the codebase is simpler and easier to maintain. Update `340b.html`, `340b.css`, and `340b.js`.

### V02.4 Safer State Detail Rendering

> Refactor the state detail panel so it uses DOM APIs (`createElement`, `textContent`, `appendChild`) instead of string-based `innerHTML`. Keep the same visible output. Update `340b.js`.

### V02.5 Safer Tooltip Rendering

> Refactor both map and state-list tooltips to avoid string-based HTML generation. Use safe DOM node creation and text insertion for all tooltip content. Update `340b.js`.

### V02.6 Simpler Button Feedback

> Improve print/share feedback with clear temporary status text (for example: “Copying link...”, “Link copied.”, “Opening print dialog...”). Keep the UI compact and non-intrusive. Update `340b.html`, `340b.css`, and `340b.js`.

### V02.7 Filter Status Messaging

> Add live feedback below the state filters so users know how many states match the current search or filter. Keep the message short and accessible. Update `340b.html`, `340b.css`, and `340b.js`.

### V02.8 Map Fallback Summary

> If the map cannot load, show a readable fallback summary list of states and whether each has contract pharmacy protection. Keep the rest of the page usable. Update `340b.js` and `340b.css`.

### V02.9 Content Security Policy

> Add a reasonable Content Security Policy for this static dashboard that still allows local files, fonts, D3/TopoJSON CDN assets, images, and optional analytics. Update `340b.html`.

### V02.10 External Link Hardening

> Audit all external links that open in a new tab and ensure they use `rel=\"noopener noreferrer\"`. Update `340b.html`.

### V02.11 Beginner-Friendly JS Structure

> Refactor `340b.js` into simpler sections with beginner-friendly helper functions such as `createElement`, `clearElement`, `selectState`, and `renderStateDetail`. Add lightweight comments that explain responsibility boundaries.

### V02.12 Shared App State

> Use a small shared `appState` object in `340b.js` to manage selected state, active filter, search query, and map resize state. Keep names descriptive and easy to edit.

### V02.13 Remove Dead Selectors

> Delete CSS selectors and media queries that no longer apply after toolbar cleanup and removal of old actions. Keep the stylesheet easier to scan and maintain. Update `340b.css`.

### V02.14 Accessible Action Targets

> Ensure print/share controls meet accessible touch-target sizing and have clear focus styles. Keep them easy to use on mobile. Update `340b.css`.

### V02.15 Config-Driven Page Text

> Continue moving editable values to config-driven rendering where it improves maintainability, especially dates and page title text. Update `state-data.js` and `340b.js` if needed.

### V02.16 Cleaner Error Messaging

> Improve error messaging tone for map failures so it is plain-language, calm, and useful for non-technical users. Keep the retry action obvious. Update `340b.js` and `340b.css`.

### V02.17 ASCII Cleanup Pass

> Normalize newly edited code and UI copy to ASCII where practical, especially placeholders, status text, and helper comments. Avoid introducing hidden or decorative Unicode characters in code paths.

### V02.18 Security Review Prompt

> Audit the 340B dashboard for avoidable security risks such as raw HTML injection, unnecessary storage usage, unsafe external links, or over-permissive dynamic behavior. Fix what you find while keeping the app static and simple.

### V02.19 Hidden Character Audit

> Check the dashboard source files for invisible Unicode characters such as zero-width spaces, byte order marks in the middle of files, or other hidden control characters. Remove them if found.

### V02.20 Post-Refactor Verification

> After the cleanup, verify that print, share, state selection, filters, keyboard navigation, and map fallback behavior still work. If any of these regress, fix them before finishing.

---

## Usage Tips

1. **Run the Master Prompt first** to get a prioritized plan.
2. **Apply prompts in order** within each category (Design → Functionality → Interactivity → etc.) for coherent improvements.
3. **Re-run M1–M4** periodically to catch regressions and find new polish opportunities.
4. **Combine prompts** when it makes sense (e.g., D2 + I1 for card polish and micro-interactions).

---

## Prompts v03

### V03.1 Localize Map Dependencies

> Move the map libraries and U.S. atlas data to local project assets so the dashboard remains resilient when CDNs or restricted networks are unavailable. Update `340b.html`, `state-data.js`, and any related loading logic.

### V03.2 Redraw Lifecycle Cleanup

> Refactor the map redraw flow so resize events and map visibility observers do not attach duplicate listeners or observers after repeated redraws. Keep `340b.js` easier to reason about.

### V03.3 Name-First State Controls

> Replace abbreviation-only state chips with more readable state controls that show full state names plus abbreviations. Sort them by full name for faster scanning by executive audiences.

### V03.4 Accessible State Selection Semantics

> Treat the state list buttons as a first-class accessible control. Add clear `aria-pressed`, `aria-controls`, and selected-state behavior while keeping the map visually synchronized.

### V03.5 Hash-Driven Focus Flow

> Improve deep-link behavior so `#state-XX` links scroll the map into view and move focus to the selected state detail panel. Keep shared links useful and accessible.

### V03.6 Viewport-Safe Tooltips

> Clamp map and chip tooltips so they stay inside the viewport. Keep them supplemental only and avoid hover-only overflow issues near screen edges.

### V03.7 Touch-Friendly Tooltip Behavior

> Disable hover tooltips on touch devices and rely on the detail panel instead, so important information is not tied to hover behavior that does not translate to mobile.

### V03.8 Better Filter Empty States

> Add clearer filter feedback with a no-results message and hide empty protection/no-protection groups when current filters remove all items from a section.

### V03.9 Structured State Detail Panel

> Reformat the selected state detail panel into a faster-scanning structure with labeled rows for contract pharmacy status, PBM status, law year, and notes. Keep it readable for non-technical audiences.

### V03.10 Config-Driven Metadata

> Move more page metadata into the config layer, including page description and social title/description values. Use `state-data.js` as the single source of truth where practical.

### V03.11 State Data Validation

> Add a lightweight validation pass that warns in the console when state records are missing expected keys like `cp`, `pbm`, `y`, or `notes`. Keep it non-blocking and beginner-friendly.

### V03.12 Loading Semantics Upgrade

> Add `aria-busy` and clearer loading-state semantics around the map container and fallback states so assistive technologies receive better progress feedback.

### V03.13 Disclosure Semantics

> Improve the “About this data” toggle with `aria-controls`, stronger open/closed states, and clearer disclosure semantics in both HTML and CSS.

### V03.14 Nav Location Semantics

> Add `aria-current` and more reliable current-section updates in the sticky navigation so screen readers and keyboard users know where they are in the page.

### V03.15 Stronger Share Fallback

> Improve share behavior so clipboard failures fall back to a predictable, user-readable option such as a copy prompt. Keep status messages clear and temporary.

### V03.16 Progressive Enhancement Notice

> Add a concise `noscript` message so users understand which features require JavaScript while still being able to read the core policy content.

### V03.17 CSS Debt Cleanup

> Remove unused CSS blocks and stale selectors left behind from earlier experiments so the stylesheet is easier for a beginner to scan and edit.

### V03.18 Print Briefing Polish

> Improve the print layout so the map section, state detail, key metrics, and supporting content print as a cleaner briefing with fewer awkward page breaks.

### V03.19 Plain-Language Error Copy

> Rewrite map failure and empty-state text so it feels calm, plain-language, and useful for executives rather than technical users.

### V03.20 Post-Refactor Verification Matrix

> Re-check print, share, state filters, map selection, hash deep-links, keyboard navigation, and fallback behavior after each major cleanup. Fix anything that regresses before finishing.
