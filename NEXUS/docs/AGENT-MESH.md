# NEXUS — Parallel agent mesh (GPU / browser CGI)

Repeatable process: **parallel specialist lanes** propose scoped changes, then **CrossValidator (N9)** dedupes and ranks, then **Security/Regression gate (N10)** flags merge blockers. Aligns with [VISUAL-TECH-ROADMAP.md](./VISUAL-TECH-ROADMAP.md).

**Cursor workflow:** Run 3–7 parallel chats using the lane prompts below; paste outputs as JSON proposals; run one **validator** pass using the rubric; apply only **approved** items after human sign-off.

**Node workflow:** From repo root: `node NEXUS/agents/run-nexus-waves.js` (writes logs under [NEXUS/data/archive/](../data/archive/)).

---

## Roadmap phase map (every proposal must cite one)

| Phase | Meaning | Typical lanes |
|-------|---------|----------------|
| **Now** | WebGL1 scenes, post, hybrid, audio→GPU contract, noise/FBM | WebGL1/WebGL2 lane (GL1 only), Post+composite, Audio→GPU, Perf+mobile |
| **Phase 2+** | WebGPU/WGSL parallel path, optional compute-style upgrades | WebGPU/WGSL, Renderer strategy |
| **Future** | Large refactors after benchmarks prove need | WebGL2 migration, OffscreenCanvas worker |

See roadmap table rows **#1–#10** in [VISUAL-TECH-ROADMAP.md](./VISUAL-TECH-ROADMAP.md); each lane lists which rows it owns in **Lane roster** below.

---

## Lane roster

Each lane delivers proposals with: **scope**, **target files**, **phase**, **Safari/iOS risk**, **feature detection + fallback**, **success metrics** (link [BENCHMARK-HARNESS.md](./BENCHMARK-HARNESS.md)).

| Lane | Role | Roadmap rows | Primary files |
|------|------|--------------|---------------|
| **N1 — Renderer strategy** | Phased dual renderer vs big-bang; ADR-style decisions | 1, 2, 8 | `docs/VISUAL-TECH-ROADMAP.md`, `docs/adr-*.md` |
| **N2 — WebGPU / WGSL** | Optional WGSL chain; Chrome-first; degrade off | 1 | `js/nexus-engine/wgsl-graph.js`, `index.html` Show tab |
| **N3 — WebGL1 / WebGL2** | New GL1 scenes; optional GL2 migration plan per scene | 2, 3, 4, 9, 10 | `js/engine.js`, `js/scenes.js`, `js/scenes/*.js` |
| **N4 — Post + hybrid composite** | Bloom/trails/grade vs Aurora; failure isolation | 6, 7 | `js/post.js`, `js/engine.js` |
| **N5 — Audio → GPU** | `AU` texture, uniforms, band semantics for new shaders | 5 | `js/audio.js`, `js/scenes.js` `HEAD` |
| **N6 — Performance + mobile** | DPR, adaptive quality, iOS profile, rAF discipline | 3, 4, 8 (perf aspect) | `js/engine.js` |
| **N7 — Standards + interop** | WebGPU matrix, reduced-motion, MediaRecorder, color | 1, 8 | `README.md`, `docs/` |

---

## Peer challenge (before validator)

Each lane’s batch **must** include a `peerConflicts` array: at least **two** entries naming other lane IDs and the **subsystem** at risk (e.g. N2 vs N3: “who owns primary render loop”).

---

## Proposal JSON schema

Use this shape for human or tool-generated proposals (Node agents use the same via `shared-nexus.js`).

```json
{
  "id": "nexus-unique-id",
  "agentId": "N3-WebGL1",
  "wave": 3,
  "changeType": "spike|refactor|docs|perf|security-review",
  "targetFile": "js/scenes/example.js",
  "description": "One paragraph: what changes and why.",
  "phase": "now|phase2|future",
  "roadmapRows": [4, 9],
  "safariIosRisk": "low|med|high",
  "featureDetectionFallback": "How to detect support and what degrades.",
  "rollback": "How to revert or disable the change.",
  "scores": {
    "productImpact": 1,
    "maintainability": 1,
    "security": 1,
    "performance": 1,
    "safariInterop": 1
  },
  "peerConflicts": [
    { "lane": "N2-WebGPU", "topic": "Render path ownership" }
  ],
  "instructions": ["Stepwise tasks for implementer"],
  "benchmarkNotes": "What to measure before/merge; see BENCHMARK-HARNESS.md"
}
```

**Scores:** integers **1–10** (higher is better). For **security** or **safariInterop**, use **1** only if the proposal is unsafe or breaks Safari without fallback (validator may still list it for awareness but rank it last).

---

## CrossValidator (N9) — rubric

**Weights** (must sum to 1.0):

| Dimension | Weight | Meaning |
|-----------|--------|---------|
| `productImpact` | 0.25 | User-visible quality, differentiation, roadmap fit |
| `maintainability` | 0.20 | Code clarity, dual-path cost, doc cost |
| `security` | 0.20 | DOM safety, URL/fetch allowlists, storage keys |
| `performance` | 0.20 | Frame time, GPU memory, main-thread cost |
| `safariInterop` | 0.15 | Graceful degradation on Safari/iOS |

**Weighted score:**  
`sum(dimensionScore × weight)` using defaults of **5** for missing dimensions.

**Conflict resolution:** Same `targetFile` + same `changeType` → keep **highest** weighted score; loser IDs listed in winner’s `conflictWith` array (mirrors [docs/MULTI_AGENT_SYSTEM.md](../../docs/MULTI_AGENT_SYSTEM.md) Agent 9).

**Output backlog:** P0 = spikes blocking other work; P1 = refactors; P2 = polish. Reject (soft) proposals with `security < 3` or `safariInterop < 3` **without** a documented fallback—flag in report as **blocked**.

---

## Security / regression gate (N10)

Second pass before merge (adapt supervisor S1/Q1):

- [ ] No new `innerHTML` / `eval` with dynamic or user-controlled strings.
- [ ] Recording (`MediaRecorder`) and **Present** mode still work for touched paths.
- [ ] Mic-off / silent path stays calm (no runaway effects).
- [ ] Hybrid + Aurora failure isolation preserved (BC optional path).
- [ ] `localStorage` keys namespaced; no secrets in repo.

---

## Merge checklist (human)

1. Validator report reviewed; conflicts understood.
2. N10 gate passed or exceptions documented.
3. [BENCHMARK-HARNESS.md](./BENCHMARK-HARNESS.md) before/after noted for perf-sensitive changes.
4. [VISUAL-TECH-ROADMAP.md](./VISUAL-TECH-ROADMAP.md) updated if a **phase boundary** changes.

---

## Device matrix (minimum)

| Profile | Browser | Notes |
|---------|---------|--------|
| Desktop reference | Chrome or Edge (current) | WebGPU if testing N2 |
| macOS secondary | Safari (release) | WebGL + audio; WebGPU may be off |
| iOS | Safari | `nexus-ios` caps in engine; touch |
| Budget Android | Chrome | Thermal / GLES limits |

Record **device model + OS + browser version** next to benchmark numbers.

---

## Lane prompt templates (copy into Cursor)

**N1 — Renderer strategy**  
“You are N1. Read NEXUS/docs/VISUAL-TECH-ROADMAP.md and js/engine.js. Propose phased renderer strategy (dual WebGL1 + optional WebGPU vs migration). Output JSON proposals only; each must include phase, safariIosRisk, featureDetectionFallback, peerConflicts.”

**N2 — WebGPU / WGSL**  
“You are N2. Audit js/nexus-engine/wgsl-graph.js and Show tab wiring in index.html. Propose incremental WGSL features with Chrome-first gating and Safari off. JSON proposals per schema in AGENT-MESH.md.”

**N3 — WebGL1 / WebGL2**  
“You are N3. Review js/scenes.js HEAD and one scene file. Propose new GL1 techniques or a scoped GL2 migration spike with per-scene plan. JSON proposals.”

**N4 — Post + hybrid**  
“You are N4. Review js/post.js and engine hybrid flags. Propose post changes that do not duplicate Aurora Field; preserve failure isolation. JSON proposals.”

**N5 — Audio → GPU**  
“You are N5. Trace audio texture updates in audio.js and uniform usage in scenes. Propose contract doc or shader-facing improvements. JSON proposals.”

**N6 — Performance**  
“You are N6. Review engine resize, quality presets, adaptive FPS. Propose measurable perf wins with benchmark plan. JSON proposals.”

**N7 — Standards**  
“You are N7. Build a short compatibility matrix (WebGPU, MediaRecorder, MIDI) for README or docs. JSON proposals for doc updates only unless code change required.”

**N9 — Validator (single thread)**  
“Given this proposal array [paste], apply AGENT-MESH CrossValidator rubric: resolve conflicts, weighted scores, ordered P0–P2 backlog, list blocked items.”

**N10 — Security / regression**  
“Given approved list [paste], run Security/regression gate checklist; output PASS or FAIL per line with evidence.”

---

## Related files

- [VISUAL-TECH-ROADMAP.md](./VISUAL-TECH-ROADMAP.md)
- [BENCHMARK-HARNESS.md](./BENCHMARK-HARNESS.md)
- [NEXUS/agents/run-nexus-waves.js](../agents/run-nexus-waves.js)
- [NEXUS/agents/nexus_prompts.json](../agents/nexus_prompts.json)
