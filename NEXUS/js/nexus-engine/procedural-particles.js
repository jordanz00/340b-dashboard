'use strict';
/**
 * @file procedural-particles.js
 * @summary Lightweight 2D canvas particle field: value-noise “curl”, toroidal wrap,
 *   seed-driven hues — sits under main WebGL (`#c`) for soft procedural depth.
 *
 * @dependencies `NX.S`, `#nx-proc-particles` canvas, optional `NX.ProceduralDrive` for hue drift.
 */
(function () {
  var GOLD = 0.618033988749895;
  var canvas = null;
  var ctx = null;
  var W = 320;
  var H = 240;
  var parts = [];
  var nPart = 240;
  var seedSalt = 1;
  var grid = 9;
  var tNoise = 0;
  var inited = false;
  var reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /**
   * Deterministic [0,1) hash for integer cell + salt.
   * @param {number} ix
   * @param {number} iy
   * @returns {number}
   */
  function h01(ix, iy) {
    var s = Math.sin((ix * 12.9898 + iy * 78.233 + seedSalt) * 0.05) * 43758.5453;
    return s - Math.floor(s);
  }

  /**
   * Bilinear value noise on a coarse grid, drifted by `tNoise`.
   * @param {number} x — pixel x
   * @param {number} y — pixel y
   * @returns {number}
   */
  function vnoise(x, y) {
    var s = tNoise * 0.018;
    var gx = (x / W) * grid + s;
    var gy = (y / H) * grid + s * GOLD;
    var x0 = Math.floor(gx);
    var y0 = Math.floor(gy);
    var tx = gx - x0;
    var ty = gy - y0;
    var u = tx * tx * (3 - 2 * tx);
    var v = ty * ty * (3 - 2 * ty);
    var a = h01(x0, y0);
    var b = h01(x0 + 1, y0);
    var c = h01(x0, y0 + 1);
    var d = h01(x0 + 1, y0 + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }

  /**
   * Pseudo-curl from noise samples (offset field).
   * @param {number} x
   * @param {number} y
   * @returns {{ vx: number, vy: number }}
   */
  function curl(x, y) {
    var e = 2.4;
    var n1 = vnoise(x, y + e) - vnoise(x, y - e);
    var n2 = vnoise(x + e, y) - vnoise(x - e, y);
    return { vx: n1 * 22, vy: -n2 * 22 };
  }

  /**
   * Build or rebuild particle state from `NX.S.sessionSeed` and canvas size.
   * @returns {void}
   */
  function buildParticles() {
    parts = [];
    var rnd = typeof NX.randomUnit === 'function' ? NX.randomUnit : Math.random;
    var S = NX.S;
    seedSalt = (S && S.sessionSeed) ? (S.sessionSeed % 9973) : 1;
    var i;
    for (i = 0; i < nPart; i++) {
      parts.push({
        x: rnd() * W,
        y: rnd() * H,
        vx: 0,
        vy: 0,
        hue: (seedSalt * 0.17 + i * 37.7 + rnd() * 80) % 360,
        r: 0.55 + rnd() * 1.35,
        a: 0.06 + rnd() * 0.1
      });
    }
  }

  /**
   * Resize backing store (moderate resolution for perf).
   * @returns {void}
   */
  function resize() {
    var S = NX.S;
    var iw = typeof S.W === 'number' && S.W > 8 ? S.W : (window.innerWidth || 800);
    var ih = typeof S.H === 'number' && S.H > 8 ? S.H : (window.innerHeight || 600);
    var perf = S && S.nexusPerfLock;
    var scale = perf ? 0.42 : 0.58;
    if (reducedMotion) scale *= 0.5;
    W = Math.max(280, Math.floor(iw * scale));
    H = Math.max(200, Math.floor(ih * scale));
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    buildParticles();
  }

  /**
   * One-time canvas grab and first layout.
   * @returns {void}
   */
  function init() {
    if (inited) return;
    canvas = document.getElementById('nx-proc-particles');
    if (!canvas) return;
    ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    inited = true;
    resize();
    window.addEventListener('resize', function () { resize(); }, { passive: true });
  }

  /**
   * Re-seed field after session DNA changes.
   * @returns {void}
   */
  function reseed() {
    tNoise = 0;
    buildParticles();
  }

  /**
   * Integrate and draw one frame.
   * @param {number} dt
   * @returns {void}
   */
  function tick(dt) {
    if (!inited || !ctx || reducedMotion) return;
    var S = NX.S;
    if (!S) return;
    if (S && S.nexusPerfLock) {
      canvas.classList.add('nx-proc-dim');
    } else {
      canvas.classList.remove('nx-proc-dim');
    }
    if (!dt || dt > 0.08) dt = 0.016;
    tNoise += dt * 0.055;

    var vd = typeof S._visualDrive === 'number' ? S._visualDrive : 0;
    if (vd < 0) vd = 0;
    if (vd > 1) vd = 1;
    var spd = 0.1 + vd * 0.09;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = S.nexusPerfLock ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.102)';
    ctx.fillRect(0, 0, W, H);

    var ph = (NX.ProceduralDrive && typeof S.procHue === 'number') ? S.procHue * 40 : 0;
    var i;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      var cv = curl(p.x, p.y);
      p.vx = p.vx * 0.92 + cv.vx * dt * spd;
      p.vy = p.vy * 0.92 + cv.vy * dt * spd;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) p.x += W;
      else if (p.x > W) p.x -= W;
      if (p.y < 0) p.y += H;
      else if (p.y > H) p.y -= H;
      p.hue += 0.018 * dt * (0.5 + vd * 0.5);
      if (p.hue > 360) p.hue -= 360;
      ctx.beginPath();
      ctx.fillStyle = 'hsla(' + Math.round(p.hue + ph) + ',72%,62%,' + p.a + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  NX.ProcParticles = {
    init: init,
    tick: tick,
    resize: resize,
    reseed: reseed
  };
})();
