/**
 * MetricValidator — compile-time and runtime validation for dashboard metrics.
 *
 * WHO THIS IS FOR: Developers and the CI pipeline.
 * WHAT IT DOES: Provides type-safe utilities to validate that MetricKeys,
 *   KPI values, and semantic layer entries are consistent. Can be imported
 *   by future TypeScript modules or compiled to JS for the audit script.
 * HOW IT CONNECTS:
 *   - Types come from types/data-layer.d.ts and types/globals.d.ts
 *   - MetricKey list mirrors powerbi/metric-registry.json
 *   - Used by dashboard-audit.py (via compiled JS) or future Node test runner
 *
 * POWER BI MAPPING: Validates that MetricKeys match Gold schema expectations.
 *   See docs/DATA-DICTIONARY.md for field definitions.
 */

import type {
  MetricKey,
  KPIRecord,
  TopicColor,
  StateRecord,
  PAStats,
} from "../types/data-layer";

/**
 * All known MetricKeys from the metric registry.
 * If you add a new metric, add it here AND in:
 *   - powerbi/metric-registry.json
 *   - powerbi/semantic-layer-registry.json
 *   - docs/DATA-DICTIONARY.md
 */
const KNOWN_METRIC_KEYS: readonly MetricKey[] = [
  "PA_HOSPITALS_340B_COUNT",
  "COMMUNITY_BENEFIT_TOTAL_BILLIONS",
  "OUTPATIENT_SHARE_PCT",
  "HRSA_AUDIT_COUNT",
  "US_STATES_CP_PROTECTION_COUNT",
  "US_STATES_NO_CP_PROTECTION_COUNT",
  "PA_RURAL_HOSPITAL_PCT",
  "PA_HOSPITALS_OPERATING_LOSS_PCT",
  "PA_LD_SERVICES_PCT",
  "HRSA_HOSPITAL_AUDIT_COUNT",
  "HRSA_MANUFACTURER_AUDIT_COUNT",
] as const;

const VALID_TOPICS: readonly TopicColor[] = [
  "access",
  "finance",
  "policy",
  "risk",
  "neutral",
] as const;

/** Result of a single validation check */
export interface ValidationResult {
  passed: boolean;
  check: string;
  message: string;
  severity: "error" | "warning" | "info";
}

/** Aggregate validation report */
export interface ValidationReport {
  allPassed: boolean;
  results: ValidationResult[];
  timestamp: string;
}

/**
 * Check if a string is a valid MetricKey.
 *
 * HOW IT WORKS:
 * 1. Checks the key against the KNOWN_METRIC_KEYS array
 * 2. TypeScript narrows the type so downstream code knows it's valid
 */
export function isValidMetricKey(key: string): key is MetricKey {
  return (KNOWN_METRIC_KEYS as readonly string[]).includes(key);
}

/**
 * Validate a KPI record from DataLayer.getKPIs().
 *
 * Checks:
 * - key is a known MetricKey
 * - value is a finite number
 * - topic is a valid semantic color
 * - label and meaning are non-empty strings
 */
export function validateKPI(kpi: KPIRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!isValidMetricKey(kpi.key)) {
    results.push({
      passed: false,
      check: "kpi-key-known",
      message: `Unknown MetricKey "${kpi.key}" — add to metric-registry.json`,
      severity: "error",
    });
  } else {
    results.push({
      passed: true,
      check: "kpi-key-known",
      message: `MetricKey "${kpi.key}" is registered`,
      severity: "info",
    });
  }

  if (typeof kpi.value !== "number" || !isFinite(kpi.value)) {
    results.push({
      passed: false,
      check: "kpi-value-finite",
      message: `KPI "${kpi.key}" has non-finite value: ${kpi.value}`,
      severity: "error",
    });
  }

  if (!(VALID_TOPICS as readonly string[]).includes(kpi.topic)) {
    results.push({
      passed: false,
      check: "kpi-topic-valid",
      message: `KPI "${kpi.key}" has unknown topic "${kpi.topic}"`,
      severity: "warning",
    });
  }

  if (!kpi.label || kpi.label.trim().length === 0) {
    results.push({
      passed: false,
      check: "kpi-label-present",
      message: `KPI "${kpi.key}" has empty label`,
      severity: "warning",
    });
  }

  if (!kpi.meaning || kpi.meaning.trim().length === 0) {
    results.push({
      passed: false,
      check: "kpi-meaning-present",
      message: `KPI "${kpi.key}" has empty meaning (every stat needs a "Why it matters")`,
      severity: "warning",
    });
  }

  return results;
}

/**
 * Validate a batch of state records from DataLayer.getStates().
 *
 * Checks:
 * - At least 50 states present (50 + DC = 51)
 * - Each has a 2-letter code and a name
 * - FIPS codes, when present, are between 1 and 78
 */
export function validateStates(states: StateRecord[]): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (states.length < 50) {
    results.push({
      passed: false,
      check: "states-count",
      message: `Expected at least 50 states, got ${states.length}`,
      severity: "error",
    });
  } else {
    results.push({
      passed: true,
      check: "states-count",
      message: `${states.length} states loaded`,
      severity: "info",
    });
  }

  for (const s of states) {
    if (!s.stateCode || s.stateCode.length !== 2) {
      results.push({
        passed: false,
        check: "state-code-format",
        message: `Invalid state code: "${s.stateCode}"`,
        severity: "error",
      });
    }
    if (!s.stateName || s.stateName.trim().length === 0) {
      results.push({
        passed: false,
        check: "state-name-present",
        message: `State "${s.stateCode}" has empty name`,
        severity: "error",
      });
    }
    if (s.fips !== null && (s.fips < 1 || s.fips > 78)) {
      results.push({
        passed: false,
        check: "state-fips-range",
        message: `State "${s.stateCode}" FIPS ${s.fips} out of valid range (1-78)`,
        severity: "warning",
      });
    }
  }

  return results;
}

/**
 * Validate PA stats from DataLayer.getPA().
 *
 * Checks that key percentage fields are within 0–100 and counts are positive.
 */
export function validatePAStats(pa: PAStats): ValidationResult[] {
  const results: ValidationResult[] = [];

  const pctFields: Array<[keyof PAStats, string]> = [
    ["ruralPercent", "Rural Hospital %"],
    ["operatingAtLossPercent", "Operating at Loss %"],
    ["ldServicesPercent", "L&D Services %"],
  ];

  for (const [field, label] of pctFields) {
    const val = pa[field] as number;
    if (typeof val !== "number" || val < 0 || val > 100) {
      results.push({
        passed: false,
        check: `pa-${field}-range`,
        message: `PA ${label} is ${val}, expected 0–100`,
        severity: "error",
      });
    }
  }

  if (typeof pa.hospitalCount !== "number" || pa.hospitalCount <= 0) {
    results.push({
      passed: false,
      check: "pa-hospital-count",
      message: `PA hospital count is ${pa.hospitalCount}, expected positive number`,
      severity: "error",
    });
  }

  if (pa.hrsaHospitalAudits < pa.hrsaManufacturerAudits) {
    results.push({
      passed: false,
      check: "pa-audit-ratio",
      message: "HRSA hospital audits should exceed manufacturer audits (oversight disparity)",
      severity: "warning",
    });
  }

  if (results.length === 0) {
    results.push({
      passed: true,
      check: "pa-stats-valid",
      message: "All PA stats within expected ranges",
      severity: "info",
    });
  }

  return results;
}

/**
 * Run all validators and produce a unified report.
 *
 * HOW IT WORKS:
 * 1. Validates each KPI record
 * 2. Validates state records
 * 3. Validates PA stats
 * 4. Aggregates into a single report with pass/fail verdict
 */
export function generateValidationReport(
  kpis: KPIRecord[],
  states: StateRecord[],
  paStats: PAStats
): ValidationReport {
  const allResults: ValidationResult[] = [];

  for (const kpi of kpis) {
    allResults.push(...validateKPI(kpi));
  }
  allResults.push(...validateStates(states));
  allResults.push(...validatePAStats(paStats));

  return {
    allPassed: allResults.every((r) => r.passed),
    results: allResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get the list of all known MetricKeys.
 * Useful for cross-referencing with the registry or semantic layer.
 */
export function getKnownMetricKeys(): readonly MetricKey[] {
  return KNOWN_METRIC_KEYS;
}
