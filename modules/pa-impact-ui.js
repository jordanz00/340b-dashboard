/**
 * HAP 340B Pennsylvania Impact Mode — UI
 * ======================================
 *
 * Renders the PA Impact Mode panel. Uses textContent only (no innerHTML with data).
 * Loads after pa-impact-data.js and pa-impact-engine.js.
 */

(function (global) {
  "use strict";

  var PA = global.HAP340B_PA_IMPACT;

  if (!PA || !PA.getPaImpact) return;

  var CONTAINER_ID = "pa-impact-mode-root";
  var SCENARIO_BTN_PREFIX = "pa-impact-btn-";

  function safeText(val) {
    if (val == null || typeof val !== "string") return "";
    return String(val).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text || "";
    return el;
  }

  /* ==========================================
     PA IMPACT MODE UI — RENDER
     ========================================== */
  function renderPanel(root) {
    if (!root) return;

    root.replaceChildren();

    var header = document.createElement("header");
    header.className = "pa-impact-header";
    header.appendChild(makeEl("p", "pa-impact-title", "Pennsylvania Impact Mode"));
    header.appendChild(makeEl("h2", "pa-impact-headline", "340B impact estimates for PA"));
    header.appendChild(makeEl("p", "pa-impact-sub", "See how policy scenarios affect Pennsylvania hospitals, pharmacies, and patient access. Values are illustrative for advocacy."));
    root.appendChild(header);

    var ids = PA.getScenarioIds();
    var btnGroup = document.createElement("div");
    btnGroup.className = "pa-impact-buttons";
    btnGroup.setAttribute("role", "group");
    btnGroup.setAttribute("aria-label", "Select policy scenario");

    ids.forEach(function (id, i) {
      var est = PA.getPaImpact(id);
      if (!est) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pa-impact-btn" + (i === 1 ? " active" : "");
      btn.id = SCENARIO_BTN_PREFIX + id;
      btn.setAttribute("aria-pressed", i === 1 ? "true" : "false");
      btn.setAttribute("aria-label", "Show " + safeText(id.replace(/_/g, " ").toLowerCase()) + " scenario");
      btn.textContent = id === "EXPAND_PROTECTIONS" ? "Expand protections" : id === "CURRENT_STATUS" ? "Current status" : "Remove protections";
      btnGroup.appendChild(btn);
    });

    root.appendChild(btnGroup);

    var results = document.createElement("div");
    results.className = "pa-impact-results";
    results.id = "pa-impact-results";
    results.setAttribute("aria-live", "polite");
    root.appendChild(results);

    return results;
  }

  function renderResults(container, scenarioId) {
    if (!container) return;

    var data = PA.getPaImpact(scenarioId);
    if (!data) return;

    container.replaceChildren();

    var grid = document.createElement("div");
    grid.className = "pa-impact-grid";

    var metrics = [
      { label: "72 PA hospitals — program status", value: safeText(data.hospitalProgramStatus), note: data.hospitalsNote },
      { label: "Pharmacies affected", value: String(data.pharmaciesAffected), note: data.pharmaciesNote },
      { label: "Patient access", value: data.patientAccessChange, note: data.patientAccessNote },
      { label: "Community benefit", value: data.communityBenefitImpact, note: data.communityBenefitNote },
    ];

    metrics.forEach(function (m) {
      var card = document.createElement("div");
      card.className = "pa-impact-card";
      card.appendChild(makeEl("p", "pa-impact-label", m.label));
      card.appendChild(makeEl("p", "pa-impact-value", m.value));
      card.appendChild(makeEl("p", "pa-impact-note", safeText(m.note)));
      grid.appendChild(card);
    });

    container.appendChild(grid);

    var narrative = document.createElement("p");
    narrative.className = "pa-impact-narrative";
    narrative.textContent = safeText(data.narrative);
    container.appendChild(narrative);
  }

  function init() {
    var root = document.getElementById(CONTAINER_ID);
    if (!root) return;

    var resultsEl = renderPanel(root);
    if (!resultsEl) return;

    var ids = PA.getScenarioIds();
    renderResults(resultsEl, PA.SCENARIO_CURRENT);

    ids.forEach(function (id, index) {
      var btn = document.getElementById(SCENARIO_BTN_PREFIX + id);
      if (!btn) return;

      btn.addEventListener("click", function () {
        ids.forEach(function (oid, i) {
          var b = document.getElementById(SCENARIO_BTN_PREFIX + oid);
          if (b) {
            b.classList.toggle("active", i === index);
            b.setAttribute("aria-pressed", i === index ? "true" : "false");
          }
        });
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
