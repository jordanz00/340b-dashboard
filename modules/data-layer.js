/**
 * DataLayer — single access point for all dashboard data.
 *
 * Today: reads from the global variables in state-data.js (static file).
 * Tomorrow: swap the internals to fetch from a warehouse API or Power BI
 *           REST endpoint — nothing else in the app needs to change.
 *
 * Every method returns a Promise so the app is already async-ready.
 *
 * See docs/DATA-DICTIONARY.md for plain-English descriptions of every field.
 * See docs/POWER-BI-DATA-MODEL-MAPPING.md for warehouse column mappings.
 */
(function () {
  "use strict";

  var _refreshCallbacks = [];
  var _pollTimer = null;

  var DataLayer = {
    /** Where the data is coming from right now */
    source: "static-file",

    /** When data was last loaded or refreshed */
    lastRefreshed: new Date(),

    /* ─── Core data methods ─── */

    /**
     * Get the list of all 50 states (+ DC) with their 340B protection status.
     * Returns: Promise<Array<{stateCode, stateName, fips, hasContractPharmacyLaw, hasPbmLaw, yearEnacted, notes}>>
     */
    getStates: function () {
      return _resolve(function () {
        if (typeof STATE_340B === "undefined" || typeof STATE_NAMES === "undefined") return [];
        var fipsLookup = {};
        if (typeof FIPS_TO_ABBR !== "undefined") {
          Object.keys(FIPS_TO_ABBR).forEach(function (fips) {
            fipsLookup[FIPS_TO_ABBR[fips]] = parseInt(fips, 10);
          });
        }
        return Object.keys(STATE_NAMES).map(function (abbr) {
          var s = STATE_340B[abbr] || {};
          return {
            stateCode: abbr,
            stateName: STATE_NAMES[abbr],
            fips: fipsLookup[abbr] || null,
            hasContractPharmacyLaw: !!s.cp,
            hasPbmLaw: !!s.pbm,
            yearEnacted: s.y || null,
            notes: s.notes || ""
          };
        });
      });
    },

    /**
     * Get the four headline KPIs shown on the Home screen.
     * Returns: Promise<Array<{key, value, label, meaning, topic, prefix, suffix, decimals}>>
     */
    getKPIs: function () {
      return _resolve(function () {
        var protectedCount = 0;
        if (typeof STATES_WITH_PROTECTION !== "undefined") {
          protectedCount = STATES_WITH_PROTECTION.filter(function (s) { return s !== "DC"; }).length;
        }
        return [
          { key: "PA_HOSPITALS_340B_COUNT", value: 72, label: "PA Hospitals", meaning: "Rely on 340B to serve patients", topic: "access", prefix: "", suffix: "", decimals: 0 },
          { key: "COMMUNITY_BENEFIT_TOTAL_BILLIONS", value: 7.95, label: "Community Benefit", meaning: "Reported by 340B hospitals (2024)", topic: "finance", prefix: "$", suffix: "B", decimals: 2 },
          { key: "US_STATES_CP_PROTECTION_COUNT", value: protectedCount, label: "States Protected", meaning: "Contract pharmacy laws enacted", topic: "policy", prefix: "", suffix: "", decimals: 0 },
          { key: "US_STATES_NO_CP_PROTECTION_COUNT", value: 50 - protectedCount, label: "States Without", meaning: "No contract pharmacy protection", topic: "risk", prefix: "", suffix: "", decimals: 0 }
        ];
      });
    },

    /**
     * Get Pennsylvania-specific stats (hospitals, rural %, loss %, etc.).
     * Returns: Promise<Object>
     */
    getPA: function () {
      return _resolve(function () {
        return {
          hospitalCount: 72,
          ruralPercent: 38,
          operatingAtLossPercent: 63,
          ldServicesPercent: 95,
          hrsaHospitalAudits: 179,
          hrsaManufacturerAudits: 5,
          communityBenefitBillions: 7.95,
          protectionStatus: "In Progress",
          _descriptions: {
            hospitalCount: "Number of PA hospitals participating in 340B",
            ruralPercent: "Percent of PA 340B hospitals classified as rural",
            operatingAtLossPercent: "Percent of PA 340B hospitals operating at a financial loss",
            ldServicesPercent: "Percent of PA labor & delivery services provided by 340B hospitals",
            hrsaHospitalAudits: "HRSA audits of 340B hospitals in FY 2024",
            hrsaManufacturerAudits: "HRSA audits of drug manufacturers in FY 2024",
            communityBenefitBillions: "Total community benefit reported by 340B hospitals ($B)",
            protectionStatus: "Current status of PA contract pharmacy protection legislation"
          }
        };
      });
    },

    /**
     * Get the list of PA federal legislators and their 340B positions.
     * Returns: Promise<Array<{member, chamber, district, party, position, lastContact, action}>>
     */
    getDelegation: function () {
      return _resolve(function () {
        if (typeof window._PA_DELEGATION_DATA !== "undefined") return window._PA_DELEGATION_DATA;
        return [];
      });
    },

    /**
     * Get a configuration value (title, freshness date, copy text, etc.).
     * Returns: Promise<any>
     */
    getConfig: function (key) {
      return _resolve(function () {
        if (typeof CONFIG === "undefined") return null;
        if (key.indexOf(".") !== -1) {
          var parts = key.split(".");
          var obj = CONFIG;
          for (var i = 0; i < parts.length; i++) {
            if (obj == null) return null;
            obj = obj[parts[i]];
          }
          return obj;
        }
        return CONFIG[key];
      });
    },

    /**
     * Get FIPS-to-abbreviation lookup (used by map).
     * Returns: Promise<Object<number, string>>
     */
    getFipsLookup: function () {
      return _resolve(function () {
        return typeof FIPS_TO_ABBR !== "undefined" ? FIPS_TO_ABBR : {};
      });
    },

    /**
     * Get state names lookup.
     * Returns: Promise<Object<string, string>>
     */
    getStateNames: function () {
      return _resolve(function () {
        return typeof STATE_NAMES !== "undefined" ? STATE_NAMES : {};
      });
    },

    /**
     * Get raw STATE_340B for backward compatibility during migration.
     */
    getRawState340B: function () {
      return _resolve(function () {
        return typeof STATE_340B !== "undefined" ? STATE_340B : {};
      });
    },

    /* ─── Story submission stub ─── */

    /**
     * Submit a hospital story. Today: stores in sessionStorage.
     * Future: POST to warehouse API.
     */
    submitStory: function (payload) {
      return _resolve(function () {
        var stories = [];
        try {
          stories = JSON.parse(sessionStorage.getItem("hap_stories") || "[]");
        } catch (e) { /* empty */ }
        stories.push(payload);
        sessionStorage.setItem("hap_stories", JSON.stringify(stories));
        return { ok: true, stored: "sessionStorage", count: stories.length };
      });
    },

    /* ─── Refresh / connection methods ─── */

    /**
     * Check for newer data. Static mode: no-op. API mode: fetches fresh JSON.
     */
    refresh: function () {
      if (DataLayer.source === "static-file") {
        DataLayer.lastRefreshed = new Date();
        _notifyRefresh();
        return Promise.resolve({ refreshed: false, reason: "static-file" });
      }

      if (DataLayer.source === "warehouse-api" && DataLayer._apiUrl) {
        return fetch(DataLayer._apiUrl)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.STATE_340B) window.STATE_340B = data.STATE_340B;
            if (data.STATE_NAMES) window.STATE_NAMES = data.STATE_NAMES;
            if (data.CONFIG) window.CONFIG = data.CONFIG;
            DataLayer.lastRefreshed = new Date();
            _notifyRefresh();
            return { refreshed: true, source: "warehouse-api" };
          });
      }

      return Promise.resolve({ refreshed: false });
    },

    /**
     * Switch to polling a JSON API endpoint for near-real-time updates.
     * @param {string} endpointUrl — URL that returns JSON with STATE_340B, STATE_NAMES, CONFIG
     * @param {number} [intervalMs=900000] — polling interval (default 15 min)
     */
    connectAPI: function (endpointUrl, intervalMs) {
      DataLayer._apiUrl = endpointUrl;
      DataLayer.source = "warehouse-api";
      var ms = intervalMs || 900000;
      if (_pollTimer) clearInterval(_pollTimer);
      _pollTimer = setInterval(function () { DataLayer.refresh(); }, ms);
      return DataLayer.refresh();
    },

    /**
     * Mount a Power BI embed in the designated slot.
     * Stub — requires the PBI JS SDK to be loaded separately.
     */
    connectPowerBI: function (embedConfig) {
      DataLayer.source = "powerbi-embed";
      var slot = document.getElementById("pbi-embed-slot");
      if (!slot) return Promise.resolve({ connected: false, reason: "no slot element" });

      if (typeof powerbi !== "undefined" && powerbi.embed) {
        powerbi.embed(slot, embedConfig);
        _notifyRefresh();
        return Promise.resolve({ connected: true });
      }

      var note = document.createElement("p");
      note.style.cssText = "font-size:13px;color:#6b7280;padding:16px;text-align:center;";
      note.textContent = "Power BI JS SDK not loaded. Add the SDK script to enable embedded reports.";
      slot.appendChild(note);
      return Promise.resolve({ connected: false, reason: "sdk-not-loaded" });
    },

    /**
     * Register a callback that fires whenever data is refreshed.
     */
    onRefresh: function (fn) {
      if (typeof fn === "function") _refreshCallbacks.push(fn);
    },

    /** internal */
    _apiUrl: null
  };

  /* ─── Helpers ─── */

  function _resolve(fn) {
    try {
      return Promise.resolve(fn());
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function _notifyRefresh() {
    _refreshCallbacks.forEach(function (fn) {
      try { fn(); } catch (e) { /* swallow */ }
    });
  }

  window.DataLayer = DataLayer;
})();
