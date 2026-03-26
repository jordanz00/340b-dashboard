# Performance Agent

## Goal

Smooth scroll and animation: prefer `transform`/`opacity`, passive listeners, rAF batching in `340b.js`.

## Note

Do **not** globally monkey-patch `window.addEventListener` (breaks nav and libraries). Use `utils/performance-patch.js` for safe hints only.
