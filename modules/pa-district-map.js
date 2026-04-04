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
  var HOSPITALS_GLOBAL = "HAP_PA_340B_HOSPITALS";
  var ZIP_GLOBAL = "HAP_PA_ZIP_CENTROIDS";
  // Fallback URLs (works under http(s) hosting / local server).
  var HOUSE_GEOJSON_URL = "data/pa-districts/PaHouse2024_03.geojson";
  var SENATE_GEOJSON_URL = "data/pa-districts/PaSenatorial2024_03.geojson";
  var HOSPITAL_POINTS_URL = "data/pa-districts/pa-340b-hospitals.json"; // optional
  var PA_ZIP_CENTROIDS_URL = "data/pa-districts/pa-zip-centroids.json";

  var MAP_ID = "pa-district-map";
  var TOOLTIP_ID = "pa-district-map-tooltip";
  var TOGGLE_SELECTOR = ".pa-district-toggle[data-pa-district-chamber]";

  var interactiveState = {
    legendFilter: "all",
  };

  var tooltipHideTimer = null;

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

  function getDistrictPrefix(chamber) {
    return chamber === "senate" ? "SD " : "HD ";
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

  function tooltipLine(chamber, feature, computed) {
    var snap = computeDistrictSnapshot(chamber, feature, computed);
    var countStr;
    if (snap.count == null) {
      countStr = "data pending";
    } else if (snap.count === 1) {
      countStr = "1 hospital";
    } else {
      countStr = String(snap.count) + " hospitals";
    }
    return snap.districtLabel + " · " + countStr;
  }

  function cancelHideTooltip() {
    if (tooltipHideTimer != null) {
      window.clearTimeout(tooltipHideTimer);
      tooltipHideTimer = null;
    }
  }

  function scheduleHideTooltip() {
    cancelHideTooltip();
    tooltipHideTimer = window.setTimeout(function () {
      var el = selectEl(TOOLTIP_ID);
      if (el) el.hidden = true;
      tooltipHideTimer = null;
    }, 120);
  }

  function moveTooltip(event) {
    var el = selectEl(TOOLTIP_ID);
    if (!el || el.hidden) return;
    var padX = 14;
    var padY = 14;
    var x = event.clientX + padX;
    var y = event.clientY + padY;
    var maxX = window.innerWidth - el.offsetWidth - 8;
    var maxY = window.innerHeight - el.offsetHeight - 8;
    if (x > maxX) x = Math.max(8, maxX);
    if (y > maxY) y = Math.max(8, maxY);
    el.style.left = x + "px";
    el.style.top = y + "px";
  }

  function showTooltip(event, chamber, feature, computed) {
    var el = selectEl(TOOLTIP_ID);
    if (!el) return;
    cancelHideTooltip();
    el.textContent = tooltipLine(chamber, feature, computed);
    el.hidden = false;
    moveTooltip(event);
  }

  function applyLegendFilter() {
    var wrap = selectEl(MAP_ID);
    if (!wrap) return;
    var f = interactiveState.legendFilter;
    wrap.querySelectorAll(".pa-district-shape").forEach(function (el) {
      var b = el.getAttribute("data-bucket") || "unknown";
      var dim = f !== "all" && b !== f;
      el.classList.toggle("pa-district-shape--dimmed", dim);
    });
    document.querySelectorAll(".pa-district-legend__chip").forEach(function (btn) {
      var id = btn.getAttribute("data-pa-bucket") || "all";
      var on = id === f;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function bindLegendChips() {
    document.querySelectorAll(".pa-district-legend__chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var b = btn.getAttribute("data-pa-bucket") || "all";
        if (interactiveState.legendFilter === b && b !== "all") {
          interactiveState.legendFilter = "all";
        } else {
          interactiveState.legendFilter = b;
        }
        applyLegendFilter();
      });
    });
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

  function findFeatureByPoint(features, pt) {
    if (!features || !pt) return null;
    for (var i = 0; i < features.length; i++) {
      if (d3.geoContains(features[i], pt)) return features[i];
    }
    return null;
  }

  function geocodeZip(zip) {
    var clean = String(zip || "").replace(/[^0-9]/g, "");
    if (clean.length !== 5) {
      return Promise.reject(new Error("invalid_zip"));
    }

    var url = "https://api.zippopotam.us/us/" + clean;
    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("zip_not_found");
        return r.json();
      })
      .then(function (data) {
        var place = data && data.places && data.places[0];
        if (!place) throw new Error("zip_not_found");
        var lat = Number(place.latitude);
        var lon = Number(place.longitude);
        if (!isFinite(lat) || !isFinite(lon)) throw new Error("zip_not_found");
        return { zip: clean, lat: lat, lon: lon };
      });
  }

  function resolveZipToPoint(zip, zipLookup) {
    var clean = String(zip || "").replace(/[^0-9]/g, "");
    if (clean.length !== 5) return Promise.reject(new Error("invalid_zip"));

    // Primary: local PA ZIP centroids (works offline and avoids API failures).
    if (zipLookup && zipLookup[clean]) {
      var z = zipLookup[clean];
      var lat = Number(z.lat);
      var lon = Number(z.lon);
      if (isFinite(lat) && isFinite(lon)) {
        return Promise.resolve({ zip: clean, lat: lat, lon: lon, source: "local_zip_centroid" });
      }
    }

    // Fallback: public geocoder.
    return geocodeZip(clean).then(function (loc) {
      return { zip: clean, lat: loc.lat, lon: loc.lon, source: "remote_geocoder" };
    });
  }

  function computeDistrictSnapshot(chamber, feature, computed) {
    var n = getDistrictNumber(feature);
    var p = feature && feature.properties ? feature.properties : {};
    var count = null;
    var hospNames = "Hospital dataset not loaded yet.";
    if (computed && computed.hasData && n != null) {
      count = computed.counts.get(n) || 0;
      var list = computed.names.get(n) || [];
      hospNames = list.length ? list.join(", ") : "None found in dataset";
    }
    var rel = "";
    var action = "";
    if (chamber === "senate" && n != null && SENATE_PRIORITY[n]) {
      rel = SENATE_PRIORITY[n].relationship;
      action = SENATE_PRIORITY[n].action;
    }
    return {
      districtNumber: n,
      districtLabel: n == null ? "—" : (getDistrictPrefix(chamber) + n),
      legislator: getLegislatorName(feature, chamber),
      party: partyLabel(p.PARTY),
      count: count,
      hospitals: hospNames,
      relationship: rel || "Not tracked yet",
      action: action || "Schedule district briefing",
      chamberLabel: getChamberLabel(chamber)
    };
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

  function normalizeHospitalPoints(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.hospitals)) return raw.hospitals;
    return null;
  }

  function renderHospitalDots(svg, projection, hospitalPoints, chamber, features, computed) {
    if (!hospitalPoints || !Array.isArray(hospitalPoints) || hospitalPoints.length === 0) return;

    var dotData = hospitalPoints
      .map(function (h) {
        if (!h || typeof h !== "object") return null;
        var lon = Number(h.lon);
        var lat = Number(h.lat);
        if (!isFinite(lon) || !isFinite(lat)) return null;
        var xy = projection([lon, lat]);
        if (!xy || !isFinite(xy[0]) || !isFinite(xy[1])) return null;
        return { name: safeText(h.name || "Hospital"), x: xy[0], y: xy[1], lon: lon, lat: lat };
      })
      .filter(Boolean);

    var layer = svg.append("g").attr("class", "pa-district-hospital-layer");
    var circles = layer.selectAll("circle")
      .data(dotData)
      .enter()
      .append("circle")
      .attr("class", "pa-district-hospital-dot pa-district-hospital-dot--" + chamber)
      .attr("cx", function (d) { return d.x; })
      .attr("cy", -12)
      .attr("r", 4.6)
      .attr("opacity", 0)
      .attr("tabindex", 0)
      .on("click", function (event, d) {
        var f = findFeatureByPoint(features, [d.lon, d.lat]);
        if (!f) return;
        var snap = computeDistrictSnapshot(chamber, f, computed);
        if (snap.districtNumber != null) {
          selectDistrictShapeByNumber(snap.districtNumber);
        }
        setDetail({
          kicker: snap.chamberLabel,
          title: snap.districtLabel,
          legislator: snap.legislator,
          party: snap.party,
          count: snap.count,
          hospitals: snap.hospitals,
          relationship: snap.relationship,
          action: snap.action,
          note: ""
        });
      })
      .on("keydown", function (event, d) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      })
      .append("title")
      .text(function (d) { return d.name; });

    circles = layer.selectAll("circle");
    circles
      .transition()
      .delay(function (_, i) { return Math.min(i * 24, 1400); })
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr("cy", function (d) { return d.y; })
      .attr("opacity", 1);
  }

  function render(chamber, geojson, hospitalPoints) {
    var wrap = selectEl(MAP_ID);
    if (!wrap) return;

    var col = wrap.closest(".pa-district-map-col");
    var cw = col ? col.getBoundingClientRect().width : wrap.clientWidth;
    var width = Math.max(280, Math.floor(cw) || wrap.clientWidth || 800);
    var height = Math.max(300, Math.min(640, Math.round(width * 0.76)));

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
    var layer = svg.append("g").attr("class", "pa-district-layer");

    var shapes = layer
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", function (d) {
        var n = getDistrictNumber(d);
        var c = (computed.hasData && n != null) ? (computed.counts.get(n) || 0) : null;
        return "pa-district-shape pa-district-shape--" + districtFillClass(c);
      })
      .attr("data-bucket", function (d) {
        var n = getDistrictNumber(d);
        var c = (computed.hasData && n != null) ? (computed.counts.get(n) || 0) : null;
        return districtFillClass(c);
      })
      .attr("d", path)
      .attr("data-district", function (d) {
        var n = getDistrictNumber(d);
        return n == null ? "" : String(n);
      })
      .on("mouseenter", function (event, d) {
        cancelHideTooltip();
        d3.selectAll(".pa-district-shape--hover").classed("pa-district-shape--hover", false);
        d3.select(this).classed("pa-district-shape--hover", true);
        showTooltip(event, chamber, d, computed);
      })
      .on("mousemove", function (event) {
        moveTooltip(event);
      })
      .on("mouseleave", function () {
        d3.select(this).classed("pa-district-shape--hover", false);
        scheduleHideTooltip();
      })
      .on("click", function (event, d) {
        var node = this;
        d3.selectAll(".pa-district-shape--selected").classed("pa-district-shape--selected", false);
        d3.select(node).classed("pa-district-shape--selected", true);
        d3.select(node).classed("pa-district-shape--pulse", true);
        window.setTimeout(function () {
          d3.select(node).classed("pa-district-shape--pulse", false);
        }, 700);
        var snapshot = computeDistrictSnapshot(chamber, d, computed);

        setDetail({
          kicker: snapshot.chamberLabel,
          title: snapshot.districtLabel,
          legislator: snapshot.legislator,
          party: snapshot.party,
          count: snapshot.count,
          hospitals: snapshot.hospitals,
          relationship: snapshot.relationship,
          action: snapshot.action,
          note: (computed.hasData ? "" : "Hospital-to-district counts will populate once the PA 340B hospital points file is added locally.")
        });
      });

    renderHospitalDots(svg, projection, hospitalPoints, chamber, features, computed);
    applyLegendFilter();
    return { shapes: shapes };
  }

  function setActiveToggle(chamber) {
    var toggles = document.querySelectorAll(TOGGLE_SELECTOR);
    toggles.forEach(function (btn) {
      var isOn = btn.getAttribute("data-pa-district-chamber") === chamber;
      btn.classList.toggle("is-active", isOn);
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");
    });
  }

  function selectDistrictShapeByNumber(n) {
    var wrap = selectEl(MAP_ID);
    if (!wrap || n == null) return;
    var all = wrap.querySelectorAll(".pa-district-shape");
    all.forEach(function (el) {
      el.classList.remove("pa-district-shape--selected");
    });
    var target = wrap.querySelector('.pa-district-shape[data-district="' + String(n) + '"]');
    if (target) {
      target.classList.add("pa-district-shape--selected");
    }
  }

  function init() {
    var wrap = selectEl(MAP_ID);
    if (!wrap || typeof d3 === "undefined") return;

    bindLegendChips();
    resetDetail();

    // Visible loading state (avoids a blank panel if data load fails).
    wrap.textContent = "Loading PA district map…";

    var state = {
      chamber: "house",
      house: null,
      senate: null,
      hospitals: null,
      zipLookup: null,
      computedHouse: null,
      computedSenate: null,
    };

    var g = (typeof window !== "undefined") ? window : this;
    var houseInline = g && g[HOUSE_GLOBAL] ? g[HOUSE_GLOBAL] : null;
    var senateInline = g && g[SENATE_GLOBAL] ? g[SENATE_GLOBAL] : null;
    var hospitalsInline = g && g[HOSPITALS_GLOBAL] ? g[HOSPITALS_GLOBAL] : null;
    var zipInline = g && g[ZIP_GLOBAL] ? g[ZIP_GLOBAL] : null;

    Promise.all([
      houseInline ? Promise.resolve(houseInline) : tryLoadJson(HOUSE_GEOJSON_URL),
      senateInline ? Promise.resolve(senateInline) : tryLoadJson(SENATE_GEOJSON_URL),
      hospitalsInline ? Promise.resolve(hospitalsInline) : tryLoadJson(HOSPITAL_POINTS_URL).catch(function () { return null; }),
      zipInline ? Promise.resolve(zipInline) : tryLoadJson(PA_ZIP_CENTROIDS_URL).catch(function () { return null; }),
    ]).then(function (res) {
      state.house = res[0];
      state.senate = res[1];
      state.hospitals = normalizeHospitalPoints(res[2]);
      state.zipLookup = (res[3] && res[3].zips && typeof res[3].zips === "object") ? res[3].zips : null;
      state.computedHouse = computeCounts((state.house && state.house.features) || [], state.hospitals);
      state.computedSenate = computeCounts((state.senate && state.senate.features) || [], state.hospitals);

      var mapNote = document.querySelector(".pa-district-map-note");
      if (mapNote && state.hospitals && state.hospitals.length) {
        mapNote.textContent = "Click any district to see: district number and current legislator, number of 340B hospitals, hospital names, HAP relationship, and recommended action. Loaded " + state.hospitals.length + " PA 340B hospital points.";
      }

      setActiveToggle(state.chamber);
      render(state.chamber, state.house, state.hospitals);

      var stage = document.querySelector(".pa-district-map-stage");
      if (stage && !stage._hapPaMapStageBound) {
        stage._hapPaMapStageBound = true;
        stage.addEventListener("mouseleave", function () {
          scheduleHideTooltip();
          var w = selectEl(MAP_ID);
          if (w) {
            w.querySelectorAll(".pa-district-shape--hover").forEach(function (el) {
              el.classList.remove("pa-district-shape--hover");
            });
          }
        });
      }

      // Resize: redraw with current chamber.
      var onResize = function () {
        if (state.chamber === "senate") {
          render("senate", state.senate, state.hospitals);
        } else {
          render("house", state.house, state.hospitals);
        }
      };

      function debounceResize() {
        window.clearTimeout(onResize._t);
        onResize._t = window.setTimeout(onResize, 120);
      }
      window.addEventListener("resize", debounceResize);
      if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
        window.visualViewport.addEventListener("resize", debounceResize);
      }

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

      window.addEventListener("hap:pa-district-zip-lookup", function (evt) {
        var detail = evt && evt.detail ? evt.detail : {};
        var zip = String(detail.zip || "").replace(/[^0-9]/g, "");
        var statusEl = selectEl("pa-district-lookup-status");

        function setLookupStatus(msg, isError) {
          if (!statusEl) return;
          statusEl.textContent = msg || "";
          statusEl.classList.toggle("is-error", !!isError);
        }

        if (zip.length !== 5) {
          setLookupStatus("Enter a valid 5-digit ZIP code.", true);
          return;
        }
        if (state.zipLookup && !state.zipLookup[zip]) {
          setLookupStatus("Not a PA ZIP code.", true);
          return;
        }

        setLookupStatus("Looking up legislators…", false);
        resolveZipToPoint(zip, state.zipLookup).then(function (loc) {
          var pt = [loc.lon, loc.lat];
          var houseFeature = findFeatureByPoint((state.house && state.house.features) || [], pt);
          var senateFeature = findFeatureByPoint((state.senate && state.senate.features) || [], pt);

          if (!houseFeature && !senateFeature) {
            setLookupStatus("No PA district match found for ZIP " + zip + ".", true);
            return;
          }

          var houseSnap = houseFeature ? computeDistrictSnapshot("house", houseFeature, state.computedHouse) : null;
          var senateSnap = senateFeature ? computeDistrictSnapshot("senate", senateFeature, state.computedSenate) : null;

          var statusParts = [];
          if (houseSnap) {
            statusParts.push(houseSnap.districtLabel + ": " + houseSnap.legislator);
          }
          if (senateSnap) {
            statusParts.push(senateSnap.districtLabel + ": " + senateSnap.legislator);
          }
          setLookupStatus("ZIP " + zip + " — " + statusParts.join(" | "), false);

          var activeSnap = state.chamber === "senate" ? senateSnap : houseSnap;
          if (!activeSnap) activeSnap = houseSnap || senateSnap;
          if (!activeSnap) return;
          interactiveState.legendFilter = "all";
          applyLegendFilter();

          if (activeSnap.districtNumber != null) {
            selectDistrictShapeByNumber(activeSnap.districtNumber);
          }

          setDetail({
            kicker: activeSnap.chamberLabel,
            title: activeSnap.districtLabel,
            legislator: activeSnap.legislator,
            party: activeSnap.party,
            count: activeSnap.count,
            hospitals: activeSnap.hospitals,
            relationship: activeSnap.relationship,
            action: activeSnap.action,
            note: ""
          });
        }).catch(function () {
          setLookupStatus("Could not resolve that ZIP code right now. Try another PA ZIP.", true);
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

