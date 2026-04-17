/**
 * DataLayer Type Definitions — 340B Advocacy Dashboard
 *
 * WHO THIS IS FOR: Any developer calling DataLayer methods.
 * WHAT IT DOES: Full type coverage for every public method and return shape
 *   on window.DataLayer. Enables IDE autocomplete and compile-time checks.
 * HOW IT CONNECTS: Loaded by tsconfig.json; consumed by src/ TypeScript modules.
 *
 * POWER BI MAPPING: Return shapes mirror gold-schema-reference.sql.
 *   See docs/DATA-DICTIONARY.md for field definitions.
 */

/* ─── MetricKey literal type (all known keys from metric-registry.json) ─── */

export type MetricKey =
  | "PA_HOSPITALS_340B_COUNT"
  | "COMMUNITY_BENEFIT_TOTAL_BILLIONS"
  | "OUTPATIENT_SHARE_PCT"
  | "HRSA_AUDIT_COUNT"
  | "US_STATES_CP_PROTECTION_COUNT"
  | "US_STATES_NO_CP_PROTECTION_COUNT"
  | "PA_RURAL_HOSPITAL_PCT"
  | "PA_HOSPITALS_OPERATING_LOSS_PCT"
  | "PA_LD_SERVICES_PCT"
  | "HRSA_HOSPITAL_AUDIT_COUNT"
  | "HRSA_MANUFACTURER_AUDIT_COUNT"
  | "REG_ADV_PA_HOSPITAL_ECONOMIC_CONTRIBUTION_USD_BILLIONS"
  | "REG_ADV_PA_HOSPITAL_JOBS_FROM_HAP_MODEL"
  | "REG_ADV_PA_HOSPITAL_COMMUNITY_BENEFIT_USD_BILLIONS"
  | "REG_ADV_PA_ACUTE_HOSPITALS_OPERATING_IN_RED_PCT"
  | "REG_ADV_PA_ACUTE_HOSPITALS_MULTI_YEAR_LOSS_PCT"
  | "REG_ADV_PHC4_GAC_NEGATIVE_OPERATING_MARGIN_PCT"
  | "REG_ADV_PA_WORKFORCE_TURNOVER_REDUCTION_PCT"
  | "REG_ADV_HAP_MEMBER_HOSPITALS_MIN_COUNT"
  | "REG_ADV_PA_CODE_HOSPITAL_REG_ANCHOR_YEAR"
  | "REG_ADV_JC_AMBULATORY_COMPILED_STATE_COUNT";

/* ─── Topic semantic colors ─── */

export type TopicColor = "access" | "finance" | "policy" | "risk" | "neutral";

/* ─── Data source tracking ─── */

export type DataSource = "static-file" | "warehouse-gold" | "warehouse-api" | "powerbi-embed";

/* ─── Raw state-data.js shape (re-exported for globals.d.ts) ─── */

export interface State340BEntry {
  y: number | null;
  pbm: boolean;
  cp: boolean;
  notes: string;
}

/* ─── Return shapes ─── */

export interface StateRecord {
  stateCode: string;
  stateName: string;
  fips: number | null;
  hasContractPharmacyLaw: boolean;
  hasPbmLaw: boolean;
  yearEnacted: number | null;
  notes: string;
}

export interface KPIRecord {
  key: MetricKey;
  value: number;
  label: string;
  meaning: string;
  topic: TopicColor;
  prefix: string;
  suffix: string;
  decimals: number;
  status?: string;
  dataSource?: string;
}

export interface PAStats {
  hospitalCount: number;
  ruralPercent: number;
  operatingAtLossPercent: number;
  ldServicesPercent: number;
  hrsaHospitalAudits: number;
  hrsaManufacturerAudits: number;
  communityBenefitBillions: number;
  protectionStatus: string;
  _source: "static" | "warehouse";
}

export interface DelegationMember {
  member: string;
  chamber: string;
  district: string;
  party: string;
  position: string;
  lastContact: string;
  action: string;
}

export interface LegislatorRecord {
  name: string;
  district: number;
  party: string;
  engagementPosture: string;
  suggestedAction: string;
}

export interface FreshnessInfo {
  displayAsOf: string | null;
  datasetVersion: string | null;
  methodology: string | null;
  _source: "static" | "warehouse";
}

export interface HospitalPoint {
  hospitalName: string;
  lat: number | null;
  lon: number | null;
  geocodeSource: string;
  displayName: string;
}

export interface HospitalPointsResult {
  meta: Record<string, unknown>;
  hospitals: HospitalPoint[];
}

export interface ProvenanceSnapshot {
  source: DataSource;
  lastRefreshedIso: string | null;
  displayAsOf: string | null;
  datasetVersion: string | null;
  methodology: string | null;
  freshnessSource: string;
}

/* ─── Story submission ─── */

export interface StoryPayload {
  hospitalName: string;
  county: string;
  category: "Patient Access" | "Community Benefit" | "Rural Care" | "Financial Impact" | "";
  storyText: string;
  contactEmail: string;
  submittedAt: string;
  schemaVersion?: number;
  savingsApproximate?: string;
  communityProgramsFunded?: string;
  contractPharmacyUse?: string;
  manufacturerCommunications?: string;
  /** Legacy compatibility aliases */
  hospital?: string;
  story?: string;
  email?: string;
  timestamp?: string;
  version?: number;
}

export interface StorySubmitResult {
  ok: boolean;
  stored: "warehouse-api" | "sessionStorage" | "sessionStorage-fallback";
  reason?: string;
  result?: unknown;
}

/* ─── Connection results ─── */

export interface ConnectionResult {
  connected: boolean;
  reason?: string;
  source?: string;
  tablesLoaded?: string[];
}

export interface RefreshResult {
  refreshed: boolean;
  source?: string;
  tablesLoaded?: string[];
  error?: string;
  reason?: string;
}

export interface StatusInfo {
  source: DataSource;
  lastRefreshed: Date;
  isLive: boolean;
  warehouseUrl: string | null;
  apiUrl: string | null;
  cacheLoaded: boolean;
}

/* ─── Gold-shaped export ─── */

export interface GoldExport {
  _meta: {
    source: DataSource;
    lastUpdated: string;
    dataLayerLastRefreshed: string | null;
    displayAsOf: string | null;
    validationStatus: string;
  };
  _exportedAt: string;
  _source: DataSource;
  dim_state_law: Array<{
    StateCode: string;
    StateName: string;
    StateFips: string | null;
    ContractPharmacyProtected: boolean;
    PBMProtected: boolean;
    YearEnacted: number | null;
    Notes: string;
    IncludeInFiftyStateHeadline: boolean;
  }>;
  fact_dashboard_kpi: Array<{
    MetricKey: string;
    ValueNumeric: number;
    ValueText: null;
    Unit: string;
    AsOfDate: string;
    SourceCitation: string;
  }>;
  dim_data_freshness: {
    DashboardKey: string;
    DisplayAsOfText: string | null;
    DatasetVersion: string | null;
    MethodologyText: string | null;
  };
}

/* ─── Story payload keys constant ─── */

export interface StoryPayloadKeys {
  readonly hospitalName: "hospitalName";
  readonly county: "county";
  readonly category: "category";
  readonly storyText: "storyText";
  readonly contactEmail: "contactEmail";
  readonly submittedAt: "submittedAt";
  readonly schemaVersion: "schemaVersion";
  readonly savingsApproximate: "savingsApproximate";
  readonly communityProgramsFunded: "communityProgramsFunded";
  readonly contractPharmacyUse: "contractPharmacyUse";
  readonly manufacturerCommunications: "manufacturerCommunications";
  readonly hospital: "hospital";
  readonly story: "story";
  readonly email: "email";
  readonly timestamp: "timestamp";
  readonly version: "version";
}

/* ─── The DataLayer API itself ─── */

export interface DataLayerAPI {
  source: DataSource;
  lastRefreshed: Date;
  STORY_PAYLOAD_KEYS: StoryPayloadKeys;

  getStates(): Promise<StateRecord[]>;
  getKPIs(): Promise<KPIRecord[]>;
  getPA(): Promise<PAStats>;
  getDelegation(): Promise<DelegationMember[]>;
  getLegislators(): Promise<LegislatorRecord[]>;
  getConfig(key: string): Promise<unknown>;
  getFipsLookup(): Promise<Record<number, string>>;
  getStateNames(): Promise<Record<string, string>>;
  getRawState340B(): Promise<Record<string, State340BEntry>>;
  getMetricNumeric(metricKey: MetricKey): Promise<number | null>;
  getFreshness(): Promise<FreshnessInfo>;
  getPA340bHospitalPoints(): Promise<HospitalPointsResult>;
  getPaLegislatorPhotoUrl(gpid: string | number, chamber: string): string;
  getPaLegislatorBioPageUrl(gpid: string | number, chamber: string): string;
  isTrustedLegislatorUrl(raw: string | null | undefined): boolean;
  getProvenanceSnapshot(): Promise<ProvenanceSnapshot>;

  submitStory(payload: Partial<StoryPayload>): Promise<StorySubmitResult>;
  exportJSON(): Promise<GoldExport>;

  connectWarehouse(
    endpointUrl: string,
    options?: {
      intervalMs?: number;
      storyApiUrl?: string;
      headers?: Record<string, string>;
    }
  ): Promise<ConnectionResult>;
  connectAPI(endpointUrl: string, intervalMs?: number): Promise<ConnectionResult>;
  connectPowerBI(embedConfig: Record<string, unknown>): Promise<ConnectionResult>;
  refresh(): Promise<RefreshResult>;
  disconnect(): Promise<{ disconnected: boolean }>;
  onRefresh(fn: () => void): void;
  getStatus(): StatusInfo;

  /** Internal state (available but not part of public contract) */
  _apiUrl: string | null;
  _warehouseUrl: string | null;
  _storyApiUrl: string | null;
  _fetchHeaders: Record<string, string>;
}
