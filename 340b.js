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
 * SECURITY (Wave 4): Use textContent for all dynamic content—avoid raw HTML insertion with user/external data.
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
 * INIT FLOW (what runs on load — find these functions in this file):
 *   DOMContentLoaded → cacheDom, applyConfigCopy, validateStateData, drawMap,
 *   renderStateChips, bindMapEvents, setupMapVisibilityObserver, initFilters,
 *   initUtilityButtons, updateMetadata, applyAboutDataPanel, applyPolicyInsights
 * PRINT / PDF TAB: openPrintView → preparePrintSnapshot → getPrintViewPayload → localStorage (hap340b:printSnapshot)
 * MAP CLICK: bindMapEvents → selectState → updateMapContext, updateUrlHash, renderStateDetail
 *
 * WAVE 1 (Data Credibility): Metadata, versioning, timestamps in data/dataset-metadata.js and applyAboutDataPanel(); dataset download CSV/JSON in buildDatasetCsv(), buildDatasetJson(), initDatasetDownload().
 * WAVE 2 (Policy Analytics): POLICY_INSIGHTS in analytics/policy-insights.js; applyPolicyInsights(); fillAdoptionsChart(); data/historical-trends.js for YoY trends.
 * WAVE 3 (Interactivity): State filters, map hover/click, tooltips, ranked table with initRankedTableSort(), chart bar tooltips.
 * WAVE 4 (Engineering): config.json and config/settings.js; safeText() and textContent-only rendering; runTaskSafely() for isolated task execution; print/print.html compatible.
 * WAVE 5 (Scroll perf — iterative passes): passive scroll + rAF nav; cached section tops; lastNavActiveId skips redundant nav DOM; batched rAF for scroll-reveal + policy timeline IO; debounced window resize for header offset; ResizeObserver coalesced to rAF.
 */

(function () {
  "use strict";

  /** Pennsylvania contract-pharmacy bill tracker — edit values here (sync with Advocacy before publishing). */
  const PA_BILL_CONFIG = {
    hasBill: true,
    billNumber: "No active HB/SB filed",
    billTitle: "PA Contract Pharmacy Protection proposal (not yet introduced)",
    houseCommittee: "Health Committee",
    houseChair: "Rep. Dan Frankel",
    senateCommittee: "Health & Human Services Committee",
    senateChair: "Sen. Michele Brooks",
    sessionDeadline: "June 30, 2026",
    lastAction: "No 340B contract pharmacy protection bill introduced in the 2025-2026 session (as of March 2026)",
    hapPosition: "SUPPORT",
    billUrl: "https://www.palegis.us/legislation",
    hapContact: "HAP State Advocacy",
    hapContactTitle: "Advocacy contact",
    hapContactEmail: "",
    hapContactPhone: "(717) 564-9200"
  };

  /** Federal 340B bill banner — edit values here (sync with Federal Advocacy before publishing). */
  const FEDERAL_BILL_CONFIG = {
    hasBill: true,
    billNumber: "S. 2372 / H.R. 4581",
    billTitle: "340B PATIENTS Act of 2025",
    senateStatus: "Referred to HELP Committee",
    houseStatus: "Referred to Energy & Commerce Committee",
    lastUpdated: "March 2026",
    billUrl: "https://www.congress.gov/bill/119th-congress/senate-bill/2372",
    hapContact: "HAP Federal Advocacy",
    hapContactTitle: "Advocacy contact",
    hapContactEmail: "",
    hapContactPhone: "(717) 564-9200"
  };

  /** Data verified timestamps for stat card provenance. */
  const DATA_DATES = {
    communityBenefit: "October 2025",
    paHospitals: "January 2026",
    stateLaws: "March 2026",
    outpatientShare: "2023 (IQVIA)",
    hrsaAudits: "September 2025"
  };

  /** Illustrative trend series for executive summary sparklines only (see methodology). */
  const TREND_DATA = {
    communityBenefit: {
      values: [5.8, 6.2, 6.7, 7.3, 7.95],
      years: ["2020", "2021", "2022", "2023", "2024"],
      direction: "up",
      label: "↑ 9% from 2023"
    },
    paHospitals: {
      values: [68, 69, 70, 71, 72],
      years: ["2020", "2021", "2022", "2023", "2024"],
      direction: "up",
      label: "↑ Steady participation growth"
    },
    statesWithProtection: {
      values: [8, 11, 14, 18, 21],
      years: ["2020", "2021", "2022", "2023", "2024"],
      direction: "up",
      label: "↑ 3 new states in 2024"
    },
    outpatientShare: {
      values: [5.1, 5.6, 6.0, 6.5, 7.0],
      years: ["2019", "2020", "2021", "2022", "2023"],
      direction: "up",
      label: "↑ Growing program scale"
    }
  };

  /**
   * Pennsylvania congressional delegation (2 senators + 17 House districts).
   * NOTE: position is policy-status metadata for the configured 340B bill and should be
   * updated by Advocacy as sponsorship/commitments are confirmed.
   * position: cosponsor | supportive | unknown | opposed
   */
  var PA_DELEGATION_MEMBERS = [
    { member: "John Fetterman", chamber: "Senate", district: "Statewide", party: "D", position: "cosponsor", lastContact: "03/15/2026", action: "Schedule meeting" },
    { member: "Dave McCormick", chamber: "Senate", district: "Statewide", party: "R", position: "supportive", lastContact: "03/10/2026", action: "Schedule meeting" },

    { member: "Brian Fitzpatrick", chamber: "House", district: "District 1", party: "R", position: "unknown", lastContact: "02/28/2026", action: "Schedule meeting" },
    { member: "Brendan Boyle", chamber: "House", district: "District 2", party: "D", position: "opposed", lastContact: "01/20/2026", action: "Schedule meeting" },
    { member: "Dwight Evans", chamber: "House", district: "District 3", party: "D", position: "cosponsor", lastContact: "03/01/2026", action: "Schedule meeting" },
    { member: "Madeleine Dean", chamber: "House", district: "District 4", party: "D", position: "supportive", lastContact: "02/15/2026", action: "Schedule meeting" },
    { member: "Mary Gay Scanlon", chamber: "House", district: "District 5", party: "D", position: "unknown", lastContact: "01/10/2026", action: "Schedule meeting" },
    { member: "Chrissy Houlahan", chamber: "House", district: "District 6", party: "D", position: "supportive", lastContact: "03/05/2026", action: "Schedule meeting" },
    { member: "Ryan Mackenzie", chamber: "House", district: "District 7", party: "R", position: "opposed", lastContact: "12/01/2025", action: "Schedule meeting" },
    { member: "Rob Bresnahan", chamber: "House", district: "District 8", party: "R", position: "unknown", lastContact: "02/20/2026", action: "Schedule meeting" },
    { member: "Dan Meuser", chamber: "House", district: "District 9", party: "R", position: "cosponsor", lastContact: "03/12/2026", action: "Schedule meeting" },
    { member: "Scott Perry", chamber: "House", district: "District 10", party: "R", position: "supportive", lastContact: "01/30/2026", action: "Schedule meeting" },
    { member: "Lloyd Smucker", chamber: "House", district: "District 11", party: "R", position: "unknown", lastContact: "02/05/2026", action: "Schedule meeting" },
    { member: "Summer Lee", chamber: "House", district: "District 12", party: "D", position: "supportive", lastContact: "03/08/2026", action: "Schedule meeting" },
    { member: "John Joyce", chamber: "House", district: "District 13", party: "R", position: "opposed", lastContact: "11/15/2025", action: "Schedule meeting" },
    { member: "Guy Reschenthaler", chamber: "House", district: "District 14", party: "R", position: "unknown", lastContact: "01/25/2026", action: "Schedule meeting" },
    { member: "Glenn Thompson", chamber: "House", district: "District 15", party: "R", position: "supportive", lastContact: "02/22/2026", action: "Schedule meeting" },
    { member: "Mike Kelly", chamber: "House", district: "District 16", party: "R", position: "unknown", lastContact: "03/02/2026", action: "Schedule meeting" },
    { member: "Chris Deluzio", chamber: "House", district: "District 17", party: "D", position: "supportive", lastContact: "03/06/2026", action: "Schedule meeting" }
  ];

  /* ==================================================
     CONFIGURATION & CONSTANTS
     ==================================================
     CONFIG comes from state-data.js (inlined in 340b.html).
     Fallback below is used only when CONFIG is undefined (e.g. local file open).
     */
  var config = typeof CONFIG !== "undefined" ? CONFIG : {
    dashboardTitle: "340B Drug Pricing Program",
    dashboardSubtitle: "HAP Advocacy Dashboard",
    pageDescription: "340B advocacy dashboard.",
    shareTitle: "340B Drug Pricing Program | HAP Advocacy Dashboard",
    shareDescription: "340B contract pharmacy protection dashboard.",
    dataFreshness: "March 2026",
    lastUpdated: "March 2026",
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

  var paBillCountdownTimer = null;

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
    /** Last section id passed to updateNavCurrent — skips redundant class/aria churn while scrolling */
    lastNavActiveId: null,
    dom: {}
  };

  /* ==================================================
     DOM REFERENCES
     ==================================================
     Caches element references to avoid repeated DOM queries.
     Call cacheDom() once during init.
     */
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
      mapInteractiveWrap: document.getElementById("map-interactive"),
      mapStaticFallback: document.getElementById("map-static-fallback"),
      mapTooltip: document.getElementById("map-tooltip"),
      chipTooltip: document.getElementById("state-list-tooltip"),
      stateDetailPanel: document.getElementById("state-detail-panel"),
      stateListWith: document.getElementById("states-with-list"),
      stateListWithout: document.getElementById("states-without-list"),
      printStateListWith: document.getElementById("print-states-with-list"),
      printStateListWithout: document.getElementById("print-states-without-list"),
      protectionCount: document.getElementById("protection-count"),
      keyFindingProtectionCount: document.getElementById("key-finding-protection-count"),
      keyFindingNoCount: document.getElementById("key-finding-no-count"),
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
      hapLawmakerLabel: document.getElementById("hap-lawmaker-label"),
      hapPositionWhy: document.getElementById("hap-position-why"),
      mapHeroSub: document.getElementById("map-hero-sub"),
      mapHowToUse: document.getElementById("map-how-to-use"),
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
      printMethodologyLastUpdated: document.getElementById("print-methodology-last-updated"),
      /* Performance: cached repeated selectors (not used in print/PDF/map logic) */
      stateLawsSection: document.getElementById("state-laws"),
      navLinks: document.querySelectorAll(".dashboard-nav a[href^='#'], .hap-sidebar-nav a[href^='#']"),
      filterButtons: document.querySelectorAll(".state-filter-btn"),
      filterSelect: document.getElementById("state-filter-select"),
      kpiStrip: document.querySelector(".kpi-strip"),
      impactSimulatorRoot: document.getElementById("policy-impact-simulator-root"),
      paImpactRoot: document.getElementById("pa-impact-mode-root")
    };
  }

  /* ==================================================
     UTILITY HELPERS
     ==================================================
     safeText, clearElement, setElementText, etc.
     */

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

  /** Removes id attributes from a cloned subtree so print snapshot has no duplicate IDs in the DOM. */
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
    }, delayMs || UTILITY_STATUS_DEFAULT_MS);
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

    var hapFlagship = document.querySelector(".dashboard-grid > .hap-position-flagship");
    if (hapFlagship) {
      var hapClone = hapFlagship.cloneNode(true);
      removeIdsFromClone(hapClone);
      snapshotRoot.appendChild(hapClone);
    }
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
    setElementText(appState.dom.hapPositionWhy, copy.hapPositionWhy);
    setElementText(appState.dom.hapPositionLead, copy.hapPositionLead);
    setElementText(appState.dom.hapLawmakerLabel, copy.hapPositionLawmakerLabel);
    (function applyHapAskItems() {
      var asks = copy.hapAskItems;
      if (!Array.isArray(asks)) return;
      document.querySelectorAll(".hap-ask-list .hap-ask-item").forEach(function (li, i) {
        var item = asks[i];
        var labelEl = li.querySelector(".hap-ask-item-label");
        var impactEl = li.querySelector(".hap-ask-item-impact");
        if (labelEl) {
          setElementText(labelEl, item && typeof item.label === "string" ? item.label : "");
        }
        if (impactEl) {
          var line =
            item && typeof item.impactLine === "string"
              ? item.impactLine
              : item && typeof item.soWhat === "string"
                ? item.soWhat
                : "";
          setElementText(impactEl, line);
        }
      });
    })();
    setElementText(appState.dom.mapHeroSub, copy.mapHeroSub);
    setElementText(appState.dom.mapHowToUse, copy.mapHowToUse);
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
    var execSumP = document.getElementById("exec-summary-protection-count");
    var execSumN = document.getElementById("exec-summary-no-count");
    if (execSumP) execSumP.textContent = String(withProtection.length);
    if (execSumN) execSumN.textContent = String(withoutProtection.length);
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

  /* ==================================================
     STATE DATA HELPERS
     ==================================================
     Read from STATE_340B, STATE_NAMES (state-data.js).
     Do not modify these structures; only read.
     */

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
      return "Impact: use the map, source notes, and selected-state context together before drawing policy conclusions.";
    }

    if (abbr === getDefaultPrintStateAbbr()) {
      return config.printDefaultStateReason || "HAP focal state for print.";
    }

    if (data.cp) {
      return "Impact: enacted protection here gives lawmakers and hospital leaders a concrete comparison point when evaluating how contract pharmacy access can be preserved.";
    }

    return "Impact: the absence of enacted contract pharmacy protection here helps show the exposure hospitals can face when patient access depends on contract pharmacies.";
  }

  /** States where dashboard notes describe hybrid protection + reporting (see state-data.js / legal trends). */
  function isHybridProtectionState(abbr) {
    return ["CO", "ME", "OH", "RI", "VT"].indexOf(abbr) >= 0;
  }

  /** General policy framing only — not a fiscal score (see disclaimer in panel). */
  function appendStateFiscalContext(panel, abbr, data) {
    var section;
    var heading;
    var body;
    var disclaimer;
    var stateName;

    if (!panel || !data) return;

    stateName = getStateName(abbr);
    section = document.createElement("section");
    section.className = "state-detail-fiscal";
    section.setAttribute("aria-label", "State fiscal context");

    heading = document.createElement("h5");
    heading.className = "state-detail-fiscal-heading";
    heading.textContent = "State fiscal context";

    body = document.createElement("p");
    body.className = "state-detail-fiscal-body";

    if (data.cp && isHybridProtectionState(abbr)) {
      body.textContent =
        stateName +
        " paired pharmacy protection with reporting requirements — a model some budget-conscious legislators find more acceptable. No direct appropriation required.";
    } else if (data.cp) {
      body.textContent =
        "Enacting contract pharmacy protection carries no direct state budget cost — it restricts manufacturer behavior, not state spending. States with this law (like " +
        stateName +
        ") prevent access restrictions without a fiscal appropriation.";
    } else {
      body.textContent =
        "No state budget impact from inaction, but hospitals in " +
        stateName +
        " may face contract pharmacy restrictions that reduce 340B savings available for community benefit programs.";
    }

    disclaimer = document.createElement("p");
    disclaimer.className = "state-detail-fiscal-disclaimer";
    disclaimer.textContent =
      "This is a general policy note, not a CBO score or state fiscal analysis. For bill-specific cost estimates, consult your state's legislative fiscal office.";

    section.appendChild(heading);
    section.appendChild(body);
    section.appendChild(disclaimer);
    panel.appendChild(section);
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

    if (metaDescription) metaDescription.setAttribute("content", config.ogDescription || config.shareDescription || config.pageDescription);
    if (ogTitle) ogTitle.setAttribute("content", config.ogTitle || config.shareTitle || fullTitle);
    if (ogDescription) ogDescription.setAttribute("content", config.ogDescription || config.shareDescription || config.pageDescription);
    if (twitterTitle) twitterTitle.setAttribute("content", config.twitterTitle || config.shareTitle || fullTitle);
    if (twitterDescription) twitterDescription.setAttribute("content", config.twitterDescription || config.shareDescription || config.pageDescription);
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
      appState.dom.selectionSummaryText.textContent =
        "Pick a state on the map or from the lists to see protection status and notes.";
      updateMapContext(null);
      if (appState.dom.selectionClear) appState.dom.selectionClear.hidden = true;
      return;
    }

    appState.dom.selectionSummaryTitle.textContent = getStateName(abbr);
    appState.dom.selectionSummaryText.textContent = buildStateSummaryText(abbr);
    updateMapContext(abbr);
    if (appState.dom.selectionClear) appState.dom.selectionClear.hidden = false;
  }

  /* ==================================================
     SHARE LINK & URL HASH
     ==================================================
     Hash sync: #state-PA in URL keeps selection in sync on load/back.
     buildShareUrl() produces a shareable link with state context.
     */

  function updateUrlHash(abbr) {
    var nextHash = abbr ? "#state-" + abbr : "";

    if (location.hash === nextHash) return;

    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + nextHash);
    } else {
      location.hash = nextHash;
    }
  }

  /** Parses #state-XX from the URL hash; returns the state abbr if valid and known, otherwise null. Invalid/unknown hashes are ignored. */
  function getHashState() {
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

  /** Pre-written social copy (fixed advocacy text + current share URL). */
  function buildTwitterIntentText() {
    var url = buildShareUrl();
    return "72 Pennsylvania hospitals depend on #340B to fund community care — free prescriptions, cancer screening, rural services. $7.95B reinvested in 2024. See the data: " + url + " #HAP @HAP_Hospitals";
  }

  function buildLinkedInShareText() {
    var url = buildShareUrl();
    return "The 340B drug pricing program helps 72 Pennsylvania hospitals fund free prescriptions, cancer screening, dental care, and rural services. HAP's advocacy dashboard shows where state law stands on contract pharmacy protection and what's at stake. " + url;
  }

  /** mailto: for “Email this page” — subject/body match dashboard share spec (URL includes state hash when selected). */
  function buildEmailMailtoHref() {
    var url = buildShareUrl();
    var subject = "340B advocacy dashboard — PA hospital impact";
    var body = "I wanted to share HAP's 340B advocacy dashboard with you. It shows the impact on Pennsylvania's 72 participating hospitals and where state law stands on contract pharmacy protection: " + url +
      "\n\nQuestions: contact HAP Advocacy at (717) 564-9200 or visit haponline.org/340b";
    return "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function refreshShareDrawerLinks() {
    var xLink = document.getElementById("share-link-x");
    var liLink = document.getElementById("share-link-linkedin");
    var emailLink = document.getElementById("share-link-email");
    if (!xLink || !liLink || !emailLink) return;
    var url = buildShareUrl();
    xLink.setAttribute("href", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(buildTwitterIntentText()));
    liLink.setAttribute("href", "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url));
    emailLink.setAttribute("href", buildEmailMailtoHref());
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

  /** Namespaced localStorage key for print snapshot (enterprise static-site hygiene). Legacy key hap340bPrint still read in print.html. */
  var LS_NAMESPACE = "hap340b";
  var PRINT_VIEW_STORAGE_KEY = LS_NAMESPACE + ":printSnapshot";
  /** Fallback map width (px) when container has no offsetWidth (e.g. before layout). */
  var DEFAULT_MAP_WIDTH_PX = 800;
  /** Wait-for-map: used by openPrintView and downloadPdfAsImage so payload/capture includes the SVG. */
  var WAIT_FOR_MAP_INITIAL_MS = 1200;
  var WAIT_FOR_MAP_INTERVAL_MS = 250;
  var WAIT_FOR_MAP_MAX_ATTEMPTS = 30;
  var PDF_CAPTURE_TIMEOUT_MS = 18000;
  /** Fallback Y ratios (canvas height) when DOM landmarks are missing — ordered: after intro ~HAP, ~map, ~KPI. */
  var PDF_SLICE_FALLBACK_Y1 = 0.32;
  var PDF_SLICE_FALLBACK_Y2 = 0.58;
  var PDF_SLICE_FALLBACK_Y3 = 0.82;

  /** iOS Safari and many mobile browsers only allow window.open during the user gesture; delayed open after async map prep is treated as a popup and blocked. */
  function isMobileOrTabletBrowser() {
    var ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    if (/iPhone|iPod|Android/i.test(ua)) return true;
    if (/iPad|Tablet/i.test(ua)) return true;
    /* iPadOS / iOS "Request Desktop Website": UA looks like Mac, but touch points > 0 (real Macs report 0 in Safari). */
    if (typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0 && /Macintosh|Mac OS X/i.test(ua)) return true;
    try {
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return true;
    } catch (e) { /* ignore */ }
    /* Added-to-home-screen Web App on iOS */
    if (typeof navigator.standalone === "boolean" && navigator.standalone === true) return true;
    return false;
  }

  /** jsPDF 2.x UMD exposes the constructor as jspdf.jsPDF (and often jspdf.default). Never use the module object as a constructor. */
  function resolveJsPdfConstructor() {
    var w = typeof window !== "undefined" ? window : null;
    if (!w) return null;
    if (typeof w.jsPDF === "function") return w.jsPDF;
    var root = w.jspdf;
    if (!root) return null;
    if (typeof root.jsPDF === "function") return root.jsPDF;
    if (root.default && typeof root.default === "function") return root.default;
    if (typeof root === "function") return root;
    return null;
  }

  /** html2canvas UMD sets globalThis.html2canvas; some bundles use .default */
  function resolveHtml2canvas() {
    var w = typeof window !== "undefined" ? window : null;
    if (!w) return null;
    if (typeof w.html2canvas === "function") return w.html2canvas;
    if (w.html2canvas && typeof w.html2canvas.default === "function") return w.html2canvas.default;
    return null;
  }

  function resolveAppUrl(relativePath) {
    try {
      return new URL(relativePath, window.location.href).href;
    } catch (e) {
      return relativePath;
    }
  }

  /** Tooltip vertical offset (px) below cursor for map hover. */
  var TOOLTIP_OFFSET_Y = 14;
  /** Tooltip vertical offset (px) above cursor for state chip hover. */
  var TOOLTIP_OFFSET_CHIP_Y = -12;
  /** Minimum map width change (px) before redraw on resize. */
  var RESIZE_WIDTH_THRESHOLD_PX = 40;
  /** Debounce delay (ms) for resize handler. */
  var RESIZE_DEBOUNCE_MS = 300;
  /** Minimum inset (px) from viewport edges when positioning tooltips. */
  var TOOLTIP_VIEWPORT_INSET_PX = 12;
  /** How long (ms) to show utility status messages (e.g. "PDF saved", "Link copied") before clearing. */
  var UTILITY_STATUS_DISMISS_MS = 2000;
  /** Default delay (ms) for showTemporaryUtilityStatus when none specified. */
  var UTILITY_STATUS_DEFAULT_MS = 2500;
  /** Max height (px) for tallest bar in adoptions chart. */
  var CHART_BAR_MAX_HEIGHT_PX = 80;

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

  function getPaDistrictMapSvgString() {
    var svg = document.querySelector("#pa-district-map svg");
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
    var kpiOversight = "179";
    var kpiPA = "72";
    var drugEl = document.querySelector(".kpi-card--market .kpi-value");
    var benefitEl = document.querySelector(".kpi-card--benefit .kpi-value");
    var oversightEl = document.querySelector(".kpi-card--oversight .kpi-value");
    var paEl = document.querySelector(".kpi-card--pa .kpi-value");
    if (drugEl) kpiDrug = drugEl.textContent.trim();
    if (benefitEl) kpiBenefit = benefitEl.textContent.trim();
    if (oversightEl) kpiOversight = oversightEl.textContent.trim();
    if (paEl) kpiPA = paEl.textContent.trim();

    var dataFreshness = "Data as of " + (config.dataFreshness || "March 2025") + " - Last updated " + (config.lastUpdated || "March 2025");
    if (appState.dom.dataFreshness) {
      dataFreshness = appState.dom.dataFreshness.textContent;
    }

    var landscapeValue = protectionCount + " states have enacted contract pharmacy protection; " + noProtectionCount + " remain without enacted protection";

    return {
      selectionTitle: selectionTitle,
      selectionText: selectionText,
      landscapeValue: landscapeValue,
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

  /* ==================================================
     PRINT PREPARATION (PROTECTED)
     ==================================================
     ⚠ DO NOT MODIFY
     This section controls the Print/PDF system and must remain unchanged.
     Changes here can break the print pipeline and PDF output.
     Key: hap340b:printSnapshot in localStorage; print.html reads it (and legacy hap340bPrint).
     */
  // Assembles the full print view payload (summary, KPIs, map SVG) for print.html to read from localStorage (new tab cannot read sessionStorage).
  function getPrintViewPayload() {
    var summary = gatherPrintPayloadSummaryAndKpis();
    var mapSvg = getMapSvgString();
    var paDistrictMapSvg = getPaDistrictMapSvgString();
    return {
      payloadVersion: 1,
      mapSvg: mapSvg,
      paDistrictMapSvg: paDistrictMapSvg,
      mapSvgFallback: !mapSvg || mapSvg.length < 100,
      selectionTitle: summary.selectionTitle,
      selectionText: summary.selectionText,
      mapHeroSub: (config.copy && config.copy.mapHeroSub) || "",
      landscapeValue: summary.landscapeValue || "",
      protectionCount: summary.protectionCount,
      noProtectionCount: summary.noProtectionCount,
      statesWithList: summary.statesWithList,
      statesWithoutList: summary.statesWithoutList,
      kpiDrug: summary.kpiDrug,
      kpiBenefit: summary.kpiBenefit,
      kpiOversight: summary.kpiOversight,
      kpiPA: summary.kpiPA,
      dataFreshness: summary.dataFreshness,
      methodologyDate: config.lastUpdated || "March 2026"
    };
  }

  // Opens the print view and injects the map and snapshot data from localStorage so the user can save as PDF from the browser.
  // Mobile/tablet: same-tab navigation (reliable localStorage + no popup). Desktop: new tab when allowed.
  // options.fromPdfImage: opened from "Download PDF (image)" on mobile — print.html shows tailored steps (canvas PDF stalls on iOS).
  function openPrintView(options) {
    options = options || {};
    var fromPdfImage = !!options.fromPdfImage;
    setUtilityStatus(fromPdfImage ? "Preparing your PDF page…" : "Preparing print view...");
    // Finalize so the captured page shows 7%, 72, etc., not 0 or half-animated values.
    finalizeCountUpValues();
    preparePrintSelectionState();
    runTaskSafely("show map for print", showMapWrapImmediately);
    revealAllAnimatedSections();

    runTaskSafely("draw map for print view", drawMap);

    function doOpen() {
      var payload = getPrintViewPayload();
      var payloadId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
      var canUseLocal = true;
      try {
        localStorage.setItem(PRINT_VIEW_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        canUseLocal = false;
      }
      // Desktop fallback channel: print tab can read payload from opener cache.
      try {
        window.__hapPrintPayloadCache = window.__hapPrintPayloadCache || {};
        window.__hapPrintPayloadCache[payloadId] = payload;
      } catch (e2) { /* ignore */ }
      // Same-tab/mobile fallback channel.
      try {
        sessionStorage.setItem(PRINT_VIEW_STORAGE_KEY + ":" + payloadId, JSON.stringify(payload));
      } catch (e3) { /* ignore */ }
      var printQs = "auto=1" + (fromPdfImage ? "&from=pdfimage" : "");
      printQs += "&pid=" + encodeURIComponent(payloadId);
      var printUrl = resolveAppUrl("print.html?" + printQs);
      if (!canUseLocal) {
        setUtilityStatus("Opening print view with fallback transport…");
      }
      if (isMobileOrTabletBrowser()) {
        window.location.assign(printUrl);
        return;
      }
      var printWin = window.open(printUrl, "_blank");
      if (printWin) {
        setUtilityStatus("Print view opened. Use the browser print dialog to save as PDF.");
      } else {
        window.location.assign(printUrl);
        return;
      }
      setTimeout(function () {
        setUtilityStatus("");
      }, 4000);
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
    var mapSection = appState.dom.stateLawsSection;

    if (!mapSection) return;

    mapSection.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start"
    });
  }

  /* ==================================================
     STATE SELECTION LOGIC
     ==================================================
     Handles selectState(), clearSelection(), renderStateDetail().
     Updates map highlight, state list, detail panel.
     */

  function renderEmptyStateDetail() {
    var panel = appState.dom.stateDetailPanel;

    if (!panel) return;

    panel.classList.add("empty");
    clearElement(panel);
    panel.appendChild(
      createElement(
        "p",
        "",
        "No state selected yet. Pick a state on the map or from the lists to see protection status and notes."
      )
    );
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
    appendStateFiscalContext(panel, abbr, data);
    panel.appendChild(createElement("p", "state-detail-impact", buildStateImpactNote(abbr, data)));
  }

  function updateNavCurrent(activeId) {
    if (appState.lastNavActiveId === activeId) return;
    appState.lastNavActiveId = activeId;

    var navLinks = appState.dom.navLinks;
    var policySections = ["oversight", "pa-impact", "community-benefit", "access", "pa-safeguards", "policy-milestones"];

    if (!navLinks || !navLinks.length) return;
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var hash = href.indexOf("#") === 0 ? href.slice(1) : "";
      var isActive =
        hash === activeId ||
        (activeId === "section-overview" && (hash === "what-is-340b" || hash === "section-overview")) ||
        (activeId === "overview" && hash === "overview") ||
        (href === "#policy" && policySections.indexOf(activeId) >= 0);
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
    refreshShareDrawerLinks();
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

    refreshShareDrawerLinks();
  }

  /* ---------- Tooltip helpers ---------- */

  /** Keeps tooltip within viewport by clamping left/top to a minimum inset from edges. */
  function clampTooltip(tooltip, left, top) {
    var maxLeft = window.innerWidth - tooltip.offsetWidth - TOOLTIP_VIEWPORT_INSET_PX;
    var maxTop = window.innerHeight - tooltip.offsetHeight - TOOLTIP_VIEWPORT_INSET_PX;

    tooltip.style.left = Math.max(TOOLTIP_VIEWPORT_INSET_PX, Math.min(left, maxLeft)) + "px";
    tooltip.style.top = Math.max(TOOLTIP_VIEWPORT_INSET_PX, Math.min(top, maxTop)) + "px";
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

  /**
   * State hover/detail for map and list chips. Uses createElement and textContent only.
   * @param {{ useBadges?: boolean }} options useBadges: compact badges for list chips; false = multi-line map tooltip
   */
  function fillStateTooltip(tooltip, abbr, options) {
    options = options || {};
    var useBadges = !!options.useBadges;
    var data = getStateData(abbr);

    clearElement(tooltip);
    tooltip.appendChild(createElement("strong", "", getStateName(abbr) || abbr));

    if (!data) return;

    if (useBadges) {
      tooltip.appendChild(document.createTextNode(" "));
      appendBadge(tooltip, data.cp ? "yes" : "no", "CP: " + (data.cp ? "Yes" : "No"));
      appendBadge(tooltip, data.pbm ? "yes" : "no", "PBM: " + (data.pbm ? "Yes" : "No"));
      if (data.y) tooltip.appendChild(createElement("div", "", "Year: " + data.y));
      if (data.notes) tooltip.appendChild(createElement("div", "", data.notes));
      return;
    }

    tooltip.appendChild(createElement("div", "map-tooltip-line", data.cp
      ? "Contract pharmacy: state protection law enacted"
      : "Contract pharmacy: no enacted state protection yet"));
    tooltip.appendChild(createElement("div", "map-tooltip-line", "PBM-related state law: " + (data.pbm ? "Yes" : "No")));
    if (data.y) tooltip.appendChild(createElement("div", "map-tooltip-line", "Law year (tracked): " + data.y));
    if (data.notes) tooltip.appendChild(createElement("div", "map-tooltip-line", data.notes));
  }

  function buildMapTooltip(tooltip, abbr) {
    fillStateTooltip(tooltip, abbr, { useBadges: false });
  }

  function buildStateChipTooltip(tooltip, abbr) {
    fillStateTooltip(tooltip, abbr, { useBadges: true });
  }

  /* ==================================================
     MAP INITIALIZATION & LIFECYCLE
     ==================================================
     Draws US map from TopoJSON; handles resize, click, tooltips.
     Do not add overflow:hidden to .map-wrap or .us-map-wrap.
     */

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

  function showMapInteractiveUI() {
    if (appState.dom.mapInteractiveWrap) appState.dom.mapInteractiveWrap.style.display = "";
    if (appState.dom.mapStaticFallback) appState.dom.mapStaticFallback.style.display = "none";
  }

  function showMapStaticFallbackUI() {
    if (appState.dom.mapInteractiveWrap) appState.dom.mapInteractiveWrap.style.display = "none";
    if (appState.dom.mapStaticFallback) appState.dom.mapStaticFallback.style.display = "block";
    if (appState.dom.mapSkeleton) appState.dom.mapSkeleton.classList.add("hidden");
    setMapBusy(false);
    if (appState.dom.mapWrap) appState.dom.mapWrap.setAttribute("aria-busy", "false");
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
    // If the interactive SVG map cannot render (missing d3/topojson, runtime error, etc.),
    // show the static fallback grid so users still get the state protection overview.
    if (appState.mapFallbackTimer) {
      window.clearTimeout(appState.mapFallbackTimer);
      appState.mapFallbackTimer = null;
    }

    if (appState.dom.mapContainer) {
      clearElement(appState.dom.mapContainer);
    }
    showMapStaticFallbackUI();
  }

  function bindMapEvents() {
    if (!appState.mapPaths || !appState.dom.mapTooltip) return;

    appState.mapPaths
      .on("mouseenter", function (event, feature) {
        if (!appState.hoverCapable) return;
        buildMapTooltip(appState.dom.mapTooltip, getStateAbbr(feature));
        showTooltip(appState.dom.mapTooltip, event.clientX, event.clientY + TOOLTIP_OFFSET_Y);
      })
      .on("mousemove", function (event) {
        if (!appState.hoverCapable) return;
        clampTooltip(appState.dom.mapTooltip, event.clientX, event.clientY + TOOLTIP_OFFSET_Y);
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
      var stData = getStateData(abbr);
      var cpLine = stData && stData.cp ? "contract pharmacy protection enacted" : "no enacted contract pharmacy protection";
      path.setAttribute("aria-label", getStateName(abbr) + ": " + cpLine + ". Press Enter or Space to select.");

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

    // Static fallback: if the interactive SVG map doesn't render within ~3s,
    // switch to a pre-colored 50-state grid so the page stays usable.
    if (appState.dom.mapInteractiveWrap && appState.dom.mapStaticFallback) {
      if (appState.mapFallbackTimer) window.clearTimeout(appState.mapFallbackTimer);
      showMapInteractiveUI();
      appState.mapFallbackTimer = window.setTimeout(function () {
        var usMap = document.getElementById("us-map");
        var svg = usMap ? usMap.querySelector("svg") : null;
        var hasAnyChildren = !!(usMap && usMap.children && usMap.children.length);

        // Fallback trigger:
        // - no rendered children inside the interactive map container, OR
        // - the map is still showing the "Loading map..." skeleton.
        var stillLoading = false;
        if (appState.dom.mapSkeleton) {
          var loadingText = appState.dom.mapSkeleton.querySelector(".map-loading-text");
          var loadingLabel = loadingText && loadingText.textContent ? String(loadingText.textContent) : "";
          stillLoading = !appState.dom.mapSkeleton.classList.contains("hidden") && /loading map/i.test(loadingLabel);
        }

        if (!hasAnyChildren || !svg || stillLoading) showMapStaticFallbackUI();
      }, 3000);
    }

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
    /* Sort states left-to-right by centroid X so the domino animation flows west-to-east. */
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
    if (appState.mapFallbackTimer) {
      window.clearTimeout(appState.mapFallbackTimer);
      appState.mapFallbackTimer = null;
    }
    showMapInteractiveUI();
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
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-controls", "state-detail-panel");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "View details for " + getStateName(abbr));
    button.addEventListener("click", function () {
      selectState(abbr, { focusPanel: true });
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
    if (appState.dom.keyFindingNoCount) appState.dom.keyFindingNoCount.textContent = String(withoutProtection.length);
    if (appState.dom.noProtectionCount) appState.dom.noProtectionCount.textContent = String(withoutProtection.length);
    buildPrintStateSummary(withProtection, withoutProtection);
    updateExecutiveProofStrip(withProtection, withoutProtection);

    initStateChipTooltips();
    highlightStateChip(appState.selectedStateAbbr);
    applyStateFilter();
  }

  /** Sets PA as temporary print-only selection when none exists, so the print view shows a state panel instead of empty. Does not update URL hash. */
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
        showTooltip(appState.dom.chipTooltip, event.clientX, event.clientY + TOOLTIP_OFFSET_CHIP_Y);
      });

      chip.addEventListener("mousemove", function (event) {
        clampTooltip(appState.dom.chipTooltip, event.clientX, event.clientY + TOOLTIP_OFFSET_CHIP_Y);
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

  /* === FILTER INIT ===
     applyStateFilter: show/hide state chips by protection status.
     initStateFilter: wire filter buttons and select to syncFilterToUI.
     */
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

    if (visibleCount === 0) {
      setFilterStatus("No states match this filter. Choose All to show every state.");
    }
    else if (appState.currentFilter === "all") setFilterStatus("Showing all states.");
    else setFilterStatus("Showing " + visibleCount + " states in this view.");
  }

  function initStateFilter() {
    var filterButtons = appState.dom.filterButtons;
    var filterSelect = appState.dom.filterSelect;

    if (!filterButtons || !filterButtons.length) return;
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
    var topicInsurance = getCssVariable("--chart-topic-insurance", "#0b67c2");
    container.textContent = "";
    container.setAttribute("aria-label", "Bar chart: " + arr.map(function (d) { return d.year + " " + d.count + " states"; }).join(", "));
    arr.forEach(function (d) {
      var bar = document.createElement("div");
      bar.className = "adoptions-chart-bar";
      var pct = maxCount > 0 ? (d.count / maxCount) * CHART_BAR_MAX_HEIGHT_PX : 0;
      bar.style.height = Math.max(4, pct) + "px";
      bar.style.background = "linear-gradient(180deg, " + topicInsurance + ", " + topicInsurance + "cc)";
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
    window.setTimeout(function () { setUtilityStatus(""); }, UTILITY_STATUS_DISMISS_MS);
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
    setTimeout(function () { setUtilityStatus(""); }, UTILITY_STATUS_DISMISS_MS);
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
    setTimeout(function () { setUtilityStatus(""); }, UTILITY_STATUS_DISMISS_MS);
  }

  function initDatasetDownload() {
    var btnCsv = document.getElementById("btn-download-csv");
    var btnJson = document.getElementById("btn-download-json");
    if (btnCsv) btnCsv.addEventListener("click", function () { runTaskSafely("download csv", downloadDatasetAsCsv); });
    if (btnJson) btnJson.addEventListener("click", function () { runTaskSafely("download json", downloadDatasetAsJson); });
  }

  /* ==================================================
     PDF IMAGE EXPORT
     ==================================================
     4-page A4 PDF via html2canvas + jsPDF (avoids squashing tall pre-map content).
     Page 1: intro / What is 340B (#section-overview). Page 2: HAP position + key findings + executive strip.
     Page 3: State map (#state-laws). Page 4: KPI strip through end (fitWidth crop if needed).
     */
  function downloadPdfAsImage() {
    /* Phones/tablets: html2canvas + jsPDF often hangs or OOMs on iOS Safari — same flow as Print / PDF (print-ready page + Save as PDF). */
    if (isMobileOrTabletBrowser()) {
      setUtilityStatus("Opening print-ready page — same as Print / PDF. Tap the blue button, then Save as PDF.");
      setTimeout(function () { setUtilityStatus(""); }, 6500);
      openPrintView({ fromPdfImage: true });
      return;
    }
    var html2canvasLib = resolveHtml2canvas();
    var jsPDFLib = resolveJsPdfConstructor();
    if (!html2canvasLib || typeof jsPDFLib !== "function") {
      setUtilityStatus("Opening print-ready page — use Save as PDF (canvas libraries unavailable).");
      setTimeout(function () { setUtilityStatus(""); }, 5000);
      openPrintView({ fromPdfImage: true });
      return;
    }
    var lowMemCapture = false;
    try {
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) lowMemCapture = true;
    } catch (e0) { /* ignore */ }
    preparePrintSelectionState();
    runTaskSafely("reveal for pdf", revealAllAnimatedSections);
    runTaskSafely("show map for pdf", showMapWrapImmediately);
    runTaskSafely("draw map for pdf", drawMap);
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
      pdfStyleEl.textContent = "body.pdf-capture #pdf-capture-root { max-width: 794px; margin-left: auto; margin-right: auto; width: 100%; padding: 0.6rem 0.85rem !important; padding-top: 0 !important; margin-top: 0 !important; } " +
        "body.pdf-capture .dashboard-header, body.pdf-capture .hap-sidebar--340b, body.pdf-capture .utility-toolbar, body.pdf-capture .site-footer { display: none !important; } " +
        "body.pdf-capture .hap-body > .hap-page-content { margin-left: 0 !important; width: 100% !important; } " +
        "body.pdf-capture .hap-body { display: block !important; } " +
        "body.pdf-capture #leave-behind-sheet { display: none !important; } " +
        "body.pdf-capture .methodology-wrap, body.pdf-capture details#methodology-wrap, body.pdf-capture .methodology-content, body.pdf-capture .methodology-sources-header, body.pdf-capture .source-links, body.pdf-capture .methodology-toggle { display: none !important; } " +
        "body.pdf-capture .print-sources, body.pdf-capture .sources, body.pdf-capture #sources-summary { display: none !important; } " +
        "body.pdf-capture .stat-verified { display: none !important; } " +
        "body.pdf-capture #executive-summary { margin-top: 0 !important; } " +
        "body.pdf-capture .hero-kpi-banner { padding: 0.65rem 0.85rem !important; } " +
        "body.pdf-capture .hero-kpi-banner__kicker { font-size: 0.78rem !important; line-height: 1.25 !important; margin-bottom: 0.45rem !important; } " +
        "body.pdf-capture .exec-summary-mega-strip { gap: 0.45rem !important; } " +
        "body.pdf-capture .exec-summary-mega { padding: 0.6rem 0.7rem !important; min-height: 0 !important; min-width: 0 !important; overflow: visible !important; } " +
        "body.pdf-capture .exec-summary-mega__eyebrow { font-size: 0.62rem !important; margin-bottom: 0.25rem !important; } " +
        "body.pdf-capture .exec-summary-mega__value { font-size: 2rem !important; line-height: 1.05 !important; margin: 0 !important; } " +
        "body.pdf-capture .exec-summary-mega--finance .exec-summary-mega__value { font-size: 1.9rem !important; } " +
        "body.pdf-capture .exec-summary-mega__unit { font-size: 0.74rem !important; margin: 0.25rem 0 0 !important; } " +
        "body.pdf-capture .exec-summary-mega__impact { font-size: 0.72rem !important; line-height: 1.35 !important; padding-top: 0.45rem !important; margin-top: 0.45rem !important; } " +
        "body.pdf-capture .exec-summary-mega-trend-note { margin-top: 0.45rem !important; font-size: 0.78rem !important; line-height: 1.25 !important; } " +
        "body.pdf-capture .intro-section { padding: 0.4rem 0; margin-top: 0 !important; padding-top: 0 !important; margin-bottom: 0.5rem; } " +
        "body.pdf-capture .intro-section .card { padding: 0.7rem 1rem; margin-bottom: 0.65rem; } " +
        "body.pdf-capture .intro-section .card h2 { font-size: 1.05rem; line-height: 1.25; } " +
        "body.pdf-capture .intro-section .card p, body.pdf-capture .intro-section .stat-block { font-size: 0.82rem; } " +
        "body.pdf-capture .hap-position-flagship { padding: 0.35rem 0 !important; margin: 0.4rem 0 0.5rem !important; } " +
        "body.pdf-capture .hap-position-flagship::before { display: none; } " +
        "body.pdf-capture .hap-position-flagship .card { padding: 0.7rem 1rem; } " +
        "body.pdf-capture .hap-position-flagship .hap-ask-list { gap: 0.35rem; } " +
        "body.pdf-capture .hap-position-flagship .hap-ask-item { padding: 0.45rem 0.55rem; } " +
        "body.pdf-capture .exec-takeaway { margin: 0.5rem 0; padding: 0.55rem 0.85rem; font-size: 0.82rem; line-height: 1.35; } " +
        "body.pdf-capture .key-finding-next-line { display: block !important; margin-top: 0.2rem !important; } " +
        "body.pdf-capture .key-findings-strip { margin: 0.6rem 0 0.5rem; padding: 0.85rem 1.15rem; } " +
        "body.pdf-capture .key-findings-strip .key-findings-heading { margin-bottom: 0.5rem; } " +
        "body.pdf-capture .key-findings-strip .key-findings-icon { width: 32px !important; height: 32px !important; } " +
        "body.pdf-capture .key-findings-strip .key-findings-icon svg { width: 28px !important; height: 28px !important; } " +
        "body.pdf-capture .key-findings-strip .key-findings-title { font-size: 1.05rem !important; margin: 0; } " +
        "body.pdf-capture .key-findings-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 0.45rem !important; } " +
        "body.pdf-capture .key-finding-card { padding: 0.5rem 0.55rem !important; } " +
        "body.pdf-capture .key-finding-value.ban-stat { font-size: 1.35rem !important; } " +
        "body.pdf-capture .key-finding-impact { font-size: 0.72rem !important; padding-top: 0.35rem !important; } " +
        "body.pdf-capture .executive-proof-strip { margin: 0.55rem 0; padding: 0.5rem 0; } " +
        "body.pdf-capture .executive-proof-strip .executive-proof-card { padding: 0.55rem 0.75rem; margin-bottom: 0.5rem; } " +
        "body.pdf-capture .executive-proof-strip h3 { font-size: 0.9rem; line-height: 1.3; } " +
        "body.pdf-capture .executive-proof-strip p { font-size: 0.8rem; } " +
        "body.pdf-capture #state-laws { margin-top: 0.6rem; margin-bottom: 1rem; padding: 0 0.25rem; } " +
        "body.pdf-capture .map-wrap, body.pdf-capture .us-map-wrap { overflow: visible !important; opacity: 1 !important; } " +
        "body.pdf-capture .us-map-wrap.visible, body.pdf-capture .us-map-wrap.map-visible { opacity: 1 !important; } " +
        "body.pdf-capture #state-lists-wrap { display: none !important; } " +
        "body.pdf-capture .data-freshness { display: none !important; } " +
        "body.pdf-capture .kpi-strip { margin-top: 1.25rem; margin-bottom: 1rem; padding: 0.6rem 0.5rem; font-size: 0.65em; } " +
        "body.pdf-capture .kpi-strip .kpi-card { padding: 0.4em 0.5em; } " +
        "body.pdf-capture .supporting-section { margin-top: 1.25rem; margin-bottom: 1rem; font-size: 0.9em; line-height: 1.3; padding: 0 0.15rem; } " +
        "body.pdf-capture .supporting-section .section-subhead { font-size: 1.05rem !important; font-weight: 700 !important; margin-bottom: 0.6rem !important; padding: 0.2rem 0 !important; letter-spacing: 0.04em; text-transform: uppercase; } " +
        "body.pdf-capture .supporting-cards-row { gap: 0.6rem; } " +
        "body.pdf-capture .supporting-section .card--compact { padding: 0.5em 0.65em !important; margin-bottom: 0.5rem; } " +
        "body.pdf-capture .supporting-section .card-heading h2 { font-size: 1rem !important; margin: 0 0 0.25rem !important; } " +
        "body.pdf-capture .supporting-section .card-title { font-size: 0.95rem !important; font-weight: 600; } " +
        "body.pdf-capture .supporting-section .card-icon { width: 50px !important; height: 50px !important; } " +
        "body.pdf-capture .supporting-section .card-icon svg { width: 29px !important; height: 29px !important; } " +
        "body.pdf-capture .supporting-section p { margin: 0.2em 0; font-size: 0.9rem; } " +
        "body.pdf-capture .supporting-section ul { margin: 0.2em 0; padding-left: 1rem; } " +
        "body.pdf-capture .supporting-section li { margin-bottom: 0.15em; font-size: 0.9rem; } " +
        "body.pdf-capture .supporting-section .stat-block { margin-top: 0.35rem; gap: 0.4rem; } " +
        "body.pdf-capture .supporting-section .stat { padding: 0.35em 0.45em; } " +
        "body.pdf-capture .supporting-section .stat-label { font-size: 0.6rem !important; font-weight: 600; } " +
        "body.pdf-capture .supporting-section .stat-value { font-size: 0.8rem !important; font-weight: 700; } " +
        "body.pdf-capture .supporting-section .stat-desc { font-size: 0.56rem !important; } " +
        "body.pdf-capture .supporting-section { margin-bottom: 1.5rem; } " +
        "body.pdf-capture #community-benefit { margin-top: 0.8rem; margin-bottom: 0.5rem; padding: 0.4rem 0.65rem !important; font-size: 0.81em; line-height: 1.28; overflow: visible !important; } " +
        "body.pdf-capture #community-benefit .card-heading h2 { font-size: 0.9rem !important; } " +
        "body.pdf-capture #community-benefit .card-title { font-size: 0.86rem !important; font-weight: 600; } " +
        "body.pdf-capture #community-benefit .benefit-grid--community { gap: 0.35rem !important; } " +
        "body.pdf-capture #community-benefit .benefit-item { flex-direction: column !important; align-items: center !important; text-align: center !important; padding: 0.4em 0.35em !important; } " +
        "body.pdf-capture #community-benefit .benefit-item-icon { width: 48px !important; height: 48px !important; } " +
        "body.pdf-capture #community-benefit .benefit-item-icon svg { width: 26px !important; height: 26px !important; } " +
        "body.pdf-capture #community-benefit .benefit-item-text { font-size: 0.78rem !important; line-height: 1.35 !important; display: block !important; overflow: visible !important; -webkit-line-clamp: unset !important; max-width: none !important; } " +
        "body.pdf-capture .community-benefit-hero { padding: 0.45rem 0.65rem !important; margin-top: 0.32rem !important; overflow: visible !important; min-height: auto !important; border-radius: 6px; } " +
        "body.pdf-capture .community-benefit-hero .big-stat-label { margin: 0 0 0.15rem !important; font-size: 0.86rem !important; font-weight: 600; } " +
        "body.pdf-capture .community-benefit-hero .big-stat-value { margin: 0 !important; font-size: 1.35rem !important; font-weight: 700; } " +
        "body.pdf-capture .community-benefit-hero .big-stat-desc { margin: 0.15rem 0 0 !important; font-size: 0.81rem !important; } " +
        "body.pdf-capture #community-benefit { content-visibility: visible !important; contain: none !important; } " +
        "body.pdf-capture #access { display: none !important; } " +
        "body.pdf-capture #pa-safeguards { display: none !important; } " +
        "body.pdf-capture .pa-impact-mode-section, body.pdf-capture .impact-simulator-section { display: none !important; } ";
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
    function pdfFinishDelivery(pdf) {
      if (appState.printAppliedDefaultSelection) {
        clearSelection("", { updateHash: false, announce: false });
        appState.printAppliedDefaultSelection = false;
      }
      function done(msg, ms) {
        setUtilityStatus(msg);
        setTimeout(function () { setUtilityStatus(""); }, ms || 2500);
      }
      /** Same-tab delivery: no window.open — Share sheet on iOS, else programmatic download link, else jsPDF save. */
      function deliverWithAnchorThenSave() {
        try {
          var dlBlob = pdf.output("blob");
          var dlUrl = URL.createObjectURL(dlBlob);
          var a = document.createElement("a");
          a.href = dlUrl;
          a.download = "340b-dashboard.pdf";
          a.setAttribute("download", "340b-dashboard.pdf");
          a.rel = "noopener";
          a.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0";
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            try {
              if (a.parentNode) a.parentNode.removeChild(a);
            } catch (rm) { /* ignore */ }
            try {
              URL.revokeObjectURL(dlUrl);
            } catch (rev) { /* ignore */ }
          }, 3000);
          done("Opening PDF — use Share → Save to Files if needed.", 5000);
        } catch (eA) {
          try {
            pdf.save("340b-dashboard.pdf");
            done("PDF saved.", 2500);
          } catch (eSave) {
            done("PDF capture failed. Try Print / PDF instead.", 4000);
          }
        }
      }
      try {
        if (lowMemCapture && typeof navigator.share === "function" && typeof File !== "undefined") {
          try {
            var shareBlob = pdf.output("blob");
            var shareFile = new File([shareBlob], "340b-dashboard.pdf", { type: "application/pdf" });
            var filesShareable = !navigator.canShare || navigator.canShare({ files: [shareFile] });
            if (filesShareable) {
              navigator.share({ files: [shareFile], title: "340B Dashboard" })
                .then(function () {
                  done("Use Save to Files if you want a copy on your device.", 4500);
                })
                .catch(function () {
                  deliverWithAnchorThenSave();
                });
              return;
            }
          } catch (se) { /* fall through */ }
        }
        if (lowMemCapture) {
          deliverWithAnchorThenSave();
          return;
        }
        pdf.save("340b-dashboard.pdf");
        done("PDF saved.", 2500);
      } catch (delErr) {
        try {
          pdf.save("340b-dashboard.pdf");
          done("PDF saved.", 2500);
        } catch (eSave) {
          done("PDF capture failed. Try Print / PDF instead.", 4000);
        }
      }
    }
    function capture() {
      injectPdfStyle();
      document.body.classList.add("pdf-capture");
      // Finalize so the captured page shows 7%, 72, etc., not 0 or half-animated values.
      finalizeCountUpValues();
      var maxCanvasSide = 7500;
      var sh = Math.max(target.scrollHeight || 0, 1);
      var sw = Math.max(target.scrollWidth || 0, 1);
      var captureScale = lowMemCapture ? 1 : 2;
      captureScale = Math.min(captureScale, maxCanvasSide / sh, maxCanvasSide / sw);
      if (captureScale < 0.35) captureScale = 0.35;
      var captureTimeoutMs = lowMemCapture ? Math.max(PDF_CAPTURE_TIMEOUT_MS, 90000) : PDF_CAPTURE_TIMEOUT_MS;
      var h2cOpts = {
        scale: captureScale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        foreignObjectRendering: !lowMemCapture,
        onclone: function (clonedDoc) {
          try {
            var clonedRoot = clonedDoc.getElementById("pdf-capture-root") || clonedDoc.body;
            if (!clonedRoot) return;
            clonedRoot.querySelectorAll("picture").forEach(function (pic) {
              var img = pic.querySelector("img");
              if (!img || !img.getAttribute("src")) return;
              var single = clonedDoc.createElement("img");
              single.setAttribute("src", img.getAttribute("src"));
              single.setAttribute("alt", img.getAttribute("alt") || "");
              single.setAttribute("width", img.getAttribute("width") || "40");
              single.setAttribute("height", img.getAttribute("height") || "40");
              single.setAttribute("loading", "eager");
              single.className = img.className;
              pic.replaceWith(single);
            });
          } catch (cloneErr) {
            /* ignore — html2canvas still runs */
          }
        }
      };
      if (lowMemCapture) {
        h2cOpts.foreignObjectRendering = false;
      }
      var capturePromise = html2canvasLib(target, h2cOpts);
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error("timeout")); }, captureTimeoutMs);
      });
      Promise.race([capturePromise, timeoutPromise]).then(function (canvas) {
        function failPdfCleanup() {
          restoreMapSvg();
          removePdfStyle();
          if (appState.printAppliedDefaultSelection) {
            clearSelection("", { updateHash: false, announce: false });
            appState.printAppliedDefaultSelection = false;
          }
          setUtilityStatus("PDF capture failed. Try Print / PDF instead.");
          setTimeout(function () { setUtilityStatus(""); }, 3000);
        }
        if (!canvas || typeof canvas.getContext !== "function" || canvas.width < 1 || canvas.height < 1) {
          failPdfCleanup();
          return;
        }
        var scale = captureScale;
        var mainRect = target.getBoundingClientRect();
        var overviewHapEl = document.getElementById("overview");
        var stateLawsEl = document.getElementById("state-laws");
        var kpiStripEl = document.querySelector(".kpi-strip");
        var ch = canvas.height;
        function landmarkSliceY(el, fallbackRatio) {
          if (!el) return Math.round(ch * fallbackRatio);
          var raw = (el.getBoundingClientRect().top - mainRect.top) * scale;
          if (!isFinite(raw)) return Math.round(ch * fallbackRatio);
          return Math.max(0, Math.min(ch, Math.round(raw)));
        }
        var y1 = landmarkSliceY(overviewHapEl, PDF_SLICE_FALLBACK_Y1);
        var y2 = landmarkSliceY(stateLawsEl, PDF_SLICE_FALLBACK_Y2);
        var y3 = landmarkSliceY(kpiStripEl, PDF_SLICE_FALLBACK_Y3);
        y1 = Math.min(Math.max(0, y1), ch);
        y2 = Math.min(Math.max(y1, y2), ch);
        y3 = Math.min(Math.max(y2, y3), ch);
        if (y2 <= y1) y2 = Math.min(ch, y1 + Math.round(ch * 0.22));
        if (y3 <= y2) y3 = Math.min(ch, y2 + Math.round(ch * 0.18));
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
            var useJpegSlices = lowMemCapture;
            var imgData = useJpegSlices
              ? drawCanvas.toDataURL("image/jpeg", 0.85)
              : drawCanvas.toDataURL("image/png", 0.95);
            var imgFmt = useJpegSlices ? "JPEG" : "PNG";
            var x = marginMm + (innerW - imgW) / 2;
            var y = opts.topAlign ? marginMm : marginMm + (innerH - imgH) / 2;
            pdf.addImage(imgData, imgFmt, x, y, imgW, imgH);
          }
          var sliceDefs = [
            { y0: 0, y1: y1, topAlign: true, fitWidth: false },
            { y0: y1, y1: y2, topAlign: true, fitWidth: false },
            { y0: y2, y1: y3, topAlign: true, fitWidth: false },
            { y0: y3, y1: ch, topAlign: false, fitWidth: true }
          ];
          var firstPdfPage = true;
          var drewAnySlice = false;
          for (var si = 0; si < sliceDefs.length; si++) {
            var def = sliceDefs[si];
            var sliceH = def.y1 - def.y0;
            if (sliceH <= 0) continue;
            if (!firstPdfPage) pdf.addPage();
            firstPdfPage = false;
            var sliceC = document.createElement("canvas");
            sliceC.width = canvas.width;
            sliceC.height = sliceH;
            sliceC.getContext("2d").drawImage(canvas, 0, def.y0, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
            addCanvasSliceWithMargins(sliceC, { topAlign: def.topAlign, fitWidth: def.fitWidth });
            drewAnySlice = true;
          }
          if (!drewAnySlice) {
            addCanvasSliceWithMargins(canvas, { topAlign: true, fitWidth: true });
          }
          pdfFinishDelivery(pdf);
        } catch (e) {
          if (appState.printAppliedDefaultSelection) {
            clearSelection("", { updateHash: false, announce: false });
            appState.printAppliedDefaultSelection = false;
          }
          setUtilityStatus("PDF capture failed. Try Print / PDF instead.");
          setTimeout(function () { setUtilityStatus(""); }, 3000);
        }
      }).catch(function () {
        restoreMapSvg();
        removePdfStyle();
        if (appState.printAppliedDefaultSelection) {
          clearSelection("", { updateHash: false, announce: false });
          appState.printAppliedDefaultSelection = false;
        }
        setUtilityStatus("Canvas PDF failed — opening print-ready page. Use Save as PDF there.");
        setTimeout(function () {
          setUtilityStatus("");
          openPrintView({ fromPdfImage: true });
        }, 600);
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
    var toolbar = document.querySelector(".utility-toolbar");
    if (toolbar) {
      toolbar.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest && ev.target.closest("#btn-download-pdf");
        if (!btn) return;
        ev.preventDefault();
        runTaskSafely("download pdf image", downloadPdfAsImage);
      });
      return;
    }
    var btn = document.getElementById("btn-download-pdf");
    if (!btn) return;
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      runTaskSafely("download pdf image", downloadPdfAsImage);
    });
  }

  function copyTextToClipboard(text, successMessage, dismissMs) {
    var fallbackField;
    var msg = successMessage != null ? successMessage : "Copied!";
    var dismiss = typeof dismissMs === "number" ? dismissMs : UTILITY_STATUS_DISMISS_MS;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () {
          setUtilityStatus(msg);
        })
        .catch(function () {
          fallbackField = createElement("textarea");
          fallbackField.value = text;
          fallbackField.setAttribute("readonly", "readonly");
          fallbackField.setAttribute("aria-hidden", "true");
          fallbackField.style.position = "fixed";
          fallbackField.style.left = "-9999px";
          document.body.appendChild(fallbackField);
          fallbackField.select();

          try {
            if (document.execCommand("copy")) {
              showTemporaryUtilityStatus(msg, dismiss);
            } else {
              window.prompt("Copy:", text);
              showTemporaryUtilityStatus("Copy from the dialog above.", dismiss);
            }
          } catch (error) {
            window.prompt("Copy:", text);
            showTemporaryUtilityStatus("Copy from the dialog above.", dismiss);
          }

          document.body.removeChild(fallbackField);
        });
    } else {
      window.prompt("Copy:", text);
      showTemporaryUtilityStatus("Copy from the dialog above.", dismiss);
    }

    window.setTimeout(function () {
      setUtilityStatus("");
    }, dismiss);
  }

  function setShareDrawerOpen(open) {
    var drawer = document.getElementById("share-drawer");
    var btn = appState.dom.shareButton;
    if (!drawer || !btn) return;
    drawer.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      refreshShareDrawerLinks();
    }
  }

  function initShare() {
    if (!appState.dom.shareButton) return;

    var drawer = document.getElementById("share-drawer");
    var copyLinkBtn = document.getElementById("btn-share-copy-link");
    var liLink = document.getElementById("share-link-linkedin");
    var wrap = document.querySelector(".utility-share-wrap");

    refreshShareDrawerLinks();

    appState.dom.shareButton.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (!drawer) return;
      setShareDrawerOpen(drawer.hidden);
    });

    if (wrap) {
      document.addEventListener("click", function (ev) {
        if (!drawer || drawer.hidden) return;
        if (wrap.contains(ev.target)) return;
        setShareDrawerOpen(false);
      });
    }

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && drawer && !drawer.hidden) {
        setShareDrawerOpen(false);
      }
    });

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        copyTextToClipboard(buildShareUrl(), "✓ Copied!", 2000);
      });
    }

    // LinkedIn share-offsite supports URL only; copy suggested post text for convenience.
    if (liLink) {
      liLink.addEventListener("click", function () {
        copyTextToClipboard(buildLinkedInShareText(), "✓ Copied!", 2000);
      });
    }
  }

  function initMethodologyToggle() {
    if (!appState.dom.methodologyWrap || !appState.dom.methodologyContent) return;

    appState.dom.methodologyWrap.addEventListener("toggle", function () {
      appState.dom.methodologyContent.classList.toggle("open", appState.dom.methodologyWrap.open);
    });
  }

  var KPI_BRIEFING_BANNER_LS = "hap340bKpiBriefingBannerDismissed";

  function initKpiBriefingBanner() {
    var banner = document.getElementById("kpi-briefing-banner");
    var btn = document.getElementById("kpi-briefing-banner-dismiss");

    if (!banner || !btn) return;

    try {
      if (window.localStorage && window.localStorage.getItem(KPI_BRIEFING_BANNER_LS) === "1") {
        banner.hidden = true;
        banner.setAttribute("hidden", "");
        banner.style.display = "none";
      }
    } catch (e) {
      /* ignore */
    }

    btn.addEventListener("click", function () {
      // Use multiple mechanisms so dismissal works even if CSS/layout is odd.
      banner.hidden = true;
      banner.setAttribute("hidden", "");
      banner.style.display = "none";
      try {
        if (window.localStorage) window.localStorage.setItem(KPI_BRIEFING_BANNER_LS, "1");
      } catch (e2) {
        /* ignore */
      }
    });
  }

  function renderExecSummarySparklineInto(container, key) {
    var data = TREND_DATA[key];
    if (!data || !container || !data.values || data.values.length < 2) return;

    var vals = data.values;
    var svgW = 80;
    var svgH = 30;
    var pad = 2;
    var min = Math.min.apply(null, vals);
    var max = Math.max.apply(null, vals);
    var range = max - min || 1;
    var pathParts = [];
    var lastX = 0;
    var lastY = 0;
    var i;
    var x;
    var y;

    for (i = 0; i < vals.length; i++) {
      x = pad + (i / (vals.length - 1)) * (svgW - 2 * pad);
      y = pad + (1 - (vals[i] - min) / range) * (svgH - 2 * pad);
      pathParts.push((i === 0 ? "M " : " L ") + x + "," + y);
      lastX = x;
      lastY = y;
    }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(svgW));
    svg.setAttribute("height", String(svgH));
    svg.setAttribute("viewBox", "0 0 " + svgW + " " + svgH);
    svg.setAttribute("class", "exec-summary-sparkline-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    var pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathEl.setAttribute("d", pathParts.join(""));
    pathEl.setAttribute("fill", "none");
    pathEl.setAttribute("stroke", "var(--hap-brand-primary, #0072bc)");
    pathEl.setAttribute("stroke-width", "1.5");
    pathEl.setAttribute("stroke-linecap", "round");
    pathEl.setAttribute("stroke-linejoin", "round");
    svg.appendChild(pathEl);

    var endDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    endDot.setAttribute("cx", String(lastX));
    endDot.setAttribute("cy", String(lastY));
    endDot.setAttribute("r", "2.5");
    endDot.setAttribute("fill", "var(--hap-brand-primary, #0072bc)");
    svg.appendChild(endDot);

    var label = document.createElement("p");
    label.className = "exec-summary-sparkline-label";
    label.textContent = data.label;

    container.appendChild(svg);
    container.appendChild(label);
  }

  function initExecSummarySparklines() {
    var wraps = document.querySelectorAll(".exec-summary-sparkline-wrap[data-sparkline-key]");
    wraps.forEach(function (wrap) {
      var key = wrap.getAttribute("data-sparkline-key");
      renderExecSummarySparklineInto(wrap, key);
    });
  }

  function initKpiPaIllustrativeTooltip() {
    var host = document.querySelector(".kpi-pa-tooltip-host");
    var btn = document.getElementById("kpi-pa-illustrative-info");
    if (!host || !btn) return;

    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = !host.classList.contains("is-open");
      host.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", function (ev) {
      if (!host.contains(ev.target)) {
        host.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initSelectionControls() {
    if (!appState.dom.selectionClear) return;

    appState.dom.selectionClear.addEventListener("click", function () {
      clearSelection();
    });
  }

  function initHearingPrepPrint() {
    var btn = document.getElementById("hearing-prep-print-btn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      // Print only this FAQ section as a one-page handout.
      document.body.classList.add("print-hearing-prep");
      window.print();
    });

    window.addEventListener("afterprint", function () {
      document.body.classList.remove("print-hearing-prep");
    });
  }

  function initLeaveBehindExport() {
    var btn = document.getElementById("btn-leave-behind-export");
    var preview = document.getElementById("leave-behind-preview");
    var printBtn = document.getElementById("leave-behind-preview-print");
    var cancelBtn = document.getElementById("leave-behind-preview-cancel");

    if (!btn) return;

    function startLeaveBehindPrint() {
      // Ensure preview is closed if present.
      if (preview) preview.hidden = true;

      document.body.classList.add("leave-behind-mode");
      function cleanupLeaveBehindPrint() {
        document.body.classList.remove("leave-behind-mode");
        window.removeEventListener("afterprint", cleanupLeaveBehindPrint);
      }
      window.addEventListener("afterprint", cleanupLeaveBehindPrint);
      window.print();
    }

    btn.addEventListener("click", function () {
      // Default behavior: print immediately (most reliable across browsers).
      // If the preview dialog exists, you can still use it via its buttons.
      startLeaveBehindPrint();
    });

    if (preview && printBtn && cancelBtn) {
      // Keep the explicit preview controls working if the UI is used elsewhere.
      printBtn.addEventListener("click", function () {
        startLeaveBehindPrint();
      });

      cancelBtn.addEventListener("click", function () {
        preview.hidden = true;
        try { btn.focus(); } catch (e2) { /* ignore */ }
      });
    }
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

  /** Sets --dashboard-header-offset so the left sticky sidebar uses top: header height, not 0 (avoids clipping under the sticky header). */
  function updateDashboardHeaderOffset() {
    var header = document.querySelector(".dashboard-header");
    if (!header || !document.documentElement) return;
    var h = header.offsetHeight;
    if (h > 0) {
      document.documentElement.style.setProperty("--dashboard-header-offset", h + "px");
    }
  }

  function initDashboardHeaderOffset() {
    updateDashboardHeaderOffset();
    requestAnimationFrame(function () {
      requestAnimationFrame(updateDashboardHeaderOffset);
    });
    var header = document.querySelector(".dashboard-header");
    if (header && typeof ResizeObserver !== "undefined") {
      var roScheduled = false;
      var ro = new ResizeObserver(function () {
        if (roScheduled) return;
        roScheduled = true;
        requestAnimationFrame(function () {
          roScheduled = false;
          updateDashboardHeaderOffset();
        });
      });
      ro.observe(header);
    }
    var headerResizeDebounce = null;
    window.addEventListener("resize", function () {
      if (headerResizeDebounce) window.clearTimeout(headerResizeDebounce);
      headerResizeDebounce = window.setTimeout(updateDashboardHeaderOffset, 100);
    });
    window.addEventListener("orientationchange", function () {
      window.setTimeout(updateDashboardHeaderOffset, 200);
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
      var toReveal = [];
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.classList.contains("revealed")) {
          toReveal.push(entry.target);
        }
      });
      if (!toReveal.length) return;
      requestAnimationFrame(function () {
        toReveal.forEach(function (el) {
          el.classList.add("revealed");
        });
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  /** Policy timeline (advanced): stroke-dash line draw + staggered nodes; .ptl-inview on the card. */
  function initPolicyTimelineAnimation() {
    var section = document.getElementById("policy-milestones");
    var card = document.querySelector(".policy-timeline-card");
    if (!card) return;
    var path = card.querySelector(".policy-timeline-line-anim");
    var observeEl = section || card;

    function applyDashLength() {
      if (!path || !path.getTotalLength) return;
      var len = path.getTotalLength();
      if (len < 2) return;
      path.style.strokeDasharray = len + " " + len;
      if (card.classList.contains("ptl-inview")) {
        path.style.strokeDashoffset = "0";
      } else {
        path.style.strokeDashoffset = String(len);
      }
    }

    function revealNow() {
      card.classList.add("ptl-inview");
      applyDashLength();
      if (path) path.style.strokeDashoffset = "0";
    }

    if (prefersReducedMotion()) {
      revealNow();
      return;
    }

    applyDashLength();
    window.requestAnimationFrame(function () {
      applyDashLength();
      window.requestAnimationFrame(applyDashLength);
    });

    if (typeof IntersectionObserver === "undefined") {
      revealNow();
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealNow();
        obs.disconnect();
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -12% 0px" });
    obs.observe(observeEl);
  }

  /** Policy timeline v2: sync SVG node hover with matching card (advanced only). */
  function initPolicyTimelineInteraction() {
    var card = document.querySelector(".policy-timeline-card");
    var timeline = document.querySelector(".policy-timeline--v2[data-ptl-interactive]");
    if (!card || !timeline) return;

    function setHover(idx) {
      if (idx >= 1 && idx <= 4) {
        card.setAttribute("data-ptl-hover", String(idx));
      } else {
        card.removeAttribute("data-ptl-hover");
      }
    }

    var items = timeline.querySelectorAll(".timeline-item[data-timeline-index]");
    var nodes = timeline.querySelectorAll(".policy-timeline-node-g");
    var headers = card.querySelectorAll(".timeline-item__header");

    function openByIndex(idx) {
      if (!(idx >= 1 && idx <= 4)) return;
      // Find matching header and trigger the existing accordion click handler.
      var btn = card.querySelector("#timeline-btn-" + idx);
      if (btn) btn.click();
    }

    items.forEach(function (step) {
      var idx = parseInt(step.getAttribute("data-timeline-index"), 10);
      if (isNaN(idx)) return;
      step.addEventListener("mouseenter", function () {
        setHover(idx);
      });
      step.addEventListener("focusin", function () {
        setHover(idx);
      });
    });

    nodes.forEach(function (node, i) {
      var idx = i + 1;
      node.addEventListener("mouseenter", function () {
        setHover(idx);
      });
      node.addEventListener("click", function () {
        openByIndex(idx);
      });
    });

    timeline.addEventListener("mouseleave", function () {
      setHover(0);
    });

    card.addEventListener("focusout", function (e) {
      if (!card.contains(e.relatedTarget)) setHover(0);
    });
  }

  /** Accordion: one timeline panel open at a time. */
  function initPolicyTimelineAccordion() {
    var card = document.querySelector(".policy-timeline-card");
    if (!card) return;
    var headers = card.querySelectorAll(".timeline-item__header");
    if (!headers.length) return;

    headers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var panelId = btn.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        var wasOpen = btn.getAttribute("aria-expanded") === "true";

        headers.forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
          var pid = b.getAttribute("aria-controls");
          var p = pid ? document.getElementById(pid) : null;
          if (p) p.hidden = true;
        });

        if (!wasOpen && panel) {
          btn.setAttribute("aria-expanded", "true");
          panel.hidden = false;
        }
      });
    });
  }

  /** IntersectionObserver: active milestone + progress fill (no scroll-loop layout reads). */
  function initPolicyTimelineIntersection() {
    var items = document.querySelectorAll(".timeline-item");
    var fill = document.querySelector(".policy-timeline-progress-fill");
    if (!items.length) return;

    if (typeof IntersectionObserver === "undefined") {
      items.forEach(function (el) {
        el.classList.add("is-active");
      });
      if (fill) fill.style.setProperty("--ptl-p", "1");
      return;
    }

    var ratios = {};
    items.forEach(function (el) {
      ratios[el.id] = 0;
    });

    var ptlApplyScheduled = false;
    function applyPolicyTimelineFromRatios() {
      ptlApplyScheduled = false;
      var maxIdx = 0;
      items.forEach(function (el) {
        var idx = parseInt(el.getAttribute("data-timeline-index"), 10) || 0;
        var on = ratios[el.id] >= 0.3;
        el.classList.toggle("is-active", on);
        if (on && idx > maxIdx) maxIdx = idx;
      });
      if (fill) fill.style.setProperty("--ptl-p", String(maxIdx / 4));
    }

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          ratios[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
        });
        if (!ptlApplyScheduled) {
          ptlApplyScheduled = true;
          requestAnimationFrame(applyPolicyTimelineFromRatios);
        }
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1], rootMargin: "-10% 0px -10% 0px" }
    );

    items.forEach(function (el) {
      obs.observe(el);
    });
  }

  function getPaBillSessionDaysLeft(deadlineStr) {
    var end = new Date(deadlineStr);
    if (isNaN(end.getTime())) {
      return null;
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - today.getTime()) / 86400000);
  }

  function renderPaBillTracker() {
    var root = document.getElementById("pa-bill-card-root");
    if (!root) return;

    var cfg = PA_BILL_CONFIG;
    root.replaceChildren();

    if (!cfg.hasBill) {
      var noBill = document.createElement("article");
      noBill.className = "pa-bill-card pa-bill-card--empty";
      var noBillP = document.createElement("p");
      noBillP.className = "pa-bill-card-empty-text";
      noBillP.textContent =
        "No contract pharmacy protection bill has been introduced in the current PA General Assembly session. Contact HAP Advocacy to support introduction:";
      noBillP.appendChild(document.createElement("br"));

      var contactName = (cfg.hapContact || "HAP Advocacy").toString();
      var contactPhone = (cfg.hapContactPhone || "(717) 564-9200").toString();

      noBillP.appendChild(document.createTextNode(contactName));
      noBillP.appendChild(document.createElement("br"));
      noBillP.appendChild(document.createTextNode(contactPhone));
      noBill.appendChild(noBillP);
      root.appendChild(noBill);
      return;
    }

    var card = document.createElement("article");
    card.className = "pa-bill-card";
    card.setAttribute("aria-label", "Bill status");

    var num = document.createElement("p");
    num.className = "pa-bill-card-number";
    num.textContent = cfg.billNumber || "";

    var title = document.createElement("p");
    title.className = "pa-bill-card-title";
    title.textContent = cfg.billTitle || "";

    var posRaw = (cfg.hapPosition || "").toString().trim().toUpperCase();
    var posBadge = document.createElement("p");
    posBadge.className = "pa-bill-card-position";
    var badge = document.createElement("span");
    badge.className = "pa-bill-position-badge";
    if (posRaw.indexOf("OPPOSE") >= 0) {
      badge.classList.add("pa-bill-position-badge--oppose");
      badge.textContent = "OPPOSE";
    } else if (posRaw.indexOf("SUPPORT") >= 0) {
      badge.classList.add("pa-bill-position-badge--support");
      badge.textContent = "SUPPORT";
    } else {
      badge.classList.add("pa-bill-position-badge--neutral");
      badge.textContent = posRaw || "—";
    }
    var posLabel = document.createElement("span");
    posLabel.className = "pa-bill-card-position-label";
    posLabel.textContent = "HAP Position";
    posBadge.appendChild(posLabel);
    posBadge.appendChild(badge);

    function addRow(label, value) {
      var row = document.createElement("div");
      row.className = "pa-bill-card-row";
      var lab = document.createElement("span");
      lab.className = "pa-bill-card-label";
      lab.textContent = label;
      var val = document.createElement("span");
      val.className = "pa-bill-card-value";
      val.textContent = value;
      row.appendChild(lab);
      row.appendChild(val);
      return row;
    }

    var house = document.createElement("div");
    house.className = "pa-bill-card-block";
    house.appendChild(addRow("House committee", cfg.houseCommittee || "—"));
    house.appendChild(addRow("House chair", cfg.houseChair || "—"));

    var senate = document.createElement("div");
    senate.className = "pa-bill-card-block";
    senate.appendChild(addRow("Senate committee", cfg.senateCommittee || "—"));
    senate.appendChild(addRow("Senate chair", cfg.senateChair || "—"));

    var last = document.createElement("div");
    last.className = "pa-bill-card-row pa-bill-card-row--full";
    var lastLab = document.createElement("span");
    lastLab.className = "pa-bill-card-label";
    lastLab.textContent = "Last action";
    var lastVal = document.createElement("span");
    lastVal.className = "pa-bill-card-value";
    lastVal.textContent = cfg.lastAction || "—";
    last.appendChild(lastLab);
    last.appendChild(lastVal);

    var deadlineRow = document.createElement("div");
    deadlineRow.className = "pa-bill-card-row pa-bill-card-row--full pa-bill-card-deadline";
    var dlLab = document.createElement("span");
    dlLab.className = "pa-bill-card-label";
    dlLab.textContent = "Session deadline";
    var dlVal = document.createElement("span");
    dlVal.className = "pa-bill-card-value";
    dlVal.textContent = cfg.sessionDeadline || "—";
    var countdown = document.createElement("span");
    countdown.id = "pa-bill-session-countdown";
    countdown.className = "pa-bill-card-countdown";
    countdown.setAttribute("aria-live", "polite");
    function refreshCountdown() {
      var days = getPaBillSessionDaysLeft(cfg.sessionDeadline);
      if (days === null) {
        countdown.textContent = "";
        return;
      }
      if (days < 0) days = 0;
      if (days === 1) {
        countdown.textContent = "1 day remaining in session";
      } else {
        countdown.textContent = days + " days remaining in session";
      }
    }
    refreshCountdown();
    dlVal.appendChild(document.createTextNode(" · "));
    dlVal.appendChild(countdown);
    deadlineRow.appendChild(dlLab);
    deadlineRow.appendChild(dlVal);

    var linkP = document.createElement("p");
    linkP.className = "pa-bill-card-actions";
    var a = document.createElement("a");
    a.className = "pa-bill-card-bill-link";
    var rawUrl = (cfg.billUrl && String(cfg.billUrl).trim() !== "") ? String(cfg.billUrl).trim() : "#";
    a.href = rawUrl;
    a.textContent = "View bill text";
    if (/^https?:\/\//i.test(rawUrl)) {
      a.rel = "noopener noreferrer";
      a.target = "_blank";
    }
    linkP.appendChild(a);

    card.appendChild(num);
    card.appendChild(title);
    card.appendChild(posBadge);
    card.appendChild(house);
    card.appendChild(senate);
    card.appendChild(last);
    card.appendChild(deadlineRow);
    card.appendChild(linkP);
    root.appendChild(card);

    if (paBillCountdownTimer !== null) {
      window.clearInterval(paBillCountdownTimer);
    }
    paBillCountdownTimer = window.setInterval(refreshCountdown, 60000);
  }

  function initPaBillTracker() {
    renderPaBillTracker();
  }

  function renderFederalBillBanner() {
    var root = document.getElementById("federal-bill-banner-root");
    if (!root) return;
    var cfg = FEDERAL_BILL_CONFIG;
    root.replaceChildren();

    if (!cfg.hasBill) {
      var empty = document.createElement("p");
      empty.className = "federal-bill-banner federal-bill-banner--empty";
      empty.textContent =
        "No federal bill is linked in this dashboard view. Contact HAP Federal Advocacy to connect bill text and committee status.";
      root.appendChild(empty);
      return;
    }

    var ban = document.createElement("div");
    ban.className = "federal-bill-banner";

    var top = document.createElement("div");
    top.className = "federal-bill-banner__top";
    var num = document.createElement("p");
    num.className = "federal-bill-banner__number";
    num.textContent = cfg.billNumber || "";
    var title = document.createElement("p");
    title.className = "federal-bill-banner__title";
    title.textContent = cfg.billTitle || "";
    top.appendChild(num);
    top.appendChild(title);

    var grid = document.createElement("div");
    grid.className = "federal-bill-banner__grid";

    function addCell(label, value) {
      var cell = document.createElement("div");
      cell.className = "federal-bill-banner__cell";
      var lab = document.createElement("span");
      lab.className = "federal-bill-banner__label";
      lab.textContent = label;
      var val = document.createElement("span");
      val.className = "federal-bill-banner__value";
      val.textContent = value;
      cell.appendChild(lab);
      cell.appendChild(val);
      return cell;
    }

    grid.appendChild(addCell("Senate committee status", cfg.senateStatus || "—"));
    grid.appendChild(addCell("House committee status", cfg.houseStatus || "—"));
    grid.appendChild(addCell("Last updated", cfg.lastUpdated || "—"));

    var actions = document.createElement("div");
    actions.className = "federal-bill-banner__actions";
    var a = document.createElement("a");
    a.className = "federal-bill-banner__link";
    var rawUrl = cfg.billUrl && String(cfg.billUrl).trim() !== "" ? String(cfg.billUrl).trim() : "#";
    a.href = rawUrl;
    a.textContent = "View bill text";
    if (/^https?:\/\//i.test(rawUrl)) {
      a.rel = "noopener noreferrer";
      a.target = "_blank";
    }
    actions.appendChild(a);

    function deriveVpShortTitle(titleStr) {
      var s = titleStr ? titleStr.toString() : "";
      var commaIdx = s.indexOf(",");
      if (commaIdx >= 0) {
        var rest = s.substring(commaIdx + 1).trim();
        if (rest) return "VP " + rest;
      }
      return s || "VP";
    }

    var contact = document.createElement("p");
    contact.className = "federal-bill-banner__contact";

    var vpShort = deriveVpShortTitle(cfg.hapContactTitle);
    contact.textContent =
      "Federal 340B questions: " + (cfg.hapContact || "") + ", " + vpShort + " | (717) 564-9200";

    ban.appendChild(top);
    ban.appendChild(grid);
    ban.appendChild(actions);
    ban.appendChild(contact);
    root.appendChild(ban);
  }

  var FEDERAL_POS_LABELS = {
    cosponsor: "Cosponsor",
    supportive: "Supportive",
    unknown: "Unknown",
    opposed: "Opposed"
  };

  function renderFederalDelegationTable() {
    var tbody = document.getElementById("federal-delegation-tbody");
    if (!tbody) return;
    tbody.replaceChildren();

    PA_DELEGATION_MEMBERS.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-federal-position", row.position || "unknown");

      function td(text) {
        var cell = document.createElement("td");
        cell.textContent = text;
        return cell;
      }

      tr.appendChild(td(row.member || ""));
      tr.appendChild(td(row.chamber || ""));
      tr.appendChild(td(row.district || ""));
      tr.appendChild(td(row.party || ""));

      var tdPos = document.createElement("td");
      var badge = document.createElement("span");
      var posKey = row.position || "unknown";
      badge.className = "federal-pos-badge federal-pos-badge--" + posKey;
      badge.textContent = FEDERAL_POS_LABELS[posKey] || posKey;
      tdPos.appendChild(badge);
      tr.appendChild(tdPos);

      tr.appendChild(td(row.lastContact || ""));
      tr.appendChild(td(row.action || ""));
      tbody.appendChild(tr);
    });
  }

  function initFederalDelegationFilter() {
    var toolbar = document.getElementById("federal-delegation-filter");
    var tbody = document.getElementById("federal-delegation-tbody");
    if (!toolbar || !tbody) return;

    toolbar.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-federal-filter]") : null;
      if (!btn || !toolbar.contains(btn)) return;

      var filter = btn.getAttribute("data-federal-filter") || "all";
      var buttons = toolbar.querySelectorAll("[data-federal-filter]");
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.toggle("is-active", buttons[i] === btn);
      }

      var rows = tbody.querySelectorAll("tr[data-federal-position]");
      for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        var pos = row.getAttribute("data-federal-position") || "";
        var show = filter === "all" || pos === filter;
        row.hidden = !show;
      }
    });
  }

  function initFederalDelegation() {
    renderFederalBillBanner();
    renderFederalDelegationTable();
    initFederalDelegationFilter();
  }

  function initVerifiedDataStamps() {
    // Populate "Verified: ..." lines using safe textContent only.
    var nodes = document.querySelectorAll("[data-verified-key]");
    if (!nodes || !nodes.length) return;

    nodes.forEach(function (el) {
      var key = el.getAttribute("data-verified-key") || "";
      var val = DATA_DATES[key];
      el.textContent = typeof val === "string" && val ? "Verified: " + val : "";
    });
  }

  function initPaDistrictLookup() {
    var form = document.getElementById("pa-district-lookup-form");
    var input = document.getElementById("pa-district-zip");
    var statusEl = document.getElementById("pa-district-lookup-status");

    if (!form || !input) return;

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.classList.toggle("is-error", !!isError);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("", false);

      var raw = input.value || "";
      var zip = String(raw).replace(/[^0-9]/g, "");
      if (zip.length !== 5) {
        setStatus("Enter a valid 5-digit ZIP code.", true);
        input.focus();
        return;
      }

      setStatus("Looking up legislators…", false);
      window.dispatchEvent(new CustomEvent("hap:pa-district-zip-lookup", {
        detail: { zip: zip }
      }));
    });
  }

  function initPaDistrictMap() {
    var mapWrap = document.getElementById("pa-district-map");
    if (!mapWrap) return;

    var toggles = document.querySelectorAll(".pa-district-toggle[data-pa-district-chamber]");
    var detailEmpty = document.getElementById("pa-district-detail-empty");
    var detailPanel = document.getElementById("pa-district-detail-panel");
    var elTitle = document.getElementById("pa-district-detail-title");
    var elLeg = document.getElementById("pa-district-detail-legislator");
    var elCount = document.getElementById("pa-district-detail-count");
    var elHosp = document.getElementById("pa-district-detail-hospitals");
    var elRel = document.getElementById("pa-district-detail-relationship");

    var activeChamber = "house";
    function setActiveChamber(ch) {
      activeChamber = ch === "senate" ? "senate" : "house";
      toggles.forEach(function (btn) {
        var isOn = (btn.getAttribute("data-pa-district-chamber") === activeChamber);
        btn.classList.toggle("is-active", isOn);
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
      });
      // When the real map is wired, this is where we’d re-render.
    }

    function showSelection(payload) {
      if (!detailEmpty || !detailPanel) return;
      detailEmpty.hidden = true;
      detailPanel.hidden = false;
      if (elTitle) elTitle.textContent = payload.title || "—";
      if (elLeg) elLeg.textContent = payload.legislator || "—";
      if (elCount) elCount.textContent = payload.count != null ? String(payload.count) : "—";
      if (elHosp) elHosp.textContent = payload.hospitals || "—";
      if (elRel) elRel.textContent = payload.relationship || "—";
    }

    function resetSelection() {
      if (!detailEmpty || !detailPanel) return;
      detailPanel.hidden = true;
      detailEmpty.hidden = false;
    }

    toggles.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ch = btn.getAttribute("data-pa-district-chamber");
        setActiveChamber(ch);
        resetSelection();
      });
    });

    // Data integrity: don’t invent legislator names or hospital counts.
    // If approved datasets are loaded later, this initializer can be extended to render the real map.
    resetSelection();
    setActiveChamber(activeChamber);

    // If data objects exist, expose a minimal click API for future wiring.
    // Example payload:
    // { title: "House District 12", legislator: "Rep. …", count: 2, hospitals: "A; B", relationship: "Ally" }
    mapWrap._paDistrictSelect = function (payload) { showSelection(payload || {}); };
  }

  function initNavHighlight() {
    /* Scroll-active nav: last section (document order) whose top is above the header band wins.
     * Section Y positions are cached; scroll handler only compares scrollY (no getBoundingClientRect per frame). */
    var sectionIds = [
      "section-overview",
      "overview",
      "pa-bill-tracker",
      "federal-delegation",
      "state-laws",
      "legal-trends",
      "counterarguments",
      "methodology-section",
      "key-metrics",
      "community-benefit",
      "pa-impact-mode",
      "policy-impact-simulator",
      "policy-milestones",
      "access",
      "pa-safeguards"
    ];
    var sections = sectionIds.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    if (!sections.length) {
      updateNavCurrent("section-overview");
      return;
    }

    /* Cache header height; refresh on resize/load (avoid layout thrash in scroll rAF). */
    var cachedNavHeaderOffset = 96;
    function refreshNavHeaderOffset() {
      var h = document.querySelector(".dashboard-header");
      cachedNavHeaderOffset = h ? Math.round(h.getBoundingClientRect().height) + 12 : 96;
    }

    var sectionDocumentTops = [];
    function refreshSectionAnchors() {
      var sy = window.pageYOffset || document.documentElement.scrollTop || 0;
      sectionDocumentTops = sections.map(function (el) {
        return el.getBoundingClientRect().top + sy;
      });
    }

    function tickNavFromScroll() {
      if (!sectionDocumentTops.length) {
        refreshSectionAnchors();
      }
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var band = cachedNavHeaderOffset + 8;
      var activeId = sections[0].id;
      for (var i = sections.length - 1; i >= 0; i--) {
        if (sectionDocumentTops[i] <= y + band) {
          activeId = sections[i].id;
          break;
        }
      }
      updateNavCurrent(activeId);
    }

    var scrollTicking = false;
    function onScrollOptimized() {
      if (!scrollTicking) {
        window.requestAnimationFrame(function () {
          tickNavFromScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }

    function afterLayoutRefresh() {
      refreshNavHeaderOffset();
      refreshSectionAnchors();
      tickNavFromScroll();
    }

    refreshNavHeaderOffset();
    refreshSectionAnchors();

    var resizeNavTimer = null;
    window.addEventListener("scroll", onScrollOptimized, { passive: true });
    window.addEventListener("resize", function () {
      if (resizeNavTimer) window.clearTimeout(resizeNavTimer);
      resizeNavTimer = window.setTimeout(afterLayoutRefresh, 100);
    });
    window.addEventListener("load", afterLayoutRefresh);
    window.addEventListener("hashchange", function () {
      window.requestAnimationFrame(afterLayoutRefresh);
    });
    tickNavFromScroll();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(afterLayoutRefresh);
    });

  }

  /* ---------- Event handlers ---------- */

  /**
   * Syncs the selected state from the URL hash (#state-XX). Called on init and hashchange.
   * - Valid known state: select it and scroll to map.
   * - Invalid/unknown hash (e.g. #state-XX where XX is bad): clear hash and selection.
   * - No hash but something selected: clear selection (e.g. user navigated away via back button).
   */
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
      event.target.closest(".utility-toolbar") ||
      event.target.closest("#dashboard-nav") ||
      event.target.closest(".hap-sidebar") ||
      event.target.closest(".dashboard-header") ||
      event.target.closest(".kpi-pa-tooltip-host")
    ) {
      return;
    }

    clearSelection("");
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      var kpiHost = document.querySelector(".kpi-pa-tooltip-host");
      if (kpiHost && kpiHost.classList.contains("is-open")) {
        kpiHost.classList.remove("is-open");
        var kpiBtn = document.getElementById("kpi-pa-illustrative-info");
        if (kpiBtn) kpiBtn.setAttribute("aria-expanded", "false");
        event.preventDefault();
        return;
      }
    }
    if (event.key === "Escape" && appState.selectedStateAbbr) {
      clearSelection();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "p") {
      if (document.body && document.body.classList && document.body.classList.contains("leave-behind-mode")) {
        return;
      }
      event.preventDefault();
      runTaskSafely("download pdf image", downloadPdfAsImage);
    }
  }

  function handleResize() {
    var width;

    if (appState.touchDevice || !appState.dom.mapContainer) return;

    width = appState.dom.mapContainer.offsetWidth;
    if (Math.abs(width - appState.lastMapWidth) < RESIZE_WIDTH_THRESHOLD_PX && appState.lastMapWidth) return;

    appState.lastMapWidth = width;
    drawMap();
  }

  function handleAfterPrint() {
    appState.printPreparationPending = false;
    document.body.classList.remove("print-ready");
    document.body.classList.remove("leave-behind-mode");
    setUtilityStatus("");
    clearElement(appState.dom.printIntroSnapshot);

    // Hide leave-behind preview note if it exists.
    try {
      var lb = document.getElementById("leave-behind-preview");
      if (lb) lb.hidden = true;
    } catch (e) {
      /* ignore */
    }

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

    try {
      var sp = new URLSearchParams(window.location.search);
      if (sp.get("dmxperf") === "1") {
        document.documentElement.classList.add("dmx-perf");
        console.log("Scroll FPS test active");
      }
    } catch (perfFlagErr) {
      /* ignore */
    }

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
    runTaskSafely("initialize verified data stamps", initVerifiedDataStamps);
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
    runTaskSafely("initialize kpi briefing banner", initKpiBriefingBanner);
    runTaskSafely("initialize exec summary sparklines", initExecSummarySparklines);
    runTaskSafely("initialize kpi pa illustrative tooltip", initKpiPaIllustrativeTooltip);
    runTaskSafely("initialize selection controls", initSelectionControls);
    runTaskSafely("initialize hearing prep print", initHearingPrepPrint);
    runTaskSafely("initialize leave-behind export", initLeaveBehindExport);
    runTaskSafely("initialize PA bill tracker", initPaBillTracker);
    runTaskSafely("initialize federal delegation", initFederalDelegation);
    runTaskSafely("initialize PA district lookup", initPaDistrictLookup);
    runTaskSafely("initialize PA district map", initPaDistrictMap);
    runTaskSafely("draw map", drawMap);
    runTaskSafely("initialize count up", initCountUp);
    runTaskSafely("initialize scroll reveal", initScrollReveal);
    runTaskSafely("initialize policy timeline animation", initPolicyTimelineAnimation);
    runTaskSafely("initialize policy timeline accordion", initPolicyTimelineAccordion);
    runTaskSafely("initialize policy timeline intersection", initPolicyTimelineIntersection);
    runTaskSafely("initialize policy timeline interaction", initPolicyTimelineInteraction);
    runTaskSafely("sync sticky header offset", initDashboardHeaderOffset);
    runTaskSafely("initialize nav highlight", initNavHighlight);
    runTaskSafely("sync selection from hash", syncSelectionFromHash);

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("afterprint", handleAfterPrint);
    window.addEventListener("hashchange", syncSelectionFromHash);

    if (!appState.touchDevice) {
      window.addEventListener("resize", function () {
        clearTimeout(appState.resizeTimer);
        appState.resizeTimer = window.setTimeout(handleResize, RESIZE_DEBOUNCE_MS);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
