/**
 * AIHelpers — stub module for AI-assisted features.
 *
 * Today: returns template-based / canned responses using local data.
 * Tomorrow: swap internals to call an LLM API (OpenAI, Azure, etc.)
 *           for real summarization, narrative generation, and alerts.
 *
 * None of these functions make network calls in static mode.
 * Set AIHelpers.apiEndpoint to enable live AI when ready.
 */
(function () {
  "use strict";

  var AIHelpers = {
    /** Whether a live AI backend is connected */
    isLive: false,

    /** Set this to an LLM endpoint URL to enable live mode */
    apiEndpoint: null,

    /**
     * Summarize a hospital story into 1-2 sentences.
     * Static mode: truncates + adds ellipsis.
     * Live mode: calls LLM for real summarization.
     * @param {string} storyText
     * @returns {Promise<string>}
     */
    summarizeStory: function (storyText) {
      if (!storyText || storyText.length < 30) {
        return Promise.resolve(storyText || "");
      }

      if (AIHelpers.isLive && AIHelpers.apiEndpoint) {
        return _callAPI("summarize", { text: storyText });
      }

      var sentences = storyText.split(/(?<=[.!?])\s+/);
      var summary = sentences.slice(0, 2).join(" ");
      if (sentences.length > 2) summary += "...";
      return Promise.resolve(summary);
    },

    /**
     * Generate a plain-English narrative for a chart or KPI.
     * Static mode: builds a sentence from the data values.
     * @param {string} chartType — "protection-map" | "kpi" | "oversight" | "benefit"
     * @param {Object} data — relevant data values
     * @returns {Promise<string>}
     */
    generateChartNarrative: function (chartType, data) {
      if (AIHelpers.isLive && AIHelpers.apiEndpoint) {
        return _callAPI("narrative", { chartType: chartType, data: data });
      }

      var freshness = "March 2026";
      if (typeof CONFIG !== "undefined" && CONFIG.dataFreshness) {
        freshness = CONFIG.dataFreshness;
      }

      var narrative = "";
      switch (chartType) {
        case "protection-map":
          narrative = (data.protectedCount || 21) + " of 50 states have enacted contract pharmacy protection laws as of " + freshness + ". " +
            (data.unprotectedCount || 29) + " states have no protection in place.";
          break;
        case "kpi":
          if (data.key === "PA_HOSPITALS_340B_COUNT") {
            narrative = data.value + " hospitals in Pennsylvania participate in the 340B program, relying on discounted drug prices to fund patient care.";
          } else if (data.key === "COMMUNITY_BENEFIT_TOTAL_BILLIONS") {
            narrative = "340B hospitals reported $" + data.value + " billion in community benefit, including free prescriptions, cancer screening, and rural clinics.";
          } else {
            narrative = data.label + ": " + (data.prefix || "") + data.value + (data.suffix || "") + ".";
          }
          break;
        case "oversight":
          narrative = "In FY 2024, HRSA conducted " + (data.hospitalAudits || 179) + " audits of hospitals but only " + (data.mfgAudits || 5) +
            " of manufacturers — a " + Math.round((data.hospitalAudits || 179) / (data.mfgAudits || 5)) + "x disparity.";
          break;
        case "benefit":
          narrative = "340B hospitals reported $" + (data.amount || "7.95") + "B in community benefit in 2024, funding free prescriptions, cancer screening, behavioral health, and charity care.";
          break;
        default:
          narrative = "Data as of " + freshness + ".";
      }

      return Promise.resolve(narrative);
    },

    /**
     * Get the current policy alert (if any).
     * Static mode: returns a canned alert from CONFIG or null.
     * Live mode: fetches from a policy alert feed.
     * @returns {Promise<{headline, body, severity, date}|null>}
     */
    getPolicyAlert: function () {
      if (AIHelpers.isLive && AIHelpers.apiEndpoint) {
        return _callAPI("policy-alert", {});
      }

      return Promise.resolve({
        headline: "340B contract pharmacy protections advancing in multiple states",
        body: "Several state legislatures are considering new 340B contract pharmacy protection bills this session. HAP is monitoring developments and coordinating advocacy efforts.",
        severity: "info",
        date: typeof CONFIG !== "undefined" ? CONFIG.dataFreshness || "2026" : "2026"
      });
    }
  };

  function _callAPI(action, payload) {
    return fetch(AIHelpers.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, payload: payload })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) { return data.result || ""; })
    .catch(function () { return "(AI service unavailable)"; });
  }

  window.AIHelpers = AIHelpers;
})();
