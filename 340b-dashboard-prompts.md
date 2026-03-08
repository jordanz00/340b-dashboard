# 340B Advocacy Dashboard — Improvement Prompts

Use these prompts with Cursor or any AI assistant to systematically elevate the HAP 340B dashboard. Each prompt is self-contained and references the project context (340b.html, 340b.css, 340b.js).

---

## Master Prompt (Run First)

> **Context:** This is the HAP 340B Advocacy Dashboard — a single-page dashboard for lawmakers and hospital CEOs. It has an interactive US map (D3.js), state-by-state contract pharmacy protection data, KPI cards with count-up animations, and sections for Overview, HAP Position, Policy, and Community Benefit. Files: 340b.html, 340b.css, 340b.js.
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

> Add a filter/search for the state lists in the 340B dashboard. Allow users to filter by "protection" or "no protection," and optionally search by state name or abbreviation. Update the state-list-grid display dynamically. Keep the UI minimal (e.g., a small input and toggle) so it doesn’t clutter the dashboard. Implement in 340b.html and 340b.js.

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

### V03.3 Abbreviation-First State Controls

> Keep the state list compact and fast to scan by using abbreviation-only controls, but preserve full state names in accessible labels, tooltips, and the detail panel. Do not reintroduce long text labels into the visible list.

### V03.4 Accessible State Selection Semantics

> Treat the state list buttons as a first-class accessible control. Add clear `aria-pressed`, `aria-controls`, and selected-state behavior while keeping the map visually synchronized.

### V03.5 Hash-Driven Focus Flow

> Improve deep-link behavior so `#state-XX` links scroll the map into view and move focus to the selected state detail panel. Keep shared links useful, stable, and accessible.

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

> Add `aria-busy` and clearer loading-state semantics around the map container and fallback states so assistive technologies receive better progress feedback. Ensure busy state is cleared on both success and failure paths.

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

### V03.18 Print Dashboard Polish

> Improve the print layout so the map section, state detail, key metrics, and supporting content print as a cleaner dashboard with fewer awkward page breaks and a more report-like handoff for PDF export.

### V03.19 Plain-Language Error Copy

> Rewrite map failure and empty-state text so it feels calm, plain-language, and useful for executives rather than technical users. Remove stale references to search when search is not present in the UI.

### V03.20 Post-Refactor Verification Matrix

> Re-check print, share, state filters, map selection, hash deep-links, keyboard navigation, and fallback behavior after each major cleanup. Fix anything that regresses before finishing.

---

## Prompts v04

### V04.1 Canonical Share URL

> Refactor share behavior so it copies a canonical dashboard URL that keeps the selected `#state-XX` hash but strips unrelated query parameters and tracking noise. Keep the experience simple and understandable for non-technical users.

### V04.2 Deep-Link Scroll Reliability

> Ensure direct visits to `#state-XX` always scroll the map section into view before focusing the state detail panel. Avoid confusing jump behavior on load and on later hash changes.

### V04.3 Loading State Completion

> Finish the map loading lifecycle so `aria-busy`, skeleton visibility, fallback states, and ready states stay synchronized on first load, redraw, retry, and failure.

### V04.4 Selection Live Region

> Add a dedicated, concise live region that announces state selection changes in plain language for screen reader users without spamming repeated updates.

### V04.5 Executive Print Header

> Improve print/PDF output with a lightweight print-only header that includes the dashboard title, organization, and last-updated date while keeping the output clean and executive-friendly.

### V04.6 Print State Summary

> When a state is selected, make sure the print layout clearly preserves the selected state's summary so exported PDFs carry useful context instead of a generic map-only snapshot.

### V04.7 Privacy-Friendly Typography

> Remove unnecessary third-party font dependencies and shift the dashboard to a strong system-font stack so it loads faster, leaks less data, and remains visually polished.

### V04.8 Vendor Provenance Manifest

> Add a small vendor manifest or README inside `assets/vendor/` that records the source, version, purpose, and verification notes for local third-party assets and map data.

### V04.9 Hosting Security Guidance

> Document recommended static-host security headers such as CSP, Referrer-Policy, and Permissions-Policy so future deployments are safer even if those headers are not controlled inside the app code itself.

### V04.10 DOM Reference Cleanup

> Refactor `340b.js` so repeated DOM lookups are centralized in a small, beginner-friendly reference layer. Keep names obvious and avoid clever abstractions.

### V04.11 UI Copy Consistency Audit

> Audit the dashboard for stale or conflicting UI copy, especially references to removed features, outdated workflows, or wording that no longer matches the compact state-list experience.

### V04.12 Selection Summary Surface

> Add a compact summary surface near the map that tells users which state is selected and what its protection status is. Keep it visually quiet but immediately useful.

### V04.13 Map Color Token Unification

> Refactor map colors so the SVG render and CSS design tokens stay aligned. Avoid hardcoded color drift between `340b.css` and `340b.js`.

### V04.14 Error-State Design Pass

> Improve fallback and error-state styling so a failed map still looks intentional, readable, and professionally designed rather than like a broken widget.

### V04.15 Refactor by Responsibility

> Reorganize `340b.js` into clearer responsibility sections such as helpers, state/data utilities, rendering, interactions, accessibility, and initialization. Add short comments only where they reduce confusion.

### V04.16 Small-Screen Header Polish

> Revisit the sticky header on small screens and ensure it remains compact, readable, and easy to scroll past without crowding the hero content.

### V04.17 Map Resize Stability

> Further reduce redraw churn and visual jumping during resize so the map feels stable on desktop and does not re-render unnecessarily on small width changes.

### V04.18 Copyable Data Sources

> Improve the “About this data” section so the source links are easier to scan, copy, and verify. Preserve a clean layout while making the provenance of claims more obvious.

### V04.19 Empty-State Honesty Pass

> Audit every empty, loading, and fallback message in the dashboard and make sure each one is accurate about what the user can still do next.

### V04.20 Regression Checklist Refresh

> After the v04 pass, verify share, print, hash deep-links, selected-state sync, fallback mode, mobile layout, and keyboard navigation. Treat regressions as blockers.

---

## Prompts v05

### V05.1 Ruthless Complexity Audit

> Review the entire dashboard and identify code that feels “smart” rather than clear. Remove any abstraction, animation, or helper that does not clearly earn its existence for a staff of one novice maintainer.

### V05.2 Static-Site Threat Model

> Threat-model this dashboard as a static public-facing site. Identify realistic risks around framing, asset tampering, privacy leakage, stale data publication, misleading fallbacks, and unsafe future edits. Fix what you can in code and document what must be handled by hosting.

### V05.3 Trust-by-Design Pass

> Improve the dashboard so a skeptical executive can immediately trust what they are seeing. Tighten provenance, last-updated cues, source clarity, and selected-state clarity without cluttering the page.

### V05.4 Data Integrity Guardrails

> Strengthen data validation so malformed or incomplete state records are obvious during development. Prefer simple validation that a novice coder can understand and maintain.

### V05.5 Hardcoded-String Reduction

> Identify every user-facing string that changes over time and decide whether it belongs in config, content, or state data. Move the right values out of implementation code without overengineering.

### V05.6 Share-Flow Skepticism

> Assume the current share flow will be used in awkward environments and on locked-down machines. Make it more robust, predictable, and easy to explain when clipboard access fails.

### V05.7 Print-as-Product Mindset

> Treat PDF export as a first-class use case, not an afterthought. Make the printed dashboard feel like a deliberate one-pager rather than a webpage that happened to be printed.

### V05.8 Fallback Mode Quality Bar

> Critically review the dashboard without the interactive map. If the map failed completely, would the page still feel professional, usable, and accurate? Improve fallback behavior until the answer is yes.

### V05.9 Zero-Search Copy Cleanup

> Remove any stale UI text, prompt text, comments, or fallback copy that assumes state search still exists. Keep filters and selection language consistent with the actual interface.

### V05.10 Keyboard-Only Reality Check

> Navigate the dashboard mentally as a keyboard-only user and improve focus order, escape hatches, state selection feedback, and disclosure behavior anywhere it still feels awkward.

### V05.11 Screen-Reader Reality Check

> Review dynamic behaviors through a screen-reader lens. Ensure selected state changes, loading states, and fallback modes are announced clearly and not redundantly.

### V05.12 Motion Discipline Pass

> Challenge every animation and transition in the dashboard. Remove any motion that does not improve comprehension, and simplify the rest so the product feels premium rather than busy.

### V05.13 Browser Primitive Reduction

> Reduce reliance on fragile browser features where possible. Add sensible fallbacks for APIs like `IntersectionObserver`, printing, clipboard access, and smooth scrolling.

### V05.14 Security Header Integration Prompt

> Add the strongest browser-hardening signals that are safe to express inside a static HTML file, and document the rest for the hosting environment. Do not break the dashboard while hardening it.

### V05.15 Asset Provenance Verification

> Treat local vendor files as a supply-chain risk. Record where they came from, what version they are, and when they were last verified so future edits are safer.

### V05.16 Source-of-Truth Simplification

> Reduce duplication between HTML, CSS, JS, and config. Make it obvious where a novice editor should go to change metadata, dates, labels, and state-law values.

### V05.17 Executive Scan Test

> Optimize the page for a 20-second executive scan. Make the current state of the issue, the counts, and the call to action clearer without adding more prose.

### V05.18 Selected-State Persistence Review

> Critically assess whether selected-state behavior remains understandable during filtering, hash changes, reloads, and click-away clearing. Fix any interaction that feels surprising.

### V05.19 Filter Honesty Pass

> Ensure the filter controls never imply more capability than they actually provide. Labels, status text, and no-results messages should be precise and unambiguous.

### V05.20 Small-JS Footprint Goal

> Refactor `340b.js` with a bias toward fewer moving parts, fewer repeated conditions, and less repeated DOM work. Prefer simple functions over broad shared mutation.

### V05.21 Comment Quality Review

> Audit comments for quality. Delete obvious comments, keep the useful ones, and add only the minimum new guidance needed for a novice maintainer to follow the code.

### V05.22 Semantic HTML Challenge

> Review the dashboard markup and strengthen semantics where that improves accessibility or maintainability. Prefer meaningful HTML over extra ARIA when native elements already solve the problem.

### V05.23 Visual Token Discipline

> Reduce accidental visual inconsistency by tightening color, radius, spacing, and shadow usage around a smaller set of clearly named design tokens.

### V05.24 Error Language Stress Test

> Rewrite any error or fallback copy that sounds technical, vague, or apologetic. Make the language calm, specific, and action-oriented.

### V05.25 File-Open and Server-Open Behavior

> Consider how the dashboard behaves when opened directly from disk versus through a local server. Improve resilience where possible and document expectations where not.

### V05.26 Source Link Security Review

> Re-check all outbound links, metadata URLs, and image references for safety, relevance, and least-privilege behavior. Remove or harden anything unnecessary.

### V05.27 Maintenance-by-Novice Scenario

> Pretend a novice staff member must update this dashboard alone under time pressure. Simplify the files, labels, and editing flow until that task feels low-risk.

### V05.28 Regression Resistance Pass

> Add structure, comments, and helper boundaries that make future regressions less likely when someone changes labels, dates, sources, or state-law records.

### V05.29 Remove Implied Feature Debt

> Audit the dashboard for any copy, styles, or code that still hints at removed features like dark mode, presentation mode, or state search. Remove the leftovers completely.

### V05.30 Honest Final Reassessment

> Critique the dashboard as if it were going live tomorrow. List what still feels unfinished, fragile, or confusing, then implement the highest-value fixes rather than polishing the easiest details.

---

## Prompts v06

### V06.1 Annual Data Refresh Workflow

> Design a low-risk annual refresh workflow for dates, metadata, and state-law records so the dashboard can be updated quickly without breaking the map or print output.

### V06.2 Policy Change Intake Template

> Create a simple content-edit pattern for adding a newly enacted state law, including where to update status, notes, validation, and any visible explanatory text.

### V06.3 Editorial Consistency Pass

> Audit tone and terminology across the dashboard so policy language, legal trend summaries, and status labels stay consistent and professional.

### V06.4 Map Dependency Replacement Review

> Reassess whether the current map implementation is still the right trade-off for reliability, accessibility, and maintainability. Recommend changes only if they reduce complexity.

### V06.5 Source Citation Upgrade

> Explore a cleaner way to surface key sources and dates inline without crowding the UI or weakening the executive presentation.

### V06.6 Content Accuracy Double-Check

> Review the narrative claims, counts, and dates for internal consistency so the dashboard does not undermine trust through mismatched copy.

### V06.7 Novice Onboarding Note

> Add or improve a short onboarding note that tells a new maintainer which files matter most, which ones are vendor files, and which values they are expected to edit.

### V06.8 Portable Deployment Checklist

> Create a concise checklist for deploying this static dashboard to common hosts while preserving safe headers, asset paths, and print/share behavior.

### V06.9 Accessibility Regression Prompt

> Re-run a focused accessibility regression pass after any future visual redesign so keyboard flow, live regions, print output, and reduced-motion support do not quietly degrade.

### V06.10 Privacy Posture Review

> Reassess whether any external connections, fonts, images, or analytics remain necessary. Prefer a privacy-preserving default for advocacy and executive audiences.

### V06.11 Performance Budget Prompt

> Establish a lightweight performance budget for this dashboard so future visual additions do not quietly bloat the experience on older laptops or mobile devices.

### V06.12 Map QA Matrix

> Create a repeatable QA checklist specifically for map rendering, selection sync, fallback mode, and resize behavior so regressions are easier to catch.

### V06.13 Print QA Matrix

> Create a repeatable QA checklist for print and PDF export, including selected state context, page breaks, source visibility, and grayscale readability.

### V06.14 Content Governance Prompt

> Decide which values should always be config-driven and which should stay as page content so future edits do not scatter across too many files.

### V06.15 Vendor Update Policy

> Document when and how vendor assets should be updated, how to verify them, and how to record that verification for future maintainers.

### V06.16 Fallback Experience Review

> Reassess whether the dashboard still feels credible and useful when any one enhancement fails, such as map interactivity, clipboard access, or animation support.

### V06.17 Design Token Maturity Pass

> Continue reducing one-off visual decisions by consolidating spacing, shadow, and color usage into a more mature token set.

### V06.18 Documentation Gap Review

> Identify what a future maintainer would still have to guess. Fill the highest-value documentation gaps without turning the repo into a wall of prose.

### V06.19 Final Security Recheck

> Re-run a static security review after future content or asset changes, focusing on browser hardening, external dependencies, data integrity, and hidden-character issues.

### V06.20 Next-Wave Prioritization

> After completing the current prompt waves, identify the next 5 highest-value improvements and explain why they matter more than additional cosmetic polish.

---

## Prompts v07

### V07.1 Brutal First-Load Audit

> Review the dashboard as if a skeptical executive saw it for the first time on a slow laptop. Identify everything that feels fragile, confusing, visually noisy, or slow to understand in the first 10 seconds. Implement the highest-value fixes without reintroducing removed features.

### V07.2 Broken-Control Zero Tolerance

> Audit every button, filter, toggle, state interaction, and deep-link flow. If any control feels fake, delayed, or inconsistent, fix it so every interactive element has clear, real, observable behavior.

### V07.3 Map-Failure Isolation

> Refactor initialization so map failures can never break unrelated features like print, share, filters, disclosures, or selected-state clearing. Keep the code obvious for a novice maintainer.

### V07.4 Clipboard and Share Reliability

> Treat sharing as a reliability-critical feature. Improve the share flow so it works across mobile share sheets, clipboard-capable browsers, restricted browsers, and file-based viewing modes, with clear fallback feedback in each case.

### V07.5 Print Workflow Reality Check

> Audit the Print / PDF flow on modern browsers and make sure it feels like a real feature, not a hopeful call to `window.print()`. Improve messaging, fallback behavior, and print-specific layout cues where needed.

### V07.6 Disclosure Interaction Honesty

> Review the “About this data” disclosure critically. Make sure it always behaves like an obvious expandable region, with clear open/closed feedback and no ambiguity about what changed after activation.

### V07.7 Selection-State Robustness

> Stress-test selected-state behavior across map clicks, list clicks, clear selection, hash changes, filter changes, and reloads. Fix any behavior that feels stale, sticky, or surprising.

### V07.8 Spacing Discipline Audit

> Audit vertical rhythm, card padding, control spacing, and inter-section spacing across the page. Remove spacing that feels arbitrary and tighten anything that weakens hierarchy.

### V07.9 Typography Honesty Pass

> Reassess the current font stack, type scale, weight choices, and line lengths. Improve readability and premium feel without relying on remote fonts or decorative styling.

### V07.10 Alignment Precision Pass

> Audit the dashboard for subtle alignment issues across cards, buttons, legends, state lists, and footer elements. Fix anything that looks “almost aligned” but not deliberate.

### V07.11 Sizing Rationalization

> Review control sizes, text sizes, chip sizes, card radii, icon scales, and map proportions. Normalize the scale system so the dashboard feels intentional rather than patched together.

### V07.12 Color Consistency Audit

> Critically inspect the color system for drift between CSS tokens, SVG map colors, badges, utility buttons, and fallback states. Unify the palette so semantic meaning is stable everywhere.

### V07.13 Empty-State Quality Threshold

> Review every loading, empty, and fallback state. Rewrite or redesign anything that looks like a placeholder instead of a finished product.

### V07.14 Footer Credibility Pass

> Audit the footer critically. Make sure it reinforces trust, organization identity, and final navigation without feeling like an afterthought.

### V07.15 Copy Tightening for Executives

> Rewrite weak, repetitive, or bloated UI copy so the dashboard reads faster for executives. Keep the tone professional, assertive, and concise.

### V07.16 Legal-Trends Clarity Pass

> Review the “Recent legal trends” section for clarity, scannability, and authority. Improve the card structure and wording if any item feels too vague or too dense.

### V07.17 Beginner Maintainer Friction Audit

> Pretend a novice staff member must update the dashboard alone. Identify anything in the code or docs that would confuse them, then simplify or document it clearly.

### V07.18 Function-Boundary Refactor

> Reassess function boundaries in `340b.js`. Split functions that do too much, merge functions that are over-fragmented, and keep the final structure easier to follow than before.

### V07.19 DOM Lookup Efficiency Pass

> Audit repeated DOM work and event binding for unnecessary cost or complexity. Reduce repeated queries and fragile selector assumptions while keeping the code readable.

### V07.20 Resize and Reflow Audit

> Stress-test the layout during resize and responsive transitions. Remove avoidable redraws, jumping elements, or layout shifts that make the product feel unstable.

### V07.21 Accessibility Regression Challenge

> Re-check keyboard flow, focus visibility, live regions, disclosure semantics, print accessibility, and reduced-motion support. Fix anything that regressed during visual polish or refactors.

### V07.22 Security Assumption Audit

> Challenge every hidden assumption about safety in this static dashboard. Review browser hardening, dependency trust, data integrity, query/hash handling, and fallback behavior for weak spots.

### V07.23 Hidden Technical Debt Hunt

> Search for code, comments, copy, or styles that still reflect removed ideas like search, dark mode, presentation mode, or old toolbar patterns. Remove the leftovers completely.

### V07.24 Data Provenance Visibility

> Make it easier for a reader to trust where the dashboard’s claims come from. Improve the visibility, structure, and readability of data-source and update information without cluttering the UI.

### V07.25 State-List Scan Speed

> Critique the state list as a scanning tool. Improve grouping, density, legibility, hover/focus behavior, and selected-state clarity so it works better under time pressure.

### V07.26 Map Visual Honesty

> Review the map’s visual prominence versus its informational value. If the map looks more impressive than useful, improve the balance so the selection workflow is clearer and more honest.

### V07.27 Report-Ready Print Audit

> Audit printed output as if it will be forwarded to leadership as a PDF. Fix any orphaned sections, weak headings, missing context, or visual leftovers that reduce handoff quality.

### V07.28 Self-Check Hook

> Add or improve a simple, repeatable self-check routine for this dashboard: interaction checks, data checks, fallback checks, and print checks that a novice maintainer can follow every update.

### V07.29 Self-Audit Prompt Generator

> After completing the v07 pass, generate the next 10 highest-risk audit questions automatically based on remaining weak spots in the dashboard, not generic best practices.

### V07.30 Ruthless Release Review

> Evaluate the dashboard as if it must ship today. Name what still feels unfinished, fragile, misleading, or overdesigned, then implement the most important fixes rather than polishing easy details.

---

## Prompts v08

### V08.1 No-Excuses Reliability Pass

> Assume the dashboard will be opened in the least convenient environment possible: file mode, restricted clipboard, blocked features, slow machine, and narrow viewport. Improve resilience without bloating the codebase.

### V08.2 Control Feedback Perfection

> Review every interactive control and make sure the user always gets immediate feedback: visible, readable, and accurate. Eliminate “did that do anything?” moments entirely.

### V08.3 Novice-Only Ownership Test

> Assume a staff of one novice coder owns this dashboard for the next year. Simplify code structure, editing paths, config placement, and documentation until that ownership model feels realistic.

### V08.4 Copy Severity Audit

> Be brutally honest about weak content. Identify text that feels generic, soft, repetitive, or imprecise, and tighten it so every sentence earns its space.

### V08.5 Layout Tension Audit

> Review the dashboard for visual tension: cramped rows, awkward gaps, oversized islands of content, or controls that feel disconnected from nearby content. Resolve the worst tensions cleanly.

### V08.6 Hierarchy Truth Test

> Check whether the visual hierarchy truly matches the message hierarchy. If the page makes secondary ideas louder than primary ones, rebalance the design.

### V08.7 Utility Toolbar Re-Validation

> Reassess the page-tools area critically. Make sure it is discoverable, calm, and actually useful, not just another decorative control strip.

### V08.8 Detail Panel Decision Audit

> Evaluate whether the selected-state detail panel says the right things in the right order. Improve row order, labels, emphasis, and scan speed if any part feels bureaucratic instead of helpful.

### V08.9 State Selection Narrative

> Improve how the dashboard explains state selection to first-time users. Keep the guidance minimal, but make the interaction model unmistakable.

### V08.10 Microcopy Precision Pass

> Audit labels, helper text, status text, button text, and empty-state text for precision. Replace vague language with exact language that matches the actual feature behavior.

### V08.11 Semantic Markup Review

> Revisit semantic HTML and ensure the structure is helping, not fighting, accessibility and maintainability. Prefer cleaner native structure over extra complexity.

### V08.12 CSS Token Rationalization

> Audit the stylesheet for one-off values and unnecessary visual exceptions. Consolidate tokens where it improves consistency without turning the CSS into an abstraction puzzle.

### V08.13 Visual Noise Reduction

> Remove any decorative effect, border, shadow, or transition that makes the interface feel louder rather than clearer. Keep the end result more confident, not more plain.

### V08.14 Selection Clear-Path Audit

> Make sure the user always understands how to exit a selected state and return to the neutral view. Improve the clear-selection flow until it feels obvious and reliable.

### V08.15 Error Recovery Design

> Treat error recovery as a first-class UX problem. Improve retry states, fallback summaries, and plain-language recovery guidance so the page still feels competent under failure.

### V08.16 Hash-Link Contract

> Define and enforce a clear contract for `#state-XX` links: what should scroll, what should focus, what should update, and what should happen when the hash is invalid or removed.

### V08.17 Performance Budget Reality Check

> Audit the dashboard against a practical performance budget. If any styling, animation, or script pattern feels expensive for too little value, simplify it.

### V08.18 Vendor Asset Trust Audit

> Re-check local vendor assets and their documentation. Improve provenance notes, update rules, and verification guidance so dependency trust is explicit rather than assumed.

### V08.19 Static Hosting Hardening

> Improve the project’s guidance for static hosting hardening, including headers, file serving assumptions, share URL behavior, and privacy defaults. Keep the guidance actionable for a novice deployer.

### V08.20 Design Mark Integrity

> Audit visible versioning or design-mark labels in the interface and make sure they are intentional, current, and not misleading. Keep version labels aligned with the actual product state.

### V08.21 Content-Date Alignment

> Re-check every displayed date, freshness label, source note, and print header. Eliminate any mismatch that could reduce trust in the dashboard’s accuracy.

### V08.22 Source-Link UX Pass

> Make source links easier to verify, copy, and trust. Improve link wording and surrounding context without turning the data section into a wall of citations.

### V08.23 Interaction Isolation Refactor

> Refactor the code so each interaction system can fail independently without taking down unrelated features. Keep the failure boundaries clear in both code and comments.

### V08.24 Debuggability Upgrade

> Improve the codebase so future regressions are easier to diagnose. Add lightweight guardrails, clearer warnings, and better organization without adding noisy debug code.

### V08.25 Documentation Honesty Pass

> Review the project documentation for false confidence, stale instructions, and missing caveats. Make sure README and maintenance notes tell the truth about how the dashboard actually works.

### V08.26 Self-Checking Release Checklist

> Build a sharper release checklist that verifies controls, print, share, fallback mode, state selection, source visibility, and responsive behavior before any future push.

### V08.27 Self-Auditing Diff Review

> After each major edit, compare the intended behavior with the actual UI and code changes. If the diff shows drift, redundancy, or accidental complexity, clean it before considering the work done.

### V08.28 Automated Prompt Seed for v09

> Based on the current dashboard state, automatically generate the next 50 improvement prompt seeds for `v09`, grouped by reliability, design, content, accessibility, maintenance, and deployment risk.

### V08.29 Automated Prompt Seed for v10

> Based on the remaining unresolved weaknesses after `v09` planning, automatically generate another 50 prompt seeds for `v10` that are stricter, more skeptical, and more release-focused than earlier waves.

### V08.30 Meta-Governor Prompt

> Create a meta-process for future prompt waves so each new prompt set checks prior wins, avoids regressions, scores remaining weaknesses, and prioritizes work by user impact instead of novelty.

---

## Prompts v09

### V09.1 Print Snapshot Guarantee

> Guarantee that print preview and PDF export always capture the final rendered dashboard state, including final KPI values, visible map output, selected-state context, and fully revealed sections.

### V09.2 Blank-Page Elimination Pass

> Audit print output for blank pages caused by `content-visibility`, transforms, animations, fixed layers, or hidden overflow behavior. Remove every cause of missing printed content.

### V09.3 Animation-to-Print Contract

> Define a clear contract between animations and printing so count-up, scroll reveal, and map entrance motion can never leak partial states into print preview or PDF export.

### V09.4 Browser-Menu Print Support

> Make sure the dashboard prepares a clean final print state even when users open print from the browser menu instead of the on-page button.

### V09.5 Print QA as Product

> Treat print QA as a product requirement, not a final check. Add repeatable checks and code structure that make print regressions harder to introduce.

### V09.6 Init-Order Reliability Audit

> Review initialization order critically. Ensure optional enhancements like map rendering, scroll reveals, or observers can never block core controls from working.

### V09.7 Control Isolation Refactor

> Refactor interactive features so print, share, disclosure toggles, filters, and selection clearing remain operational even if the map or another subsystem fails.

### V09.8 Count-Up Stability Review

> Reassess count-up animation for correctness, maintainability, and print behavior. Keep the on-screen polish, but make the final value path obvious and reliable.

### V09.9 Map Render Finality Pass

> Ensure the map always has a stable final state for print, resize, fallback, and reduced-motion scenarios. Avoid animation classes or loading states lingering longer than they should.

### V09.10 Selection Summary Trust Pass

> Improve the selected-state summary so it is always current, useful in print, and understandable to a reader who sees the exported PDF without having used the interactive page.

### V09.11 Novice Comment Audit

> Reassess comments in the codebase and add explanations where a novice would otherwise have to reverse-engineer intent, especially around printing, sharing, map rendering, and init order.

### V09.12 Helper Naming Audit

> Critique helper and function names for clarity. Rename anything that sounds too generic, overloaded, or implementation-specific for a novice maintainer.

### V09.13 Release-Failure Prevention

> Identify the most likely ways a future edit could silently break printing, sharing, or state selection. Add small guardrails in code or documentation to prevent those failures.

### V09.14 Documentation-to-Code Sync

> Re-check README, maintainer notes, security notes, and QA guidance against actual behavior. Remove any stale instructions and close any missing gaps.

### V09.15 Plain-Language Status Messages

> Review status messages for print, share, selection, and fallback flows. Make them plain-language, immediate, and truthful about what just happened.

### V09.16 Empty-State and Neutral-State Alignment

> Ensure the neutral dashboard state, selected-state state, filtered states, and fallback states all feel like deliberate product states rather than leftovers from different revisions.

### V09.17 Reduced-Motion Finality

> Make reduced-motion behavior a first-class path, not an afterthought. Ensure it preserves the same information and print quality as the animated experience.

### V09.18 PDF Narrative Review

> Read the printed dashboard as a standalone document. Improve it until someone who never saw the live page can still understand the message and state context.

### V09.19 Self-Audit Expansion

> Expand the dashboard’s self-audit posture by documenting what must be checked after any layout, copy, or interaction change, with special attention to print and fallback behavior.

### V09.20 Final Professionalism Pass

> Review the dashboard one more time for the kinds of issues that make a polished project feel unfinished: awkward spacing, brittle controls, stale labels, fragile print output, or unclear maintenance ownership. Fix the highest-value problems.

---

## Prompts v10

### V10.1 Native Disclosure Simplification

> Replace custom disclosure behavior with native semantic HTML where it reduces fragility, accessibility debt, and maintenance burden without weakening the experience.

### V10.2 Hash Validation Contract

> Enforce a stricter contract for `#state-XX` links so invalid hashes never leave the dashboard in a confusing or fake selected state.

### V10.3 Share Fallback Hardening

> Improve share reliability for older or restricted browsers by adding a stronger copy fallback before dropping to a manual prompt.

### V10.4 Self-Audit Runner

> Add a lightweight built-in audit script that checks for the most likely regression sources in this static dashboard: unsafe DOM patterns, hidden characters, stale removed-feature copy, link hardening, and prompt-library drift.

### V10.5 Documentation-to-Audit Bridge

> Connect README, maintainer notes, QA guidance, and security notes to the actual self-audit workflow so future maintainers do not have to guess what to run.

### V10.6 Empty-State Copy Honesty

> Remove the last traces of stale or mismatched empty-state wording so every status line matches the current product exactly.

### V10.7 Prompt Library Reality Check

> Reassess the prompt library and remove drift between what the prompts ask for and what the project can realistically support as a static dashboard.

### V10.8 Print-First Reliability Recheck

> Re-run the print path critically after the latest fixes. Make sure the exported document still reflects the final visual state and does not regress under browser-menu printing.

### V10.9 Interactive-Failure Boundaries

> Tighten failure boundaries again so map, share, print, filters, and disclosure behavior degrade independently and predictably.

### V10.10 Comment-Where-It-Helps Pass

> Add only the comments that save a novice maintainer time on the hardest-to-understand flows: init order, print prep, hash syncing, and share fallback logic.

### V10.11 Prompt-to-Code Traceability

> Make it easier to explain which prompt waves drove which implementation changes, so the prompt library becomes a usable maintenance artifact rather than just a long idea list.

### V10.12 Reduced-Motion Trust Pass

> Ensure the reduced-motion path still communicates the full product clearly without relying on animation timing or reveal choreography.

### V10.13 File-Mode Reliability Pass

> Re-check behavior when the dashboard is opened directly from disk or in a constrained environment. Prefer resilience and truthfulness over fragile enhancement.

### V10.14 Link-Safety Regression Pass

> Re-check all user-facing outbound links and keep the browser-safety defaults explicit and consistent.

### V10.15 Source Credibility Surface

> Improve how the dashboard presents data provenance so the source section reads like a credibility layer, not a footnote afterthought.

### V10.16 Tooling Without Bloat

> Add small, practical maintainer tooling only where it reduces risk. Avoid turning a simple static dashboard into a pseudo-build system.

### V10.17 False-Automation Audit

> Challenge any claim that the dashboard is “self-maintaining” or “no babysitting required.” Replace hype with small, real automation that actually reduces maintenance effort.

### V10.18 Copy-and-Behavior Alignment

> Re-check whether button labels, status text, empty states, and section labels still match what the features actually do.

### V10.19 Risk-Based Release Flow

> Refactor release guidance so the highest-risk flows get checked first: print, share, map render, hash selection, and source credibility.

### V10.20 Next-Wave Prompt Discipline

> Generate the next prompt wave from actual unresolved weaknesses, not from novelty, repetition, or abstract perfection language.

---

## Prompts v11

### V11.1 Audit Output Clarity

> Improve the audit runner output so a novice maintainer can immediately tell what passed, what failed, and what to inspect next.

### V11.2 Hash-Recovery UX

> Reassess how the dashboard recovers from invalid or removed hash states so the neutral state feels deliberate and stable.

### V11.3 Disclosure Semantics Recheck

> Confirm the “About this data” section remains clear, accessible, and easy to maintain now that it relies on native disclosure semantics.

### V11.4 Self-Check Coverage Review

> Review what the automated audit still does not catch and document the remaining manual checks honestly instead of implying full automation.

### V11.5 Source-Link Maintenance Pass

> Improve source-link wording and maintenance guidance so future editors know which citations matter most and where to verify them.

### V11.6 Prompt Library Compression Audit

> Reduce prompt redundancy where multiple waves repeat the same idea with different phrasing. Keep the library more actionable and less bloated.

### V11.7 Print-Narrative Credibility Pass

> Re-read the printed dashboard as a board-ready document and improve any remaining weak transitions, headings, or context gaps.

### V11.8 Maintainer Workflow Tightening

> Tighten the sequence a novice maintainer should follow after editing: update content, run audit, run QA checklist, then publish.

### V11.9 Realistic Cybersecurity Posture

> Keep improving the dashboard’s security posture through static-site hardening, dependency trust, link safety, and safe DOM patterns without implying impossible self-defense capabilities.

### V11.10 Honest Perfection Challenge

> Critique the phrase “perfect project” itself. Replace perfection theater with a disciplined loop of reliability, auditability, readability, and incremental improvement.

---

## Prompts v12

### V12.1 Automated Improvement Seed

> Re-run the audit script and generate the next improvement only from what the script misses or what manual QA still catches.

### V12.2 Prompt Drift Detector Seed

> Compare the newest prompt waves against the codebase and remove or rewrite prompts that no longer describe real weaknesses.

### V12.3 Dependency Trust Seed

> Re-check local vendor assets, their provenance notes, and update rules. Improve only if trust or clarity still feels weak.

### V12.4 Print Regression Seed

> Stress-test future layout changes against print preview first so export quality remains a release gate, not an afterthought.

### V12.5 Share-Path Seed

> Re-check native share, clipboard, textarea-copy fallback, and prompt fallback after future changes to ensure every environment still gets a truthful result.

### V12.6 Hash-State Seed

> Treat hash-driven state as a contract. Re-test invalid, removed, pasted, and refreshed hashes after every major interaction change.

### V12.7 Novice-Handoff Seed

> Hand the repo to a hypothetical first-time maintainer and ask what they would still find confusing. Fix the highest-friction item only.

### V12.8 Source-Credibility Seed

> Reassess whether the current source/date presentation is still strong enough for an executive or policymaker audience.

### V12.9 Security-Truthfulness Seed

> Challenge whether the code and docs are still honest about the limits of static-site security and automation.

### V12.10 Release-Gate Seed

> Promote the most failure-prone checks into permanent release gates and remove low-value ritual from the checklist.

---

## Prompts v13

### V13.1 Audit-Scope Expansion Seed

> Expand the audit runner only if a newly recurring regression justifies automation. Keep the tool small, obvious, and reliable.

### V13.2 Print-Reader Seed

> Improve the dashboard for someone who only ever sees the PDF. Add context only if it raises comprehension more than clutter.

### V13.3 Selection-Flow Seed

> Re-check whether first-time users instantly understand how to select a state, clear a state, and interpret the selection summary.

### V13.4 Reduced-Motion Seed

> Re-audit the reduced-motion path and confirm it preserves clarity, hierarchy, and final-state correctness.

### V13.5 Copy-Precision Seed

> Remove the next most vague sentence in the interface or docs. Prefer exact language over ornamental or generic phrasing.

### V13.6 Documentation-Honesty Seed

> Re-read the docs with a skeptical maintainer mindset and tighten anything that overpromises simplicity or automation.

### V13.7 Security-Hygiene Seed

> Keep re-checking the boring but high-value security basics: safe DOM APIs, trusted local assets, strict link handling, and clean source text.

### V13.8 Prompt-Priority Seed

> Score future prompt ideas by user impact and regression risk before adding them. Avoid adding waves that are longer than they are useful.

### V13.9 Stability-over-Novelty Seed

> Prefer improvements that make the existing dashboard more reliable, maintainable, and credible over new decorative ideas.

### V13.10 Continuous Improvement Seed

> Treat future changes as part of a loop: inspect real weaknesses, improve the code, update the docs, update the checklist, then generate the next prompt seeds.
