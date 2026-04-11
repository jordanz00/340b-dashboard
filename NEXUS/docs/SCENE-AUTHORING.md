# WebGL scene authoring (NEXUS)

## Contract

- Scenes are registered with `NX.registerScene({ n, c, fs, tags?, cost?, rx? })` after `NX.HEAD` is available (`js/scenes.js`).
- `fs` must be a single concatenated GLSL **fragment** body: `NX.HEAD + '<your shader main>'` using the same pattern as `js/scenes/cosmic.js`.
- Uniforms and helpers come from `NX.HEAD` (`R`, `T`, `B`, `M`, `H`, `BT`, `PAL`, `fbm`, `pal`, `blinnPhong`, etc.).

## Cost tags (`cost`)

| Value | Meaning |
|-------|---------|
| `low` | Tier A — target ≤ **64** raymarch steps, minimal texture taps in-loop |
| `med` | Default / mixed |
| `high` | Tier B — heavier loops; expect desktop or perf lock |

## Tiers

- **Tier A (mobile-safe):** 48–64 march steps, avoid dependent-loop explosions, keep `texture2D` samples outside hot loops where possible.
- **Tier B:** Higher step counts; validate with **Perf lock** / **Adaptive** (`js/engine.js`) on target hardware.

## iOS

- Prefer **instant scene cuts** (`S._iosInstantSceneChange`); avoid long cross-morph stacks on WebKit.
- Test on real devices after adding scenes: `NX.compileScenes()` must report all OK.

## Particle-style looks (WebGL1)

Use analytic density (noise + SDF), “swarm” min-of-spheres, or flow-warped domains — not GPU instancing.

## References

- `VISUAL-TECH-ROADMAP.md` — suite direction  
- `js/scenes/scenes-pro-wave.js` — batch example with `cost` + tags  
