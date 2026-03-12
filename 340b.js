/**
 * HAP 340B Advocacy Dashboard — Main Script
 *
 * WHAT THIS FILE DOES
 * - Renders the interactive US map and state lists from state-data.js
 * - Handles filters (All / Protection / No protection), state selection, share, print, PDF image
 * - Keeps the live dashboard and print/PDF output in sync
 *
 * WHERE TO EDIT
 * - Data (dates, states, copy): state-data.js
 * - Structure and labels: 340b.html
 * - Layout and print styles: 340b.css
 * - Map logic, buttons, print/PDF/share: this file (340b.js)
 *
 * SECURITY (Wave 4): Use textContent for all dynamic content—never innerHTML with data.
 * If you add user input or external data, sanitize before display (see docs/SECURITY.md).
 *
 * CODE MAP (top to bottom)
 * - Config & app state
 * - DOM cache & small helpers
 * - Print prep (snapshot, count-up, reveal, openPrintView)
 * - Map (draw, resize, click, tooltips, state lists) — modular: drawMap() and map lifecycle
 * - Chart: fillAdoptionsChart() uses analytics/policy-insights.js; modular reuse in analytics/
 * - Hash sync & filters
 * - Utility buttons (print, download PDF image, share, export SVG)
 * - Init (DOMContentLoaded)
 *
 * LEARNING: Count-up = numbers that animate from 0 to their final value when they scroll into view; see finalizeCountUpValues() and elements with [data-count-up]. preparePrintSnapshot = runs before the print dialog; it finalizes numbers, reveals sections, sets PA default, builds intro snapshot, and draws the map so the PDF is complete; see openPrintView() which calls it.
 *
 * WAVE 1 (Data Credibility): Metadata, versioning, timestamps in data/dataset-metadata.js and applyAboutDataPanel(); dataset download CSV/JSON in buildDatasetCsv(), buildDatasetJson(), initDatasetDownload().
 * WAVE 2 (Policy Analytics): POLICY_INSIGHTS in analytics/policy-insights.js; applyPolicyInsights(); fillAdoptionsChart(); data/historical-trends.js for YoY trends.
 * WAVE 3 (Interactivity): State filters, map hover/click, tooltips, ranked table with initRankedTableSort(), chart bar tooltips.
 * WAVE 4 (Engineering): config.json and config/settings.js; safeText() and textContent-only rendering; runTaskSafely() for isolated task execution; print/print.html compatible.
 */

(function () {
  "use strict";

  var config = typeof CONFIG !== "undefined" ? CONFIG : {
    dashboardTitle: "340B Drug Pricing Program",
    dashboardSubtitle: "HAP Advocacy Dashboard",
    pageDescription: "340B advocacy dashboard.",
    shareTitle: "340B Drug Pricing Program | HAP Advocacy Dashboard",
    shareDescription: "340B contract pharmacy protection dashboard.",
    dataFreshness: "March 2025",
    lastUpdated: "March 2025",
    printDefaultState: "PA",
    printDefaultStateReason: "HAP focal state for print.",
    copy: {
      executiveStrip: {}
    },
    mapAspectRatio: 0.55,
    mapMaxWidth: 960,
    countUpDuration: 1200,
    dominoDelayPerState: 55,
    scrollRevealThreshold: 0.1,
    shareUrlBase: ""
  };

  var appState = {
    selectedStateAbbr: null,
    currentFilter: "all",
    mapPaths: null,
    lastMapWidth: 0,
    resizeTimer: null,
    mapVisibilityObserver: null,
    countUpObserver: null,
    touchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    hoverCapable: window.matchMedia && window.matchMedia("(hover: hover)").matches,
    printPreparationPending: false,
    printAppliedDefaultSelection: false,
    dom: {}
  };

  /* ---------- DOM cache ---------- */
  // Stores references to all elements the script needs (buttons, map container, status text) so we don't search the DOM repeatedly.
  function cacheDom() {
    appState.dom = {
      utilityStatus: document.getElementById("utility-status"),
      filterStatus: document.getElementById("state-filter-status"),
      selectionStatus: document.getElementById("state-selection-status"),
      selectionSummaryTitle: document.getElementById("selection-summary-title"),
      selectionSummaryText: document.getElementById("selection-summary-text"),
      selectionClear: document.getElementById("selection-clear"),
      mapWrap: document.getElementById("us-map-wrap"),
      mapContainer: document.getElementById("us-map"),
      mapSkeleton: document.getElementById("map-loading-skeleton"),
      mapTooltip: document.getElementById("map-tooltip"),
      chipTooltip: document.getElementById("state-list-tooltip"),
      stateDetailPanel: document.getElementById("state-detail-panel"),
      stateListWith: document.getElementById("states-with-list"),
      stateListWithout: document.getElementById("states-without-list"),
      printStateListWith: document.getElementById("print-states-with-list"),
      printStateListWithout: document.getElementById("print-states-without-list"),
      protectionCount: document.getElementById("protection-count"),
      keyFindingProtectionCount: document.getElementById("key-finding-protection-count"),
      noProtectionCount: document.getElementById("no-protection-count"),
      printProtectionCount: document.getElementById("print-protection-count"),
      printNoProtectionCount: document.getElementById("print-no-protection-count"),
      noResults: document.getElementById("state-no-results"),
      protectionBlock: document.getElementById("state-list-block-protection"),
      noProtectionBlock: document.getElementById("state-list-block-no-protection"),
      printButton: document.getElementById("btn-print"),
      shareButton: document.getElementById("btn-share"),
      introSection: document.querySelector(".dashboard-grid > .intro-section"),
      methodologyWrap: document.getElementById("methodology-wrap"),
      methodologyButton: document.getElementById("methodology-toggle"),
      methodologyContent: document.getElementById("methodology-content"),
      dataFreshness: document.getElementById("data-freshness-text"),
      overviewLead: document.getElementById("overview-lead"),
      hapPositionLead: document.getElementById("hap-position-lead"),
      hapAskLabel: document.getElementById("hap-ask-label"),
      hapAskText: document.getElementById("hap-ask-text"),
      mapHeroSub: document.getElementById("map-hero-sub"),
      sourcesSummary: document.getElementById("sources-summary"),
      methodologyStateLawCopy: document.getElementById("methodology-state-law-copy"),
      verificationOrderCopy: document.getElementById("verification-order-copy"),
      printSourceSummary: document.getElementById("print-source-summary"),
      printVerificationOrderCopy: document.getElementById("print-verification-order-copy"),
      executivePriorityLabel: document.getElementById("executive-priority-label"),
      executivePriorityValue: document.getElementById("executive-priority-value"),
      executivePriorityNote: document.getElementById("executive-priority-note"),
      executiveLandscapeLabel: document.getElementById("executive-landscape-label"),
      executiveLandscapeValue: document.getElementById("executive-landscape-value"),
      executiveLandscapeNote: document.getElementById("executive-landscape-note"),
      executiveTrustLabel: document.getElementById("executive-trust-label"),
      executiveTrustValue: document.getElementById("executive-trust-value"),
      executiveTrustNote: document.getElementById("executive-trust-note"),
      methodologyLastUpdated: document.getElementById("methodology-last-updated"),
      // The print version reuses the live dashboard cards, but it still has a small print header
      // and a compact print-only source note that need current dates.
      printLastUpdated: document.getElementById("print-last-updated"),
      printIntroSnapshot: document.getElementById("print-intro-snapshot"),
      printMethodologyLastUpdated: document.getElementById("print-methodology-last-updated")
    };
  }

  /* ---------- Small helpers ---------- */

  /**
   * Returns a string safe for textContent: non-strings become empty string;
   * control characters are stripped. Use for any dynamic text from external or user input.
   * Our own STATE_340B/STATE_NAMES are trusted; this guards future data sources.
   */
  function safeText(value) {
    if (value == null || typeof value !== "string") return "";
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  function clearElement(element) {
    if (element) {
      element.replaceChildren();
    }
  }

  function removeIdsFromClone(root) {
    if (!root) return;

    if (root.id) {
      root.removeAttribute("id");
    }

    root.querySelectorAll("[id]").forEach(function (element) {
      element.removeAttribute("id");
    });
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function setElementText(element, text) {
    if (element && typeof text === "string") {
      element.textContent = text;
    }
  }

  function appendBadge(parent, tone, text) {
    var badge = createElement("span", "badge " + tone, text);
    parent.appendChild(badge);
    return badge;
  }

  function showTemporaryUtilityStatus(message, delayMs) {
    setUtilityStatus(message);

    window.setTimeout(function () {
      setUtilityStatus("");
    }, delayMs || 2500);
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getCssVariable(variableName, fallbackValue) {
    var value = getComputedStyle(document.documentElement).getPropertyValue(variableName);
    return value ? value.trim() : fallbackValue;
  }

  function setUtilityStatus(message) {
    // Updates the small status text near the toolbar (e.g. "PDF saved." or "Copying link...") so the user gets feedback after an action.
    if (appState.dom.utilityStatus) appState.dom.utilityStatus.textContent = message || "";
  }

  function setFilterStatus(message) {
    if (appState.dom.filterStatus) appState.dom.filterStatus.textContent = message || "";
  }

  function announceSelection(message) {
    if (appState.dom.selectionStatus) appState.dom.selectionStatus.textContent = message || "";
  }

  function setCountUpValue(element) {
    var target = parseFloat(element.getAttribute("data-count-up"));
    var decimals = parseInt(element.getAttribute("data-decimals"), 10) || 0;
    var suffix = element.getAttribute("data-suffix") || "";

    if (isNaN(target)) return;

    element.dataset.done = "1";
    element.textContent = (decimals ? target.toFixed(decimals) : Math.round(target)) + suffix;
  }

  function finalizeCountUpValues() {
    // Sets every count-up number to its final value (e.g. 7, 72) so print/PDF does not show 0 or half-animated values.
    // Count-up elements start at 0 on the live page and animate only after they enter view.
    document.querySelectorAll("[data-count-up]").forEach(function (element) {
      setCountUpValue(element);
    });
  }

  function revealAllAnimatedSections() {
    // Makes all scroll-reveal sections visible immediately so print and PDF capture see the full page, not hidden blocks.
    document.querySelectorAll(".scroll-reveal").forEach(function (element) {
      element.classList.add("revealed");
    });

    showMapWrapImmediately();
    hideTooltip(appState.dom.mapTooltip);
    hideTooltip(appState.dom.chipTooltip);
  }

  function buildPrintIntroSnapshot() {
    // Clones the intro cards into the print-only snapshot block so the first print page shows the same content as the live dashboard.
    var snapshotRoot = appState.dom.printIntroSnapshot;
    var introSection = appState.dom.introSection;
    var introClone;

    if (!snapshotRoot) return;

    clearElement(snapshotRoot);

    if (!introSection) return;

    // Clone the real intro cards right before print so the PDF starts with the same
    // content the user sees on screen, but in a simpler block layout that print engines
    // handle more reliably than the live grid.
    introClone = introSection.cloneNode(true);
    removeIdsFromClone(introClone);
    snapshotRoot.appendChild(introClone);
  }

  function buildPrintStateSummary(withProtection, withoutProtection) {
    if (appState.dom.printStateListWith) {
      appState.dom.printStateListWith.textContent = withProtection.join(", ");
    }

    if (appState.dom.printStateListWithout) {
      appState.dom.printStateListWithout.textContent = withoutProtection.join(", ");
    }

    if (appState.dom.printProtectionCount) {
      appState.dom.printProtectionCount.textContent = String(withProtection.length);
    }

    if (appState.dom.printNoProtectionCount) {
      appState.dom.printNoProtectionCount.textContent = String(withoutProtection.length);
    }
  }

  // Runs a function and catches any error so one failing part (e.g. map) does not break the rest of the app.
  function runTaskSafely(taskName, taskFn) {
    try {
      taskFn();
    } catch (error) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Dashboard task failed:", taskName, error);
      }
    }
  }

  function getDefaultPrintStateAbbr() {
    var configured = typeof config.printDefaultState === "string" ? config.printDefaultState.toUpperCase() : "";
    return configured && isKnownState(configured) ? configured : "PA";
  }

  function applyConfigCopy() {
    // Keep the strongest factual and audience-facing copy in config where it reduces drift.
    // This lets maintainers update metadata, intro copy, and trust cues together.
    var copy = config.copy || {};
    var executiveStrip = copy.executiveStrip || {};

    setElementText(appState.dom.overviewLead, copy.overviewLead);
    setElementText(appState.dom.hapPositionLead, copy.hapPositionLead);
    setElementText(appState.dom.hapAskLabel, copy.hapAskLabel);
    setElementText(appState.dom.hapAskText, copy.hapAskText);
    setElementText(appState.dom.mapHeroSub, copy.mapHeroSub);
    setElementText(appState.dom.sourcesSummary, copy.sourceSummary);
    setElementText(appState.dom.methodologyStateLawCopy, copy.methodologyStateLaw);
    setElementText(appState.dom.verificationOrderCopy, copy.verificationOrder);
    setElementText(appState.dom.printSourceSummary, copy.printSourceSummary);
    setElementText(appState.dom.printVerificationOrderCopy, copy.verificationOrder);
    setElementText(appState.dom.executivePriorityLabel, executiveStrip.priorityLabel);
    setElementText(appState.dom.executivePriorityValue, executiveStrip.priorityValue);
    setElementText(appState.dom.executivePriorityNote, executiveStrip.priorityNote);
    setElementText(appState.dom.executiveLandscapeLabel, executiveStrip.landscapeLabel);
    setElementText(appState.dom.executiveLandscapeNote, executiveStrip.landscapeNote);
    setElementText(appState.dom.executiveTrustLabel, executiveStrip.trustLabel);
    setElementText(appState.dom.executiveTrustValue, executiveStrip.trustValue);
    setElementText(appState.dom.executiveTrustNote, executiveStrip.trustNote);
  }

  function updateExecutiveProofStrip(withProtection, withoutProtection) {
    var landscapeValue;

    if (!appState.dom.executiveLandscapeValue) return;

    // This strip gives decision-makers a fast evidence scan without forcing them
    // to interpret the full map before they understand the national landscape.
    landscapeValue = withProtection.length + " states have enacted contract pharmacy protection; " +
      withoutProtection.length + " remain without enacted protection";

    appState.dom.executiveLandscapeValue.textContent = landscapeValue;
  }

  function buildMapContextText(abbr, data) {
    if (!abbr || !data) {
      return (config.copy && config.copy.mapHeroSub) || "";
    }

    if (abbr === getDefaultPrintStateAbbr()) {
      return "Pennsylvania remains the focal HAP context: 72 Pennsylvania hospitals participate in 340B while contract pharmacy protection is still in progress.";
    }

    if (data.cp && data.pbm) {
      return getStateName(abbr) + " offers a strong comparison point because both contract pharmacy and PBM protections are in place.";
    }

    if (data.cp) {
      return getStateName(abbr) + " shows enacted contract pharmacy protection, even though the broader protection model remains less complete than the strongest comparison states.";
    }

    if (data.pbm) {
      return getStateName(abbr) + " shows partial protection through PBM safeguards, but contract pharmacy protection is still not enacted.";
    }

    return getStateName(abbr) + " shows the exposure hospitals face where contract pharmacy protection is not enacted.";
  }

  function updateMapContext(abbr) {
    var data = getStateData(abbr);

    if (!appState.dom.mapHeroSub) return;

    appState.dom.mapHeroSub.textContent = buildMapContextText(abbr, data);
  }

  /* ---------- Data helpers ---------- */

  function getStateAbbr(feature) {
    var id = feature && (feature.id != null ? feature.id : (feature.properties && (feature.properties.FIPS || feature.properties.STATE)));
    var numericId;

    if (!id) return null;
    numericId = parseInt(id, 10);
    return FIPS_TO_ABBR[!isNaN(numericId) ? numericId : id] || FIPS_TO_ABBR[String(id)] || null;
  }

  function getStateName(abbr, feature) {
    return (abbr && STATE_NAMES[abbr]) || (feature && feature.properties && feature.properties.name) || abbr || "State";
  }

  function getStateData(abbr) {
    return abbr && STATE_340B[abbr] ? STATE_340B[abbr] : null;
  }

  function isKnownState(abbr) {
    return !!getStateData(abbr);
  }

  function getSortedStates() {
    return Object.keys(STATE_340B)
      .filter(function (abbr) {
        return abbr !== "DC";
      })
      .sort();
  }

  function buildStateSummaryText(abbr) {
    var data = getStateData(abbr);

    if (!data) {
      return "No state law data is available.";
    }

    if (abbr === getDefaultPrintStateAbbr()) {
      return "Pennsylvania remains the focal HAP context: contract pharmacy protection is still in progress while 340B participation remains significant across the state.";
    }

    if (data.cp && data.pbm) {
      return "This state provides an enacted comparison point with both contract pharmacy and PBM protections in place.";
    }

    if (data.cp) {
      return "This state shows enacted contract pharmacy protection, even though PBM protections remain more limited.";
    }

    if (data.pbm) {
      return "This state shows partial protection: PBM safeguards exist, but contract pharmacy protection is not enacted.";
    }

    return "This state illustrates how exposed hospitals remain where neither contract pharmacy nor PBM protections are enacted.";
  }

  function buildStateDetailSummary(abbr, data) {
    if (!data) {
      return "No state law data is available for this state.";
    }

    if (abbr === getDefaultPrintStateAbbr()) {
      return "72 Pennsylvania hospitals participate in 340B. Contract pharmacy protection is still in progress.";
    }

    if (data.cp && data.pbm) {
      return "This state is one of the stronger comparison points in the dashboard because both contract pharmacy and PBM protections are in place.";
    }

    if (data.cp) {
      return "This state has enacted contract pharmacy protection, but its broader protection model is still more limited than states that also have PBM safeguards.";
    }

    if (data.pbm) {
      return "This state shows that PBM safeguards can exist without enacted contract pharmacy protection, which is useful but still incomplete.";
    }

    return "This state highlights the operating environment hospitals face when contract pharmacy protection is not enacted.";
  }

  function buildStateImpactNote(abbr, data) {
    if (!data) {
      return "Why it matters: use the map, source notes, and selected-state context together before drawing policy conclusions.";
    }

    if (abbr === getDefaultPrintStateAbbr()) {
      return config.printDefaultStateReason || "HAP focal state for print.";
    }

    if (data.cp) {
      return "Why it matters: enacted protection here gives lawmakers and hospital leaders a concrete comparison point when evaluating how contract pharmacy access can be preserved.";
    }

    return "Why it matters: the absence of enacted contract pharmacy protection here helps show the exposure hospitals can face when patient access depends on contract pharmacies.";
  }

  function buildSelectionAnnouncement(abbr) {
    var data = getStateData(abbr);
    var summary = getStateName(abbr) + " selected.";

    if (!data) return summary;

    summary += " " + (data.cp ? "Contract pharmacy protection is enacted." : "No contract pharmacy protection law is enacted.");
    summary += " " + (data.pbm ? "PBM protections are in place." : "No PBM protection law is in place.");
    return summary;
  }

  function validateStateData() {
    var requiredKeys = ["cp", "pbm", "y", "notes"];

    getSortedStates().forEach(function (abbr) {
      var data = getStateData(abbr);
      var missingKeys = [];

      requiredKeys.forEach(function (key) {
        if (!data || !Object.prototype.hasOwnProperty.call(data, key)) {
          missingKeys.push(key);
        }
      });

      if (missingKeys.length && typeof console !== "undefined" && console.warn) {
        console.warn("State data is missing keys for", abbr, missingKeys.join(", "));
      }

      if (!data) return;

      if (typeof data.cp !== "boolean" || typeof data.pbm !== "boolean") {
        console.warn("State data should use boolean values for", abbr);
      }

      if (data.y !== null && typeof data.y !== "number") {
        console.warn("State data should use a year number or null for", abbr);
      }

      if (typeof data.notes !== "string") {
        console.warn("State notes should be a string for", abbr);
      }
    });
  }

  /** Populate the About Data panel from data/dataset-metadata.js when available. */
  function applyAboutDataPanel() {
    var meta = typeof DATASET_METADATA !== "undefined" ? DATASET_METADATA : null;
    if (!meta) return;
    var setText = function (id, text) {
      var el = document.getElementById(id);
      if (el && typeof text === "string") el.textContent = text;
    };
    setText("about-data-name", meta.name || "");
    setText("about-data-updated", meta.lastUpdated || "");
    setText("about-data-version", meta.datasetVersion || "");
    setText("about-data-methodology", meta.methodology || "");
  }

  /** Populate Policy insights section from analytics/policy-insights.js (Wave 2). */
  function applyPolicyInsights() {
    var insights = typeof POLICY_INSIGHTS !== "undefined" ? POLICY_INSIGHTS : null;
    if (!insights) return;
    var bench = insights.getNationalBenchmark();
    var summary = insights.getPolicyAdoptionSummary();
    var recent = insights.getRecentAdopters(2025, 2);
    var setText = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    setText("policy-insights-summary", summary);
    setText("policy-insights-benchmark-value", bench.percent + "%");
    setText("policy-insights-recent-count", String(recent.length));
  }

  /* ---------- Metadata and summary text ---------- */

  function updateMetadata() {
    var fullTitle = config.dashboardTitle + " | " + config.dashboardSubtitle;
    var metaDescription = document.getElementById("meta-description");
    var ogTitle = document.getElementById("meta-og-title");
    var ogDescription = document.getElementById("meta-og-description");
    var twitterTitle = document.getElementById("meta-twitter-title");
    var twitterDescription = document.getElementById("meta-twitter-description");

    document.title = fullTitle;

    if (metaDescription) metaDescription.setAttribute("content", config.pageDescription);
    if (ogTitle) ogTitle.setAttribute("content", config.shareTitle || fullTitle);
    if (ogDescription) ogDescription.setAttribute("content", config.shareDescription || config.pageDescription);
    if (twitterTitle) twitterTitle.setAttribute("content", config.shareTitle || fullTitle);
    if (twitterDescription) twitterDescription.setAttribute("content", config.shareDescription || config.pageDescription);
    if (appState.dom.dataFreshness) {
      appState.dom.dataFreshness.textContent = "Data as of " + config.dataFreshness + " - Last updated " + config.lastUpdated;
    }
    if (appState.dom.methodologyLastUpdated) appState.dom.methodologyLastUpdated.textContent = config.lastUpdated;
    if (appState.dom.printLastUpdated) appState.dom.printLastUpdated.textContent = config.lastUpdated;
    // The print-only source note lives near the map and uses a separate element,
    // so it must be updated alongside the live methodology date.
    if (appState.dom.printMethodologyLastUpdated) appState.dom.printMethodologyLastUpdated.textContent = config.lastUpdated;
  }

  function updateSelectionSummary(abbr) {
    if (!appState.dom.selectionSummaryTitle || !appState.dom.selectionSummaryText) return;

    if (!abbr) {
      appState.dom.selectionSummaryTitle.textContent = "No state selected yet";
      appState.dom.selectionSummaryText.textContent = "Choose a state from the map or list to compare enacted protections and no-protection states.";
      updateMapContext(null);
      if (appState.dom.selectionClear) appState.dom.selectionClear.hidden = true;
      return;
    }

    appState.dom.selectionSummaryTitle.textContent = getStateName(abbr);
    appState.dom.selectionSummaryText.textContent = buildStateSummaryText(abbr);
    updateMapContext(abbr);
    if (appState.dom.selectionClear) appState.dom.selectionClear.hidden = false;
  }

  /* ---------- Share and hash helpers ---------- */

  function updateUrlHash(abbr) {
    var nextHash = abbr ? "#state-" + abbr : "";

    if (location.hash === nextHash) return;

    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + nextHash);
    } else {
      location.hash = nextHash;
    }
  }

  function getHashState() {
    // Invalid or unknown #state-XX hashes are ignored; selection stays empty.
    var rawHash = (location.hash || "").replace(/^#state-/, "").toUpperCase();
    return rawHash && rawHash.length === 2 && isKnownState(rawHash) ? rawHash : null;
  }

  function getCanonicalPageBase() {
    if (config.shareUrlBase) return config.shareUrlBase;

    if (location.protocol === "file:") {
      return location.href.split("#")[0].split("?")[0];
    }

    return location.origin + location.pathname;
  }

  function buildShareUrl() {
    var hash = appState.selectedStateAbbr ? "#state-" + appState.selectedStateAbbr : "";
    return getCanonicalPageBase() + hash;
  }

  function cloneMapForPrint() {
    var fallback = document.getElementById("print-map-fallback");
    if (!fallback) return;
    clearElement(fallback);
    var svg = (appState.dom.mapContainer && appState.dom.mapContainer.querySelector("svg")) ||
              document.querySelector("#us-map svg") ||
              document.querySelector(".us-map-wrap svg");
    if (svg) {
      fallback.appendChild(svg.cloneNode(true));
    }
    var legend = document.querySelector(".us-map-wrap .map-legend");
    if (legend) {
      fallback.appendChild(legend.cloneNode(true));
    }
  }

  var PRINT_VIEW_STORAGE_KEY = "hap340bPrint";
  // Fallback map width in pixels when container has no offsetWidth (e.g. before layout).
  var DEFAULT_MAP_WIDTH_PX = 800;
  // Wait-for-map: used by openPrintView and downloadPdfAsImage so payload/capture includes the SVG.
  var WAIT_FOR_MAP_INITIAL_MS = 1200;
  var WAIT_FOR_MAP_INTERVAL_MS = 250;
  var WAIT_FOR_MAP_MAX_ATTEMPTS = 30;
  var PDF_CAPTURE_TIMEOUT_MS = 18000;

  function getMapSvgString() {
    var svg = (appState.dom.mapContainer && appState.dom.mapContainer.querySelector("svg")) ||
              document.querySelector("#us-map svg") ||
              document.querySelector(".us-map-wrap svg");
    if (!svg) return "";
    try {
      return new XMLSerializer().serializeToString(svg);
    } catch (e) {
      return "";
    }
  }

  // Gathers selection text, protection counts, state lists, KPI values, and data freshness from the live page for the print payload.
  function gatherPrintPayloadSummaryAndKpis() {
    var selectionTitle = appState.dom.selectionSummaryTitle ? appState.dom.selectionSummaryTitle.textContent : "No state selected yet";
    var selectionText = appState.dom.selectionSummaryText ? appState.dom.selectionSummaryText.textContent : "";
    var protectionCount = 0;
    var noProtectionCount = 0;
    var statesWithList = "";
    var statesWithoutList = "";

    /* Gather protection counts and comma-separated state lists from global state data for the print payload. */
    if (typeof STATES_WITH_PROTECTION !== "undefined" && Array.isArray(STATES_WITH_PROTECTION)) {
      protectionCount = STATES_WITH_PROTECTION.length;
      statesWithList = STATES_WITH_PROTECTION.join(", ");
    }
    if (typeof STATE_340B === "object" && STATE_340B !== null) {
      var without = Object.keys(STATE_340B).filter(function (abbr) {
        return STATE_340B[abbr] && !STATE_340B[abbr].cp;
      });
      noProtectionCount = without.length;
      statesWithoutList = without.join(", ");
    }

    var kpiDrug = "7%";
    var kpiBenefit = "$7.95B";
    var kpiOversight = "200+";
    var kpiPA = "72";
    var drugEl = document.querySelector(".kpi-strip .kpi-card:nth-child(1) .kpi-value");
    var benefitEl = document.querySelector(".kpi-strip .kpi-card:nth-child(2) .kpi-value");
    var oversightEl = document.querySelector(".kpi-strip .kpi-card:nth-child(3) .kpi-value");
    var paEl = document.querySelector(".kpi-strip .kpi-card:nth-child(4) .kpi-value");
    if (drugEl) kpiDrug = drugEl.textContent.trim();
    if (benefitEl) kpiBenefit = benefitEl.textContent.trim();
    if (oversightEl) kpiOversight = oversightEl.textContent.trim();
    if (paEl) kpiPA = paEl.textContent.trim();

    var dataFreshness = "Data as of " + (config.dataFreshness || "March 2025") + " - Last updated " + (config.lastUpdated || "March 2025");
    if (appState.dom.dataFreshness) {
      dataFreshness = appState.dom.dataFreshness.textContent;
    }

    return {
      selectionTitle: selectionTitle,
      selectionText: selectionText,
      protectionCount: protectionCount,
      noProtectionCount: noProtectionCount,
      statesWithList: statesWithList,
      statesWithoutList: statesWithoutList,
      kpiDrug: kpiDrug,
      kpiBenefit: kpiBenefit,
      kpiOversight: kpiOversight,
      kpiPA: kpiPA,
      dataFreshness: dataFreshness
    };
  }

  // Assembles the full print view payload (summary, KPIs, map SVG) for print.html to read from localStorage (new tab cannot read sessionStorage).
  function getPrintViewPayload() {
    var summary = gatherPrintPayloadSummaryAndKpis();
    var mapSvg = getMapSvgString();
    return {
      mapSvg: mapSvg,
      mapSvgFallback: !mapSvg || mapSvg.length < 100,
      selectionTitle: summary.selectionTitle,
      selectionText: summary.selectionText,
      protectionCount: summary.protectionCount,
      noProtectionCount: summary.noProtectionCount,
      statesWithList: summary.statesWithList,
      statesWithoutList: summary.statesWithoutList,
      kpiDrug: summary.kpiDrug,
      kpiBenefit: summary.kpiBenefit,
      kpiOversight: summary.kpiOversight,
      kpiPA: summary.kpiPA,
      dataFreshness: summary.dataFreshness,
      methodologyDate: config.lastUpdated || "March 2025"
    };
  }

  // Opens the print view tab and injects the map and snapshot data from localStorage so the user can save as PDF from the browser.
  function openPrintView() {
    setUtilityStatus("Preparing print view...");
    // Finalize so the captured page shows 7%, 72, etc., not 0 or half-animated values.
    finalizeCountUpValues();
    preparePrintSelectionState();
    runTaskSafely("show map for print", showMapWrapImmediately);
    revealAllAnimatedSections();

    runTaskSafely("draw map for print view", drawMap);

    function doOpen() {
      var payload = getPrintViewPayload();
      try {
        localStorage.setItem(PRINT_VIEW_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        setUtilityStatus("Print data too large. Try closing other tabs.");
        return;
      }
      var printUrl = "print.html?auto=1";
      var win = window.open(printUrl, "_blank", "noopener");
      if (win) {
        setUtilityStatus("Print view opened. Use the browser print dialog to save as PDF.");
      } else {
        setUtilityStatus("Popup blocked. Allow popups for this site and try again.");
      }
      setTimeout(function () {
        setUtilityStatus("");
      }, 3000);
    }

    function waitForMapThenOpen(attemptsLeft) {
      // We poll because the map is drawn asynchronously; capture must wait until the SVG exists so the PDF includes it.
      var svg = document.querySelector("#us-map svg") || document.querySelector(".us-map-wrap svg");
      if (svg && svg.querySelector("path[data-state]")) {
        doOpen();
        return;
      }
      if (attemptsLeft <= 0) {
        doOpen();
        return;
      }
      window.setTimeout(function () {
        waitForMapThenOpen(attemptsLeft - 1);
      }, WAIT_FOR_MAP_INTERVAL_MS);
    }

    // Yield to layout/paint, then wait for map draw to finish, so the print tab receives a payload that includes the map SVG.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.setTimeout(function () {
          waitForMapThenOpen(WAIT_FOR_MAP_MAX_ATTEMPTS);
        }, WAIT_FOR_MAP_INITIAL_MS);
      });
    });
  }

  // Runs when the user clicks Print/PDF; prepares the page (final numbers, revealed sections, PA default, intro snapshot, map) then calls onReady (e.g. to open the print dialog).
  function preparePrintSnapshot(onReady) {
    var callback = typeof onReady === "function" ? onReady : function () {};
    var methodologyWrap = appState.dom.methodologyWrap;

    document.body.classList.add("print-ready");
    if (methodologyWrap) methodologyWrap.setAttribute("open", "");
    // Order: open methodology first so it is visible when print runs.
    // Finalize so the captured page shows 7%, 72, etc., not 0 or half-animated values.
    finalizeCountUpValues();
    revealAllAnimatedSections();
    // Ensure scroll-reveal sections are visible in print.
    preparePrintSelectionState();
    // Set PA default for print if no state selected; update selection summary text.
    buildPrintIntroSnapshot();
    // Populate print-only intro snapshot if used.
    runTaskSafely("show map for print", showMapWrapImmediately);
    runTaskSafely("draw map for print", drawMap);
    // Ensure map is drawn before we print (live map is shown in print).

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        cloneMapForPrint();
        setTimeout(function () {
          if (methodologyWrap && !methodologyWrap.hasAttribute("open")) methodologyWrap.setAttribute("open", "");
          cloneMapForPrint();
          document.body.classList.add("print-ready");
          document.body.offsetHeight;
          callback();
        }, 1000);
      });
    });
  }

  function scrollToMapSection() {
    var mapSection = document.getElementById("state-laws");

    if (!mapSection) return;

    mapSection.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });
  }

  /* ---------- Detail panel and selection ---------- */

  function renderEmptyStateDetail() {
    var panel = appState.dom.stateDetailPanel;

    if (!panel) return;

    panel.classList.add("empty");
    clearElement(panel);
    panel.appendChild(createElement("p", "", "No state selected. Choose a state to compare legal-status details and policy context."));
  }

  function renderStateDetail(abbr) {
    var panel = appState.dom.stateDetailPanel;
    var data = getStateData(abbr);
    var badgeRow;
    var detailGrid;

    if (!panel) return;

    panel.classList.remove("empty");
    clearElement(panel);
    panel.appendChild(createElement("h4", "", getStateName(abbr)));

    if (!data) {
      panel.appendChild(createElement("p", "", "No state law data is available."));
      return;
    }

    panel.appendChild(createElement("p", "state-detail-summary", buildStateDetailSummary(abbr, data)));

    badgeRow = createElement("p", "state-detail-badges");
    appendBadge(badgeRow, data.cp ? "yes" : "no", data.cp ? "Contract pharmacy protected" : "No contract pharmacy law");
    appendBadge(badgeRow, data.pbm ? "yes" : "no", data.pbm ? "PBM protections in place" : "No PBM protection law");
    panel.appendChild(badgeRow);

    detailGrid = createElement("dl", "state-detail-grid");
    detailGrid.appendChild(createElement("dt", "", "Contract pharmacy status"));
    detailGrid.appendChild(createElement("dd", "", data.cp ? "Enacted protection in place" : "No enacted protection law"));
    detailGrid.appendChild(createElement("dt", "", "PBM protection status"));
    detailGrid.appendChild(createElement("dd", "", data.pbm ? "PBM protections in place" : "No PBM protection law"));
    detailGrid.appendChild(createElement("dt", "", "Law year"));
    detailGrid.appendChild(createElement("dd", "", data.y ? String(data.y) : "Not enacted"));
    detailGrid.appendChild(createElement("dt", "", "Notes"));
    detailGrid.appendChild(createElement("dd", "", data.notes || "No additional notes."));
    panel.appendChild(detailGrid);
    panel.appendChild(createElement("p", "state-detail-impact", buildStateImpactNote(abbr, data)));
  }

  function updateNavCurrent(activeId) {
    var navLinks = document.querySelectorAll(".dashboard-nav a[href^='#']");
    var policySections = ["oversight", "pa-impact", "community-benefit", "access", "pa-safeguards"];

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      var isActive = href === "#" + activeId || (href === "#policy" && policySections.indexOf(activeId) >= 0);
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function highlightMapState(abbr) {
    if (!appState.mapPaths) return;

    appState.mapPaths
      .classed("selected", false)
      .filter(function (feature) {
        return getStateAbbr(feature) === abbr;
      })
      .classed("selected", true);
  }

  function highlightStateChip(abbr) {
    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var isSelected = chip.getAttribute("data-state") === abbr;
      chip.classList.toggle("selected", isSelected);
      chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function clearSelection(announceMessage, options) {
    var settings = options || {};

    appState.selectedStateAbbr = null;
    if (settings.updateHash !== false) {
      updateUrlHash(null);
    }
    renderEmptyStateDetail();
    updateSelectionSummary(null);
    if (settings.announce !== false) {
      announceSelection(typeof announceMessage === "string" ? announceMessage : "State selection cleared.");
    }

    if (appState.mapPaths) {
      appState.mapPaths.classed("selected", false);
    }

    highlightStateChip(null);
  }

  function selectState(abbr, options) {
    var settings = options || {};

    if (!abbr || !isKnownState(abbr)) return;

    appState.selectedStateAbbr = abbr;
    if (settings.updateHash !== false) {
      updateUrlHash(abbr);
    }
    renderStateDetail(abbr);
    updateSelectionSummary(abbr);
    highlightMapState(abbr);
    highlightStateChip(abbr);
    if (settings.announce !== false) {
      announceSelection(buildSelectionAnnouncement(abbr));
    }

    if (settings.scrollToMap) {
      scrollToMapSection();
    }

    if (settings.focusPanel && appState.dom.stateDetailPanel) {
      appState.dom.stateDetailPanel.focus({
        preventScroll: !!settings.scrollToMap
      });
    }
  }

  /* ---------- Tooltip helpers ---------- */

  function clampTooltip(tooltip, left, top) {
    var maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
    var maxTop = window.innerHeight - tooltip.offsetHeight - 12;

    tooltip.style.left = Math.max(12, Math.min(left, maxLeft)) + "px";
    tooltip.style.top = Math.max(12, Math.min(top, maxTop)) + "px";
  }

  function showTooltip(tooltip, left, top) {
    tooltip.classList.add("visible");
    tooltip.setAttribute("aria-hidden", "false");
    clampTooltip(tooltip, left, top);
  }

  function hideTooltip(tooltip) {
    if (!tooltip) return;
    tooltip.classList.remove("visible");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function buildMapTooltip(tooltip, abbr) {
    clearElement(tooltip);
    tooltip.appendChild(document.createTextNode(getStateName(abbr)));
  }

  function buildStateChipTooltip(tooltip, abbr) {
    var data = getStateData(abbr);

    clearElement(tooltip);
    tooltip.appendChild(createElement("strong", "", getStateName(abbr)));

    if (!data) return;

    tooltip.appendChild(document.createTextNode(" "));
    appendBadge(tooltip, data.cp ? "yes" : "no", "CP: " + (data.cp ? "Yes" : "No"));
    appendBadge(tooltip, data.pbm ? "yes" : "no", "PBM: " + (data.pbm ? "Yes" : "No"));
    if (data.y) tooltip.appendChild(createElement("div", "", "Year: " + data.y));
    if (data.notes) tooltip.appendChild(createElement("div", "", data.notes));
  }

  /* ---------- Map lifecycle ---------- */

  function setMapBusy(isBusy) {
    if (appState.dom.mapWrap) appState.dom.mapWrap.setAttribute("aria-busy", isBusy ? "true" : "false");
    if (appState.dom.mapContainer) appState.dom.mapContainer.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  function showMapSkeleton() {
    if (appState.dom.mapSkeleton) appState.dom.mapSkeleton.classList.remove("hidden");
    setMapBusy(true);
  }

  function hideMapSkeleton() {
    if (appState.dom.mapSkeleton) appState.dom.mapSkeleton.classList.add("hidden");
    setMapBusy(false);
  }

  // Makes the map container visible without waiting for scroll; used before print and PDF capture so the map is in the output.
  function showMapWrapImmediately() {
    if (!appState.dom.mapWrap) return;
    appState.dom.mapWrap.classList.add("visible", "map-visible");
  }

  function setupMapVisibilityObserver() {
    if (!appState.dom.mapWrap) return;

    if (appState.mapVisibilityObserver) {
      appState.mapVisibilityObserver.disconnect();
      appState.mapVisibilityObserver = null;
    }

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      showMapWrapImmediately();
      return;
    }

    appState.mapVisibilityObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        showMapWrapImmediately();
      }
    }, { threshold: 0.1 });

    appState.mapVisibilityObserver.observe(appState.dom.mapWrap);
  }

  function buildMapFallback(container) {
    var fallback = createElement("div", "map-fallback");
    var title = createElement("h3", "map-fallback-title", "State protection summary");
    var list = createElement("ul", "map-fallback-list");

    getSortedStates().forEach(function (abbr) {
      var data = getStateData(abbr);
      var item = createElement("li", "map-fallback-item", abbr + " - " + (data && data.cp ? "Protection in place" : "No protection law"));
      list.appendChild(item);
    });

    fallback.appendChild(title);
    fallback.appendChild(list);
    container.appendChild(fallback);
  }

  function showMapError(message) {
    var container = appState.dom.mapContainer;
    var wrapper;
    var retryButton;

    if (!container) return;

    clearElement(container);
    hideMapSkeleton();
    showMapWrapImmediately();

    wrapper = createElement("div", "map-error-wrap");
    wrapper.appendChild(createElement("p", "map-error-msg", message));

    retryButton = createElement("button", "map-retry-btn", "Retry");
    retryButton.type = "button";
    retryButton.addEventListener("click", drawMap);

    wrapper.appendChild(retryButton);
    container.appendChild(wrapper);
    buildMapFallback(container);
  }

  function bindMapEvents() {
    if (!appState.mapPaths || !appState.dom.mapTooltip) return;

    appState.mapPaths
      .on("mouseenter", function (event, feature) {
        if (!appState.hoverCapable) return;
        buildMapTooltip(appState.dom.mapTooltip, getStateAbbr(feature));
        showTooltip(appState.dom.mapTooltip, event.clientX, event.clientY + 14);
      })
      .on("mousemove", function (event) {
        if (!appState.hoverCapable) return;
        clampTooltip(appState.dom.mapTooltip, event.clientX, event.clientY + 14);
      })
      .on("mouseleave", function () {
        hideTooltip(appState.dom.mapTooltip);
      })
      .on("click", function (event, feature) {
        event.stopPropagation();
        hideTooltip(appState.dom.mapTooltip);
        selectState(getStateAbbr(feature), { focusPanel: true });
      });
  }

  function setupMapKeyboardNav() {
    var paths = Array.prototype.slice.call(document.querySelectorAll("#us-map path[data-state]"));

    paths.forEach(function (path, index) {
      var abbr = path.getAttribute("data-state");

      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", "Select " + getStateName(abbr));

      path.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectState(abbr, { focusPanel: true });
          return;
        }

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          if (paths[index + 1]) paths[index + 1].focus();
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          if (paths[index - 1]) paths[index - 1].focus();
        }
      });
    });
  }

  function drawMap() {
    var container = appState.dom.mapContainer;
    var atlas = window.US_ATLAS_STATES_10M;
    var width;
    var height;
    var svg;
    var states;
    var projection;
    var pathGenerator;
    var group;
    var orderedStates;
    var animationOrder = {};
    var mapProtectionColor = getCssVariable("--map-protection", "#0b67c2");
    var mapNoProtectionColor = getCssVariable("--map-no-protection", "#d7e0ea");

    if (!container) return;

    width = Math.min(container.offsetWidth || DEFAULT_MAP_WIDTH_PX, config.mapMaxWidth);
    height = Math.round(width * config.mapAspectRatio);
    appState.lastMapWidth = width;

    // Rebuild the SVG from scratch on each draw so resize behavior stays predictable.
    clearElement(container);
    showMapSkeleton();

    if (typeof d3 === "undefined" || typeof topojson === "undefined" || !atlas || !atlas.objects || !atlas.objects.states) {
      showMapError("The interactive map could not load. You can still use the state summary below.");
      return;
    }

    svg = d3.select(container)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto");

    states = topojson.feature(atlas, atlas.objects.states);
    projection = d3.geoAlbersUsa().fitSize([width, height], states);
    pathGenerator = d3.geoPath(projection);
    group = svg.append("g");
    orderedStates = states.features.map(function (feature, index) {
      return { feature: feature, index: index };
    });

    orderedStates.sort(function (a, b) {
      var centerA = pathGenerator.centroid(a.feature);
      var centerB = pathGenerator.centroid(b.feature);
      return centerA[0] - centerB[0];
    });

    orderedStates.forEach(function (item, order) {
      animationOrder[item.index] = order;
    });

    appState.mapPaths = group.selectAll("path")
      .data(states.features)
      .join("path")
      .attr("class", function (feature) {
        var abbr = getStateAbbr(feature);
        var baseClass = STATES_WITH_PROTECTION.indexOf(abbr) >= 0 ? "state protection" : "state no-protection";
        return prefersReducedMotion() ? baseClass : baseClass + " state-domino";
      })
      .attr("d", pathGenerator)
      .attr("data-state", function (feature) {
        return getStateAbbr(feature) || "";
      })
      .attr("fill", function (feature) {
        return STATES_WITH_PROTECTION.indexOf(getStateAbbr(feature)) >= 0 ? mapProtectionColor : mapNoProtectionColor;
      })
      .attr("stroke", "rgba(255,255,255,0.9)")
      .attr("stroke-width", 1)
      .each(function (_, index) {
        this.style.animationDelay = (animationOrder[index] || 0) * config.dominoDelayPerState + "ms";
      });

    hideMapSkeleton();
    setupMapVisibilityObserver();
    bindMapEvents();
    setupMapKeyboardNav();

    if (appState.selectedStateAbbr) {
      highlightMapState(appState.selectedStateAbbr);
    }
  }

  /* ---------- State list ---------- */

  function createStateChip(abbr) {
    var button = createElement("button", "state-chip", abbr);

    button.type = "button";
    button.setAttribute("data-state", abbr);
    button.setAttribute("aria-controls", "state-detail-panel");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "View details for " + getStateName(abbr));
    button.addEventListener("click", function () {
      selectState(abbr, { focusPanel: false });
    });

    return button;
  }

  function renderStateChips() {
    var withProtection = [];
    var withoutProtection = [];

    if (!appState.dom.stateListWith || !appState.dom.stateListWithout) return;

    clearElement(appState.dom.stateListWith);
    clearElement(appState.dom.stateListWithout);

    getSortedStates().forEach(function (abbr) {
      if (getStateData(abbr) && getStateData(abbr).cp) {
        withProtection.push(abbr);
      } else {
        withoutProtection.push(abbr);
      }
    });

    withProtection.forEach(function (abbr) {
      appState.dom.stateListWith.appendChild(createStateChip(abbr));
    });

    withoutProtection.forEach(function (abbr) {
      appState.dom.stateListWithout.appendChild(createStateChip(abbr));
    });

    if (appState.dom.protectionCount) appState.dom.protectionCount.textContent = String(withProtection.length);
    if (appState.dom.keyFindingProtectionCount) appState.dom.keyFindingProtectionCount.textContent = String(withProtection.length);
    if (appState.dom.noProtectionCount) appState.dom.noProtectionCount.textContent = String(withoutProtection.length);
    buildPrintStateSummary(withProtection, withoutProtection);
    updateExecutiveProofStrip(withProtection, withoutProtection);

    initStateChipTooltips();
    highlightStateChip(appState.selectedStateAbbr);
    applyStateFilter();
  }

  function preparePrintSelectionState() {
    if (appState.printAppliedDefaultSelection) {
      return;
    }

    if (appState.selectedStateAbbr) {
      appState.printAppliedDefaultSelection = false;
      return;
    }

    // Print should not show an empty state panel when no one has selected a state.
    // Use Pennsylvania as the temporary print-only context because this dashboard is
    // aimed at HAP and Pennsylvania hospital leaders. Do not change the live URL hash.
    selectState(getDefaultPrintStateAbbr(), {
      updateHash: false,
      announce: false,
      focusPanel: false,
      scrollToMap: false
    });
    appState.printAppliedDefaultSelection = true;
  }

  function initStateChipTooltips() {
    if (!appState.dom.chipTooltip) return;

    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var abbr = chip.getAttribute("data-state");
      var data = getStateData(abbr);

      chip.title = getStateName(abbr) + (data && data.notes ? ": " + data.notes : "");
      chip.addEventListener("focus", function () {
        hideTooltip(appState.dom.chipTooltip);
      });
      chip.addEventListener("blur", function () {
        hideTooltip(appState.dom.chipTooltip);
      });

      if (!appState.hoverCapable) return;

      chip.addEventListener("mouseenter", function (event) {
        buildStateChipTooltip(appState.dom.chipTooltip, abbr);
        showTooltip(appState.dom.chipTooltip, event.clientX, event.clientY - 12);
      });

      chip.addEventListener("mousemove", function (event) {
        clampTooltip(appState.dom.chipTooltip, event.clientX, event.clientY - 12);
      });

      chip.addEventListener("mouseleave", function () {
        hideTooltip(appState.dom.chipTooltip);
      });
    });
  }

  function updateListBlockVisibility() {
    var visibleProtection = 0;
    var visibleNoProtection = 0;

    document.querySelectorAll("#states-with-list .state-chip").forEach(function (chip) {
      if (!chip.hidden) visibleProtection += 1;
    });

    document.querySelectorAll("#states-without-list .state-chip").forEach(function (chip) {
      if (!chip.hidden) visibleNoProtection += 1;
    });

    if (appState.dom.protectionBlock) appState.dom.protectionBlock.hidden = visibleProtection === 0;
    if (appState.dom.noProtectionBlock) appState.dom.noProtectionBlock.hidden = visibleNoProtection === 0;
    if (appState.dom.noResults) appState.dom.noResults.hidden = visibleProtection + visibleNoProtection > 0;
  }

  function applyStateFilter() {
    var visibleCount = 0;

    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var abbr = chip.getAttribute("data-state");
      var data = getStateData(abbr);
      var hasProtection = data && data.cp;
      var shouldShow = appState.currentFilter === "all" ||
        (appState.currentFilter === "protection" && hasProtection) ||
        (appState.currentFilter === "no-protection" && !hasProtection);

      chip.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    updateListBlockVisibility();

    if (visibleCount === 0) setFilterStatus("No states match this filter. Choose 'All' to see every state.");
    else if (appState.currentFilter === "all") setFilterStatus("Showing all states.");
    else setFilterStatus("Showing " + visibleCount + " states in this view.");
  }

  function initStateFilter() {
    var filterButtons = document.querySelectorAll(".state-filter-btn");
    var filterSelect = document.getElementById("state-filter-select");

    function syncFilterToUI(filterValue) {
      appState.currentFilter = filterValue || "all";
      filterButtons.forEach(function (item) {
        var isActive = (item.getAttribute("data-filter") || "all") === appState.currentFilter;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      if (filterSelect) filterSelect.value = appState.currentFilter;
      applyStateFilter();
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        syncFilterToUI(button.getAttribute("data-filter") || "all");
      });
    });

    if (filterSelect) {
      filterSelect.addEventListener("change", function () {
        syncFilterToUI(filterSelect.value || "all");
      });
    }
  }

  /** Fill ranked state table (Wave 3): states with contract pharmacy protection, sorted by year enacted desc. Stores rows for sortable headers (next-level). */
  function fillRankedStateTable() {
    var tbody = document.getElementById("ranked-state-tbody");
    var table = document.getElementById("ranked-state-table");
    if (!tbody || !table || typeof STATE_340B !== "object" || typeof STATE_NAMES !== "object") return;
    var rows = [];
    Object.keys(STATE_340B).forEach(function (abbr) {
      var row = STATE_340B[abbr];
      if (!row || !row.cp) return;
      rows.push({
        abbr: abbr,
        name: STATE_NAMES[abbr] || abbr,
        year: row.y != null ? String(row.y) : "—"
      });
    });
    rows.sort(function (a, b) {
      var yA = a.year === "—" ? 0 : parseInt(a.year, 10);
      var yB = b.year === "—" ? 0 : parseInt(b.year, 10);
      if (yB !== yA) return yB - yA;
      return (a.name || "").localeCompare(b.name || "");
    });
    table._rankedRows = rows;
    renderRankedTableBody(tbody, rows);
  }

  /** Render tbody of ranked table from rows array (used by fillRankedStateTable and sort). */
  function renderRankedTableBody(tbody, rows) {
    if (!tbody || !Array.isArray(rows)) return;
    tbody.textContent = "";
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      var tdState = document.createElement("td");
      tdState.textContent = safeText(r.name);
      var tdYear = document.createElement("td");
      tdYear.textContent = safeText(r.year);
      var tdCP = document.createElement("td");
      tdCP.textContent = "Yes";
      tr.appendChild(tdState);
      tr.appendChild(tdYear);
      tr.appendChild(tdCP);
      tbody.appendChild(tr);
    });
  }

  /** Sortable ranked table (next-level): click State or Year enacted to sort. */
  function initRankedTableSort() {
    var table = document.getElementById("ranked-state-table");
    var tbody = document.getElementById("ranked-state-tbody");
    if (!table || !tbody || !table._rankedRows) return;
    var headers = table.querySelectorAll(".ranked-th[data-sort]");
    var currentSort = { key: "year", dir: "desc" };
    function applySort(key) {
      var dir = currentSort.key === key && currentSort.dir === "asc" ? "desc" : "asc";
      currentSort = { key: key, dir: dir };
      var rows = table._rankedRows.slice();
      rows.sort(function (a, b) {
        if (key === "year") {
          var yA = a.year === "—" ? 0 : parseInt(a.year, 10);
          var yB = b.year === "—" ? 0 : parseInt(b.year, 10);
          var cmp = yB - yA;
          return dir === "asc" ? -cmp : cmp;
        }
        var cmp = (a.name || "").localeCompare(b.name || "");
        return dir === "asc" ? cmp : -cmp;
      });
      renderRankedTableBody(tbody, rows);
      headers.forEach(function (th) {
        var k = th.getAttribute("data-sort");
        th.setAttribute("aria-sort", k === key ? (dir === "asc" ? "ascending" : "descending") : "none");
      });
    }
    headers.forEach(function (th) {
      th.addEventListener("click", function () {
        var k = th.getAttribute("data-sort");
        if (k) applySort(k);
      });
    });
  }

  /** Fill adoptions-by-year bar chart from POLICY_INSIGHTS (next-level CEO dashboard). */
  function fillAdoptionsChart() {
    var container = document.getElementById("adoptions-chart");
    if (!container || typeof POLICY_INSIGHTS !== "object" || !POLICY_INSIGHTS.getAdoptionTimelineArray) return;
    var arr = POLICY_INSIGHTS.getAdoptionTimelineArray();
    if (!arr || arr.length === 0) return;
    var maxCount = Math.max.apply(null, arr.map(function (d) { return d.count; })) || 1;
    var heightPx = 80;
    container.textContent = "";
    container.setAttribute("aria-label", "Bar chart: " + arr.map(function (d) { return d.year + " " + d.count + " states"; }).join(", "));
    arr.forEach(function (d) {
      var bar = document.createElement("div");
      bar.className = "adoptions-chart-bar";
      var pct = maxCount > 0 ? (d.count / maxCount) * heightPx : 0;
      bar.style.height = Math.max(4, pct) + "px";
      bar.setAttribute("title", d.year + ": " + d.count + " state(s) enacted");
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", d.year + " " + d.count + " states");
      container.appendChild(bar);
    });
  }

  /* ---------- Utility actions ---------- */

  function initPrint() {
    if (!appState.dom.printButton) return;

    appState.dom.printButton.addEventListener("click", function () {
      // Use dedicated print view (print.html) for reliable PDF output. The live @media print
      // path has been replaced by this flow: open print.html in a new tab with state in
      // sessionStorage; that page injects map and data, then triggers the print dialog.
      openPrintView();
    });
  }

  function exportMapAsSvg() {
    var mapContainer = appState.dom.mapContainer;
    var svgEl;
    var serializer;
    var svgString;
    var blob;
    var url;
    var a;
    if (!mapContainer) return;
    svgEl = mapContainer.querySelector("svg");
    if (!svgEl) {
      setUtilityStatus("Map not ready. Wait for it to load, then try again.");
      return;
    }
    setUtilityStatus("Preparing map download…");
    serializer = new XMLSerializer();
    svgString = serializer.serializeToString(svgEl);
    svgString = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + svgString;
    blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    url = URL.createObjectURL(blob);
    a = document.createElement("a");
    a.href = url;
    a.download = "340b-us-map.svg";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setUtilityStatus("Map saved as SVG.");
    window.setTimeout(function () { setUtilityStatus(""); }, 2000);
  }

  function initExportMapSvg() {
    var btn = document.getElementById("btn-export-svg");
    if (!btn) return;
    btn.addEventListener("click", function () {
      runTaskSafely("export map svg", exportMapAsSvg);
    });
  }

  /* ---------- Dataset download (Wave 1 — Data Credibility Agent) ---------- */
  /** Build CSV from STATE_340B/STATE_NAMES. Sanitizes values for safe output. */
  function buildDatasetCsv() {
    if (typeof STATE_340B !== "object" || !STATE_340B || typeof STATE_NAMES !== "object") return "";
    var rows = ["State,Abbr,Contract Pharmacy,Year Enacted,PBM,Notes"];
    Object.keys(STATE_340B).sort().forEach(function (abbr) {
      var row = STATE_340B[abbr];
      var name = (STATE_NAMES[abbr] || abbr).replace(/"/g, '""');
      var cp = row && row.cp === true ? "Yes" : "No";
      var y = row && row.y != null ? String(row.y) : "";
      var pbm = row && row.pbm === true ? "Yes" : "No";
      var notes = (row && row.notes ? String(row.notes) : "").replace(/"/g, '""');
      rows.push('"' + name + '",' + abbr + ',"' + cp + '","' + y + '","' + pbm + '","' + notes + '"');
    });
    return rows.join("\r\n");
  }

  /** Build JSON from STATE_340B with STATE_NAMES. Safe for download (no script). */
  function buildDatasetJson() {
    if (typeof STATE_340B !== "object" || !STATE_340B || typeof STATE_NAMES !== "object") return "{}";
    var out = { meta: { lastUpdated: (typeof DATASET_METADATA !== "undefined" && DATASET_METADATA && DATASET_METADATA.lastUpdated) ? DATASET_METADATA.lastUpdated : (config.lastUpdated || "March 2025"), version: (typeof DATASET_METADATA !== "undefined" && DATASET_METADATA && DATASET_METADATA.datasetVersion) ? DATASET_METADATA.datasetVersion : "2.0" }, states: {} };
    Object.keys(STATE_340B).forEach(function (abbr) {
      var row = STATE_340B[abbr];
      out.states[abbr] = {
        name: STATE_NAMES[abbr] || abbr,
        contractPharmacy: !!(row && row.cp),
        yearEnacted: row && row.y != null ? row.y : null,
        pbm: !!(row && row.pbm),
        notes: row && row.notes ? String(row.notes) : ""
      };
    });
    return JSON.stringify(out, null, 2);
  }

  function downloadDatasetAsCsv() {
    var csv = buildDatasetCsv();
    if (!csv) return;
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "340b-state-law-data.csv";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setUtilityStatus("CSV downloaded.");
    setTimeout(function () { setUtilityStatus(""); }, 2000);
  }

  function downloadDatasetAsJson() {
    var json = buildDatasetJson();
    if (!json) return;
    var blob = new Blob([json], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "340b-state-law-data.json";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setUtilityStatus("JSON downloaded.");
    setTimeout(function () { setUtilityStatus(""); }, 2000);
  }

  function initDatasetDownload() {
    var btnCsv = document.getElementById("btn-download-csv");
    var btnJson = document.getElementById("btn-download-json");
    if (btnCsv) btnCsv.addEventListener("click", function () { runTaskSafely("download csv", downloadDatasetAsCsv); });
    if (btnJson) btnJson.addEventListener("click", function () { runTaskSafely("download json", downloadDatasetAsJson); });
  }

  // Runs when the user clicks Download PDF (image); captures the main content with html2canvas. Three pages: Page 1 = intro through executive strip. Page 2 = state-by-state analysis and map. Page 3 = KPI strip through end. Each page fitted to A4 with 10mm margins.
  function downloadPdfAsImage() {
    var html2canvasLib = typeof window.html2canvas === "function" ? window.html2canvas : null;
    var jsPDFLib = typeof window.jspdf !== "undefined" && window.jspdf.jsPDF ? window.jspdf.jsPDF : (typeof window.jspdf !== "undefined" ? window.jspdf : null);
    if (!html2canvasLib || !jsPDFLib) {
      setUtilityStatus("PDF download isn't available right now. Use 'Print / PDF' and choose Save as PDF in the print dialog.");
      setTimeout(function () { setUtilityStatus(""); }, 4000);
      return;
    }
    preparePrintSelectionState();
    runTaskSafely("reveal for pdf", revealAllAnimatedSections);
    runTaskSafely("show map for pdf", showMapWrapImmediately);
    var methodologyWrap = document.getElementById("methodology-wrap");
    if (methodologyWrap) methodologyWrap.setAttribute("open", "");
    var mapSection = document.querySelector("#state-laws");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "auto", block: "start" });
    }
    var target = document.getElementById("pdf-capture-root") || document.querySelector("main") || document.querySelector(".dashboard-inner") || document.body;
    var pdfStyleEl = null;
    function injectPdfStyle() {
      if (pdfStyleEl) return;
      pdfStyleEl = document.createElement("style");
      pdfStyleEl.id = "pdf-capture-style";
      pdfStyleEl.textContent = "body.pdf-capture #pdf-capture-root { max-width: 794px; margin-left: auto; margin-right: auto; width: 100%; padding-top: 0 !important; margin-top: 0 !important; } " +
        "body.pdf-capture .methodology-wrap, body.pdf-capture details#methodology-wrap, body.pdf-capture .methodology-content, body.pdf-capture .methodology-sources-header, body.pdf-capture .source-links, body.pdf-capture .methodology-toggle { display: none !important; } " +
        "body.pdf-capture .print-sources, body.pdf-capture .sources, body.pdf-capture #sources-summary { display: none !important; } " +
        "body.pdf-capture .intro-section { padding: 0.25rem 0; margin-top: 0 !important; padding-top: 0 !important; } " +
        "body.pdf-capture .intro-section .card { padding: 0.65rem 0.9rem; margin-bottom: 0.6rem; } " +
        "body.pdf-capture .intro-section .card h2 { font-size: 1.05rem; line-height: 1.25; } " +
        "body.pdf-capture .intro-section .card p, body.pdf-capture .intro-section .stat-block { font-size: 0.82rem; } " +
        "body.pdf-capture .key-findings-strip { margin: 0.85rem 0 0.4rem; padding: 0.5rem 0.9rem; } " +
        "body.pdf-capture .key-findings-strip h3 { font-size: 0.9rem; } " +
        "body.pdf-capture .key-findings-strip ul { font-size: 0.82rem; line-height: 1.4; } " +
        "body.pdf-capture .executive-proof-strip { margin: 0.4rem 0; padding: 0.4rem 0; } " +
        "body.pdf-capture .executive-proof-strip .executive-proof-card { padding: 0.45rem 0.65rem; margin-bottom: 0.4rem; } " +
        "body.pdf-capture .executive-proof-strip h3 { font-size: 0.9rem; line-height: 1.3; } " +
        "body.pdf-capture .executive-proof-strip p { font-size: 0.8rem; } " +
        "body.pdf-capture #state-laws { margin-top: 0.5rem; margin-bottom: 1rem; } " +
        "body.pdf-capture .map-wrap, body.pdf-capture .us-map-wrap { overflow: visible !important; opacity: 1 !important; } " +
        "body.pdf-capture .us-map-wrap.visible, body.pdf-capture .us-map-wrap.map-visible { opacity: 1 !important; } " +
        "body.pdf-capture #state-lists-wrap { display: none !important; } " +
        "body.pdf-capture .kpi-strip { margin-top: 0.4rem; margin-bottom: 0.4rem; padding: 0.3rem 0; font-size: 0.65em; } " +
        "body.pdf-capture .kpi-strip .kpi-card { padding: 0.3em 0.4em; } " +
        "body.pdf-capture .supporting-section { margin-top: 0.4rem; margin-bottom: 0.4rem; font-size: 0.65em; line-height: 1.25; } " +
        "body.pdf-capture .supporting-section .section-subhead { font-size: 0.92em; margin-bottom: 0.25rem; padding: 0.1rem 0; } " +
        "body.pdf-capture .supporting-cards-row { gap: 0.4rem; } " +
        "body.pdf-capture .supporting-section .card--compact { padding: 0.3em 0.45em !important; margin-bottom: 0.25rem; } " +
        "body.pdf-capture .supporting-section .card-heading h2, body.pdf-capture .supporting-section .card-title { font-size: 0.92em; } " +
        "body.pdf-capture .supporting-section p { margin: 0.1em 0; } " +
        "body.pdf-capture .supporting-section ul { margin: 0.1em 0; padding-left: 0.85rem; } " +
        "body.pdf-capture .supporting-section li { margin-bottom: 0.08em; } " +
        "body.pdf-capture .supporting-section .stat-block { margin-top: 0.15em; gap: 0.2rem; } " +
        "body.pdf-capture .supporting-section .stat { padding: 0.18em 0.28em; } " +
        "body.pdf-capture .supporting-section .stat-label, body.pdf-capture .supporting-section .stat-desc { font-size: 0.88em; } " +
        "body.pdf-capture .supporting-section .stat-value { font-size: 0.92em; } " +
        "body.pdf-capture #community-benefit { margin-top: 0.6rem; margin-bottom: 0.5rem; padding: 0.4em 0.65em !important; font-size: 0.65em; line-height: 1.3; overflow: visible !important; } " +
        "body.pdf-capture #community-benefit .card-heading h2, body.pdf-capture #community-benefit .card-title { font-size: 0.92em; } " +
        "body.pdf-capture #community-benefit .benefit-grid { gap: 0.2rem; } " +
        "body.pdf-capture #community-benefit .benefit-item { padding: 0.18em 0.35em; } " +
        "body.pdf-capture #community-benefit .benefit-item-icon { width: 22px; height: 22px; } " +
        "body.pdf-capture #community-benefit .benefit-item-icon svg { width: 11px; height: 11px; } " +
        "body.pdf-capture #community-benefit .benefit-item-text { font-size: 0.92em; } " +
        "body.pdf-capture .community-benefit-hero { padding: 0.35rem 0.55rem !important; margin-top: 0.25rem !important; overflow: visible !important; min-height: auto !important; border-radius: 6px; } " +
        "body.pdf-capture .community-benefit-hero .big-stat-label { margin: 0 0 0.1rem !important; font-size: 0.85em; } " +
        "body.pdf-capture .community-benefit-hero .big-stat-value { margin: 0 !important; font-size: 1.2em !important; } " +
        "body.pdf-capture .community-benefit-hero .big-stat-desc { margin: 0.1rem 0 0 !important; font-size: 0.85em; } " +
        "body.pdf-capture #community-benefit { content-visibility: visible !important; contain: none !important; } " +
        "body.pdf-capture #access { margin-top: 0.4rem; padding: 0.3em 0.5em !important; font-size: 0.65em; line-height: 1.22; } " +
        "body.pdf-capture #access .card-heading h2, body.pdf-capture #access .card-title { font-size: 0.92em; } " +
        "body.pdf-capture #access p { margin: 0.1em 0 0; } " +
        "body.pdf-capture #pa-safeguards { margin-top: 0.4rem; padding: 0.3em 0.5em !important; font-size: 0.65em; line-height: 1.22; margin-bottom: 0.4rem; } " +
        "body.pdf-capture #pa-safeguards .card-heading h2, body.pdf-capture #pa-safeguards .card-title { font-size: 0.92em; } " +
        "body.pdf-capture #pa-safeguards ul { margin: 0.1em 0 0; padding-left: 0.85rem; } " +
        "body.pdf-capture #pa-safeguards li { margin-bottom: 0.08em; } ";
      document.head.appendChild(pdfStyleEl);
    }
    function removePdfStyle() {
      if (pdfStyleEl && pdfStyleEl.parentNode) {
        pdfStyleEl.parentNode.removeChild(pdfStyleEl);
        pdfStyleEl = null;
      }
      document.body.classList.remove("pdf-capture");
    }
    var mapSvgEl = null;
    var mapImgEl = null;
    function restoreMapSvg() {
      if (mapImgEl && mapImgEl.parentNode) mapImgEl.parentNode.removeChild(mapImgEl);
      if (mapSvgEl) mapSvgEl.style.display = "";
      mapSvgEl = null;
      mapImgEl = null;
    }
    setUtilityStatus("Creating PDF...");
    function capture() {
      injectPdfStyle();
      document.body.classList.add("pdf-capture");
      // Finalize so the captured page shows 7%, 72, etc., not 0 or half-animated values.
      finalizeCountUpValues();
      // Scale 2 gives a sharper image when the canvas is scaled down to fit the PDF page.
      var capturePromise = html2canvasLib(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error("timeout")); }, PDF_CAPTURE_TIMEOUT_MS);
      });
      Promise.race([capturePromise, timeoutPromise]).then(function (canvas) {
        var scale = 2;
        var mainRect = target.getBoundingClientRect();
        var stateLawsEl = document.getElementById("state-laws");
        var kpiStripEl = document.querySelector(".kpi-strip");
        // Page 1: overview to why trust (intro + key findings + executive strip). Page 2: state-by-state + map + recent legal signals. Page 3: KPI strip through end. Method/sources hidden. 10mm margins all sides.
        var break1Y = stateLawsEl ? Math.max(0, (stateLawsEl.getBoundingClientRect().top - mainRect.top) * scale) : canvas.height * 0.4;
        var break2Y = kpiStripEl ? Math.max(break1Y, (kpiStripEl.getBoundingClientRect().top - mainRect.top) * scale) : canvas.height * 0.75;
        break1Y = Math.min(break1Y, canvas.height);
        break2Y = Math.min(break2Y, canvas.height);
        if (break2Y <= break1Y) break2Y = canvas.height;
        restoreMapSvg();
        removePdfStyle();
        try {
          var pdf = new jsPDFLib("p", "mm", "a4");
          var pdfW = pdf.internal.pageSize.getWidth();
          var pdfH = pdf.internal.pageSize.getHeight();
          var marginMm = 10;
          var innerW = pdfW - marginMm * 2;
          var innerH = pdfH - marginMm * 2;
          function addCanvasSliceWithMargins(sliceCanvas, opts) {
            opts = opts || {};
            var imgW = innerW;
            var imgH = (sliceCanvas.height * innerW) / sliceCanvas.width;
            var drawCanvas = sliceCanvas;
            if (opts.fitWidth && imgH > innerH) {
              var cropH = Math.floor(innerH * sliceCanvas.width / innerW);
              var cropped = document.createElement("canvas");
              cropped.width = sliceCanvas.width;
              cropped.height = cropH;
              cropped.getContext("2d").drawImage(sliceCanvas, 0, 0, sliceCanvas.width, cropH, 0, 0, sliceCanvas.width, cropH);
              drawCanvas = cropped;
              imgH = innerH;
            } else if (imgH > innerH) {
              imgH = innerH;
              imgW = (sliceCanvas.width * innerH) / sliceCanvas.height;
            }
            var imgData = drawCanvas.toDataURL("image/png", 0.95);
            var x = marginMm + (innerW - imgW) / 2;
            var y = opts.topAlign ? marginMm : marginMm + (innerH - imgH) / 2;
            pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
          }
          var slice1 = document.createElement("canvas");
          slice1.width = canvas.width;
          slice1.height = break1Y;
          slice1.getContext("2d").drawImage(canvas, 0, 0, canvas.width, break1Y, 0, 0, canvas.width, break1Y);
          addCanvasSliceWithMargins(slice1, { topAlign: true });
          pdf.addPage();
          var slice2 = document.createElement("canvas");
          slice2.width = canvas.width;
          slice2.height = break2Y - break1Y;
          slice2.getContext("2d").drawImage(canvas, 0, break1Y, canvas.width, break2Y - break1Y, 0, 0, canvas.width, break2Y - break1Y);
          addCanvasSliceWithMargins(slice2);
          pdf.addPage();
          var slice3 = document.createElement("canvas");
          slice3.width = canvas.width;
          slice3.height = canvas.height - break2Y;
          slice3.getContext("2d").drawImage(canvas, 0, break2Y, canvas.width, canvas.height - break2Y, 0, 0, canvas.width, canvas.height - break2Y);
          addCanvasSliceWithMargins(slice3, { fitWidth: true });
          pdf.save("340b-dashboard.pdf");
          if (appState.printAppliedDefaultSelection) {
            clearSelection("", { updateHash: false, announce: false });
            appState.printAppliedDefaultSelection = false;
          }
          setUtilityStatus("PDF saved.");
          setTimeout(function () { setUtilityStatus(""); }, 2500);
        } catch (e) {
          if (appState.printAppliedDefaultSelection) {
            clearSelection("", { updateHash: false, announce: false });
            appState.printAppliedDefaultSelection = false;
          }
          setUtilityStatus("PDF capture failed. Try Print / PDF instead.");
          setTimeout(function () { setUtilityStatus(""); }, 3000);
        }
      }).catch(function (err) {
        restoreMapSvg();
        removePdfStyle();
        if (appState.printAppliedDefaultSelection) {
          clearSelection("", { updateHash: false, announce: false });
          appState.printAppliedDefaultSelection = false;
        }
        setUtilityStatus("PDF capture failed. Try Print / PDF instead.");
        setTimeout(function () { setUtilityStatus(""); }, 3000);
      });
    }
    function waitForMapThenCapture() {
      // We poll because the map is drawn asynchronously; capture must wait until the SVG exists so the PDF includes it.
      var attempts = 0;
      function check() {
        var mapSvg = document.querySelector("#us-map svg");
        var hasPaths = mapSvg && mapSvg.querySelector("path[data-state]");
        if (hasPaths) {
          setTimeout(function () { capture(); }, 900);
          return;
        }
        attempts += 1;
        if (attempts < WAIT_FOR_MAP_MAX_ATTEMPTS) {
          setTimeout(check, WAIT_FOR_MAP_INTERVAL_MS);
        } else {
          capture();
        }
      }
      setTimeout(check, 500);
    }
    waitForMapThenCapture();
  }

  function initDownloadPdf() {
    var btn = document.getElementById("btn-download-pdf");
    if (!btn) return;
    btn.addEventListener("click", function () {
      runTaskSafely("download pdf image", downloadPdfAsImage);
    });
  }

  function initShare() {
    if (!appState.dom.shareButton) return;

    appState.dom.shareButton.addEventListener("click", function () {
      var url = buildShareUrl();
      var fallbackField;

      setUtilityStatus("Copying link...");

      if (navigator.share) {
        navigator.share({
          title: config.shareTitle || config.dashboardTitle,
          text: config.shareDescription || config.pageDescription,
          url: url
        }).then(function () {
          setUtilityStatus("Link shared.");
        }).catch(function () {
          setUtilityStatus("Share cancelled. Try Copy link below if you need the URL.");
        });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(function () {
            setUtilityStatus("Link copied.");
          })
          .catch(function () {
            fallbackField = createElement("textarea");
            fallbackField.value = url;
            fallbackField.setAttribute("readonly", "readonly");
            fallbackField.setAttribute("aria-hidden", "true");
            fallbackField.style.position = "fixed";
            fallbackField.style.left = "-9999px";
            document.body.appendChild(fallbackField);
            fallbackField.select();

            try {
              if (document.execCommand("copy")) {
                showTemporaryUtilityStatus("Link copied.");
              } else {
                window.prompt("Copy this link:", url);
                showTemporaryUtilityStatus("Copy the link from the dialog above.");
              }
            } catch (error) {
              window.prompt("Copy this link:", url);
              showTemporaryUtilityStatus("Copy the link from the dialog above.");
            }

            document.body.removeChild(fallbackField);
          });
      } else {
        window.prompt("Copy this link:", url);
        showTemporaryUtilityStatus("Copy the link from the dialog above.");
      }

      window.setTimeout(function () {
        setUtilityStatus("");
      }, 2500);
    });
  }

  function initMethodologyToggle() {
    if (!appState.dom.methodologyWrap || !appState.dom.methodologyContent) return;

    appState.dom.methodologyWrap.addEventListener("toggle", function () {
      appState.dom.methodologyContent.classList.toggle("open", appState.dom.methodologyWrap.open);
    });
  }

  function initSelectionControls() {
    if (!appState.dom.selectionClear) return;

    appState.dom.selectionClear.addEventListener("click", function () {
      clearSelection();
    });
  }

  /* ---------- Progressive enhancement helpers ---------- */

  function initCountUp() {
    var elements = document.querySelectorAll("[data-count-up]");
    var duration = config.countUpDuration || 1200;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      elements.forEach(function (element) {
        var target = parseFloat(element.getAttribute("data-count-up"));
        var decimals = parseInt(element.getAttribute("data-decimals"), 10) || 0;
        var suffix = element.getAttribute("data-suffix") || "";
        element.textContent = (decimals ? target.toFixed(decimals) : Math.round(target)) + suffix;
      });
      return;
    }

    appState.countUpObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var element = entry.target;
        var target;
        var decimals;
        var suffix;
        var start;

        if (!entry.isIntersecting || element.dataset.done === "1") return;

        element.dataset.done = "1";
        target = parseFloat(element.getAttribute("data-count-up"));
        decimals = parseInt(element.getAttribute("data-decimals"), 10) || 0;
        suffix = element.getAttribute("data-suffix") || "";
        start = performance.now();

        requestAnimationFrame(function animate(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 2.5);
          var value = target * eased;
          element.textContent = (decimals ? value.toFixed(decimals) : Math.round(value)) + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        });
      });
    }, { threshold: config.scrollRevealThreshold || 0.1 });

    elements.forEach(function (element) {
      appState.countUpObserver.observe(element);
    });
  }

  function initScrollReveal() {
    document.body.classList.add("scroll-reveal-js");
    var items = document.querySelectorAll(".scroll-reveal");

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      items.forEach(function (item) {
        item.classList.add("revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add("revealed");
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initNavHighlight() {
    var sections = document.querySelectorAll("#what-is-340b, #overview, #state-laws, #eligibility, #oversight, #pa-impact, #community-benefit, #access, #pa-safeguards");

    if (typeof IntersectionObserver === "undefined") {
      updateNavCurrent("what-is-340b");
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) updateNavCurrent(entry.target.id);
      });
    }, { rootMargin: "-80px 0 -50% 0", threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------- Event handlers ---------- */

  function syncSelectionFromHash() {
    var hashState = getHashState();
    var hasStateHash = /^#state-/i.test(location.hash || "");

    if (hashState) {
      selectState(hashState, { focusPanel: true, scrollToMap: true });
    } else if (hasStateHash) {
      updateUrlHash(null);
      clearSelection("");
    } else if (appState.selectedStateAbbr) {
      clearSelection("");
    }
  }

  function handleDocumentClick(event) {
    if (!appState.dom.stateDetailPanel) return;

    if (
      event.target.closest("#us-map path") ||
      event.target.closest(".state-chip") ||
      event.target.closest("#state-detail-panel") ||
      event.target.closest("#selection-summary") ||
      event.target.closest("#methodology-toggle") ||
      event.target.closest("#methodology-content") ||
      event.target.closest("#selection-clear") ||
      event.target.closest(".state-filter-bar") ||
      event.target.closest(".utility-toolbar")
    ) {
      return;
    }

    clearSelection("");
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && appState.selectedStateAbbr) {
      clearSelection();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "p") {
      event.preventDefault();
      runTaskSafely("download pdf image", downloadPdfAsImage);
    }
  }

  function handleResize() {
    var width;

    if (appState.touchDevice || !appState.dom.mapContainer) return;

    width = appState.dom.mapContainer.offsetWidth;
    if (Math.abs(width - appState.lastMapWidth) < 40 && appState.lastMapWidth) return;

    appState.lastMapWidth = width;
    drawMap();
  }

  function handleBeforePrint() {
    // When user selects Print from browser (Chrome), use Download PDF image instead.
    // Keyboard Ctrl+P/Cmd+P is handled in handleKeydown; beforeprint fires for File > Print.
    runTaskSafely("download pdf image", downloadPdfAsImage);
  }

  function handleAfterPrint() {
    appState.printPreparationPending = false;
    document.body.classList.remove("print-ready");
    setUtilityStatus("");
    clearElement(appState.dom.printIntroSnapshot);

    if (appState.printAppliedDefaultSelection) {
      clearSelection("", {
        updateHash: false,
        announce: false
      });
      appState.printAppliedDefaultSelection = false;
    }
  }

  /* ---------- Init ---------- */

  function init() {
    cacheDom();

    /* If core data did not load (e.g. script order or missing inline data), show message and stop. */
    if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined" || typeof FIPS_TO_ABBR === "undefined") {
      var msg = "Dashboard data didn't load.";
      if (appState.dom.mapSkeleton) {
        appState.dom.mapSkeleton.classList.remove("map-loading-skeleton");
        var p = document.createElement("p");
        p.className = "map-error-msg";
        p.textContent = msg;
        appState.dom.mapSkeleton.replaceChildren(p);
        if (appState.dom.mapWrap) appState.dom.mapWrap.setAttribute("aria-busy", "false");
      }
      if (appState.dom.utilityStatus) appState.dom.utilityStatus.textContent = "Data not loaded.";
      return;
    }

    // Run each startup task independently so one broken feature does not take down the whole page.
    // Example: if the map fails, share/print/filter logic should still initialize.
    runTaskSafely("apply config copy", applyConfigCopy);
    runTaskSafely("update metadata", updateMetadata);
    runTaskSafely("validate state data", validateStateData);
    (function runSecondaryPanels() {
      var defer = typeof DASHBOARD_SETTINGS !== "undefined" && DASHBOARD_SETTINGS.performance && DASHBOARD_SETTINGS.performance.deferSecondaryPanels;
      if (defer) {
        requestAnimationFrame(function () {
          runTaskSafely("apply about data panel", applyAboutDataPanel);
          runTaskSafely("apply policy insights", applyPolicyInsights);
          runTaskSafely("fill ranked state table", fillRankedStateTable);
          runTaskSafely("fill adoptions chart", fillAdoptionsChart);
          runTaskSafely("init ranked table sort", initRankedTableSort);
        });
      } else {
        runTaskSafely("apply about data panel", applyAboutDataPanel);
        runTaskSafely("apply policy insights", applyPolicyInsights);
        runTaskSafely("fill ranked state table", fillRankedStateTable);
        runTaskSafely("fill adoptions chart", fillAdoptionsChart);
        runTaskSafely("init ranked table sort", initRankedTableSort);
      }
    })();
    runTaskSafely("render empty detail", renderEmptyStateDetail);
    runTaskSafely("update selection summary", function () {
      updateSelectionSummary(null);
    });
    runTaskSafely("render state chips", renderStateChips);
    runTaskSafely("initialize filters", initStateFilter);
    runTaskSafely("initialize print", initPrint);
    runTaskSafely("initialize share", initShare);
    runTaskSafely("initialize export map svg", initExportMapSvg);
    runTaskSafely("initialize dataset download", initDatasetDownload);
    runTaskSafely("initialize download pdf", initDownloadPdf);
    runTaskSafely("initialize methodology toggle", initMethodologyToggle);
    runTaskSafely("initialize selection controls", initSelectionControls);
    runTaskSafely("draw map", drawMap);
    runTaskSafely("initialize count up", initCountUp);
    runTaskSafely("initialize scroll reveal", initScrollReveal);
    runTaskSafely("initialize nav highlight", initNavHighlight);
    runTaskSafely("sync selection from hash", syncSelectionFromHash);

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    window.addEventListener("hashchange", syncSelectionFromHash);

    if (!appState.touchDevice) {
      window.addEventListener("resize", function () {
        clearTimeout(appState.resizeTimer);
        appState.resizeTimer = window.setTimeout(handleResize, 300);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
