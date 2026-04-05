/**
 * HAP_340B_DATA — static, warehouse-shaped bundle for PA 340B hospital content.
 *
 * WHO THIS IS FOR: Dashboard code and IT / Power BI (same JSON keys as future views).
 * WHAT IT DOES: Sets window.HAP_340B_DATA with hospitals_340b_pa, hospital_financials_340b,
 *   hospital_stories; hydrates from window.HAP_PA_340B_HOSPITALS when that script ran first;
 *   re-syncs HAP_PA_340B_HOSPITALS so pa-district-map.js keeps working without UI reshaping.
 * HOW IT CONNECTS: Load immediately after data/pa-districts/pa-340b-hospitals.js, before
 *   pa-district-map.js and any code that calls DataLayer.getPA340bHospitalPoints().
 *
 * POWER BI MAPPING: See gold-schema-reference.sql (vw_pbi_hospitals_340b_pa, gold_fact_hospital_financials_340b,
 *   gold_fact_story_submission). Per-facility 340B dollars stay empty until IT provides Gold — do not invent.
 *
 * JSON keys are valid identifiers (no leading digits). Prefer metricKey + valueNumeric for savings, not "340B_savings".
 * See powerbi/semantic-envelope-sample.json.
 */
(function (global) {
  "use strict";

  /**
   * Map a canonical view row to the legacy global shape expected by pa-district-map.js.
   * @param {Object} r — hospitals_340b_pa row
   * @returns {Object}
   */
  function viewRowToLegacy(r) {
    return {
      name: r.hospitalName,
      lat: r.lat,
      lon: r.lon,
      source: r.geocodeSource || "",
      display_name: r.displayName || ""
    };
  }

  /**
   * Push hospitals_340b_pa rows back to window.HAP_PA_340B_HOSPITALS (name/lat/lon).
   * Called after static hydrate or warehouse refresh.
   */
  function syncLegacyHospitalsGlobal() {
    var d = global.HAP_340B_DATA;
    if (!d || !Array.isArray(d.hospitals_340b_pa) || d.hospitals_340b_pa.length === 0) return;
    global.HAP_PA_340B_HOSPITALS = {
      meta: d._legacyPackMeta || {},
      hospitals: d.hospitals_340b_pa.map(viewRowToLegacy)
    };
  }

  var pack = global.HAP_PA_340B_HOSPITALS;
  var legacyMeta = pack && pack.meta ? pack.meta : {};

  /** @type {Array<Object>} */
  var hospitalsView = [];
  if (pack && Array.isArray(pack.hospitals)) {
    pack.hospitals.forEach(function (h) {
      if (!h || typeof h !== "object") return;
      var name = String(h.name || "").trim();
      var lat = h.lat != null ? Number(h.lat) : NaN;
      var lon = h.lon != null ? Number(h.lon) : NaN;
      if (!name || !isFinite(lat) || !isFinite(lon)) return;
      hospitalsView.push({
        hospitalName: name,
        lat: lat,
        lon: lon,
        geocodeSource: String(h.source || ""),
        displayName: String(h.display_name || ""),
        metricKey: null,
        valueNumeric: null,
        valueUnit: null,
        communityImpactSummary: null,
        contractPharmacyCount: null
      });
    });
  }

  global.HAP_340B_DATA = {
    _meta: {
      source:
        "HAP Resource Center PA participating-hospital list (revision in pa-340b-hospitals.js meta) + OpenStreetMap Nominatim geocodes",
      lastUpdated: legacyMeta.revision_date || "2022-05-27",
      validationStatus: "verified_static_snapshot",
      schemaVersion: "1.0.0",
      datasetNote:
        "Rows are geocoded facility locations for mapping — not verified per-hospital 340B dollar savings (those belong in hospital_financials_340b when IT publishes Gold)."
    },
    _legacyPackMeta: legacyMeta,
    hospitals_340b_pa: hospitalsView,
    /** Per-facility financials — empty until warehouse; use metricKey + valueNumeric + sourceCitation when populated. */
    hospital_financials_340b: [],
    /** fact_story_submission-shaped rows; static bundle ships empty; warehouse/API may append. */
    hospital_stories: []
  };

  global.HAP_340B_syncLegacyHospitalsFromView = syncLegacyHospitalsGlobal;
  syncLegacyHospitalsGlobal();
})(typeof window !== "undefined" ? window : this);
