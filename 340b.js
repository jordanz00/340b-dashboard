/**
 * HAP 340B Advocacy Dashboard — Main Script
 * ==========================================
 * Handles: map, state chips, filters, keyboard nav, URL hash, count-up,
 * scroll reveals, presentation mode, dark mode, print, share.
 *
 * Depends on: state-data.js (CONFIG, STATE_340B, etc.), D3.js, Topojson
 */

(function () {
  "use strict";

  var config = typeof CONFIG !== "undefined" ? CONFIG : {
    dataFreshness: "March 2025",
    lastUpdated: "March 2025",
    mapDataUrl: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    mapAspectRatio: 0.55,
    mapMaxWidth: 960,
    countUpDuration: 1200,
    dominoDelayPerState: 55,
    scrollRevealThreshold: 0.1,
  };

  var selectedStateAbbr = null;
  var mapPaths = null;
  var stateFeatures = null;
  var pathGenerator = null;

  /* ========== UTILITY HELPERS ========== */

  function getStateAbbr(d) {
    var id = d.id != null ? d.id : (d.properties && (d.properties.FIPS || d.properties.STATE));
    if (!id) return null;
    var n = parseInt(id, 10);
    return FIPS_TO_ABBR[!isNaN(n) ? n : id] || FIPS_TO_ABBR[String(id)] || null;
  }

  function getStateName(abbr, d) {
    return (abbr && STATE_NAMES[abbr]) || (d && d.properties && d.properties.name) || abbr || "State";
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ========== MAP: DRAW & BIND ========== */

  function showMapError(container, message, showRetry) {
    if (!container) return;
    var skeleton = document.getElementById("map-loading-skeleton");
    if (skeleton) skeleton.classList.add("hidden");
    var retryHtml = showRetry
      ? ' <button type="button" class="map-retry-btn" id="map-retry-btn">Retry</button>'
      : "";
    container.innerHTML =
      "<p class='map-error-msg'>" + message + retryHtml + "</p>";
    if (showRetry) {
      var btn = document.getElementById("map-retry-btn");
      if (btn) btn.addEventListener("click", function () { drawMap(); });
    }
  }

  function drawMap() {
    var mapContainer = document.getElementById("us-map");
    if (!mapContainer) return;

    var width = Math.min(mapContainer.offsetWidth || 800, config.mapMaxWidth);
    var height = Math.round(width * config.mapAspectRatio);

    if (typeof d3 === "undefined" || typeof topojson === "undefined") {
      showMapError(
        mapContainer,
        "Map libraries could not load. Please check your connection and refresh the page.",
        true
      );
      var skel = document.getElementById("map-loading-skeleton");
      if (skel) skel.classList.add("hidden");
      return;
    }

    mapContainer.innerHTML = "";
    var svg = d3.select("#us-map").append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto");

    d3.json(config.mapDataUrl)
      .then(function (us) {
        var states = topojson.feature(us, us.objects.states);
        var projection = d3.geoAlbersUsa().fitSize([width, height], states);
        pathGenerator = d3.geoPath(projection);
        stateFeatures = states.features;

        var group = svg.append("g");
        var orderMap = {};
        var indexed = states.features.map(function (d, i) {
          return { d: d, i: i };
        });
        indexed.sort(function (a, b) {
          var ca = pathGenerator.centroid(a.d);
          var cb = pathGenerator.centroid(b.d);
          return ca[0] - cb[0];
        });
        indexed.forEach(function (it, o) {
          orderMap[it.i] = o;
        });

        var reduceMotion = prefersReducedMotion();
        mapPaths = group
          .selectAll("path")
          .data(states.features)
          .join("path")
          .attr("class", function (d, i) {
            var abbr = getStateAbbr(d);
            var base = "state " + (abbr && STATES_WITH_PROTECTION.indexOf(abbr) >= 0 ? "protection" : "no-protection");
            return reduceMotion ? base : base + " state-domino";
          })
          .attr("d", pathGenerator)
          .attr("data-state", function (d) {
            return getStateAbbr(d) || "";
          })
          .attr("fill", function (d) {
            var abbr = getStateAbbr(d);
            return abbr && STATES_WITH_PROTECTION.indexOf(abbr) >= 0 ? "#0066a1" : "#e2e8f0";
          })
          .attr("stroke", "rgba(255,255,255,0.9)")
          .attr("stroke-width", 1)
          .each(function (_, i) {
            this.style.animationDelay = (orderMap[i] || 0) * config.dominoDelayPerState + "ms";
          });

        bindMapEvents(mapPaths);
        setupMapKeyboardNav();

        var wrap = document.getElementById("us-map-wrap");
        if (wrap) {
          if (reduceMotion) {
            wrap.classList.add("visible", "map-visible");
          } else {
            var io = new IntersectionObserver(
              function (entries) {
                if (entries[0].isIntersecting) {
                  wrap.classList.add("visible", "map-visible");
                }
              },
              { threshold: 0.1 }
            );
            io.observe(wrap);
          }
        }

        var skel = document.getElementById("map-loading-skeleton");
        if (skel) skel.classList.add("hidden");

        var hash = (location.hash || "").replace(/^#state-/, "");
        if (hash && hash.length === 2) {
          selectStateByAbbr(hash.toUpperCase());
          var mapSection = document.getElementById("state-laws");
          if (mapSection) mapSection.scrollIntoView({ behavior: "smooth" });
        }
      })
      .catch(function (err) {
        if (typeof console !== "undefined" && console.warn) {
          console.warn("340B map: data load failed", err);
        }
        showMapError(
          mapContainer,
          "Map data temporarily unavailable. Please check your connection and refresh the page.",
          true
        );
        var skel = document.getElementById("map-loading-skeleton");
        if (skel) skel.classList.add("hidden");
      });
  }

  function bindMapEvents(paths) {
    var tooltip = document.getElementById("map-tooltip");
    var panel = document.getElementById("state-detail-panel");
    if (!tooltip || !panel) return;

    function placeTooltip(ev) {
      tooltip.style.left = ev.clientX + "px";
      tooltip.style.top = ev.clientY + 14 + "px";
    }

    paths
      .on("mouseenter", function (ev, d) {
        var abbr = getStateAbbr(d);
        tooltip.textContent = getStateName(abbr, d);
        placeTooltip(ev);
        tooltip.classList.add("visible");
        tooltip.setAttribute("aria-hidden", "false");
      })
      .on("mousemove", placeTooltip)
      .on("mouseleave", function () {
        tooltip.classList.remove("visible");
        tooltip.setAttribute("aria-hidden", "true");
      })
      .on("click", function (ev, d) {
        ev.stopPropagation();
        tooltip.classList.remove("visible");
        var abbr = getStateAbbr(d);
        selectStateByAbbr(abbr);
      });

    document.addEventListener("click", function (ev) {
      if (!panel.contains(ev.target) && !ev.target.closest("#us-map path")) {
        clearStateSelection();
      }
    });
  }

  function selectStateByAbbr(abbr) {
    if (!abbr) return;
    selectedStateAbbr = abbr;
    updateUrlHash(abbr);
    updateStateDetailPanel(abbr);
    highlightMapState(abbr);
    highlightStateChip(abbr);
  }

  function clearStateSelection() {
    selectedStateAbbr = null;
    updateUrlHash(null);
    var panel = document.getElementById("state-detail-panel");
    if (panel) {
      panel.classList.add("empty");
      panel.innerHTML = "<p>Select a state</p>";
      panel.setAttribute("aria-live", "polite");
    }
    unhighlightMapState();
    unhighlightStateChip();
  }

  function updateStateDetailPanel(abbr) {
    var panel = document.getElementById("state-detail-panel");
    if (!panel) return;
    var name = getStateName(abbr, null);
    var data = abbr && STATE_340B[abbr] ? STATE_340B[abbr] : null;
    panel.classList.remove("empty");
    if (!data) {
      panel.innerHTML = "<h4>" + name + "</h4><p>No state law data.</p>";
    } else {
      var html =
        "<h4>" + name + "</h4><p><span class='badge " + (data.cp ? "yes" : "no") + "'>Contract pharmacy: " + (data.cp ? "Yes" : "No") + "</span> <span class='badge " + (data.pbm ? "yes" : "no") + "'>PBM: " + (data.pbm ? "Yes" : "No") + "</span></p>";
      if (data.y) html += "<p>Law year: " + data.y + "</p>";
      if (data.notes) html += "<p>" + data.notes + "</p>";
      panel.innerHTML = html;
    }
    panel.setAttribute("aria-live", "polite");
  }

  function highlightMapState(abbr) {
    if (!mapPaths) return;
    mapPaths
      .classed("selected", false)
      .filter(function (d) {
        return getStateAbbr(d) === abbr;
      })
      .classed("selected", true);
  }

  function unhighlightMapState() {
    if (mapPaths) mapPaths.classed("selected", false);
  }

  function updateUrlHash(abbr) {
    var newHash = abbr ? "#state-" + abbr : "";
    if (location.hash !== newHash) {
      if (history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search + newHash);
      } else {
        location.hash = newHash;
      }
    }
  }

  function highlightStateChip(abbr) {
    document.querySelectorAll(".state-chip.selected").forEach(function (el) {
      el.classList.remove("selected");
    });
    var chip = document.querySelector(".state-chip[data-state='" + abbr + "']");
    if (chip) {
      chip.classList.add("selected");
      chip.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function unhighlightStateChip() {
    document.querySelectorAll(".state-chip.selected").forEach(function (el) {
      el.classList.remove("selected");
    });
  }

  /* ========== KEYBOARD NAVIGATION FOR MAP ========== */

  function setupMapKeyboardNav() {
    if (!stateFeatures || !pathGenerator) return;
    var focusable = document.querySelectorAll("#us-map path[data-state]");
    var list = Array.prototype.slice.call(focusable);
    list.forEach(function (path, i) {
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", "Select " + (path.getAttribute("data-state") || "state"));
      path.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          selectStateByAbbr(path.getAttribute("data-state"));
        }
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
          ev.preventDefault();
          var next = list[i + 1];
          if (next) next.focus();
        }
        if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
          ev.preventDefault();
          var prev = list[i - 1];
          if (prev) prev.focus();
        }
      });
    });
  }

  /* ========== STATE CHIPS: RENDER, SYNC, FILTER ========== */

  function renderStateChips() {
    var withList = document.getElementById("states-with-list");
    var withoutList = document.getElementById("states-without-list");
    var protectionCount = document.getElementById("protection-count");
    var noProtectionCount = document.getElementById("no-protection-count");
    if (!withList || !withoutList) return;

    var withProtection = [];
    var withoutProtection = [];
    var abbrs = Object.keys(STATE_340B).filter(function (a) { return a !== "DC"; }).sort();
    abbrs.forEach(function (abbr) {
      var data = STATE_340B[abbr];
      var chip = "<span class='state-chip' data-state='" + abbr + "' tabindex='0' role='button' aria-label='View " + (STATE_NAMES[abbr] || abbr) + " details'>" + abbr + "</span>";
      if (data && data.cp) {
        withProtection.push({ abbr: abbr, chip: chip });
      } else {
        withoutProtection.push({ abbr: abbr, chip: chip });
      }
    });

    withList.innerHTML = withProtection.map(function (x) { return x.chip; }).join("");
    withoutList.innerHTML = withoutProtection.map(function (x) { return x.chip; }).join("");

    if (protectionCount) protectionCount.textContent = withProtection.length;
    if (noProtectionCount) noProtectionCount.textContent = withoutProtection.length;

    initStateChipClickHandlers();
    initStateListHover();
    initStateFilter();
  }

  function initStateChipClickHandlers() {
    document.querySelectorAll(".state-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var abbr = chip.getAttribute("data-state");
        if (abbr) selectStateByAbbr(abbr);
      });
      chip.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          var abbr = chip.getAttribute("data-state");
          if (abbr) selectStateByAbbr(abbr);
        }
      });
    });
  }

  function initStateListHover() {
    var tooltip = document.getElementById("state-list-tooltip");
    if (!tooltip) return;
    document.querySelectorAll(".state-chip").forEach(function (chip) {
      var abbr = chip.getAttribute("data-state");
      var data = abbr && STATE_340B[abbr] ? STATE_340B[abbr] : null;
      chip.setAttribute("title", (STATE_NAMES[abbr] || abbr) + (data && data.notes ? ": " + data.notes : ""));
      function showTooltip(ev) {
        var name = STATE_NAMES[abbr] || abbr;
        var html = "<strong>" + name + "</strong>";
        if (data) {
          html += " <span class='badge " + (data.cp ? "yes" : "no") + "'>CP: " + (data.cp ? "Yes" : "No") + "</span> <span class='badge " + (data.pbm ? "yes" : "no") + "'>PBM: " + (data.pbm ? "Yes" : "No") + "</span>";
          if (data.y) html += "<br>Year: " + data.y;
          if (data.notes) html += "<br>" + data.notes;
        }
        tooltip.innerHTML = html;
        if (ev && ev.clientX != null) {
          tooltip.style.left = ev.clientX + "px";
          tooltip.style.top = ev.clientY - 12 + "px";
        } else {
          var r = chip.getBoundingClientRect();
          tooltip.style.left = r.left + r.width / 2 - 80 + "px";
          tooltip.style.top = r.top - 8 + "px";
        }
        tooltip.classList.add("visible");
      }
      chip.addEventListener("mouseenter", showTooltip);
      chip.addEventListener("focus", showTooltip);
      chip.addEventListener("mousemove", function (ev) {
        tooltip.style.left = ev.clientX + "px";
        tooltip.style.top = ev.clientY - 12 + "px";
      });
      chip.addEventListener("mouseleave", function () {
        tooltip.classList.remove("visible");
      });
      chip.addEventListener("blur", function () {
        tooltip.classList.remove("visible");
      });
    });
  }

  function initStateFilter() {
    var searchInput = document.getElementById("state-search");
    var filterBtns = document.querySelectorAll(".state-filter-btn");
    var currentFilter = "all";
    var currentQuery = "";

    function matchesFilter(chip, hasProtection) {
      var matchFilter = currentFilter === "all" ||
        (currentFilter === "protection" && hasProtection) ||
        (currentFilter === "no-protection" && !hasProtection);
      if (!matchFilter) return false;
      var abbr = chip.getAttribute("data-state");
      var name = (STATE_NAMES[abbr] || abbr).toLowerCase();
      var q = currentQuery.toLowerCase();
      return !q || name.indexOf(q) >= 0 || abbr.toLowerCase().indexOf(q) >= 0;
    }

    function applyFilter() {
      document.querySelectorAll("#states-with-list .state-chip, #states-without-list .state-chip").forEach(function (chip) {
        var block = chip.closest(".state-list-block");
        var hasProtection = block && block.classList.contains("protection");
        chip.style.display = matchesFilter(chip, hasProtection) ? "" : "none";
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        currentQuery = searchInput.value.trim();
        applyFilter();
      });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentFilter = btn.getAttribute("data-filter") || "all";
        filterBtns.forEach(function (b) {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        applyFilter();
      });
    });
  }

  /* ========== COUNT-UP ANIMATION ========== */

  function initCountUp() {
    var elements = document.querySelectorAll("[data-count-up]");
    var duration = config.countUpDuration || 1200;

    if (prefersReducedMotion()) {
      elements.forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-count-up"));
        var suffix = el.getAttribute("data-suffix") || "";
        var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
        el.textContent = (decimals ? target.toFixed(decimals) : Math.round(target)) + suffix;
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          if (el.dataset.done) return;
          el.dataset.done = "1";
          var target = parseFloat(el.getAttribute("data-count-up"));
          var suffix = el.getAttribute("data-suffix") || "";
          var decimals = parseInt(el.getAttribute("data-decimals"), 10) || 0;
          var start = performance.now();
          function animate(now) {
            var t = Math.min((now - start) / duration, 1);
            t = 1 - Math.pow(1 - t, 2.5);
            var val = target * t;
            el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
            if (t < 1) requestAnimationFrame(animate);
          }
          requestAnimationFrame(animate);
        });
      },
      { threshold: config.scrollRevealThreshold || 0.1 }
    );
    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ========== SCROLL REVEAL ========== */

  function initScrollReveal() {
    var elements = document.querySelectorAll(".scroll-reveal");
    if (prefersReducedMotion()) {
      elements.forEach(function (el) {
        el.classList.add("revealed");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ========== NAV HIGHLIGHT ========== */

  function initNavHighlight() {
    var navLinks = document.querySelectorAll(".dashboard-nav a[href^='#']");
    var policySections = ["oversight", "pa-impact", "community-benefit", "access", "pa-safeguards"];
    navLinks.forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.forEach(function (l) { l.classList.remove("active"); });
        a.classList.add("active");
      });
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.remove("active");
            var href = a.getAttribute("href");
            if (href === "#" + id) a.classList.add("active");
            else if (href === "#policy" && policySections.indexOf(id) >= 0) a.classList.add("active");
          });
        });
      },
      { rootMargin: "-80px 0 -50% 0", threshold: 0 }
    );
    document.querySelectorAll("#what-is-340b, #overview, #state-laws, #eligibility, #oversight, #pa-impact, #community-benefit, #access, #pa-safeguards").forEach(function (s) {
      observer.observe(s);
    });
  }

  /* ========== CONFIG INJECTION ========== */

  function injectConfig() {
    var freshness = document.getElementById("data-freshness-text");
    var methodology = document.getElementById("methodology-last-updated");
    if (freshness) freshness.textContent = "Data as of " + config.dataFreshness + " · Last updated " + config.lastUpdated;
    if (methodology) methodology.textContent = config.lastUpdated;
  }

  /* ========== BUTTON HANDLERS ========== */

  function initPrint() {
    var btn = document.getElementById("btn-print");
    if (btn) btn.addEventListener("click", function () { window.print(); });
  }

  function initShare() {
    var btn = document.getElementById("btn-share");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          btn.textContent = "Copied!";
          setTimeout(function () { btn.textContent = "Share"; }, 2000);
        }).catch(function () {
          fallbackCopy(url, btn);
        });
      } else {
        fallbackCopy(url, btn);
      }
    });
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = "Share"; }, 2000);
    } catch (e) {
      if (typeof console !== "undefined" && console.warn) console.warn("Copy failed", e);
    }
    document.body.removeChild(ta);
  }

  function initPresentation() {
    var btn = document.getElementById("btn-presentation");
    var exitBtn = document.getElementById("exit-presentation");
    var dashboard = document.querySelector(".dashboard");
    if (btn) {
      btn.addEventListener("click", function () {
        dashboard.classList.toggle("presentation-mode");
        btn.classList.toggle("active", dashboard.classList.contains("presentation-mode"));
      });
    }
    if (exitBtn) {
      exitBtn.addEventListener("click", function () {
        dashboard.classList.remove("presentation-mode");
        if (btn) btn.classList.remove("active");
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dashboard.classList.contains("presentation-mode")) {
        dashboard.classList.remove("presentation-mode");
        if (btn) btn.classList.remove("active");
      }
    });
  }

  function initDarkMode() {
    var btn = document.getElementById("btn-dark");
    var dashboard = document.querySelector(".dashboard");
    if (!btn) return;
    var saved = localStorage.getItem("340b-dark") === "1";
    if (saved) dashboard.classList.add("dark-mode");
    btn.classList.toggle("active", saved);
    btn.addEventListener("click", function () {
      dashboard.classList.toggle("dark-mode");
      var on = dashboard.classList.contains("dark-mode");
      localStorage.setItem("340b-dark", on ? "1" : "0");
      btn.classList.toggle("active", on);
    });
  }

  function initMethodology() {
    var toggle = document.getElementById("methodology-toggle");
    var content = document.getElementById("methodology-content");
    if (toggle && content) {
      toggle.addEventListener("click", function () {
        content.classList.toggle("open");
        toggle.setAttribute("aria-expanded", content.classList.contains("open"));
      });
    }
  }

  /* ========== RESIZE ========== */

  var lastMapWidth = 0;
  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function onResize() {
    if (isTouch) return;
    var mapEl = document.getElementById("us-map");
    if (!mapEl) return;
    var w = mapEl.offsetWidth;
    if (Math.abs(w - lastMapWidth) < 40 && lastMapWidth) return;
    lastMapWidth = w;
    drawMap();
  }

  /* ========== INIT ========== */

  function init() {
    injectConfig();
    renderStateChips();
    drawMap();
    var mapEl = document.getElementById("us-map");
    if (mapEl) lastMapWidth = mapEl.offsetWidth;
    initCountUp();
    initScrollReveal();
    initNavHighlight();
    initPrint();
    initShare();
    initPresentation();
    initDarkMode();
    initMethodology();
    if (!isTouch) {
      window.addEventListener("resize", function () {
        clearTimeout(window._resizeTimeout);
        window._resizeTimeout = setTimeout(onResize, 300);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
