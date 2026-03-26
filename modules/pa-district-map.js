/**
 * HAP 340B — PA Legislative District Map (House + Senate)
 * ======================================================
 *
 * Renders PA House (203) + Senate (50) district boundaries from local GeoJSON.
 * Colors districts by 340B hospital count when a local hospital points dataset is present.
 *
 * Security: DOM updates use textContent only; no innerHTML from data.
 */
/* global d3 */

(function () {
  "use strict";

  // Prefer script-inlined globals (works reliably under file://).
  var HOUSE_GLOBAL = "HAP_PA_DISTRICTS_HOUSE";
  var SENATE_GLOBAL = "HAP_PA_DISTRICTS_SENATE";
  // Fallback URLs (works under http(s) hosting / local server).
  var HOUSE_GEOJSON_URL = "data/pa-districts/PaHouse2024_03.geojson";
  var SENATE_GEOJSON_URL = "data/pa-districts/PaSenatorial2024_03.geojson";
  var HOSPITAL_POINTS_URL = "data/pa-districts/pa-340b-hospitals.json"; // optional

  var MAP_ID = "pa-district-map";
  var TOGGLE_SELECTOR = ".pa-district-toggle[data-pa-district-chamber]";

  var DETAIL_EMPTY_ID = "pa-district-detail-empty";
  var DETAIL_PANEL_ID = "pa-district-detail-panel";
  var EL_TITLE = "pa-district-detail-title";
  var EL_KICKER = "pa-district-detail-kicker";
  var EL_LEG = "pa-district-detail-legislator";
  var EL_PARTY = "pa-district-detail-party";
  var EL_COUNT = "pa-district-detail-count";
  var EL_HOSP = "pa-district-detail-hospitals";
  var EL_REL = "pa-district-detail-relationship";
  var EL_ACTION = "pa-district-detail-action";
  var EL_NOTE = "pa-district-detail-note";

  function safeText(val) {
    if (val == null) return "";
    return String(val).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  function getChamberLabel(chamber) {
    return chamber === "senate" ? "Senate District" : "House District";
  }

  function partyLabel(p) {
    var x = (p || "").toString().trim().toUpperCase();
    if (x === "D") return "D";
    if (x === "R") return "R";
    return x || "—";
  }

  // User-provided priority tracking (Senate only, selected districts).
  // Relationship here is treated as the same status label the table uses.
  var SENATE_PRIORITY = {
    10: { relationship: "Cosponsor", action: "Schedule meeting" },
    18: { relationship: "Supportive", action: "Send brief" },
    24: { relationship: "Unknown", action: "Call" },
    32: { relationship: "Opposed", action: "Call" },
    41: { relationship: "Cosponsor", action: "Schedule meeting" },
  };

  function selectEl(id) {
    return document.getElementById(id);
  }

  function setDetail(payload) {
    var empty = selectEl(DETAIL_EMPTY_ID);
    var panel = selectEl(DETAIL_PANEL_ID);
    if (!empty || !panel) return;

    empty.hidden = true;
    panel.hidden = false;

    var title = selectEl(EL_TITLE);
    var kicker = selectEl(EL_KICKER);
    var leg = selectEl(EL_LEG);
    var party = selectEl(EL_PARTY);
    var count = selectEl(EL_COUNT);
    var hospitals = selectEl(EL_HOSP);
    var rel = selectEl(EL_REL);
    var action = selectEl(EL_ACTION);
    var note = selectEl(EL_NOTE);

    if (kicker) kicker.textContent = safeText(payload.kicker || "District");
    if (title) title.textContent = safeText(payload.title || "—");
    if (leg) leg.textContent = safeText(payload.legislator || "—");
    if (party) party.textContent = safeText(payload.party || "—");
    if (count) count.textContent = payload.count == null ? "Data pending" : String(payload.count);
    if (hospitals) hospitals.textContent = safeText(payload.hospitals || (payload.count == null ? "Hospital dataset not loaded yet." : "—"));
    if (rel) rel.textContent = safeText(payload.relationship || "Not tracked yet");
    if (action) action.textContent = safeText(payload.action || "—");
    if (note) note.textContent = safeText(payload.note || "");
  }

  function resetDetail() {
    var empty = selectEl(DETAIL_EMPTY_ID);
    var panel = selectEl(DETAIL_PANEL_ID);
    if (!empty || !panel) return;
    panel.hidden = true;
    empty.hidden = false;
  }

  function districtFillClass(count) {
    if (count == null) return "unknown";
    if (count >= 3) return "hi";
    if (count >= 1) return "mid";
    return "zero";
  }

  function tryLoadJson(url) {
    // fetch() can fail under file:// in some browsers. Use XHR fallback.
    function xhrLoad() {
      return new Promise(function (resolve, reject) {
        try {
          var x = new XMLHttpRequest();
          x.open("GET", url, true);
          x.overrideMimeType("application/json");
          x.onreadystatechange = function () {
            if (x.readyState !== 4) return;
            if (x.status >= 200 && x.status < 300) {
              try {
                resolve(JSON.parse(x.responseText));
              } catch (e) {
                reject(e);
              }
              return;
            }
            // Some browsers return 0 for file:// success — try parse anyway.
            if (x.status === 0 && x.responseText) {
              try {
                resolve(JSON.parse(x.responseText));
              } catch (e2) {
                reject(e2);
              }
              return;
            }
            reject(new Error("xhr failed: " + url + " (" + x.status + ")"));
          };
          x.send(null);
        } catch (err) {
          reject(err);
        }
      });
    }

    if (typeof fetch !== "function") return xhrLoad();

    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("fetch failed: " + url);
        return r.json();
      })
      .catch(function () {
        return xhrLoad();
      });
  }

  function getLegislatorName(feature, chamber) {
    var p = feature.properties || {};
    if (chamber === "senate") {
      return [p.S_FIRSTNAM, p.S_LASTNAME].filter(Boolean).join(" ").trim() || "—";
    }
    return [p.H_FIRSTNAM, p.H_LASTNAME].filter(Boolean).join(" ").trim() || "—";
  }

  function getDistrictNumber(feature) {
    var p = feature.properties || {};
    var n = p.LEG_DISTRI;
    var asNum = typeof n === "number" ? n : parseInt(String(n || ""), 10);
    return isNaN(asNum) ? null : asNum;
  }

  function computeCounts(features, hospitals) {
    if (!hospitals || !Array.isArray(hospitals) || hospitals.length === 0) {
      return { counts: new Map(), names: new Map(), hasData: false };
    }

    // Prepare GeoJSON features for point-in-polygon checks.
    var counts = new Map();
    var names = new Map();

    features.forEach(function (f) {
      var n = getDistrictNumber(f);
      if (n == null) return;
      counts.set(n, 0);
      names.set(n, []);
    });

    hospitals.forEach(function (h) {
      if (!h || typeof h !== "object") return;
      var lon = Number(h.lon);
      var lat = Number(h.lat);
      if (!isFinite(lon) || !isFinite(lat)) return;
      var pt = [lon, lat];

      for (var i = 0; i < features.length; i++) {
        var f = features[i];
        var n = getDistrictNumber(f);
        if (n == null) continue;
        if (d3.geoContains(f, pt)) {
          counts.set(n, (counts.get(n) || 0) + 1);
          var arr = names.get(n) || [];
          var nm = safeText(h.name || "").trim();
          if (nm) arr.push(nm);
          names.set(n, arr);
          break;
        }
      }
    });

    return { counts: counts, names: names, hasData: true };
  }

  function render(chamber, geojson, hospitalPoints) {
    var wrap = selectEl(MAP_ID);
    if (!wrap) return;

    var width = Math.max(320, wrap.clientWidth || 800);
    var height = Math.max(360, Math.round(width * 0.72));

    wrap.replaceChildren();

    var svg = d3.select(wrap).append("svg")
      .attr("class", "pa-district-svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("role", "img")
      .attr("aria-label", "PA " + (chamber === "senate" ? "Senate" : "House") + " district map");

    var features = (geojson && geojson.features) ? geojson.features : [];
    var projection = d3.geoMercator().fitSize([width, height], geojson);
    var path = d3.geoPath(projection);

    var computed = computeCounts(features, hospitalPoints);

    // Note: if hospital dataset is absent, counts are null and districts render as "unknown" class.
    svg.append("g")
      .attr("class", "pa-district-layer")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", function (d) {
        var n = getDistrictNumber(d);
        var c = (computed.hasData && n != null) ? (computed.counts.get(n) || 0) : null;
        return "pa-district-shape pa-district-shape--" + districtFillClass(c);
      })
      .attr("d", path)
      .attr("tabindex", 0)
      .attr("data-district", function (d) {
        var n = getDistrictNumber(d);
        return n == null ? "" : String(n);
      })
      .on("click", function (event, d) {
        var n = getDistrictNumber(d);
        var p = d.properties || {};
        var legislator = getLegislatorName(d, chamber);
        var party = partyLabel(p.PARTY);

        var count = null;
        var hospNames = "";
        if (computed.hasData && n != null) {
          count = computed.counts.get(n) || 0;
          var list = computed.names.get(n) || [];
          hospNames = list.length ? list.join(", ") : "None found in dataset";
        }

        var rel = "Not tracked yet";
        var action = "—";
        if (chamber === "senate" && n != null && SENATE_PRIORITY[n]) {
          rel = SENATE_PRIORITY[n].relationship;
          action = SENATE_PRIORITY[n].action;
        }

        setDetail({
          kicker: getChamberLabel(chamber),
          title: (n == null ? "—" : ("SD " + n)),
          legislator: legislator,
          party: party,
          count: count,
          hospitals: hospNames,
          relationship: rel,
          action: action,
          note: (computed.hasData ? "" : "Hospital-to-district counts will populate once the PA 340B hospital points file is added locally.")
        });
      })
      .on("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
  }

  function setActiveToggle(chamber) {
    var toggles = document.querySelectorAll(TOGGLE_SELECTOR);
    toggles.forEach(function (btn) {
      var isOn = btn.getAttribute("data-pa-district-chamber") === chamber;
      btn.classList.toggle("is-active", isOn);
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");
    });
  }

  function init() {
    var wrap = selectEl(MAP_ID);
    if (!wrap || typeof d3 === "undefined") return;

    resetDetail();

    // Visible loading state (avoids a blank panel if data load fails).
    wrap.textContent = "Loading PA district map…";

    var state = {
      chamber: "house",
      house: null,
      senate: null,
      hospitals: null,
    };

    var g = (typeof window !== "undefined") ? window : this;
    var houseInline = g && g[HOUSE_GLOBAL] ? g[HOUSE_GLOBAL] : null;
    var senateInline = g && g[SENATE_GLOBAL] ? g[SENATE_GLOBAL] : null;

    Promise.all([
      houseInline ? Promise.resolve(houseInline) : tryLoadJson(HOUSE_GEOJSON_URL),
      senateInline ? Promise.resolve(senateInline) : tryLoadJson(SENATE_GEOJSON_URL),
      tryLoadJson(HOSPITAL_POINTS_URL).catch(function () { return null; }),
    ]).then(function (res) {
      state.house = res[0];
      state.senate = res[1];
      state.hospitals = res[2] && Array.isArray(res[2]) ? res[2] : null;

      setActiveToggle(state.chamber);
      render(state.chamber, state.house, state.hospitals);

      // Resize: redraw with current chamber.
      var onResize = function () {
        if (state.chamber === "senate") {
          render("senate", state.senate, state.hospitals);
        } else {
          render("house", state.house, state.hospitals);
        }
      };

      window.addEventListener("resize", function () {
        window.clearTimeout(onResize._t);
        onResize._t = window.setTimeout(onResize, 120);
      });

      var toggles = document.querySelectorAll(TOGGLE_SELECTOR);
      toggles.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var ch = btn.getAttribute("data-pa-district-chamber");
          state.chamber = ch === "senate" ? "senate" : "house";
          setActiveToggle(state.chamber);
          resetDetail();
          onResize();
        });
      });
    }).catch(function () {
      // Fail safely: show a readable message in the map panel.
      wrap.replaceChildren();
      var msg = document.createElement("div");
      msg.className = "pa-district-map-fallback";
      var t = document.createElement("p");
      t.className = "pa-district-map-title";
      t.textContent = "PA district map could not load";
      var p = document.createElement("p");
      p.className = "pa-district-map-fallback-text";
      p.textContent = "If you opened this page as a local file, try viewing it via a local server/preview so the GeoJSON files can be read. Files expected under data/pa-districts/.";
      msg.appendChild(t);
      msg.appendChild(p);
      wrap.appendChild(msg);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

