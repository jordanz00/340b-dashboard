'use strict';
/**
 * Single shipping version for UI, showfiles, and engine facade.
 * Bump here and add a line to CHANGELOG.md for each release.
 */
(function (w) {
  w.NexusRelease = {
    version: '1.0.0',
    releaseTag: '1.0.0',
    changelogHref: 'CHANGELOG.md',
    /** @returns {void} */
    initUi: function () {
      var chip = document.getElementById('nx-version-chip');
      if (chip) chip.textContent = 'v' + w.NexusRelease.version;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
