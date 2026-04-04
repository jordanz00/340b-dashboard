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
    safeText(document.getElementById("sources-text"), c.sourceSummary);
    safeText(document.getElementById("limitations-text"), c.sourcesLimitations);

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

    dom.tabBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });

    dom.tabPanels.forEach(function (panel) {
      var panelTab = panel.getAttribute("data-tab");
      if (panelTab === tab) {
        panel.classList.remove("exit-left");
        panel.classList.add("active");
        panel.querySelector(".tab-scroll").scrollTop = 0;
      } else if (panelTab === previousTab) {
        panel.classList.add(goingForward ? "exit-left" : "");
        panel.classList.remove("active");
      } else {
        panel.classList.remove("active", "exit-left");
      }
    });

    triggerAnimations("tab-" + tab);

    if (tab === "map" && !mapDrawn) {
      requestAnimationFrame(function () {
        setTimeout(drawMap, 100);
      });
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
    var chips = dom.filterBar.querySelectorAll(".filter-chip");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        this.classList.add("active");
        currentFilter = this.getAttribute("data-filter");
        filterStateCards(dom.searchInput ? dom.searchInput.value.trim().toLowerCase() : "", currentFilter);
        updateMapFilter(currentFilter);
        vibrate(10);
      });
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
      .on("click", function (event, d) {
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
     Boot
     ═══════════════════════════════════════════════════ */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
