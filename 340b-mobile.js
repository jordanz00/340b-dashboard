/**
 * HAP 340B Mobile App — runtime behavior
 *
 * WHO THIS IS FOR: New developers maintaining the mobile-first PWA. Read top to bottom once; then jump to the section you need.
 *
 * WHAT THIS FILE CONTROLS:
 * - Bottom tabs + swipe between tabs (see initTabs, initSwipeNavigation, switchTab)
 * - U.S. protection map, PA district map, state bottom sheet
 * - KPI count-up, copy from CONFIG / state-data.js, DataLayer metric hydration
 * - Share sheet, story form, zip lookup, federal delegation, optional AI policy banner
 * - PWA: registers sw.js after load (offline-friendly shell — see initPwaServiceWorker)
 *
 * DATA FLOW (simple):
 * 1. Numbers in the HTML often have data-metric-key + data-count (fallback).
 * 2. state-data.js defines CONFIG and STATE_340B (source of truth until the warehouse).
 * 3. modules/data-layer.js can override KPIs when warehouse mode is on.
 * 4. powerbi/metric-registry.json + semantic-layer-registry.json name each metric for Power BI later.
 *
 * RELATED FILES: 340b-mobile.html (structure), 340b-mobile.css (look), hap-design-tokens.css (HAP brand tokens).
 *
 * Security (SECURE-FORCE): Dynamic UI uses createElement + textContent only — avoid HTML-string injection for untrusted text.
 */

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
  var touchStartTime = 0;
  var isSwiping = false;
  /** @type {Element|null} focus target to restore when state sheet closes */
  var sheetFocusReturnEl = null;
  /* ── DOM Cache ── */
  var dom = {};

  /** Numeric KPI from state-data.js HAP_STATIC_METRICS (fallback for older pages). */
  function staticMetric(metricKey, fallback) {
    if (typeof HAP_STATIC_METRICS !== "undefined" && HAP_STATIC_METRICS[metricKey] != null) {
      return HAP_STATIC_METRICS[metricKey];
    }
    return fallback;
  }

  function cacheDom() {
    dom.app = document.getElementById("app");
    dom.content = document.getElementById("app-content");
    dom.tabBar = document.getElementById("app-tab-bar");
    dom.tabBtns = dom.tabBar ? dom.tabBar.querySelectorAll(".tab-btn") : [];
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
    initWarehouseBootstrap();
    populateCopy();

    function continueInit() {
      initTabs();
      initSwipeNavigation();
      initScrollAnimations();
      initStateGrid();
      initSearch();
      initFilters();
      initShareHandlers();
      initBottomSheet();
      initSheetEscape();
      initLegislatorHeadshotFallback();
      initCountUp();
      initOutcomes();
      initPaAsks();
      upgradeStaticPaLegislatorCards();
      initFederalDelegation();
      initZipLookup();
      initStoryForm();
      initReportGenerator();
      initDataConnection();
      initPolicyAlert();
      initPwaServiceWorker();

      var fy = document.getElementById("footer-year");
      if (fy) fy.textContent = new Date().getFullYear();

      requestAnimationFrame(function () {
        triggerAnimations("tab-home");
      });
    }

    if (typeof DataLayer !== "undefined") {
      applyDataMetricElements().then(continueInit).catch(continueInit);
    } else {
      continueInit();
    }
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

    if (tab === "map") {
      var q = dom.searchInput ? dom.searchInput.value.trim().toLowerCase() : "";
      filterStateCards(q, currentFilter);
    }

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

  /**
   * Registers the service worker for installable PWA + offline shell (see sw.js).
   * Safe no-op on file:// or if the browser blocks workers.
   */
  function initPwaServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () {
        /* Expected when not on HTTPS / localhost or when sw.js is missing */
      });
    });
  }

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
    touchStartTime = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
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
    var t1 = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    var dt = Math.max(1, t1 - touchStartTime);
    var velocity = Math.abs(dx) / dt;
    var minSwipe = 48;
    var fastSwipe = velocity > 0.45 && Math.abs(dx) > 28;
    if (Math.abs(dx) < minSwipe && !fastSwipe) {
      isSwiping = false;
      return;
    }

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

  function redrawMobileMap() {
    if (!dom.mapContainer) return;
    while (dom.mapContainer.firstChild) {
      dom.mapContainer.removeChild(dom.mapContainer.firstChild);
    }
    mapDrawn = false;
    if (currentTab === "map") {
      requestAnimationFrame(function () {
        setTimeout(drawMap, 50);
      });
    }
  }

  /**
   * After warehouse JSON loads, sync [data-metric-key] elements from DataLayer.
   */
  function applyDataMetricElements() {
    if (typeof DataLayer === "undefined") return Promise.resolve();
    return Promise.all([DataLayer.getKPIs(), DataLayer.getPA()]).then(function (results) {
      var kpis = results[0];
      var pa = results[1];
      var kmap = {};
      var kpiByKey = {};
      kpis.forEach(function (k) {
        kmap[k.key] = k.value;
        kpiByKey[k.key] = k;
      });

      document.querySelectorAll("[data-metric-key]").forEach(function (el) {
        var key = el.getAttribute("data-metric-key");
        var val = kmap[key];
        if (val == null && pa) {
          if (key === "PA_RURAL_HOSPITAL_PCT") val = pa.ruralPercent;
          else if (key === "PA_HOSPITALS_OPERATING_LOSS_PCT") val = pa.operatingAtLossPercent;
          else if (key === "PA_LD_SERVICES_PCT") val = pa.ldServicesPercent;
          else if (key === "HRSA_HOSPITAL_AUDIT_COUNT") val = pa.hrsaHospitalAudits;
          else if (key === "HRSA_MANUFACTURER_AUDIT_COUNT") val = pa.hrsaManufacturerAudits;
          else if (key === "PA_HOSPITALS_340B_COUNT") val = pa.hospitalCount;
          else if (key === "COMMUNITY_BENEFIT_TOTAL_BILLIONS") val = pa.communityBenefitBillions;
        }
        if (val == null) return;
        el.setAttribute("data-count", val);
        var row = kpiByKey[key];
        if (row && row.prefix != null) el.setAttribute("data-prefix", row.prefix);
        if (row && row.suffix != null) el.setAttribute("data-suffix", row.suffix);
        if (row && row.decimals != null) el.setAttribute("data-decimals", String(row.decimals));
      });

      var mfg = pa && pa.hrsaManufacturerAudits != null ? pa.hrsaManufacturerAudits : staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5);
      var hosp = pa && pa.hrsaHospitalAudits != null ? pa.hrsaHospitalAudits : staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179);
      var ratio = mfg > 0 ? Math.round(hosp / mfg) : 0;
      var om = document.querySelector(".oversight-meaning");
      if (om && ratio > 0) {
        om.textContent = "Hospitals face " + ratio + "x more federal audits than drug manufacturers—despite manufacturers restricting 340B access.";
      }

      var paHosp = pa && pa.hospitalCount != null ? pa.hospitalCount : staticMetric("PA_HOSPITALS_340B_COUNT", 72);
      var benefit = pa && pa.communityBenefitBillions != null ? pa.communityBenefitBillions : staticMetric("COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95);
      var paTitle = document.getElementById("pa-hero-title");
      if (paTitle) paTitle.textContent = paHosp + " Hospitals Depend on 340B";
      var bd = document.getElementById("pa-benefit-dollars");
      if (bd) bd.textContent = "$" + (typeof benefit === "number" ? benefit.toFixed(2) : benefit);
    });
  }

  function rehydrateAfterWarehouse() {
    if (typeof DataLayer === "undefined" || DataLayer.source !== "warehouse-gold") return;
    if (!DataLayer.getStatus().cacheLoaded) return;

    populateCopy();
    updateProtectionCounts();
    initStateGrid();
    redrawMobileMap();
    filterStateCards(dom.searchInput ? dom.searchInput.value.trim().toLowerCase() : "", currentFilter);
    applyDataMetricElements().then(function () {
      requestAnimationFrame(function () {
        runAllCountUps();
      });
    });
  }

  /**
   * Connect to Gold JSON API when config/settings.js warehouse.enabled is true.
   */
  function initWarehouseBootstrap() {
    if (typeof DataLayer === "undefined") return;
    var w = typeof DASHBOARD_SETTINGS !== "undefined" ? DASHBOARD_SETTINGS.warehouse : null;
    if (!w || !w.enabled) return;

    var url = w.useMockEndpoint ? "data/mock-api-response.json" : (w.endpointUrl || "");
    if (!url) return;

    DataLayer.onRefresh(function () {
      if (DataLayer.source === "warehouse-gold" && DataLayer.getStatus().cacheLoaded) {
        rehydrateAfterWarehouse();
      }
    });

    var opts = {
      intervalMs: w.pollIntervalMs || 900000,
      storyApiUrl: w.storyApiUrl || "",
      headers: w.headers || {}
    };
    DataLayer.connectWarehouse(url, opts);
    /* Path C (PBI embed): call DataLayer.connectPowerBI() from a separate page or console only —
       it sets DataLayer.source to powerbi-embed and would override warehouse-gold here. */
  }

  /* ═══════════════════════════════════════════════════
     State Grid
     ═══════════════════════════════════════════════════ */

  function initStateGrid() {
    if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined") return;
    var grid = dom.stateGrid;
    if (!grid) return;

    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

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

      var dot = document.createElement("span");
      dot.className = "state-dot " + dotClass;
      var info = document.createElement("div");
      info.className = "state-card-info";
      var nameEl = document.createElement("div");
      nameEl.className = "state-card-name";
      nameEl.textContent = STATE_NAMES[abbr] || abbr;
      var statusEl = document.createElement("div");
      statusEl.className = "state-card-status";
      statusEl.textContent = status;
      info.appendChild(nameEl);
      info.appendChild(statusEl);

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "state-card-arrow");
      svg.setAttribute("width", "16");
      svg.setAttribute("height", "16");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      poly.setAttribute("points", "9 18 15 12 9 6");
      svg.appendChild(poly);

      card.appendChild(dot);
      card.appendChild(info);
      card.appendChild(svg);

      card.addEventListener("click", function () {
        openStateSheet(abbr);
      });

      frag.appendChild(card);
    });

    grid.appendChild(frag);
  }

  /* ═══════════════════════════════════════════════════
     Search (state grid + US map stay in sync)
     ═══════════════════════════════════════════════════ */

  function stateMatchesSearchAbbr(abbr, qRaw) {
    var q = (qRaw || "").trim().toLowerCase();
    if (!q) return true;
    if (typeof STATE_NAMES === "undefined") return false;
    var name = (STATE_NAMES[abbr] || "").toLowerCase();
    if (name.indexOf(q) !== -1) return true;
    if (abbr.toLowerCase().indexOf(q) !== -1) return true;
    var nm = name.replace(/\./g, "").replace(/\s+/g, " ");
    var qq = q.replace(/\./g, "").replace(/\s+/g, " ");
    return nm.indexOf(qq) !== -1;
  }

  function stateMatchesFilterAbbr(abbr, filter) {
    if (typeof STATE_340B === "undefined") return false;
    var data = STATE_340B[abbr] || {};
    var isCP = !!data.cp;
    var isPBM = !!data.pbm;
    return filter === "all" ||
      (filter === "protected" && isCP) ||
      (filter === "unprotected" && !isCP && !isPBM) ||
      (filter === "pbm" && isPBM && !isCP);
  }

  /**
   * Best abbr for Enter key: exact name, then name prefix, then any substring match (alphabetical).
   */
  function findBestStateMatchAbbr(query, filter) {
    var q = (query || "").trim().toLowerCase();
    if (!q || typeof STATE_NAMES === "undefined" || typeof STATE_340B === "undefined") return null;
    var abbrs = Object.keys(STATE_NAMES).filter(function (a) { return a !== "DC"; });
    abbrs.sort(function (a, b) {
      return (STATE_NAMES[a] || "").localeCompare(STATE_NAMES[b] || "");
    });
    function ok(ab) {
      return stateMatchesSearchAbbr(ab, q) && stateMatchesFilterAbbr(ab, filter);
    }
    var i;
    for (i = 0; i < abbrs.length; i++) {
      if (!ok(abbrs[i])) continue;
      if ((STATE_NAMES[abbrs[i]] || "").toLowerCase() === q) return abbrs[i];
    }
    for (i = 0; i < abbrs.length; i++) {
      if (!ok(abbrs[i])) continue;
      var nm = (STATE_NAMES[abbrs[i]] || "").toLowerCase();
      if (nm.indexOf(q) === 0) return abbrs[i];
    }
    for (i = 0; i < abbrs.length; i++) {
      if (ok(abbrs[i])) return abbrs[i];
    }
    return null;
  }

  function populateStateSearchDatalist() {
    var dl = document.getElementById("state-search-datalist");
    if (!dl || typeof STATE_NAMES === "undefined") return;
    while (dl.firstChild) dl.removeChild(dl.firstChild);
    Object.keys(STATE_NAMES).forEach(function (abbr) {
      if (abbr === "DC") return;
      var opt = document.createElement("option");
      opt.value = STATE_NAMES[abbr];
      dl.appendChild(opt);
    });
  }

  function initSearch() {
    if (!dom.searchInput) return;
    populateStateSearchDatalist();

    function syncClearVisibility(query) {
      if (dom.searchClear) dom.searchClear.classList.toggle("hidden", query.length === 0);
    }

    function applySearchQuery(raw) {
      var query = (raw || "").trim().toLowerCase();
      syncClearVisibility(query);
      filterStateCards(query, currentFilter);
    }

    dom.searchInput.addEventListener("input", function () {
      applySearchQuery(this.value);
    });
    /* iOS Safari: clearing the native search "x" may not fire input; "search" covers that */
    dom.searchInput.addEventListener("search", function () {
      applySearchQuery(this.value);
    });
    /* IME / composed text (e.g. some mobile keyboards) */
    dom.searchInput.addEventListener("compositionend", function () {
      applySearchQuery(this.value);
    });

    dom.searchInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var raw = this.value || "";
      var abbr = findBestStateMatchAbbr(raw, currentFilter);
      if (abbr) {
        selectMapState(abbr);
        openStateSheet(abbr);
      }
    });

    if (dom.searchClear) {
      dom.searchClear.addEventListener("click", function () {
        dom.searchInput.value = "";
        dom.searchClear.classList.add("hidden");
        filterStateCards("", currentFilter);
        dom.searchInput.focus();
      });
    }
  }

  /**
   * Filters the state card grid and applies the same rules to map paths (dim non-matches, outline search matches).
   */
  function filterStateCards(query, filter) {
    var q = (query || "").trim().toLowerCase();
    if (typeof STATE_NAMES === "undefined" || typeof STATE_340B === "undefined") return;

    if (dom.stateGrid) {
      var cards = dom.stateGrid.querySelectorAll(".state-card");
      cards.forEach(function (card) {
        var abbr = card.getAttribute("data-state");
        if (!abbr) return;
        var show = stateMatchesSearchAbbr(abbr, q) && stateMatchesFilterAbbr(abbr, filter);
        card.classList.toggle("filtered-out", !show);
      });
    }

    if (dom.mapContainer) {
      var paths = dom.mapContainer.querySelectorAll("path.state");
      paths.forEach(function (path) {
        var abbr = path.getAttribute("data-state");
        if (!abbr) return;
        var ms = stateMatchesSearchAbbr(abbr, q);
        var mf = stateMatchesFilterAbbr(abbr, filter);
        var show = ms && mf;
        path.classList.toggle("dimmed", !show);
        path.classList.toggle("search-highlight", q.length > 0 && ms && mf);
      });
    }
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
      vibrate(10);
    });
  }

  /* ═══════════════════════════════════════════════════
     D3 Map
     ═══════════════════════════════════════════════════ */

  function statePathAriaLabel(abbr) {
    if (!abbr) return "State";
    var name = (typeof STATE_NAMES !== "undefined" && STATE_NAMES[abbr]) || abbr;
    if (typeof STATE_340B === "undefined") return name;
    var row = STATE_340B[abbr] || {};
    var st = row.cp ? "contract pharmacy protection" : row.pbm ? "PBM regulation only" : "no contract pharmacy protection enacted";
    return name + ", " + st + ". Press Enter or Space for details.";
  }

  function drawMap() {
    if (mapDrawn) return;
    if (typeof d3 === "undefined" || typeof topojson === "undefined") return;
    var usData = window.US_ATLAS_STATES_10M || window.us;
    if (!usData) return;

    var container = dom.mapContainer;
    if (!container) return;
    /* Tab was display:none — clientWidth can be 0; use a sane fallback for projection */
    var width = container.clientWidth;
    if (!width || width < 48) {
      width = Math.max(280, Math.min(560, (window.innerWidth || 375) - 32));
    }
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
      .attr("tabindex", "0")
      .attr("role", "button")
      .attr("aria-label", function (d) {
        return statePathAriaLabel(fipsToAbbr(d.id));
      })
      .style("opacity", 0)
      .on("keydown", function (event, d) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        hideMapTooltip();
        var abbrK = fipsToAbbr(d.id);
        if (abbrK) {
          selectMapState(abbrK);
          openStateSheet(abbrK);
        }
      })
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
      .on("touchend", function () {
        this.classList.remove("highlighted");
      }, { passive: true })
      .on("touchcancel", function () {
        this.classList.remove("highlighted");
      }, { passive: true })
      .transition()
      .delay(function (d, i) { return i * 25; })
      .duration(400)
      .style("opacity", 1);

    svg.append("path")
      .datum(topojson.mesh(usData, usData.objects.states, function (a, b) { return a !== b; }))
      .attr("class", "state-mesh")
      .attr("fill", "none")
      .attr("pointer-events", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .attr("stroke-linejoin", "round")
      .attr("d", path);

    mapDrawn = true;
    var searchQ = dom.searchInput ? dom.searchInput.value.trim().toLowerCase() : "";
    filterStateCards(searchQ, currentFilter);
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
      p.classList.remove("highlighted");
      var match = p.getAttribute("data-state") === abbr;
      p.classList.toggle("selected", match);
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

  function initSheetEscape() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isSheetOpen()) {
        e.preventDefault();
        closeStateSheet();
      }
    });
  }

  function initLegislatorHeadshotFallback() {
    document.querySelectorAll("img.leg-card-photo").forEach(function (img) {
      img.addEventListener("error", function onImgErr() {
        img.removeEventListener("error", onImgErr);
        img.style.display = "none";
      });
    });
  }

  /**
   * Build one stat cell for the state detail bottom sheet (safe DOM — textContent only).
   * @param {string} value — display value
   * @param {string} label — row label
   * @returns {HTMLDivElement}
   */
  function makeSheetStat(value, label) {
    var wrap = document.createElement("div");
    wrap.className = "sheet-stat";
    var valEl = document.createElement("div");
    valEl.className = "sheet-stat-value";
    valEl.textContent = value;
    var labEl = document.createElement("div");
    labEl.className = "sheet-stat-label";
    labEl.textContent = label;
    wrap.appendChild(valEl);
    wrap.appendChild(labEl);
    return wrap;
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

    while (dom.sheetBody.firstChild) {
      dom.sheetBody.removeChild(dom.sheetBody.firstChild);
    }

    var secBadge = document.createElement("div");
    secBadge.className = "sheet-section";
    var badge = document.createElement("div");
    badge.className = "sheet-status-badge " + statusClass;
    var badgeDot = document.createElement("span");
    badgeDot.className = "state-dot " + (data.cp ? "cp" : data.pbm ? "pbm" : "none");
    badge.appendChild(badgeDot);
    badge.appendChild(document.createTextNode(statusText));
    secBadge.appendChild(badge);
    dom.sheetBody.appendChild(secBadge);

    var secStats = document.createElement("div");
    secStats.className = "sheet-section";
    var row = document.createElement("div");
    row.className = "sheet-stat-row";
    row.appendChild(makeSheetStat(data.y != null ? String(data.y) : "—", "Year enacted"));
    row.appendChild(makeSheetStat(data.cp ? "Yes" : "No", "Contract pharmacy"));
    row.appendChild(makeSheetStat(data.pbm ? "Yes" : "No", "PBM regulation"));
    secStats.appendChild(row);
    dom.sheetBody.appendChild(secStats);

    if (data.notes) {
      var secNotes = document.createElement("div");
      secNotes.className = "sheet-section";
      var notesTitle = document.createElement("div");
      notesTitle.className = "sheet-section-title";
      notesTitle.textContent = "Notes";
      var notesBody = document.createElement("div");
      notesBody.className = "sheet-notes";
      notesBody.textContent = data.notes;
      secNotes.appendChild(notesTitle);
      secNotes.appendChild(notesBody);
      dom.sheetBody.appendChild(secNotes);
    }

    if (abbr === "PA") {
      var secPA = document.createElement("div");
      secPA.className = "sheet-section";
      var paTitle = document.createElement("div");
      paTitle.className = "sheet-section-title";
      paTitle.textContent = "HAP Focus State";
      var paBody = document.createElement("div");
      paBody.className = "sheet-notes";
      var nH = staticMetric("PA_HOSPITALS_340B_COUNT", 72);
      paBody.textContent = "Pennsylvania is HAP's home state. " + nH + " hospitals rely on 340B to serve patients. Legislation is in progress to enact contract pharmacy protection.";
      secPA.appendChild(paTitle);
      secPA.appendChild(paBody);
      dom.sheetBody.appendChild(secPA);
    }

    sheetFocusReturnEl = document.activeElement;
    dom.stateSheet.setAttribute("aria-hidden", "false");
    dom.stateSheet.classList.add("open");
    dom.sheetPanel.style.transform = "";
    dom.sheetPanel.style.transition = "";
    document.body.style.overflow = "hidden";
    vibrate(15);
    requestAnimationFrame(function () {
      var c = document.getElementById("sheet-close");
      if (c) c.focus();
    });
  }

  function closeStateSheet() {
    dom.stateSheet.setAttribute("aria-hidden", "true");
    dom.stateSheet.classList.remove("open");
    document.body.style.overflow = "";
    selectedState = null;
    if (sheetFocusReturnEl && typeof sheetFocusReturnEl.focus === "function") {
      try {
        sheetFocusReturnEl.focus();
      } catch (err) { /* noop */ }
    }
    sheetFocusReturnEl = null;

    if (dom.mapContainer) {
      dom.mapContainer.querySelectorAll("path.state").forEach(function (p) {
        p.classList.remove("selected", "highlighted");
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
      var eyebrow = document.createElement("div");
      eyebrow.className = "exec-eyebrow";
      eyebrow.textContent = "Ask " + (i + 1);
      var valueEl = document.createElement("div");
      valueEl.className = "exec-value";
      valueEl.textContent = ask.label || "";
      var noteEl = document.createElement("div");
      noteEl.className = "exec-note";
      noteEl.textContent = ask.impactLine || "";
      card.appendChild(eyebrow);
      card.appendChild(valueEl);
      card.appendChild(noteEl);
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
     Federal Delegation
     ═══════════════════════════════════════════════════ */

  function congressPhotoUrl(bioguideId) {
    if (!bioguideId) return "";
    return "images/headshots/congress/" + bioguideId + ".jpg";
  }

  /**
   * Official legislator profile URL only — empty when missing or not on the allowlist (no #, no random hosts).
   * @param {string|null|undefined} raw
   * @returns {string}
   */
  function safeLegislatorProfileUrl(raw) {
    if (typeof DataLayer === "undefined" || typeof DataLayer.isTrustedLegislatorUrl !== "function") return "";
    if (!DataLayer.isTrustedLegislatorUrl(raw)) return "";
    return String(raw).trim();
  }

  /**
   * Static HTML leg-cards: drop anchor when href is not an official legislative URL (avoids 404 / placeholder taps).
   */
  function upgradeStaticPaLegislatorCards() {
    var tab = document.getElementById("tab-pa");
    if (!tab) return;
    tab.querySelectorAll("a.leg-card[href]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (safeLegislatorProfileUrl(href)) return;
      var div = document.createElement("div");
      div.className = a.className + " leg-card--no-link";
      div.setAttribute("role", "group");
      while (a.firstChild) div.appendChild(a.firstChild);
      a.parentNode.replaceChild(div, a);
    });
  }

  function paLegPhotoUrl(gpid, chamber) {
    if (typeof DataLayer !== "undefined" && DataLayer.getPaLegislatorPhotoUrl) {
      return DataLayer.getPaLegislatorPhotoUrl(gpid, chamber);
    }
    return typeof window.getPaPhoto === "function" ? window.getPaPhoto(gpid, chamber) : "";
  }

  function initialsFromName(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return (parts[0] || "?").slice(0, 2).toUpperCase();
  }

  /**
   * Headshot wrapper: loads portrait when src is set; on error shows initials (never blank space).
   * Do not set crossOrigin — many official portrait hosts omit CORS; anonymous mode breaks the image.
   */
  function createHeadshot(src, alt, className) {
    var wrap = document.createElement("span");
    wrap.className = "leg-headshot-wrap";
    var cls = className || "leg-headshot";
    function appendInitials() {
      var fb = document.createElement("span");
      fb.className = "leg-headshot leg-headshot--initials " + cls.replace(/\bleg-headshot\b/g, "").trim();
      fb.setAttribute("role", "img");
      fb.setAttribute("aria-label", alt || "Legislator");
      fb.textContent = initialsFromName(alt);
      wrap.appendChild(fb);
    }
    if (!src) {
      appendInitials();
      return wrap;
    }
    var img = document.createElement("img");
    img.className = cls;
    img.alt = alt || "";
    img.width = 54;
    img.height = 54;
    img.loading = "lazy";
    img.decoding = "async";
    img.src = src;
    img.addEventListener("error", function onImgErr() {
      img.removeEventListener("error", onImgErr);
      if (img.parentNode) img.parentNode.removeChild(img);
      appendInitials();
    });
    wrap.appendChild(img);
    return wrap;
  }

  window._PA_DELEGATION_DATA = [
    { member: "John Fetterman", chamber: "Senate", district: "Statewide", party: "D", position: "cosponsor", lastContact: "03/15/2026", action: "Schedule meeting", bioguideId: "F000479", url: "https://www.fetterman.senate.gov" },
    { member: "Dave McCormick", chamber: "Senate", district: "Statewide", party: "R", position: "supportive", lastContact: "03/10/2026", action: "Schedule meeting", bioguideId: "M001243", url: "https://www.mccormick.senate.gov" },
    { member: "Brian Fitzpatrick", chamber: "House", district: "District 1", party: "R", position: "unknown", lastContact: "02/28/2026", action: "Schedule meeting", bioguideId: "F000466", url: "https://fitzpatrick.house.gov" },
    { member: "Brendan Boyle", chamber: "House", district: "District 2", party: "D", position: "opposed", lastContact: "01/20/2026", action: "Schedule meeting", bioguideId: "B001296", url: "https://boyle.house.gov" },
    { member: "Dwight Evans", chamber: "House", district: "District 3", party: "D", position: "cosponsor", lastContact: "03/01/2026", action: "Schedule meeting", bioguideId: "E000296", url: "https://evans.house.gov" },
    { member: "Madeleine Dean", chamber: "House", district: "District 4", party: "D", position: "supportive", lastContact: "02/15/2026", action: "Schedule meeting", bioguideId: "D000631", url: "https://dean.house.gov" },
    { member: "Mary Gay Scanlon", chamber: "House", district: "District 5", party: "D", position: "unknown", lastContact: "01/10/2026", action: "Schedule meeting", bioguideId: "S001205", url: "https://scanlon.house.gov" },
    { member: "Chrissy Houlahan", chamber: "House", district: "District 6", party: "D", position: "supportive", lastContact: "03/05/2026", action: "Schedule meeting", bioguideId: "H001085", url: "https://houlahan.house.gov" },
    { member: "Ryan Mackenzie", chamber: "House", district: "District 7", party: "R", position: "opposed", lastContact: "12/01/2025", action: "Schedule meeting", bioguideId: "M001230", url: "https://mackenzie.house.gov" },
    { member: "Rob Bresnahan", chamber: "House", district: "District 8", party: "R", position: "unknown", lastContact: "02/20/2026", action: "Schedule meeting", bioguideId: "B001327", url: "https://bresnahan.house.gov" },
    { member: "Dan Meuser", chamber: "House", district: "District 9", party: "R", position: "cosponsor", lastContact: "03/12/2026", action: "Schedule meeting", bioguideId: "M001204", url: "https://meuser.house.gov" },
    { member: "Scott Perry", chamber: "House", district: "District 10", party: "R", position: "supportive", lastContact: "01/30/2026", action: "Schedule meeting", bioguideId: "P000605", url: "https://perry.house.gov" },
    { member: "Lloyd Smucker", chamber: "House", district: "District 11", party: "R", position: "unknown", lastContact: "02/05/2026", action: "Schedule meeting", bioguideId: "S001199", url: "https://smucker.house.gov" },
    { member: "Summer Lee", chamber: "House", district: "District 12", party: "D", position: "supportive", lastContact: "03/08/2026", action: "Schedule meeting", bioguideId: "L000602", url: "https://summerlee.house.gov" },
    { member: "John Joyce", chamber: "House", district: "District 13", party: "R", position: "opposed", lastContact: "11/15/2025", action: "Schedule meeting", bioguideId: "J000302", url: "https://joyce.house.gov" },
    { member: "Guy Reschenthaler", chamber: "House", district: "District 14", party: "R", position: "unknown", lastContact: "01/25/2026", action: "Schedule meeting", bioguideId: "R000610", url: "https://reschenthaler.house.gov" },
    { member: "Glenn Thompson", chamber: "House", district: "District 15", party: "R", position: "supportive", lastContact: "02/22/2026", action: "Schedule meeting", bioguideId: "T000467", url: "https://thompson.house.gov" },
    { member: "Mike Kelly", chamber: "House", district: "District 16", party: "R", position: "unknown", lastContact: "03/02/2026", action: "Schedule meeting", bioguideId: "K000376", url: "https://kelly.house.gov" },
    { member: "Chris Deluzio", chamber: "House", district: "District 17", party: "D", position: "supportive", lastContact: "03/06/2026", action: "Schedule meeting", bioguideId: "D000530", url: "https://deluzio.house.gov" }
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
      var profileUrl = safeLegislatorProfileUrl(row.url);
      var card = profileUrl ? document.createElement("a") : document.createElement("div");
      card.className = "fed-card" + (profileUrl ? "" : " fed-card--no-link");
      if (profileUrl) {
        card.href = profileUrl;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
      } else {
        card.setAttribute("role", "group");
      }
      card.setAttribute("data-position", row.position || "unknown");

      var top = document.createElement("div");
      top.className = "fed-card-top";

      var photo = createHeadshot(
        congressPhotoUrl(row.bioguideId),
        row.member,
        "leg-headshot fed-card-photo"
      );
      top.appendChild(photo);

      var nameWrap = document.createElement("div");
      nameWrap.className = "fed-card-name-wrap";

      var name = document.createElement("div");
      name.className = "fed-card-name";
      name.textContent = row.member;

      var meta = document.createElement("div");
      meta.className = "fed-card-meta";
      meta.textContent = row.chamber + " · " + row.district + " · " + row.party;

      nameWrap.appendChild(name);
      nameWrap.appendChild(meta);
      top.appendChild(nameWrap);

      var badge = document.createElement("span");
      badge.className = "leg-badge leg-badge--" + (row.position || "unknown");
      badge.textContent = POSITION_LABELS[row.position] || "Unknown";
      top.appendChild(badge);

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

  var _zipLookupResultsListenerBound = false;

  function appendZipLookupDistrictResults(detail) {
    var resultsContainer = document.getElementById("zip-lookup-results");
    if (!resultsContainer || !detail) return;

    function addHeading(text) {
      var h = document.createElement("p");
      h.className = "zip-result-heading";
      h.textContent = text;
      resultsContainer.appendChild(h);
    }

    function addLegRow(opts) {
      var profileUrl = safeLegislatorProfileUrl(opts && opts.url);
      var row = profileUrl ? document.createElement("a") : document.createElement("div");
      row.className = "zip-result-card" + (profileUrl ? "" : " zip-result-card--no-link");
      if (profileUrl) {
        row.href = profileUrl;
        row.target = "_blank";
        row.rel = "noopener noreferrer";
      } else {
        row.setAttribute("role", "group");
      }
      var photoSrc = opts.photoSrc || "";
      row.appendChild(createHeadshot(photoSrc, opts.name, "leg-headshot zip-result-photo"));
      var info = document.createElement("div");
      info.className = "zip-result-info";
      var nm = document.createElement("div");
      nm.className = "zip-result-name";
      nm.textContent = opts.name || "—";
      var sub = document.createElement("div");
      sub.className = "zip-result-detail";
      sub.textContent = opts.sub || "";
      info.appendChild(nm);
      info.appendChild(sub);
      row.appendChild(info);
      resultsContainer.appendChild(row);
    }

    var n = detail.usHouseDistrictNumber;
    if (n != null) {
      var hr = PA_DELEGATION.filter(function (r) {
        return r.chamber === "House" && r.district === "District " + n;
      })[0];
      if (hr) {
        addHeading("Your U.S. Representative");
        addLegRow({
          url: hr.url,
          photoSrc: congressPhotoUrl(hr.bioguideId),
          name: hr.member,
          sub: "PA-" + n + " · " + hr.party + " · " + (POSITION_LABELS[hr.position] || "Unknown") + " on 340B"
        });
      }
    }

    if (detail.stateSenate && detail.stateSenate.name) {
      addHeading("PA State Senate");
      var sPhoto = detail.stateSenate.gpid ? paLegPhotoUrl(detail.stateSenate.gpid, "senate") : "";
      addLegRow({
        url: detail.stateSenate.url,
        photoSrc: sPhoto,
        name: detail.stateSenate.name,
        sub: (detail.stateSenate.label || "") + " · " + (detail.stateSenate.party || "")
      });
    }

    if (detail.stateHouse && detail.stateHouse.name) {
      addHeading("PA State House");
      var hPhoto = detail.stateHouse.gpid ? paLegPhotoUrl(detail.stateHouse.gpid, "house") : "";
      addLegRow({
        url: detail.stateHouse.url,
        photoSrc: hPhoto,
        name: detail.stateHouse.name,
        sub: (detail.stateHouse.label || "") + " · " + (detail.stateHouse.party || "")
      });
    }
  }

  function initZipLookup() {
    var form = document.getElementById("zip-lookup-form");
    var input = document.getElementById("zip-lookup-input");
    var resultsContainer = document.getElementById("zip-lookup-results");
    var status = document.getElementById("zip-lookup-status");
    if (!form || !input || !status) return;

    if (!_zipLookupResultsListenerBound) {
      _zipLookupResultsListenerBound = true;
      window.addEventListener("hap:pa-zip-lookup-results", function (evt) {
        appendZipLookupDistrictResults(evt && evt.detail ? evt.detail : {});
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var zip = input.value.replace(/[^0-9]/g, "");

      if (resultsContainer) {
        while (resultsContainer.firstChild) resultsContainer.removeChild(resultsContainer.firstChild);
      }

      if (zip.length !== 5) {
        status.textContent = "Enter a valid 5-digit ZIP code.";
        status.className = "zip-lookup-status is-error";
        return;
      }

      status.textContent = "Looking up legislators for ZIP " + zip + "\u2026";
      status.className = "zip-lookup-status";

      window.dispatchEvent(new CustomEvent("hap:pa-district-zip-lookup", {
        detail: { zip: zip }
      }));

      var senators = PA_DELEGATION.filter(function (row) {
        return row.chamber === "Senate";
      });

      if (resultsContainer && senators.length) {
        var heading = document.createElement("p");
        heading.className = "zip-result-heading";
        heading.textContent = "PA U.S. Senators";
        resultsContainer.appendChild(heading);

        senators.forEach(function (row) {
          var profileUrl = safeLegislatorProfileUrl(row.url);
          var card = profileUrl ? document.createElement("a") : document.createElement("div");
          card.className = "zip-result-card" + (profileUrl ? "" : " zip-result-card--no-link");
          if (profileUrl) {
            card.href = profileUrl;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
          } else {
            card.setAttribute("role", "group");
          }
          card.appendChild(createHeadshot(congressPhotoUrl(row.bioguideId), row.member, "leg-headshot zip-result-photo"));
          var info = document.createElement("div");
          info.className = "zip-result-info";
          var nm = document.createElement("div");
          nm.className = "zip-result-name";
          nm.textContent = row.member;
          var det = document.createElement("div");
          det.className = "zip-result-detail";
          det.textContent = row.party + " · " + (POSITION_LABELS[row.position] || "Unknown") + " on 340B";
          info.appendChild(nm);
          info.appendChild(det);
          card.appendChild(info);
          resultsContainer.appendChild(card);
        });
      }
    });
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
      var t = typeSelect.value;
      var savedTab = currentTab;
      prepareReportMapSnapshots(t, function (snaps) {
        generateReport(t, snaps, savedTab);
      });
    });

    btnCsv.addEventListener("click", function () {
      downloadCsv(typeSelect.value);
    });

    var btnGold = document.getElementById("btn-export-gold-json");
    if (btnGold && typeof DataLayer !== "undefined" && typeof DataLayer.exportJSON === "function") {
      btnGold.addEventListener("click", function () {
        DataLayer.exportJSON().then(function (payload) {
          var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "hap-340b-gold-export.json";
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          }, 200);
          showToast("Gold JSON downloaded");
        }).catch(function () {
          showToast("Export failed");
        });
      });
    }
  }

  var REPORT_MAP_WAIT_MS = 5000;
  var REPORT_MAP_POLL_MS = 90;

  /** @typedef {{ usSvg?: SVGElement|null, paSvg?: SVGElement|null }} ReportMapSnaps */

  /**
   * Switch to the tab that hosts the needed map, wait for SVG, then callback (for PDF advocacy reports).
   * @param {string} type — report type key
   * @param {function(ReportMapSnaps): void} done
   */
  function prepareReportMapSnapshots(type, done) {
    var snaps = { usSvg: null, paSvg: null };
    if (type !== "full" && type !== "pa-one-pager" && type !== "state-comparison") {
      done(snaps);
      return;
    }

    function waitForSvg(selector, cb) {
      var start = Date.now();
      (function tick() {
        var svg = document.querySelector(selector);
        if (svg && svg.querySelector) {
          var paths = svg.querySelectorAll("path");
          if (paths && paths.length > 0) {
            cb(svg);
            return;
          }
        }
        if (Date.now() - start > REPORT_MAP_WAIT_MS) {
          cb(null);
          return;
        }
        setTimeout(tick, REPORT_MAP_POLL_MS);
      })();
    }

    if (type === "pa-one-pager") {
      switchTab("pa");
      window.setTimeout(function () {
        var houseBtn = document.querySelector('.pa-district-toggle[data-pa-district-chamber="house"]');
        if (houseBtn && !houseBtn.classList.contains("is-active")) {
          houseBtn.click();
        }
        var allLegend = document.querySelector('.pa-district-legend__chip[data-pa-bucket="all"]');
        if (allLegend) {
          allLegend.click();
        }
        window.setTimeout(function () {
          waitForSvg("#pa-district-map svg", function (svg) {
            /* Dots animate cy for up to ~2050ms; wait so clone captures final positions (not cy=-12). */
            window.setTimeout(function () {
              snaps.paSvg = svg;
              done(snaps);
            }, 2200);
          });
        }, 320);
      }, 160);
      return;
    }

    /* full + state-comparison: U.S. protection map */
    switchTab("map");
    window.setTimeout(function () {
      /* If already on Map, switchTab no-ops and may not schedule drawMap — ensure SVG exists */
      if (!mapDrawn) {
        drawMap();
      }
      waitForSvg("#mobile-map svg", function (svg) {
        snaps.usSvg = svg;
        done(snaps);
      });
    }, 380);
  }

  /**
   * Clone map SVG for print: no interaction, full colors (undimmed), safe for static snapshot.
   * @param {SVGElement|null} svg
   * @param {number} [printScale] — multiply intrinsic width/height (e.g. 2 for 200% PA district map in one-pager PDF)
   * @returns {SVGElement|null}
   */
  function cloneSvgForPrintReport(svg, printScale) {
    printScale = printScale > 0 ? printScale : 1;
    if (!svg || typeof svg.cloneNode !== "function") return null;
    var c = svg.cloneNode(true);
    if (!c.getAttribute || !c.getAttribute("xmlns")) {
      c.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    /* Print/PDF: explicit pixel width+height from viewBox (or source attrs). Stripping height + width=100% breaks WebKit/Safari print preview. */
    var vbRaw = (svg.getAttribute("viewBox") || "").trim();
    var vbParts = vbRaw.split(/[\s,]+/).filter(Boolean);
    var vw = vbParts.length >= 4 ? parseFloat(vbParts[2]) : NaN;
    var vh = vbParts.length >= 4 ? parseFloat(vbParts[3]) : NaN;
    var rawW = svg.getAttribute("width");
    var rawH = svg.getAttribute("height");
    var baseW = rawW && !/%/.test(String(rawW)) ? parseFloat(rawW) : vw;
    var baseH = rawH && !/%/.test(String(rawH)) ? parseFloat(rawH) : vh;
    if (baseW && baseH && isFinite(baseW) && isFinite(baseH)) {
      c.setAttribute("width", String(Math.round(baseW * printScale)));
      c.setAttribute("height", String(Math.round(baseH * printScale)));
    } else if (isFinite(vw) && isFinite(vh)) {
      c.setAttribute("width", String(Math.round(vw * printScale)));
      c.setAttribute("height", String(Math.round(vh * printScale)));
    } else {
      var cvb = (c.getAttribute("viewBox") || "").trim().split(/[\s,]+/).filter(Boolean);
      if (cvb.length >= 4) {
        var cw = parseFloat(cvb[2]);
        var ch = parseFloat(cvb[3]);
        if (isFinite(cw) && isFinite(ch)) {
          c.setAttribute("width", String(Math.round(cw * printScale)));
          c.setAttribute("height", String(Math.round(ch * printScale)));
        } else {
          c.setAttribute("width", "100%");
        }
      } else {
        c.setAttribute("width", "100%");
      }
    }
    c.setAttribute("preserveAspectRatio", "xMidYMid meet");
    c.style.pointerEvents = "none";
    c.style.maxWidth = "100%";
    /* US map: D3 staggers path opacity (0→1). Snapshot often runs mid-animation — clone would show only a few states. */
    c.querySelectorAll("path.state").forEach(function (el) {
      el.style.opacity = "1";
    });
    /* PA map: hospital dots animate cy + opacity; force visible for static export. */
    c.querySelectorAll("circle").forEach(function (el) {
      el.setAttribute("opacity", "1");
      el.style.opacity = "1";
    });
    c.querySelectorAll("[tabindex]").forEach(function (el) {
      el.removeAttribute("tabindex");
    });
    c.querySelectorAll('[role="button"]').forEach(function (el) {
      el.removeAttribute("role");
    });
    c.querySelectorAll(".dimmed").forEach(function (el) {
      el.classList.remove("dimmed");
    });
    c.querySelectorAll(".search-highlight").forEach(function (el) {
      el.classList.remove("search-highlight");
    });
    c.querySelectorAll(".highlighted").forEach(function (el) {
      el.classList.remove("highlighted");
    });
    c.querySelectorAll(".pa-district-shape--dimmed").forEach(function (el) {
      el.classList.remove("pa-district-shape--dimmed");
      el.style.opacity = "1";
    });
    c.querySelectorAll(".pa-district-shape").forEach(function (el) {
      el.style.opacity = "1";
    });
    c.querySelectorAll(".pa-district-shape--hover, .pa-district-shape--selected, .pa-district-shape--pulse").forEach(function (el) {
      el.classList.remove("pa-district-shape--hover", "pa-district-shape--selected", "pa-district-shape--pulse");
    });
    return c;
  }

  var PR_US_MAP_LEGEND = [
    { color: "#0072bc", label: "Contract pharmacy protection enacted" },
    { color: "#8ed8f8", label: "PBM regulation only (no contract pharmacy protection)" },
    { color: "#d3d9d4", label: "No enacted contract pharmacy protection" }
  ];

  var PR_PA_MAP_LEGEND = [
    { color: "#003087", label: "Three or more 340B hospitals in district" },
    { color: "#0072bc", label: "One to two 340B hospitals in district" },
    { color: "rgba(148, 163, 184, 0.55)", label: "No 340B hospitals in district (boundary only)" }
  ];

  /**
   * Map + key underneath; kept together on print (no page break through block).
   * @param {HTMLElement} parent
   * @param {{ title: string, svgSource: SVGElement|null, legendRows: Array<{color:string,label:string}>, mapNote?: string, blockClass?: string, svgPrintScale?: number, frameClass?: string }} opts
   */
  function appendPrintMapSection(parent, opts) {
    var block = document.createElement("div");
    block.className = "pr-print-map-block" + (opts.blockClass ? " " + opts.blockClass : "");

    var heading = document.createElement("p");
    heading.className = "pr-print-map-heading";
    heading.textContent = opts.title;
    block.appendChild(heading);

    var frame = document.createElement("div");
    frame.className = "pr-print-map-frame" + (opts.frameClass ? " " + opts.frameClass : "");
    var scale = typeof opts.svgPrintScale === "number" && opts.svgPrintScale > 0 ? opts.svgPrintScale : 1;
    var clone = cloneSvgForPrintReport(opts.svgSource, scale);
    if (clone) {
      frame.appendChild(clone);
    } else {
      var fb = document.createElement("p");
      fb.className = "pr-print-map-fallback";
      fb.textContent =
        "Map preview unavailable. Open the Map or Pennsylvania tab once, wait for the map to finish loading, then tap Generate PDF again.";
      frame.appendChild(fb);
    }
    block.appendChild(frame);

    if (opts.mapNote) {
      var note = document.createElement("p");
      note.className = "pr-print-map-note";
      note.textContent = opts.mapNote;
      block.appendChild(note);
    }

    var leg = document.createElement("div");
    leg.className = "pr-print-map-legend";
    leg.setAttribute("role", "group");
    (opts.legendRows || []).forEach(function (row) {
      var rowEl = document.createElement("div");
      rowEl.className = "pr-print-map-legend-row";
      var sw = document.createElement("span");
      sw.className = "pr-print-map-swatch";
      sw.style.backgroundColor = row.color;
      rowEl.appendChild(sw);
      var lab = document.createElement("span");
      lab.className = "pr-print-map-legend-label";
      lab.textContent = row.label;
      rowEl.appendChild(lab);
      leg.appendChild(rowEl);
    });
    block.appendChild(leg);

    parent.appendChild(block);
  }

  /**
   * @param {string} type
   * @param {ReportMapSnaps} [mapSnaps]
   * @param {string} [restoreTab] — tab id to return to after cloning maps into the report
   */
  function generateReport(type, mapSnaps, restoreTab) {
    mapSnaps = mapSnaps || {};
    var freshness = (typeof CONFIG !== "undefined" && CONFIG.dataFreshness) || "March 2026";
    var protCount = 0;
    if (typeof STATES_WITH_PROTECTION !== "undefined") {
      protCount = STATES_WITH_PROTECTION.filter(function (s) { return s !== "DC"; }).length;
    }

    var existing = document.getElementById("print-report");
    if (existing) existing.parentNode.removeChild(existing);

    var report = document.createElement("div");
    report.className = "print-report";
    report.id = "print-report";
    if (type === "pa-one-pager") {
      report.classList.add("print-report--one-pager");
    }
    if (type === "full") {
      report.classList.add("print-report--full-brief");
    }

    var titleMap = {
      full: "340B: Protecting access to care in Pennsylvania",
      "pa-one-pager": "340B: Pennsylvania one-pager",
      "state-comparison": "340B: State protection comparison"
    };
    var badgeMap = {
      full: "Advocacy Briefing",
      "pa-one-pager": "PA One-Pager",
      "state-comparison": "State Comparison"
    };

    appendHeader(report, titleMap[type] || titleMap.full, badgeMap[type] || badgeMap.full, freshness);

    var onePager = type === "pa-one-pager";

    if (type === "full" || type === "pa-one-pager") {
      appendStatGrid(report, protCount, onePager);
    }

    if (type === "full" || type === "state-comparison") {
      appendPrintMapSection(report, {
        title: "Contract pharmacy protection by state (U.S.)",
        svgSource: mapSnaps.usSvg || null,
        legendRows: PR_US_MAP_LEGEND,
        blockClass: "pr-print-map-block--us"
      });
    }

    if (type === "full") {
      appendAsks(report, onePager);
      appendAuditBlock(report, onePager);
      appendRebuttalTable(report);
    }

    if (type === "pa-one-pager") {
      appendPrintMapSection(report, {
        title: "Pennsylvania House districts and 340B hospital locations",
        svgSource: mapSnaps.paSvg || null,
        legendRows: PR_PA_MAP_LEGEND,
        mapNote: "Orange markers: 340B hospital sites (same symbols as the live dashboard). District shading reflects hospital counts per district.",
        blockClass: "pr-print-map-block--pa",
        frameClass: "pr-print-map-frame--pa-one-pager",
        svgPrintScale: 2
      });
      appendPAStakes(report, onePager);
      appendAuditBlock(report, onePager);
      appendAsks(report, onePager);
    }

    if (type === "full" || type === "state-comparison") {
      appendStateTable(report, type);
    }

    appendSources(report, onePager);
    appendFooter(report, freshness, onePager);

    if (restoreTab && restoreTab !== currentTab) {
      switchTab(restoreTab);
    }

    document.body.appendChild(report);
    document.body.classList.add("printing-report");
    report.classList.add("print-report--visible");

    window.print();

    report.classList.remove("print-report--visible");
    document.body.classList.remove("printing-report");
    document.body.removeChild(report);
  }

  /* ── Report building helpers ── */

  function appendHeader(parent, title, badge, freshness) {
    var hdr = document.createElement("div");
    hdr.className = "pr-header";
    var textBlock = document.createElement("div");
    var org = document.createElement("p");
    org.className = "pr-header-org";
    org.textContent = "The Hospital and Healthsystem Association of Pennsylvania";
    var ttl = document.createElement("p");
    ttl.className = "pr-header-title";
    ttl.textContent = title;
    textBlock.appendChild(org);
    textBlock.appendChild(ttl);
    var bdg = document.createElement("span");
    bdg.className = "pr-badge";
    bdg.textContent = badge + " \u2014 " + freshness;
    hdr.appendChild(textBlock);
    hdr.appendChild(bdg);
    parent.appendChild(hdr);
  }

  function appendStatGrid(parent, protCount, onePager) {
    var grid = document.createElement("div");
    grid.className = "pr-stat-grid" + (onePager ? " pr-stat-grid--compact" : "");

    var cb = staticMetric("COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95);
    var paH = staticMetric("PA_HOSPITALS_340B_COUNT", 72);
    var share = staticMetric("OUTPATIENT_SHARE_PCT", 7);
    var cards = [
      { label: "Reported community benefit (2024)", value: "$" + (typeof cb === "number" ? cb.toFixed(2) : cb) + "B", impact: "Reinvested in patient care and community services", cls: "" },
      { label: "PA hospitals in 340B", value: String(paH), impact: "30% of Pennsylvania\u2019s 235 hospitals", cls: "pr-stat-card--mid" },
      { label: "States with contract pharmacy protection", value: String(protCount), impact: (50 - protCount) + " states still lack protection \u2014 including PA", cls: "pr-stat-card--green" },
      { label: "Share of U.S. drug market", value: share + "%", impact: "Small program, outsized impact for patients", cls: "pr-stat-card--gold" }
    ];

    cards.forEach(function (c) {
      var card = document.createElement("div");
      card.className = "pr-stat-card" + (c.cls ? " " + c.cls : "");
      var lbl = document.createElement("p");
      lbl.className = "pr-stat-label";
      lbl.textContent = c.label;
      var val = document.createElement("p");
      val.className = "pr-stat-value";
      val.textContent = c.value;
      var imp = document.createElement("p");
      imp.className = "pr-stat-impact";
      imp.textContent = c.impact;
      card.appendChild(lbl);
      card.appendChild(val);
      card.appendChild(imp);
      grid.appendChild(card);
    });

    parent.appendChild(grid);
  }

  function appendAsks(parent, onePager) {
    var sec = document.createElement("p");
    sec.className = "pr-section";
    sec.textContent = "What HAP is asking lawmakers to do";
    parent.appendChild(sec);

    var grid = document.createElement("ul");
    grid.className = "pr-ask-grid" + (onePager ? " pr-ask-grid--compact" : "");

    var items = [
      { title: "Protect the 340B discount", body: "Keep hospital access to the outpatient drug prices Congress set for charity care and community benefit.", cls: "" },
      { title: "Defend contract pharmacy partnerships", body: "Patients fill prescriptions through local pharmacies \u2014 not one distant site selected by manufacturers.", cls: "pr-ask-item--gold" },
      { title: "Oppose rules that shrink safety-net access", body: "Rural and underserved communities keep an affordable path to medications hospitals are required to support.", cls: "pr-ask-item--green" }
    ];

    items.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "pr-ask-item" + (it.cls ? " " + it.cls : "");
      var t = document.createElement("p");
      t.className = "pr-ask-title";
      t.textContent = it.title;
      var b = document.createElement("p");
      b.className = "pr-ask-body";
      b.textContent = it.body;
      li.appendChild(t);
      li.appendChild(b);
      grid.appendChild(li);
    });

    parent.appendChild(grid);
  }

  function appendAuditBlock(parent, onePager) {
    var block = document.createElement("div");
    block.className = "pr-audit" + (onePager ? " pr-audit--compact" : "");

    var left = document.createElement("div");
    var kicker = document.createElement("p");
    kicker.className = "pr-audit-kicker";
    kicker.textContent = "HRSA Program Integrity FY 2024";
    left.appendChild(kicker);

    var cells = document.createElement("div");
    cells.className = "pr-audit-cells";

    var c1 = document.createElement("div");
    c1.className = "pr-audit-cell";
    var c1l = document.createElement("p");
    c1l.className = "pr-audit-cell-label";
    c1l.textContent = "Covered entity audits";
    var c1v = document.createElement("p");
    c1v.className = "pr-audit-cell-value";
    c1v.textContent = String(staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179));
    c1.appendChild(c1l);
    c1.appendChild(c1v);

    var vs = document.createElement("div");
    vs.className = "pr-audit-vs";
    vs.textContent = "vs.";

    var c2 = document.createElement("div");
    c2.className = "pr-audit-cell";
    var c2l = document.createElement("p");
    c2l.className = "pr-audit-cell-label";
    c2l.textContent = "Manufacturer audits";
    var c2v = document.createElement("p");
    c2v.className = "pr-audit-cell-value";
    c2v.textContent = String(staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5));
    c2.appendChild(c2l);
    c2.appendChild(c2v);

    cells.appendChild(c1);
    cells.appendChild(vs);
    cells.appendChild(c2);
    left.appendChild(cells);

    var conclusion = document.createElement("div");
    conclusion.className = "pr-audit-conclusion";
    var hospN = staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179);
    var mfgN = staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5);
    var mult = mfgN > 0 ? Math.round(hospN / mfgN) : 36;
    var strong = document.createElement("strong");
    strong.textContent = mult + "\u00D7 more hospital audits than manufacturer audits";
    conclusion.appendChild(strong);
    conclusion.appendChild(document.createTextNode(
      "Hospitals and manufacturers should face the same level of federal scrutiny. The current imbalance is an equity argument."
    ));

    block.appendChild(left);
    block.appendChild(conclusion);
    parent.appendChild(block);
  }

  function appendRebuttalTable(parent) {
    var sec = document.createElement("p");
    sec.className = "pr-section";
    sec.textContent = "What manufacturers argue \u2014 and the response";
    parent.appendChild(sec);

    var table = document.createElement("table");
    table.className = "pr-rebuttal";

    var cbStr = "$" + staticMetric("COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95).toFixed(2);
    var hAud = staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179);
    var mAud = staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5);
    var rebuttals = [
      [
        "340B creates duplicate discounts.",
        "PA DHS runs the 340B Drug Exclusion List preventing this. Federal law (42 U.S.C. \u00A7256b) already prohibits duplicate discounts.",
        "PA DHS Exclusion List; HRSA program integrity rules"
      ],
      [
        "Hospitals use 340B savings for profit.",
        cbStr + "B in reported community benefit (2024) funds free prescriptions, cancer screening, dental care, and rural services.",
        "340B Health 2024 community benefit report"
      ],
      [
        "Contract pharmacy networks are unaudited.",
        "HRSA conducted " + hAud + " covered-entity audits vs. only " + mAud + " manufacturer audits in FY 2024.",
        "HRSA Program Integrity FY 2024"
      ]
    ];

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["Manufacturer claim", "HAP response", "Evidence"].forEach(function (h) {
      var th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    rebuttals.forEach(function (row) {
      var tr = document.createElement("tr");
      row.forEach(function (cell) {
        var td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    parent.appendChild(table);
  }

  function appendPAStakes(parent, onePager) {
    var sec = document.createElement("p");
    sec.className = "pr-section";
    sec.textContent = "Pennsylvania operating stakes";
    parent.appendChild(sec);

    var block = document.createElement("div");
    block.className = "pr-pa-stakes" + (onePager ? " pr-pa-stakes--compact" : "");
    var title = document.createElement("p");
    title.className = "pr-pa-stakes-title";
    title.textContent = "Why 340B is not optional for PA hospitals";
    block.appendChild(title);

    var ul = document.createElement("ul");
    var hA = staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179);
    var mA = staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5);
    var xMult = mA > 0 ? Math.round(hA / mA) : 36;
    (onePager
      ? [
          staticMetric("PA_HOSPITALS_340B_COUNT", 72) + " PA hospitals (30% of all) depend on 340B",
          staticMetric("PA_HOSPITALS_OPERATING_LOSS_PCT", 63) + "% of PA 340B hospitals operate at a loss",
          staticMetric("PA_RURAL_HOSPITAL_PCT", 38) + "% rural \u2014 contract pharmacies often the only access point",
          hA + " HRSA audits vs. " + mA + " manufacturer audits (FY 2024) \u2014 " + xMult + "\u00D7 more hospital scrutiny"
        ]
      : [
          staticMetric("PA_HOSPITALS_340B_COUNT", 72) + " PA hospitals (30% of all) depend on 340B to serve patients",
          staticMetric("PA_HOSPITALS_OPERATING_LOSS_PCT", 63) + "% of PA 340B hospitals operate at a financial loss",
          staticMetric("PA_RURAL_HOSPITAL_PCT", 38) + "% are rural \u2014 contract pharmacies are the only access point for many patients",
          staticMetric("PA_LD_SERVICES_PCT", 95) + "% provide labor & delivery services",
          hA + " HRSA audits vs. " + mA + " manufacturer audits (FY 2024) \u2014 hospitals face " + xMult + "\u00D7 more scrutiny"
        ]
    ).forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });
    block.appendChild(ul);
    parent.appendChild(block);
  }

  function appendStateTable(parent, type) {
    if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined") return;

    var sec = document.createElement("p");
    sec.className = "pr-section";
    sec.textContent = "State contract pharmacy protection status";
    parent.appendChild(sec);

    var selected = [];
    var statesSelect = document.getElementById("report-states");
    if (type === "state-comparison" && statesSelect) {
      for (var i = 0; i < statesSelect.selectedOptions.length; i++) {
        selected.push(statesSelect.selectedOptions[i].value);
      }
    }

    var table = document.createElement("table");
    table.className = "pr-state-table";

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["State", "Contract Pharmacy", "PBM Law", "Year", "Notes"].forEach(function (h) {
      var th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    Object.keys(STATE_NAMES)
      .filter(function (a) { return a !== "DC" && (selected.length === 0 || selected.indexOf(a) !== -1); })
      .sort(function (a, b) { return STATE_NAMES[a].localeCompare(STATE_NAMES[b]); })
      .forEach(function (abbr) {
        var s = STATE_340B[abbr] || {};
        var tr = document.createElement("tr");

        var tdName = document.createElement("td");
        tdName.textContent = STATE_NAMES[abbr];
        tr.appendChild(tdName);

        var tdCp = document.createElement("td");
        tdCp.textContent = s.cp ? "Yes" : "No";
        tdCp.className = s.cp ? "pr-state-yes" : "pr-state-no";
        tr.appendChild(tdCp);

        var tdPbm = document.createElement("td");
        tdPbm.textContent = s.pbm ? "Yes" : "No";
        tdPbm.className = s.pbm ? "pr-state-yes" : "pr-state-no";
        tr.appendChild(tdPbm);

        var tdYear = document.createElement("td");
        tdYear.textContent = s.y || "\u2014";
        tr.appendChild(tdYear);

        var tdNotes = document.createElement("td");
        tdNotes.textContent = s.notes || "";
        tr.appendChild(tdNotes);

        tbody.appendChild(tr);
      });
    table.appendChild(tbody);
    parent.appendChild(table);
  }

  function appendSources(parent, onePager) {
    var p = document.createElement("p");
    p.className = "pr-sources" + (onePager ? " pr-sources--compact" : "");
    p.textContent = "Sources: MultiState \u00B7 ASHP \u00B7 America\u2019s Essential Hospitals (state law) \u00B7 340B Health \u00B7 AHA (community benefit) \u00B7 HRSA Program Integrity FY 2024 (audit counts) \u00B7 42 U.S.C. \u00A7256b (federal statutory basis)";
    parent.appendChild(p);
    if (!onePager) {
      var lim = document.createElement("p");
      lim.className = "pr-sources";
      lim.textContent = "Limitations: State law counts change as legislatures meet. Community benefit totals are self-reported aggregates, not independently audited.";
      parent.appendChild(lim);
    } else {
      var lim2 = document.createElement("p");
      lim2.className = "pr-sources pr-sources--compact";
      lim2.textContent = "Limitations: State law counts change with sessions; community benefit figures are self-reported.";
      parent.appendChild(lim2);
    }
  }

  function appendFooter(parent, freshness, onePager) {
    var footer = document.createElement("div");
    footer.className = "pr-footer" + (onePager ? " pr-footer--compact" : "");
    var left = document.createElement("span");
    left.textContent = "The Hospital and Healthsystem Association of Pennsylvania \u2014 haponline.org/340b";
    var mid = document.createElement("span");
    mid.textContent = "(717) 564-9200";
    var right = document.createElement("span");
    right.textContent = freshness + " \u2014 Generated " + new Date().toLocaleDateString();
    footer.appendChild(left);
    footer.appendChild(mid);
    footer.appendChild(right);
    parent.appendChild(footer);
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
      rows.push(["PA 340B Hospitals", String(staticMetric("PA_HOSPITALS_340B_COUNT", 72))]);
      rows.push(["Rural Hospitals", staticMetric("PA_RURAL_HOSPITAL_PCT", 38) + "%"]);
      rows.push(["Operating at a Loss", staticMetric("PA_HOSPITALS_OPERATING_LOSS_PCT", 63) + "%"]);
      rows.push(["L&D Services", staticMetric("PA_LD_SERVICES_PCT", 95) + "%"]);
      rows.push(["HRSA Hospital Audits FY24", String(staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179))]);
      rows.push(["Manufacturer Audits FY24", String(staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5))]);
      rows.push(["Community Benefit", "$" + staticMetric("COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95).toFixed(2) + "B"]);
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
                       src === "warehouse-gold" ? "Live — Data warehouse" :
                       src === "warehouse-api" ? "Live — Warehouse API" :
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
        var asOf = (typeof CONFIG !== "undefined" && CONFIG.dataFreshness) ? CONFIG.dataFreshness : "";
        freshness.textContent = "Last updated: " + (asOf || DataLayer.lastRefreshed.toLocaleString());
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
