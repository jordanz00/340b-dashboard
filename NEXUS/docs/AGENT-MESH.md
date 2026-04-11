# NEXUS parallel agent mesh (merge discipline)

## Purpose

Coordinate risky changes across **renderer**, **WebGPU/WGSL**, **post/composite**, **audio→GPU**, **perf/mobile**, and **interop** lanes without single-agent blind spots.

## Lanes (scope template)

Each change should file:

- **Scope:** files + user-visible behaviour  
- **Data / audio:** any new drivers for `beatVisual`, FFT, or BC intensity  
- **Safari/iOS risk:** instant cuts, memory, WebGPU absence  
- **Fallback:** what still works when the feature is off  

### Lane → typical files (not exhaustive)

| Lane | Owns | Watch |
|------|------|--------|
| **Renderer** | `engine.js`, `scenes.js`, `js/scenes/*`, scene pads / `NX.showName` | Morph FBO ping-pong, `resolveSceneIndex`, context loss |
| **WebGPU / WGSL** | `nexus-engine/wgsl-graph.js`, `#nx-wgpu` | Half-res default on touch; `setEnabled(false)` on throw |
| **Post / composite** | `post.js`, Show bypass flags on `S.postChain` | Bloom/grade when WGSL or BC toggles |
| **Audio → GPU** | `audio.js`, `nexus-engine/audio-engine.js`, `bc-morph-conductor.js` | `beatVisual` / energy must stay bounded 0–1 |
| **Perf / mobile** | `engine.js` adaptive FPS, `S._iosInstantSceneChange`, quality presets | Never drop `requestAnimationFrame` registration |
| **Interop** | `midi.js`, `clip-layers.js`, `show-workbench.js`, recording | JSON import validation; `MediaRecorder` after renderer edits |

## Merge checklist (human gate before risky merges)

**P0 — block merge if any fail**

1. **rAF survival:** main loop still schedules `requestAnimationFrame` after errors inside `loop` (existing `try/catch` around frame body).  
2. **Context / WebGPU:** `webglcontextlost` path or manual test: tab recovers or shows a clear state; WGSL failures disable rack without blanking WebGL.  
3. **iOS:** instant scene change default intact where applicable; no new continuous morph storms on coarse pointer.  
4. **Security:** no unsafe DOM with user/MIDI/import strings; no new remote script loads on BASIC-style constraints (NEXUS is still browser-first).  
5. **Data honesty:** no invented stats in product copy tied to this repo.

**P1 — fix before release if not same PR**

1. **Soak spot:** desktop 30–60 min + iOS 15 min per `SOAK-PROTOCOL.md` / `SOAK-GATES.md`.  
2. **Transition matrix:** pads + MIDI + clip load + record toggle once.  
3. **Session seed:** `?seed=` / `NX.SessionSeed` still drives `NX.randomUnit` after your change.

## Cross-validator checklist

1. **Data:** no invented stats; session seed behaviour documented.  
2. **Security:** no `innerHTML` with user strings; validate imports (MIDI JSON).  
3. **Perf:** WGSL half-res default on touch; scene compile count stable.  
4. **QA:** `NX.compileScenes()` success = scene count; print/share not broken.  

## Alignment

See `VISUAL-TECH-ROADMAP.md` and `PROFESSIONAL-TEST-OUTLINE.md` for staged delivery.  
For the original multi-lane wave description, see the Cursor plan **nexus_parallel_agent_mesh** (local plans folder — not committed).
