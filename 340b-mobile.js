/* ═══════════════════════════════════════════════════
   HAP 340B Mobile App — JavaScript
   ═══════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Constants ── */
  var TABS = ["home", "map", "pa", "policy", "more"];
  var SHARE_URL = (typeof CONFIG !== "undefined" && CONFIG.shareUrlBase) || window.location.href;
  var SHARE_TITLE = (typeof CONFIG !== "undefined" && CONFIG.shareTitle) || "HAP 340B Dashboard";
  var SHARE_TEXT = (typeof CONFIG !== "undefined" && CONFIG.shareDescription) || "";

  /* ── State ── */
  var currentTab = "home";
  var previousTab = null;
  var mapDrawn = false;
  var selectedState = null;
  var currentFilter = "all";
  var touchStartX = 0;
  var touchStartY = 0;
  var isSwiping = false;
  var paDistrictLoaded = false;

  /* ── DOM Cache ── */
  var dom = {};

  function cacheDom() {
    dom.app = document.getElementById("app");
    dom.content = document.getElementById("app-content");
    dom.tabBar = document.getElementById("app-tab-bar");
    dom.tabBtns = dom.tabBar.querySelectorAll(".tab-btn");
    dom.tabPanels = document.querySelectorAll(".tab-panel");
    dom.toastContainer = document.getElementById("toast-container");
    dom.shareSheet = document.getElementById("share-sheet");
    dom.shareBackdrop = document.getElementById("share-backdrop");
    dom.stateSheet = document.getElementById("state-sheet");
    dom.sheetPanel = document.getElementById("sheet-panel");
    dom.sheetBackdrop = document.getElementById("sheet-backdrop");
    dom.sheetTitle = document.getElementById("sheet-title");
    dom.sheetBody = document.getElementById("sheet-body");
    dom.stateGrid = document.getElementById("state-grid");
    dom.searchInput = document.getElementById("state-search");
    dom.searchClear = document.getElementById("search-clear");
    dom.filterBar = document.getElementById("filter-bar");
    dom.mapContainer = document.getElementById("mobile-map");
  }

  /* ═══════════════════════════════════════════════════
     Initialization
     ═══════════════════════════════════════════════════ */

  function init() {
    cacheDom();
    populateCopy();
    initTabs();
    initSwipeNavigation();
    initScrollAnimations();
    initStateGrid();
    initSearch();
    initFilters();
    initShareHandlers();
    initBottomSheet();
    initCountUp();
    initOutcomes();
    initPaAsks();
    initFederalDelegation();
    initZipLookup();
    initStoryForm();
    initReportGenerator();
    initDataConnection();
    initPolicyAlert();

    document.getElementById("footer-year").textContent = new Date().getFullYear();

    requestAnimationFrame(function () {
      triggerAnimations("tab-home");
    });
  }

  /* ═══════════════════════════════════════════════════
     Copy Population (from CONFIG / state-data.js)
     ═══════════════════════════════════════════════════ */

  function safeText(el, text) {
    if (el && text != null) el.textContent = text;
  }

  function populateCopy() {
    if (typeof CONFIG === "undefined") return;
    var c = CONFIG.copy || {};
    safeText(document.getElementById("hero-lead"), c.overviewLead);
    safeText(document.getElementById("position-lead"), c.hapPositionLead);
    safeText(document.getElementById("data-freshness"), CONFIG.dataFreshness);
    safeText(document.getElementById("about-text"), c.overviewLead);
    /* Sources & limitations are hardcoded in HTML with linked citations */

    var es = c.executiveStrip || {};
    safeText(document.getElementById("exec-priority-label"), es.priorityLabel);
    safeText(document.getElementById("exec-priority-value"), es.priorityValue);
    safeText(document.getElementById("exec-priority-note"), es.priorityNote);
    safeText(document.getElementById("exec-landscape-label"), es.landscapeLabel);
    safeText(document.getElementById("exec-landscape-note"), es.landscapeNote);
    safeText(document.getElementById("exec-trust-label"), es.trustLabel);
    safeText(document.getElementById("exec-trust-value"), es.trustValue);
    safeText(document.getElementById("exec-trust-note"), es.trustNote);

    populateAsks();
    updateProtectionCounts();
  }

  function populateAsks() {
    if (typeof CONFIG === "undefined" || !CONFIG.copy || !CONFIG.copy.hapAskItems) return;
    var list = document.getElementById("ask-list");
    if (!list) return;
    var frag = document.createDocumentFragment();
    CONFIG.copy.hapAskItems.forEach(function (ask, i) {
      var item = document.createElement("div");
      item.className = "ask-item";
      var num = document.createElement("div");
      num.className = "ask-number";
      num.textContent = i + 1;
      var content = document.createElement("div");
      content.className = "ask-content";
      var label = document.createElement("div");
      label.className = "ask-label";
      label.textContent = ask.label;
      var impact = document.createElement("div");
      impact.className = "ask-impact";
      impact.textContent = ask.impactLine;
      content.appendChild(label);
      content.appendChild(impact);
      item.appendChild(num);
      item.appendChild(content);
      frag.appendChild(item);
    });
    list.appendChild(frag);
  }

  function updateProtectionCounts() {
    if (typeof STATES_WITH_PROTECTION === "undefined") return;
    var protectedCount = STATES_WITH_PROTECTION.filter(function (s) { return s !== "DC"; }).length;
    var unprotectedCount = 50 - protectedCount;
    var pbmCount = 0;
    if (typeof STATE_340B !== "undefined") {
      Object.keys(STATE_340B).forEach(function (abbr) {
        if (abbr === "DC") return;
        if (STATE_340B[abbr].pbm && !STATE_340B[abbr].cp) pbmCount++;
      });
    }

    safeText(document.getElementById("summary-protected"), protectedCount);
    safeText(document.getElementById("summary-unprotected"), unprotectedCount);
    safeText(document.getElementById("summary-pbm"), pbmCount);

    var kpiProt = document.getElementById("kpi-protected");
    var kpiUnprot = document.getElementById("kpi-unprotected");
    if (kpiProt) kpiProt.setAttribute("data-count", protectedCount);
    if (kpiUnprot) kpiUnprot.setAttribute("data-count", unprotectedCount);
  }

  /* ═══════════════════════════════════════════════════
     Tab Navigation
     ═══════════════════════════════════════════════════ */

  function initTabs() {
    dom.tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = this.getAttribute("data-tab");
        if (tab && tab !== currentTab) switchTab(tab);
      });
    });

    document.getElementById("btn-explore-map").addEventListener("click", function () {
      switchTab("map");
    });
    document.getElementById("btn-pa-focus").addEventListener("click", function () {
      switchTab("pa");
    });
  }

  function switchTab(tab) {
    if (tab === currentTab) return;
    var tabIndex = TABS.indexOf(tab);
    var currentIndex = TABS.indexOf(currentTab);
    if (tabIndex === -1) return;

    previousTab = currentTab;
    currentTab = tab;
    var goingForward = tabIndex > currentIndex;
    var exitClass = goingForward ? "exit-left" : "exit-right";

    dom.tabBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });

    dom.tabPanels.forEach(function (panel) {
      var panelTab = panel.getAttribute("data-tab");
      if (panelTab === tab) {
        panel.classList.remove("exit-left", "exit-right");
        panel.classList.add("active");
        panel.querySelector(".tab-scroll").scrollTop = 0;
      } else if (panelTab === previousTab) {
        panel.classList.remove("active");
        panel.classList.add(exitClass);
      } else {
        panel.classList.remove("active", "exit-left", "exit-right");
      }
    });

    triggerAnimations("tab-" + tab);

    if (tab === "map" && !mapDrawn) {
      requestAnimationFrame(function () {
        setTimeout(drawMap, 100);
      });
    }

    if (tab === "pa" && !paDistrictLoaded) {
      loadPaDistrictMap();
    }

    vibrate(10);
  }

  /* ═══════════════════════════════════════════════════
     Swipe Navigation
     ═══════════════════════════════════════════════════ */

  function initSwipeNavigation() {
    dom.content.addEventListener("touchstart", onTouchStart, { passive: true });
    dom.content.addEventListener("touchmove", onTouchMove, { passive: true });
    dom.content.addEventListener("touchend", onTouchEnd, { passive: true });
  }

  function onTouchStart(e) {
    if (isSheetOpen() || isShareOpen()) return;
    var touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = false;
  }

  function onTouchMove(e) {
    if (isSheetOpen() || isShareOpen()) return;
    var touch = e.touches[0];
    var dx = touch.clientX - touchStartX;
    var dy = touch.clientY - touchStartY;
    if (!isSwiping && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      isSwiping = true;
    }
  }

  function onTouchEnd(e) {
    if (!isSwiping) return;
    var touch = e.changedTouches[0];
    var dx = touch.clientX - touchStartX;
    var minSwipe = 60;
    if (Math.abs(dx) < minSwipe) return;

    var idx = TABS.indexOf(currentTab);
    if (dx < 0 && idx < TABS.length - 1) {
      switchTab(TABS[idx + 1]);
    } else if (dx > 0 && idx > 0) {
      switchTab(TABS[idx - 1]);
    }
    isSwiping = false;
  }

  /* ═══════════════════════════════════════════════════
     Scroll-Triggered Animations
     ═══════════════════════════════════════════════════ */

  function initScrollAnimations() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".anim-in").forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".anim-in").forEach(function (el) {
      observer.observe(el);
    });
  }

  function triggerAnimations(panelId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var items = panel.querySelectorAll(".anim-in");
    items.forEach(function (el, i) {
      el.classList.remove("visible");
      el.style.transitionDelay = (i * 0.05) + "s";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) {
          el.classList.add("visible");
        });
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     Count-Up Animation
     ═══════════════════════════════════════════════════ */

  function initCountUp() {
    if (!("IntersectionObserver" in window)) {
      runAllCountUps();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCountUp(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll("[data-count]").forEach(function (el) {
      observer.observe(el);
    });
  }

  function animateCountUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1200;
    var start = performance.now();

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeOutExpo(progress);
      var current = target * easedProgress;
      el.textContent = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.round(current)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function runAllCountUps() {
    document.querySelectorAll("[data-count]").forEach(animateCountUp);
  }

  /* ═══════════════════════════════════════════════════
     State Grid
     ═══════════════════════════════════════════════════ */

  function initStateGrid() {
    if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined") return;
    var grid = dom.stateGrid;
    if (!grid) return;

    var sortedStates = Object.keys(STATE_NAMES)
      .filter(function (abbr) { return abbr !== "DC"; })
      .sort(function (a, b) {
        return STATE_NAMES[a].localeCompare(STATE_NAMES[b]);
      });

    var frag = document.createDocumentFragment();
    sortedStates.forEach(function (abbr, i) {
      var data = STATE_340B[abbr] || {};
      var status = data.cp ? "Protected" : data.pbm ? "PBM only" : "No protection";
      var dotClass = data.cp ? "cp" : data.pbm ? "pbm" : "none";

      var card = document.createElement("div");
      card.className = "state-card";
      card.setAttribute("data-state", abbr);
      card.setAttribute("data-cp", data.cp ? "1" : "0");
      card.setAttribute("data-pbm", data.pbm ? "1" : "0");
      card.style.animationDelay = (i * 0.03) + "s";

      card.innerHTML =
        '<span class="state-dot ' + dotClass + '"></span>' +
        '<div class="state-card-info">' +
          '<div class="state-card-name">' + safeEscape(STATE_NAMES[abbr]) + '</div>' +
          '<div class="state-card-status">' + safeEscape(status) + '</div>' +
        '</div>' +
        '<svg class="state-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';

      card.addEventListener("click", function () {
        openStateSheet(abbr);
      });

      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  function safeEscape(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ═══════════════════════════════════════════════════
     Search
     ═══════════════════════════════════════════════════ */

  function initSearch() {
    if (!dom.searchInput || !dom.searchClear) return;

    dom.searchInput.addEventListener("input", function () {
      var query = this.value.trim().toLowerCase();
      dom.searchClear.classList.toggle("hidden", query.length === 0);
      filterStateCards(query, currentFilter);
    });

    dom.searchClear.addEventListener("click", function () {
      dom.searchInput.value = "";
      dom.searchClear.classList.add("hidden");
      filterStateCards("", currentFilter);
      dom.searchInput.focus();
    });
  }

  function filterStateCards(query, filter) {
    if (!dom.stateGrid) return;
    var cards = dom.stateGrid.querySelectorAll(".state-card");
    cards.forEach(function (card) {
      var abbr = card.getAttribute("data-state");
      var name = (STATE_NAMES[abbr] || "").toLowerCase();
      var isCP = card.getAttribute("data-cp") === "1";
      var isPBM = card.getAttribute("data-pbm") === "1";

      var matchesSearch = !query || name.indexOf(query) !== -1 || abbr.toLowerCase().indexOf(query) !== -1;
      var matchesFilter = filter === "all" ||
        (filter === "protected" && isCP) ||
        (filter === "unprotected" && !isCP && !isPBM) ||
        (filter === "pbm" && isPBM && !isCP);

      card.classList.toggle("filtered-out", !(matchesSearch && matchesFilter));
    });
  }

  /* ═══════════════════════════════════════════════════
     Filters
     ═══════════════════════════════════════════════════ */

  function initFilters() {
    if (!dom.filterBar) return;

    dom.filterBar.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;

      var allChips = dom.filterBar.querySelectorAll(".filter-chip");
      allChips.forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");

      currentFilter = chip.getAttribute("data-filter");
      var query = dom.searchInput ? dom.searchInput.value.trim().toLowerCase() : "";
      filterStateCards(query, currentFilter);
      updateMapFilter(currentFilter);
      vibrate(10);
    });
  }

  function updateMapFilter(filter) {
    if (!dom.mapContainer) return;
    var paths = dom.mapContainer.querySelectorAll("path.state");
    paths.forEach(function (path) {
      var abbr = path.getAttribute("data-state");
      if (!abbr || typeof STATE_340B === "undefined") return;
      var data = STATE_340B[abbr] || {};
      var show = filter === "all" ||
        (filter === "protected" && data.cp) ||
        (filter === "unprotected" && !data.cp && !data.pbm) ||
        (filter === "pbm" && data.pbm && !data.cp);
      path.classList.toggle("dimmed", !show);
    });
  }

  /* ═══════════════════════════════════════════════════
     D3 Map
     ═══════════════════════════════════════════════════ */

  function drawMap() {
    if (mapDrawn) return;
    if (typeof d3 === "undefined" || typeof topojson === "undefined") return;
    var usData = window.US_ATLAS_STATES_10M || window.us;
    if (!usData) return;
    mapDrawn = true;

    var container = dom.mapContainer;
    if (!container) return;
    var width = container.clientWidth;
    var height = Math.round(width * 0.6);

    var svg = d3.select(container)
      .append("svg")
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto");

    var projection = d3.geoAlbersUsa()
      .fitSize([width - 16, height - 16], topojson.feature(usData, usData.objects.states));

    var path = d3.geoPath().projection(projection);

    var states = topojson.feature(usData, usData.objects.states).features;

    svg.selectAll("path.state")
      .data(states)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("data-state", function (d) {
        return fipsToAbbr(d.id);
      })
      .attr("fill", function (d) {
        return getStateColor(fipsToAbbr(d.id));
      })
      .style("opacity", 0)
      .on("mouseenter", function (event, d) {
        var abbr = fipsToAbbr(d.id);
        if (abbr) {
          this.classList.add("highlighted");
          showMapTooltip(abbr, event.clientX, event.clientY);
        }
      })
      .on("mousemove", function (event, d) {
        var abbr = fipsToAbbr(d.id);
        if (abbr) showMapTooltip(abbr, event.clientX, event.clientY);
      })
      .on("mouseleave", function () {
        this.classList.remove("highlighted");
        hideMapTooltip();
      })
      .on("touchstart", function (event, d) {
        var abbr = fipsToAbbr(d.id);
        if (abbr) {
          this.classList.add("highlighted");
          var touch = event.touches[0];
          showMapTooltip(abbr, touch.clientX, touch.clientY);
        }
      }, { passive: true })
      .on("click", function (event, d) {
        hideMapTooltip();
        var abbr = fipsToAbbr(d.id);
        if (abbr) {
          selectMapState(abbr);
          openStateSheet(abbr);
        }
      })
      .transition()
      .delay(function (d, i) { return i * 25; })
      .duration(400)
      .style("opacity", 1);

    svg.append("path")
      .datum(topojson.mesh(usData, usData.objects.states, function (a, b) { return a !== b; }))
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .attr("stroke-linejoin", "round")
      .attr("d", path);
  }

  function fipsToAbbr(id) {
    if (id == null || typeof FIPS_TO_ABBR === "undefined") return "";
    var num = parseInt(id, 10);
    return FIPS_TO_ABBR[!isNaN(num) ? num : id] || FIPS_TO_ABBR[String(id)] || "";
  }

  function getStateColor(abbr) {
    if (!abbr || typeof STATE_340B === "undefined") return "#d3d9d4";
    var data = STATE_340B[abbr];
    if (!data) return "#d3d9d4";
    if (data.cp) return "#0072bc";
    if (data.pbm) return "#8ed8f8";
    return "#d3d9d4";
  }

  /* ── Map Tooltip ── */

  var mapTooltipEl = null;
  var tooltipHideTimer = null;

  function getMapTooltip() {
    if (!mapTooltipEl) mapTooltipEl = document.getElementById("map-tooltip");
    return mapTooltipEl;
  }

  function buildTooltipContent(abbr) {
    var tip = getMapTooltip();
    if (!tip) return;
    while (tip.firstChild) tip.removeChild(tip.firstChild);

    var name = document.createElement("div");
    name.className = "map-tooltip-name";
    name.textContent = (typeof STATE_NAMES !== "undefined" && STATE_NAMES[abbr]) || abbr;
    tip.appendChild(name);

    if (typeof STATE_340B !== "undefined") {
      var data = STATE_340B[abbr] || {};
      var statusEl = document.createElement("div");
      statusEl.className = "map-tooltip-status " +
        (data.cp ? "status-cp" : data.pbm ? "status-pbm" : "status-none");
      statusEl.textContent = data.cp ? "Contract pharmacy protection" : data.pbm ? "PBM regulation" : "No protection enacted";
      tip.appendChild(statusEl);

      if (data.y) {
        var detail = document.createElement("div");
        detail.className = "map-tooltip-detail";
        detail.textContent = "Law year: " + data.y;
        tip.appendChild(detail);
      }
      if (data.notes) {
        var note = document.createElement("div");
        note.className = "map-tooltip-detail";
        note.textContent = data.notes;
        tip.appendChild(note);
      }
    }
  }

  function showMapTooltip(abbr, x, y) {
    clearTimeout(tooltipHideTimer);
    var tip = getMapTooltip();
    if (!tip) return;
    buildTooltipContent(abbr);

    var container = document.getElementById("map-container");
    if (!container) return;
    var rect = container.getBoundingClientRect();
    var left = x - rect.left + 12;
    var top = y - rect.top + 12;

    var maxLeft = container.clientWidth - 230;
    if (left > maxLeft) left = x - rect.left - 180;
    if (top > container.clientHeight - 80) top = y - rect.top - 70;
    if (left < 4) left = 4;
    if (top < 4) top = 4;

    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.classList.add("visible");
    tip.setAttribute("aria-hidden", "false");
  }

  function hideMapTooltip() {
    tooltipHideTimer = setTimeout(function () {
      var tip = getMapTooltip();
      if (tip) {
        tip.classList.remove("visible");
        tip.setAttribute("aria-hidden", "true");
      }
    }, 120);
  }

  function selectMapState(abbr) {
    if (!dom.mapContainer) return;
    var paths = dom.mapContainer.querySelectorAll("path.state");
    paths.forEach(function (p) {
      p.classList.toggle("selected", p.getAttribute("data-state") === abbr);
    });
    selectedState = abbr;
  }

  /* ═══════════════════════════════════════════════════
     Bottom Sheet (State Detail)
     ═══════════════════════════════════════════════════ */

  function initBottomSheet() {
    document.getElementById("sheet-close").addEventListener("click", closeStateSheet);
    dom.sheetBackdrop.addEventListener("click", closeStateSheet);

    var panel = dom.sheetPanel;
    var startY = 0;
    var currentY = 0;

    panel.addEventListener("touchstart", function (e) {
      var target = e.target.closest(".sheet-handle-bar");
      if (!target) return;
      startY = e.touches[0].clientY;
    }, { passive: true });

    panel.addEventListener("touchmove", function (e) {
      if (startY === 0) return;
      currentY = e.touches[0].clientY - startY;
      if (currentY > 0) {
        panel.style.transform = "translateY(" + currentY + "px)";
        panel.style.transition = "none";
      }
    }, { passive: true });

    panel.addEventListener("touchend", function () {
      if (currentY > 100) {
        closeStateSheet();
      } else {
        panel.style.transform = "";
        panel.style.transition = "";
      }
      startY = 0;
      currentY = 0;
    }, { passive: true });
  }

  function openStateSheet(abbr) {
    if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined") return;
    var data = STATE_340B[abbr];
    if (!data) return;

    selectedState = abbr;
    selectMapState(abbr);

    dom.sheetTitle.textContent = STATE_NAMES[abbr] || abbr;

    var statusText = data.cp ? "Contract pharmacy protection" : data.pbm ? "PBM regulation only" : "No protection enacted";
    var statusClass = data.cp ? "protected" : "unprotected";

    var html = '<div class="sheet-section">' +
      '<div class="sheet-status-badge ' + statusClass + '">' +
        '<span class="state-dot ' + (data.cp ? 'cp' : data.pbm ? 'pbm' : 'none') + '"></span>' +
        safeEscape(statusText) +
      '</div>' +
    '</div>';

    html += '<div class="sheet-section"><div class="sheet-stat-row">';
    html += '<div class="sheet-stat"><div class="sheet-stat-value">' + (data.y || "—") + '</div><div class="sheet-stat-label">Year enacted</div></div>';
    html += '<div class="sheet-stat"><div class="sheet-stat-value">' + (data.cp ? "Yes" : "No") + '</div><div class="sheet-stat-label">Contract pharmacy</div></div>';
    html += '<div class="sheet-stat"><div class="sheet-stat-value">' + (data.pbm ? "Yes" : "No") + '</div><div class="sheet-stat-label">PBM regulation</div></div>';
    html += '</div></div>';

    if (data.notes) {
      html += '<div class="sheet-section"><div class="sheet-section-title">Notes</div>' +
        '<div class="sheet-notes">' + safeEscape(data.notes) + '</div></div>';
    }

    if (abbr === "PA") {
      html += '<div class="sheet-section"><div class="sheet-section-title">HAP Focus State</div>' +
        '<div class="sheet-notes">Pennsylvania is HAP\'s home state. 72 hospitals rely on 340B to serve patients. Legislation is in progress to enact contract pharmacy protection.</div></div>';
    }

    dom.sheetBody.innerHTML = html;
    dom.stateSheet.classList.add("open");
    dom.sheetPanel.style.transform = "";
    dom.sheetPanel.style.transition = "";
    document.body.style.overflow = "hidden";
    vibrate(15);
  }

  function closeStateSheet() {
    dom.stateSheet.classList.remove("open");
    document.body.style.overflow = "";
    selectedState = null;

    if (dom.mapContainer) {
      dom.mapContainer.querySelectorAll("path.state.selected").forEach(function (p) {
        p.classList.remove("selected");
      });
    }
  }

  function isSheetOpen() {
    return dom.stateSheet && dom.stateSheet.classList.contains("open");
  }

  /* ═══════════════════════════════════════════════════
     Outcomes (Policy Tab)
     ═══════════════════════════════════════════════════ */

  function initOutcomes() {
    if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined") return;

    var upheld = [];
    var hybrid = [];
    var vetoed = [];

    Object.keys(STATE_340B).forEach(function (abbr) {
      if (abbr === "DC") return;
      var notes = (STATE_340B[abbr].notes || "").toLowerCase();
      if (notes.indexOf("upheld") !== -1) upheld.push(STATE_NAMES[abbr]);
      if (notes.indexOf("hybrid") !== -1 || notes.indexOf("reporting") !== -1) hybrid.push(STATE_NAMES[abbr]);
      if (notes.indexOf("veto") !== -1) vetoed.push(STATE_NAMES[abbr]);
    });

    safeText(document.getElementById("outcome-upheld"), upheld.join(", ") || "None recorded");
    safeText(document.getElementById("outcome-hybrid"), hybrid.join(", ") || "None recorded");
    safeText(document.getElementById("outcome-vetoed"), vetoed.join(", ") || "None recorded");
  }

  /* ═══════════════════════════════════════════════════
     PA Asks (reuse from CONFIG)
     ═══════════════════════════════════════════════════ */

  function initPaAsks() {
    if (typeof CONFIG === "undefined" || !CONFIG.copy || !CONFIG.copy.hapAskItems) return;
    var container = document.getElementById("pa-asks");
    if (!container) return;
    var frag = document.createDocumentFragment();
    CONFIG.copy.hapAskItems.forEach(function (ask, i) {
      var card = document.createElement("div");
      card.className = "exec-card";
      card.setAttribute("data-topic", ["policy", "access", "finance"][i] || "policy");
      card.innerHTML =
        '<div class="exec-eyebrow">Ask ' + (i + 1) + '</div>' +
        '<div class="exec-value">' + safeEscape(ask.label) + '</div>' +
        '<div class="exec-note">' + safeEscape(ask.impactLine) + '</div>';
      frag.appendChild(card);
    });
    container.appendChild(frag);
  }

  /* ═══════════════════════════════════════════════════
     Share Handlers
     ═══════════════════════════════════════════════════ */

  function initShareHandlers() {
    var shareBtns = [
      document.getElementById("btn-header-share"),
      document.getElementById("btn-share-dash")
    ];

    shareBtns.forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (navigator.share) {
          navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL }).catch(function () {});
        } else {
          openShareSheet();
        }
      });
    });

    document.getElementById("share-cancel").addEventListener("click", closeShareSheet);
    dom.shareBackdrop.addEventListener("click", closeShareSheet);

    var shareOptions = document.querySelectorAll(".share-option");
    shareOptions.forEach(function (opt) {
      opt.addEventListener("click", function () {
        var type = this.getAttribute("data-share");
        handleShare(type);
      });
    });

    var copyBtn = document.getElementById("btn-copy-link");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyToClipboard(SHARE_URL);
      });
    }
  }

  function openShareSheet() {
    dom.shareSheet.classList.remove("hidden");
    vibrate(10);
  }

  function closeShareSheet() {
    dom.shareSheet.classList.add("hidden");
  }

  function isShareOpen() {
    return dom.shareSheet && !dom.shareSheet.classList.contains("hidden");
  }

  function handleShare(type) {
    var encodedUrl = encodeURIComponent(SHARE_URL);
    var encodedText = encodeURIComponent(SHARE_TEXT);
    switch (type) {
      case "copy":
        copyToClipboard(SHARE_URL);
        break;
      case "email":
        window.open("mailto:?subject=" + encodeURIComponent(SHARE_TITLE) + "&body=" + encodedText + "%0A%0A" + encodedUrl);
        break;
      case "x":
        window.open("https://twitter.com/intent/tweet?text=" + encodedText + "&url=" + encodedUrl, "_blank");
        break;
      case "linkedin":
        window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl, "_blank");
        break;
    }
    closeShareSheet();
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("Link copied");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast("Link copied");
    } catch (e) {
      showToast("Could not copy");
    }
    document.body.removeChild(ta);
  }

  /* ═══════════════════════════════════════════════════
     Toast Notifications
     ═══════════════════════════════════════════════════ */

  function showToast(message) {
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);
    vibrate(10);

    setTimeout(function () {
      toast.classList.add("exit");
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2200);
  }

  /* ═══════════════════════════════════════════════════
     Haptic Feedback
     ═══════════════════════════════════════════════════ */

  function vibrate(ms) {
    if (navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) { /* noop */ }
    }
  }

  /* ═══════════════════════════════════════════════════
     KPI Carousel Dots
     ═══════════════════════════════════════════════════ */

  (function initCarouselDots() {
    document.addEventListener("DOMContentLoaded", function () {
      var track = document.querySelector(".kpi-track");
      var dotsContainer = document.getElementById("kpi-dots");
      if (!track || !dotsContainer) return;

      var cards = track.querySelectorAll(".kpi-card");
      var numDots = Math.ceil(cards.length / 2);
      for (var i = 0; i < numDots; i++) {
        var dot = document.createElement("div");
        dot.className = "carousel-dot" + (i === 0 ? " active" : "");
        dotsContainer.appendChild(dot);
      }

      var dots = dotsContainer.querySelectorAll(".carousel-dot");

      track.addEventListener("scroll", function () {
        var scrollLeft = track.scrollLeft;
        var cardWidth = cards[0].offsetWidth + 12;
        var activeIndex = Math.round(scrollLeft / (cardWidth * 2));
        activeIndex = Math.max(0, Math.min(activeIndex, dots.length - 1));
        dots.forEach(function (d, idx) {
          d.classList.toggle("active", idx === activeIndex);
        });
      }, { passive: true });
    });
  })();

  /* ═══════════════════════════════════════════════════
     Federal Delegation
     ═══════════════════════════════════════════════════ */

  window._PA_DELEGATION_DATA = [
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
  var PA_DELEGATION = window._PA_DELEGATION_DATA;

  var POSITION_LABELS = {
    cosponsor: "Cosponsor", supportive: "Supportive",
    unknown: "Unknown", opposed: "Opposed"
  };

  function initFederalDelegation() {
    var list = document.getElementById("fed-card-list");
    if (!list) return;

    var frag = document.createDocumentFragment();
    PA_DELEGATION.forEach(function (row) {
      var card = document.createElement("div");
      card.className = "fed-card";
      card.setAttribute("data-position", row.position || "unknown");

      var top = document.createElement("div");
      top.className = "fed-card-top";

      var name = document.createElement("div");
      name.className = "fed-card-name";
      name.textContent = row.member;

      var badge = document.createElement("span");
      badge.className = "leg-badge leg-badge--" + (row.position || "unknown");
      badge.textContent = POSITION_LABELS[row.position] || "Unknown";

      top.appendChild(name);
      top.appendChild(badge);

      var meta = document.createElement("div");
      meta.className = "fed-card-meta";
      meta.textContent = row.chamber + " · " + row.district + " · " + row.party;

      var bottom = document.createElement("div");
      bottom.className = "fed-card-bottom";

      var action = document.createElement("span");
      action.textContent = row.action;

      var contact = document.createElement("span");
      contact.className = "fed-card-contact";
      contact.textContent = "Last: " + row.lastContact;

      bottom.appendChild(action);
      bottom.appendChild(contact);

      card.appendChild(top);
      card.appendChild(meta);
      card.appendChild(bottom);
      frag.appendChild(card);
    });
    list.appendChild(frag);

    var filterBar = document.getElementById("fed-filter-bar");
    if (!filterBar) return;
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".fed-filter-btn");
      if (!btn) return;

      filterBar.querySelectorAll(".fed-filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var filter = btn.getAttribute("data-fed-filter");
      list.querySelectorAll(".fed-card").forEach(function (card) {
        var pos = card.getAttribute("data-position");
        card.classList.toggle("filtered-out", filter !== "all" && pos !== filter);
      });
      vibrate(10);
    });
  }

  /* ═══════════════════════════════════════════════════
     ZIP Code Legislator Lookup
     ═══════════════════════════════════════════════════ */

  function initZipLookup() {
    var form = document.getElementById("zip-lookup-form");
    var input = document.getElementById("zip-lookup-input");
    var status = document.getElementById("zip-lookup-status");
    if (!form || !input || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var zip = input.value.replace(/[^0-9]/g, "");

      if (zip.length !== 5) {
        status.textContent = "Enter a valid 5-digit ZIP code.";
        status.className = "zip-lookup-status is-error";
        return;
      }

      status.textContent = "Looking up legislators for ZIP " + zip + "…";
      status.className = "zip-lookup-status";

      window.dispatchEvent(new CustomEvent("hap:pa-district-zip-lookup", {
        detail: { zip: zip }
      }));

      var fedMatches = PA_DELEGATION.filter(function (row) {
        return row.chamber === "Senate" || row.district === "Statewide";
      }).map(function (row) {
        return row.member + " (" + row.party + ", " + row.chamber + ")";
      });

      var msg = "ZIP " + zip + " — PA Senators: " + fedMatches.join(", ") + ".";
      msg += " House member: check the district map on PA Focus for your specific representative.";
      status.textContent = msg;
      status.className = "zip-lookup-status";
    });
  }

  /* ═══════════════════════════════════════════════════
     PA District Map — Lazy Loader
     ═══════════════════════════════════════════════════ */

  function loadPaDistrictMap() {
    if (paDistrictLoaded) return;
    paDistrictLoaded = true;

    var script = document.createElement("script");
    script.src = "modules/pa-district-map.js";
    script.onload = function () {
      setTimeout(function () {
        window.dispatchEvent(new Event("resize"));
      }, 300);
    };
    document.body.appendChild(script);
  }

  /* ═══════════════════════════════════════════════════
     Story Submission Form (Phase 3)
     ═══════════════════════════════════════════════════ */

  var PA_COUNTIES = [
    "Adams","Allegheny","Armstrong","Beaver","Bedford","Berks","Blair","Bradford",
    "Bucks","Butler","Cambria","Cameron","Carbon","Centre","Chester","Clarion",
    "Clearfield","Clinton","Columbia","Crawford","Cumberland","Dauphin","Delaware",
    "Elk","Erie","Fayette","Forest","Franklin","Fulton","Greene","Huntingdon",
    "Indiana","Jefferson","Juniata","Lackawanna","Lancaster","Lawrence","Lebanon",
    "Lehigh","Luzerne","Lycoming","McKean","Mercer","Mifflin","Monroe","Montgomery",
    "Montour","Northampton","Northumberland","Perry","Philadelphia","Pike","Potter",
    "Schuylkill","Snyder","Somerset","Sullivan","Susquehanna","Tioga","Union",
    "Venango","Warren","Washington","Wayne","Westmoreland","Wyoming","York"
  ];

  function initStoryForm() {
    var form = document.getElementById("story-form");
    var countySelect = document.getElementById("story-county");
    var textArea = document.getElementById("story-text");
    var charCount = document.getElementById("story-char-count");
    var feedback = document.getElementById("story-feedback");
    if (!form || !countySelect) return;

    PA_COUNTIES.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c + " County";
      countySelect.appendChild(opt);
    });

    if (textArea && charCount) {
      textArea.addEventListener("input", function () {
        charCount.textContent = this.value.length + " / 500";
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hospital = document.getElementById("story-hospital");
      var category = document.getElementById("story-category");
      var email = document.getElementById("story-email");

      if (!hospital.value.trim() || !countySelect.value || !category.value || !textArea.value.trim()) {
        feedback.textContent = "Please fill in all required fields.";
        feedback.className = "story-feedback is-error";
        return;
      }

      var payload = {
        hospital: hospital.value.trim(),
        county: countySelect.value,
        category: category.value,
        story: textArea.value.trim(),
        email: email ? email.value.trim() : "",
        timestamp: new Date().toISOString(),
        version: 1
      };

      if (typeof DataLayer !== "undefined" && DataLayer.submitStory) {
        DataLayer.submitStory(payload).then(function (result) {
          feedback.className = "story-feedback is-success";
          feedback.textContent = "Story submitted. Thank you for sharing!";

          var copyBtn = document.createElement("button");
          copyBtn.type = "button";
          copyBtn.className = "story-copy-btn";
          copyBtn.textContent = "Copy JSON";
          copyBtn.addEventListener("click", function () {
            copyToClipboard(JSON.stringify(payload, null, 2));
            showToast("Story JSON copied");
          });
          feedback.appendChild(copyBtn);

          form.reset();
          if (charCount) charCount.textContent = "0 / 500";
        });
      } else {
        showToast("Story saved");
        feedback.className = "story-feedback is-success";
        feedback.textContent = "Story submitted locally.";
        form.reset();
        if (charCount) charCount.textContent = "0 / 500";
      }

      vibrate(15);
    });
  }

  /* ═══════════════════════════════════════════════════
     Advocacy Report Generator (Phase 5)
     ═══════════════════════════════════════════════════ */

  function initReportGenerator() {
    var typeSelect = document.getElementById("report-type");
    var statesField = document.getElementById("report-states-field");
    var statesSelect = document.getElementById("report-states");
    var btnPdf = document.getElementById("btn-gen-pdf");
    var btnCsv = document.getElementById("btn-gen-csv");
    if (!typeSelect || !btnPdf || !btnCsv) return;

    if (statesSelect && typeof STATE_NAMES !== "undefined") {
      Object.keys(STATE_NAMES)
        .filter(function (a) { return a !== "DC"; })
        .sort(function (a, b) { return STATE_NAMES[a].localeCompare(STATE_NAMES[b]); })
        .forEach(function (abbr) {
          var opt = document.createElement("option");
          opt.value = abbr;
          opt.textContent = STATE_NAMES[abbr];
          statesSelect.appendChild(opt);
        });
    }

    typeSelect.addEventListener("change", function () {
      if (statesField) {
        statesField.hidden = this.value !== "state-comparison";
      }
    });

    btnPdf.addEventListener("click", function () {
      generateReport(typeSelect.value);
    });

    btnCsv.addEventListener("click", function () {
      downloadCsv(typeSelect.value);
    });
  }

  function generateReport(type) {
    var report = document.createElement("div");
    report.className = "print-report";
    report.id = "print-report";

    var title = document.createElement("h1");
    title.textContent = "HAP 340B Advocacy Report";
    report.appendChild(title);

    var dateLine = document.createElement("p");
    dateLine.textContent = "Generated: " + new Date().toLocaleDateString() +
      " | Data as of: " + ((typeof CONFIG !== "undefined" && CONFIG.dataFreshness) || "March 2026");
    report.appendChild(dateLine);

    if (type === "full" || type === "pa-one-pager") {
      var kpiH2 = document.createElement("h2");
      kpiH2.textContent = "Key Metrics";
      report.appendChild(kpiH2);

      var kpiTable = document.createElement("table");
      var protCount = 0;
      if (typeof STATES_WITH_PROTECTION !== "undefined") {
        protCount = STATES_WITH_PROTECTION.filter(function (s) { return s !== "DC"; }).length;
      }
      kpiTable.innerHTML =
        "<thead><tr><th>Metric</th><th>Value</th><th>Why It Matters</th></tr></thead>" +
        "<tbody>" +
        "<tr><td>PA 340B Hospitals</td><td>72</td><td>Rely on 340B to serve patients</td></tr>" +
        "<tr><td>Community Benefit</td><td>$7.95B</td><td>Reported by 340B hospitals (2024)</td></tr>" +
        "<tr><td>States Protected</td><td>" + protCount + "</td><td>Contract pharmacy laws enacted</td></tr>" +
        "<tr><td>States Without</td><td>" + (50 - protCount) + "</td><td>No contract pharmacy protection</td></tr>" +
        "</tbody>";
      report.appendChild(kpiTable);
    }

    if (type === "full" || type === "state-comparison") {
      var stateH2 = document.createElement("h2");
      stateH2.textContent = "State Protection Status";
      report.appendChild(stateH2);

      var selected = [];
      var statesSelect = document.getElementById("report-states");
      if (type === "state-comparison" && statesSelect) {
        for (var i = 0; i < statesSelect.selectedOptions.length; i++) {
          selected.push(statesSelect.selectedOptions[i].value);
        }
      }

      if (typeof STATE_340B !== "undefined" && typeof STATE_NAMES !== "undefined") {
        var stateTable = document.createElement("table");
        var rows = "<thead><tr><th>State</th><th>Contract Pharmacy</th><th>PBM Law</th><th>Year</th><th>Notes</th></tr></thead><tbody>";
        Object.keys(STATE_NAMES)
          .filter(function (a) { return a !== "DC" && (selected.length === 0 || selected.indexOf(a) !== -1); })
          .sort(function (a, b) { return STATE_NAMES[a].localeCompare(STATE_NAMES[b]); })
          .forEach(function (abbr) {
            var s = STATE_340B[abbr] || {};
            rows += "<tr><td>" + safeEscape(STATE_NAMES[abbr]) + "</td>" +
              "<td>" + (s.cp ? "Yes" : "No") + "</td>" +
              "<td>" + (s.pbm ? "Yes" : "No") + "</td>" +
              "<td>" + (s.y || "—") + "</td>" +
              "<td>" + safeEscape(s.notes || "") + "</td></tr>";
          });
        rows += "</tbody>";
        stateTable.innerHTML = rows;
        report.appendChild(stateTable);
      }
    }

    if (type === "pa-one-pager") {
      var paH2 = document.createElement("h2");
      paH2.textContent = "Pennsylvania Focus";
      report.appendChild(paH2);

      var paTable = document.createElement("table");
      paTable.innerHTML =
        "<thead><tr><th>Stat</th><th>Value</th></tr></thead><tbody>" +
        "<tr><td>340B Hospitals</td><td>72</td></tr>" +
        "<tr><td>Rural Hospitals</td><td>38%</td></tr>" +
        "<tr><td>Operating at a Loss</td><td>63%</td></tr>" +
        "<tr><td>L&D Services</td><td>95%</td></tr>" +
        "<tr><td>HRSA Hospital Audits (FY24)</td><td>179</td></tr>" +
        "<tr><td>Manufacturer Audits (FY24)</td><td>5</td></tr>" +
        "</tbody>";
      report.appendChild(paTable);
    }

    var footer = document.createElement("div");
    footer.className = "print-footer";
    footer.textContent = "Source: HAP 340B Advocacy Dashboard — " +
      ((typeof CONFIG !== "undefined" && CONFIG.shareUrlBase) || window.location.href) +
      " | The Hospital and Healthsystem Association of Pennsylvania";
    report.appendChild(footer);

    var existing = document.getElementById("print-report");
    if (existing) existing.parentNode.removeChild(existing);

    report.style.display = "none";
    document.body.appendChild(report);

    var panels = document.querySelectorAll(".tab-panel");
    panels.forEach(function (p) { p.classList.add("print-target"); });
    report.style.display = "block";

    window.print();

    setTimeout(function () {
      report.style.display = "none";
      panels.forEach(function (p) { p.classList.remove("print-target"); });
      document.body.removeChild(report);
    }, 1000);
  }

  function downloadCsv(type) {
    var rows = [];

    if (type === "full" || type === "state-comparison") {
      rows.push(["State", "Abbreviation", "Contract Pharmacy", "PBM Law", "Year Enacted", "Notes"]);
      var selected = [];
      var statesSelect = document.getElementById("report-states");
      if (type === "state-comparison" && statesSelect) {
        for (var i = 0; i < statesSelect.selectedOptions.length; i++) {
          selected.push(statesSelect.selectedOptions[i].value);
        }
      }
      if (typeof STATE_340B !== "undefined" && typeof STATE_NAMES !== "undefined") {
        Object.keys(STATE_NAMES)
          .filter(function (a) { return a !== "DC" && (selected.length === 0 || selected.indexOf(a) !== -1); })
          .sort(function (a, b) { return STATE_NAMES[a].localeCompare(STATE_NAMES[b]); })
          .forEach(function (abbr) {
            var s = STATE_340B[abbr] || {};
            rows.push([
              STATE_NAMES[abbr], abbr,
              s.cp ? "Yes" : "No",
              s.pbm ? "Yes" : "No",
              s.y || "",
              (s.notes || "").replace(/"/g, '""')
            ]);
          });
      }
    } else if (type === "pa-one-pager") {
      rows.push(["Metric", "Value"]);
      rows.push(["PA 340B Hospitals", "72"]);
      rows.push(["Rural Hospitals", "38%"]);
      rows.push(["Operating at a Loss", "63%"]);
      rows.push(["L&D Services", "95%"]);
      rows.push(["HRSA Hospital Audits FY24", "179"]);
      rows.push(["Manufacturer Audits FY24", "5"]);
      rows.push(["Community Benefit", "$7.95B"]);
    }

    if (rows.length === 0) return;

    var csv = rows.map(function (r) {
      return r.map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "hap-340b-report-" + new Date().toISOString().slice(0, 10) + ".csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
    showToast("CSV downloaded");
  }

  /* ═══════════════════════════════════════════════════
     Data Connection Status (Phase 6)
     ═══════════════════════════════════════════════════ */

  function initDataConnection() {
    var dot = document.getElementById("data-conn-dot");
    var label = document.getElementById("data-conn-label");
    var detail = document.getElementById("data-conn-detail");
    var freshness = document.getElementById("data-conn-freshness");

    var homeDot = document.getElementById("home-source-dot");
    var homeLabel = document.getElementById("data-source-label");

    function updateDisplay() {
      var src = (typeof DataLayer !== "undefined") ? DataLayer.source : "static-file";
      var isLive = src !== "static-file";
      var sourceText = src === "static-file" ? "Static file" :
                       src === "warehouse-api" ? "Live — Warehouse" :
                       src === "powerbi-embed" ? "Live — Power BI" : src;

      if (dot) dot.className = "data-conn-dot" + (isLive ? " is-live" : "");
      if (label) label.textContent = sourceText;

      if (homeDot) homeDot.className = "freshness-source-dot" + (isLive ? " is-live" : "");
      if (homeLabel) homeLabel.textContent = sourceText;

      if (detail) {
        detail.textContent = isLive ?
          "Dashboard is connected to the HAP data warehouse and refreshing automatically." :
          "Data comes from a local file (state-data.js). When connected to the HAP data warehouse, this dashboard will refresh automatically.";
      }

      if (freshness && typeof DataLayer !== "undefined" && DataLayer.lastRefreshed) {
        freshness.textContent = "Last updated: " +
          ((typeof CONFIG !== "undefined" && CONFIG.dataFreshness) || DataLayer.lastRefreshed.toLocaleDateString());
      }
    }

    updateDisplay();

    if (typeof DataLayer !== "undefined" && DataLayer.onRefresh) {
      DataLayer.onRefresh(updateDisplay);
    }
  }

  /* ═══════════════════════════════════════════════════
     AI Policy Alert Banner (Phase 4)
     ═══════════════════════════════════════════════════ */

  function initPolicyAlert() {
    if (typeof AIHelpers === "undefined" || !AIHelpers.getPolicyAlert) return;

    AIHelpers.getPolicyAlert().then(function (alert) {
      if (!alert) return;
      var policyScroll = document.querySelector('#tab-policy .tab-scroll');
      if (!policyScroll) return;

      var banner = document.createElement("div");
      banner.className = "policy-alert-banner anim-in";

      var headline = document.createElement("div");
      headline.className = "policy-alert-headline";
      headline.textContent = alert.headline;

      var body = document.createElement("div");
      body.className = "policy-alert-body";
      body.textContent = alert.body;

      var dateLine = document.createElement("div");
      dateLine.className = "policy-alert-date";
      dateLine.textContent = "As of " + alert.date;

      var aiBadge = document.createElement("span");
      aiBadge.className = "ai-badge";
      aiBadge.textContent = AIHelpers.isLive ? "AI Live" : "AI Stub";
      dateLine.appendChild(aiBadge);

      banner.appendChild(headline);
      banner.appendChild(body);
      banner.appendChild(dateLine);

      var firstChild = policyScroll.firstElementChild;
      if (firstChild) {
        policyScroll.insertBefore(banner, firstChild.nextElementSibling);
      } else {
        policyScroll.appendChild(banner);
      }

      requestAnimationFrame(function () {
        banner.classList.add("visible");
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     Boot
     ═══════════════════════════════════════════════════ */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
