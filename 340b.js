/**
 * HAP 340B Advocacy Dashboard — Main Script
 * ==========================================
 * Beginner-friendly structure:
 * - Config + state data live in `state-data.js`
 * - This file handles rendering and interactions
 * - Dynamic UI uses safe DOM APIs instead of raw HTML strings
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
    mapDataUrl: "assets/vendor/states-10m.json",
    mapAspectRatio: 0.55,
    mapMaxWidth: 960,
    countUpDuration: 1200,
    dominoDelayPerState: 55,
    scrollRevealThreshold: 0.1
  };

  var appState = {
    selectedStateAbbr: null,
    currentFilter: "all",
    currentQuery: "",
    mapPaths: null,
    lastMapWidth: 0,
    resizeTimer: null,
    mapVisibilityObserver: null,
    touchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    hoverCapable: window.matchMedia && window.matchMedia("(hover: hover)").matches
  };

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

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function getSortedStates() {
    return Object.keys(STATE_340B)
      .filter(function (abbr) {
        return abbr !== "DC";
      })
      .sort(function (a, b) {
        return getStateName(a).localeCompare(getStateName(b));
      });
  }

  function clearElement(element) {
    if (element) element.replaceChildren();
  }

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (typeof text === "string") element.textContent = text;
    return element;
  }

  function appendBadge(parent, tone, text) {
    var badge = createElement("span", "badge " + tone, text);
    parent.appendChild(badge);
    return badge;
  }

  function setUtilityStatus(message) {
    var status = document.getElementById("utility-status");
    if (status) status.textContent = message || "";
  }

  function setFilterStatus(message) {
    var status = document.getElementById("state-filter-status");
    if (status) status.textContent = message || "";
  }

  function setMapBusy(isBusy) {
    var wrapper = document.getElementById("us-map-wrap");
    var container = document.getElementById("us-map");

    if (wrapper) wrapper.setAttribute("aria-busy", isBusy ? "true" : "false");
    if (container) container.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  function updateMetadata() {
    var fullTitle = config.dashboardTitle + " | " + config.dashboardSubtitle;
    var metaDescription = document.getElementById("meta-description");
    var ogTitle = document.getElementById("meta-og-title");
    var ogDescription = document.getElementById("meta-og-description");
    var twitterTitle = document.getElementById("meta-twitter-title");
    var twitterDescription = document.getElementById("meta-twitter-description");
    var freshness = document.getElementById("data-freshness-text");
    var lastUpdated = document.getElementById("methodology-last-updated");

    document.title = fullTitle;

    if (metaDescription) metaDescription.setAttribute("content", config.pageDescription);
    if (ogTitle) ogTitle.setAttribute("content", config.shareTitle || fullTitle);
    if (ogDescription) ogDescription.setAttribute("content", config.shareDescription || config.pageDescription);
    if (twitterTitle) twitterTitle.setAttribute("content", config.shareTitle || fullTitle);
    if (twitterDescription) twitterDescription.setAttribute("content", config.shareDescription || config.pageDescription);
    if (freshness) freshness.textContent = "Data as of " + config.dataFreshness + " - Last updated " + config.lastUpdated;
    if (lastUpdated) lastUpdated.textContent = config.lastUpdated;
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

      if (missingKeys.length && console && console.warn) {
        console.warn("State data is missing keys for", abbr, missingKeys.join(", "));
      }
    });
  }

  function updateUrlHash(abbr) {
    var nextHash = abbr ? "#state-" + abbr : "";

    if (location.hash === nextHash) return;

    if (history.replaceState) {
      history.replaceState(null, "", location.pathname + location.search + nextHash);
    } else {
      location.hash = nextHash;
    }
  }

  function getHashState() {
    var rawHash = (location.hash || "").replace(/^#state-/, "").toUpperCase();
    return rawHash && rawHash.length === 2 ? rawHash : null;
  }

  function scrollToMapSection() {
    var section = document.getElementById("state-laws");
    if (section) {
      section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }

  function renderEmptyStateDetail() {
    var panel = document.getElementById("state-detail-panel");
    if (!panel) return;

    panel.classList.add("empty");
    panel.setAttribute("aria-live", "polite");
    clearElement(panel);
    panel.appendChild(createElement("p", "", "Select a state to view contract pharmacy and PBM details."));
  }

  function renderStateDetail(abbr) {
    var panel = document.getElementById("state-detail-panel");
    var data = getStateData(abbr);
    var heading;
    var badgeRow;
    var detailGrid;

    if (!panel) return;

    panel.classList.remove("empty");
    panel.setAttribute("aria-live", "polite");
    clearElement(panel);

    heading = createElement("h4", "", getStateName(abbr));
    panel.appendChild(heading);

    if (!data) {
      panel.appendChild(createElement("p", "", "No state law data is available."));
      return;
    }

    badgeRow = createElement("p", "state-detail-badges");
    appendBadge(badgeRow, data.cp ? "yes" : "no", data.cp ? "Contract pharmacy protected" : "No contract pharmacy law");
    appendBadge(badgeRow, data.pbm ? "yes" : "no", data.pbm ? "PBM protections in place" : "No PBM protection law");
    panel.appendChild(badgeRow);

    detailGrid = createElement("dl", "state-detail-grid");

    detailGrid.appendChild(createElement("dt", "", "Contract pharmacy"));
    detailGrid.appendChild(createElement("dd", "", data.cp ? "Yes" : "No"));

    detailGrid.appendChild(createElement("dt", "", "PBM protections"));
    detailGrid.appendChild(createElement("dd", "", data.pbm ? "Yes" : "No"));

    detailGrid.appendChild(createElement("dt", "", "Law year"));
    detailGrid.appendChild(createElement("dd", "", data.y ? String(data.y) : "Not enacted"));

    detailGrid.appendChild(createElement("dt", "", "Notes"));
    detailGrid.appendChild(createElement("dd", "", data.notes || "No additional notes."));

    panel.appendChild(detailGrid);
  }

  function updateNavCurrent(activeId) {
    var navLinks = document.querySelectorAll(".dashboard-nav a[href^='#']");
    var policySections = ["oversight", "pa-impact", "community-benefit", "access", "pa-safeguards"];

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      var isActive = href === "#" + activeId || (href === "#policy" && policySections.indexOf(activeId) >= 0);
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
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

  function clearMapHighlight() {
    if (appState.mapPaths) {
      appState.mapPaths.classed("selected", false);
    }
  }

  function highlightStateChip(abbr) {
    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var isSelected = chip.getAttribute("data-state") === abbr;
      chip.classList.toggle("selected", isSelected);
      chip.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function clearSelection() {
    appState.selectedStateAbbr = null;
    updateUrlHash(null);
    renderEmptyStateDetail();
    clearMapHighlight();
    highlightStateChip(null);
  }

  function selectState(abbr, options) {
    var panel = document.getElementById("state-detail-panel");
    var settings = options || {};

    if (!abbr) return;

    appState.selectedStateAbbr = abbr;
    updateUrlHash(abbr);
    renderStateDetail(abbr);
    highlightMapState(abbr);
    highlightStateChip(abbr);

    if (settings.scrollToMap) {
      scrollToMapSection();
    }

    if (settings.focusPanel && panel) {
      panel.focus({ preventScroll: !!settings.scrollToMap });
    }
  }

  function clampTooltip(tooltip, left, top) {
    var maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
    var maxTop = window.innerHeight - tooltip.offsetHeight - 12;
    var safeLeft = Math.max(12, Math.min(left, maxLeft));
    var safeTop = Math.max(12, Math.min(top, maxTop));

    tooltip.style.left = safeLeft + "px";
    tooltip.style.top = safeTop + "px";
  }

  function showTooltip(tooltip, left, top) {
    tooltip.classList.add("visible");
    clampTooltip(tooltip, left, top);
  }

  function hideTooltip(tooltip) {
    tooltip.classList.remove("visible");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function buildMapTooltip(tooltip, abbr) {
    clearElement(tooltip);
    tooltip.appendChild(document.createTextNode(getStateName(abbr)));
    tooltip.setAttribute("aria-hidden", "false");
  }

  function buildStateChipTooltip(tooltip, abbr) {
    var data = getStateData(abbr);
    clearElement(tooltip);
    tooltip.appendChild(createElement("strong", "", getStateName(abbr)));

    if (!data) {
      tooltip.setAttribute("aria-hidden", "false");
      return;
    }

    tooltip.appendChild(document.createTextNode(" "));
    appendBadge(tooltip, data.cp ? "yes" : "no", "CP: " + (data.cp ? "Yes" : "No"));
    appendBadge(tooltip, data.pbm ? "yes" : "no", "PBM: " + (data.pbm ? "Yes" : "No"));

    if (data.y) tooltip.appendChild(createElement("div", "", "Year: " + data.y));
    if (data.notes) tooltip.appendChild(createElement("div", "", data.notes));

    tooltip.setAttribute("aria-hidden", "false");
  }

  function buildMapFallback(container) {
    var fallback = createElement("div", "map-fallback");
    var title = createElement("h3", "map-fallback-title", "State protection summary");
    var list = createElement("ul", "map-fallback-list");

    getSortedStates().forEach(function (abbr) {
      var data = getStateData(abbr);
      var item = createElement("li", "map-fallback-item");
      item.textContent = getStateName(abbr) + " - " + (data && data.cp ? "Protection in place" : "No protection law");
      list.appendChild(item);
    });

    fallback.appendChild(title);
    fallback.appendChild(list);
    container.appendChild(fallback);
  }

  function showMapError(message, allowRetry) {
    var container = document.getElementById("us-map");
    var skeleton = document.getElementById("map-loading-skeleton");
    var wrapper;
    var retryButton;

    if (!container) return;

    clearElement(container);
    setMapBusy(false);
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "340B state protection fallback summary");
    if (skeleton) skeleton.classList.add("hidden");

    wrapper = createElement("div", "map-error-wrap");
    wrapper.appendChild(createElement("p", "map-error-msg", message));

    if (allowRetry) {
      retryButton = createElement("button", "map-retry-btn", "Retry");
      retryButton.type = "button";
      retryButton.addEventListener("click", drawMap);
      wrapper.appendChild(retryButton);
    }

    container.appendChild(wrapper);
    buildMapFallback(container);
  }

  function setupMapVisibilityObserver() {
    var wrapper = document.getElementById("us-map-wrap");

    if (!wrapper) return;
    if (appState.mapVisibilityObserver) {
      appState.mapVisibilityObserver.disconnect();
      appState.mapVisibilityObserver = null;
    }

    if (prefersReducedMotion()) {
      wrapper.classList.add("visible", "map-visible");
      return;
    }

    appState.mapVisibilityObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        wrapper.classList.add("visible", "map-visible");
      }
    }, { threshold: 0.1 });

    appState.mapVisibilityObserver.observe(wrapper);
  }

  function setupMapKeyboardNav() {
    var paths = Array.prototype.slice.call(document.querySelectorAll("#us-map path[data-state]"));

    paths.forEach(function (path, index) {
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", "Select " + getStateName(path.getAttribute("data-state")));

      path.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectState(path.getAttribute("data-state"), { focusPanel: true });
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

  function bindMapEvents() {
    var tooltip = document.getElementById("map-tooltip");

    if (!appState.mapPaths || !tooltip) return;

    appState.mapPaths
      .on("mouseenter", function (event, feature) {
        var abbr = getStateAbbr(feature);
        if (!appState.hoverCapable) return;
        buildMapTooltip(tooltip, abbr);
        showTooltip(tooltip, event.clientX, event.clientY + 14);
      })
      .on("mousemove", function (event) {
        if (!appState.hoverCapable) return;
        clampTooltip(tooltip, event.clientX, event.clientY + 14);
      })
      .on("mouseleave", function () {
        hideTooltip(tooltip);
      })
      .on("click", function (event, feature) {
        event.stopPropagation();
        hideTooltip(tooltip);
        selectState(getStateAbbr(feature), { focusPanel: true });
      });
  }

  function drawMap() {
    var container = document.getElementById("us-map");
    var skeleton = document.getElementById("map-loading-skeleton");
    var width;
    var height;
    var svg;

    if (!container) return;

    width = Math.min(container.offsetWidth || 800, config.mapMaxWidth);
    height = Math.round(width * config.mapAspectRatio);
    appState.lastMapWidth = width;

    clearElement(container);
    container.setAttribute("role", "img");
    container.setAttribute("aria-label", "Interactive US map showing states with and without 340B contract pharmacy protection.");
    setMapBusy(true);
    if (skeleton) skeleton.classList.remove("hidden");

    if (typeof d3 === "undefined" || typeof topojson === "undefined") {
      showMapError("The interactive map could not load. You can still use the state summary below.", true);
      return;
    }

    svg = d3.select(container)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto");

    d3.json(config.mapDataUrl)
      .then(function (us) {
        var states = topojson.feature(us, us.objects.states);
        var projection = d3.geoAlbersUsa().fitSize([width, height], states);
        var pathGenerator = d3.geoPath(projection);
        var group = svg.append("g");
        var orderedStates = states.features.map(function (feature, index) {
          return { feature: feature, index: index };
        });
        var animationOrder = {};

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
          .attr("class", function (feature, index) {
            var abbr = getStateAbbr(feature);
            var baseClass = STATES_WITH_PROTECTION.indexOf(abbr) >= 0 ? "state protection" : "state no-protection";
            return prefersReducedMotion() ? baseClass : baseClass + " state-domino";
          })
          .attr("d", pathGenerator)
          .attr("data-state", function (feature) {
            return getStateAbbr(feature) || "";
          })
          .attr("fill", function (feature) {
            return STATES_WITH_PROTECTION.indexOf(getStateAbbr(feature)) >= 0 ? "#0066a1" : "#e2e8f0";
          })
          .attr("stroke", "rgba(255,255,255,0.9)")
          .attr("stroke-width", 1)
          .each(function (_, index) {
            this.style.animationDelay = (animationOrder[index] || 0) * config.dominoDelayPerState + "ms";
          });

        setupMapVisibilityObserver();
        bindMapEvents();
        setupMapKeyboardNav();
        setMapBusy(false);
        if (skeleton) skeleton.classList.add("hidden");

        if (appState.selectedStateAbbr) {
          highlightMapState(appState.selectedStateAbbr);
        }
      })
      .catch(function (error) {
        if (console && console.warn) {
          console.warn("340B map data failed to load", error);
        }
        showMapError("The interactive map is temporarily unavailable. You can still review the state summary below.", true);
      });
  }

  function createStateChip(abbr) {
    var button = createElement("button", "state-chip");
    var name = createElement("span", "state-chip-name", getStateName(abbr));
    var shortCode = createElement("span", "state-chip-abbr", abbr);

    button.type = "button";
    button.setAttribute("data-state", abbr);
    button.setAttribute("aria-controls", "state-detail-panel");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "View details for " + getStateName(abbr));
    button.appendChild(name);
    button.appendChild(shortCode);

    button.addEventListener("click", function () {
      selectState(abbr, { focusPanel: false });
    });

    return button;
  }

  function renderStateChips() {
    var withList = document.getElementById("states-with-list");
    var withoutList = document.getElementById("states-without-list");
    var protectionCount = document.getElementById("protection-count");
    var noProtectionCount = document.getElementById("no-protection-count");
    var withProtection = [];
    var withoutProtection = [];

    if (!withList || !withoutList) return;

    clearElement(withList);
    clearElement(withoutList);

    getSortedStates().forEach(function (abbr) {
      if (getStateData(abbr) && getStateData(abbr).cp) {
        withProtection.push(abbr);
      } else {
        withoutProtection.push(abbr);
      }
    });

    withProtection.forEach(function (abbr) {
      withList.appendChild(createStateChip(abbr));
    });

    withoutProtection.forEach(function (abbr) {
      withoutList.appendChild(createStateChip(abbr));
    });

    if (protectionCount) protectionCount.textContent = String(withProtection.length);
    if (noProtectionCount) noProtectionCount.textContent = String(withoutProtection.length);

    initStateChipTooltips();
    highlightStateChip(appState.selectedStateAbbr);
    applyStateFilter();
  }

  function initStateChipTooltips() {
    var tooltip = document.getElementById("state-list-tooltip");

    if (!tooltip) return;

    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var abbr = chip.getAttribute("data-state");
      var data = getStateData(abbr);
      chip.title = getStateName(abbr) + (data && data.notes ? ": " + data.notes : "");

      if (!appState.hoverCapable) return;

      chip.addEventListener("mouseenter", function (event) {
        buildStateChipTooltip(tooltip, abbr);
        showTooltip(tooltip, event.clientX, event.clientY - 12);
      });

      chip.addEventListener("mousemove", function (event) {
        clampTooltip(tooltip, event.clientX, event.clientY - 12);
      });

      chip.addEventListener("mouseleave", function () {
        hideTooltip(tooltip);
      });
    });

    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var abbr = chip.getAttribute("data-state");
      chip.addEventListener("focus", function () {
        var rect = chip.getBoundingClientRect();
        buildStateChipTooltip(tooltip, abbr);
        showTooltip(tooltip, rect.left + rect.width / 2, rect.top - 8);
      });
      chip.addEventListener("blur", function () {
        hideTooltip(tooltip);
      });
    });
  }

  function matchesStateFilter(abbr) {
    var data = getStateData(abbr);
    var hasProtection = data && data.cp;
    var query = appState.currentQuery.toLowerCase();
    var name = getStateName(abbr).toLowerCase();
    var matchesGroup = appState.currentFilter === "all" || (appState.currentFilter === "protection" && hasProtection) || (appState.currentFilter === "no-protection" && !hasProtection);
    var matchesQuery = !query || name.indexOf(query) >= 0 || abbr.toLowerCase().indexOf(query) >= 0;

    return matchesGroup && matchesQuery;
  }

  function updateListBlockVisibility() {
    var protectionBlock = document.getElementById("state-list-block-protection");
    var noProtectionBlock = document.getElementById("state-list-block-no-protection");
    var noResults = document.getElementById("state-no-results");
    var visibleProtection = 0;
    var visibleNoProtection = 0;

    document.querySelectorAll("#states-with-list .state-chip").forEach(function (chip) {
      if (!chip.hidden) visibleProtection += 1;
    });

    document.querySelectorAll("#states-without-list .state-chip").forEach(function (chip) {
      if (!chip.hidden) visibleNoProtection += 1;
    });

    if (protectionBlock) protectionBlock.hidden = visibleProtection === 0;
    if (noProtectionBlock) noProtectionBlock.hidden = visibleNoProtection === 0;
    if (noResults) noResults.hidden = visibleProtection + visibleNoProtection > 0;
  }

  function applyStateFilter() {
    var visibleCount = 0;

    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var abbr = chip.getAttribute("data-state");
      var shouldShow = matchesStateFilter(abbr);
      chip.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });

    updateListBlockVisibility();

    if (visibleCount === 0) {
      setFilterStatus("No states match the current search or filter.");
    } else if (appState.currentQuery || appState.currentFilter !== "all") {
      setFilterStatus("Showing " + visibleCount + " matching states.");
    } else {
      setFilterStatus("Showing all states.");
    }
  }

  function initStateFilter() {
    var searchInput = document.getElementById("state-search");
    var filterButtons = document.querySelectorAll(".state-filter-btn");

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        appState.currentQuery = searchInput.value.trim();
        applyStateFilter();
      });
    }

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

  function initCountUp() {
    var elements = document.querySelectorAll("[data-count-up]");
    var duration = config.countUpDuration || 1200;

    if (prefersReducedMotion()) {
      elements.forEach(function (element) {
        var target = parseFloat(element.getAttribute("data-count-up"));
        var decimals = parseInt(element.getAttribute("data-decimals"), 10) || 0;
        var suffix = element.getAttribute("data-suffix") || "";
        element.textContent = (decimals ? target.toFixed(decimals) : Math.round(target)) + suffix;
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
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
      observer.observe(element);
    });
  }

  function initScrollReveal() {
    var items = document.querySelectorAll(".scroll-reveal");

    if (prefersReducedMotion()) {
      items.forEach(function (item) {
        item.classList.add("revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initNavHighlight() {
    var sections = document.querySelectorAll("#what-is-340b, #overview, #state-laws, #eligibility, #oversight, #pa-impact, #community-benefit, #access, #pa-safeguards");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          updateNavCurrent(entry.target.id);
        }
      });
    }, { rootMargin: "-80px 0 -50% 0", threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initPrint() {
    var button = document.getElementById("btn-print");

    if (!button) return;

    button.addEventListener("click", function () {
      setUtilityStatus("Opening print dialog...");
      window.print();
      window.setTimeout(function () {
        setUtilityStatus("");
      }, 1500);
    });
  }

  function initShare() {
    var button = document.getElementById("btn-share");

    if (!button) return;

    button.addEventListener("click", function () {
      var url = location.href;

      setUtilityStatus("Copying link...");

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(function () {
            setUtilityStatus("Link copied.");
          })
          .catch(function () {
            window.prompt("Copy this link:", url);
            setUtilityStatus("Use the prompt to copy the link.");
          });
      } else {
        window.prompt("Copy this link:", url);
        setUtilityStatus("Use the prompt to copy the link.");
      }

      window.setTimeout(function () {
        setUtilityStatus("");
      }, 2500);
    });
  }

  function initMethodologyToggle() {
    var button = document.getElementById("methodology-toggle");
    var content = document.getElementById("methodology-content");

    if (!button || !content) return;

    button.addEventListener("click", function () {
      var isOpen = content.classList.toggle("open");
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function syncSelectionFromHash() {
    var hashState = getHashState();

    if (hashState) {
      selectState(hashState, { scrollToMap: true, focusPanel: true });
    } else if (appState.selectedStateAbbr) {
      clearSelection();
    }
  }

  function handleDocumentClick(event) {
    var panel = document.getElementById("state-detail-panel");

    if (!panel) return;
    if (event.target.closest("#us-map path") || event.target.closest(".state-chip") || event.target.closest("#state-detail-panel")) return;

    clearSelection();
  }

  function handleResize() {
    var map = document.getElementById("us-map");
    var width;

    if (appState.touchDevice || !map) return;

    width = map.offsetWidth;
    if (Math.abs(width - appState.lastMapWidth) < 40 && appState.lastMapWidth) return;

    appState.lastMapWidth = width;
    drawMap();
  }

  function init() {
    updateMetadata();
    validateStateData();
    renderEmptyStateDetail();
    renderStateChips();
    initStateFilter();
    drawMap();
    initCountUp();
    initScrollReveal();
    initNavHighlight();
    initPrint();
    initShare();
    initMethodologyToggle();
    syncSelectionFromHash();

    document.addEventListener("click", handleDocumentClick);
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
