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

---

## Prompts v14

### V14.1 Print Intro Preservation Pass

> Treat the first screen of the live dashboard as mandatory print content. Ensure the print/PDF output always includes the `Overview`, `What is 340B?`, `HAP Position`, and `HAP asks lawmakers` content even if layout, animation, grid behavior, or browser print rendering changes later.

### V14.2 PDF-Only Executive Reader Pass

> Re-read the exported PDF as if the audience never uses the interactive dashboard. Improve the printed narrative so a lawmaker, hospital CEO, or administrator can understand the issue, the policy position, and the data credibility without needing hover states, animation, or live interactions.

### V14.3 Print Source Credibility Pass

> Make sure the printed version still surfaces data provenance and recency. Preserve a compact “About this data” summary, key sources, and a clear last-updated marker in print without cluttering the live experience.

### V14.4 Release-Gate Tightening Pass

> Promote the most failure-prone dashboard checks into explicit release gates: print intro presence, final KPI numbers, visible map, share-link truthfulness, and audit success. Remove vague checklist items that do not catch regressions.

### V14.5 Novice Print Debugging Pass

> Refactor print-related code and docs so a first-time maintainer can answer three questions quickly: where print preparation happens, how final metric values are forced, and how to verify that the PDF reflects the live dashboard’s final state.

### V14.6 Policy Audience Copy Precision Pass

> Rework any sentence that sounds generic, promotional, or imprecise for policymakers and hospital leadership. Prefer exact statements about what 340B does, what HAP supports, and what lawmakers are being asked to protect.

### V14.7 Layout Resilience Pass

> Reduce dependence on fragile live-layout assumptions for printed output. Where a browser print engine might drop, reorder, or clip content, add a more explicit print-safe structure instead of hoping the interactive layout survives.

### V14.8 Audit Truthfulness Pass

> Keep the audit tool honest. Only automate checks that are small, reliable, and understandable by a novice. If a quality check still requires human judgment, document it clearly instead of pretending the script covers it.

### V14.9 Prompt Specificity Pass

> Make future prompt waves more concrete: each prompt should name the exact surface being improved, the target audience affected, the failure mode being prevented, and the limit that should not be crossed.

### V14.10 Stability-First Optimization Pass

> Favor improvements that make the existing dashboard more robust, maintainable, and production-safe over decorative churn. Optimization should improve reliability, clarity, or maintainability, not just novelty.

---

## Prompts v15

### V15.1 Executive Summary Continuity Pass

> Ensure the dashboard tells the same story in three modes: live screen, shared link, and printed PDF. The core message should remain intact across all three even when interactive affordances disappear.

### V15.2 Print Regression Checklist Pass

> Expand the QA checklist so a maintainer can quickly catch print regressions in the exact places they are most likely to occur: opening summary, state selection context, map rendering, final values, data recency, and blank-page failures.

### V15.3 Security-and-Reliability Handoff Pass

> Tighten the handoff docs so a novice maintainer understands which changes are “high risk” in this static site: DOM rendering, share logic, URL hash state, print preparation, external links, and vendor assets.

### V15.4 Print Code Comment Pass

> Add or improve comments only where they materially help a novice understand print preparation, final-state rendering, and why the code avoids relying on in-progress animations during export.

### V15.5 Context-for-Lawmakers Pass

> Reassess the dashboard’s framing for a policymaker audience. The copy should clarify what the program is, why contract pharmacy access matters, and what action HAP is asking lawmakers to protect, without drifting into vague advocacy slogans.

### V15.6 Context-for-Hospital-Leaders Pass

> Reassess the dashboard’s framing for CEOs, administrators, and strategy leaders. Make sure the PDF communicates operational stakes, patient-access implications, and data reliability with minimal jargon.

### V15.7 Local-Only Trust Pass

> Reconfirm that the dashboard stays self-contained and deployment-friendly for corporate or nonprofit environments: local assets, safe DOM APIs, narrow input handling, and no unnecessary remote dependencies.

### V15.8 Prompt-to-Outcome Pass

> Before adding another wave, identify which prompts actually produced meaningful code, UX, documentation, or security improvements. Prefer prompts that lead to real outcomes over abstract self-improvement language.

### V15.9 Small-System Discipline Pass

> Keep the project small enough for one novice maintainer. When adding resilience, prefer straightforward structure, obvious naming, and low-complexity checks over layered abstractions.

### V15.10 Honest Optimization Pass

> Define optimization as a balance of readability, reliability, security basics, print fidelity, and audience clarity. Reject “optimized” changes that make the project harder to understand or easier to break.

---

## Prompts v16

### V16.1 Print Page Count Gate

> Treat PDF length as a release signal. Reduce page count only through print-specific density improvements, layout cleanup, and lower-value summary compression, never by dropping core policy context or hiding important evidence.

### V16.2 Compact State Summary Pass

> Keep the interactive state lists rich on screen, but make the printed state-law summary compact enough to support executive reading. Prefer a concise print-only summary over printing every interactive chip at full UI size.

### V16.3 Print Default State Trust Pass

> Re-check the print-only default state logic so the PDF never shows an empty selection when no state was selected live. Preserve the live dashboard state and URL exactly after printing.

### V16.4 Board Packet Density Pass

> Re-evaluate the PDF like a board packet. Trim excess whitespace, oversized card padding, and avoidable page breaks before trimming language that improves understanding.

### V16.5 Print Map Context Pass

> Make sure the map, selected-state context, and legal-status summary work together as one print story. Avoid wasting vertical space on repeated labels or empty-state language in the exported PDF.

### V16.6 Source Verification Workflow Pass

> Tighten the maintainer guidance for source verification. Make it obvious which source gets checked first, which source is the cross-check, and which source is the advocacy-reference confirmation.

### V16.7 Manual Review Honesty Pass

> Keep improving the distinction between what the audit script can prove and what a human still must review, especially for print preview, legal-status credibility, and executive-facing wording.

### V16.8 Comment Precision Pass

> Add comments only where a novice would otherwise misread the print pipeline, hash state behavior, or temporary print-only state changes. Remove or avoid comments that just restate the code.

### V16.9 PDF-Only Reader Clarity Pass

> Assume some readers will only ever see the PDF. Improve the printed document so they can understand the program, the HAP position, the selected-state context, and the source credibility without using the live UI.

### V16.10 Release Sequence Discipline Pass

> Keep the maintainer workflow strict: update, test locally, inspect print preview, run audit, run QA, then publish. Prefer a smaller reliable workflow over adding new tooling.

---

## Prompts v17

### V17.1 Print Layout Boundary Pass

> Review which print containers truly need `break-inside: avoid` and which ones are creating wasted pages. Protect card integrity, but stop protecting large wrappers that cause blank or sparse pages.

### V17.2 Selection Summary Compression Pass

> Re-check the printed selection summary and state detail panel for duplication. Keep enough detail to be useful for policymakers and hospital leaders, but compress any repeated language that consumes page space.

### V17.3 Pennsylvania Framing Pass

> Improve how Pennsylvania is framed in print so the default selection adds useful context for HAP’s audience instead of feeling like a technical fallback.

### V17.4 State List Information Hierarchy Pass

> Rework the print hierarchy of state-law information so the most useful facts appear first: protected count, no-protection count, selected-state detail, and then compact abbreviations only if they still add value.

### V17.5 Executive Header Refinement Pass

> Tighten the printed header so it feels intentional and professional. Keep branding, document title, and recency visible, but do not let the header consume space needed by the first dashboard card.

### V17.6 Source Date Credibility Pass

> Reassess whether “last updated” and data freshness are visible in the right places for both the live dashboard and the PDF. Keep dates clear enough for executive readers without repeating them everywhere.

### V17.7 Neutral-State Honesty Pass

> Keep the neutral state deliberate on the live dashboard. If nothing is selected, say so clearly without sounding broken, apologetic, or unfinished.

### V17.8 Small-System Audit Pass

> Expand the audit script only for recurring regressions with a clear structural signal. Avoid turning visual/editorial questions into fragile pseudo-automation.

### V17.9 Lawmaker Copy Tightening Pass

> Remove the next vague or overly broad policy sentence. Replace it with language that clearly states what 340B does, what is at risk, and what action lawmakers are being asked to protect.

### V17.10 Hospital Leader Copy Tightening Pass

> Remove the next vague or overly broad executive sentence. Replace it with language that clarifies operational stakes, access implications, or oversight realities for hospital leaders.

---

## Prompts v18

### V18.1 Print Regression Memory Pass

> Document the exact print regressions that have already happened in this project so future maintainers know what to look for first: blank first page, duplicated intro content, zero-value counters, empty-state selection, and oversized state lists.

### V18.2 State Summary Formatting Pass

> Improve the print-only state summary so it reads like a concise legal-status appendix rather than a leftover UI widget. Favor readability and density over decorative styling.

### V18.3 Policy Narrative Flow Pass

> Re-check whether the PDF moves logically from program overview to HAP position to national map to state summary to policy implications. Tighten any transitions that feel abrupt or overly web-like in print.

### V18.4 Print Panel Density Pass

> Reassess the print sizing of the selection summary, state detail panel, trends cards, and KPI cards. Reduce print padding and spacing where the live tap-target requirements no longer apply.

### V18.5 QA Checklist Risk Order Pass

> Reorder manual QA so the highest-risk release blockers come first: print intro, default state selection, map visibility, final values, source dates, and share truthfulness.

### V18.6 Source Link Maintenance Pass

> Make it easier for a novice maintainer to understand which source links matter most and what each source is used to verify. Keep this guidance next to the places where they will actually look.

### V18.7 Restore-Live-State Pass

> Re-check every temporary print-only behavior and confirm the live dashboard returns to its prior neutral or selected state after print. Print improvements must not quietly mutate the interactive session.

### V18.8 Prompt Drift Cleanup Pass

> Review whether any older prompts still point at problems that are already fixed. Replace stale prompt ideas with narrower, evidence-based follow-ups instead of adding another vague wave.

### V18.9 Audit Output Next-Step Pass

> Improve audit messaging so a novice maintainer can tell not only what failed, but which kind of follow-up check is required next: code inspection, print preview, source verification, or documentation review.

### V18.10 Stability Budget Pass

> Before adding another print or layout tweak, ask whether it reduces failure risk or just adds moving parts. Keep a stability budget and spend it carefully.

---

## Prompts v19

### V19.1 Print Appendix Discipline Pass

> Treat dense print-only reference material as an appendix, not as a full-screen UI export. Keep appendix content concise and deliberately placed so it supports the narrative instead of interrupting it.

### V19.2 Compact Counts-First Pass

> For any print summary that risks becoming too large, prefer counts first and abbreviations second. Help executive readers scan what matters before they encounter dense supporting detail.

### V19.3 Visual Density Without Clutter Pass

> Increase print density where needed, but protect clarity. Use smaller spacing, smaller chips, and fewer repeated labels instead of collapsing hierarchy or shrinking text to the point of fatigue.

### V19.4 Print Selection Continuity Pass

> Ensure the same selected-state story is visible across the map highlight, the selection summary, and the detail panel in print. Avoid any mismatch between those three surfaces.

### V19.5 Executive Recency Cue Pass

> Reassess how the PDF communicates recency. Make “Last updated” and data freshness easy to find without turning them into visual clutter.

### V19.6 Maintainer Decision Tree Pass

> Improve maintainer docs so a first-time editor can quickly answer: Is this a content issue, a print issue, a behavior issue, or a data issue? Route them to the right file first.

### V19.7 High-Risk Surface Reminder Pass

> Keep naming the real high-risk dashboard surfaces in docs: print pipeline, URL hash state, share fallback, state selection, map rendering, and source credibility. Do not bury them in generic advice.

### V19.8 Output-Over-Prompts Pass

> Evaluate prompt quality by shipped outcomes. If a prompt wave adds more maintenance text than product value, compress or rewrite it before adding the next wave.

### V19.9 Law-Status Precision Pass

> Tighten any wording that could blur the difference between enacted protections, no protection law, in-progress efforts, or hybrid/reporting models. Keep legal-status language precise.

### V19.10 Human Review Gate Pass

> Make the human release gate explicit: no publish if the PDF looks wrong, the source status is stale, or the dashboard copy sounds vague for the intended audience.

---

## Prompts v20

### V20.1 Print Release Candidate Pass

> Treat the current PDF as a release candidate and review it end-to-end like an executive deliverable. Improve only what meaningfully raises credibility, readability, or confidence for decision-makers.

### V20.2 Page Count Tradeoff Pass

> Reassess whether each page in the PDF earns its place. Save pages through smarter summaries, tighter spacing, and better page-flow rules before sacrificing important content.

### V20.3 Evidence Layer Pass

> Strengthen the dashboard’s evidence layer so legal-status sources, data dates, and selected-state context reinforce the narrative instead of feeling bolted on after the design work.

### V20.4 Print Preview Recovery Pass

> Keep hardening the print path against browser quirks. If a browser drops, shifts, or duplicates content, favor explicit print-only structure over fragile reliance on live layout.

### V20.5 Small-Team Sustainability Pass

> Re-check whether one novice maintainer could still update this project safely. Prefer obvious structure, explicit release checks, and low-complexity fixes over cleverness.

### V20.6 Audience-Specific Tone Pass

> Review the dashboard tone for three readers at once: lawmakers, hospital CEOs, and administrators. Keep the copy precise enough for policy use and clear enough for operational readers.

### V20.7 State Summary Compression Recheck

> Revisit the printed state summary after every meaningful layout change. If it begins to sprawl again, compress the presentation before it silently steals a page.

### V20.8 Audit Boundary Pass

> Keep the audit runner bounded to structural and code-level checks. Document visual, editorial, and source-verification checks instead of trying to fake them with brittle automation.

### V20.9 Prompt Specificity Enforcement Pass

> Require future prompts to name the file surface, audience impact, regression risk, and non-goal. Reject prompts that talk about self-improvement without saying what will actually change.

### V20.10 Next-Wave Discipline Pass

> Generate future prompt waves only from observed issues in print preview, maintainability, source trust, or release QA. Do not generate more waves just because another round is possible.

---

## Prompts v21

### V21.1 Print Appendix Compression Pass

> Re-check any print-only appendix or summary block and compress it further if it begins to consume a disproportionate amount of page space. Keep it reference-friendly, not dominant.

### V21.2 Counts-Before-Lists Pass

> In print, always prioritize counts, selected-state meaning, and policy implications before long abbreviation lists. Lists should support the summary, not replace it.

### V21.3 State Summary Readability Pass

> Improve the printed state-law summary so it remains readable at higher density. Favor small hierarchy cues, shorter labels, and cleaner grouping over decorative styling.

### V21.4 Pennsylvania Context Clarity Pass

> Make sure Pennsylvania’s default print context adds policy value. The PDF should communicate why Pennsylvania is the temporary focus, not make it feel like a random UI fallback.

### V21.5 Header-to-Card Continuity Pass

> Re-check the visual transition from the print header to the first dashboard card. The first page should feel continuous and intentional, with no dead space or abrupt reset in hierarchy.

### V21.6 Print Detail Panel Economy Pass

> Tighten the printed state detail panel so it communicates the key state facts clearly without repeating labels or wasting vertical space that could serve the broader executive narrative.

### V21.7 Appendix Placement Pass

> Reassess where supporting state-law material belongs in print. Keep it near the map when it helps interpretation, but move or compress it if it interrupts the flow of the report.

### V21.8 Selected-State Story Pass

> Confirm that the selected-state highlight, detail panel, and surrounding copy tell one coherent story in print, especially for readers who never used the interactive map.

### V21.9 Audience-Ready Density Pass

> Increase print density only until the document feels executive-ready. Stop before readability drops for lawmakers, CEOs, or administrators reading a PDF on paper or screen.

### V21.10 Print Release Memory Pass

> Treat past print failures as release memory. Build future improvements around those exact regressions so they do not quietly return.

---

## Prompts v22

### V22.1 Manual Gate Ordering Pass

> Keep manual release checks in the order of risk, not convenience. Print and source credibility should remain ahead of cosmetic review.

### V22.2 Source Proof Pass

> Re-check that the dashboard shows enough source context to feel trustworthy, but not so much that the policy story disappears into citation clutter.

### V22.3 Date Visibility Pass

> Ensure data freshness and last-updated cues remain easy to find in both the live dashboard and the PDF. Keep them visible where decision-makers naturally look first.

### V22.4 Share-Preview Continuity Pass

> Make the shared preview language align with the dashboard’s actual framing. Shared metadata should communicate the same issue, stakes, and audience relevance as the live and printed views.

### V22.5 Prompt Outcome Ledger Pass

> Maintain a simple trace from prompt waves to meaningful outcomes. Keep the prompt library useful as maintenance history, not just as idea storage.

### V22.6 High-Risk Surface Handoff Pass

> Strengthen the handoff notes so future maintainers can immediately identify the real high-risk surfaces: print, selection state, share flow, map rendering, and source trust.

### V22.7 Manual-vs-Automated Boundary Pass

> Keep documenting where automation ends. The repo should be explicit about which checks still need a human eye before publishing.

### V22.8 Policy Ask Precision Pass

> Re-check any sentence describing what HAP is asking lawmakers to do. Keep it direct, specific, and consistent across the intro, policy framing, and print summary.

### V22.9 Executive Stakes Precision Pass

> Re-check any sentence aimed at hospital leaders. It should speak clearly to patient access, operational impact, or oversight realities without generic advocacy filler.

### V22.10 Release Candidate Credibility Pass

> Review the dashboard as if it were about to be sent to an executive team. Improve only what increases confidence, clarity, or evidence quality.

---

## Prompts v23

### V23.1 Neutral-State UX Pass

> Keep the live neutral state clear and deliberate. A user who has not clicked a state should still understand what to do and not interpret the dashboard as incomplete.

### V23.2 State Detail Language Pass

> Tighten the language inside the state detail panel so each field adds meaning. Remove or compress wording that repeats what the badges already convey.

### V23.3 Badge Meaning Pass

> Ensure the state detail badges and labels remain understandable in both live and print contexts. Prefer exact legal-status wording over shorthand that only makes sense to repeat users.

### V23.4 Print Trends Density Pass

> Reassess the “Recent legal trends” cards in print. Keep the signal, but reduce any padding or repetition that makes the section longer than its value justifies.

### V23.5 KPI Context Pass

> Ensure the KPI strip still makes sense as a printed executive summary. Tighten labels or descriptions if a PDF-only reader could misread what the numbers represent.

### V23.6 Policy Flow Consistency Pass

> Re-check whether the order of sections still supports a clean progression from “What is 340B?” to HAP position to state evidence to policy implications.

### V23.7 Source Language Precision Pass

> Remove the next vague phrase from the source and methodology guidance. Help maintainers understand exactly what each source verifies.

### V23.8 Workflow Brevity Pass

> Keep the novice workflow short enough to follow under pressure. If a maintenance instruction does not reduce risk or confusion, compress it.

### V23.9 Small-Tool Discipline Pass

> Before adding any new audit or helper script logic, ask whether the regression is common enough to justify automation. Favor fewer reliable checks over broader fragile ones.

### V23.10 Prompt Debt Pass

> Identify prompt debt the same way you identify code debt. If a prompt no longer points to a real weakness, revise or retire it instead of layering another near-duplicate.

---

## Prompts v24

### V24.1 Release Checklist Compression Pass

> Rework the release checklist so it stays scannable for a novice maintainer while still front-loading the highest-risk checks.

### V24.2 Source Verification Shortcut Pass

> Make it easier for a maintainer to remember the source verification order by placing the reminder where they are most likely to need it.

### V24.3 Print Regression Naming Pass

> Name recurring print regressions explicitly in docs and QA: blank first page, duplicated intro, empty-state PDF, zero metrics, and oversized appendix blocks.

### V24.4 Human Review Gate Wording Pass

> Tighten the wording around human review so it sounds like a real release requirement, not a soft suggestion.

### V24.5 Dashboard-to-PDF Continuity Pass

> Reassess whether every major printed section can still be traced back to a live dashboard section. Avoid print content that feels disconnected from the product.

### V24.6 Share Fallback Honesty Pass

> Make sure share status messages and docs still describe the actual behavior in modern browsers, fallback browsers, and constrained environments.

### V24.7 Print State Restore Pass

> Re-check the live-state restoration path after print so no temporary print behavior lingers after the dialog closes.

### V24.8 Audience Framing Sync Pass

> Synchronize the framing for lawmakers, hospital CEOs, and administrators across metadata, on-page intro copy, and print-specific content.

### V24.9 Maintenance Routing Pass

> Keep improving the maintainer decision tree: content issue, data issue, print issue, behavior issue, or source issue. Route each one to the right file immediately.

### V24.10 Prompt Specificity Recheck

> Re-evaluate the latest prompt waves and make sure they still name the exact surface, audience, regression risk, and constraint. Tighten any wave that drifts back toward abstraction.

---

## Prompts v25

### V25.1 Executive Deliverable Pass

> Treat the dashboard and PDF as executive deliverables, not experiments. Improve only what helps credibility, clarity, and decision-making confidence.

### V25.2 Appendix-to-Narrative Balance Pass

> Keep balancing narrative pages against reference material. The PDF should stay informative without becoming a dense legal-status dump.

### V25.3 Default-State Confidence Pass

> Reconfirm that the default print state and neutral live state each serve their own purpose cleanly: one for executive clarity, one for honest interaction.

### V25.4 Metadata Truth Pass

> Re-check title, description, Open Graph, and Twitter metadata so they faithfully represent the current dashboard instead of lagging behind the real product.

### V25.5 Print Header Economy Pass

> Review the printed header again and remove anything that does not earn its space. The header should frame the report, not compete with the first card.

### V25.6 Source Trust Signal Pass

> Strengthen the small trust signals that matter: source labels, dates, verification order, and legal-status wording. Prefer evidence cues over decorative polish.

### V25.7 Manual Review Durability Pass

> Make the manual review expectations durable enough that a rushed maintainer still sees them before release. Place them in docs, QA, and audit output where they are hard to miss.

### V25.8 Small-System Longevity Pass

> Re-check whether the dashboard is still evolving as a small maintainable system. Reject improvements that add more complexity than confidence.

### V25.9 Outcome-Based Prompt Writing Pass

> Require future prompt writing to begin from observed failures, missed checks, or vague copy. Keep prompt generation grounded in evidence and shipped outcomes.

### V25.10 Next-Wave Restraint Pass

> Do not generate future prompt waves until the current wave has produced visible product, documentation, or release-quality improvements worth keeping.

---

## Prompt Outcome Notes

- `v15-v16` contributed to the current print continuity work: live intro cards preserved in print, compact print-only state summary, and print-only Pennsylvania default selection.
- `v17-v18` contributed to clearer neutral-state wording, source-verification guidance, and explicit manual-review expectations around print and source credibility.
- `v19-v20` contributed to stricter release discipline, smaller-system maintenance guidance, and tighter boundaries around what the audit can and cannot prove.
- `v21-v30` contributed to a stronger executive scan layer, more forceful claim-to-evidence hierarchy, tighter selected-state storytelling, and a safer config-driven source of truth for high-salience copy.

---

## Prompts v26

### V26.1 Section Footprint Pass

> Reassess every major dashboard section and decide whether it truly changes reader understanding. If a section does not earn its footprint in a fast executive scan, compress it, demote it, or remove redundancy around it.

### V26.2 Claim-to-Evidence Path Pass

> For each major policy or impact claim on the page, make the proof path easier to see. Readers should not have to hunt for the supporting metric, source cue, or state example that justifies the statement.

### V26.3 Selected-State Stress Test Pass

> Check whether the dashboard still feels intentional when a reader selects a state other than Pennsylvania. The state-detail flow should still read like a coherent argument, not a Pennsylvania-only narrative with fallback behavior.

### V26.4 Content Drift Control Pass

> Reduce the risk that metadata, visible copy, print content, and source notes drift apart. Prefer a clearer source of truth for high-salience factual text and date-driven surfaces.

### V26.5 Update-Risk Drill Pass

> Simulate a future legal-status update and identify which surfaces must change together: state data, selection summaries, source notes, print context, and any claim that depends on the update. Improve the system where one missed edit could mislead readers.

### V26.6 Map Value Proof Pass

> Reconfirm that the map earns its central footprint by helping readers orient themselves faster than a text-only summary would. If nearby copy is doing the same work less effectively, tighten the copy rather than bloating the map section.

### V26.7 KPI Label Honesty Pass

> Re-check every KPI label and description for ambiguity. If a number sounds impressive but the label leaves room for misreading, tighten the wording until the metric is unmistakably clear in both live and print contexts.

### V26.8 Evidence Layer Integration Pass

> Strengthen how evidence appears in the dashboard itself. Dates, source cues, selected-state context, and policy framing should reinforce each other instead of reading like separate editorial and compliance layers.

### V26.9 Policy Ask Compression Pass

> State the HAP policy ask as clearly as possible in fewer words. Remove any extra phrase that does not sharpen what lawmakers are being asked to protect or why hospital leaders should care.

### V26.10 Maintenance Contract Pass

> Make the change boundaries more obvious for a novice maintainer. High-risk dashboard surfaces should be easy to locate, hard to misunderstand, and documented close to where the risk actually lives.

---

## Prompts v27

### V27.1 Fast Executive Scan Pass

> Improve the dashboard so a skeptical executive can answer three questions in under 30 seconds: What is 340B? What is HAP asking for? Why does it matter now?

### V27.2 Proof-First Intro Pass

> Rework the opening surfaces so evidence lands earlier. The first screen should not rely on later cards or the state map to justify why the issue matters.

### V27.3 Redundancy Purge Pass

> Identify where the same idea appears in the intro, HAP position, map context, KPI labels, and policy cards. Keep the strongest version and cut the weaker restatements.

### V27.4 Print Story Compression Pass

> Tighten the PDF story so it reads like a credible short brief instead of a direct export of a web interface. Preserve meaning while reducing page-filling repetition.

### V27.5 Selection Summary Upgrade Pass

> Make the selection summary more useful than a status label. It should quickly explain why the selected state matters without forcing readers to interpret the detail panel first.

### V27.6 Source Role Clarity Pass

> Clarify what each source contributes: legislative status, pharmacy-policy cross-check, advocacy confirmation, or metric support. Do not let source names float without purpose.

### V27.7 Cross-State Story Pass

> Ensure the dashboard communicates a national story and not just a list of state facts. The interaction between protected states, no-protection states, and Pennsylvania should feel intentional.

### V27.8 Interaction Without Fragility Pass

> Improve the dashboard only in ways that preserve resilience. New clarity should not depend on brittle selector chains, hidden duplication, or stateful behavior that is hard to restore.

### V27.9 Print Appendix Discipline Pass

> Reconfirm that print-only summary material behaves like a concise appendix. Keep it helpful, but do not let it outgrow the main narrative or steal a page again.

### V27.10 Reader Confidence Pass

> Review the dashboard for confidence leaks: vague tone, unsupported claims, hidden update assumptions, or print-only surprises. Tighten the surfaces that could make an informed reader doubt the product.

---

## Prompts v28

### V28.1 Strongest Claim Wins Pass

> Identify the strongest claim on the page and make sure it receives the clearest support. Demote or compress any weaker claim that competes for the same reader attention.

### V28.2 Skeptical Reader Pass

> Assume the reader doubts the stakes, doubts the source recency, and doubts whether the selected state matters. Improve only the surfaces that answer those doubts quickly and credibly.

### V28.3 State Detail Economy Pass

> Tighten the state detail panel so every field earns its place. Replace generic labels and repeated phrasing with concise legal-status meaning and why-it-matters context.

### V28.4 Live-to-Print Continuity Pass

> Re-check whether each important print surface is traceable to a live dashboard surface. Avoid letting the PDF carry any message that feels disconnected from the actual product.

### V28.5 Update Surface Mapping Pass

> Make it easier to see which files and text surfaces must move together when dates, legal statuses, or core narrative copy changes. The next update should not require guesswork.

### V28.6 Contextual Metric Pass

> Put every major number in context close to where it appears. A metric should not require a separate card or later paragraph to explain what it measures or why it matters.

### V28.7 Board Packet Test Pass

> Review the dashboard and PDF as if they were being placed in a board packet. Improve what supports decision-making and trim what reads like polished filler.

### V28.8 Source Date Placement Pass

> Reevaluate where date and freshness cues appear. Put them where a decision-maker expects trust signals, not only where a maintainer expects to edit them.

### V28.9 Default State Justification Pass

> Keep Pennsylvania as the default print state only if the product clearly explains why that is a meaningful context for HAP’s audience. The rationale should read as editorial intent, not a technical patch.

### V28.10 Small-System Pressure Pass

> Before adding another improvement, ask whether one novice maintainer could still debug it safely. Prefer fewer but stronger product surfaces over scattered enhancements that multiply risk.

---

## Prompts v29

### V29.1 Hero Hierarchy Pass

> Strengthen the hierarchy of the first visible content so readers immediately recognize the problem statement, the policy ask, and the proof anchors. Remove any opening signal that competes with those priorities.

### V29.2 Footprint Justification Pass

> Pressure-test whether each major card, metric block, and support section deserves its current size. If it does not change interpretation proportionally to its space, compress it.

### V29.3 Claim Drift Audit Pass

> Re-check the dashboard for any claim that could silently drift out of sync with state data, print defaults, or methodology notes. Tighten the content path before the next data update makes the risk real.

### V29.4 Print Recovery Memory Pass

> Treat the existing print pipeline as hard-earned reliability. Improve it only in ways that reduce future blank-page, duplicate-content, missing-map, or stale-state regressions.

### V29.5 Map-and-Detail Cohesion Pass

> Ensure the map, selection summary, and detail panel work as one decision surface. A reader should not have to mentally stitch together separate widgets to understand state context.

### V29.6 Audience Precision Pass

> Re-check the wording for lawmakers, CEOs, and administrators at the same time. Keep the copy precise enough for policy credibility and plain enough for operational readers.

### V29.7 Print Density Without Fatigue Pass

> Increase PDF density only where it improves scan speed. Avoid shrinking or packing content so aggressively that a reader resents the document by page three.

### V29.8 Update Workflow Honesty Pass

> Make the maintenance docs honest about where careful human judgment is still required. Do not let automation language imply that copy, law-status trust, or PDF quality can be fully delegated.

### V29.9 Evidence Placement Pass

> Move the most useful proof closer to the claims it supports. If supporting context is stranded too far from its claim, tighten the layout or copy so the evidence feels native.

### V29.10 Demotion Discipline Pass

> Practice demotion as a product skill. When content matters but does not belong in the first scan, move it lower or make it secondary rather than letting it compete at the top.

---

## Prompts v30

### V30.1 Ruthless Scan Pass

> Treat the current dashboard like it must survive an unforgiving 30-second scan by a skeptical decision-maker. Anything that delays comprehension of the issue, ask, evidence, or selected-state meaning should be compressed or removed.

### V30.2 Strongest-Proof Pairing Pass

> Pair the strongest product claim with the strongest nearby proof. Do not let high-value evidence sit in secondary areas while weaker framing dominates the first screen.

### V30.3 Print Worthiness Pass

> Reassess whether every printed block is worthy of ink, paper, and executive attention. If a block feels like a leftover web artifact, redesign, compress, or demote it.

### V30.4 State Narrative Tough-Love Pass

> Rewrite any selected-state language that reads like a neutral database output when it should read like a useful policy briefing. Keep it precise, but make it pull its narrative weight.

### V30.5 Metric Skepticism Pass

> Challenge every metric as if an informed reader asked, “Why is this here?” Keep only the numbers that advance understanding and label them so they can survive scrutiny in print.

### V30.6 Section Survival Pass

> Ask of every major surface: if this disappeared, would the dashboard become less convincing or just less busy? Use the answer to drive stronger hierarchy and cleaner pacing.

### V30.7 Copy Severity Pass

> Replace the next sentence that sounds generic, polite, or padded with language that is tighter, more exact, and more credible. Favor forceful clarity over decorous filler.

### V30.8 Reader Task Completion Pass

> Ensure the dashboard helps a reader complete the core tasks fast: understand 340B, grasp the HAP ask, inspect a state, judge the evidence, and trust the PDF. Tighten anything that slows that path.

### V30.9 Structural Honesty Pass

> Keep the product recognizable, but stop protecting weak structure out of habit. If a cleaner arrangement improves understanding without breaking the system, choose the cleaner arrangement.

### V30.10 Overhaul Without Drift Pass

> Push the dashboard hard on clarity, authority, and evidence while preserving its static-site constraints, local-asset posture, and novice-maintainable shape.

---

## Prompts v31

### V31.1 Section Elimination Pass

> Force each section to justify itself against an executive reader’s limited attention. If it does not materially change interpretation, demote it or cut its weight.

### V31.2 Hero Compression Pass

> Reduce the time it takes to understand the dashboard’s opening argument. The top surfaces should communicate the issue, the ask, and the evidence faster than they currently do.

### V31.3 Redundancy Removal Pass

> Hunt down repeated meaning across titles, subheads, labels, and explanatory copy. Keep the strongest instance and remove the softer duplicates.

### V31.4 Surface Priority Pass

> Re-rank every visible surface by real reader value rather than by design symmetry. Let the highest-value content dominate the hierarchy.

### V31.5 High-Signal Copy Pass

> Replace explanatory sentences that merely sound responsible with sentences that actually clarify stakes, evidence, or action.

### V31.6 Scan Friction Pass

> Identify every point where the reader must slow down to figure out what matters. Reduce that friction without flattening the product into generic summary copy.

### V31.7 Print Echo Pass

> Make sure the PDF still communicates the same priority order as the live dashboard. The print version should not accidentally promote lower-value material.

### V31.8 Selection Relevance Pass

> Make state selection feel strategically relevant, not just interactive. The chosen state should immediately feel like part of the dashboard’s argument.

### V31.9 Proof Visibility Pass

> Bring proof closer to prominence. The dashboard should not ask readers to trust a claim before it has shown why that claim is credible.

### V31.10 Maintenance Restraint Pass

> Improve the product aggressively without making it harder for one person to maintain. Reject elegant-looking complexity that increases update risk.

---

## Prompts v32

### V32.1 Brutal Hero Discipline Pass

> Treat the opening as if only one message can survive. Make the policy case unmistakable before any secondary context gets space.

### V32.2 Intro Card Pressure Pass

> Force the intro cards to compete for space and keep only what makes them stronger. Remove any sentence that merely softens or repeats what the card already says.

### V32.3 Ask-First Precision Pass

> Tighten the HAP ask until it feels like a decision prompt rather than a general position statement. Every word should help the reader understand the requested protection.

### V32.4 Why-Now Pass

> Clarify why contract pharmacy protection matters now, not in the abstract. Remove timeless advocacy phrasing where a sharper current-stakes framing would work better.

### V32.5 Credibility Front-Loading Pass

> Move the most important trust signals earlier in the reader journey. Dates, sources, and evidence cues should support the first impression, not only the last.

### V32.6 Layout Severity Pass

> Make layout decisions based on what deserves dominance, not on what fills a grid neatly. Unequal emphasis is acceptable when it improves understanding.

### V32.7 Policy Card Toughening Pass

> Force the policy cards to earn their space with concrete meaning. Replace broad descriptions with precise statements about risk, safeguards, or operational implications.

### V32.8 Print Header Ruthlessness Pass

> Keep the print header only as large as needed to orient the reader. Remove any header element that competes with the first block of real content.

### V32.9 Metric Context Severity Pass

> If a metric can be misunderstood in isolation, fix that immediately. Strong numbers do not excuse weak context.

### V32.10 Narrative Continuity Pass

> Ensure the dashboard reads as one argument from top to bottom rather than as a collection of individually polished cards.

---

## Prompts v33

### V33.1 Evidence Purge Pass

> Remove decorative or low-value evidence cues and keep only the proof elements that genuinely strengthen trust or interpretation.

### V33.2 Claim Audit Pass

> Challenge each claim on the page: what exactly is being asserted, and where is the nearest support? If the answer is weak, rewrite or demote the claim.

### V33.3 Source Surface Hardening Pass

> Make source roles and data dates harder to miss and easier to trust. Small trust cues should do more work, not just exist.

### V33.4 Proof-to-Position Pass

> Reconnect evidence directly to the HAP position. The dashboard should make it obvious why the proof supports the ask.

### V33.5 State Example Force Pass

> Use selected-state context as a proof surface, not just an interaction surface. A chosen state should strengthen the broader argument.

### V33.6 Print Proof Retention Pass

> Ensure the PDF keeps the strongest proof, not just the strongest layout. If print loses meaning while preserving structure, the structure is not good enough.

### V33.7 Selection Summary Evidence Pass

> Upgrade the selection summary so it signals why the state matters, not just what state is selected.

### V33.8 Reader Doubt Pass

> Assume the reader doubts both the narrative and the evidence. Tighten the surfaces that answer doubt fastest.

### V33.9 Precision Over Breadth Pass

> Prefer one exact statement over three broad supporting sentences. Breadth without precision weakens trust.

### V33.10 Audit Honesty Reinforcement Pass

> Keep the audit aligned to structural truth and let human review own visual/editorial truth. Do not blur those responsibilities.

---

## Prompts v34

### V34.1 KPI Skepticism Pass

> Treat every KPI as guilty until clearly justified. A number that lacks immediate meaning or support should be relabeled, relocated, or reduced.

### V34.2 Metric Hierarchy Pass

> Re-rank dashboard metrics by actual persuasive value. Let the most decision-relevant number lead and stop giving equal visual weight to weaker supporting metrics.

### V34.3 Supporting Card Demotion Pass

> If supporting cards do not change reader interpretation as much as they consume attention, compress them aggressively.

### V34.4 Community Benefit Proof Pass

> Make community benefit evidence feel less like a celebratory stat block and more like a concrete reason the policy debate matters.

### V34.5 Oversight Clarity Pass

> Tighten the oversight surface so readers understand what is being measured, why it matters, and how it supports the broader credibility argument.

### V34.6 State Metric Alignment Pass

> Make sure Pennsylvania-specific metrics do not visually compete with national signals unless they are deliberately framed as the focal state evidence.

### V34.7 Print Metric Legibility Pass

> Ensure every printed metric survives without hover, context, or color cues. If it cannot, change the label or surrounding copy.

### V34.8 Number-to-Meaning Pass

> Bring meaning closer to the number. Do not make the reader scan away from a metric to understand why it exists.

### V34.9 Scale Honesty Pass

> Re-check whether large numbers and percentages are framed in a way that is impressive but still honest. Keep scale cues precise and credible.

### V34.10 Signal Density Pass

> Increase information density by improving meaning per line, not by merely shrinking or packing the layout.

---

## Prompts v35

### V35.1 Map Justification Pass

> Force the map to justify its dominance every time. If the map is central, its surrounding copy and detail flow must make that centrality worthwhile.

### V35.2 Map-to-Detail Speed Pass

> Reduce the delay between clicking a state and understanding why it matters. The map interaction should feel like a fast path to meaning, not a scenic route.

### V35.3 Non-PA State Credibility Pass

> Ensure the dashboard still feels equally intentional when a reader explores a non-Pennsylvania state. The product should not collapse into a local-only narrative outside its default context.

### V35.4 Legend Utility Pass

> Make the legend and surrounding cues earn their space. If they are doing less work than nearby text, simplify and sharpen them.

### V35.5 Detail Panel Authority Pass

> Strengthen the state detail panel so it feels authoritative and useful, not just informative. It should help a decision-maker interpret the state immediately.

### V35.6 Empty-State Quality Pass

> Keep the neutral live state honest without making it feel unfinished. The dashboard should still look intentional before a state is chosen.

### V35.7 Print State Story Pass

> Ensure the printed selected-state context, state summary, and map highlight tell one unmistakable story. No reader should wonder why that state is there.

### V35.8 State List Severity Pass

> Keep the state lists only as large and prominent as their utility justifies. Abbreviations are reference material, not the product’s emotional center.

### V35.9 Fallback Trust Pass

> If the map fails, the fallback should still preserve the dashboard’s credibility. A degraded state should remain coherent, not just technically functional.

### V35.10 Interaction Value Pass

> Protect interactions that deepen understanding and challenge interactions that only add motion or novelty.

---

## Prompts v36

### V36.1 Board Packet PDF Pass

> Treat the PDF as if it were being circulated without the live site. Strengthen clarity, trim web-only artifacts, and keep the print narrative credible to a cold reader.

### V36.2 Print Page Economy Pass

> Make every printed page earn its place. Save pages through hierarchy and compression, not through hiding the most useful evidence.

### V36.3 Appendix Brutality Pass

> Compress any appendix-style material until it truly feels like reference support, not a competing chapter of the report.

### V36.4 Header Subordination Pass

> The print header must orient the reader and then get out of the way. Keep the emphasis on the argument, not the report chrome.

### V36.5 Print Flow Pass

> Tighten the transitions between intro, state evidence, metrics, and policy implications so the PDF reads like a deliberate brief rather than a frozen webpage.

### V36.6 Selected-State Print Authority Pass

> Make the default or user-selected print state feel like an intentional proof surface with clear meaning for HAP’s audience.

### V36.7 Print Typography Severity Pass

> Use typography in print to reinforce hierarchy, not to decorate. Stronger hierarchy should replace repeated words and repeated labels.

### V36.8 Print Recovery Guardrail Pass

> Improve print only in ways that reduce regression risk. Preserve the hard-won protections against blank pages, missing maps, and stale interaction state.

### V36.9 PDF Reader Fatigue Pass

> Reduce the points where a PDF-only reader might lose patience. Keep the document moving from insight to evidence to implication with less drag.

### V36.10 Print-Only Honesty Pass

> Any print-only content should exist only where it solves a real browser-print problem or improves document clarity. Avoid print-only embellishment.

---

## Prompts v37

### V37.1 Lawmaker Precision Pass

> Rewrite broad policy language until the lawmaker audience hears a clear ask, a clear risk, and a clear reason to care.

### V37.2 Hospital-Leader Consequence Pass

> Tighten executive-facing copy until operational consequences, patient-access implications, and oversight realities are unmistakable.

### V37.3 Advocacy Without Haze Pass

> Keep the dashboard persuasive without letting it become foggy. The strongest advocacy is the version that sounds specific and evidenced, not grand.

### V37.4 Sentence Severity Pass

> Remove one soft sentence at a time and replace it with language that carries clearer meaning under scrutiny.

### V37.5 Section Title Force Pass

> Review titles and headings for precision and force. A title should orient fast and not waste space on generic framing.

### V37.6 Ask Repetition Pass

> Repeat the HAP ask only where repetition strengthens recall. Eliminate duplicate ask phrasing where it merely fills space.

### V37.7 Tone Discipline Pass

> Balance authority and restraint. The dashboard should sound sharp and credible, not inflated, apologetic, or vague.

### V37.8 Audience Drift Pass

> Re-check whether any section has drifted toward speaking only to one audience. Pull it back so lawmakers, CEOs, and administrators can all use it.

### V37.9 Print Tone Survival Pass

> Ensure the copy still sounds strong when read as plain black text in print. Tone should not depend on interaction, color, or layout flourishes.

### V37.10 Reader Respect Pass

> Treat reader attention as expensive. Every sentence should reward it with clarity, evidence, or decision value.

---

## Prompts v38

### V38.1 Default-State Stress Pass

> Change the mental test state from Pennsylvania to a weaker, less favorable, or less familiar example and ask whether the dashboard still feels coherent. Improve the structure where it depends too heavily on the default narrative.

### V38.2 Cross-State Consistency Pass

> Ensure the selected-state experience stays structurally consistent across enacted, not-enacted, and hybrid/reporting states.

### V38.3 Notes Field Quality Pass

> Re-check whether state notes are doing enough interpretive work. A note should clarify what is special about the state, not merely exist as leftover metadata.

### V38.4 Selection Language Precision Pass

> Tighten state-specific language so it preserves legal-status precision: enacted protection, no protection law, hybrid/reporting, in progress, or vetoed.

### V38.5 Map Story Balance Pass

> Keep the national map story and the selected-state story in balance. Neither should overwhelm the other.

### V38.6 Focal-State Integrity Pass

> Make Pennsylvania’s focal role editorially credible without crowding out the rest of the national story.

### V38.7 Stress-Print Pass

> Re-check the PDF after imagining multiple different selected states. The print story should remain useful even when the live user path changes.

### V38.8 State Comparison Value Pass

> Help readers compare what a protected state means versus a no-protection state without turning the page into a spreadsheet.

### V38.9 Selection Confidence Pass

> When a state is selected, the product should immediately feel more informative and more specific, not just more active.

### V38.10 Evidence Stability Pass

> Make sure the evidence and interpretation do not feel custom-built for only one favored example state.

---

## Prompts v39

### V39.1 Small-Team Under Pressure Pass

> Assume a rushed novice maintainer must update this dashboard correctly in one sitting. Strengthen the structure where that task still feels risky or obscure.

### V39.2 Change-Routing Pass

> Make it even clearer which surfaces are content, data, print, behavior, and source trust. Wrong-file edits should become less likely.

### V39.3 JS Boundary Pass

> Improve the organization inside the JavaScript so high-risk behaviors like print, selection state, and share flow are easier to reason about without introducing a framework or build step.

### V39.4 Config Surface Pass

> Move more high-salience factual or repeated text toward a cleaner configuration boundary where that reduces drift and makes updates safer.

### V39.5 Audit Value Pass

> Expand audit checks only where they catch recurring structural failures. Avoid adding clever checks that will rot or mislead.

### V39.6 Documentation Severity Pass

> Make the docs shorter where they are padded and stronger where they are timid. A maintainer should see the hard requirements fast.

### V39.7 Release Gate Force Pass

> Treat release guidance as operational discipline, not advice. The next maintainer should know what blocks a publish without ambiguity.

### V39.8 Drift Prevention Pass

> Reduce the number of places where the same fact or message can drift out of sync over time.

### V39.9 Print Debugging Pass

> Keep print debugging obvious. The system should make it easier to understand whether a print failure comes from HTML structure, CSS page flow, JS preparation, or stale data.

### V39.10 Sustainability Over Cleverness Pass

> Prefer the version of every improvement that a small team can safely live with, not the version that looks smartest in isolation.

---

## Prompts v40

### V40.1 Final Ruthless Release Candidate Pass

> Review the dashboard as if it must survive skeptical executive distribution tomorrow. Improve only what raises authority, clarity, evidence, or maintainability under pressure.

### V40.2 Survival-of-the-Fittest Surface Pass

> Let the strongest surfaces dominate and the weakest ones shrink. Stop giving equal respect to content that delivers unequal value.

### V40.3 Brutal Print Review Pass

> Treat the PDF as a document that can embarrass the project if it looks bloated, vague, or fragile. Tighten whatever still feels soft.

### V40.4 Claim Severity Pass

> Any claim that cannot quickly prove itself should be weakened, clarified, or removed.

### V40.5 Layout Honesty Pass

> Use layout to reveal real priority, not to preserve symmetry for its own sake.

### V40.6 Reader Conversion Pass

> Increase the odds that a reader leaves understanding the 340B issue, the HAP ask, and the state-level stakes without a guided explanation.

### V40.7 Trust Signal Dominance Pass

> Keep small trust signals visible enough to matter: dates, sources, legal-status wording, and print context. They should quietly reinforce the whole product.

### V40.8 Structural Severity Pass

> Keep what works, but stop protecting weak arrangement simply because it is familiar. Preserve recognizability, not inertia.

### V40.9 Maintenance Reality Pass

> Assume this dashboard must continue evolving through many future edits. Favor the overhaul choices that reduce long-term confusion and regression risk.

### V40.10 Overhaul Discipline Pass

> A brutal pass should make the product clearer and stronger, not merely harsher in tone. Keep every forceful change tied to reader value or maintenance safety.

---

## Prompts v41

### V41.1 Future Claim Map Pass

> Build the next wave around an explicit map of which major claims still need better nearby proof, clearer state examples, or stronger source cues.

### V41.2 Future Reader Task Pass

> Design the next improvements around concrete reader tasks, not generic polish. Ask what still feels too slow or uncertain for lawmakers, CEOs, or administrators.

### V41.3 Future Section Retirement Pass

> Identify the next section, card, or label that could be retired entirely without losing meaning. Use deletion as a future design tool, not just compression.

### V41.4 Future Drift Audit Pass

> Search for the next places where metadata, print copy, state data, and on-page claims might drift apart after future updates.

### V41.5 Future Update Drill Pass

> Simulate a major legal-status change and plan the next improvements around the surfaces most likely to break or mislead during that update.

### V41.6 Future Proof Layer Pass

> Improve the next version so evidence becomes even more native to the product rather than appended as maintenance text.

### V41.7 Future Print Compression Pass

> Plan future print improvements that reduce page count through better hierarchy and smarter content ranking, not by hiding useful material.

### V41.8 Future Fallback Strength Pass

> Keep strengthening the dashboard’s degraded states so map, print, and share failures still leave a coherent product behind.

### V41.9 Future Audience Split Pass

> Identify where lawmakers, hospital leaders, and administrators still want slightly different cues, then plan changes that sharpen without fragmenting the dashboard.

### V41.10 Future Outcome Filter Pass

> Reject future work that adds prompt volume faster than product value. Keep the next wave grounded in visible outcomes.

---

## Prompts v42

### V42.1 Cross-State Comparison Pass

> Plan future improvements that make comparing state conditions easier without turning the dashboard into a dense legal reference sheet.

### V42.2 Hybrid-State Clarity Pass

> Improve future handling of hybrid, reporting, or vetoed states so the dashboard preserves legal precision even as state policy complexity grows.

### V42.3 State Note Standardization Pass

> Tighten the next version of state notes so they read like deliberate editorial context rather than uneven metadata leftovers.

### V42.4 Selection Explanation Pass

> Keep improving the selected-state narrative so it feels like a useful briefing layer, not only a data lookup surface.

### V42.5 Future Neutral-State Pass

> Re-check whether the neutral live state still feels intentional after future content additions or hierarchy changes.

### V42.6 Proof Ranking Pass

> Rank future evidence surfaces by persuasive value and decide which should move closer to the hero story versus which should remain supportive.

### V42.7 Reader Confidence Recovery Pass

> Plan the next changes around repairing any remaining moments where a skeptical reader could still lose confidence.

### V42.8 Source Freshness Emphasis Pass

> Improve future freshness cues so they stay visible and credible without cluttering the product with repeated dates.

### V42.9 Future Print State Story Pass

> Keep planning improvements that make the selected-state print story clearer even if the future layout evolves.

### V42.10 Future Evidence Discipline Pass

> Ensure every future evidence addition either sharpens trust or improves interpretation. Do not add proof surfaces that merely decorate the narrative.

---

## Prompts v43

### V43.1 Low-Attention Reader Pass

> Design future improvements for a reader who gives the dashboard less time than expected. Keep comprehension resilient under low attention.

### V43.2 First-Impression Trust Pass

> Improve the next version so the dashboard earns trust in the first few seconds through hierarchy, clarity, and evidence placement.

### V43.3 Cold-PDF Reader Pass

> Keep planning around readers who will only see the PDF. The future document should explain itself without the live experience.

### V43.4 Executive Summary Toughening Pass

> Identify the next places where summary copy still sounds soft or generic and plan sharper replacements.

### V43.5 Policy Ask Recall Pass

> Make future changes that improve whether readers can remember the HAP ask after a single pass through the dashboard.

### V43.6 Section Recall Pass

> Reduce the number of sections that are visible but not memorable. Future hierarchy should improve recall, not just appearance.

### V43.7 Evidence Recall Pass

> Plan future evidence changes around what readers are most likely to remember and cite back to others.

### V43.8 Future Friction Pass

> Identify the next small interaction, wording, or print friction that disproportionately slows comprehension.

### V43.9 Future Skeptic Pass

> Assume future readers will be more skeptical, not less. Use that standard to decide what future claims and layouts must improve.

### V43.10 Outcome Memory Pass

> Keep future prompt writing tied to what the dashboard still fails to do for real readers, not what an abstract prompt system wants to talk about.

---

## Prompts v44

### V44.1 Appendix Redesign Pass

> Reimagine future appendix-style material as a deliberately supportive reference layer with tighter structure and less chance of stealing attention.

### V44.2 Source Reference Card Pass

> Consider whether future source trust could be clarified through a stronger but still compact reference surface instead of scattered reminders.

### V44.3 Print Navigation Pass

> Explore future print cues that help readers orient themselves across pages without turning the PDF into a heavy formal report.

### V44.4 Page Break Intelligence Pass

> Improve future print page-break logic only where it clearly reduces wasted space or broken narrative flow.

### V44.5 Trust Layer Balance Pass

> Plan future trust improvements that strengthen credibility without burying readers in verification language.

### V44.6 Hierarchy Durability Pass

> Make future hierarchy choices durable enough to survive copy tweaks, data updates, and print revisions without collapsing.

### V44.7 Appendix Entry Pass

> If a dense support block remains necessary in the future, design a cleaner entry point so it feels invited rather than dumped onto the page.

### V44.8 Print Reader Recovery Pass

> Reduce the future chances that a reader loses the thread while moving from main argument to supporting reference material in print.

### V44.9 Future Annotation Pass

> Consider whether selected future annotations, labels, or reference cues could do more work than adding new cards or copy blocks.

### V44.10 Future Compression Logic Pass

> Keep compression decisions grounded in what slows or distracts readers, not in arbitrary page-count goals.

---

## Prompts v45

### V45.1 Update Drill Expansion Pass

> Expand future planning around real update scenarios: new law enacted, veto, hybrid state change, source date shift, or metric refresh.

### V45.2 Change Impact Map Pass

> Make future change-impact mapping clearer so maintainers know which content, metadata, print, and audit surfaces move together.

### V45.3 Drift Alert Pass

> Identify future structural signs that a claim or date is likely to drift before a human reviewer catches it.

### V45.4 Maintainer Speed Pass

> Optimize future maintenance for correct speed, not just speed. A hurried maintainer should still be guided toward safe edits.

### V45.5 Release Gate Recovery Pass

> Reassess whether the release gate is still strong enough after future dashboard growth. Tighten it before complexity outpaces discipline.

### V45.6 Audit Expansion Restraint Pass

> Add future audit checks only when the regression risk is proven recurrent and structurally detectable.

### V45.7 Source Update Path Pass

> Keep improving how source updates are verified, documented, and reflected in both live and print contexts.

### V45.8 Print Update Safety Pass

> Plan future print changes so date, state, and evidence updates do not quietly reopen past PDF regressions.

### V45.9 Documentation Under Stress Pass

> Make the future docs even more usable under rushed, real-world maintenance conditions.

### V45.10 Future Safe-Change Pass

> Prefer future improvements that increase confidence in safe iteration over changes that only increase visual novelty.

---

## Prompts v46

### V46.1 Trust Signal Resilience Pass

> Keep strengthening the trust signals that should survive every future revision: dates, source roles, legal-status precision, and print context.

### V46.2 Metadata Resilience Pass

> Improve future metadata handling so the shared preview stays tightly aligned with the actual dashboard story after major edits.

### V46.3 Legal-Status Precision Pass

> Continue tightening the future handling of enacted protections, no-law states, hybrids, reporting models, and in-progress efforts.

### V46.4 Source Placement Resilience Pass

> Make future source cues more resistant to being buried by layout or copy changes.

### V46.5 Evidence Surface Durability Pass

> Keep future evidence surfaces strong enough that they are not the first things weakened by later design changes.

### V46.6 Reader Trust Recovery Pass

> Target the next places where trust could be lost and recover it through tighter proof, better wording, or clearer structure.

### V46.7 Print Trust Pass

> Plan future print updates around helping a PDF-only reader believe the document is current, careful, and deliberate.

### V46.8 Change Transparency Pass

> Make future revisions easier to understand in terms of what changed, why it changed, and what new risks were avoided.

### V46.9 Evidence Calm Pass

> Keep future proof surfaces calm and credible. Avoid over-signaling trust in ways that look defensive or cluttered.

### V46.10 Durable Credibility Pass

> Choose future improvements that make the dashboard harder to doubt even after many subsequent edits.

---

## Prompts v47

### V47.1 Skeptical Stakeholder Packet Pass

> Imagine the dashboard is being circulated among skeptical stakeholders who will scrutinize both message and proof. Plan future changes that hold up under that distribution model.

### V47.2 Objection Handling Pass

> Identify the next reader objections the dashboard should answer faster: “Is this current?”, “What is the ask?”, “Why this state?”, “What proves this?”

### V47.3 Decision-Maker Utility Pass

> Improve future versions so each major surface answers a real decision-maker need instead of a generic content category.

### V47.4 Evidence Challenge Pass

> Assume future readers will challenge the strongest evidence blocks first. Strengthen those blocks before adding new ones.

### V47.5 Tone Under Scrutiny Pass

> Keep future language strong enough to advocate and precise enough to survive a hostile reread.

### V47.6 Map Scrutiny Pass

> Reassess the future map experience from the perspective of a skeptical user who wants proof that the interaction adds value.

### V47.7 Print Packet Pass

> Treat the future PDF like a skeptical packet, not a celebratory artifact. Keep tightening the surfaces that would draw doubt.

### V47.8 Section Defense Pass

> Require future sections to survive the question, “Why is this still here?” before they remain prominent.

### V47.9 Signal Hierarchy Pass

> Make future signal hierarchy so clear that even an impatient or doubtful reader knows where to focus first.

### V47.10 Future Harshness Discipline Pass

> Keep harsh prompt tone tied to product outcomes. Brutality is useful only when it sharpens the dashboard, not when it bloats the prompt library.

---

## Prompts v48

### V48.1 Print Fallback Hardening Pass

> Keep future print behavior resilient if browser timing, animation state, or cloned content handling changes.

### V48.2 Share Fallback Hardening Pass

> Re-check future share behavior across modern sharing, clipboard copy, and prompt fallback so each path stays honest and useful.

### V48.3 Selection Restore Hardening Pass

> Keep strengthening how temporary print behaviors restore the live dashboard state after export.

### V48.4 Graceful Degradation Pass

> Improve the dashboard’s future degraded states so readers still encounter a coherent product when an interaction surface fails.

### V48.5 No-Surprise Print Pass

> Future print improvements should reduce surprises, not add them. The document should feel increasingly predictable to generate and review.

### V48.6 Failure Isolation Pass

> Keep separating major behaviors so a problem in map rendering, selection state, or print does not quietly poison the rest of the page.

### V48.7 Interaction Recovery Pass

> Plan future interaction changes around how quickly and clearly the product recovers from failure or unexpected state.

### V48.8 Browser Quirk Memory Pass

> Preserve institutional memory of browser-print quirks and interaction regressions in ways that help future maintainers act faster.

### V48.9 Audit-to-Manual Handoff Pass

> Strengthen the future handoff from audit output to manual review so maintainers know what to inspect next when automation passes.

### V48.10 Reliability Compounding Pass

> Choose future changes that make reliability improvements compound over time instead of resetting the risk with every layout experiment.

---

## Prompts v49

### V49.1 Prompt Quality Gate Pass

> Make future prompt writing even less tolerant of abstraction. Every useful prompt should point to a surface, an audience, a risk, and a likely product outcome.

### V49.2 Prompt Retirement Pass

> Retire future prompt ideas that duplicate solved problems, solved structures, or already-saturated governance themes.

### V49.3 Outcome Ledger Expansion Pass

> Keep expanding the prompt-to-outcome trail so the library remains a maintenance artifact instead of a scroll of intentions.

### V49.4 Future Non-Goal Pass

> Require future prompts to name what they will not do so scope stays disciplined and the product does not drift into rewrite behavior.

### V49.5 Product-First Prompt Pass

> Judge future prompts by whether they improve the dashboard for a real reader or maintainer, not by how sophisticated the prompt sounds.

### V49.6 Evidence-Based Backlog Pass

> Build future prompt waves only from observed product weakness, manual review feedback, or update pain.

### V49.7 Maintenance Cost Pass

> Weigh the maintenance cost of future prompt ideas before accepting them as backlog. Do not let prompt ambition outrun maintainability.

### V49.8 Structural Discipline Pass

> Keep future prompts disciplined enough that they strengthen the existing static-site system instead of accidentally demanding a new architecture.

### V49.9 Overhaul Memory Pass

> Preserve what the brutal overhaul actually changed so future prompt waves do not slowly undo its best decisions.

### V49.10 Prompt Restraint Pass

> Stop future wave generation when the next set would mostly restate earlier lessons in new wording.

---

## Prompts v50

### V50.1 Next-Horizon Discipline Pass

> Generate the next horizon of work only from genuine remaining weaknesses after the overhaul, not from the habit of adding more waves.

### V50.2 Product Maturity Pass

> Treat future revisions as maturity work: fewer surprises, tighter trust signals, cleaner evidence, and safer maintenance.

### V50.3 Evidence Leadership Pass

> Keep pushing the product toward a state where evidence leads framing rather than following it.

### V50.4 Reader Outcome Pass

> Future changes should increase the chance that readers leave informed, persuaded, and clear on the ask after one pass.

### V50.5 Maintenance Calm Pass

> Improve future maintainability until the repo feels calm to update rather than merely documented.

### V50.6 Print Confidence Pass

> Keep raising confidence in the PDF as an executive deliverable that can stand alone without apology or explanation.

### V50.7 Source Credibility Depth Pass

> Plan future source and date improvements around depth of trust, not repetition of trust language.

### V50.8 Structural Longevity Pass

> Favor future structural choices that remain strong across years of edits instead of those that only look optimal in the current moment.

### V50.9 Backlog Severity Pass

> Keep the backlog severe about what deserves attention next. Good future prompts should be hard to earn.

### V50.10 End-of-Wave Restraint Pass

> When the product is stronger, let the prompt system become quieter. The best future wave may be the one that decides not to exist yet.

---

## Alternate Prompts v40-v50

### Alt V40.1 Executive Triage Pass

> Force the dashboard to survive an impatient executive scan. Anything that does not clarify the issue, ask, proof, or state stakes within seconds should lose prominence.

### Alt V40.2 Claim Compression Pass

> Reduce each high-value claim to its strongest defensible wording and remove the softer neighboring explanation.

### Alt V40.3 Trust Surface Ranking Pass

> Re-rank trust cues by what readers actually notice first and strengthen only those surfaces.

### Alt V40.4 Print First-Impression Pass

> Treat the first printed page as the dashboard’s credibility test. Tighten anything that slows belief or comprehension.

### Alt V40.5 Selection Narrative Priority Pass

> Make the selected-state story feel as important as the interaction that reveals it.

### Alt V40.6 Metric Merit Pass

> Require every metric to justify its place in both live and print views with immediate meaning.

### Alt V40.7 Section Scarcity Pass

> Behave as if page space and reader attention are scarce resources; weak sections should shrink first.

### Alt V40.8 Layout Authority Pass

> Let layout show authority by clarifying priority, not by decorating content.

### Alt V40.9 Maintenance Burden Pass

> Reject any change that improves optics while making the system materially harder to maintain.

### Alt V40.10 Executive Deliverable Pass

> Make the product feel like something safe to circulate upward without verbal caveats from the sender.

---

### Alt V41.1 Proof Placement Pass

> Move the next strongest proof surface closer to the claim it justifies.

### Alt V41.2 Reader Question Pass

> Improve the product by answering the next obvious reader question before the reader has to ask it.

### Alt V41.3 Support Block Reduction Pass

> Compress supporting material until it truly supports instead of competes.

### Alt V41.4 Cold Reader Pass

> Assume the next reader has no prior context and sharpen the path from title to understanding.

### Alt V41.5 Metadata Alignment Pass

> Keep public metadata synchronized with the actual dashboard story after every major revision.

### Alt V41.6 Executive Recall Pass

> Improve what a reader is likely to remember and repeat after one pass through the dashboard.

### Alt V41.7 State Evidence Priority Pass

> Make state-level evidence earn more persuasive value than generic framing.

### Alt V41.8 Print Sequence Pass

> Tighten the order of printed sections so each page sets up the next one.

### Alt V41.9 Drift Friction Pass

> Increase the friction against silent content drift where facts, dates, and story must stay aligned.

### Alt V41.10 Outcome-Led Backlog Pass

> Keep future backlog growth tied to what readers or maintainers still struggle with.

---

### Alt V42.1 Comparison Clarity Pass

> Make state-to-state comparisons easier without turning the product into a dense matrix.

### Alt V42.2 Hybrid State Precision Pass

> Tighten the handling of hybrid and reporting states until their meaning is unmistakable.

### Alt V42.3 Note Utility Pass

> Ensure state notes add interpretation, not just metadata residue.

### Alt V42.4 Selection Confidence Pass

> Make each state click feel like a gain in understanding, not just a UI event.

### Alt V42.5 Focal State Balance Pass

> Preserve Pennsylvania’s relevance without letting it distort the national story.

### Alt V42.6 Evidence Ladder Pass

> Strengthen the path from broad claim to national proof to state example.

### Alt V42.7 Print Comparison Pass

> Keep printed state context useful even when different states are chosen live.

### Alt V42.8 Legal Language Pass

> Re-check every legal-status phrase for precision under scrutiny.

### Alt V42.9 Neutral-State Confidence Pass

> Keep the neutral state intentional enough that the product never feels half-loaded.

### Alt V42.10 Policy Relevance Pass

> Make sure the state experience always loops back to the HAP policy ask.

---

### Alt V43.1 Attention Economy Pass

> Spend reader attention only on content that clarifies stakes, proof, or action.

### Alt V43.2 Opening Trust Pass

> Strengthen the trustworthiness of the dashboard before the reader reaches secondary sections.

### Alt V43.3 PDF Standalone Pass

> Assume the PDF will travel alone and harden it accordingly.

### Alt V43.4 Ask Memory Pass

> Improve how easily the HAP ask can be recalled after the first scan.

### Alt V43.5 Section Memory Pass

> Reduce prominent-but-forgettable sections and strengthen memorable ones.

### Alt V43.6 Evidence Memory Pass

> Improve what evidence a reader is most likely to cite back later.

### Alt V43.7 Friction Removal Pass

> Remove the next subtle friction point that slows comprehension more than it seems to.

### Alt V43.8 Skeptical Re-read Pass

> Re-check surfaces that sound fine on first read but weaken under a skeptical second read.

### Alt V43.9 Reader Respect Compression Pass

> Shorten whatever still feels polite, repetitive, or overexplained.

### Alt V43.10 Prompt Outcome Discipline Pass

> Keep new prompts tied to visible product change rather than abstract “improvement.”

---

### Alt V44.1 Appendix Entry Pass

> If supporting reference material remains necessary, give it a cleaner entry and less visual drag.

### Alt V44.2 Trust Reference Pass

> Explore compact ways to clarify trust sources without smothering the narrative.

### Alt V44.3 Print Navigation Pass

> Add just enough print orientation to help readers move page to page confidently.

### Alt V44.4 Page-Break Value Pass

> Tune page breaks based on meaning preserved, not just whitespace reduced.

### Alt V44.5 Verification Balance Pass

> Keep verification language useful but subordinate to the main argument.

### Alt V44.6 Hierarchy Survival Pass

> Make hierarchy choices that stay strong even when the copy shifts slightly.

### Alt V44.7 Reference Layer Pass

> Treat dense support content like a disciplined reference layer, not an accidental second narrative.

### Alt V44.8 Reader Reorientation Pass

> Reduce the chance that readers lose the thread when moving into supporting material.

### Alt V44.9 Annotation Utility Pass

> Prefer compact labels or cues over new blocks when they achieve the same clarity.

### Alt V44.10 Compression Integrity Pass

> Compress only when meaning survives or improves.

---

### Alt V45.1 Update Scenario Pass

> Plan around realistic update scenarios, not idealized maintenance conditions.

### Alt V45.2 Impact Mapping Pass

> Make future content and code dependencies easier to see before something drifts.

### Alt V45.3 Silent Drift Pass

> Hunt for the next place where a stale date or claim could quietly survive an update.

### Alt V45.4 Maintainer Speed-with-Accuracy Pass

> Optimize update workflows for correctness under time pressure.

### Alt V45.5 Release Gate Integrity Pass

> Keep the release gate sharp enough that complexity cannot slip past it unnoticed.

### Alt V45.6 Audit Scope Discipline Pass

> Expand automation only when a regression is recurring and structurally detectable.

### Alt V45.7 Source Update Reliability Pass

> Tighten how source updates propagate across live, print, and metadata surfaces.

### Alt V45.8 Print Update Guardrail Pass

> Keep future print edits from reopening known regressions through seemingly small changes.

### Alt V45.9 Documentation Stress Pass

> Make maintenance docs stronger under rushed real-world use, not just on calm review.

### Alt V45.10 Safe Iteration Pass

> Favor changes that make repeated safe iteration easier.

---

### Alt V46.1 Trust Resilience Pass

> Make trust cues harder to bury or accidentally weaken during future polish passes.

### Alt V46.2 Metadata Honesty Pass

> Keep share metadata brutally honest about what the dashboard actually is and argues.

### Alt V46.3 Legal Precision Pass

> Tighten future handling of enacted, not enacted, hybrid, vetoed, and in-progress states.

### Alt V46.4 Source Placement Pass

> Put source cues where they strengthen credibility at the moment they are needed.

### Alt V46.5 Evidence Durability Pass

> Keep proof surfaces strong enough to survive later layout and copy changes.

### Alt V46.6 Trust Recovery Pass

> Target the next moment where reader trust can wobble and stabilize it.

### Alt V46.7 Print Confidence Pass

> Raise confidence that the PDF is current, intentional, and evidence-led.

### Alt V46.8 Change Legibility Pass

> Make it easier for future maintainers to understand what changed and what must stay aligned.

### Alt V46.9 Calm Credibility Pass

> Keep the product confident and calm rather than defensive or over-signaled.

### Alt V46.10 Long-Horizon Trust Pass

> Choose improvements that make the dashboard harder to doubt after many future revisions.

---

### Alt V47.1 Skeptical Packet Pass

> Improve the dashboard as if it will be read inside a skeptical executive packet.

### Alt V47.2 Objection Speed Pass

> Answer the next likely objection faster: currentness, ask clarity, state relevance, or proof quality.

### Alt V47.3 Decision Utility Pass

> Make every prominent surface answer a real decision-maker need.

### Alt V47.4 Evidence Stress Pass

> Assume the strongest evidence will be challenged first and strengthen that surface first.

### Alt V47.5 Tone Under Pressure Pass

> Keep the tone precise and advocate-ready even under hostile rereading.

### Alt V47.6 Map Value Defense Pass

> Defend the map’s footprint by making its interpretive value more obvious.

### Alt V47.7 Print Scrutiny Pass

> Make the PDF harder to dismiss as bloated, vague, or ornamental.

### Alt V47.8 Section Defense Pass

> Require each prominent section to survive a tough “why is this still here?” review.

### Alt V47.9 Signal Priority Pass

> Make the most important signals impossible to miss without adding noise.

### Alt V47.10 Harshness-to-Value Pass

> Keep prompt harshness justified by product value, not by theatrics.

---

### Alt V48.1 Print Reliability Pass

> Preserve and strengthen the print path against browser timing and layout quirks.

### Alt V48.2 Share Reliability Pass

> Keep share behavior honest and resilient across all supported fallbacks.

### Alt V48.3 Restore-State Pass

> Make temporary print behavior even less likely to leak back into the live session.

### Alt V48.4 Degraded Experience Pass

> Keep failure states coherent enough that the product still feels trustworthy.

### Alt V48.5 Predictable Print Pass

> Make print generation increasingly unsurprising for maintainers and readers.

### Alt V48.6 Failure Isolation Pass

> Separate high-risk behaviors so one break does not destabilize the rest of the page.

### Alt V48.7 Interaction Recovery Pass

> Improve how quickly the dashboard returns to a confident state after something goes wrong.

### Alt V48.8 Regression Memory Pass

> Preserve memory of old bugs where it materially shortens future diagnosis time.

### Alt V48.9 Audit-to-Human Pass

> Make audit results more actionable as the starting point for manual review.

### Alt V48.10 Compounding Reliability Pass

> Choose future changes that add reliability on top of reliability instead of resetting risk.

---

### Alt V49.1 Prompt Strictness Pass

> Make future prompts earn their place with exact scope, audience, risk, and likely result.

### Alt V49.2 Prompt Deletion Pass

> Delete or retire future prompt ideas that are solved, duplicated, or too abstract.

### Alt V49.3 Outcome Ledger Pass

> Keep building the prompt-to-outcome trail so future work is grounded in shipped value.

### Alt V49.4 Non-Goal Discipline Pass

> Require future prompts to say what they will not change.

### Alt V49.5 Product Bias Pass

> Judge prompt quality by product improvement, not prompt sophistication.

### Alt V49.6 Evidence Backlog Pass

> Build future waves from observed evidence, review, and maintenance pain.

### Alt V49.7 Maintenance Cost Pass

> Price in long-term maintenance before promoting a prompt to backlog.

### Alt V49.8 Architecture Restraint Pass

> Keep future prompts from accidentally demanding a new architecture.

### Alt V49.9 Overhaul Preservation Pass

> Protect the best overhaul decisions from being slowly diluted by later drift.

### Alt V49.10 Wave Restraint Pass

> Stop generating prompts when the next set would mostly rename old lessons.

---

### Alt V50.1 Maturity Gate Pass

> Generate future work only from genuine remaining product weakness after the latest improvements land.

### Alt V50.2 Fewer-Surprises Pass

> Treat maturity as fewer surprises in print, evidence, maintenance, and reader comprehension.

### Alt V50.3 Evidence-Led Story Pass

> Keep moving the dashboard toward a state where proof naturally leads the story.

### Alt V50.4 Reader Result Pass

> Improve future changes based on what readers can confidently understand and repeat after one pass.

### Alt V50.5 Maintenance Calm Pass

> Keep pushing the repo toward calmer, safer updates rather than just more instructions.

### Alt V50.6 PDF Authority Pass

> Make the PDF increasingly worthy of executive circulation without explanation from the sender.

### Alt V50.7 Source Depth Pass

> Strengthen source trust through depth and placement, not repetition.

### Alt V50.8 Structural Longevity Pass

> Favor structures that remain strong under years of copy, data, and print updates.

### Alt V50.9 Backlog Harshness Pass

> Keep the future backlog severe about what truly deserves attention.

### Alt V50.10 Quiet Prompt System Pass

> Let the prompt system quiet down as the product grows stronger; not every possible wave should exist.

---

## Prompts v51

### V51.1 Diminishing-Returns Awareness Pass

> Identify the next improvements that would add less value than the last wave. Stop before crossing that line.

### V51.2 Maintenance Velocity Pass

> Optimize for how fast a maintainer can safely make a typical update, not for how many features exist.

### V51.3 Reader Fatigue Pass

> Reduce any remaining surfaces that ask too much attention for too little payoff.

### V51.4 Evidence Saturation Pass

> Ensure proof surfaces do not compete with each other. One strong proof beats three weak ones.

### V51.5 Print Independence Pass

> Make the PDF fully self-explanatory for a reader who never saw the live dashboard.

### V51.6 State Story Coherence Pass

> Ensure every state selection tells a coherent micro-story that advances understanding.

### V51.7 Source Hierarchy Pass

> Clarify which sources matter most and which are supporting. Avoid flat lists of equal-weight citations.

### V51.8 Section Purpose Pass

> Every section should pass the test: "A reader who skips this loses something specific."

### V51.9 Update Friction Audit Pass

> Find and reduce the friction points that slow down routine data or copy updates.

### V51.10 Calm Product Pass

> The dashboard should feel calm and authoritative, not busy or defensive.

---

## Prompts v52

### V52.1 Stakeholder Handoff Pass

> Improve the product so it can be handed to a new stakeholder without a long verbal briefing.

### V52.2 One-Page Summary Test Pass

> If the dashboard had to become a one-pager, what would survive? Use that to validate current hierarchy.

### V52.3 Objection Preemption Pass

> Anticipate the next three objections a skeptic would raise and ensure the dashboard answers them.

### V52.4 Metric Justification Pass

> Every number should justify its presence. Remove or demote metrics that do not drive decisions.

### V52.5 Copy Compression Pass

> Reduce word count wherever meaning is preserved. Brevity increases authority.

### V52.6 Navigation Clarity Pass

> Ensure section navigation and in-page flow match how readers actually scan and jump.

### V52.7 Trust Decay Prevention Pass

> Identify surfaces where trust could decay over time (dates, sources) and harden them.

### V52.8 Print Flow Pass

> The printed sequence should read like a coherent narrative, not a concatenation of screens.

### V52.9 Maintenance Documentation Pass

> Ensure DATA-UPDATE.md and related docs accurately reflect current behavior and update paths.

### V52.10 Regression Surface Pass

> Add or strengthen checks for the surfaces most likely to regress during future edits.

---

## Prompts v53

### V53.1 Audience Calibration Pass

> Re-check whether the product still serves lawmakers, hospital leaders, and administrators in balanced proportion.

### V53.2 Ask Recall Reinforcement Pass

> Strengthen the HAP ask so it survives a distracted first pass and a delayed second pass.

### V53.3 State Comparison Utility Pass

> Make state-to-state comparison more useful without adding complexity.

### V53.4 Evidence Placement Pass

> Move evidence closer to the claims it supports. Reduce the distance between assertion and proof.

### V53.5 Print Header/Footer Pass

> Ensure print headers and footers add orientation value without clutter.

### V53.6 Mobile Scan Pass

> On narrow viewports, the most important content should still surface first.

### V53.7 Accessibility Depth Pass

> Go beyond minimum compliance. Ensure screen readers and keyboard users get full value.

### V53.8 Error State Clarity Pass

> When something fails (map, print, share), the fallback should be clear and actionable.

### V53.9 Performance Baseline Pass

> Establish and maintain a performance baseline. Avoid regressions that slow load or interaction.

### V53.10 Future-Proof Structure Pass

> Favor structures that will still make sense after several years of data and copy updates.

---

## Prompts v54

### V54.1 Executive Scan Optimization Pass

> Optimize for the 30-second executive scan: issue, ask, proof, and stakes visible immediately.

### V54.2 Lawmaker Briefing Pass

> Ensure a lawmaker could use this as a briefing document without additional context.

### V54.3 Hospital Leader Utility Pass

> Ensure hospital leaders find the state-level stakes and community benefit story immediately useful.

### V54.4 Source Freshness Visibility Pass

> Dates and freshness cues should be visible enough to matter, subtle enough not to distract.

### V54.5 Print Resolution Pass

> Map and charts should render at sufficient resolution for professional distribution.

### V54.6 Share Flow Pass

> The share/copy flow should feel intentional and complete, not like an afterthought.

### V54.7 State Note Quality Pass

> Every state note should add interpretation, not just restate the data.

### V54.8 Section Transition Pass

> Transitions between sections should feel deliberate, not accidental.

### V54.9 Maintenance Checklist Pass

> Ensure maintainers have a clear checklist for common update scenarios.

### V54.10 Overhaul Preservation Pass

> Document the key overhaul decisions so future maintainers do not accidentally undo them.

---

## Prompts v55

### V55.1 Value Density Pass

> Increase the ratio of useful information to total surface area. Remove low-value content.

### V55.2 Claim Precision Pass

> Every claim should be precise enough to defend under scrutiny.

### V55.3 Proof Proximity Pass

> Proof should live as close as possible to the claim it supports.

### V55.4 Reader Path Pass

> Map the ideal reader path from first view to understanding. Remove obstacles.

### V55.5 Print Credibility Pass

> The PDF should look like a document worth circulating, not a web page dump.

### V55.6 State Selection Value Pass

> Each state click should feel like a gain. Remove or improve selections that feel empty.

### V55.7 Metric Clarity Pass

> Every metric should have a clear "so what" that a reader can grasp quickly.

### V55.8 Hierarchy Durability Pass

> Ensure hierarchy survives copy changes, data updates, and layout tweaks.

### V55.9 Maintenance Safety Pass

> Reduce the risk that a hurried maintainer introduces errors.

### V55.10 Product Maturity Gate Pass

> Before adding new features, ensure existing ones are fully mature.

---

## Prompts v56

### V56.1 Skeptical Reader Pass

> Assume the next reader is skeptical. Strengthen the surfaces that would earn their trust.

### V56.2 Cold Start Pass

> A reader with no prior context should understand the issue and ask within one pass.

### V56.3 Evidence Hierarchy Pass

> Rank evidence by persuasive value. Ensure the strongest evidence gets the most prominence.

### V56.4 Print Standalone Pass

> The PDF should stand alone as an executive deliverable. No "see the live site" required.

### V56.5 State Story Consistency Pass

> Ensure state narratives are consistent in tone, depth, and usefulness.

### V56.6 Source Attribution Pass

> Every claim that needs a source should have one. Every source should be attributable.

### V56.7 Section Necessity Pass

> Challenge each section: could it be merged, shortened, or retired?

### V56.8 Interaction Feedback Pass

> Every interaction should give clear feedback. No silent or ambiguous state changes.

### V56.9 Maintenance Path Clarity Pass

> Maintainers should know exactly where and how to update each type of content.

### V56.10 Prompt Library Hygiene Pass

> Retire prompts that are solved, duplicated, or no longer relevant.

---

## Prompts v57

### V57.1 Audience Balance Pass

> Rebalance for lawmakers, hospital leaders, and administrators. No single audience should dominate at the expense of others.

### V57.2 Ask Prominence Pass

> The HAP ask should be impossible to miss for an attentive reader.

### V57.3 State Utility Pass

> Every state should offer something useful when selected. Improve or clarify weak states.

### V57.4 Evidence Sufficiency Pass

> Ensure there is enough evidence to support the main claims. Do not over-claim.

### V57.5 Print Sequence Pass

> The printed page order should tell a coherent story from start to finish.

### V57.6 Trust Signal Placement Pass

> Trust signals (dates, sources, methodology) should be visible where they matter most.

### V57.7 Copy Economy Pass

> Use the fewest words that preserve meaning. Cut redundancy.

### V57.8 Layout Priority Pass

> Layout should reflect real priority. The most important content gets the most space and prominence.

### V57.9 Update Safety Pass

> Common updates (new law, date change, metric refresh) should be low-risk and well-documented.

### V57.10 Product Calm Pass

> The product should feel finished and calm, not in perpetual development.

---

## Prompts v58

### V58.1 Executive Distribution Pass

> Optimize for the scenario where this is circulated upward without the creator present.

### V58.2 Lawmaker Utility Pass

> A lawmaker should find the policy case and state stakes immediately useful.

### V58.3 Hospital Leader Relevance Pass

> Hospital leaders should see their stakes (community benefit, 340B participation) clearly.

### V58.4 Evidence Placement Pass

> Place the strongest evidence where skeptical readers will look first.

### V58.5 Print Quality Pass

> The PDF should meet professional standards for typography, spacing, and clarity.

### V58.6 Share Completeness Pass

> Shared links should preserve useful context (e.g., state selection) when possible.

### V58.7 State Note Utility Pass

> State notes should answer "why does this matter?" not just "what is the status?"

### V58.8 Section Flow Pass

> Sections should flow logically. Each section should set up the next.

### V58.9 Maintenance Documentation Pass

> Documentation should be accurate, discoverable, and sufficient for common tasks.

### V58.10 Regression Prevention Pass

> Identify and protect the surfaces most likely to regress. Add checks where valuable.

---

## Prompts v59

### V59.1 Value Retention Pass

> Ensure the overhaul's best improvements are preserved and not slowly diluted.

### V59.2 Claim Defensibility Pass

> Every claim should be defensible under scrutiny. Weaken or remove those that are not.

### V59.3 Proof Quality Pass

> Prefer fewer, stronger proof surfaces over many weak ones.

### V59.4 Reader Outcome Pass

> Optimize for the outcome: reader leaves informed, persuaded, and clear on the ask.

### V59.5 Print Independence Pass

> The PDF should explain itself. No prior live experience required.

### V59.6 State Selection Coherence Pass

> State selection should feel like a coherent exploration, not a random lookup.

### V59.7 Source Credibility Pass

> Sources should be credible, current, and clearly attributed.

### V59.8 Section Purpose Pass

> Every section should have a clear purpose. Remove or merge sections that do not.

### V59.9 Maintenance Simplicity Pass

> Keep the maintenance model simple. Avoid complexity that does not pay for itself.

### V59.10 Prompt Restraint Pass

> Add new prompts only when they address a genuine, unsolved product weakness.

---

## Prompts v60

### V60.1 Product Completion Gate Pass

> Assess whether the product is ready for sustained use with minimal further change.

### V60.2 Maturity Checklist Pass

> Create a maturity checklist: what must be true for the product to be "done enough"?

### V60.3 Handoff Readiness Pass

> Ensure the product and documentation support clean handoff to a new maintainer.

### V60.4 Evidence Completeness Pass

> Ensure all major claims have adequate evidence. No orphan assertions.

### V60.5 Print Final Pass

> Final print review: the PDF should be worthy of executive circulation.

### V60.6 State Coverage Pass

> Ensure state coverage is complete and consistent. No states feel like afterthoughts.

### V60.7 Source Maintenance Pass

> Document how and when to update sources. Ensure the process is sustainable.

### V60.8 Section Final Pass

> Final section review: every section earns its place. No bloat.

### V60.9 Maintenance Sustainability Pass

> The maintenance model should be sustainable for years, not months.

### V60.10 Prompt Library Final Pass

> The prompt library should reflect the product's current state. Retire obsolete prompts. Document what was learned.

---

## Alternate Prompts v50-v60

### Alt V51.1 Return Awareness Pass

> Stop before improvements add less value than they cost in complexity.

### Alt V51.2 Update Speed Pass

> Optimize for how fast a maintainer can safely complete a typical update.

### Alt V51.3 Attention Economy Pass

> Reduce surfaces that demand attention without proportional payoff.

### Alt V51.4 Proof Competition Pass

> Ensure proof surfaces do not compete. One strong proof beats many weak ones.

### Alt V51.5 PDF Independence Pass

> The PDF must explain itself without the live dashboard.

### Alt V51.6 State Narrative Pass

> Every state selection should tell a coherent micro-story.

### Alt V51.7 Source Priority Pass

> Clarify which sources matter most. Avoid flat citation lists.

### Alt V51.8 Section Necessity Pass

> Every section must pass: "A reader who skips this loses something specific."

### Alt V51.9 Update Friction Pass

> Find and reduce friction in routine data and copy updates.

### Alt V51.10 Calm Authority Pass

> The product should feel calm and authoritative, not busy.

---

### Alt V52.1 Handoff Readiness Pass

> Improve so the product can be handed off without a long verbal briefing.

### Alt V52.2 One-Pager Test Pass

> If reduced to one page, what survives? Use that to validate hierarchy.

### Alt V52.3 Objection Preemption Pass

> Anticipate skeptic objections and ensure the dashboard answers them.

### Alt V52.4 Metric Justification Pass

> Every number must justify its presence.

### Alt V52.5 Brevity Pass

> Reduce word count wherever meaning is preserved.

### Alt V52.6 Navigation Match Pass

> Navigation should match how readers actually scan and jump.

### Alt V52.7 Trust Decay Pass

> Harden surfaces where trust could decay (dates, sources).

### Alt V52.8 Print Narrative Pass

> Printed sequence should read like a coherent narrative.

### Alt V52.9 Doc Accuracy Pass

> Ensure DATA-UPDATE.md and related docs reflect current behavior.

### Alt V52.10 Regression Check Pass

> Strengthen checks for surfaces most likely to regress.

---

### Alt V53.1 Audience Balance Pass

> Re-check balance across lawmakers, hospital leaders, administrators.

### Alt V53.2 Ask Recall Pass

> Strengthen the HAP ask so it survives a distracted first pass.

### Alt V53.3 State Comparison Pass

> Make state-to-state comparison more useful without complexity.

### Alt V53.4 Evidence Proximity Pass

> Move evidence closer to the claims it supports.

### Alt V53.5 Print Orientation Pass

> Headers and footers should add orientation without clutter.

### Alt V53.6 Mobile Priority Pass

> Most important content should surface first on narrow viewports.

### Alt V53.7 Accessibility Depth Pass

> Go beyond minimum compliance for screen readers and keyboard users.

### Alt V53.8 Error Clarity Pass

> Fallbacks should be clear and actionable when something fails.

### Alt V53.9 Performance Pass

> Maintain performance baseline. Avoid load and interaction regressions.

### Alt V53.10 Structure Longevity Pass

> Favor structures that make sense after years of updates.

---

### Alt V54.1 Executive Scan Pass

> Optimize for 30-second scan: issue, ask, proof, stakes visible immediately.

### Alt V54.2 Lawmaker Briefing Pass

> A lawmaker could use this as a briefing without additional context.

### Alt V54.3 Hospital Leader Pass

> Hospital leaders should find state stakes and community benefit immediately useful.

### Alt V54.4 Freshness Visibility Pass

> Dates and freshness cues: visible enough to matter, subtle enough not to distract.

### Alt V54.5 Print Resolution Pass

> Map and charts at sufficient resolution for professional distribution.

### Alt V54.6 Share Intent Pass

> Share/copy flow should feel intentional and complete.

### Alt V54.7 State Note Quality Pass

> Every state note should add interpretation.

### Alt V54.8 Section Transition Pass

> Transitions between sections should feel deliberate.

### Alt V54.9 Maintenance Checklist Pass

> Clear checklist for common update scenarios.

### Alt V54.10 Overhaul Documentation Pass

> Document key overhaul decisions for future maintainers.

---

### Alt V55.1 Value Density Pass

> Increase useful information per unit of surface area.

### Alt V55.2 Claim Precision Pass

> Every claim precise enough to defend under scrutiny.

### Alt V55.3 Proof Proximity Pass

> Proof as close as possible to the claim it supports.

### Alt V55.4 Reader Path Pass

> Map ideal path from first view to understanding. Remove obstacles.

### Alt V55.5 Print Credibility Pass

> PDF should look worth circulating, not a web dump.

### Alt V55.6 State Value Pass

> Each state click should feel like a gain.

### Alt V55.7 Metric Clarity Pass

> Every metric needs a clear "so what."

### Alt V55.8 Hierarchy Durability Pass

> Hierarchy should survive copy, data, and layout changes.

### Alt V55.9 Maintenance Safety Pass

> Reduce risk of errors from hurried maintainers.

### Alt V55.10 Maturity Gate Pass

> Before new features, ensure existing ones are fully mature.

---

### Alt V56.1 Skeptical Reader Pass

> Assume skepticism. Strengthen trust-earning surfaces.

### Alt V56.2 Cold Start Pass

> Reader with no context should understand issue and ask in one pass.

### Alt V56.3 Evidence Ranking Pass

> Rank evidence by persuasive value. Strongest gets most prominence.

### Alt V56.4 PDF Standalone Pass

> PDF should stand alone as executive deliverable.

### Alt V56.5 State Consistency Pass

> State narratives consistent in tone, depth, usefulness.

### Alt V56.6 Source Attribution Pass

> Every claim needing a source has one. Every source attributable.

### Alt V56.7 Section Challenge Pass

> Challenge each section: merge, shorten, or retire?

### Alt V56.8 Interaction Feedback Pass

> Every interaction gives clear feedback.

### Alt V56.9 Maintenance Path Pass

> Maintainers know exactly where and how to update each content type.

### Alt V56.10 Prompt Hygiene Pass

> Retire solved, duplicated, or obsolete prompts.

---

### Alt V57.1 Audience Balance Pass

> Rebalance for lawmakers, leaders, administrators.

### Alt V57.2 Ask Prominence Pass

> HAP ask impossible to miss for attentive reader.

### Alt V57.3 State Utility Pass

> Every state offers something useful when selected.

### Alt V57.4 Evidence Sufficiency Pass

> Enough evidence for main claims. Do not over-claim.

### Alt V57.5 Print Sequence Pass

> Printed page order tells coherent story.

### Alt V57.6 Trust Placement Pass

> Trust signals visible where they matter most.

### Alt V57.7 Copy Economy Pass

> Fewest words that preserve meaning.

### Alt V57.8 Layout Priority Pass

> Layout reflects real priority.

### Alt V57.9 Update Safety Pass

> Common updates low-risk and well-documented.

### Alt V57.10 Product Calm Pass

> Product feels finished and calm.

---

### Alt V58.1 Executive Distribution Pass

> Optimize for circulation upward without creator present.

### Alt V58.2 Lawmaker Utility Pass

> Lawmaker finds policy case and state stakes immediately useful.

### Alt V58.3 Hospital Relevance Pass

> Hospital leaders see their stakes clearly.

### Alt V58.4 Evidence Placement Pass

> Strongest evidence where skeptics look first.

### Alt V58.5 Print Quality Pass

> PDF meets professional typography, spacing, clarity standards.

### Alt V58.6 Share Context Pass

> Shared links preserve useful context when possible.

### Alt V58.7 State Note Utility Pass

> State notes answer "why does this matter?"

### Alt V58.8 Section Flow Pass

> Sections flow logically. Each sets up the next.

### Alt V58.9 Doc Accuracy Pass

> Documentation accurate, discoverable, sufficient.

### Alt V58.10 Regression Prevention Pass

> Protect surfaces most likely to regress.

---

### Alt V59.1 Value Retention Pass

> Preserve overhaul's best improvements.

### Alt V59.2 Claim Defensibility Pass

> Every claim defensible under scrutiny.

### Alt V59.3 Proof Quality Pass

> Fewer, stronger proof surfaces.

### Alt V59.4 Reader Outcome Pass

> Reader leaves informed, persuaded, clear on ask.

### Alt V59.5 Print Independence Pass

> PDF explains itself.

### Alt V59.6 State Coherence Pass

> State selection feels like coherent exploration.

### Alt V59.7 Source Credibility Pass

> Sources credible, current, clearly attributed.

### Alt V59.8 Section Purpose Pass

> Every section has clear purpose.

### Alt V59.9 Maintenance Simplicity Pass

> Keep maintenance model simple.

### Alt V59.10 Prompt Restraint Pass

> Add prompts only for genuine, unsolved weakness.

---

### Alt V60.1 Completion Gate Pass

> Assess readiness for sustained use with minimal further change.

### Alt V60.2 Maturity Checklist Pass

> What must be true for "done enough"?

### Alt V60.3 Handoff Readiness Pass

> Product and docs support clean handoff.

### Alt V60.4 Evidence Completeness Pass

> All major claims have adequate evidence.

### Alt V60.5 Print Final Pass

> PDF worthy of executive circulation.

### Alt V60.6 State Coverage Pass

> State coverage complete and consistent.

### Alt V60.7 Source Maintenance Pass

> Document how and when to update sources.

### Alt V60.8 Section Final Pass

> Every section earns its place.

### Alt V60.9 Maintenance Sustainability Pass

> Maintenance model sustainable for years.

### Alt V60.10 Prompt Library Final Pass

> Library reflects current state. Retire obsolete. Document learnings.

---

## Prompts v61

### V61.1 Two-Page Print Discipline Pass

> The PDF must fit exactly two pages. Every element must justify its presence. Remove or compress until the document is polished and dense.

### V61.2 White Space Elimination Pass

> Treat print white space as waste. Use margins, padding, and font size to maximize information density without sacrificing readability.

### V61.3 Print Hierarchy Pass

> Page 1: issue, ask, map, selected state. Page 2: state summary, KPIs, sources. No other structure.

### V61.4 Pharma Presentation Pass

> The PDF should look like a document a pharma or hospital executive would circulate without apology.

### V61.5 CEO Handoff Pass

> A CEO could forward this PDF to a board member or lawmaker without adding context.

### V61.6 Print Typography Pass

> Print typography should reinforce hierarchy. Smaller fonts for supporting material, clear labels for key numbers.

### V61.7 Map Print Value Pass

> The map must render clearly in print and remain the visual centerpiece of page 1.

### V61.8 Source Credibility Print Pass

> Sources and dates must be visible in print without cluttering the narrative.

### V61.9 State Summary Compression Pass

> The print state list should be reference material, not a competing narrative. Compress aggressively.

### V61.10 Print Regression Guard Pass

> Any change to print CSS must preserve the 2-page constraint. Add comments to document the layout logic.

---

## Prompts v62

### V62.1 Executive Scan Speed Pass

> A 15-second scan should yield: what is 340B, what does HAP want, what is the national picture, what is the PA stake.

### V62.2 Claim-to-Evidence Proximity Pass

> No claim should be more than one glance away from its supporting evidence.

### V62.3 Metric Meaning Pass

> Every metric answers "so what?" immediately. No orphan numbers.

### V62.4 State Selection Value Pass

> Every state click should feel like a gain in understanding, not a UI exercise.

### V62.5 Copy Brevity Pass

> Cut every word that does not carry meaning. Brevity increases authority.

### V62.6 Trust Signal Placement Pass

> Dates and sources should appear where skeptical readers will look.

### V62.7 Section Necessity Pass

> If a section were removed, would the dashboard be less convincing? If not, compress or retire it.

### V62.8 Print Flow Pass

> Page 1 to page 2 should read as one coherent argument, not two disconnected screens.

### V62.9 Maintenance Path Pass

> A maintainer should know exactly which file to edit for each type of change.

### V62.10 Product Calm Pass

> The dashboard should feel finished, not in development. No half-implemented surfaces.

---

## Prompts v63

### V63.1 Audience Balance Pass

> Rebalance for lawmakers, hospital CEOs, and administrators. No single audience should dominate.

### V63.2 Ask Prominence Pass

> The HAP ask should be impossible to miss and easy to recall.

### V63.3 Evidence Sufficiency Pass

> Enough evidence to support claims. No over-claiming.

### V63.4 Print Independence Pass

> The PDF must stand alone. No "see the live site" required.

### V63.5 State Note Utility Pass

> Every state note should add interpretation, not restate data.

### V63.6 Source Hierarchy Pass

> Clarify which sources matter most. Avoid flat citation lists.

### V63.7 Section Transition Pass

> Transitions between sections should feel deliberate.

### V63.8 Interaction Feedback Pass

> Every interaction should give clear feedback.

### V63.9 Update Safety Pass

> Common updates (new law, date change) should be low-risk.

### V63.10 Maturity Gate Pass

> Before adding features, ensure existing ones are fully mature.

---

## Prompts v64

### V64.1 Value Density Pass

> Increase useful information per unit of surface area.

### V64.2 Claim Precision Pass

> Every claim precise enough to defend under scrutiny.

### V64.3 Proof Proximity Pass

> Proof as close as possible to the claim it supports.

### V64.4 Reader Path Pass

> Map the ideal path from first view to understanding. Remove obstacles.

### V64.5 Print Credibility Pass

> The PDF should look worth circulating, not a web dump.

### V64.6 State Value Pass

> Each state click should feel like a gain.

### V64.7 Metric Clarity Pass

> Every metric needs a clear "so what."

### V64.8 Hierarchy Durability Pass

> Hierarchy should survive copy, data, and layout changes.

### V64.9 Maintenance Safety Pass

> Reduce risk of errors from hurried maintainers.

### V64.10 Overhaul Preservation Pass

> Document key decisions so future maintainers do not undo them.

---

## Prompts v65

### V65.1 Skeptical Reader Pass

> Assume the next reader is skeptical. Strengthen trust-earning surfaces.

### V65.2 Cold Start Pass

> A reader with no context should understand the issue and ask in one pass.

### V65.3 Evidence Ranking Pass

> Rank evidence by persuasive value. Strongest gets most prominence.

### V65.4 PDF Standalone Pass

> The PDF should stand alone as an executive deliverable.

### V65.5 State Consistency Pass

> State narratives consistent in tone, depth, usefulness.

### V65.6 Source Attribution Pass

> Every claim needing a source has one. Every source attributable.

### V65.7 Section Challenge Pass

> Challenge each section: merge, shorten, or retire?

### V65.8 Interaction Clarity Pass

> Every interaction gives clear feedback.

### V65.9 Maintenance Path Clarity Pass

> Maintainers know exactly where and how to update each content type.

### V65.10 Prompt Hygiene Pass

> Retire solved, duplicated, or obsolete prompts.

---

## Prompts v66

### V66.1 Executive Distribution Pass

> Optimize for circulation upward without the creator present.

### V66.2 Lawmaker Utility Pass

> A lawmaker should find the policy case and state stakes immediately useful.

### V66.3 Hospital Leader Relevance Pass

> Hospital leaders should see their stakes clearly.

### V66.4 Evidence Placement Pass

> Strongest evidence where skeptics look first.

### V66.5 Print Quality Pass

> The PDF should meet professional standards for typography, spacing, and clarity.

### V66.6 Share Context Pass

> Shared links should preserve useful context when possible.

### V66.7 State Note Quality Pass

> State notes should answer "why does this matter?"

### V66.8 Section Flow Pass

> Sections should flow logically. Each sets up the next.

### V66.9 Documentation Accuracy Pass

> Documentation should be accurate, discoverable, and sufficient.

### V66.10 Regression Prevention Pass

> Protect surfaces most likely to regress.

---

## Prompts v67

### V67.1 Value Retention Pass

> Preserve the overhaul's best improvements.

### V67.2 Claim Defensibility Pass

> Every claim defensible under scrutiny.

### V67.3 Proof Quality Pass

> Prefer fewer, stronger proof surfaces.

### V67.4 Reader Outcome Pass

> Reader leaves informed, persuaded, clear on the ask.

### V67.5 Print Independence Pass

> The PDF explains itself.

### V67.6 State Coherence Pass

> State selection should feel like coherent exploration.

### V67.7 Source Credibility Pass

> Sources credible, current, clearly attributed.

### V67.8 Section Purpose Pass

> Every section has clear purpose.

### V67.9 Maintenance Simplicity Pass

> Keep the maintenance model simple.

### V67.10 Prompt Restraint Pass

> Add prompts only for genuine, unsolved weakness.

---

## Prompts v68

### V68.1 Completion Gate Pass

> Assess readiness for sustained use with minimal further change.

### V68.2 Maturity Checklist Pass

> What must be true for "done enough"?

### V68.3 Handoff Readiness Pass

> Product and docs support clean handoff.

### V68.4 Evidence Completeness Pass

> All major claims have adequate evidence.

### V68.5 Print Final Pass

> The PDF should be worthy of executive circulation.

### V68.6 State Coverage Pass

> State coverage complete and consistent.

### V68.7 Source Maintenance Pass

> Document how and when to update sources.

### V68.8 Section Final Pass

> Every section earns its place.

### V68.9 Maintenance Sustainability Pass

> The maintenance model should be sustainable for years.

### V68.10 Prompt Library Final Pass

> The library should reflect the product's current state. Retire obsolete prompts. Document learnings.

---

## Prompts v69

### V69.1 Two-Page Enforcement Pass

> Enforce the 2-page print constraint. No exceptions. Compress until it fits.

### V69.2 Print Polish Pass

> The PDF should look polished enough for a board packet or lawmaker briefing.

### V69.3 Density Without Clutter Pass

> Maximize information density without creating visual clutter.

### V69.4 Executive First Impression Pass

> The first 5 seconds of viewing the PDF should establish credibility.

### V69.5 Source Visibility Pass

> Sources and dates visible enough to matter, subtle enough not to distract.

### V69.6 Map Clarity Pass

> The map should be immediately interpretable in print.

### V69.7 KPI Legibility Pass

> Every KPI should be legible and meaningful in print.

### V69.8 State Summary Utility Pass

> The state summary should serve as reference, not narrative.

### V69.9 Print Consistency Pass

> Print layout should be consistent across browsers.

### V69.10 Future Print Safety Pass

> Document print layout decisions so future edits do not break the 2-page constraint.

---

## Prompts v70

### V70.1 Product Maturity Pass

> The dashboard should feel mature: few surprises, tight trust signals, clean evidence.

### V70.2 Reader Outcome Pass

> Future changes should increase the chance readers leave informed, persuaded, and clear on the ask.

### V70.3 Maintenance Calm Pass

> The repo should feel calm to update, not merely documented.

### V70.4 Print Confidence Pass

> Confidence in the PDF as an executive deliverable that can stand alone.

### V70.5 Source Credibility Depth Pass

> Source trust through depth and placement, not repetition.

### V70.6 Structural Longevity Pass

> Favor structures that remain strong across years of edits.

### V70.7 Backlog Severity Pass

> Keep the backlog severe about what deserves attention next.

### V70.8 End-of-Wave Restraint Pass

> When the product is stronger, let the prompt system become quieter.

### V70.9 Two-Page Legacy Pass

> The 2-page print constraint is a product commitment. Preserve it.

### V70.10 Pharma CEO Presentable Pass

> The dashboard and PDF should be presentable to pharma and hospital executives without caveats.
