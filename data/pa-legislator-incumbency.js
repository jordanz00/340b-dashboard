/**
 * PA legislator incumbency overrides (April 2026 baseline).
 * Used by modules/pa-district-map.js for ZIP lookup: same person must not appear as both House and Senate.
 * Source: data/pa-legislator-incumbency.json — keep in sync when members change chambers.
 * Historical roles are intentionally omitted from this runtime object (current office only).
 */
window.HAP_PA_LEGISLATOR_INCUMBENCY = {
  asOf: "2026-04",
  notes:
    "ZIP dedupe: same bio_id uses current_chamber. Stale House rows are also suppressed when names normalize to the same person (see pa-district-map.js).",
  by_bio_id: {
    "1636": {
      display_name: "Patty Kim",
      current_chamber: "senate",
      current_role: "PA State Senate",
      district: "SD 15",
      status: "active"
    }
  }
};
