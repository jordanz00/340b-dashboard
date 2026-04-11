'use strict';
/**
 * Single shipping version for UI, showfiles, and engine facade.
 * Bump here and add a line to CHANGELOG.md for each release.
 */
(function (w) {
  /**
   * Canonical public deployment (GitHub Pages project site).
   * Monorepo copies live under `NEXUS/` in 340b-dashboard; Pages for this product is the repo below.
   */
  var PAGES_BASE = 'https://jordanz00.github.io/nexus-music-visualizer/';
  var SOURCE_REPO = 'https://github.com/jordanz00/nexus-music-visualizer';

  /**
   * Build a URL on the canonical host with the same query/hash as `fromUrl` (e.g. ?seed=).
   * @param {string} fromUrl
   * @returns {string}
   */
  function toCanonAppUrl(fromUrl) {
    var base = new URL(PAGES_BASE);
    var src = new URL(fromUrl);
    var out = new URL(base.href);
    out.search = src.search;
    out.hash = src.hash || '';
    return out.toString();
  }

  w.NexusRelease = {
    version: '1.0.1',
    releaseTag: '1.0.1',
    changelogHref: 'CHANGELOG.md',
    /** Trailing slash — canonical GitHub Pages root for NEXUS */
    pagesBaseUrl: PAGES_BASE,
    /** Public source / issues */
    sourceRepoUrl: SOURCE_REPO,
    toCanonAppUrl: toCanonAppUrl,
    /** @returns {void} */
    initUi: function () {
      var chip = document.getElementById('nx-version-chip');
      if (chip) chip.textContent = 'v' + w.NexusRelease.version;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
