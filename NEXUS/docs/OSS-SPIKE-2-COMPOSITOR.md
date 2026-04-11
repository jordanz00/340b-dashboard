# OSS spike #2 — second compositor (Hydra / regl / ogl)

## Goal

Assess whether a **second** full GPU compositor adds enough unique aesthetic value to justify bundle size, maintenance, and interaction with the existing NEXUS pipeline (`engine.js` FBOs, `post.js`, Butterchurn canvas, optional `wgsl-graph.js`).

## Decision (v1.0)

**Do not merge** Hydra, regl, or ogl as a second compositor for the initial professional release.

## Rationale

1. **GPU budget:** NEXUS already runs WebGL scene passes, post chain (bloom, trails, kaleido, glitch), Butterchurn on `#c-bc`, optional WebGPU sampling, and show layers. A Hydra-style feedback loop is another sustained full-frame cost; mobile Safari is already constrained (`_iosInstantSceneChange`, DPR caps).
2. **Coherence:** The product differentiator is **stacked, tour-controllable** output, not maximal shader novelty. A second engine risks inconsistent color grading and double latency unless heavily post-processed.
3. **Bundle / CSP:** Hydra pulls a large dependency graph; static hosting favors **lazy** optional modules. A future spike should be feature-flagged and loaded only after explicit operator opt-in, with a **hard** perf lock default on iOS.
4. **Existing outlet for “more GPU”:** Extend [`../js/nexus-engine/wgsl-graph.js`](../js/nexus-engine/wgsl-graph.js) nodes and DNA-driven uniforms (`session-seed.js`) before importing another engine.

## When to revisit

- A **paid** tier needs a clearly distinct “livecode” aesthetic Hydra provides, **and** legal/bundle review is complete.
- A **single** regl/ogl micro-pass is needed for one effect (particles) **without** owning the full frame — implement as a **small** FBO blit into the existing chain, not a parallel product.

## References

- [hydra-synth/hydra](https://github.com/hydra-synth/hydra) — live coding visuals; MIT license; high integration cost.
- [regl-project/regl](https://github.com/regl-project/regl) — functional WebGL; MIT.
- [oframe/ogl](https://github.com/oframe/ogl) — minimal WebGL; MIT.
