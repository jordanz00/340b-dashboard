'use strict';
/**
 * MeydaAnalyzer — optional MIT Meyda feature extractors (lazy script load).
 *
 * WHO THIS IS FOR: operators / devs who want extra audio descriptors for future directors.
 * WHAT IT DOES: Injects vendor/meyda.min.js on first enable; runs Meyda on gainNode; writes
 *   smoothed NX.S.meydaRms, meydaSpectralCentroid, meydaZcr for HUD / AudioEngine snapshot.
 * HOW IT CONNECTS: UI checkbox in Audio tab; requires mic/graph (NX.audio graph must exist).
 *
 * PERF: Off by default; when on, adds parallel analysis work — use Perf preset on low-end GPUs.
 */
(function () {
  if (!NX.S) return;
  var S = NX.S;
  var _loading = false;
  var _analyzer = null;
  var _scriptRequested = false;

  function vendorUrl() {
    try {
      return new URL('vendor/meyda.min.js', document.baseURI || location.href).href;
    } catch (e) {
      return 'vendor/meyda.min.js';
    }
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error('meyda load failed: ' + src)); };
      document.head.appendChild(el);
    });
  }

  function getMeyda() {
    var g = typeof globalThis !== 'undefined' ? globalThis : window;
    return g.Meyda || (g.window && g.window.Meyda) || null;
  }

  function stopInternal() {
    if (_analyzer && typeof _analyzer.stop === 'function') {
      try { _analyzer.stop(); } catch (e) { /* ignore */ }
    }
    _analyzer = null;
  }

  function smooth(key, val, k) {
    var prev = typeof S[key] === 'number' ? S[key] : 0;
    S[key] = prev + (val - prev) * k;
  }

  function startAnalyzer(Meyda) {
    stopInternal();
    if (!S.audioCtx || !S.gainNode) return false;
    if (typeof Meyda.createMeydaAnalyzer !== 'function') {
      console.warn('Meyda: createMeydaAnalyzer missing');
      return false;
    }
    var buf = 512;
    try {
      _analyzer = Meyda.createMeydaAnalyzer({
        audioContext: S.audioCtx,
        source: S.gainNode,
        bufferSize: buf,
        featureExtractors: ['rms', 'spectralCentroid', 'zcr'],
        callback: function (fe) {
          if (!S.meydaEnabled) return;
          if (!fe) return;
          var dt = 0.08;
          if (fe.rms != null) smooth('meydaRms', Math.min(1, fe.rms * 2.2), dt);
          if (fe.spectralCentroid != null) {
            var c = fe.spectralCentroid / (S.audioCtx.sampleRate * 0.5);
            smooth('meydaSpectralCentroid', Math.min(1, Math.max(0, c)), dt);
          }
          if (fe.zcr != null) smooth('meydaZcr', Math.min(1, fe.zcr * 0.5), dt);
        }
      });
      if (_analyzer && typeof _analyzer.start === 'function') _analyzer.start();
      return true;
    } catch (e) {
      console.warn('Meyda start failed:', e && e.message);
      _analyzer = null;
      return false;
    }
  }

  function setEnabled(on) {
    S.meydaEnabled = !!on;
    if (!S.meydaEnabled) {
      stopInternal();
      S.meydaRms = 0;
      S.meydaSpectralCentroid = 0;
      S.meydaZcr = 0;
      return Promise.resolve(false);
    }
    if (_analyzer) return Promise.resolve(true);
    if (_loading) return Promise.resolve(false);
    var Meyda = getMeyda();
    if (Meyda) {
      return Promise.resolve(startAnalyzer(Meyda));
    }
    if (_scriptRequested) return Promise.resolve(false);
    _loading = true;
    _scriptRequested = true;
    return loadScript(vendorUrl())
      .then(function () {
        _loading = false;
        var M = getMeyda();
        if (!M) {
          console.warn('Meyda global missing after load');
          return false;
        }
        return startAnalyzer(M);
      })
      .catch(function (e) {
        _loading = false;
        console.warn(e && e.message);
        S.meydaEnabled = false;
        return false;
      });
  }

  /** Call after mic starts / graph rebuild so Meyda rebinds to gainNode. */
  function reconnect() {
    if (!S.meydaEnabled) return;
    var M = getMeyda();
    if (M) startAnalyzer(M);
  }

  NX.MeydaAnalyzer = {
    setEnabled: setEnabled,
    reconnect: reconnect,
    isActive: function () { return !!_analyzer; }
  };
})();
