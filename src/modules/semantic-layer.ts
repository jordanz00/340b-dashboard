/**
 * Semantic Layer — centralized derived metrics for the 340B dashboard.
 *
 * WHO THIS IS FOR: Any module or UI code that needs a computed metric.
 * WHAT IT DOES: Provides pure functions for every derived metric (rates,
 *   ratios, per-unit calculations). No UI code should duplicate these
 *   computations — import from here instead.
 * HOW IT CONNECTS:
 *   - Types from types/data-layer.d.ts
 *   - Consumed by future TypeScript UI modules and the E2E/audit pipeline
 *   - Desktop and mobile surfaces use the same functions
 *
 * POWER BI MAPPING: Each derived metric maps to a DAX measure or
 *   calculated column. See docs/DATA-DICTIONARY.md for field definitions.
 */

import type {
  MetricKey,
  KPIRecord,
  StateRecord,
  PAStats,
} from "../../types/data-layer";

/**
 * Contract pharmacy protection rate (0–100).
 *
 * HOW IT WORKS:
 * 1. Takes the count of states with CP protection
 * 2. Divides by 50 (HAP convention excludes DC from headline count)
 * 3. Returns percentage
 *
 * POWER BI EQUIVALENT:
 * DAX: DIVIDE(COUNTROWS(FILTER(dim_state_law, [ContractPharmacyProtected] AND [IncludeInFiftyStateHeadline])), 50) * 100
 */
export function getProtectionRate(protectedCount: number): number {
  return (protectedCount / 50) * 100;
}

/**
 * States without contract pharmacy protection rate (0–100).
 *
 * Inverse of getProtectionRate. Used for the "at risk" KPI display.
 */
export function getUnprotectionRate(protectedCount: number): number {
  return ((50 - protectedCount) / 50) * 100;
}

/**
 * HRSA audit disparity ratio (hospital audits : manufacturer audits).
 *
 * A high ratio signals disproportionate scrutiny on hospitals vs.
 * drug manufacturers — a core HAP advocacy point.
 *
 * POWER BI EQUIVALENT:
 * DAX: DIVIDE([HRSA_HOSPITAL_AUDIT_COUNT], [HRSA_MANUFACTURER_AUDIT_COUNT])
 */
export function getAuditDisparityRatio(
  hospitalAudits: number,
  manufacturerAudits: number
): number {
  if (manufacturerAudits === 0) return hospitalAudits > 0 ? Infinity : 0;
  return hospitalAudits / manufacturerAudits;
}

/**
 * Community benefit per 340B hospital (in billions).
 *
 * Divides the total community benefit figure by the count of
 * participating hospitals.
 */
export function getCommunityBenefitPerHospital(
  totalBillions: number,
  hospitalCount: number
): number {
  if (hospitalCount === 0) return 0;
  return totalBillions / hospitalCount;
}

/**
 * Count states with contract pharmacy protection from state records.
 *
 * Excludes DC per HAP 50-state headline convention. If you need DC
 * included, filter the records yourself.
 */
export function countProtectedStates(states: StateRecord[]): number {
  return states.filter(
    (s) => s.hasContractPharmacyLaw && s.stateCode !== "DC"
  ).length;
}

/**
 * Count states without contract pharmacy protection (50-state basis).
 */
export function countUnprotectedStates(states: StateRecord[]): number {
  return 50 - countProtectedStates(states);
}

/**
 * Look up a specific metric value by MetricKey from a KPI array.
 *
 * Returns null if the key is not found. UI and mobile code should
 * use this instead of searching the array directly.
 */
export function getMetricValue(
  kpis: KPIRecord[],
  key: MetricKey
): number | null {
  const kpi = kpis.find((k) => k.key === key);
  return kpi ? kpi.value : null;
}

/**
 * Build a summary object of all derived PA metrics.
 *
 * Aggregates raw PAStats into a single object with all computed
 * rates and ratios. Used by both desktop and mobile surfaces.
 */
export function derivePASummary(pa: PAStats): {
  hospitalCount: number;
  ruralPercent: number;
  operatingAtLossPercent: number;
  ldServicesPercent: number;
  auditDisparityRatio: number;
  communityBenefitPerHospitalBillions: number;
} {
  return {
    hospitalCount: pa.hospitalCount,
    ruralPercent: pa.ruralPercent,
    operatingAtLossPercent: pa.operatingAtLossPercent,
    ldServicesPercent: pa.ldServicesPercent,
    auditDisparityRatio: getAuditDisparityRatio(
      pa.hrsaHospitalAudits,
      pa.hrsaManufacturerAudits
    ),
    communityBenefitPerHospitalBillions: getCommunityBenefitPerHospital(
      pa.communityBenefitBillions,
      pa.hospitalCount
    ),
  };
}
