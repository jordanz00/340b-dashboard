# Lessons — 340B dashboard

Patterns to avoid repeating:

- **Mobile map legends:** Use tiered breakpoints (`≤700px`, `≤430px`); a single full-width pill reads as a huge “key” on phones. Stack legend rows and shrink swatches on narrow viewports.
- **CSS cascade:** Avoid duplicate `.dashboard-inner` / `.dashboard main` `max-width` rules late in the file—use `:root` tokens (`--dashboard-inner-max`, `--content-max`) in one place.
- **Safe-area:** Apply horizontal safe-area once on the shell (e.g. `.dashboard-inner`); avoid doubling on nested `main`.
- **PA district map:** Debounce redraw on `visualViewport` resize (iOS URL bar) as well as `window.resize`.
- **Static map fallback:** Dense 5-column state grid needs fewer columns (`≤520px`, `≤400px`) on small phones.
