/**
 * HAP 340B Policy Impact Simulator — UI
 * =====================================
 *
 * Renders the simulator panel and handles user interaction.
 * Loads after impact-data.js and impact-simulator.js.
 *
 * ISOLATION: Does not modify 340b.js, map, print, or PDF.
 * Uses only textContent for dynamic content (no innerHTML with data).
 *
 * SURFACES: Mounts into any element whose id is listed in SIMULATOR_ROOT_IDS
 * (advanced dashboard). Each root gets its own scoped buttons
 * (data-impact-scenario-id) so there are no duplicate DOM ids.
 *
 * SEMANTIC LAYER: Scenario numbers are illustrative — see modules/impact-data.js
 * and powerbi/semantic-layer-registry.json (advocacyTools.policyImpactSimulator).
 */

(function (global) {
  "use strict";

  var IMPACT = global.HAP340B_IMPACT;

  if (!IMPACT || !IMPACT.getScenarioImpact) {
    return;
  }

  /**
   * Every container id we should initialize when present on the page.
   * AGENT[D1]: New mount point = add id here + registry row (+ page CSS if needed).
   */
  var SIMULATOR_ROOT_IDS = ["policy-impact-simulator-root"];

  var ROOT_SCENARIO_ATTR = "data-impact-scenario";
  var SCENARIO_META = {
    protect: {
      status: "Protections strengthened",
      detail: "Issue: weak state law. Impact: steadier access. Action: align states with full guardrails.",
      buttonHint: "Full protections storyline"
    },
    mix: {
      status: "Today’s mix",
      detail: "Issue: patchwork law. Impact: uneven access. Action: close gaps state by state.",
      buttonHint: "National picture now"
    },
    remove: {
      status: "Protections rolled back",
      detail: "Issue: lost statutory shields. Impact: acute pressure on access. Action: avoid rollback.",
      buttonHint: "High-risk storyline"
    }
  };

  function scenarioToken(id) {
    if (id === IMPACT.SCENARIO_EXPAND) return "protect";
    if (id === IMPACT.SCENARIO_REMOVE) return "remove";
    return "mix";
  }

  function applyScenarioVisualState(root, scenarioId) {
    if (!root) return;
    root.setAttribute(ROOT_SCENARIO_ATTR, scenarioToken(scenarioId));
  }

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

  /**
   * Stable, unique ids for a11y wiring (avoids duplicate ids when two simulators exist).
   */
  function rootIdPrefix(root) {
    return root && root.id ? root.id : "impact-simulator";
  }

  /**
   * Builds one simulator instance inside `root`. Returns the results container element.
   */
  function renderSimulator(root) {
    if (!root) return null;

    root.replaceChildren();
    var rid = rootIdPrefix(root);

    var header = document.createElement("header");
    header.className = "impact-simulator-header anim-in";
    header.appendChild(makeEl("p", "impact-simulator-kicker hap-section-eyebrow hap-section-eyebrow--on-light", "Policy simulator"));
    var title = document.createElement("h2");
    title.className = "impact-simulator-headline";
    /* Keep stable id on advanced dashboard for bookmarks / a11y extensions */
    title.id = root.id === "policy-impact-simulator-root" ? "impact-simulator-heading" : rid + "-heading";
    title.textContent = "Instant read: strengthen, hold, or roll back protections";
    header.appendChild(title);
    header.appendChild(
      makeEl(
        "p",
        "impact-simulator-lead",
        "Issue: how far state law goes. Impact: partnerships, access, stability. Action: pick a path to see the built-in storyline (not a live forecast)."
      )
    );
    var note = document.createElement("p");
    note.className = "impact-simulator-disclosure";
    note.setAttribute("role", "note");
    note.textContent =
      "Not a forecast or official estimate. Rounded counts and labels come from HAP’s built-in scenario table for advocacy briefings.";
    header.appendChild(note);
    root.appendChild(header);

    var scenarioIds = IMPACT.getScenarioIds();
    var toolbar = document.createElement("div");
    toolbar.className = "impact-simulator-toolbar anim-in";
    var toolbarLabel = document.createElement("p");
    toolbarLabel.className = "impact-simulator-toolbar-label";
    toolbarLabel.id = rid + "-scenario-label";
    toolbarLabel.textContent = "Scenario";
    toolbar.appendChild(toolbarLabel);

    var buttonGroup = document.createElement("div");
    buttonGroup.className = "impact-simulator-buttons impact-simulator-buttons--segmented";
    buttonGroup.setAttribute("role", "group");
    buttonGroup.setAttribute("aria-labelledby", toolbarLabel.id);

    scenarioIds.forEach(function (id, index) {
      var data = IMPACT.getScenarioImpact(id);
      if (!data) return;

      var slug = scenarioToken(id);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "impact-scenario-btn impact-scenario-btn--" + slug + (index === 1 ? " active" : "");
      btn.setAttribute("data-impact-scenario-id", id);
      btn.setAttribute("data-impact-scenario-btn", slug);
      btn.setAttribute("aria-pressed", index === 1 ? "true" : "false");
      btn.setAttribute("aria-label", safeText(data.label) + ". " + safeText(SCENARIO_META[slug].buttonHint));

      var labelSpan = document.createElement("span");
      labelSpan.className = "impact-scenario-btn__label";
      labelSpan.textContent = safeText(data.label);
      btn.appendChild(labelSpan);

      var hintSpan = document.createElement("span");
      hintSpan.className = "impact-scenario-btn__hint";
      hintSpan.textContent = safeText(SCENARIO_META[slug].buttonHint);
      btn.appendChild(hintSpan);

      buttonGroup.appendChild(btn);
    });

    toolbar.appendChild(buttonGroup);
    root.appendChild(toolbar);

    var results = document.createElement("div");
    results.className = "impact-simulator-results anim-in";
    results.id = rid + "-results";
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
    var scenarioSlug = scenarioToken(scenarioId);
    container.setAttribute("data-scenario", scenarioSlug);
    container.className = "impact-simulator-results impact-simulator-results--" + scenarioSlug + " anim-in";

    var scenarioSignal = document.createElement("div");
    scenarioSignal.className = "impact-scenario-signal";

    var signalAccent = document.createElement("div");
    signalAccent.className = "impact-scenario-signal-accent";
    signalAccent.setAttribute("aria-hidden", "true");
    scenarioSignal.appendChild(signalAccent);

    var signalBody = document.createElement("div");
    signalBody.className = "impact-scenario-signal-body";
    signalBody.appendChild(makeEl("p", "impact-scenario-signal-title", SCENARIO_META[scenarioSlug].status));
    signalBody.appendChild(makeEl("p", "impact-scenario-signal-detail", SCENARIO_META[scenarioSlug].detail));
    scenarioSignal.appendChild(signalBody);
    container.appendChild(scenarioSignal);

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
    card1.className = "impact-result-card hap-card-interactive";
    card1.appendChild(makeEl("p", "impact-result-value", card1Value));
    card1.appendChild(makeEl("p", "impact-result-label", card1Label));
    card1.appendChild(makeEl("p", "impact-result-note", safeText(card1Note)));
    grid.appendChild(card1);

    var card2 = document.createElement("div");
    card2.className = "impact-result-card hap-card-interactive";
    card2.appendChild(makeEl("p", "impact-result-value", safeText(data.patientAccessImpact)));
    card2.appendChild(makeEl("p", "impact-result-label", "Patient access to affordable medications"));
    card2.appendChild(makeEl("p", "impact-result-note", safeText(data.patientAccessNote)));
    grid.appendChild(card2);

    var card3 = document.createElement("div");
    card3.className = "impact-result-card hap-card-interactive";
    card3.appendChild(makeEl("p", "impact-result-value", safeText(data.hospitalFundingImpact)));
    card3.appendChild(makeEl("p", "impact-result-label", "Hospital program stability"));
    card3.appendChild(makeEl("p", "impact-result-note", safeText(data.hospitalFundingNote)));
    grid.appendChild(card3);

    container.appendChild(grid);

    var narrative = document.createElement("p");
    narrative.className = "impact-narrative";
    narrative.textContent = safeText(data.narrative);
    container.appendChild(narrative);
  }

  /**
   * Wire one simulator root: scoped buttons, no global getElementById collision.
   */
  function initSimulatorRoot(root) {
    if (!root) return;

    var resultsEl = renderSimulator(root);
    if (!resultsEl) return;

    var scenarioIds = IMPACT.getScenarioIds();

    applyScenarioVisualState(root, IMPACT.SCENARIO_CURRENT);
    renderResults(resultsEl, IMPACT.SCENARIO_CURRENT);

    scenarioIds.forEach(function (scenarioId, index) {
      var btn = root.querySelector('[data-impact-scenario-id="' + scenarioId + '"]');
      if (!btn) return;

      btn.addEventListener("click", function () {
        root.querySelectorAll("[data-impact-scenario-id]").forEach(function (b) {
          var bid = b.getAttribute("data-impact-scenario-id");
          var i = scenarioIds.indexOf(bid);
          b.classList.toggle("active", i === index);
          b.setAttribute("aria-pressed", i === index ? "true" : "false");
        });
        applyScenarioVisualState(root, scenarioId);
        renderResults(resultsEl, scenarioId);
      });
    });
  }

  function init() {
    SIMULATOR_ROOT_IDS.forEach(function (id) {
      var root = document.getElementById(id);
      if (root) {
        initSimulatorRoot(root);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);
