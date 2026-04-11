'use strict';
/**
 * Cold-start polish: curated first scene when no ?seed=, mild broadcast-style post tuning.
 * Runs after applySessionSceneStart() so share links with seed stay deterministic.
 */
(function () {
  function hasExplicitSeedInUrl() {
    return NX.BootstrapQuery && typeof NX.BootstrapQuery.hasExplicitSeedInUrl === 'function'
      ? NX.BootstrapQuery.hasExplicitSeedInUrl()
      : false;
  }

  function pickShowcaseSceneIndex() {
    var scenes = NX.scenes || [];
    var needles = ['HYPERSPACE', 'LASER', 'NEBULA', 'TUNNEL', 'WORMHOLE', 'PLASMA'];
    for (var n = 0; n < needles.length; n++) {
      for (var i = 0; i < scenes.length; i++) {
        var nm = (scenes[i].n || '').toUpperCase();
        if (nm.indexOf(needles[n]) >= 0) return i;
      }
    }
    return 0;
  }

  /**
   * @returns {void}
   */
  function applyCuratedColdStart() {
    var S = NX.S;
    if (!S || !NX.scenes || !NX.scenes.length) return;
    if (hasExplicitSeedInUrl()) return;
    var idx = pickShowcaseSceneIndex();
    S.curS = idx;
    S.nxtS = (idx + 1) % NX.scenes.length;
    /* 1080p60-friendly defaults: slight bloom lift, subtle trails, stable Aurora rate */
    S.postBloomMul = Math.max(typeof S.postBloomMul === 'number' ? S.postBloomMul : 1, 1.06);
    S.nexusPostTrails = Math.max(typeof S.nexusPostTrails === 'number' ? S.nexusPostTrails : 0, 0.045);
    S.bcSpeed = typeof S.bcSpeed === 'number'
      ? Math.min(0.78, Math.max(0.64, S.bcSpeed))
      : 0.7;
  }

  window.NX = window.NX || {};
  NX.ShipDefaults = {
    applyCuratedColdStart: applyCuratedColdStart,
    pickShowcaseSceneIndex: pickShowcaseSceneIndex
  };
})();
