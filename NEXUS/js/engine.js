'use strict';
/**
 * @file engine.js
 * @summary Core WebGL host for NEXUS: context acquisition, framebuffer pipeline,
 *   uniform/attribute caching, scene render pass, morph blend, adaptive quality,
 *   and the main requestAnimationFrame loop.
 *
 * @role
 * Runs immediately on load (see `index.html` script order). Initializes `window.NX`
 * with the live `WebGLRenderingContext`, shared runtime state (`NX.S`), helpers
 * (`NX.mkProg`, `NX.u`, …), and wires canvas resize + pointer input. Other bundles
 * (`post.js`, `audio.js`, `nexus-engine/*`, `ui.js`) attach to `NX` or `window.NexusEngine`
 * after this file executes.
 *
 * @dependencies (external to this file, loaded by the shell)
 * - DOM: `#c` canvas, optional `#splash`, `#nx-fatal`, `#c-rec`, `#c-bc`, `#nx-wgpu`
 * - `NX.post` / `NX.postProgs` from `post.js` — bloom/grade/composite passes
 * - `NX.audio` from `audio.js` — per-frame analyser / beat sync
 * - `NX.ui`, `NX.SceneManager`, `NX.VisualEngineManager`, `NX.WgslGraph`, `NX.ClipLayers`, …
 * - `window.NexusEngine` — Butterchurn layer + coordinator (`update`, `renderButterchurnLayer`)
 *
 * @exports Attaches public fields and methods on `NX` near the bottom of this IIFE.
 */

window.NX = window.NX || {};

(function () {
  /* document.getElementById('c'): returns the primary WebGL `<canvas>` or null if missing. */
  var C = document.getElementById('c');
  var gl = null;
  if (C) {
    /* HTMLCanvasElement#getContext: requests WebGL1 with tuned attributes; returns WebGLRenderingContext or null. */
    /* Try high-performance first; fall back for drivers that reject options or return null. */
    gl = C.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' })
      || C.getContext('experimental-webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' })
      || C.getContext('webgl', { antialias: false, alpha: false })
      || C.getContext('experimental-webgl', { antialias: false, alpha: false });
  }
  if (!gl) {
    document.documentElement.classList.add('nx-fatal-no-webgl');
    var splashEl = document.getElementById('splash');
    if (splashEl) splashEl.style.display = 'none';
    var fatalEl = document.getElementById('nx-fatal');
    if (fatalEl) {
      fatalEl.hidden = false;
      fatalEl.setAttribute('aria-hidden', 'false');
    }
    NX._fatalNoWebGL = true;
    NX.scenes = [];
    NX.sceneProgs = [];
    NX.postProgs = {};
    return;
  }
  gl.getExtension('OES_texture_float');

  /* iOS / memory pressure: allow context restore; preventDefault is required for restoration. */
  C.addEventListener('webglcontextlost', function (ev) {
    ev.preventDefault();
    if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: WebGL context lost — will rebuild if restored');
  }, true);
  C.addEventListener('webglcontextrestored', function () {
    try {
      gl.getExtension('OES_texture_float');
      if (NX.compileScenes) NX.compileScenes();
      if (NX.post && typeof NX.post.compile === 'function') NX.post.compile();
      if (NX.resize) NX.resize();
    } catch (eRest) {
      if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: context restore rebuild failed', eRest);
    }
  }, true);

  /* ---- shared state ------------------------------------------------ */
  var S = {
    W: 0, H: 0, FW: 0, FH: 0, GT: 0, frame: 0, hudTick: 0,
    mouseRaw: [0, 0], mouseSmooth: [0, 0],
    sBass: 0, sLowMid: 0, sMid: 0, sHigh: 0, sSub: 0, sVol: 0, sFlux: 0, sCent: 0.35,
    prevBass: 0, prevMbRaw: 0, bpmList: [], lastBeat: 0, bpm: 0, beat: 0,
    /** Smoothed beat 0–1 for shaders/post — reduces harsh strobing vs raw `beat`. */
    beatVisual: 0,
    explode: 0,
    _lastAudT: 0, prevFreqFlux: null,
    micOn: false, analyser: null, waveArr: null, freqArr: null, bufLen: 0,
    audioCtx: null, micStream: null, gainNode: null,
    /** Gain node Butterchurn taps (after P.GAIN); gated by RMS so silence stays calm */
    bcGateNode: null,
    /** 0–1 smoothed open amount for BC audio feed. */
    _bcGateOpen: 0,
    /** 0–1 energy from real FFT (mic); BC intensity / morph. */
    micEnergy: 0,
    /** 0–1 crest / transient follower (time-domain vs slow RMS). */
    sTransient: 0,
    /** Slow RMS for transient detection (internal). */
    _rmsSlow: 0,
    /** 0–1 visual Aurora drive — not gated like raw BC audio tap. */
    _visualBcDrive: 0,
    /** punchy | balanced | smooth — mic reactivity preset. */
    /* Default balanced: less twitchy bands / beat than punchy; users can still pick punchy in UI. */
    reactivityProfile: 'balanced',
    /** 0–1 smoothed: how much motion/post follows live input (calm when silent / no mic). */
    _visualDrive: 0,
    curDev: '',
    _emaFps: 60, _adaptiveTick: 0,
    /** Hysteresis for AUTO Q renderScale steps (consecutive slow/fast windows). */
    _adaptiveLowStreak: 0, _adaptiveHighStreak: 0,
    curS: 0, nxtS: 1, morphing: false, morphBlend: 0,
    autoMorph: true, presTimer: 0, presInterval: 28, _morphFrame: 0,
    morphDurationSec: 2.45, showFpsOverlay: false, presentMode: false,
    adaptiveGpu: false, uiHide: false, recording: false,
    /* Default hybrid: WebGL scenes + Aurora Field (Butterchurn) composite; matches #nx-visual-mode and NexusEngine.init fallback. */
    visualMode: 'hybrid',
    nexusPerfLock: false,
    nexusPostBloom: true,
    /** Effect chain bypass flags (Show tab); consumed by post.js */
    postChain: { bloom: true, streak: true, grade: true, trails: true, kaleido: true, glitch: true },
    nexusPostTrails: 0,
    postBloomMul: 1,
    hueShift: 0,
    bcIntensity: 1,
    bcSpeed: 0.68,
    /** 0.65–1.35: Aurora morph conductor cadence + blend muscle (Mix slider). */
    bcConductorMotion: 1,
    /** When set, main loop composites layers into #c-rec for export resolution */
    recCompositeDims: null,
    /** Last Butterchurn preset filename/key (for HUD + morph conductor) */
    bcLastPresetKey: '',
    /** True on iPhone/iPad: coarser pointer smoothing + GPU-friendly caps */
    _iosCoarsePointer: false,
    /** 0–1 beat phase (BPM clock); set in audio.js when mic + stable BPM */
    beatPhase: 0,
    /** 0–1 confidence in BPM estimate */
    bpmConfidence: 0,
    /** Monotonic count of bass-transient “beats” (for quantized cues). */
    _beatPulseCount: 0,
    /** club | ambient | psychedelic | '' — biases random scene picks */
    visualMacro: '',
    /** One-shot live-FPS mode: caps trails/bloom + perf lock (see setVizPerformanceMode) */
    nexusVizPerformance: false,
    /** Kaleido / glitch post strengths 0–1 */
    postFxKaleido: 0,
    postFxGlitch: 0,
    /** During recording: optional assist (restore nexusPerfLock on stop) */
    _recHadPerfAssist: false,
    _recPrevPerfLock: false,
    /** Composite REC only (#c-rec): draw cheap gradient under layers (default off; UI + localStorage) */
    recAmbientUnderlay: false,
    /** performance.now() when REC started (branded composite timing) */
    _recT0: 0,
    /** Show tab: WebGPU WGSL chain samples #c into #nx-wgpu */
    wgpuGraphEnabled: false,
    /** 32-bit session identity (?seed= / localStorage); drives NX.randomUnit + shader DNA */
    sessionSeed: 0,
    /** GLSL `DNA` vec4 in 0–1 (hash of sessionSeed) — global noise / palette bias */
    dnaX: 0, dnaY: 0, dnaZ: 0, dnaW: 0,
    /** Optional Meyda (lazy); see meyda-analyzer.js */
    meydaEnabled: false, meydaRms: 0, meydaSpectralCentroid: 0, meydaZcr: 0
  };
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    S.morphDurationSec = Math.min(S.morphDurationSec, 0.85);
    S.presInterval = Math.max(S.presInterval, 38);
  }

  var P = { SPD: 3.5, RCT: 5, WRP: 4, PAL: 0, GAIN: 1.0, SMTH: 58, TRIM: 100 };

  /* ---- canvas / resize --------------------------------------------- */
  var rawW = 0, rawH = 0, maxDpr = 2, renderScale = 0.78, pendingRenderScale = null;

  /**
   * Detects iOS / iPadOS coarse pointer and tightens DPR + render scale defaults so
   * dual-scene morph and heavy FBO work stay within mobile GPU budgets.
   * @returns {void}
   */
  (function nexusIOSProfile() {
    var ua = navigator.userAgent || '';
    var iOS = /iP(ad|hone|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    S._iosCoarsePointer = !!iOS;
    /** iOS WebGL: dual-scene morph + extra FBO passes often triggers GPU watchdog / tab kill — use instant cuts (see goNext). */
    S._iosInstantSceneChange = !!iOS;
    if (iOS) {
      maxDpr = Math.min(maxDpr, 1.5);
      renderScale = Math.min(renderScale, 0.58);
      document.documentElement.classList.add('nexus-ios');
    }
  })();

  /**
   * Sizes the WebGL canvas to the viewport (with DPR cap), updates `S.W`/`S.H` and
   * internal render dimensions `S.FW`/`S.FH`, sets the GL viewport, and rebuilds FBOs.
   * @returns {void}
   */
  function resize() {
    var capDpr = S.nexusPerfLock ? Math.min(maxDpr, 1) : maxDpr;
    var dpr = Math.min(window.devicePixelRatio || 1, capDpr);
    /* Some WebKit passes report 0×0 briefly; without a floor, FBOs never build → black forever. */
    var iw = typeof innerWidth === 'number' ? innerWidth : 0;
    var ih = typeof innerHeight === 'number' ? innerHeight : 0;
    var docEl = document.documentElement;
    var cwDoc = docEl && docEl.clientWidth ? docEl.clientWidth : 0;
    var chDoc = docEl && docEl.clientHeight ? docEl.clientHeight : 0;
    /* Avoid screen.width/height fallback — can be huge and create incomplete FBOs on some GPUs. */
    S.W = Math.max(1, iw > 2 ? iw : (cwDoc > 2 ? cwDoc : 800));
    S.H = Math.max(1, ih > 2 ? ih : (chDoc > 2 ? chDoc : 600));
    var rw0 = Math.floor(S.W * dpr), rh0 = Math.floor(S.H * dpr);
    var maxTex = 8192;
    try {
      var mt = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (typeof mt === 'number' && mt > 0) maxTex = mt;
    } catch (eMt) { /* ignore */ }
    if (rw0 > maxTex || rh0 > maxTex) {
      var scale = Math.min(maxTex / rw0, maxTex / rh0, 1);
      rw0 = Math.max(1, Math.floor(rw0 * scale));
      rh0 = Math.max(1, Math.floor(rh0 * scale));
    }
    C.width = rw0; C.height = rh0;
    C.style.width = S.W + 'px'; C.style.height = S.H + 'px';
    rawW = C.width; rawH = C.height;
    if (pendingRenderScale != null) { renderScale = pendingRenderScale; pendingRenderScale = null; }
    var effScale = S.nexusPerfLock ? Math.min(renderScale, 0.56) : renderScale;
    S.FW = Math.max(1, Math.floor(rawW * effScale));
    S.FH = Math.max(1, Math.floor(rawH * effScale));
    /* Default framebuffer is full canvas; scene passes use their own FBO viewports. */
    gl.viewport(0, 0, Math.max(1, rawW | 0), Math.max(1, rawH | 0));
    rebuildFBOs();
    if (NX.VisualEngineManager && NX.VisualEngineManager.resize) NX.VisualEngineManager.resize();
    /* NX.VisualEngineManager.resize (visual-engine-manager.js): syncs auxiliary GL/WebGPU views; void. */
    if (NX.VisualEngineManager && NX.VisualEngineManager.resize) NX.VisualEngineManager.resize();
    /* NX.WgslGraph.resize (wgsl-graph.js): matches WebGPU surface to layout; void. */
    if (NX.WgslGraph && NX.WgslGraph.resize) NX.WgslGraph.resize();
  }
  addEventListener('resize', resize);
  window.addEventListener('load', function () { resize(); });
  window.addEventListener('orientationchange', function () { setTimeout(resize, 300); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
  }

  /**
   * Updates internal `renderScale` (clamped) and rebuilds FBOs without a full window remeasure.
   * @param {number} next - Target scale in ~0.42–1.0.
   * @returns {void}
   */
  function applyRenderScaleOnly(next) {
    next = Math.max(0.42, Math.min(1, next));
    if (Math.abs(next - renderScale) < 0.02) return;
    renderScale = next; rebuildFBOs();
  }
  /**
   * Applies bundled quality presets for DPR and pending render scale, then calls `resize()`.
   * @param {'perf'|'ultra'|string} mode - `perf` = lower resolution; `ultra` = highest allowed.
   * @returns {void}
   */
  function setQualityPreset(mode) {
    var cap = S._iosCoarsePointer ? 1.75 : 2;
    if (mode === 'perf') { maxDpr = 1.25; pendingRenderScale = 0.52; }
    else if (mode === 'ultra') { maxDpr = cap; pendingRenderScale = S._iosCoarsePointer ? 0.74 : 1; }
    else { maxDpr = cap; pendingRenderScale = S._iosCoarsePointer ? 0.66 : 0.78; }
    resize();
  }
  /** @returns {number} Current effective render scale (internal pixel ratio vs canvas). */
  function getRenderScale() { return renderScale; }

  /* ---- GL utilities ------------------------------------------------ */
  /**
   * Compiles a single GL shader; logs `getShaderInfoLog` on failure.
   * @param {number} type - `gl.VERTEX_SHADER` or `gl.FRAGMENT_SHADER`.
   * @param {string} src - GLSL source.
   * @returns {WebGLShader|null}
   */
  function mkSh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('Shader error:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  /**
   * Links a vertex + fragment shader pair into a program; deletes shaders after link.
   * @param {string} vs - Vertex GLSL.
   * @param {string} fs - Fragment GLSL.
   * @returns {WebGLProgram|null}
   */
  function mkProg(vs, fs) {
    var v = mkSh(gl.VERTEX_SHADER, vs), f = mkSh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('Link:', gl.getProgramInfoLog(p)); return null; }
    gl.deleteShader(v); gl.deleteShader(f); return p;
  }
  var qbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  /**
   * Allocates an RGBA8 color texture + framebuffer (color attachment 0), cleared to opaque black.
   * @param {number} w - Texture width in texels.
   * @param {number} h - Texture height in texels.
   * @returns {{t: WebGLTexture, f: WebGLFramebuffer}}
   */
  function mkRT(w, h) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { t: t, f: f };
  }

  /* ---- FBOs -------------------------------------------------------- */
  var fbA = [null, null], fbB = [null, null], fbBloom = null, fbBloomBlur = null, fbMorph = null;
  var pingA = 0, pingB = 0;

  /**
   * Recreates ping-pong scene buffers (`fbA`/`fbB`), bloom half-res targets, and morph FBO
   * whenever canvas or `renderScale` / perf lock changes.
   * @returns {void}
   */
  function rebuildFBOs() {
    if (!rawW || !rawH) return;
    var effScale = S.nexusPerfLock ? Math.min(renderScale, 0.56) : renderScale;
    S.FW = Math.max(1, Math.floor(rawW * effScale));
    S.FH = Math.max(1, Math.floor(rawH * effScale));
    var hw = Math.max(1, Math.floor(S.FW / 2)), hh = Math.max(1, Math.floor(S.FH / 2));
    for (var i = 0; i < 2; i++) {
      if (fbA[i]) { gl.deleteTexture(fbA[i].t); gl.deleteFramebuffer(fbA[i].f); }
      if (fbB[i]) { gl.deleteTexture(fbB[i].t); gl.deleteFramebuffer(fbB[i].f); }
      fbA[i] = mkRT(S.FW, S.FH);
      fbB[i] = mkRT(hw, hh);
    }
    [fbBloom, fbBloomBlur, fbMorph].forEach(function (r) { if (r) { gl.deleteTexture(r.t); gl.deleteFramebuffer(r.f); } });
    fbBloom = mkRT(hw, hh); fbBloomBlur = mkRT(hw, hh); fbMorph = mkRT(S.FW, S.FH);
    pingA = 0; pingB = 0;
  }

  /* ---- Audio texture (512×1) --------------------------------------- */
  var atex = gl.createTexture(), abuf = new Uint8Array(512);
  (function () {
    for (var i = 0; i < 256; i++) abuf[256 + i] = 128;
    gl.bindTexture(gl.TEXTURE_2D, atex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 512, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, abuf);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  })();

  /* ---- Uniform / attrib cache -------------------------------------- */
  var _uCache = {}, _aCache = {}, _pIds = new WeakMap(), _pId = 0;
  /**
   * Stable numeric id for a program (WeakMap-backed) for uniform cache keys.
   * @param {WebGLProgram} prog
   * @returns {number}
   */
  function _pid(prog) { if (!_pIds.has(prog)) _pIds.set(prog, _pId++); return _pIds.get(prog); }
  /**
   * Cached `getUniformLocation` per program + name.
   * @param {WebGLProgram} prog
   * @param {string} name - Uniform symbol in GLSL.
   * @returns {WebGLUniformLocation|null}
   */
  function u(prog, name) {
    var id = _pid(prog);
    if (!_uCache[id]) _uCache[id] = {};
    if (!(name in _uCache[id])) _uCache[id][name] = gl.getUniformLocation(prog, name);
    return _uCache[id][name];
  }

  /**
   * Binds the shared full-screen triangle strip (`qbuf`) to attrib `pos` for `prog`.
   * @param {WebGLProgram} prog
   * @returns {void}
   */
  function bindQuad(prog) {
    gl.bindBuffer(gl.ARRAY_BUFFER, qbuf);
    var id = _pid(prog);
    if (!_aCache[id]) _aCache[id] = gl.getAttribLocation(prog, 'pos');
    var l = _aCache[id];
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  }

  /**
   * Non-linear audio band shaping for shader uniforms (keeps highs readable when hot).
   * @param {number} x - Source value in 0–1 (clamped).
   * @param {number} gain - Linear multiplier after curve.
   * @returns {number} Driven value capped ~2.05.
   */
  function shapeDrive(x, gain) {
    x = Math.max(0, Math.min(1, x));
    return Math.min(2.05, Math.pow(x, 0.68) * gain);
  }

  /**
   * Uploads time, resolution, audio bands, beat, DNA, BPM, and load-scaling uniforms shared by scenes.
   * @param {WebGLProgram} prog - Compiled scene shader program.
   * @returns {void}
   */
  function setCommonUniforms(prog) {
    var vd = typeof S._visualDrive === 'number' ? S._visualDrive : 0;
    if (vd < 0) vd = 0;
    if (vd > 1) vd = 1;
    var audW = 0.22 + 0.78 * vd;
    var tSlow = 0.48 + 0.52 * vd;
    gl.uniform2f(u(prog, 'R'), S.FW, S.FH);
    var bv = typeof S.beatVisual === 'number' ? S.beatVisual : 0;
    var tr = typeof S.sTransient === 'number' ? S.sTransient : 0;
    /* `wig` warps shader time `T` — large values read as wobble/strobe in most scenes; keep tightly capped. */
    var wigRaw = (S.sBass * 0.028 + bv * 0.011 + S.sFlux * 0.011 + tr * 0.016) * (0.28 + 0.72 * vd);
    var wig = Math.min(0.065, Math.max(0, wigRaw));
    gl.uniform1f(u(prog, 'T'), S.GT * tSlow * (1 + wig));
    var Bd = shapeDrive(S.sBass, 1.84) * audW + bv * 0.2 * audW;
    gl.uniform1f(u(prog, 'B'), Bd);
    gl.uniform1f(u(prog, 'M'), shapeDrive(S.sMid, 1.72) * audW);
    gl.uniform1f(u(prog, 'H'), shapeDrive(S.sHigh, 1.78) * audW);
    gl.uniform1f(u(prog, 'V'), shapeDrive(S.sVol, 1.55) * audW);
    gl.uniform1f(u(prog, 'BT'), Math.min(0.72, (bv * 0.52 + S.sBass * 0.038) * audW));
    gl.uniform1f(u(prog, 'EX'), S.explode);
    gl.uniform1f(u(prog, 'SP'), (P.SPD / 5) * (0.26 + 0.54 * vd));
    gl.uniform1f(u(prog, 'WP'), (P.WRP / 5) * (0.3 + 0.5 * vd));
    gl.uniform1f(u(prog, 'PAL'), P.PAL);
    gl.uniform1f(u(prog, 'FL'), Math.min(0.82, (S.sFlux * 0.48 + bv * 0.065 + tr * 0.12) * audW));
    gl.uniform1f(u(prog, 'SC'), S.sCent);
    var bpm = typeof S.bpm === 'number' ? S.bpm : 0;
    gl.uniform1f(u(prog, 'BP'), Math.min(1, Math.max(0, bpm / 175)));
    gl.uniform1f(u(prog, 'PH'), typeof S.beatPhase === 'number' ? S.beatPhase : 0);
    gl.uniform1f(u(prog, 'BC'), typeof S.bpmConfidence === 'number' ? S.bpmConfidence : 0);
    var dnaLoc = u(prog, 'DNA');
    if (dnaLoc) {
      gl.uniform4f(dnaLoc,
        typeof S.dnaX === 'number' ? S.dnaX : 0,
        typeof S.dnaY === 'number' ? S.dnaY : 0,
        typeof S.dnaZ === 'number' ? S.dnaZ : 0,
        typeof S.dnaW === 'number' ? S.dnaW : 0);
    }
    var procLoc = u(prog, 'PROC');
    if (procLoc) {
      gl.uniform4f(procLoc,
        typeof S.procHue === 'number' ? S.procHue : 0,
        typeof S.procSat === 'number' ? S.procSat : 0.5,
        typeof S.procLift === 'number' ? S.procLift : 0.55,
        typeof S.procPhase === 'number' ? S.procPhase : 0);
    }
    var ld = 1;
    if (S.nexusVizPerformance) ld *= 0.62;
    else if (S.nexusPerfLock) ld *= 0.74;
    else if (S._emaFps < 34) ld *= 0.76;
    else if (S._emaFps < 46) ld *= 0.88;
    var scCur = NX.scenes && NX.scenes[S.curS];
    if (scCur && scCur.cost === 'high') {
      if (S._emaFps < 40) ld *= 0.9;
      if (S._emaFps < 30) ld *= 0.88;
    } else if (scCur && scCur.cost === 'med' && S._emaFps < 28) {
      ld *= 0.92;
    }
    gl.uniform1f(u(prog, 'LD'), Math.max(0.38, Math.min(1, ld)));
  }

  /* ---- Vertex shader (shared) -------------------------------------- */
  var VS = 'attribute vec2 pos;varying vec2 uv;void main(){uv=pos*.5+.5;gl_Position=vec4(pos,0,1);}';

  /* ---- Passthrough blit (when bloom/grade post chain missing or errors) */
  var BLIT_FALLBACK_FS = 'precision mediump float;varying vec2 uv;uniform sampler2D tex;void main(){gl_FragColor=texture2D(tex,uv);}';
  var blitFallbackProg = null;
  /**
   * Draws `tex` to the default framebuffer with a minimal passthrough program (post fallback).
   * @param {WebGLTexture|null} tex - Scene or composite color attachment.
   * @returns {void}
   */
  function blitTextureToCanvas(tex) {
    if (!tex) return;
    if (!blitFallbackProg) blitFallbackProg = mkProg(VS, BLIT_FALLBACK_FS);
    if (!blitFallbackProg) return;
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, Math.max(1, C.width | 0), Math.max(1, C.height | 0));
    gl.useProgram(blitFallbackProg);
    bindQuad(blitFallbackProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(u(blitFallbackProg, 'tex'), 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ---- Pre-warm uniform cache after programs are compiled ---------- */
  /**
   * Touches uniform locations once after link to avoid first-frame stalls when drivers JIT-resolve names.
   * @param {WebGLProgram[]} sceneProgs
   * @param {WebGLProgram[]} postProgs
   * @returns {void}
   */
  function prewarmCache(sceneProgs, postProgs) {
    var sn = ['R', 'T', 'B', 'M', 'H', 'V', 'BT', 'EX', 'SP', 'WP', 'PAL', 'FL', 'SC', 'MX', 'PV', 'AU', 'BP', 'PH', 'BC', 'LD', 'DNA', 'PROC'];
    sceneProgs.forEach(function (prog) { if (!prog) return; sn.forEach(function (n) { u(prog, n); }); });
    postProgs.forEach(function (prog) {
      if (!prog) return;
      ['tex', 'bloom', 'streak', 'thresh', 'dir', 'BT', 'T', 'B', 'M', 'H', 'FL', 'R', 'A', 'B2', 'mix2', 'BM', 'HS', 'KA', 'GL', 'PC'].forEach(function (n) { u(prog, n); });
    });
  }

  /**
   * Seconds between auto scene advances; scales with mic energy (slower when silent + mic off).
   * @returns {number}
   */
  function getAutoMorphIntervalSec() {
    var base = S.presInterval;
    var me = typeof S.micEnergy === 'number' ? S.micEnergy : 0;
    /* Slow LFO on cycle length so auto-advance feels evolving, not metronomic (DNA biases phase). */
    var phase = (typeof S.dnaY === 'number' ? S.dnaY : 0.37) * 6.2831853;
    var breathe = 1 + 0.11 * Math.sin((S.GT || 0) * 0.041 + phase);
    breathe = Math.max(0.9, Math.min(1.18, breathe));
    base *= breathe;
    if (!S.micOn && me < 0.02) return base * 1.58;
    if (S.micOn && me > 0.07) return base * 0.97;
    return base;
  }

  /**
   * When `S.adaptiveGpu` is on, nudges `renderScale` down/up based on smoothed FPS and quality UI mode.
   * @param {number} dt - Frame delta seconds.
   * @returns {void}
   */
  function tickAdaptiveFps(dt) {
    if (!S.adaptiveGpu) return;
    if (S.recording || S.presentMode) return;
    S._adaptiveTick += dt;
    if (S._adaptiveTick < 0.75) return;
    S._adaptiveTick = 0;
    /* document.getElementById (DOM): reads `#qsel` quality select value; returns Element|null. */
    var q = document.getElementById('qsel');
    var mode = q && q.value ? q.value : 'balanced';
    var downTh = 26;
    var upTh = 52;
    var stepDn = 0.06;
    var stepUp = 0.04;
    var minScale = 0.48;
    var maxScale = 0.92;
    if (mode === 'perf') {
      downTh = 28;
      upTh = 50;
      stepDn = 0.055;
      stepUp = 0.045;
      minScale = 0.44;
      maxScale = 0.82;
    } else if (mode === 'ultra') {
      downTh = 22;
      upTh = 54;
      stepDn = 0.04;
      stepUp = 0.03;
      minScale = 0.52;
      maxScale = 0.98;
    }
    if (S._emaFps < downTh) {
      S._adaptiveLowStreak++;
      S._adaptiveHighStreak = 0;
    } else if (S._emaFps > upTh) {
      S._adaptiveHighStreak++;
      S._adaptiveLowStreak = 0;
    } else {
      S._adaptiveLowStreak = Math.max(0, S._adaptiveLowStreak - 1);
      S._adaptiveHighStreak = Math.max(0, S._adaptiveHighStreak - 1);
    }
    if (S._adaptiveLowStreak >= 2 && renderScale > minScale) {
      applyRenderScaleOnly(renderScale - stepDn);
      S._adaptiveLowStreak = 0;
    } else if (S._adaptiveHighStreak >= 3 && renderScale < maxScale) {
      applyRenderScaleOnly(renderScale + stepUp);
      S._adaptiveHighStreak = 0;
    }
  }

  /* ---- Render one scene into FBO ----------------------------------- */
  /**
   * If the active scene failed to compile, uses the first successful program so the loop still composites.
   * @returns {number} Scene index to draw, or -1 if none compiled.
   */
  function resolveSceneIndex() {
    var progs = NX.sceneProgs;
    if (!progs || !progs.length) return -1;
    var idx = S.curS | 0;
    if (idx >= 0 && idx < progs.length && progs[idx]) return idx;
    for (var i = 0; i < progs.length; i++) {
      if (progs[i]) {
        if (i !== idx) console.warn('NEXUS: no program for scene', idx, '— using scene', i);
        S.curS = i;
        return i;
      }
    }
    return -1;
  }

  /**
   * Renders one scene pass into `targetFBO` with previous frame texture + audio texture bound.
   * @param {number} idx - Scene index into `NX.sceneProgs`.
   * @param {WebGLFramebuffer} targetFBO - Draw framebuffer.
   * @param {WebGLTexture} prevTex - Ping color buffer from prior frame.
   * @param {number} [w] - Viewport width (defaults `S.FW`).
   * @param {number} [h] - Viewport height (defaults `S.FH`).
   * @returns {void}
   */
  function renderScene(idx, targetFBO, prevTex, w, h) {
    var prog = NX.sceneProgs[idx]; if (!prog) return;
    var rw = w || S.FW, rh = h || S.FH;
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO);
    gl.viewport(0, 0, rw, rh);
    gl.useProgram(prog); bindQuad(prog);
    setCommonUniforms(prog);
    var mxL = u(prog, 'MX'); if (mxL) gl.uniform2f(mxL, S.mouseSmooth[0], S.mouseSmooth[1]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, prevTex);
    gl.uniform1i(u(prog, 'PV'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, atex);
    gl.uniform1i(u(prog, 'AU'), 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ---- Scene manager ----------------------------------------------- */
  /**
   * Bias starting scene index from `S.sessionSeed` so cold loads differ without breaking pad indices.
   * Call after `NX.compileScenes()` and before first `NX.showName`.
   * @returns {void}
   */
  function applySessionSceneStart() {
    var scenes = NX.scenes;
    if (!scenes || !scenes.length) return;
    var len = scenes.length;
    var seed = (S.sessionSeed >>> 0) || 1;
    var x = Math.imul(seed, 1103515245) + 12345 >>> 0;
    var idx = x % len;
    S.curS = idx;
    S.nxtS = (idx + 1) % len;
  }

  /**
   * Updates on-screen scene name labels (delegates to `NX.ui.showName` when present).
   * @param {number} idx - Scene index.
   * @returns {void}
   */
  function showName(idx) {
    if (!NX.scenes || !NX.scenes[idx]) return;
    if (NX.ui && NX.ui.showName) { NX.ui.showName(idx); return; }
    var n = document.getElementById('pname'), ni = document.getElementById('pidx');
    if (!n) return;
    n.textContent = NX.scenes[idx].n;
    ni.textContent = (idx + 1) + ' / ' + NX.scenes.length;
    var vpn = document.getElementById('vpn'); if (vpn) vpn.textContent = NX.scenes[idx].n;
    n.style.opacity = '1'; ni.style.opacity = '0.7';
    /* window.clearTimeout / setTimeout (browser): fade labels after 3s; timer ids stored on `n._t`. */
    clearTimeout(n._t); n._t = setTimeout(function () { n.style.opacity = '0'; ni.style.opacity = '0'; }, 3000);
  }

  /**
   * Advances presentation to a target scene index, optionally starting a morph transition.
   * @param {number} [idx] - Explicit next index; if omitted, wraps `S.curS + 1`.
   * @returns {void}
   */
  function goNext(idx) {
    if (S.morphing) return;
    var len = NX.scenes.length;
    if (!len) return;
    S.nxtS = (idx !== undefined) ? ((idx + len) % len) : ((S.curS + 1) % len);
    if (S.nxtS === S.curS) S.nxtS = (S.curS + 1) % len;
    /* iOS: skip morph (extra scene pass + blend FBO) — major stability win vs GPU timeouts. */
    if (S._iosInstantSceneChange) {
      S.curS = S.nxtS;
      S.morphing = false;
      S.morphBlend = 0;
      S._morphFrame = 0;
      S._activeMorphDur = null;
      S.presTimer = 0;
      try {
        showName(S.curS);
        if (NX.ui && NX.ui.setActiveScene) NX.ui.setActiveScene(S.curS);
      } catch (eUi) { /* ignore */ }
      return;
    }
    S.morphing = true; S.morphBlend = 0; S.presTimer = 0; S._morphFrame = 0;
    S._activeMorphDur = S.morphDurationSec;
    var scA = NX.scenes[S.curS], scB = NX.scenes[S.nxtS];
    if (scA && scB && scA.cost === 'high' && scB.cost === 'high') S._activeMorphDur *= 1.35;
    try {
      if (fbB[0] && fbB[1]) {
        [fbB[0].f, fbB[1].f].forEach(function (f) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, f);
          gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        });
      }
      pingB = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } catch (eFb) { /* ignore */ }
    showName(S.nxtS);
    if (NX.ui && NX.ui.setActiveScene) NX.ui.setActiveScene(S.nxtS);
  }
  /**
   * Goes to the previous scene in ring order (thin wrapper over `goNext`).
   * @returns {void}
   */
  function goPrev() { goNext((S.curS - 1 + NX.scenes.length) % NX.scenes.length); }
  /**
   * Weight for weighted-random scene pick from tags, visual macro, GPU cost, and live energy.
   * @param {number} i - Scene index.
   * @param {boolean} driveHot - Whether mic-driven motion is strong.
   * @param {number} energy - Combined audio energy 0–1.
   * @returns {number} Positive weight (higher = more likely).
   */
  function sceneTagWeight(i, driveHot, energy) {
    var sc = NX.scenes[i];
    if (!sc || !sc.tags) return 1;
    var w = 1;
    var macro = S.visualMacro || '';
    if (macro === 'club') {
      if (sc.tags.indexOf('intense') >= 0) w += 0.95;
      if (sc.tags.indexOf('tunnel') >= 0) w += 0.45;
      if (driveHot && sc.rx > 0) w += sc.rx * 0.5;
    } else if (macro === 'ambient') {
      if (sc.tags.indexOf('calm') >= 0) w += 1.15;
      w += sc.cost === 'high' ? -0.35 : 0.15;
    } else if (macro === 'psychedelic') {
      if (sc.tags.indexOf('fractal') >= 0) w += 1.1;
      if (sc.tags.indexOf('sacred') >= 0) w += 0.65;
      if (sc.tags.indexOf('tunnel') >= 0) w += 0.35;
    }
    if (S.nexusVizPerformance && sc.cost === 'high') w *= 0.35;
    else if (S.nexusVizPerformance && sc.cost === 'low') w *= 1.25;
    if (energy > 0.35 && sc.tags.indexOf('intense') >= 0) w += 0.4;
    if (energy < 0.18 && sc.tags.indexOf('calm') >= 0) w += 0.55;
    var rx = typeof sc.rx === 'number' ? sc.rx : 0;
    w += driveHot && rx > 0 ? rx * 0.85 : 0;
    return Math.max(0.08, w);
  }

  /**
   * Picks a new scene index using tag weights and `NX.randomUnit()` when available.
   * @returns {void}
   */
  function goRandom() {
    var n = NX.scenes.length;
    if (n < 2) return;
    var driveHot = S.micOn && (typeof S._visualDrive === 'number' ? S._visualDrive : 0) > 0.42;
    var energy = S.sBass * 0.45 + S.sMid * 0.28 + S.sFlux * 0.22;
    var weights = [];
    var tw = 0;
    for (var i = 0; i < n; i++) {
      var w = sceneTagWeight(i, driveHot, energy);
      weights.push(w);
      tw += w;
    }
    var r = S.curS;
    var rnd = typeof NX.randomUnit === 'function' ? NX.randomUnit : Math.random;
    for (var attempt = 0; attempt < 24 && r === S.curS; attempt++) {
      var pick = rnd() * tw;
      var acc = 0;
      for (var j = 0; j < n; j++) {
        acc += weights[j];
        if (pick < acc) { r = j; break; }
      }
    }
    if (r === S.curS) r = (S.curS + 1) % n;
    goNext(r);
  }

  /* ---- Main loop --------------------------------------------------- */
  var _lastTime = performance.now();

  /**
   * Main animation frame: context check, shared state tick, scene draw, morph blend,
   * post chain, engine overlays, and optional recording composite.
   *
   * External collaborators invoked inside (see `NexusEngine`, `NX.*` modules in other files):
   * - `requestAnimationFrame(loop)` — schedules next frame; returns numeric handle (ignored).
   * - `gl.isContextLost()` — WebGL; returns boolean; exits early when true.
   * - `NX.audio.tick()` — `audio.js`; no args; updates FFT/beat fields on `S`.
   * - `NX.ui.tickHud(S)` — `ui.js`; reads state for HUD; void.
   * - `NX.demo.tick`, `NX.autoDirector.tick`, `NX.watermark.tick` — optional directors; void.
   * - `NexusEngine.update(dt)`, `NexusEngine.renderButterchurnLayer()` — `nexus-engine/*`; void.
   * - `NX.SceneManager.shouldRenderShader()` — boolean gate for shader layer.
   * - `NX.post.render(tex, bloom, blur, hw, hh)` — `post.js`; runs bloom/grade stack; void or throws.
   * - `NX.WgslGraph.renderFrame` / `setEnabled` — WebGPU overlay; void.
   * - `NX.ClipLayers.drawForRecording(ctx, w, h, under)` — 2D clip stack for export; void.
   *
   * @param {number} [now] - `DOMHighResTimeStamp` from the animation frame callback.
   * @returns {void}
   */
  function loop(now) {
    requestAnimationFrame(loop);
    try {
    if (window.__NX_SOAK__) {
      if (!S._soak) S._soak = { t0: now || performance.now(), frames: 0, lastLog: 0 };
      S._soak.frames++;
      var tNow = now || performance.now();
      if (tNow - S._soak.lastLog > 60000) {
        if (typeof console !== 'undefined' && console.info) {
          console.info('[NEXUS][soak]', {
            seconds: Math.round((tNow - S._soak.t0) / 1000),
            frames: S._soak.frames,
            fpsEma: Math.round(S._emaFps)
          });
        }
        S._soak.lastLog = tNow;
      }
    }
    if (gl.isContextLost && gl.isContextLost()) return;
    if (!now) now = performance.now();
    var dt = Math.min((now - _lastTime) / 1000, 0.05);
    if (dt <= 0 || dt > 0.05) dt = 0.016;
    _lastTime = now;

    /* Global shader time: P.SPD is user “Speed”; scale keeps motion slow / evolving vs legacy dt*P.SPD. */
    S.GT += dt * P.SPD * 0.34;
    S.frame++;
    var instFps = 1 / Math.max(dt, 0.001);
    S._emaFps += 0.15 * (instFps - S._emaFps);
    tickAdaptiveFps(dt);
    if (NX.audio && NX.audio.tick) NX.audio.tick();
    var mxAlpha = S._iosCoarsePointer ? 0.11 : 0.05;
    S.mouseSmooth[0] += (S.mouseRaw[0] - S.mouseSmooth[0]) * mxAlpha;
    S.mouseSmooth[1] += (S.mouseRaw[1] - S.mouseSmooth[1]) * mxAlpha;
    /* FBOs are created in resize(); recover even when innerWidth is 0 (iframe / devtools) — resize() uses clientWidth fallbacks. */
    if (!fbA[0] || !fbB[0]) {
      try { resize(); } catch (eFb) { /* ignore */ }
      if (!fbA[0] || !fbB[0]) return;
    }

    /* Other modules share no GL state with us, but reset common pitfalls so fullscreen passes always draw. */
    try {
      gl.disable(gl.DEPTH_TEST);
      if (typeof gl.STENCIL_TEST === 'number') gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.colorMask(true, true, true, true);
    } catch (eGlState) { /* rare: invalid enum on minimal GL */ }

    if (NX.ui && NX.ui.tickHud) NX.ui.tickHud(S);
    if (NX.demo && NX.demo.tick) NX.demo.tick();
    if (NX.autoDirector && NX.autoDirector.tick) NX.autoDirector.tick(dt);
    if (NX.watermark && NX.watermark.tick) NX.watermark.tick();
    if (window.NexusEngine && NexusEngine.update) NexusEngine.update(dt);

    if (S.autoMorph) {
      S.presTimer += dt;
      if (S.presTimer >= getAutoMorphIntervalSec() && !S.morphing) goNext();
    }
    if (S.morphing) {
      var spdBoost = Math.max(0.22, (P.SPD / 5) * 0.68);
      var mdur = typeof S._activeMorphDur === 'number' ? S._activeMorphDur : S.morphDurationSec;
      S.morphBlend += dt / (mdur / spdBoost);
      S._morphFrame++;
      if (S.morphBlend >= 1) { S.morphBlend = 1; S.morphing = false; S.curS = S.nxtS; S._activeMorphDur = null; }
    }

    var hw = Math.max(1, Math.floor(S.FW / 2)), hh = Math.max(1, Math.floor(S.FH / 2));

    var drawShader = !NX.SceneManager || NX.SceneManager.shouldRenderShader();
    if (drawShader) {
      var sceneIdx = resolveSceneIndex();
      if (sceneIdx >= 0) {
        try {
          renderScene(sceneIdx, fbA[1 - pingA].f, fbA[pingA].t);
          pingA = 1 - pingA;
        } catch (eRs) {
          if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: renderScene failed', eRs);
        }
      }
    }
    var curOut = fbA[pingA] ? fbA[pingA].t : null;
    var finalTex = curOut;

    if (drawShader && S.morphing && NX.postProgs && NX.postProgs.blend && fbMorph && fbMorph.f && fbB[0] && fbB[1]) {
      try {
        if (S._morphFrame % 2 === 1) { renderScene(S.nxtS, fbB[1 - pingB].f, fbB[pingB].t, hw, hh); pingB = 1 - pingB; }
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbMorph.f); gl.viewport(0, 0, S.FW, S.FH);
        gl.useProgram(NX.postProgs.blend); bindQuad(NX.postProgs.blend);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, curOut); gl.uniform1i(u(NX.postProgs.blend, 'A'), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbB[pingB].t); gl.uniform1i(u(NX.postProgs.blend, 'B2'), 1);
        gl.uniform1f(u(NX.postProgs.blend, 'mix2'), S.morphBlend);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        finalTex = fbMorph.t;
      } catch (eMorph) {
        if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: morph pass failed', eMorph);
      }
    }

    var postReady = !!(drawShader && finalTex && NX.post && NX.post.render && NX.postProgs && NX.postProgs.out && NX.postProgs.copy);
    if (postReady) {
      try {
        NX.post.render(finalTex, fbBloom, fbBloomBlur, hw, hh);
      } catch (ePost) {
        console.warn('NEXUS post.render failed — blitting scene FBO', ePost);
        blitTextureToCanvas(finalTex);
      }
    } else if (drawShader && finalTex) {
      /* Missing or partial post compile: still show raw scene texture. */
      blitTextureToCanvas(finalTex);
    } else if (!drawShader) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, C.width, C.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (window.NexusEngine && NexusEngine.renderButterchurnLayer) NexusEngine.renderButterchurnLayer();

    if (NX.WgslGraph && NX.WgslGraph.renderFrame) {
      try {
        NX.WgslGraph.renderFrame();
      } catch (eW) {
        /* iOS / partial WebGPU: never let WGSL compositor kill the main rAF loop */
        if (NX.WgslGraph.setEnabled) NX.WgslGraph.setEnabled(false);
      }
    }

    if (S.recording && S.recCompositeDims) {
      var rc = document.getElementById('c-rec');
      if (rc) {
        var x2d = rc.getContext('2d');
        var d = S.recCompositeDims;
        if (rc.width !== d.w || rc.height !== d.h) { rc.width = d.w; rc.height = d.h; }
        if (S.recAmbientUnderlay) {
          var gx = x2d.createLinearGradient(0, 0, d.w * 0.72, d.h * 0.92);
          gx.addColorStop(0, '#060618');
          gx.addColorStop(0.42, '#10122a');
          gx.addColorStop(1, '#020208');
          x2d.fillStyle = gx;
        } else {
          x2d.fillStyle = '#000';
        }
        x2d.fillRect(0, 0, d.w, d.h);
        var vm = S.visualMode || 'shader';
        if (vm !== 'shader') {
          var cbc = document.getElementById('c-bc');
          if (cbc) try { x2d.drawImage(cbc, 0, 0, d.w, d.h); } catch (eR) { }
        }
        if (NX.ClipLayers && NX.ClipLayers.drawForRecording) {
          NX.ClipLayers.drawForRecording(x2d, d.w, d.h, true);
        }
        var wgpuOn = S.wgpuGraphEnabled && NX.WgslGraph && NX.WgslGraph.isReady && NX.WgslGraph.isReady();
        var wgc = document.getElementById('nx-wgpu');
        var mainLayer = C;
        if (wgpuOn && wgc) mainLayer = wgc;
        try { x2d.drawImage(mainLayer, 0, 0, d.w, d.h); } catch (eR2) { }
        if (NX.ClipLayers && NX.ClipLayers.drawForRecording) {
          NX.ClipLayers.drawForRecording(x2d, d.w, d.h, false);
        }
        /* Optional opening title card + logo (1080p / 4K composite only) */
        if (NX.RecBrand && NX.RecBrand.openingCard && S._recT0) {
          var age = (performance.now() - S._recT0) / 1000;
          if (age < 1.25) {
            var k = 1 - age / 1.25;
            x2d.fillStyle = 'rgba(0,0,0,' + (0.62 * k).toFixed(3) + ')';
            x2d.fillRect(0, 0, d.w, d.h);
            x2d.fillStyle = 'rgba(255,255,255,0.94)';
            x2d.textAlign = 'center';
            x2d.textBaseline = 'middle';
            var fs = Math.max(22, Math.round(d.w * 0.042));
            x2d.font = '600 ' + fs + 'px system-ui,Segoe UI,sans-serif';
            x2d.fillText('NEXUS ENGINE', d.w * 0.5, d.h * 0.46);
            x2d.font = '400 ' + Math.round(fs * 0.28) + 'px system-ui,Segoe UI,sans-serif';
            x2d.fillStyle = 'rgba(255,255,255,0.55)';
            x2d.fillText('Live visual suite', d.w * 0.5, d.h * 0.54);
          }
        }
        if (NX.RecBrand && NX.RecBrand.logoCorner && NX.RecBrand.logoImage &&
            NX.RecBrand.logoImage.complete && NX.RecBrand.logoImage.naturalWidth) {
          var im = NX.RecBrand.logoImage;
          var bw = Math.min(d.w * 0.2, im.naturalWidth);
          var bh = bw * (im.naturalHeight / im.naturalWidth);
          var pad = Math.round(Math.min(28, d.w * 0.018));
          x2d.save();
          x2d.globalAlpha = 0.88;
          try {
            x2d.drawImage(im, d.w - bw - pad, d.h - bh - pad, bw, bh);
          } catch (eLogo) { /* ignore */ }
          x2d.restore();
        }
      }
    }
    } catch (eFrame) {
      if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: frame error', eFrame);
    }
  }

  /* ---- Pointer / touch → MX (canvas bounds; no document touchmove — keeps panel scroll on iOS) */
  /**
   * Maps client coordinates into `S.mouseRaw` normalized device coords [-1, 1] relative to `el`.
   * @param {number} clientX - Viewport X from pointer/mouse/touch.
   * @param {number} clientY - Viewport Y.
   * @param {HTMLElement} el - Usually the main canvas `C`.
   * @returns {void}
   */
  function pointerToNorm(clientX, clientY, el) {
    var rect = el.getBoundingClientRect();
    var rw = rect.width;
    var rh = rect.height;
    if (rw < 4 || rh < 4) return;
    var nx = (clientX - rect.left) / rw * 2 - 1;
    var ny = -((clientY - rect.top) / rh * 2 - 1);
    S.mouseRaw[0] = nx < -1 ? -1 : (nx > 1 ? 1 : nx);
    S.mouseRaw[1] = ny < -1 ? -1 : (ny > 1 ? 1 : ny);
  }

  document.addEventListener('mousemove', function (e) {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    pointerToNorm(e.clientX, e.clientY, C);
  }, { passive: true });

  if (window.PointerEvent) {
    C.addEventListener('pointerdown', function (e) {
      pointerToNorm(e.clientX, e.clientY, C);
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        try { C.setPointerCapture(e.pointerId); } catch (err) { }
      }
    }, { passive: true });
    C.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') return;
      pointerToNorm(e.clientX, e.clientY, C);
    }, { passive: true });
    C.addEventListener('pointerup', function (e) {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        try { C.releasePointerCapture(e.pointerId); } catch (err2) { }
      }
    }, { passive: true });
    C.addEventListener('pointercancel', function (e) {
      try { C.releasePointerCapture(e.pointerId); } catch (err3) { }
    }, { passive: true });
  } else {
    /**
     * Single-touch fallback when `PointerEvent` is unavailable; `touchmove` may call `preventDefault`.
     * @param {TouchEvent} ev
     * @returns {void}
     */
    function legacyCanvasTouch(ev) {
      if (!ev.touches || ev.touches.length !== 1) return;
      var t = ev.touches[0];
      pointerToNorm(t.clientX, t.clientY, C);
      if (ev.type === 'touchmove') ev.preventDefault();
    }
    C.addEventListener('touchstart', legacyCanvasTouch, { passive: true });
    C.addEventListener('touchmove', legacyCanvasTouch, { passive: false });
  }

  /* ---- Public API -------------------------------------------------- */
  NX.gl = gl;
  NX.C = C;
  NX.S = S;
  NX.P = P;
  NX.VS = VS;
  NX.abuf = abuf;
  NX.atex = atex;
  NX.sceneProgs = [];
  NX.postProgs = {};
  NX.scenes = [];
  NX.mkProg = mkProg;
  NX.mkRT = mkRT;
  NX.u = u;
  NX.bindQuad = bindQuad;
  NX.shapeDrive = shapeDrive;
  NX.setCommonUniforms = setCommonUniforms;
  NX.prewarmCache = prewarmCache;
  NX.resize = resize;
  NX.setQualityPreset = setQualityPreset;
  NX.getRenderScale = getRenderScale;
  NX.applyRenderScaleOnly = applyRenderScaleOnly;
  NX.goNext = goNext;
  NX.goPrev = goPrev;
  NX.goRandom = goRandom;
  NX.showName = showName;
  NX.applySessionSceneStart = applySessionSceneStart;
  NX.loop = loop;
  NX.getAutoMorphIntervalSec = getAutoMorphIntervalSec;

  var _vizPerfOwnedLock = false;
  /**
   * Live “visual performance” preset: favors stable FPS (does not change the quality `<select>`).
   * When enabling, may take temporary ownership of `S.nexusPerfLock` until disabled.
   * @param {boolean} on - Enable capped trails/bloom and perf lock assist.
   * @returns {void}
   */
  function setVizPerformanceMode(on) {
    if (on) {
      S.nexusVizPerformance = true;
      if (!S.nexusPerfLock) {
        S.nexusPerfLock = true;
        _vizPerfOwnedLock = true;
      }
      if (S.nexusPostTrails > 0.06) S.nexusPostTrails = 0.06;
      if (S.postBloomMul > 1) S.postBloomMul = Math.min(S.postBloomMul, 0.98);
      resize();
    } else {
      S.nexusVizPerformance = false;
      if (_vizPerfOwnedLock) {
        S.nexusPerfLock = false;
        _vizPerfOwnedLock = false;
      }
      resize();
    }
  }

  NX.setVizPerformanceMode = setVizPerformanceMode;

  /* First paint: window "resize" does not always fire on load; without this, fbA stays null → black canvas. */
  try {
    resize();
  } catch (eInit) {
    console.warn('NEXUS: initial resize failed', eInit);
  }
  requestAnimationFrame(function () {
    try { resize(); } catch (eRaf) { }
  });
})();
