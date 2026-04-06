/**
 * Global Type Definitions — 340B Advocacy Dashboard
 *
 * WHO THIS IS FOR: Any developer working with the dashboard JavaScript.
 * WHAT IT DOES: Describes the shape of every global variable that gets
 *   loaded by <script> tags (state-data.js, config/settings.js, etc.)
 *   so TypeScript and your IDE can catch errors before runtime.
 * HOW IT CONNECTS: These types are consumed by types/data-layer.d.ts,
 *   types/ai-helpers.d.ts, and any new TypeScript modules in src/.
 */

/* ─── State Data (state-data.js) ─── */

/** Per-state 340B law data, keyed by state-data.js STATE_340B */
interface State340BEntry {
  /** Year the CP or PBM law was enacted, or null if no law */
  y: number | null;
  /** Has a PBM regulation law */
  pbm: boolean;
  /** Has a contract pharmacy protection law */
  cp: boolean;
  /** Editorial notes about the state's status */
  notes: string;
}

/** STATE_340B: map of state abbreviation → law data */
declare const STATE_340B: Record<string, State340BEntry>;

/** STATE_NAMES: map of state abbreviation → full name */
declare const STATE_NAMES: Record<string, string>;

/** FIPS_TO_ABBR: map of numeric FIPS code → state abbreviation */
declare const FIPS_TO_ABBR: Record<number, string>;

/** States (abbreviations) that have contract pharmacy protection */
declare const STATES_WITH_PROTECTION: string[];

/** Static metric values for headline KPIs */
declare const HAP_STATIC_METRICS: Record<string, number>;

/* ─── CONFIG (state-data.js) ─── */

interface ConfigCopy {
  overviewLead: string;
  hapPositionLead: string;
  hapAskItems: Array<{ label: string; impactLine: string }>;
  executiveStrip: {
    priority: { label: string; body: string };
    landscape: { label: string; body: string };
    trust: { label: string; body: string };
  };
  sourceSummary: string;
  sourcesLimitations: string;
}

interface DashboardConfig {
  dashboardTitle: string;
  dataFreshness: string;
  lastUpdated: string;
  copy: ConfigCopy;
  [key: string]: unknown;
}

declare const CONFIG: DashboardConfig;

/* ─── Dataset Metadata (data/dataset-metadata.js) ─── */

interface DatasetMetadata {
  datasetVersion: string;
  lastUpdated: string;
  methodology: string;
  [key: string]: unknown;
}

declare const DATASET_METADATA: DatasetMetadata;

/* ─── PA Member Photo Map ─── */

interface PaMemberPhotoEntry {
  img_id: string;
  bio_id?: string | number;
  bio_slug?: string;
  display_name?: string;
  [key: string]: unknown;
}

interface PaMemberPhotoMap {
  house: Record<string, PaMemberPhotoEntry>;
  senate: Record<string, PaMemberPhotoEntry>;
}

/* ─── Dashboard Settings (config/settings.js) ─── */

interface WarehouseSettings {
  enabled: boolean;
  useMockEndpoint: boolean;
  endpointUrl: string;
  pollIntervalMs: number;
  storyApiUrl: string;
  headers: Record<string, string>;
}

interface DashboardSettings {
  map: {
    tooltipDelayMs: number;
    highlightStrokeWidth: number;
    animateTransitions: boolean;
    useSimplifiedTopology: boolean;
  };
  features: {
    countUpAnimation: boolean;
    scrollReveal: boolean;
    printPdf: boolean;
    downloadPdfImage: boolean;
    shareLink: boolean;
    exportMapSvg: boolean;
  };
  a11y: {
    reducedMotionDisablesAnimations: boolean;
    skipMapLink: boolean;
  };
  performance: {
    deferSecondaryPanels: boolean;
  };
  warehouse: WarehouseSettings;
  powerbiEmbed: {
    enabled: boolean;
    reportId: string;
    embedUrl: string;
    accessToken: string;
  };
}

declare const DASHBOARD_SETTINGS: DashboardSettings;

/* ─── Window extensions ─── */

interface Window {
  DataLayer: import("./data-layer").DataLayerAPI;
  AIHelpers: import("./ai-helpers").AIHelpersAPI;
  HAP_PA_MEMBER_PHOTO_MAP: PaMemberPhotoMap;
  HAP_340B_DATA: {
    hospitals_340b_pa?: unknown[];
    hospital_financials_340b?: unknown[];
    hospital_stories?: unknown[];
    _meta?: Record<string, unknown>;
  };
  HAP_PA_340B_HOSPITALS: {
    meta: Record<string, unknown>;
    hospitals: Array<{
      name: string;
      lat: number;
      lon: number;
      source?: string;
      display_name?: string;
    }>;
  };
  DASHBOARD_SETTINGS: DashboardSettings;
  CONFIG: DashboardConfig;
  STATE_340B: Record<string, State340BEntry>;
  STATE_NAMES: Record<string, string>;
  FIPS_TO_ABBR: Record<number, string>;
  STATES_WITH_PROTECTION: string[];
  HAP_STATIC_METRICS: Record<string, number>;
  _PA_DELEGATION_DATA?: PaDelegationMember[];
  _PA_LEGISLATOR_DATA?: PaLegislator[];
  getPaPhoto: (gpid: string | number, chamber: string) => string;
}

/* ─── Delegation and legislator types ─── */

interface PaDelegationMember {
  member: string;
  chamber: "Senate" | "House";
  district: string;
  party: "D" | "R";
  position: "cosponsor" | "supportive" | "unknown" | "opposed";
  lastContact: string;
  action: string;
}

interface PaLegislator {
  name: string;
  district: number;
  party: string;
  engagementPosture: string;
  suggestedAction: string;
}
