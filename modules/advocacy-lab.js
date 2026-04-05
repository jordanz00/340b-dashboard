/**
 * advocacy-lab.js — Novice-friendly PA 340B advocacy demo (map, KPI chart, story, print, AI stubs)
 *
 * WHO THIS IS FOR: New developers learning the HAP dashboard stack and Power BI alignment.
 * WHAT IT DOES:
 *   1) Draws a Pennsylvania map of participating hospital *locations* from the verified static list
 *      (no per-hospital savings — those are not in this repo; warehouse will own them).
 *   2) Draws a bar chart of headline KPIs returned by DataLayer.getKPIs() (same MetricKeys as Gold).
 *   3) Submits advocacy stories via DataLayer.submitStory() with warehouse-ready JSON keys.
 *   4) Opens a print-friendly advocacy summary (user saves as PDF from the browser — no jsPDF CDN).
 *   5) Wires AIHelpers stubs for story/policy summaries (offline-safe).
 *
 * HOW IT CONNECTS:
 *   - state-data.js → CONFIG, FIPS_TO_ABBR, STATES_WITH_PROTECTION
 *   - data/pa-districts/pa-340b-hospitals.js → window.HAP_PA_340B_HOSPITALS
 *   - modules/data-layer.js → DataLayer.getPA340bHospitalPoints, getKPIs, getFreshness, submitStory
 *   - modules/ai-helpers.js → summarizeStory, summarizePolicyAlert, getPolicyAlert
 *   - assets/vendor → d3, topojson, states-10m (same as main dashboard; no CDN)
 *
 * POWER BI / WAREHOUSE:
 *   - KPI bars: fact_dashboard_kpi.ValueNumeric by MetricKey (see powerbi/metric-registry.json).
 *   - Map points: future dim_pa_340b_hospital or fact_facility_location; savings in separate fact table.
 *   - Stories: fact_story_submission.* — extended fields documented in docs/DATA-DICTIONARY.md.
 *
 * See docs/DATA-DICTIONARY.md — section "Advocacy Lab (340b-advocacy-lab.html)".
 */
(function () {
  "use strict";

  /** MetricKeys shown together on one numeric scale (counts / percent / audit total — see chart footnote). */
  var CHART_METRIC_KEYS = [
    "PA_HOSPITALS_340B_COUNT",
    "US_STATES_CP_PROTECTION_COUNT",
    "US_STATES_NO_CP_PROTECTION_COUNT",
    "OUTPATIENT_SHARE_PCT",
    "HRSA_AUDIT_COUNT"
  ];

  /** Pennsylvania counties for the story form (same coverage as mobile story form). */
  var PA_COUNTIES = [
    "Adams", "Allegheny", "Armstrong", "Beaver", "Bedford", "Berks", "Blair", "Bradford",
    "Bucks", "Butler", "Cambria", "Cameron", "Carbon", "Centre", "Chester", "Clarion",
    "Clearfield", "Clinton", "Columbia", "Crawford", "Cumberland", "Dauphin", "Delaware",
    "Elk", "Erie", "Fayette", "Forest", "Franklin", "Fulton", "Greene", "Huntingdon",
    "Indiana", "Jefferson", "Juniata", "Lackawanna", "Lancaster", "Lawrence", "Lebanon",
    "Lehigh", "Luzerne", "Lycoming", "McKean", "Mercer", "Mifflin", "Monroe", "Montgomery",
    "Montour", "Northampton", "Northumberland", "Perry", "Philadelphia", "Pike", "Potter",
    "Schuylkill", "Snyder", "Somerset", "Sullivan", "Susquehanna", "Tioga", "Union",
    "Venango", "Warren", "Washington", "Wayne", "Westmoreland", "Wyoming", "York"
  ];

  /**
   * Resolve USPS state abbreviation from a TopoJSON feature (same idea as 340b.js).
   * @param {GeoJSON.Feature} feature
   * @returns {string|null}
   */
  function getStateAbbrFromFeature(feature) {
    if (!feature) return null;
    var id = feature.id != null ? feature.id : (feature.properties && (feature.properties.FIPS || feature.properties.STATE));
    var numericId = parseInt(id, 10);
    if (typeof FIPS_TO_ABBR === "undefined") return null;
    return FIPS_TO_ABBR[!isNaN(numericId) ? numericId : id] || FIPS_TO_ABBR[String(id)] || null;
  }

  /**
   * Build the PA map: state outline + hospital dots. Tooltips use text only (safe DOM).
   */
  function renderPAMap() {
    var wrap = document.getElementById("pa-map-wrap");
    var tip = document.getElementById("pa-map-tooltip");
    if (!wrap || !tip) return;

    if (typeof d3 === "undefined" || typeof topojson === "undefined" || !window.US_ATLAS_STATES_10M) {
      wrap.textContent = "Map libraries did not load. Check that d3, topojson, and states-10m are in assets/vendor.";
      return;
    }

    DataLayer.getPA340bHospitalPoints().then(function (pack) {
      var hospitals = pack.hospitals || [];
      var atlas = window.US_ATLAS_STATES_10M;
      if (!atlas.objects || !atlas.objects.states) {
        wrap.textContent = "US states topology missing.";
        return;
      }

      var states = topojson.feature(atlas, atlas.objects.states);
      var paFeature = states.features.filter(function (f) {
        return getStateAbbrFromFeature(f) === "PA";
      })[0];

      if (!paFeature) {
        wrap.textContent = "Could not find Pennsylvania in the states dataset.";
        return;
      }

      var w = Math.min(wrap.clientWidth || 800, 880);
      var h = 400;
      wrap.innerHTML = "";

      var projection = d3.geoMercator().fitExtent([[8, 8], [w - 8, h - 8]], paFeature);
      var path = d3.geoPath(projection);

      var svg = d3.select(wrap)
        .append("svg")
        .attr("viewBox", "0 0 " + w + " " + h)
        .attr("width", w)
        .attr("height", h)
        .attr("role", "img")
        .attr("aria-label", "Map of Pennsylvania with 340B hospital locations from the HAP list");

      svg.append("path")
        .datum(paFeature)
        .attr("d", path)
        .attr("fill", "#d4e4f4")
        .attr("stroke", "#1c1c1e")
        .attr("stroke-width", 1);

      function showTip(htmlX, htmlY, name, extra) {
        tip.textContent = "";
        var t1 = document.createElement("strong");
        t1.textContent = name;
        tip.appendChild(t1);
        if (extra) {
          tip.appendChild(document.createElement("br"));
          var span = document.createElement("span");
          span.textContent = extra;
          tip.appendChild(span);
        }
        tip.style.left = Math.min(htmlX + 12, window.innerWidth - 290) + "px";
        tip.style.top = Math.min(htmlY + 12, window.innerHeight - 120) + "px";
        tip.classList.add("visible");
      }

      function hideTip() {
        tip.classList.remove("visible");
      }

      hospitals.forEach(function (h) {
        var pt = projection([h.lon, h.lat]);
        if (!pt || !isFinite(pt[0])) return;
        svg.append("circle")
          .attr("cx", pt[0])
          .attr("cy", pt[1])
          .attr("r", 3.5)
          .attr("fill", "#007aff")
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.8)
          .attr("tabindex", 0)
          .attr("role", "button")
          .attr("aria-label", h.hospitalName)
          .on("mouseenter focus", function (event) {
            var src = "Geocode: " + (h.geocodeSource || "see dataset meta");
            showTip(event.clientX, event.clientY, h.hospitalName, src);
          })
          .on("mouseleave blur", hideTip);
      });

      var metaNote = document.getElementById("pa-map-methodology");
      if (metaNote && pack.meta) {
        var n = hospitals.length;
        var listDate = pack.meta.revision_date || "see dataset file";
        metaNote.textContent =
          "Showing " + n + " geocoded hospital points from the static list (revision " + listDate + "). " +
          "Headline PA hospital count in KPIs (72) comes from CONFIG / DataLayer and HRSA verification — not from this point count. " +
          "Per-facility 340B savings are not published here; load from Gold when IT provides them.";
      }
    });
  }

  /**
   * Horizontal bar chart for selected KPIs (D3 only — no Chart.js).
   */
  function renderKpiChart() {
    var host = document.getElementById("kpi-chart-wrap");
    if (!host || typeof d3 === "undefined") return;

    DataLayer.getKPIs().then(function (kpis) {
      var rows = kpis.filter(function (k) {
        return CHART_METRIC_KEYS.indexOf(k.key) >= 0;
      });
      if (!rows.length) {
        host.textContent = "No KPI data available.";
        return;
      }

      var maxVal = d3.max(rows, function (d) { return Number(d.value); }) || 1;
      var margin = { top: 8, right: 24, bottom: 8, left: 8 };
      var barH = 28;
      var innerW = Math.min(host.clientWidth || 700, 800) - margin.left - margin.right;
      var innerH = rows.length * (barH + 10);
      var w = innerW + margin.left + margin.right;
      var h = innerH + margin.top + margin.bottom;

      host.innerHTML = "";
      var svg = d3.select(host)
        .append("svg")
        .attr("viewBox", "0 0 " + w + " " + h)
        .attr("width", w)
        .attr("height", h)
        .attr("role", "img")
        .attr("aria-label", "Bar chart of headline 340B advocacy metrics");

      var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var x = d3.scaleLinear().domain([0, maxVal]).range([0, innerW]);

      var gy = d3.scaleBand()
        .domain(rows.map(function (d) { return d.key; }))
        .range([0, innerH])
        .padding(0.25);

      g.selectAll("rect")
        .data(rows)
        .join("rect")
        .attr("x", 0)
        .attr("y", function (d) { return gy(d.key); })
        .attr("height", gy.bandwidth())
        .attr("width", function (d) { return x(Number(d.value)); })
        .attr("fill", "#007aff")
        .attr("rx", 4);

      g.selectAll("text.label")
        .data(rows)
        .join("text")
        .attr("class", "label")
        .attr("x", 4)
        .attr("y", function (d) { return gy(d.key) + gy.bandwidth() / 2; })
        .attr("dy", "0.35em")
        .attr("fill", "#1c1c1e")
        .attr("font-size", 11)
        .text(function (d) { return d.label; });

      g.selectAll("text.val")
        .data(rows)
        .join("text")
        .attr("class", "val")
        .attr("x", function (d) { return x(Number(d.value)) + 6; })
        .attr("y", function (d) { return gy(d.key) + gy.bandwidth() / 2; })
        .attr("dy", "0.35em")
        .attr("fill", "#3a3a3c")
        .attr("font-size", 11)
        .text(function (d) {
          var v = Number(d.value);
          var dec = d.decimals != null ? d.decimals : 0;
          var s = v.toFixed(dec);
          return (d.prefix || "") + s + (d.suffix || "");
        });

      var foot = document.getElementById("kpi-chart-footnote");
      if (foot) {
        foot.textContent =
          "Values come from DataLayer.getKPIs() (static → state-data.js / HAP_STATIC_METRICS; warehouse → fact_dashboard_kpi). " +
          "Community benefit ($7.95B national) is a separate MetricKey (COMMUNITY_BENEFIT_TOTAL_BILLIONS) — not mixed on this axis. " +
          "See powerbi/metric-registry.json for citations.";
      }
    });
  }

  function fillCountySelect() {
    var sel = document.getElementById("story-county");
    if (!sel) return;
    PA_COUNTIES.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c + " County";
      sel.appendChild(opt);
    });
  }

  /**
   * Combine structured fields into one storyText (≤500 chars) for Gold fact_story_submission.StoryText.
   */
  function buildStoryText(fields) {
    var parts = [];
    if (fields.savingsApproximate) parts.push("Approx. 340B savings (self-reported): " + fields.savingsApproximate);
    if (fields.communityImpact) parts.push("Community programs: " + fields.communityImpact);
    if (fields.contractPharmacies) parts.push("Contract pharmacy use: " + fields.contractPharmacies);
    if (fields.pharmaComms) parts.push("Manufacturer communications: " + fields.pharmaComms);
    var body = parts.join("\n\n");
    if (body.length > 500) body = body.slice(0, 497) + "...";
    return body;
  }

  function initStoryForm() {
    var form = document.getElementById("advocacy-story-form");
    var feedback = document.getElementById("story-feedback");
    if (!form || !feedback) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var hospitalName = document.getElementById("story-hospital-name");
      var county = document.getElementById("story-county");
      var category = document.getElementById("story-category");
      var savings = document.getElementById("story-savings");
      var community = document.getElementById("story-community");
      var cp = document.getElementById("story-contract-pharmacies");
      var pharma = document.getElementById("story-pharma");
      var email = document.getElementById("story-email");

      if (!hospitalName.value.trim() || !county.value || !category.value) {
        feedback.textContent = "Please complete hospital name, county, and category.";
        feedback.className = "is-error";
        return;
      }

      var storyText = buildStoryText({
        savingsApproximate: savings ? savings.value.trim() : "",
        communityImpact: community ? community.value.trim() : "",
        contractPharmacies: cp ? cp.value.trim() : "",
        pharmaComms: pharma ? pharma.value.trim() : ""
      });

      if (!storyText.trim()) {
        feedback.textContent = "Add at least one detail in the story fields below.";
        feedback.className = "is-error";
        return;
      }

      var SK = DataLayer.STORY_PAYLOAD_KEYS;
      var hn = hospitalName.value.trim();
      var em = email ? email.value.trim() : "";
      var ts = new Date().toISOString();
      var payload = {};
      payload[SK.hospitalName] = hn;
      payload[SK.county] = county.value;
      payload[SK.category] = category.value;
      payload[SK.storyText] = storyText;
      payload[SK.contactEmail] = em;
      if (savings && savings.value.trim()) payload[SK.savingsApproximate] = savings.value.trim();
      if (community && community.value.trim()) payload[SK.communityProgramsFunded] = community.value.trim();
      if (cp && cp.value.trim()) payload[SK.contractPharmacyUse] = cp.value.trim();
      if (pharma && pharma.value.trim()) payload[SK.manufacturerCommunications] = pharma.value.trim();
      payload[SK.submittedAt] = ts;
      payload[SK.schemaVersion] = 2;
      payload[SK.hospital] = hn;
      payload[SK.story] = storyText;
      payload[SK.email] = em;
      payload[SK.timestamp] = ts;
      payload[SK.version] = 2;

      DataLayer.submitStory(payload).then(function () {
        feedback.textContent = "Saved locally (sessionStorage) or sent if warehouse mode is on. JSON is ready for fact_story_submission mapping.";
        feedback.className = "is-success";
        form.reset();
      }).catch(function () {
        feedback.textContent = "Could not submit; check console.";
        feedback.className = "is-error";
      });
    });
  }

  function initAiStubs() {
    var btnStory = document.getElementById("btn-ai-story");
    var btnPol = document.getElementById("btn-ai-policy");
    var out = document.getElementById("ai-output");
    if (!btnStory || !btnPol || !out || typeof AIHelpers === "undefined") return;

    btnStory.addEventListener("click", function () {
      var raw = document.getElementById("story-community");
      var t = raw && raw.value ? raw.value : "";
      AIHelpers.summarizeStory(t || "340B helps our hospital fund charity care and outpatient clinics for underserved patients.")
        .then(function (s) {
          out.textContent = "Story summary (stub / offline): " + s;
        });
    });

    btnPol.addEventListener("click", function () {
      AIHelpers.getPolicyAlert()
        .then(function (alert) {
          if (!alert) {
            out.textContent = "No policy alert.";
            return null;
          }
          var full = (alert.headline || "") + " " + (alert.body || "");
          return AIHelpers.summarizePolicyAlert(full);
        })
        .then(function (sum) {
          if (sum) out.textContent = "Policy alert summary (stub / offline): " + sum;
        });
    });
  }

  /**
   * Print-based PDF: user chooses “Save as PDF” in the browser dialog (no third-party script).
   */
  function initPrintExport() {
    var btn = document.getElementById("btn-export-report");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var target = document.getElementById("advocacy-print-root");
      if (!target) return;

      DataLayer.getKPIs().then(function (kpis) {
        DataLayer.getFreshness().then(function (fresh) {
          while (target.firstChild) target.removeChild(target.firstChild);

          var h1 = document.createElement("h1");
          h1.textContent = "HAP 340B Advocacy Lab — Export";
          target.appendChild(h1);

          var p1 = document.createElement("p");
          p1.textContent = "Data as of: " + (fresh.displayAsOf || "see CONFIG") + ". " +
            (typeof CONFIG !== "undefined" && CONFIG.copy && CONFIG.copy.sourceSummary ? CONFIG.copy.sourceSummary : "");
          target.appendChild(p1);

          var h2 = document.createElement("h2");
          h2.textContent = "Headline metrics (MetricKey)";
          target.appendChild(h2);

          var ul = document.createElement("ul");
          kpis.forEach(function (k) {
            var li = document.createElement("li");
            var v = k.value;
            if (k.decimals != null) v = Number(k.value).toFixed(k.decimals);
            li.textContent = k.key + ": " + (k.prefix || "") + v + (k.suffix || "") + " — " + k.label;
            ul.appendChild(li);
          });
          target.appendChild(ul);

          var h3 = document.createElement("h2");
          h3.textContent = "Map data note";
          target.appendChild(h3);
          var p2 = document.createElement("p");
          p2.textContent = "Hospital dots: HAP Resource Center list (May 2022) geocoded via OpenStreetMap Nominatim — see pa-340b-hospitals.js meta. " +
            "Not a substitute for HRSA covered entity enrollment.";
          target.appendChild(p2);

          document.body.classList.add("printing-advocacy-lab");
          window.print();
          document.body.classList.remove("printing-advocacy-lab");
        });
      });
    });
  }

  function onResize() {
    renderPAMap();
    renderKpiChart();
  }

  function init() {
    if (typeof DataLayer === "undefined") {
      window.console.error("DataLayer missing — load modules/data-layer.js after state-data.js");
      return;
    }
    fillCountySelect();
    renderPAMap();
    renderKpiChart();
    initStoryForm();
    initAiStubs();
    initPrintExport();
    window.addEventListener("resize", function () {
      window.clearTimeout(window._advLabResizeT);
      window._advLabResizeT = window.setTimeout(onResize, 200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
