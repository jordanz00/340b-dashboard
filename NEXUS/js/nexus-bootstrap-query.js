'use strict';
/**
 * Allowlisted URL query helpers (?demo=, explicit ?seed= detection).
 * Keep DEMO_IDS in sync with tests/nexus/nx-bootstrap-query.test.mjs
 */
(function (w) {
  var DEMO_IDS = {
    drop: 1,
    festival: 1,
    genres: 1,
    ai: 1,
    resolume: 1
  };

  /**
   * @param {string|null|undefined} raw
   * @returns {string|null}
   */
  function normalizeDemo(raw) {
    if (raw == null) return null;
    var s = String(raw).trim();
    try {
      s = decodeURIComponent(s.replace(/\+/g, ' '));
    } catch (e) { /* ignore */ }
    s = s.replace(/[^a-z0-9_-]/gi, '').slice(0, 48).toLowerCase();
    if (!s || !DEMO_IDS[s]) return null;
    return s;
  }

  function hasExplicitSeedInUrl() {
    try {
      return new URL(w.location.href).searchParams.has('seed');
    } catch (e) {
      return false;
    }
  }

  w.NX = w.NX || {};
  w.NX.BootstrapQuery = {
    DEMO_IDS: DEMO_IDS,
    normalizeDemo: normalizeDemo,
    hasExplicitSeedInUrl: hasExplicitSeedInUrl
  };
})(typeof window !== 'undefined' ? window : globalThis);
