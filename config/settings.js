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
    }
  };

  global.DASHBOARD_SETTINGS = DASHBOARD_SETTINGS;
})(typeof window !== "undefined" ? window : this);
