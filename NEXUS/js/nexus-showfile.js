'use strict';
/**
 * Showfile v1 — JSON snapshot for repeat gigs (extends preset capture + clock + post chain).
 */
(function () {
  var SCHEMA = 1;

  function getClockMode() {
    var el = document.getElementById('nx-show-mode');
    return el && el.value ? el.value : 'internal';
  }

  function build() {
    if (!NX.presets || typeof NX.presets.capture !== 'function') {
      throw new Error('NEXUS: presets not ready');
    }
    var S = NX.S;
    var preset = NX.presets.capture();
    var rel = typeof NexusRelease !== 'undefined' && NexusRelease ? NexusRelease.version : '';
    var live =
      typeof NexusRelease !== 'undefined' && NexusRelease && NexusRelease.pagesBaseUrl
        ? NexusRelease.pagesBaseUrl
        : '';
    return {
      nxShowfile: SCHEMA,
      appVersion: rel,
      canonicalLiveUrl: live,
      savedAt: new Date().toISOString(),
      preset: preset,
      showClockMode: getClockMode(),
      postChain: S && S.postChain ? JSON.parse(JSON.stringify(S.postChain)) : null
    };
  }

  function downloadJson(obj, filename) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || ('NEXUS_showfile_' + Date.now() + '.json');
    a.click();
    setTimeout(function () { try { URL.revokeObjectURL(a.href); } catch (e) { /* ignore */ } }, 4000);
  }

  /**
   * @returns {void}
   */
  function exportShowfile() {
    downloadJson(build(), 'NEXUS_showfile.json');
  }

  /**
   * @param {object} data
   * @returns {void}
   */
  function applyShowfile(data) {
    if (!data || data.nxShowfile !== SCHEMA) {
      throw new Error('Invalid showfile (expected nxShowfile: ' + SCHEMA + ')');
    }
    if (data.preset && NX.presets && typeof NX.presets.apply === 'function') {
      NX.presets.apply(data.preset);
    }
    if (data.postChain && NX.S) {
      var pc = data.postChain;
      NX.S.postChain = NX.S.postChain || {};
      ['bloom', 'streak', 'grade', 'trails', 'kaleido', 'glitch'].forEach(function (k) {
        if (pc[k] != null) NX.S.postChain[k] = !!pc[k];
      });
      if (NX.FxChain && typeof NX.FxChain.syncCheckboxes === 'function') {
        NX.FxChain.syncCheckboxes();
      }
    }
    if (data.showClockMode) {
      var sel = document.getElementById('nx-show-mode');
      if (sel) {
        var allowed = { internal: 1, bpm: 1, mtc: 1, ltc: 1 };
        if (allowed[data.showClockMode]) {
          sel.value = data.showClockMode;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
    if (NX.ui && typeof NX.ui.syncControls === 'function') NX.ui.syncControls();
  }

  /**
   * @param {File} file
   * @returns {void}
   */
  function importFromFile(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        applyShowfile(JSON.parse(String(r.result || '')));
      } catch (e) {
        if (typeof console !== 'undefined' && console.warn) console.warn('NEXUS: showfile import failed', e);
      }
    };
    r.readAsText(file);
  }

  function wireButtons() {
    var ex = document.getElementById('nx-showfile-export');
    var imBtn = document.getElementById('nx-showfile-import-btn');
    var imFi = document.getElementById('nx-showfile-import-file');
    if (ex) ex.addEventListener('click', function () { try { exportShowfile(); } catch (e) { console.warn(e); } });
    if (imBtn && imFi) {
      imBtn.addEventListener('click', function () { imFi.click(); });
      imFi.addEventListener('change', function () {
        var f = imFi.files && imFi.files[0];
        if (f) importFromFile(f);
        imFi.value = '';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireButtons);
  } else {
    wireButtons();
  }

  window.NX = window.NX || {};
  NX.Showfile = {
    SCHEMA: SCHEMA,
    build: build,
    exportShowfile: exportShowfile,
    applyShowfile: applyShowfile,
    importFromFile: importFromFile
  };
})();
