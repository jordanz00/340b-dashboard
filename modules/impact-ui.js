/**
 * HAP 340B Policy Impact Simulator — UI
 * =====================================
 *
 * Renders the simulator panel and handles user interaction.
 * Loads after impact-data.js and impact-simulator.js.
 *
 * ISOLATION: Does not modify 340b.js, map, print, or PDF.
 * Uses only textContent for dynamic content (no innerHTML with data).
 */

(function (global) {
  "use strict";

  var IMPACT = global.HAP340B_IMPACT;

  if (!IMPACT || !IMPACT.getScenarioImpact) {
    return;
  }

  /* ==========================================
     IMPACT SIMULATOR UI — CONFIG
     ==========================================
     IDs and selectors. Matches 340b.html structure.
     */
  var CONTAINER_ID = "policy-impact-simulator-root";
  var SCENARIO_BTN_PREFIX = "impact-scenario-btn-";

  /**
   * Strip control characters. Use for any dynamic text.
   */
  function safeText(val) {
    if (val == null || typeof val !== "string") return "";
    return String(val).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  /**
   * Format pharmacy count for display.
   */
  function formatPharmacyCount(n) {
    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return String(n);
  }

  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text || "";
    return el;
  }

  /* ==========================================
     IMPACT SIMULATOR UI — RENDER
     ==========================================
     Builds the panel HTML structure (via DOM, not innerHTML with data).
     */
  function renderSimulator(root) {
    if (!root) return;

    root.replaceChildren();

    var header = document.createElement("header");
    header.className = "impact-simulator-header";
    header.appendChild(makeEl("span", "impact-simulator-badge", "Advocacy tool"));
    header.appendChild(makeEl("p", "impact-simulator-title", "Policy Impact Simulator"));
    header.appendChild(makeEl("h2", "impact-simulator-headline", "What happens if we protect the discount—or don’t?"));
    header.appendChild(makeEl("p", "impact-simulator-sub", "Tap a scenario below. See how each path affects hospitals, pharmacies, and patients—in plain terms."));
    root.appendChild(header);

    var scenarioIds = IMPACT.getScenarioIds();
    var buttonGroup = document.createElement("div");
    buttonGroup.className = "impact-simulator-buttons";
    buttonGroup.setAttribute("role", "group");
    buttonGroup.setAttribute("aria-label", "Select policy scenario");

    scenarioIds.forEach(function (id, index) {
      var data = IMPACT.getScenarioImpact(id);
      if (!data) return;

      var slug = id === IMPACT.SCENARIO_EXPAND ? "expand" : id === IMPACT.SCENARIO_REMOVE ? "rollback" : "current";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "impact-scenario-btn impact-scenario-btn--" + slug + (index === 1 ? " active" : "");
      btn.id = SCENARIO_BTN_PREFIX + id;
      btn.setAttribute("aria-pressed", index === 1 ? "true" : "false");
      btn.setAttribute("aria-label", "Show " + safeText(data.label) + " scenario");
      btn.textContent = data.label;
      buttonGroup.appendChild(btn);
    });

    root.appendChild(buttonGroup);

    var results = document.createElement("div");
    results.className = "impact-simulator-results";
    results.id = "impact-simulator-results";
    results.setAttribute("aria-live", "polite");
    root.appendChild(results);

    return results;
  }

  /**
   * Renders the impact results for the selected scenario.
   * Uses createElement + textContent only (no innerHTML with data).
   */
  function renderResults(container, scenarioId) {
    if (!container) return;

    var data = IMPACT.getScenarioImpact(scenarioId);
    if (!data) return;

    container.replaceChildren();
    var scenarioSlug = scenarioId === IMPACT.SCENARIO_EXPAND ? "expand" : scenarioId === IMPACT.SCENARIO_REMOVE ? "rollback" : "current";
    container.setAttribute("data-scenario", scenarioSlug);

    if (data.takeaway) {
      var takeawayEl = document.createElement("p");
      takeawayEl.className = "impact-takeaway";
      takeawayEl.textContent = safeText(data.takeaway);
      container.appendChild(takeawayEl);
    }

    var grid = document.createElement("div");
    grid.className = "impact-results-grid";

    var card1Label = "Hospital–pharmacy partnerships";
    var card1Value = data.pharmaciesDisplayValue != null ? String(data.pharmaciesDisplayValue) : formatPharmacyCount(data.pharmaciesImpacted);
    var card1Note = data.pharmaciesNote != null ? data.pharmaciesNote : safeText(data.pharmaciesLabel);

    var card1 = document.createElement("div");
    card1.className = "impact-result-card";
    card1.appendChild(makeEl("p", "impact-result-label", card1Label));
    card1.appendChild(makeEl("p", "impact-result-value", card1Value));
    card1.appendChild(makeEl("p", "impact-result-note", safeText(card1Note)));
    grid.appendChild(card1);

    var card2 = document.createElement("div");
    card2.className = "impact-result-card";
    card2.appendChild(makeEl("p", "impact-result-label", "Patient access to affordable meds"));
    card2.appendChild(makeEl("p", "impact-result-value", safeText(data.patientAccessImpact)));
    card2.appendChild(makeEl("p", "impact-result-note", safeText(data.patientAccessNote)));
    grid.appendChild(card2);

    var card3 = document.createElement("div");
    card3.className = "impact-result-card";
    card3.appendChild(makeEl("p", "impact-result-label", "Hospital program stability"));
    card3.appendChild(makeEl("p", "impact-result-value", safeText(data.hospitalFundingImpact)));
    card3.appendChild(makeEl("p", "impact-result-note", safeText(data.hospitalFundingNote)));
    grid.appendChild(card3);

    container.appendChild(grid);

    var narrative = document.createElement("p");
    narrative.className = "impact-narrative";
    narrative.textContent = safeText(data.narrative);
    container.appendChild(narrative);
  }

  /* ==========================================
     IMPACT SIMULATOR UI — INIT
     ==========================================
     Mounts the simulator and binds events. Called after DOM ready.
     */
  function init() {
    var root = document.getElementById(CONTAINER_ID);
    if (!root) return;

    var resultsEl = renderSimulator(root);
    if (!resultsEl) return;

    var scenarioIds = IMPACT.getScenarioIds();
    var activeIndex = 1;

    renderResults(resultsEl, IMPACT.SCENARIO_CURRENT);

    scenarioIds.forEach(function (id, index) {
      var btn = document.getElementById(SCENARIO_BTN_PREFIX + id);
      if (!btn) return;

      btn.addEventListener("click", function () {
        scenarioIds.forEach(function (oid, i) {
          var b = document.getElementById(SCENARIO_BTN_PREFIX + oid);
          if (b) {
            b.classList.toggle("active", i === index);
            b.setAttribute("aria-pressed", i === index ? "true" : "false");
          }
        });
        activeIndex = index;
        renderResults(resultsEl, id);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(typeof window !== "undefined" ? window : this);
