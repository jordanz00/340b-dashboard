/**
 * DataLayer — single access point for all dashboard data.
 *
 * WHO THIS IS FOR: Any developer or the data team.
 * WHAT IT DOES: Provides one API for all dashboard data. Today it reads from
 *   static globals (state-data.js). When connected to the warehouse, the same
 *   methods return live data — nothing else in the app changes.
 * HOW IT CONNECTS:
 *   - Static mode (default): reads STATE_340B, STATE_NAMES, CONFIG from state-data.js — no fetch
 *   - Warehouse mode (Path A): connectWarehouse() fetches Gold-shaped JSON (opt-in only)
 *   - API mode: connectAPI() polls a legacy-shaped JSON endpoint
 *   - PBI embed mode (Path C): connectPowerBI() mounts an iframe
 *
 * POWER BI MAPPING: Methods return shapes matching gold-schema-reference.sql.
 *   See docs/DATA-DICTIONARY.md for field definitions.
 *   See docs/POWER-BI-DATA-MODEL-MAPPING.md for warehouse column mappings.
 *   See docs/WAREHOUSE-INTEGRATION-GUIDE.md for all three connection paths.
 */
(function () {
  "use strict";

  /**
   * @param {string|number|null|undefined} gpid
   * @param {string} chamber — "house" | "senate"
   * @returns {Object|null} row from window.HAP_PA_MEMBER_PHOTO_MAP or null
   */
  function _paLegislatorEntry(gpid, chamber) {
    var map = typeof window !== "undefined" && window.HAP_PA_MEMBER_PHOTO_MAP
      ? window.HAP_PA_MEMBER_PHOTO_MAP
      : { house: {}, senate: {} };
    if (gpid == null || gpid === "") return null;
    var ch = (chamber || "").toLowerCase();
    var bucket = ch === "senate" ? map.senate : map.house;
    return bucket[String(gpid)] || null;
  }

  /**
   * palegis bio URL slug segment only (no slashes). Allows apostrophes (e.g. rep-d'orsie).
   * @param {string} slug
   * @returns {boolean}
   */
  function _paPalegisBioSlugOk(slug) {
    var s = String(slug || "").trim();
    if (!s || s.length > 160) return false;
    if (/\.\./.test(s) || /[/?#<>\x00-\x1f\\]/.test(s)) return false;
    return /^[a-z0-9][a-z0-9'\-]*$/i.test(s);
  }

  /**
   * True if the URL uses https and points at a known official legislative domain/path.
   * Used by mobile + PA map so taps never open junk schemes, placeholders, or generic homepages.
   * Does not HTTP-verify the page still exists (CORS). palegis.us requires a slug segment
   * (/members/bio/{id}/{slug}); numeric-only /bio/{id} returns 404 — use pa-member-photo-map.json
   * bio_slug from scripts/sync-pa-palegis-bio-slugs.py.
   *
   * @param {string|null|undefined} raw
   * @returns {boolean}
   */
  function isTrustedLegislatorUrl(raw) {
    if (raw == null) return false;
    var s = String(raw).trim();
    if (!s || s === "#" || /^javascript:/i.test(s)) return false;
    var u;
    try {
      u = new URL(s);
    } catch (e) {
      return false;
    }
    if (u.protocol !== "https:") return false;
    var host = u.hostname.toLowerCase();
    var path = u.pathname || "";

    if (host === "www.palegis.us" || host === "palegis.us") {
      var pm = path.match(/^\/(house|senate)\/members\/bio\/(\d+)\/([^/?#]+)\/?$/i);
      if (!pm) return false;
      var seg = pm[3];
      try {
        seg = decodeURIComponent(seg);
      } catch (_e) {
        return false;
      }
      return _paPalegisBioSlugOk(seg);
    }

    if (/\.house\.gov$/i.test(host)) {
      if (/^(www\.)?house\.gov$/i.test(host)) return false;
      return true;
    }

    if (/\.senate\.gov$/i.test(host)) {
      if (/^(www\.)?senate\.gov$/i.test(host)) return false;
      return true;
    }

    if (host === "www.congress.gov" || host === "congress.gov") {
      return /\/member\//i.test(path);
    }

    if (host === "bioguide.congress.gov") {
      return true;
    }

    return false;
  }

  var _refreshCallbacks = [];
  var _pollTimer = null;

  /**
   * Warehouse cache — when connected via connectWarehouse(), Gold-shaped
   * data lives here. Core methods read from cache first, fall back to globals.
   */
  var _warehouseCache = null;

  var DataLayer = {
    /** Where the data is coming from right now */
    source: "static-file",

    /** When data was last loaded or refreshed */
    lastRefreshed: new Date(),

    /**
     * Canonical JSON keys for story payloads (fact_story_submission alignment).
     * Do not rename values without updating docs/DATA-DICTIONARY.md,
     * powerbi/semantic-layer-registry.json, and any warehouse ingestion contract.
     */
    STORY_PAYLOAD_KEYS: Object.freeze({
      hospitalName: "hospitalName",
      county: "county",
      category: "category",
      storyText: "storyText",
      contactEmail: "contactEmail",
      submittedAt: "submittedAt",
      schemaVersion: "schemaVersion",
      savingsApproximate: "savingsApproximate",
      communityProgramsFunded: "communityProgramsFunded",
      contractPharmacyUse: "contractPharmacyUse",
      manufacturerCommunications: "manufacturerCommunications",
      hospital: "hospital",
      story: "story",
      email: "email",
      timestamp: "timestamp",
      version: "version"
    }),

    /* ─── Core data methods ─── */

    /**
     * Get the list of all 50 states (+ DC) with their 340B protection status.
     *
     * HOW IT WORKS:
     * 1. If warehouse cache has dim_state_law, map Gold columns to app shape
     * 2. Otherwise, read STATE_340B / STATE_NAMES globals from state-data.js
     *
     * Returns: Promise<Array<{stateCode, stateName, fips, hasContractPharmacyLaw, hasPbmLaw, yearEnacted, notes}>>
     */
    getStates: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_state_law) {
          return _warehouseCache.dim_state_law.map(function (row) {
            return {
              stateCode: row.StateCode,
              stateName: row.StateName,
              fips: row.StateFips ? parseInt(row.StateFips, 10) : null,
              hasContractPharmacyLaw: !!row.ContractPharmacyProtected,
              hasPbmLaw: !!row.PBMProtected,
              yearEnacted: row.YearEnacted || null,
              notes: row.Notes || ""
            };
          });
        }
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
     *
     * HOW IT WORKS:
     * 1. If warehouse cache has fact_dashboard_kpi, look up by MetricKey
     * 2. Otherwise, compute from static globals
     *
     * Returns: Promise<Array<{key, value, label, meaning, topic, prefix, suffix, decimals}>>
     */
    getKPIs: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.fact_dashboard_kpi) {
          return _mapKPIsFromGold(_warehouseCache.fact_dashboard_kpi);
        }
        return _buildStaticKpiArray();
      });
    },

    /**
     * Get Pennsylvania-specific stats (hospitals, rural %, loss %, etc.).
     *
     * HOW IT WORKS:
     * 1. If warehouse cache has fact_dashboard_kpi, extract PA metrics by MetricKey
     * 2. Otherwise, return hard-coded values from state-data.js era
     *
     * Returns: Promise<Object>
     */
    getPA: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.fact_dashboard_kpi) {
          var kpis = _warehouseCache.fact_dashboard_kpi;
          return {
            hospitalCount: _goldVal(kpis, "PA_HOSPITALS_340B_COUNT", 72),
            ruralPercent: _goldVal(kpis, "PA_RURAL_HOSPITAL_PCT", 38),
            operatingAtLossPercent: _goldVal(kpis, "PA_HOSPITALS_OPERATING_LOSS_PCT", 63),
            ldServicesPercent: _goldVal(kpis, "PA_LD_SERVICES_PCT", 95),
            hrsaHospitalAudits: _goldVal(kpis, "HRSA_HOSPITAL_AUDIT_COUNT", 179),
            hrsaManufacturerAudits: _goldVal(kpis, "HRSA_MANUFACTURER_AUDIT_COUNT", 5),
            communityBenefitBillions: _goldVal(kpis, "COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95),
            protectionStatus: "In Progress",
            _source: "warehouse"
          };
        }
        return {
          hospitalCount: _staticMetric("PA_HOSPITALS_340B_COUNT", 72),
          ruralPercent: _staticMetric("PA_RURAL_HOSPITAL_PCT", 38),
          operatingAtLossPercent: _staticMetric("PA_HOSPITALS_OPERATING_LOSS_PCT", 63),
          ldServicesPercent: _staticMetric("PA_LD_SERVICES_PCT", 95),
          hrsaHospitalAudits: _staticMetric("HRSA_HOSPITAL_AUDIT_COUNT", 179),
          hrsaManufacturerAudits: _staticMetric("HRSA_MANUFACTURER_AUDIT_COUNT", 5),
          communityBenefitBillions: _staticMetric("COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95),
          protectionStatus: "In Progress",
          _source: "static"
        };
      });
    },

    /**
     * Get the list of PA federal legislators and their 340B positions.
     * Returns: Promise<Array<{member, chamber, district, party, position, lastContact, action}>>
     */
    getDelegation: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_pa_delegation) {
          return _warehouseCache.dim_pa_delegation.map(function (row) {
            return {
              member: row.MemberName,
              chamber: row.Chamber,
              district: row.DistrictLabel,
              party: row.Party,
              position: row.Position340B,
              lastContact: row.LastContactDate,
              action: row.SuggestedAction
            };
          });
        }
        if (typeof window._PA_DELEGATION_DATA !== "undefined") return window._PA_DELEGATION_DATA;
        return [];
      });
    },

    /**
     * Get PA state-level legislators (committee members).
     *
     * HOW IT WORKS:
     * 1. If warehouse cache has dim_pa_legislator, return structured array
     * 2. Otherwise, return from window global if available, or empty
     *
     * POWER BI EQUIVALENT: SELECT * FROM dim_pa_legislator
     *
     * Returns: Promise<Array<{name, district, party, engagementPosture, suggestedAction}>>
     */
    getLegislators: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_pa_legislator) {
          return _warehouseCache.dim_pa_legislator.map(function (row) {
            return {
              name: row.MemberName,
              district: row.DistrictNumber,
              party: row.Party,
              engagementPosture: row.EngagementPosture,
              suggestedAction: row.SuggestedAction
            };
          });
        }
        if (typeof window._PA_LEGISLATOR_DATA !== "undefined") return window._PA_LEGISLATOR_DATA;
        return [];
      });
    },

    /**
     * Get a configuration value (title, freshness date, copy text, etc.).
     * Returns: Promise<any>
     */
    getConfig: function (key) {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_data_freshness && key === "dataFreshness") {
          return _warehouseCache.dim_data_freshness.DisplayAsOfText || null;
        }
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
        if (_warehouseCache && _warehouseCache.dim_state_law) {
          var lookup = {};
          _warehouseCache.dim_state_law.forEach(function (row) {
            if (row.StateFips) lookup[parseInt(row.StateFips, 10)] = row.StateCode;
          });
          return lookup;
        }
        return typeof FIPS_TO_ABBR !== "undefined" ? FIPS_TO_ABBR : {};
      });
    },

    /**
     * Get state names lookup.
     * Returns: Promise<Object<string, string>>
     */
    getStateNames: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_state_law) {
          var names = {};
          _warehouseCache.dim_state_law.forEach(function (row) {
            names[row.StateCode] = row.StateName;
          });
          return names;
        }
        return typeof STATE_NAMES !== "undefined" ? STATE_NAMES : {};
      });
    },

    /**
     * Get raw STATE_340B for backward compatibility during migration.
     */
    getRawState340B: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_state_law) {
          var obj = {};
          _warehouseCache.dim_state_law.forEach(function (row) {
            obj[row.StateCode] = {
              y: row.YearEnacted || null,
              pbm: !!row.PBMProtected,
              cp: !!row.ContractPharmacyProtected,
              notes: row.Notes || ""
            };
          });
          return obj;
        }
        return typeof STATE_340B !== "undefined" ? STATE_340B : {};
      });
    },

    /**
     * Look up a single KPI by MetricKey from the warehouse cache (no static fallback).
     * Returns: Promise<number|null>
     */
    getMetricNumeric: function (metricKey) {
      return _resolve(function () {
        if (!_warehouseCache || !_warehouseCache.fact_dashboard_kpi || !metricKey) return null;
        return _goldVal(_warehouseCache.fact_dashboard_kpi, metricKey, null);
      });
    },

    /**
     * Get data freshness metadata.
     * Returns: Promise<{displayAsOf, datasetVersion, methodology}>
     */
    getFreshness: function () {
      return _resolve(function () {
        if (_warehouseCache && _warehouseCache.dim_data_freshness) {
          var f = _warehouseCache.dim_data_freshness;
          return {
            displayAsOf: f.DisplayAsOfText || f.DisplayAsOf || null,
            datasetVersion: f.DatasetVersion || null,
            methodology: f.MethodologyText || null,
            _source: "warehouse"
          };
        }
        return {
          displayAsOf: typeof CONFIG !== "undefined" ? CONFIG.dataFreshness : null,
          datasetVersion: typeof DATASET_METADATA !== "undefined" ? DATASET_METADATA.datasetVersion : null,
          methodology: typeof DATASET_METADATA !== "undefined" ? DATASET_METADATA.methodology : null,
          _source: "static"
        };
      });
    },

    /**
     * Pennsylvania 340B participating hospital locations from the static HAP list (geocoded).
     * Does not include per-facility 340B savings — those belong in Gold when IT provides them.
     *
     * Returns: Promise<{ meta: Object, hospitals: Array<{ hospitalName, lat, lon, geocodeSource, displayName }> }>
     * POWER BI: future dim_facility / fact_facility_location; join savings from warehouse only.
     */
    getPA340bHospitalPoints: function () {
      return _resolve(function () {
        if (_warehouseCache && Array.isArray(_warehouseCache.hospitals_340b_pa) && _warehouseCache.hospitals_340b_pa.length) {
          return {
            meta: _warehouseCache._meta || { dataset: "warehouse", note: "hospitals_340b_pa view" },
            hospitals: _mapHospitalViewRows(_warehouseCache.hospitals_340b_pa)
          };
        }
        if (_warehouseCache && _warehouseCache.dim_pa_340b_hospital) {
          return {
            meta: { dataset: "warehouse", note: "Gold dim_pa_340b_hospital" },
            hospitals: _warehouseCache.dim_pa_340b_hospital.map(function (row) {
              return {
                hospitalName: row.HospitalName || row.Name || "",
                lat: row.Latitude != null ? Number(row.Latitude) : null,
                lon: row.Longitude != null ? Number(row.Longitude) : null,
                geocodeSource: row.GeocodeSource || "warehouse",
                displayName: row.AddressDisplay || ""
              };
            }).filter(function (h) {
              return h.hospitalName && isFinite(h.lat) && isFinite(h.lon);
            })
          };
        }
        if (typeof window !== "undefined" && window.HAP_340B_DATA && Array.isArray(window.HAP_340B_DATA.hospitals_340b_pa) && window.HAP_340B_DATA.hospitals_340b_pa.length) {
          return {
            meta: window.HAP_340B_DATA._meta || {},
            hospitals: _mapHospitalViewRows(window.HAP_340B_DATA.hospitals_340b_pa)
          };
        }
        var pack = typeof window !== "undefined" ? window.HAP_PA_340B_HOSPITALS : null;
        if (!pack || !Array.isArray(pack.hospitals)) {
          return { meta: {}, hospitals: [] };
        }
        return {
          meta: pack.meta || {},
          hospitals: pack.hospitals.map(function (h) {
            return {
              hospitalName: h.name || "",
              lat: h.lat != null ? Number(h.lat) : null,
              lon: h.lon != null ? Number(h.lon) : null,
              geocodeSource: h.source || "",
              displayName: h.display_name || ""
            };
          }).filter(function (h) {
            return h.hospitalName && isFinite(h.lat) && isFinite(h.lon);
          })
        };
      });
    },

    /**
     * Relative headshot URL for a PA General Assembly member (script-loaded map only; no network).
     * PBI: future dim_pa_legislator.HeadshotRelativeUrl
     *
     * @param {string|number} gpid
     * @param {string} chamber — "house" | "senate"
     * @returns {string}
     */
    getPaLegislatorPhotoUrl: function (gpid, chamber) {
      var e = _paLegislatorEntry(gpid, chamber);
      if (!e || !e.img_id) return "";
      var ch = (chamber || "").toLowerCase();
      var folder = ch === "senate" ? "pa-senate" : "pa-house";
      return "images/headshots/" + folder + "/" + e.img_id + ".jpg";
    },

    /**
     * Official PA legislature bio page URL when bio_id and bio_slug exist on the static map.
     *
     * @param {string|number} gpid
     * @param {string} chamber
     * @returns {string}
     */
    getPaLegislatorBioPageUrl: function (gpid, chamber) {
      var e = _paLegislatorEntry(gpid, chamber);
      if (!e || e.bio_id == null || e.bio_id === "") return "";
      var bid = String(e.bio_id).trim();
      if (!/^\d+$/.test(bid)) return "";
      var slug = e.bio_slug != null ? String(e.bio_slug).trim() : "";
      if (!_paPalegisBioSlugOk(slug)) return "";
      var ch = (chamber || "").toLowerCase();
      var chamberSlug = ch === "senate" ? "senate" : "house";
      var url = "https://www.palegis.us/" + chamberSlug + "/members/bio/" + bid + "/" + slug;
      return isTrustedLegislatorUrl(url) ? url : "";
    },

    /**
     * Whether a string is safe to use as an outbound legislator/profile link from the dashboard.
     * @param {string|null|undefined} raw
     * @returns {boolean}
     */
    isTrustedLegislatorUrl: isTrustedLegislatorUrl,

    /* ─── Story submission ─── */

    /**
     * Submit a hospital story. Today: stores in sessionStorage.
     * Warehouse mode: POSTs to the story API endpoint if configured.
     */
    submitStory: function (payload) {
      var normalized = _normalizeStoryPayload(payload);
      if (DataLayer.source === "warehouse-gold" && DataLayer._storyApiUrl) {
        return fetch(DataLayer._storyApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalized)
        })
        .then(function (r) { return r.json(); })
        .then(function (result) {
          return { ok: true, stored: "warehouse-api", result: result };
        })
        .catch(function () {
          _storeStoryLocally(normalized);
          return { ok: true, stored: "sessionStorage-fallback", reason: "API unavailable" };
        });
      }
      _storeStoryLocally(normalized);
      return _resolve(function () {
        return { ok: true, stored: "sessionStorage" };
      });
    },

    /* ─── Export ─── */

    /**
     * Export all dashboard data as a single Gold-shaped JSON object.
     * Useful for testing PBI ingestion, backup, or sharing with the data team.
     *
     * Returns: Promise<Object> matching data/mock-api-response.json shape
     */
    exportJSON: function () {
      var self = this;
      return Promise.all([
        self.getStates(),
        self.getKPIs(),
        self.getPA(),
        self.getFreshness()
      ]).then(function (results) {
        var states = results[0];
        var kpis = results[1];
        var pa = results[2];
        var freshness = results[3];

        var dimStateLaw = states.map(function (s) {
          return {
            StateCode: s.stateCode,
            StateName: s.stateName,
            StateFips: s.fips ? String(s.fips).padStart(2, "0") : null,
            ContractPharmacyProtected: s.hasContractPharmacyLaw,
            PBMProtected: s.hasPbmLaw,
            YearEnacted: s.yearEnacted,
            Notes: s.notes,
            IncludeInFiftyStateHeadline: s.stateCode !== "DC"
          };
        });

        var factKpi = kpis.map(function (k) {
          return {
            MetricKey: k.key,
            ValueNumeric: k.value,
            ValueText: null,
            Unit: _inferUnit(k),
            AsOfDate: freshness.displayAsOf || new Date().toISOString().slice(0, 10),
            SourceCitation: "Exported from dashboard static data"
          };
        });

        var paMetrics = [
          { MetricKey: "PA_RURAL_HOSPITAL_PCT", ValueNumeric: pa.ruralPercent, Unit: "PERCENT" },
          { MetricKey: "PA_HOSPITALS_OPERATING_LOSS_PCT", ValueNumeric: pa.operatingAtLossPercent, Unit: "PERCENT" },
          { MetricKey: "PA_LD_SERVICES_PCT", ValueNumeric: pa.ldServicesPercent, Unit: "PERCENT" },
          { MetricKey: "HRSA_HOSPITAL_AUDIT_COUNT", ValueNumeric: pa.hrsaHospitalAudits, Unit: "COUNT" },
          { MetricKey: "HRSA_MANUFACTURER_AUDIT_COUNT", ValueNumeric: pa.hrsaManufacturerAudits, Unit: "COUNT" }
        ];
        paMetrics.forEach(function (m) {
          var exists = factKpi.some(function (k) { return k.MetricKey === m.MetricKey; });
          if (!exists) {
            factKpi.push({
              MetricKey: m.MetricKey,
              ValueNumeric: m.ValueNumeric,
              ValueText: null,
              Unit: m.Unit,
              AsOfDate: freshness.displayAsOf || new Date().toISOString().slice(0, 10),
              SourceCitation: "Exported from dashboard static data"
            });
          }
        });

        return {
          _meta: {
            source: DataLayer.source,
            lastUpdated: new Date().toISOString(),
            dataLayerLastRefreshed: DataLayer.lastRefreshed instanceof Date
              ? DataLayer.lastRefreshed.toISOString()
              : null,
            displayAsOf: freshness.displayAsOf || null,
            validationStatus: DataLayer.source === "static-file" ? "static_snapshot" : "live_or_cached"
          },
          _exportedAt: new Date().toISOString(),
          _source: DataLayer.source,
          dim_state_law: dimStateLaw,
          fact_dashboard_kpi: factKpi,
          dim_data_freshness: {
            DashboardKey: "340B_ADVOCACY",
            DisplayAsOfText: freshness.displayAsOf,
            DatasetVersion: freshness.datasetVersion,
            MethodologyText: freshness.methodology
          }
        };
      });
    },

    /* ─── Connection methods (all three paths) ─── */

    /**
     * PATH A — Connect to a Gold-shaped JSON endpoint (warehouse API).
     *
     * HOW IT WORKS:
     * 1. Fetches JSON matching gold-schema-reference.sql table shapes
     *    (dim_state_law[], fact_dashboard_kpi[], dim_data_freshness{})
     * 2. Caches the response — all get*() methods read from cache
     * 3. Polls at the configured interval for automatic updates
     *
     * This is the recommended path: your VP gets warehouse governance,
     * you keep your custom dashboard design.
     *
     * @param {string} endpointUrl — URL returning Gold-shaped JSON
     * @param {Object} [options] — { intervalMs, storyApiUrl, headers }
     * @returns {Promise<{connected, source, tablesLoaded}>}
     */
    connectWarehouse: function (endpointUrl, options) {
      if (!_isAllowedEndpoint(endpointUrl)) {
        return Promise.resolve({ connected: false, reason: "blocked-url" });
      }
      var opts = options || {};
      if (opts.storyApiUrl && !_isAllowedEndpoint(opts.storyApiUrl)) {
        return Promise.resolve({ connected: false, reason: "blocked-story-url" });
      }
      DataLayer._warehouseUrl = endpointUrl;
      DataLayer._storyApiUrl = opts.storyApiUrl || null;
      DataLayer._fetchHeaders = opts.headers || {};
      DataLayer.source = "warehouse-gold";

      var ms = opts.intervalMs || 900000;
      if (_pollTimer) clearInterval(_pollTimer);
      _pollTimer = setInterval(function () { DataLayer.refresh(); }, ms);

      return DataLayer.refresh();
    },

    /**
     * PATH A (legacy shape) — Poll a JSON endpoint that returns the old
     * STATE_340B / STATE_NAMES / CONFIG shape. Kept for backward compat.
     *
     * @param {string} endpointUrl — URL that returns legacy-shaped JSON
     * @param {number} [intervalMs=900000] — polling interval (default 15 min)
     */
    connectAPI: function (endpointUrl, intervalMs) {
      if (!_isAllowedEndpoint(endpointUrl)) {
        return Promise.resolve({ connected: false, reason: "blocked-url" });
      }
      DataLayer._apiUrl = endpointUrl;
      DataLayer.source = "warehouse-api";
      var ms = intervalMs || 900000;
      if (_pollTimer) clearInterval(_pollTimer);
      _pollTimer = setInterval(function () { DataLayer.refresh(); }, ms);
      return DataLayer.refresh();
    },

    /**
     * PATH C — Mount a Power BI embed in the designated slot.
     * Requires the PBI JS SDK to be loaded separately.
     *
     * @param {Object} embedConfig — Power BI embed configuration
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
     * Check for newer data. Behavior depends on current source mode.
     */
    refresh: function () {
      if (DataLayer.source === "static-file") {
        DataLayer.lastRefreshed = new Date();
        _notifyRefresh();
        return Promise.resolve({ refreshed: false, reason: "static-file" });
      }

      if (DataLayer.source === "warehouse-gold" && DataLayer._warehouseUrl) {
        var fetchOpts = {};
        if (DataLayer._fetchHeaders && Object.keys(DataLayer._fetchHeaders).length > 0) {
          fetchOpts.headers = DataLayer._fetchHeaders;
        }
        return fetch(DataLayer._warehouseUrl, fetchOpts)
          .then(function (r) {
            if (!r.ok) throw new Error("Warehouse API returned " + r.status);
            return r.json();
          })
          .then(function (data) {
            if (!data || typeof data !== "object") {
              throw new Error("Warehouse response is not a valid JSON object");
            }
            var KNOWN_TABLES = [
              "dim_state_law", "fact_dashboard_kpi", "dim_data_freshness",
              "dim_pa_delegation", "dim_pa_legislator", "hospitals_340b_pa",
              "hospital_financials_340b", "hospital_stories", "dim_pa_340b_hospital",
              "_meta"
            ];
            var keys = Object.keys(data);
            for (var ki = 0; ki < keys.length; ki++) {
              if (KNOWN_TABLES.indexOf(keys[ki]) === -1 && keys[ki].charAt(0) !== "_") {
                throw new Error("Unexpected table key in warehouse response: " + keys[ki]);
              }
            }
            _warehouseCache = data;
            _syncWarehouseGlobals(data);
            DataLayer.lastRefreshed = new Date();
            _notifyRefresh();
            var tables = [];
            if (data.dim_state_law) tables.push("dim_state_law");
            if (data.fact_dashboard_kpi) tables.push("fact_dashboard_kpi");
            if (data.dim_data_freshness) tables.push("dim_data_freshness");
            if (data.dim_pa_delegation) tables.push("dim_pa_delegation");
            if (data.dim_pa_legislator) tables.push("dim_pa_legislator");
            if (data.hospitals_340b_pa) tables.push("hospitals_340b_pa");
            if (data.hospital_financials_340b) tables.push("hospital_financials_340b");
            if (data.hospital_stories) tables.push("hospital_stories");
            return { refreshed: true, source: "warehouse-gold", tablesLoaded: tables };
          })
          .catch(function (err) {
            return { refreshed: false, source: "warehouse-gold", error: err.message };
          });
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
     * Stop polling and revert to static mode.
     */
    disconnect: function () {
      if (_pollTimer) clearInterval(_pollTimer);
      _pollTimer = null;
      _warehouseCache = null;
      DataLayer.source = "static-file";
      DataLayer._apiUrl = null;
      DataLayer._warehouseUrl = null;
      DataLayer._storyApiUrl = null;
      DataLayer._fetchHeaders = {};
      return Promise.resolve({ disconnected: true });
    },

    /**
     * Register a callback that fires whenever data is refreshed.
     */
    onRefresh: function (fn) {
      if (typeof fn === "function") _refreshCallbacks.push(fn);
    },

    /**
     * Get current connection status for UI display.
     */
    getStatus: function () {
      return {
        source: DataLayer.source,
        lastRefreshed: DataLayer.lastRefreshed,
        isLive: DataLayer.source !== "static-file",
        warehouseUrl: DataLayer._warehouseUrl || null,
        apiUrl: DataLayer._apiUrl || null,
        cacheLoaded: !!_warehouseCache
      };
    },

    /**
     * Single object for UI labels, exports, and PBI envelope _meta (freshness parity).
     * Prefer this over ad-hoc Date() in screens so lastUpdated stays consistent.
     *
     * @returns {Promise<{source, lastRefreshedIso, displayAsOf, datasetVersion, methodology, freshnessSource}>}
     */
    getProvenanceSnapshot: function () {
      return DataLayer.getFreshness().then(function (f) {
        var lr = DataLayer.lastRefreshed;
        return {
          source: DataLayer.source,
          lastRefreshedIso: lr instanceof Date ? lr.toISOString() : null,
          displayAsOf: f.displayAsOf || null,
          datasetVersion: f.datasetVersion || null,
          methodology: f.methodology || null,
          freshnessSource: f._source || "static"
        };
      });
    },

    /** internal state */
    _apiUrl: null,
    _warehouseUrl: null,
    _storyApiUrl: null,
    _fetchHeaders: {}
  };

  /* ─── Internal helpers ─── */

  /**
   * Normalize hospitals_340b_pa view rows (camelCase or Gold PascalCase) to the map/KPI shape.
   * @param {Array<Object>} rows
   * @returns {Array<{hospitalName: string, lat: number, lon: number, geocodeSource: string, displayName: string}>}
   */
  function _mapHospitalViewRows(rows) {
    if (!rows || !Array.isArray(rows)) return [];
    return rows
      .map(function (row) {
        if (!row || typeof row !== "object") return null;
        var lat = row.lat != null ? Number(row.lat) : row.Latitude != null ? Number(row.Latitude) : NaN;
        var lon = row.lon != null ? Number(row.lon) : row.Longitude != null ? Number(row.Longitude) : NaN;
        return {
          hospitalName: String(row.hospitalName || row.HospitalName || "").trim(),
          lat: isFinite(lat) ? lat : null,
          lon: isFinite(lon) ? lon : null,
          geocodeSource: String(row.geocodeSource || row.GeocodeSource || ""),
          displayName: String(row.displayName || row.AddressDisplay || "")
        };
      })
      .filter(function (h) {
        return h && h.hospitalName && isFinite(h.lat) && isFinite(h.lon);
      });
  }

  /** Read a numeric KPI from HAP_STATIC_METRICS (state-data.js) with fallback. */
  function _staticMetric(metricKey, fallback) {
    if (typeof HAP_STATIC_METRICS !== "undefined" && HAP_STATIC_METRICS[metricKey] != null) {
      return HAP_STATIC_METRICS[metricKey];
    }
    return fallback;
  }

  /**
   * Build the full static KPI array (home strip + export + policy context).
   * Protection counts are derived from STATES_WITH_PROTECTION (excl. D.C. from 50-state headline).
   */
  function _buildStaticKpiArray() {
    var protectedCount = 0;
    if (typeof STATES_WITH_PROTECTION !== "undefined") {
      protectedCount = STATES_WITH_PROTECTION.filter(function (s) { return s !== "DC"; }).length;
    }
    var unprotected = 50 - protectedCount;
    var KPI_META = {
      PA_HOSPITALS_340B_COUNT: { label: "PA Hospitals", meaning: "Rely on 340B to serve patients", topic: "access", prefix: "", suffix: "", decimals: 0 },
      COMMUNITY_BENEFIT_TOTAL_BILLIONS: { label: "Community Benefit", meaning: "Reported by 340B hospitals (2024)", topic: "finance", prefix: "$", suffix: "B", decimals: 2 },
      US_STATES_CP_PROTECTION_COUNT: { label: "States Protected", meaning: "Contract pharmacy laws enacted", topic: "policy", prefix: "", suffix: "", decimals: 0 },
      US_STATES_NO_CP_PROTECTION_COUNT: { label: "States Without", meaning: "No contract pharmacy protection", topic: "risk", prefix: "", suffix: "", decimals: 0 },
      OUTPATIENT_SHARE_PCT: { label: "340B Drug Market Share", meaning: "Approx. share of total U.S. drug market (HAP / Commonwealth Fund context)", topic: "policy", prefix: "", suffix: "%", decimals: 0 },
      HRSA_AUDIT_COUNT: { label: "HRSA Audits (FY 2024)", meaning: "Total Program Integrity audits (hospitals + manufacturers)", topic: "risk", prefix: "", suffix: "", decimals: 0 }
    };
    var keys = [
      "PA_HOSPITALS_340B_COUNT",
      "COMMUNITY_BENEFIT_TOTAL_BILLIONS",
      "US_STATES_CP_PROTECTION_COUNT",
      "US_STATES_NO_CP_PROTECTION_COUNT",
      "OUTPATIENT_SHARE_PCT",
      "HRSA_AUDIT_COUNT"
    ];
    var values = {
      PA_HOSPITALS_340B_COUNT: _staticMetric("PA_HOSPITALS_340B_COUNT", 72),
      COMMUNITY_BENEFIT_TOTAL_BILLIONS: _staticMetric("COMMUNITY_BENEFIT_TOTAL_BILLIONS", 7.95),
      US_STATES_CP_PROTECTION_COUNT: protectedCount,
      US_STATES_NO_CP_PROTECTION_COUNT: unprotected,
      OUTPATIENT_SHARE_PCT: _staticMetric("OUTPATIENT_SHARE_PCT", 7),
      HRSA_AUDIT_COUNT: _staticMetric("HRSA_AUDIT_COUNT", 184)
    };
    return keys.map(function (key) {
      var meta = KPI_META[key] || {};
      return {
        key: key,
        value: values[key],
        label: meta.label || key,
        meaning: meta.meaning || "",
        topic: meta.topic || "neutral",
        prefix: meta.prefix || "",
        suffix: meta.suffix || "",
        decimals: meta.decimals != null ? meta.decimals : 0,
        status: "ok",
        dataSource: "static"
      };
    });
  }

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

  /**
   * Merge warehouse hospitals_340b_pa / financials / stories into window.HAP_340B_DATA (runs even without dim_state_law).
   * @param {Object} data — parsed JSON from warehouse
   */
  function _syncHap340bHospitalBundle(data) {
    if (!data || typeof window === "undefined") return;
    if (!Array.isArray(data.hospitals_340b_pa) || data.hospitals_340b_pa.length === 0) return;
    window.HAP_340B_DATA = window.HAP_340B_DATA || {};
    window.HAP_340B_DATA.hospitals_340b_pa = data.hospitals_340b_pa;
    if (data.hospital_financials_340b) window.HAP_340B_DATA.hospital_financials_340b = data.hospital_financials_340b;
    if (data.hospital_stories) window.HAP_340B_DATA.hospital_stories = data.hospital_stories;
    if (data._meta) {
      window.HAP_340B_DATA._meta = Object.assign({}, window.HAP_340B_DATA._meta || {}, data._meta);
    }
    if (typeof window.HAP_340B_syncLegacyHospitalsFromView === "function") {
      window.HAP_340B_syncLegacyHospitalsFromView();
    }
  }

  /**
   * Push Gold dim_state_law into window globals so legacy code (maps, grids, 340b.js)
   * reads live warehouse data without refactors.
   *
   * @param {Object} data — parsed JSON from warehouse
   */
  function _syncWarehouseGlobals(data) {
    if (!data || typeof window === "undefined") return;
    _syncHap340bHospitalBundle(data);
    if (!Array.isArray(data.dim_state_law) || data.dim_state_law.length === 0) {
      return;
    }

    var names = {};
    var state340b = {};
    var fipsToAbbr = {};
    var withProtection = [];

    data.dim_state_law.forEach(function (row) {
      var code = row.StateCode;
      if (!code) return;
      names[code] = row.StateName || code;
      state340b[code] = {
        y: row.YearEnacted != null ? row.YearEnacted : null,
        pbm: !!row.PBMProtected,
        cp: !!row.ContractPharmacyProtected,
        notes: row.Notes || ""
      };
      if (row.StateFips != null && row.StateFips !== "") {
        var fNum = parseInt(String(row.StateFips), 10);
        if (!isNaN(fNum)) fipsToAbbr[fNum] = code;
      }
      if (row.ContractPharmacyProtected) withProtection.push(code);
    });

    window.STATE_NAMES = names;
    window.STATE_340B = state340b;
    window.FIPS_TO_ABBR = fipsToAbbr;
    window.STATES_WITH_PROTECTION = withProtection;

    if (data.dim_data_freshness && typeof window.CONFIG !== "undefined") {
      var f = data.dim_data_freshness;
      if (f.DisplayAsOfText) {
        window.CONFIG.dataFreshness = f.DisplayAsOfText;
        window.CONFIG.lastUpdated = f.DisplayAsOfText;
      }
    }

    if (typeof window.DATASET_METADATA !== "undefined" && data.dim_data_freshness) {
      var df = data.dim_data_freshness;
      if (df.DatasetVersion) window.DATASET_METADATA.datasetVersion = df.DatasetVersion;
      if (df.DisplayAsOfText) window.DATASET_METADATA.lastUpdated = df.DisplayAsOfText;
    }
  }

  /** Look up a numeric value from Gold KPI rows by MetricKey, with fallback. */
  function _goldVal(kpiRows, metricKey, fallback) {
    for (var i = 0; i < kpiRows.length; i++) {
      if (kpiRows[i].MetricKey === metricKey) {
        return kpiRows[i].ValueNumeric != null ? kpiRows[i].ValueNumeric : fallback;
      }
    }
    return fallback;
  }

  /** Map Gold fact_dashboard_kpi rows to the KPI card shape the UI expects. */
  function _mapKPIsFromGold(kpiRows) {
    var KPI_META = {
      PA_HOSPITALS_340B_COUNT: { label: "PA Hospitals", meaning: "Rely on 340B to serve patients", topic: "access", prefix: "", suffix: "", decimals: 0 },
      COMMUNITY_BENEFIT_TOTAL_BILLIONS: { label: "Community Benefit", meaning: "Reported by 340B hospitals", topic: "finance", prefix: "$", suffix: "B", decimals: 2 },
      US_STATES_CP_PROTECTION_COUNT: { label: "States Protected", meaning: "Contract pharmacy laws enacted", topic: "policy", prefix: "", suffix: "", decimals: 0 },
      US_STATES_NO_CP_PROTECTION_COUNT: { label: "States Without", meaning: "No contract pharmacy protection", topic: "risk", prefix: "", suffix: "", decimals: 0 },
      OUTPATIENT_SHARE_PCT: { label: "340B Drug Market Share", meaning: "Approx. share of total U.S. drug market (warehouse citation)", topic: "policy", prefix: "", suffix: "%", decimals: 0 },
      HRSA_AUDIT_COUNT: { label: "HRSA Audits (FY 2024)", meaning: "Total Program Integrity audits (hospitals + manufacturers)", topic: "risk", prefix: "", suffix: "", decimals: 0 }
    };
    var homeKeys = [
      "PA_HOSPITALS_340B_COUNT",
      "COMMUNITY_BENEFIT_TOTAL_BILLIONS",
      "US_STATES_CP_PROTECTION_COUNT",
      "US_STATES_NO_CP_PROTECTION_COUNT",
      "OUTPATIENT_SHARE_PCT",
      "HRSA_AUDIT_COUNT"
    ];
    return homeKeys.map(function (key) {
      var meta = KPI_META[key] || {};
      var fb = key === "OUTPATIENT_SHARE_PCT" ? _staticMetric("OUTPATIENT_SHARE_PCT", 7) : key === "HRSA_AUDIT_COUNT" ? _staticMetric("HRSA_AUDIT_COUNT", 184) : 0;
      return {
        key: key,
        value: _goldVal(kpiRows, key, fb),
        label: meta.label || key,
        meaning: meta.meaning || "",
        topic: meta.topic || "neutral",
        prefix: meta.prefix || "",
        suffix: meta.suffix || "",
        decimals: meta.decimals != null ? meta.decimals : 0,
        status: "ok",
        dataSource: "warehouse"
      };
    });
  }

  /**
   * Validate that a warehouse/API endpoint URL is safe to fetch from.
   * Blocks javascript:, data:, file:, and non-HTTPS URLs (except relative paths
   * and same-origin for local mock testing). Prevents open-redirect or SSRF-style
   * attacks if config/settings.js is tampered with or if someone calls
   * connectWarehouse() from the console with a malicious URL.
   *
   * @param {string} url
   * @returns {boolean}
   */
  function _isAllowedEndpoint(url) {
    if (url == null || typeof url !== "string") return false;
    var s = url.trim();
    if (!s) return false;
    if (/^javascript:/i.test(s) || /^data:/i.test(s) || /^file:/i.test(s)) return false;
    if (s.charAt(0) === "/" || s.indexOf("data/") === 0) return true;
    try {
      var u = new URL(s, window.location.href);
      if (u.protocol !== "https:" && u.protocol !== "http:") return false;
      if (/^(127\.|10\.|192\.168\.|0\.)/.test(u.hostname) || u.hostname === "localhost") {
        return u.origin === window.location.origin;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sanitize and normalize a story submission payload before storage or POST.
   *
   * WHY THIS EXISTS: Story payloads may originate from user-controlled form fields.
   * Before sending to the warehouse API, every field must be coerced to the expected
   * type, trimmed, length-bounded, and stripped of unexpected keys. This prevents
   * injection if the API constructs queries from payload fields, and ensures the
   * JSON shape matches fact_story_submission exactly.
   *
   * SECURITY: Warehouse APIs that insert this data MUST still use parameterized
   * queries server-side. Client-side sanitization is defense-in-depth, not a
   * substitute for server-side validation.
   *
   * @param {Object} raw — form payload (untrusted)
   * @returns {Object} — sanitized payload with only known keys
   */
  function _normalizeStoryPayload(raw) {
    if (!raw || typeof raw !== "object") return {};
    var SK = DataLayer.STORY_PAYLOAD_KEYS;
    var VALID_CATEGORIES = [
      "Patient Access", "Community Benefit", "Rural Care", "Financial Impact"
    ];
    var MAX_LENGTHS = {
      hospitalName: 200,
      county: 100,
      storyText: 500,
      contactEmail: 254,
      savingsApproximate: 100,
      communityProgramsFunded: 200,
      contractPharmacyUse: 200,
      manufacturerCommunications: 200
    };

    function safeStr(val, maxLen) {
      if (val == null) return "";
      var s = String(val).trim();
      if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
      return s;
    }

    var category = safeStr(raw[SK.category] || raw.category, 50);
    if (VALID_CATEGORIES.indexOf(category) === -1) category = "";

    var email = safeStr(raw[SK.contactEmail] || raw.email, MAX_LENGTHS.contactEmail);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = "";

    var out = {};
    out[SK.hospitalName]  = safeStr(raw[SK.hospitalName] || raw.hospital, MAX_LENGTHS.hospitalName);
    out[SK.county]        = safeStr(raw[SK.county] || raw.county, MAX_LENGTHS.county);
    out[SK.category]      = category;
    out[SK.storyText]     = safeStr(raw[SK.storyText] || raw.story, MAX_LENGTHS.storyText);
    out[SK.contactEmail]  = email;
    out[SK.submittedAt]   = raw[SK.submittedAt] || raw.timestamp || new Date().toISOString();
    out[SK.schemaVersion] = 2;

    if (raw[SK.savingsApproximate])          out[SK.savingsApproximate]          = safeStr(raw[SK.savingsApproximate], MAX_LENGTHS.savingsApproximate);
    if (raw[SK.communityProgramsFunded])     out[SK.communityProgramsFunded]     = safeStr(raw[SK.communityProgramsFunded], MAX_LENGTHS.communityProgramsFunded);
    if (raw[SK.contractPharmacyUse])         out[SK.contractPharmacyUse]         = safeStr(raw[SK.contractPharmacyUse], MAX_LENGTHS.contractPharmacyUse);
    if (raw[SK.manufacturerCommunications])  out[SK.manufacturerCommunications]  = safeStr(raw[SK.manufacturerCommunications], MAX_LENGTHS.manufacturerCommunications);

    out[SK.hospital]  = out[SK.hospitalName];
    out[SK.story]     = out[SK.storyText];
    out[SK.email]     = out[SK.contactEmail];
    out[SK.timestamp] = out[SK.submittedAt];
    out[SK.version]   = 2;

    return out;
  }

  /** Infer unit string from KPI shape for export. */
  function _inferUnit(kpi) {
    if (kpi.suffix === "B" && kpi.prefix === "$") return "USD_BILLIONS";
    if (kpi.suffix === "%") return "PERCENT";
    return "COUNT";
  }

  /** Store story in sessionStorage (offline fallback). */
  function _storeStoryLocally(payload) {
    var stories = [];
    try {
      stories = JSON.parse(sessionStorage.getItem("hap_stories") || "[]");
    } catch (e) { /* empty */ }
    stories.push(payload);
    sessionStorage.setItem("hap_stories", JSON.stringify(stories));
  }

  window.DataLayer = DataLayer;
  /** Canonical alias for PA legislator headshot path (static map only). */
  window.getPaPhoto = function (gpid, chamber) {
    return DataLayer.getPaLegislatorPhotoUrl(gpid, chamber);
  };
})();
