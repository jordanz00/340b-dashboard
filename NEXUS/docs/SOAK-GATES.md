# Soak gates (pass / fail)

Companion to `SOAK-PROTOCOL.md`. Use this for **merge/release** decisions instead of vague “it felt fine.”

## Instrumentation

Append **`?soak=1`** to the app URL (same origin as assets). The engine sets `window.__NX_SOAK__` and logs **`[NEXUS][soak]`** about once per minute with:

- elapsed seconds since boot  
- frame count since boot  
- `S._emaFps` (smoothed FPS estimate)

Use DevTools console with **Preserve log** for long runs.

## Pass gates (desktop example: ≥ 2 h, tab visible)

| Gate | Pass | Fail |
|------|------|------|
| **rAF continuity** | `requestAnimationFrame` keeps firing; soak log lines appear every ~60s | Log stops while tab is still visible and machine awake |
| **WebGL context** | No unrecoverable blank after stress; if `webglcontextlost` fires, restore path or reload is acceptable per product | Stuck black canvas with no user path |
| **JS heap** | Heap stable within ~2× steady state after warm-up (no unbounded climb) | Steady climb to tab crash OOM |
| **WGSL rack** | With rack on: no uncaught errors escaping `loop`; rack can disable itself on error | Main thread exceptions outside guarded blocks |

## Pass gates (iOS / WebKit: 30–45 min)

| Gate | Pass | Fail |
|------|------|------|
| **Thermal** | FPS may dip under thermal throttle but rAF continues | Tab killed or canvas permanently frozen |
| **Scene changes** | Instant cuts remain usable; pads responsive | Long hangs on scene hop |

## Optional automated note

Soak mode does **not** assert “zero dropped frames” (browsers throttle background tabs). Assertions are **human + console evidence** for visible-tab runs.
