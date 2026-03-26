/**
 * Data Validation — 340B Advocacy Dashboard
 * ==========================================
 * Runs on load to check STATE_340B, STATE_NAMES, CONFIG for consistency.
 * Writes warnings to the console and optionally to a small on-page banner for maintainers.
 *
 * NOVICE: If you see a validation warning, fix the listed file (usually state-data.js).
 */
(function (global) {
  "use strict";

  var warnings = [];

  function warn(msg) {
    warnings.push(msg);
    if (global.console && console.warn) {
      console.warn("[340B Data Validation] " + msg);
    }
  }

  function validate() {
    warnings = [];
    if (typeof STATE_340B !== "object" || STATE_340B === null) {
      warn("STATE_340B is missing or not an object. Check state-data.js.");
      return;
    }
    if (typeof STATE_NAMES !== "object" || STATE_NAMES === null) {
      warn("STATE_NAMES is missing or not an object. Check state-data.js.");
    }
    if (typeof CONFIG !== "object" || CONFIG === null) {
      warn("CONFIG is missing or not an object. Check state-data.js.");
    }
    var stateKeys = Object.keys(STATE_340B);
    for (var i = 0; i < stateKeys.length; i++) {
      var abbr = stateKeys[i];
      if (STATE_NAMES && !STATE_NAMES[abbr]) {
        warn("STATE_340B has '" + abbr + "' but STATE_NAMES has no entry for it. Add " + abbr + " to STATE_NAMES in state-data.js.");
      }
      var row = STATE_340B[abbr];
      if (!row || typeof row !== "object") {
        warn("STATE_340B." + abbr + " should be an object { y, pbm, cp, notes }. Fix state-data.js.");
        continue;
      }
      if (typeof row.cp !== "boolean") warn("STATE_340B." + abbr + ".cp should be true or false.");
      if (typeof row.pbm !== "boolean") warn("STATE_340B." + abbr + ".pbm should be true or false.");
      if (row.y != null && (typeof row.y !== "number" || row.y < 1990 || row.y > 2030)) {
        warn("STATE_340B." + abbr + ".y should be a 4-digit year or null.");
      }
    }
    if (typeof CONFIG === "object" && CONFIG !== null) {
      if (!CONFIG.lastUpdated || typeof CONFIG.lastUpdated !== "string") {
        warn("CONFIG.lastUpdated should be a string (e.g. 'March 2025').");
      }
      if (global.DATASET_METADATA && DATASET_METADATA.lastUpdated !== CONFIG.lastUpdated) {
        warn("data/dataset-metadata.js lastUpdated does not match CONFIG.lastUpdated in state-data.js. Keep them in sync.");
      }
    }
    return warnings;
  }

  function showBannerIfWarnings() {
    if (warnings.length === 0) return;
    var banner = document.getElementById("data-validation-banner");
    if (!banner) return;
    banner.className = "data-validation-banner data-validation-banner--warn";
    banner.setAttribute("role", "alert");
    var p = banner.querySelector("p");
    if (p) p.textContent = "Data validation: " + warnings.length + " issue(s) found. Check the browser console (F12) for details.";
    banner.style.display = "block";
  }

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      validate();
      showBannerIfWarnings();
    });
  } else {
    validate();
    showBannerIfWarnings();
  }

  global.validate340BData = validate;
})(typeof window !== "undefined" ? window : this);
