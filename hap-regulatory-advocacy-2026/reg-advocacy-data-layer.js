/**
 * Regulatory Advocacy DataLayer — Power BI / warehouse-ready data access.
 *
 * WHO THIS IS FOR: Developers wiring this static brief to Gold tables or a JSON API;
 *   data analysts mapping MetricKey rows in fact_dashboard_kpi.
 * WHAT IT DOES: Reads window.HAP_REGULATORY_ADVOCACY_2026 (facts.js) and exposes a stable
 *   Promise-based API plus flattened KPI rows and a semantic JSON envelope for exports.
 * HOW IT CONNECTS: Loaded after facts.js on index.html and reg-advocacy-mobile.html;
 *   app.js and reg-advocacy-mobile.js may keep reading the global directly until refresh() is used.
 *
 * POWER BI MAPPING: Rows align with dbo.gold_fact_dashboard_kpi (MetricKey, ValueNumeric,
 *   ValueText, Unit, AsOfDate, SourceCitation). See powerbi/metric-registry.json entries with
 *   dashboardScope REG_ADVOCACY_2026 and powerbi/semantic-layer-registry.json → regAdvocacy2026.
 *
 * See docs/DATA-DICTIONARY.md § HAP Regulatory Advocacy 2026.
 */
(function () {
  'use strict';

  var DASHBOARD_KEY = 'REG_ADVOCACY_2026';
  var STATIC_SOURCE = 'hap-regulatory-advocacy-2026/facts.js';

  /**
   * @returns {Object|null}
   */
  function _bundle() {
    return typeof window !== 'undefined' && window.HAP_REGULATORY_ADVOCACY_2026
      ? window.HAP_REGULATORY_ADVOCACY_2026
      : null;
  }

  /**
   * @param {Object} data
   * @param {string} sourceId
   * @returns {{ citation: string, url: string }}
   */
  function _sourceMeta(data, sourceId) {
    var list = data && data.sources ? data.sources : [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === sourceId) {
        var s = list[i];
        var cite = (s.shortTitle || s.publisher || sourceId || '').trim();
        return { citation: cite, url: (s.url || '').trim() };
      }
    }
    return { citation: sourceId || 'unknown', url: '' };
  }

  /**
   * @param {Object} row — facts row with optional metricKey, valueNumeric, valueUnit, sourceId
   * @param {string} uiAnchor
   * @param {Record<string, Object>} out — deduped by metricKey (first occurrence wins)
   */
  function _ingestMetricRow(row, uiAnchor, out) {
    if (!row || !row.metricKey) return;
    if (out[row.metricKey]) return;
    var sm = _sourceMeta(_bundle(), row.sourceId);
    out[row.metricKey] = {
      metricKey: row.metricKey,
      valueNumeric: typeof row.valueNumeric === 'number' ? row.valueNumeric : null,
      valueText: row.valueDisplay != null ? String(row.valueDisplay) : row.value != null ? String(row.value) : null,
      valueUnit: row.valueUnit || 'UNKNOWN',
      sourceId: row.sourceId || null,
      sourceCitation: sm.citation,
      sourceUrl: sm.url,
      uiAnchor: uiAnchor
    };
    if (Array.isArray(row.supplementalMetrics)) {
      for (var j = 0; j < row.supplementalMetrics.length; j++) {
        _ingestMetricRow(row.supplementalMetrics[j], uiAnchor + '/sup' + j, out);
      }
    }
  }

  /**
   * @param {Object} data
   * @returns {Object[]} Gold-shaped rows (MetricKey unique)
   */
  function _uniqueKpiRows(data) {
    var acc = {};
    if (!data) return [];

    (data.heroKpis || []).forEach(function (row, i) {
      _ingestMetricRow(row, 'heroKpis[' + i + ']', acc);
    });
    (data.statBand || []).forEach(function (row, i) {
      _ingestMetricRow(row, 'statBand[' + i + ']', acc);
    });
    if (data.statesCallout && data.statesCallout.metricKey) {
      _ingestMetricRow(
        Object.assign({ sourceId: data.statesCallout.sourceId }, data.statesCallout),
        'statesCallout',
        acc
      );
    }
    (data.impactTiles || []).forEach(function (row, i) {
      _ingestMetricRow(row, 'impactTiles[' + i + ']', acc);
    });

    return Object.keys(acc)
      .sort()
      .map(function (k) {
        return acc[k];
      });
  }

  var RegAdvocacyDataLayer = {
    dashboardKey: DASHBOARD_KEY,

    /**
     * Bundle metadata for semantic contracts and IT discovery.
     * @returns {{ dashboardKey: string, source: string, validationStatus: string, letterDateDisplay: string|null }}
     */
    getMeta: function () {
      var data = _bundle();
      var letter = data && data.letterContext ? data.letterContext.dateDisplay : null;
      return {
        dashboardKey: DASHBOARD_KEY,
        source: STATIC_SOURCE,
        validationStatus: 'verified_static',
        letterDateDisplay: letter
      };
    },

    /**
     * Same shape the UI uses today; async for parity with modules/data-layer.js.
     * @returns {Promise<Object>}
     */
    getDashboardData: function () {
      var data = _bundle();
      return Promise.resolve(data || {});
    },

    /**
     * Flattened KPI rows for warehouse / Power BI ingestion (unique MetricKey).
     * @returns {Promise<Object[]>}
     */
    getKpiRows: function () {
      return Promise.resolve(_uniqueKpiRows(_bundle()));
    },

    /**
     * Semantic envelope sample shape (powerbi/semantic-envelope-sample.json) for this dashboard.
     * @returns {Promise<Object>}
     */
    getSemanticEnvelope: function () {
      var data = _bundle();
      var meta = RegAdvocacyDataLayer.getMeta();
      var kpis = _uniqueKpiRows(data);
      return Promise.resolve({
        _meta: {
          source: STATIC_SOURCE,
          dashboardKey: DASHBOARD_KEY,
          lastUpdated: new Date().toISOString(),
          validationStatus: 'verified_static',
          dataLayer: 'RegAdvocacyDataLayer.getSemanticEnvelope()'
        },
        dashboardKey: DASHBOARD_KEY,
        kpiFacts: kpis.map(function (r) {
          return {
            metricKey: r.metricKey,
            valueNumeric: r.valueNumeric,
            valueText: r.valueText,
            valueUnit: r.valueUnit,
            sourceCitation: r.sourceCitation,
            authoritativeSourceUrl: r.sourceUrl || undefined,
            uiAnchor: r.uiAnchor
          };
        }),
        nonNumericContent: {
          note:
            'Priorities, compareRows, letterQuotes, glossary, and sources[] remain in facts.js until dim_report_copy or separate Gold tables are approved.'
        }
      });
    },

    /**
     * Future: replace bundle from warehouse JSON. Today returns current static bundle.
     * @returns {Promise<Object>}
     */
    refresh: function () {
      return RegAdvocacyDataLayer.getDashboardData();
    }
  };

  window.RegAdvocacyDataLayer = RegAdvocacyDataLayer;
})();
