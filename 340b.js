/**
 * HAP 340B Advocacy Dashboard — Main Script
 * Keep this file simple: data lives in `state-data.js`, and this file
 * handles rendering, accessibility, and user interactions.
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
    printDefaultStateReason: "Pennsylvania remains the natural print context for HAP.",
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
    // Count-up elements start at 0 on the live page and animate only after they enter view.
    // Print preview must not capture those starting values, so this helper forces every
    // number to its finished state before the browser builds the print snapshot.
    document.querySelectorAll("[data-count-up]").forEach(function (element) {
      setCountUpValue(element);
    });
  }

  function revealAllAnimatedSections() {
    // The live page hides some sections until the user scrolls to them.
    // Print preview needs the final fully revealed layout immediately.
    document.querySelectorAll(".scroll-reveal").forEach(function (element) {
      element.classList.add("revealed");
    });

    showMapWrapImmediately();
    hideTooltip(appState.dom.mapTooltip);
    hideTooltip(appState.dom.chipTooltip);
  }

  function buildPrintIntroSnapshot() {
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
      return "Pennsylvania remains the HAP focal state. Contract pharmacy protection is still in progress, which makes the state useful as both a live dashboard example and the default print context.";
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
      return config.printDefaultStateReason || "Pennsylvania remains the default print context because it is the HAP focal state.";
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
      appState.dom.selectionSummaryText.textContent = "Choose a state from the map or list to compare enacted protections, no-protection states, and Pennsylvania's current policy context.";
      if (appState.dom.selectionClear) appState.dom.selectionClear.hidden = true;
      return;
    }

    appState.dom.selectionSummaryTitle.textContent = getStateName(abbr);
    appState.dom.selectionSummaryText.textContent = buildStateSummaryText(abbr);
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

  function preparePrintSnapshot(onReady) {
    var callback = typeof onReady === "function" ? onReady : function () {};
    var mapSvgMissing = !appState.dom.mapContainer || !appState.dom.mapContainer.querySelector("svg");

    // Print/PDF should use the same cards the user sees on screen.
    // To make that reliable, we force the page into its final visual state:
    // 1. finish all count-up numbers
    // 2. reveal scroll-based sections
    // 3. make sure the SVG map exists before print opens
    finalizeCountUpValues();
    revealAllAnimatedSections();
    preparePrintSelectionState();
    buildPrintIntroSnapshot();

    if (mapSvgMissing) {
      runTaskSafely("draw map for print", drawMap);
      revealAllAnimatedSections();
      preparePrintSelectionState();
      buildPrintIntroSnapshot();
    }

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(callback);
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

    width = Math.min(container.offsetWidth || 800, config.mapMaxWidth);
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

    if (visibleCount === 0) setFilterStatus("No states match the current filter.");
    else if (appState.currentFilter === "all") setFilterStatus("Showing all states.");
    else setFilterStatus("Showing " + visibleCount + " states in this view.");
  }

  function initStateFilter() {
    var filterButtons = document.querySelectorAll(".state-filter-btn");

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        appState.currentFilter = button.getAttribute("data-filter") || "all";

        filterButtons.forEach(function (item) {
          var isActive = item === button;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        applyStateFilter();
      });
    });
  }

  /* ---------- Utility actions ---------- */

  function initPrint() {
    if (!appState.dom.printButton) return;

    appState.dom.printButton.addEventListener("click", function () {
      if (typeof window.print !== "function") {
        setUtilityStatus("Print is not available in this browser.");
        return;
      }

      appState.printPreparationPending = true;
      setUtilityStatus("Preparing print preview...");

      // Do not call window.print() until the DOM has had time to apply the final-state changes.
      // This avoids blank pages, duplicated print-only content, missing maps, and 0-value metrics.
      preparePrintSnapshot(function () {
        try {
          setUtilityStatus("Opening print dialog...");
          window.print();
        } catch (error) {
          setUtilityStatus("Print could not open automatically.");
          if (typeof console !== "undefined" && console.warn) {
            console.warn("Print failed", error);
          }
          return;
        }

        window.setTimeout(function () {
          setUtilityStatus("");
        }, 1500);
      });
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
          setUtilityStatus("");
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
                showTemporaryUtilityStatus("Use the prompt to copy the link.");
              }
            } catch (error) {
              window.prompt("Copy this link:", url);
              showTemporaryUtilityStatus("Use the prompt to copy the link.");
            }

            document.body.removeChild(fallbackField);
          });
      } else {
        window.prompt("Copy this link:", url);
        showTemporaryUtilityStatus("Use the prompt to copy the link.");
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
    // Some users print from the browser menu instead of the on-page button.
    // Run the same preparation step either way so both paths produce the same PDF.
    preparePrintSnapshot(function () {
      setUtilityStatus("");
    });
  }

  function handleAfterPrint() {
    appState.printPreparationPending = false;
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
    // Run each startup task independently so one broken feature does not take down the whole page.
    // Example: if the map fails, share/print/filter logic should still initialize.
    runTaskSafely("apply config copy", applyConfigCopy);
    runTaskSafely("update metadata", updateMetadata);
    runTaskSafely("validate state data", validateStateData);
    runTaskSafely("render empty detail", renderEmptyStateDetail);
    runTaskSafely("update selection summary", function () {
      updateSelectionSummary(null);
    });
    runTaskSafely("render state chips", renderStateChips);
    runTaskSafely("initialize filters", initStateFilter);
    runTaskSafely("initialize print", initPrint);
    runTaskSafely("initialize share", initShare);
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
