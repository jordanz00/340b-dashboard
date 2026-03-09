/**
 * HAP 340B Dashboard — Configuration & State Data
 * ================================================
 * EDIT THIS FILE to update:
 * - Dashboard title, dates, and metadata (CONFIG)
 * - State law data when new laws pass (STATE_340B)
 *
 * See DATA-UPDATE.md for instructions.
 */

/* ========== CONFIGURATION ========== */
var CONFIG = {
  dashboardTitle: "340B Drug Pricing Program",
  dashboardSubtitle: "HAP Advocacy Dashboard",
  pageDescription: "HAP 340B Advocacy Dashboard: State-by-state contract pharmacy protection, Pennsylvania hospital impact, and the HAP policy case for protecting 340B integrity and contract pharmacy access.",
  shareTitle: "340B Drug Pricing Program | HAP Advocacy Dashboard",
  shareDescription: "Protect 340B integrity and contract pharmacy access | 72 PA hospitals | $7.95B community benefits | State-by-state 340B policy dashboard.",
  shareUrlBase: "https://jordanz00.github.io/340b-dashboard/340b.html",
  dataFreshness: "March 2025",
  lastUpdated: "March 2025",
  printDefaultState: "PA",
  printDefaultStateReason: "Pennsylvania remains the natural print context for HAP because hospitals participate heavily in 340B while contract pharmacy protection is still in progress.",

  /* High-salience copy */
  copy: {
    overviewLead: "The 340B program requires pharmaceutical manufacturers participating in Medicaid to sell outpatient drugs at discounted rates to eligible health care providers. It operates at no cost to taxpayers and helps hospitals, clinics, and safety-net providers sustain medication access for vulnerable and underserved patients.",
    hapPositionLead: "HAP supports policies that protect 340B program integrity and preserve hospitals' ability to use contract pharmacies so patients can keep accessing affordable medications close to home, including when care depends on distributed pharmacy networks.",
    hapAskLabel: "HAP asks lawmakers:",
    hapAskText: "Protect 340B integrity and preserve contract pharmacy access for patient medications.",
    mapHeroSub: "Select a state for details. Pennsylvania remains the focal HAP context because contract pharmacy protection is still in progress while 72 Pennsylvania hospitals participate in 340B.",
    sourceSummary: "State law status is cross-checked through MultiState, ASHP, and America's Essential Hospitals.",
    methodologyStateLaw: "State law data is compiled from MultiState, ASHP, and America's Essential Hospitals. Contract pharmacy protection status reflects enacted state laws as of March 2025. Update this data when new state laws pass.",
    printSourceSummary: "State law status is compiled from MultiState, ASHP, and America's Essential Hospitals. Community benefit figures are from 340B Health and AHA survey data (2024). HRSA oversight figures reflect federal audit activity in 2024.",
    verificationOrder: "MultiState, then ASHP, then America's Essential Hospitals.",
    executiveStrip: {
      priorityLabel: "Policy priority",
      priorityValue: "Protect 340B integrity and contract pharmacy access",
      priorityNote: "The dashboard is strongest when access, program integrity, and patient medication continuity are treated as one policy story.",
      landscapeLabel: "National landscape",
      landscapeNote: "Use the map and selected-state panel to compare enacted protections against states where hospitals remain exposed.",
      trustLabel: "Why trust this view",
      trustValue: "Legal status and recency are surfaced directly in the dashboard",
      trustNote: "Legislative status is verified in sequence through MultiState, ASHP, and America's Essential Hospitals."
    }
  },

  /* Map settings */
  mapAspectRatio: 0.55,
  mapMaxWidth: 960,

  /* Animation (milliseconds) */
  countUpDuration: 1200,
  dominoDelayPerState: 55,
  scrollRevealThreshold: 0.1,
};

/* ========== STATE LOOKUP TABLES ========== */
var FIPS_TO_ABBR = {
  1: "AL", 2: "AK", 4: "AZ", 5: "AR", 6: "CA", 8: "CO", 9: "CT", 10: "DE",
  11: "DC", 12: "FL", 13: "GA", 15: "HI", 16: "ID", 17: "IL", 18: "IN", 19: "IA",
  20: "KS", 21: "KY", 22: "LA", 23: "ME", 24: "MD", 25: "MA", 26: "MI", 27: "MN",
  28: "MS", 29: "MO", 30: "MT", 31: "NE", 32: "NV", 33: "NH", 34: "NJ", 35: "NM",
  36: "NY", 37: "NC", 38: "ND", 39: "OH", 40: "OK", 41: "OR", 42: "PA", 44: "RI",
  45: "SC", 46: "SD", 47: "TN", 48: "TX", 49: "UT", 50: "VT", 51: "VA", 53: "WA",
  54: "WV", 55: "WI", 56: "WY",
};

var STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "D.C.", FL: "Florida",
  GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

/**
 * State 340B data — UPDATE WHEN NEW STATE LAWS PASS
 * Each state: { y: year (or null), pbm: boolean, cp: boolean (contract pharmacy), notes: string }
 */
var STATE_340B = {
  AL: { y: 2021, pbm: true, cp: false, notes: "" },
  AZ: { y: 2022, pbm: true, cp: false, notes: "" },
  AR: { y: 2021, pbm: true, cp: true, notes: "First to enact; upheld in court." },
  CA: { y: 2023, pbm: true, cp: false, notes: "" },
  CO: { y: 2022, pbm: true, cp: true, notes: "Contract pharmacy 2025." },
  CT: { y: 2023, pbm: true, cp: false, notes: "" },
  DE: { y: null, pbm: false, cp: false, notes: "" },
  DC: { y: null, pbm: false, cp: false, notes: "" },
  FL: { y: null, pbm: false, cp: false, notes: "" },
  GA: { y: 2020, pbm: true, cp: false, notes: "" },
  HI: { y: 2025, pbm: false, cp: true, notes: "Reporting required." },
  ID: { y: null, pbm: false, cp: false, notes: "" },
  IL: { y: 2022, pbm: true, cp: false, notes: "" },
  IN: { y: 2021, pbm: true, cp: false, notes: "" },
  IA: { y: 2023, pbm: true, cp: false, notes: "" },
  KS: { y: 2024, pbm: false, cp: true, notes: "" },
  KY: { y: 2020, pbm: true, cp: false, notes: "" },
  LA: { y: 2023, pbm: true, cp: true, notes: "Upheld in court." },
  ME: { y: 2025, pbm: false, cp: true, notes: "Hybrid 2025." },
  MD: { y: 2024, pbm: false, cp: true, notes: "" },
  MA: { y: null, pbm: false, cp: false, notes: "" },
  MI: { y: 2022, pbm: true, cp: false, notes: "" },
  MN: { y: 2019, pbm: true, cp: true, notes: "Upheld in court." },
  MS: { y: 2024, pbm: true, cp: true, notes: "" },
  MO: { y: 2024, pbm: false, cp: true, notes: "Upheld in court." },
  MT: { y: 2021, pbm: true, cp: false, notes: "" },
  NE: { y: 2022, pbm: true, cp: true, notes: "" },
  NV: { y: 2023, pbm: true, cp: false, notes: "" },
  NH: { y: 2024, pbm: true, cp: false, notes: "" },
  NJ: { y: null, pbm: false, cp: false, notes: "" },
  NM: { y: 2023, pbm: true, cp: true, notes: "" },
  NY: { y: null, pbm: false, cp: false, notes: "" },
  NC: { y: 2021, pbm: true, cp: false, notes: "" },
  ND: { y: 2021, pbm: true, cp: true, notes: "" },
  OH: { y: 2021, pbm: true, cp: false, notes: "Hybrid 2025." },
  OK: { y: 2025, pbm: false, cp: true, notes: "" },
  OR: { y: 2025, pbm: true, cp: true, notes: "" },
  PA: { y: null, pbm: false, cp: false, notes: "In progress." },
  RI: { y: 2025, pbm: true, cp: true, notes: "Upheld in court." },
  SC: { y: null, pbm: false, cp: false, notes: "" },
  SD: { y: 2024, pbm: true, cp: true, notes: "" },
  TN: { y: 2021, pbm: true, cp: true, notes: "Upheld in court." },
  TX: { y: null, pbm: false, cp: false, notes: "" },
  UT: { y: 2020, pbm: true, cp: true, notes: "" },
  VT: { y: 2021, pbm: true, cp: true, notes: "Hybrid 2025." },
  VA: { y: 2021, pbm: true, cp: false, notes: "Governor vetoed protection." },
  WA: { y: null, pbm: false, cp: false, notes: "" },
  WV: { y: 2024, pbm: true, cp: true, notes: "" },
  WI: { y: null, pbm: false, cp: false, notes: "" },
  WY: { y: null, pbm: false, cp: false, notes: "" },
  AK: { y: null, pbm: false, cp: false, notes: "" },
};

/* Derived: states with contract pharmacy protection (computed from STATE_340B) */
var STATES_WITH_PROTECTION = Object.keys(STATE_340B).filter(function (abbr) {
  return STATE_340B[abbr] && STATE_340B[abbr].cp === true;
});
