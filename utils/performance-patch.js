/**
 * Design Mark X — lightweight performance hints (static-safe).
 * Does NOT monkey-patch addEventListener (that can break scroll spy and third-party code).
 * Main dashboard scroll handlers already use passive listeners + rAF where needed (340b.js).
 */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  function init() {
    try {
      document.documentElement.classList.add("dmx-perf");
    } catch (e) {
      /* ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
