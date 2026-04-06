/**
 * AIHelpers Type Definitions — 340B Advocacy Dashboard
 *
 * WHO THIS IS FOR: Any developer using AIHelpers for narrative generation.
 * WHAT IT DOES: Types the stub AI module. Today it returns template strings;
 *   when connected to a live LLM, the same interface returns real AI output.
 * HOW IT CONNECTS: Consumed by src/ TypeScript modules and IDE tooling.
 */

export type ChartType = "protection-map" | "kpi" | "oversight" | "benefit";

export type AlertSeverity = "info" | "warning" | "critical";

export interface PolicyAlert {
  headline: string;
  body: string;
  severity: AlertSeverity;
  date: string;
}

export interface ChartNarrativeData {
  protectedCount?: number;
  unprotectedCount?: number;
  key?: string;
  value?: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  hospitalAudits?: number;
  mfgAudits?: number;
  amount?: string;
}

export interface AIHelpersAPI {
  isLive: boolean;
  apiEndpoint: string | null;

  summarizeStory(storyText: string): Promise<string>;
  generateChartNarrative(chartType: ChartType, data: ChartNarrativeData): Promise<string>;
  getPolicyAlert(): Promise<PolicyAlert | null>;
  summarizePolicyAlert(alertText: string): Promise<string>;
}
