'use strict';
/**
 * First-run onboarding after splash: audio → visual mode → present → MIDI (skippable).
 */
(function () {
  var STORAGE_KEY = 'nx_onboard_done_v1';
  var step = 0;

  function hide() {
    var root = document.getElementById('nx-onboard');
    if (root) {
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
    }
  }

  function show() {
    var root = document.getElementById('nx-onboard');
    if (root) {
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
    }
    setStep(0);
  }

  function setStep(n) {
    step = n;
    var root = document.getElementById('nx-onboard');
    if (!root) return;
    var panes = root.querySelectorAll('[data-ob-step]');
    panes.forEach(function (p) {
      var on = parseInt(p.getAttribute('data-ob-step'), 10) === n;
      p.hidden = !on;
    });
    var lab = root.querySelector('#nx-onboard-step-label');
    if (lab) lab.textContent = 'Step ' + (n + 1) + ' / ' + panes.length;
  }

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (e) { /* ignore */ }
    hide();
  }

  /**
   * Call after splash / app reveal when first-time user.
   * @returns {void}
   */
  function maybeStart() {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch (e) {
      return;
    }
    show();
  }

  function wire() {
    var root = document.getElementById('nx-onboard');
    if (!root) return;

    root.querySelectorAll('[data-ob-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var total = root.querySelectorAll('[data-ob-step]').length;
        if (total < 1) return;
        if (step < total - 1) setStep(step + 1);
        else finish();
      });
    });

    root.querySelectorAll('[data-ob-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-ob-action');
        if (act === 'tab-audio' && window.NXShell && NXShell.setTab) NXShell.setTab('audio');
        if (act === 'tab-aurora' && window.NXShell && NXShell.setTab) NXShell.setTab('aurora');
        if (act === 'present' && NX.ui && typeof NX.ui.togglePresent === 'function') {
          if (!NX.S.presentMode) NX.ui.togglePresent();
        }
        if (act === 'tab-more' && window.NXShell && NXShell.setTab) NXShell.setTab('more');
      });
    });

    var skip = root.querySelector('[data-ob-skip]');
    if (skip) skip.addEventListener('click', finish);
    var reset = root.querySelector('[data-ob-reset]');
    if (reset) {
      reset.addEventListener('click', function () {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
        show();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  window.NX = window.NX || {};
  NX.Onboard = {
    maybeStart: maybeStart,
    finish: finish,
    showAgainForDebug: show
  };
  /* Back-compat alias */
  window.NXOnboard = NX.Onboard;
})();
