# Live soak protocol (measurable resilience)

**Pass/fail columns:** see `SOAK-GATES.md`. **Console cadence:** add `?soak=1` to the URL for minute-level `[NEXUS][soak]` markers.

## Framing

Browsers cannot honestly promise “never crash.” The bar is **recovery** (context restore), **stable rAF** (no uncaught errors in the loop), and **graceful degradation** on iOS.

## Desktop soak (example: 2h)

**Setup**

- Chrome or Edge, discrete GPU preferred.  
- Enable **Cycle** or **AI DIR** + moderate **Auto morph** (Aurora).  
- Optionally enable **WGSL** half-res or full-res.  

**Watch**

- DevTools **Performance** — long tasks, JS heap growth.  
- `webglcontextlost` / `webglcontextrestored` on `#c`.  
- FPS / `S._emaFps` via FPS overlay (backtick).  

**Pass criteria**

- No permanent blank canvas after stress.  
- No runaway memory (> ~2× steady state without user action).  
- rAF continues (tab visible); acceptable drops when backgrounded per browser policy.

## iOS soak (shorter, e.g. 30–45 min)

- Use **instant scene changes** default.  
- Rotate scenes via pads + mic on/off.  
- Watch for thermal dimming and WebKit GPU resets.

## Transition matrix (spot checks)

- Same scene → adjacent → random rapid pads.  
- MIDI CC flood while morphing (desktop).  
- Clip load during scene change.  
- **Record** while toggling present mode and panel visibility.

## Recording note

`MediaRecorder` + composite canvas is a **fragile** surface — always test profile changes (native vs 1080p) after renderer edits.
