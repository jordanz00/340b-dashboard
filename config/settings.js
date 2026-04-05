/**
 * Dashboard Settings — 340B Advocacy Dashboard
 * ===========================================
 * Central place for chart options, display toggles, and non-data config.
 * Data (state laws, KPIs) stays in state-data.js; metadata in data/dataset-metadata.js.
 *
 * NOVICE: Edit here for chart behavior, animation toggles, or feature flags.
 */
(function (global) {
  "use strict";

  var DASHBOARD_SETTINGS = {
    /** Chart and map display */
    map: {
      tooltipDelayMs: 150,
      highlightStrokeWidth: 2.5,
      animateTransitions: true,
      /** Set true if you add a simplified TopoJSON (e.g. states-10m-smaller.json) for slow networks */
      useSimplifiedTopology: false
    },
    /** Feature flags (set false to disable without removing code) */
    features: {
      countUpAnimation: true,
      scrollReveal: true,
      printPdf: true,
      downloadPdfImage: true,
      shareLink: true,
      exportMapSvg: true
    },
    /** Accessibility */
    a11y: {
      reducedMotionDisablesAnimations: true,
      skipMapLink: true
    },
    /** Performance: defer below-the-fold panel updates until after first paint */
    performance: {
      deferSecondaryPanels: true
    },

    /**
     * Data warehouse connection — configure to switch from static to live data.
     *
     * HOW TO USE:
     * 1. Get the JSON API URL from IT/Strategic Analytics
     * 2. Set warehouse.enabled = true
     * 3. Set warehouse.endpointUrl to the URL
     * 4. The dashboard will auto-connect on load and poll for updates
     *
     * The endpoint must return Gold-shaped JSON matching data/mock-api-response.json.
     * See docs/WAREHOUSE-INTEGRATION-GUIDE.md for details.
     *
     * SECURITY: Never put passwords or tokens here. Use IT-managed auth
     * (Azure AD, service principal, etc.) — the browser handles cookies/headers.
     */
    warehouse: {
      enabled: false,
      /** When true, loads data/mock-api-response.json (ignores endpointUrl). Use for local testing. */
      useMockEndpoint: false,
      endpointUrl: "",
      pollIntervalMs: 900000,
      storyApiUrl: "",
      headers: {}
    },

    /**
     * Power BI embed — configure to embed PBI visuals inside the dashboard.
     * Requires the Power BI JS SDK script to be loaded on the page.
     * See docs/WAREHOUSE-INTEGRATION-GUIDE.md Path C.
     */
    powerbiEmbed: {
      enabled: false,
      reportId: "",
      embedUrl: "",
      accessToken: ""
    }
  };

  global.DASHBOARD_SETTINGS = DASHBOARD_SETTINGS;
})(typeof window !== "undefined" ? window : this);
