/**
 * 340b-BASIC — map only. Local assets only. No print, PDF, share, localStorage, or external fetch.
 * Uses textContent for all dynamic labels.
 */
(function () {
  "use strict";

  var MAP_MAX_WIDTH = 960;
  var MAP_ASPECT = 0.55;

  function getStateAbbr(feature) {
    var id = feature && (feature.id != null ? feature.id : (feature.properties && (feature.properties.FIPS || feature.properties.STATE)));
    var numericId;
    if (!id) return null;
    numericId = parseInt(id, 10);
    return FIPS_TO_ABBR[!isNaN(numericId) ? numericId : id] || FIPS_TO_ABBR[String(id)] || null;
  }

  function drawBasicMap() {
    var container = document.getElementById("basic-us-map");
    var atlas = window.US_ATLAS_STATES_10M;
    var detailEl = document.getElementById("basic-state-detail");
    var statusEl = document.getElementById("basic-state-selection-status");
    var tooltip = document.getElementById("basic-map-tooltip");
    if (!container || typeof d3 === "undefined" || typeof topojson === "undefined" || !atlas || !atlas.objects || !atlas.objects.states) {
      if (container) {
        container.textContent = "";
        var p = document.createElement("p");
        p.className = "basic-map-fallback";
        p.textContent = "Map data could not load. Use the full dashboard at 340b.html if needed.";
        container.appendChild(p);
      }
      return;
    }

    var width = Math.min(container.offsetWidth || 800, MAP_MAX_WIDTH);
    var height = Math.round(width * MAP_ASPECT);
    var states = topojson.feature(atlas, atlas.objects.states);
    var projection = d3.geoAlbersUsa().fitSize([width, height], states);
    var pathGen = d3.geoPath(projection);
    var rootStyles = window.getComputedStyle(document.documentElement);
    var protectionColor = (rootStyles.getPropertyValue("--hap-topic-access") || "").trim() || "#0b67c2";
    var noProtectionColor = (rootStyles.getPropertyValue("--hap-topic-neutral-soft") || "").trim() || "#d7e0ea";

    container.textContent = "";
    var svg = d3.select(container)
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "auto")
      .attr("role", "img")
      .attr("aria-label", "US map: blue = contract pharmacy protection, gray = no state law");

    var g = svg.append("g");
    g.selectAll("path")
      .data(states.features)
      .join("path")
      .attr("class", function (d) {
        var abbr = getStateAbbr(d);
        var has = abbr && STATES_WITH_PROTECTION.indexOf(abbr) >= 0;
        return has ? "basic-state basic-state--yes" : "basic-state basic-state--no";
      })
      .attr("d", pathGen)
      .attr("data-state", function (d) { return getStateAbbr(d) || ""; })
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", function (d) {
        var abbr = getStateAbbr(d);
        var name = STATE_NAMES[abbr] || abbr || "State";
        var has = abbr && STATES_WITH_PROTECTION.indexOf(abbr) >= 0;
        return name + ": " + (has ? "contract pharmacy protection enacted" : "no enacted contract pharmacy protection law");
      })
      .attr("fill", function (d) {
        var abbr = getStateAbbr(d);
        return abbr && STATES_WITH_PROTECTION.indexOf(abbr) >= 0 ? protectionColor : noProtectionColor;
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .on("click", function (event, d) {
        var abbr = getStateAbbr(d);
        if (!abbr || !detailEl) return;
        var name = STATE_NAMES[abbr] || abbr;
        var data = STATE_340B[abbr];
        var line = name + " — " + (data && data.cp ? "State law protects contract pharmacy access." : "No state law protecting contract pharmacy access yet.");
        detailEl.textContent = line;
        if (statusEl) statusEl.textContent = line;
      })
      .on("keydown", function (event, d) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        var abbr = getStateAbbr(d);
        if (!abbr || !detailEl) return;
        var name = STATE_NAMES[abbr] || abbr;
        var data = STATE_340B[abbr];
        var line = name + " — " + (data && data.cp ? "State law protects contract pharmacy access." : "No state law protecting contract pharmacy access yet.");
        detailEl.textContent = line;
        if (statusEl) statusEl.textContent = line;
      })
      .on("mouseenter", function (event, d) {
        var abbr = getStateAbbr(d);
        if (!tooltip || !abbr) return;
        var name = STATE_NAMES[abbr] || abbr;
        var data = STATE_340B[abbr];
        var statusLine = data && data.cp ? "State law protects contract pharmacy." : "No contract pharmacy protection law yet.";
        tooltip.textContent = name + " — " + statusLine;
        tooltip.classList.add("basic-map-tooltip--visible");
      })
      .on("mousemove", function (event) {
        if (!tooltip) return;
        tooltip.style.left = event.clientX + 12 + "px";
        tooltip.style.top = event.clientY + 12 + "px";
      })
      .on("mouseleave", function () {
        if (tooltip) {
          tooltip.classList.remove("basic-map-tooltip--visible");
          tooltip.textContent = "";
        }
      });
  }

  function init() {
    drawBasicMap();
    window.addEventListener("resize", function () {
      clearTimeout(window._basicMapResize);
      window._basicMapResize = setTimeout(drawBasicMap, 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
