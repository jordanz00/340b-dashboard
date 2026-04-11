'use strict';
/**
 * @file procedural-visual-drive.js
 * @summary Slow procedural motion and color evolution for NEXUS: incommensurate LFOs,
 *   rare target re-picks from the session RNG, and vectors for post-grade + CSS ambient.
 *
 * @role
 * Intentionally avoids beat-synced strobing; all rates are sub-audio and smoothed so the
 * image feels continuously unique rather than repetitive or frantic.
 *
 * @dependencies `NX.S`, `NX.SessionSeed` / DNA (after `session-seed.js`). Hooks `_onChange`
 *   so re-seeding the session reshuffles procedural phases.
 *
 * @see `post.js` uniform `PC`, `modern-visual-stack.js`, `procedural-particles.js`
 */
(function () {
  if (!NX.S) {
    NX.ProceduralDrive = {
      tick: function () { },
      getPostColorVec: function () { return [0, 0.5, 0.55, 0]; },
      getAmbientDeltas: function () { return { dh: 0, dc: 0, dl: 0 }; },
      reseed: function () { }
    };
    return;
  }

  var S = NX.S;
  var GOLD = 0.618033988749895;
  var TWO_PI = 6.283185307179586;

  /** @type {number[]} Current display channels (smoothly follow targets). */
  var cur = [0, 0.5, 0.55, 0];
  /** @type {number[]} Random-walk targets in ~0–1 space (mapped per channel). */
  var tgt = [0.5, 0.5, 0.5, 0.5];
  /** @type {number[]} Integration phases (radians), seeded from DNA. */
  var phase = [0, 0, 0, 0];
  /** @type {number[]} Angular rates (rad/s), irrational-ish mix so loops are very long. */
  var rate = [0.031, 0.047, 0.073, 0.019];
  var tAccum = 0;
  var nextPick = 0;
  var reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /**
   * Hash two integers to [0,1) — deterministic noise sample (no allocation).
   * @param {number} ix
   * @param {number} iy
   * @param {number} salt
   * @returns {number}
   */
  function hash01(ix, iy, salt) {
    var s = Math.sin((ix * 127.1 + iy * 311.7 + salt) * 0.024 + (S.sessionSeed || 1) * 1e-6) * 43758.5453123;
    return s - Math.floor(s);
  }

  /**
   * Picks new distant targets using session RNG so each run and each reroll feels unique.
   * @returns {void}
   */
  function pickTargets() {
    var rnd = typeof NX.randomUnit === 'function' ? NX.randomUnit : Math.random;
    tgt[0] = rnd();
    tgt[1] = rnd();
    tgt[2] = rnd();
    tgt[3] = rnd();
    nextPick = tAccum + 40 + rnd() * 55;
  }

  /**
   * Re-derive angular rates and phases from `S.dna*` after seed / preset changes.
   * @returns {void}
   */
  function reseed() {
    var dx = typeof S.dnaX === 'number' ? S.dnaX : 0.5;
    var dy = typeof S.dnaY === 'number' ? S.dnaY : 0.5;
    var dz = typeof S.dnaZ === 'number' ? S.dnaZ : 0.5;
    var dw = typeof S.dnaW === 'number' ? S.dnaW : 0.5;
    phase[0] = TWO_PI * dx;
    phase[1] = TWO_PI * dy * GOLD;
    phase[2] = TWO_PI * dz * (1 - GOLD * 0.5);
    phase[3] = TWO_PI * dw * 0.73;
    rate[0] = 0.019 + dz * 0.034;
    rate[1] = 0.027 + dw * 0.041;
    rate[2] = 0.035 + dx * 0.038;
    rate[3] = 0.014 + dy * 0.022;
    rate[0] *= 0.48; rate[1] *= 0.48; rate[2] *= 0.48; rate[3] *= 0.48;
    if (reducedMotion) {
      rate[0] *= 0.22; rate[1] *= 0.22; rate[2] *= 0.22; rate[3] *= 0.22;
    }
    pickTargets();
    cur[0] = (tgt[0] - 0.5) * 0.14;
    cur[1] = 0.42 + tgt[1] * 0.2;
    cur[2] = 0.48 + tgt[2] * 0.38;
    cur[3] = tgt[3] * TWO_PI;
  }

  /**
   * Advances slow phases, occasionally re-rolls targets, eases `cur` toward smoothed LFO sum.
   * @param {number} dt — seconds
   * @returns {void}
   */
  function tick(dt) {
    if (!dt || dt > 0.12) dt = 0.016;
    tAccum += dt;
    var calm = S.nexusPerfLock ? 0.55 : 1;
    if (reducedMotion) calm *= 0.35;
    var i;
    for (i = 0; i < 4; i++) {
      phase[i] += dt * rate[i] * calm * (0.94 + 0.06 * Math.sin(tAccum * 0.0088 + i));
    }
    if (tAccum >= nextPick) pickTargets();

    var lfo0 = Math.sin(phase[0]) * 0.5 + Math.sin(phase[1] * GOLD + 1.1) * 0.35;
    var lfo1 = Math.sin(phase[2] * 0.91 + 0.4) * 0.5 + Math.sin(phase[3] + phase[0] * 0.31) * 0.32;
    var lfo2 = Math.sin(phase[1] + phase[2] * 0.67) * 0.45 + Math.sin(phase[3] * 1.09) * 0.28;

    var want0 = (tgt[0] - 0.5) * 0.14 + lfo0 * 0.088;
    var want1 = 0.35 + tgt[1] * 0.3 + lfo1 * 0.095;
    var want2 = 0.38 + tgt[2] * 0.42 + lfo2 * 0.11;
    var want3 = phase[3] * 0.48 + tAccum * 0.056;

    var alpha = 1 - Math.exp(-dt * (reducedMotion ? 0.85 : 1.25));
    cur[0] += (want0 - cur[0]) * alpha;
    cur[1] += (want1 - cur[1]) * alpha;
    cur[2] += (want2 - cur[2]) * alpha;
    cur[3] += (want3 - cur[3]) * alpha * 0.85;

    S.procHue = cur[0];
    S.procSat = cur[1];
    S.procLift = cur[2];
    S.procPhase = cur[3];
  }

  /**
   * vec4 for `post.js` OUTPUT_FS `PC`: hue drift (turns), saturation bias 0–1, micro-noise gain, phase.
   * @returns {number[]}
   */
  function getPostColorVec() {
    return [cur[0], cur[1], cur[2], cur[3]];
  }

  /**
   * Small additive offsets for OKLCH/HSL ambient custom properties (degrees / chroma / lightness).
   * @returns {{ dh: number, dc: number, dl: number }}
   */
  function getAmbientDeltas() {
    if (reducedMotion) return { dh: 0, dc: 0, dl: 0 };
    var h = Math.sin(phase[0] * 0.58 + cur[3] * 0.1) * 19 + Math.sin(phase[2] * 0.35) * 12;
    var c = Math.sin(phase[1] + cur[0] * 4.2) * 0.024 + Math.sin(phase[3] * 0.28) * 0.015;
    var l = Math.sin(phase[2] * 0.44 + 0.7) * 0.018 + Math.sin(phase[0] * 0.24) * 0.011;
    return { dh: h, dc: c, dl: l };
  }

  reseed();

  if (NX.SessionSeed) {
    var prevOnChange = NX.SessionSeed._onChange;
    NX.SessionSeed._onChange = function (seed) {
      if (typeof prevOnChange === 'function') {
        try { prevOnChange(seed); } catch (e0) { /* ignore */ }
      }
      reseed();
      if (NX.ProcParticles && typeof NX.ProcParticles.reseed === 'function') {
        try { NX.ProcParticles.reseed(); } catch (e1) { /* ignore */ }
      }
    };
  }

  NX.ProceduralDrive = {
    tick: tick,
    getPostColorVec: getPostColorVec,
    getAmbientDeltas: getAmbientDeltas,
    reseed: reseed
  };
})();
