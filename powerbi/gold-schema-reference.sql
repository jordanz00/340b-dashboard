/*
  HAP 340B — illustrative Gold-layer DDL (reference only)
  =========================================================
  IT owns physical names, keys, and indexing. Adjust types for your platform
  (SQL Server, Synapse, Snowflake, etc.). See docs/POWER-BI-DATA-MODEL-MAPPING.md
  and docs/HAP-POWER-BI-DATA-FACTORY-SPEC.md.

  Do not treat this script as production-ready without DBA review and DQ gates.
*/

/* --- Dimension: state-level law attributes (maps from STATE_340B) --- */
CREATE TABLE dbo.gold_dim_state_law (
    StateCode                 CHAR(2)       NOT NULL,
    StateName                 NVARCHAR(100) NOT NULL,
    StateFips                 VARCHAR(3)  NULL,
    ContractPharmacyProtected BIT           NOT NULL,
    PBMProtected              BIT           NOT NULL,
    YearEnacted               SMALLINT      NULL,
    Notes                     NVARCHAR(MAX) NULL,
    IncludeInFiftyStateHeadline BIT         NOT NULL DEFAULT 1, /* e.g. DC = 0 if policy matches 340b.js */
    SourceSystem              NVARCHAR(200) NOT NULL,
    ExtractedAt               DATETIME2(3)  NOT NULL,
    RowHash                   VARBINARY(32) NULL,
    CONSTRAINT PK_gold_dim_state_law PRIMARY KEY (StateCode)
);

/* --- Fact: headline KPIs (maps from fact_dashboard_kpi in spec) --- */
CREATE TABLE dbo.gold_fact_dashboard_kpi (
    MetricKey       NVARCHAR(100) NOT NULL,
    ValueNumeric    DECIMAL(19, 6) NULL,
    ValueText       NVARCHAR(500)  NULL,
    Unit            NVARCHAR(50)   NOT NULL,
    AsOfDate        DATE           NOT NULL,
    SourceCitation  NVARCHAR(500)  NOT NULL,
    LoadedAt        DATETIME2(3)   NOT NULL,
    CONSTRAINT PK_gold_fact_dashboard_kpi PRIMARY KEY (MetricKey, AsOfDate)
);

/* --- Dimension: dashboard freshness / methodology --- */
CREATE TABLE dbo.gold_dim_data_freshness (
    DashboardKey      NVARCHAR(50)  NOT NULL,
    DisplayAsOf       DATE          NULL,
    DisplayAsOfText   NVARCHAR(100) NULL,
    DatasetVersion    NVARCHAR(20)  NULL,
    MethodologyText   NVARCHAR(MAX) NULL,
    LoadedAt          DATETIME2(3)  NOT NULL,
    CONSTRAINT PK_gold_dim_data_freshness PRIMARY KEY (DashboardKey)
);

/* --- Fact: time series for leadership trends (optional; replaces illustrative TREND_DATA in JS when sourced) --- */
CREATE TABLE dbo.gold_fact_metric_trend (
    MetricKey       NVARCHAR(100) NOT NULL,
    PeriodYear      SMALLINT       NOT NULL,
    ValueNumeric    DECIMAL(19, 6) NOT NULL,
    Unit            NVARCHAR(50)   NOT NULL,
    SourceCitation  NVARCHAR(500)  NOT NULL,
    LoadedAt        DATETIME2(3)   NOT NULL,
    CONSTRAINT PK_gold_fact_metric_trend PRIMARY KEY (MetricKey, PeriodYear)
);

/*
  Read-only consumer views for Power BI authors (grant SELECT on views only).
  Adjust schema (dbo) and names per IT standards. Views stabilize column contracts
  if underlying Gold tables are renamed or column order changes.
  (SQL Server users: run views in a separate batch after tables exist, e.g. after GO.)
*/
CREATE VIEW dbo.vw_pbi_dim_state_law AS
SELECT
    StateCode,
    StateName,
    StateFips,
    ContractPharmacyProtected,
    PBMProtected,
    YearEnacted,
    Notes,
    IncludeInFiftyStateHeadline,
    SourceSystem,
    ExtractedAt,
    RowHash
FROM dbo.gold_dim_state_law;

CREATE VIEW dbo.vw_pbi_fact_dashboard_kpi AS
SELECT
    MetricKey,
    ValueNumeric,
    ValueText,
    Unit,
    AsOfDate,
    SourceCitation,
    LoadedAt
FROM dbo.gold_fact_dashboard_kpi;

CREATE VIEW dbo.vw_pbi_dim_data_freshness AS
SELECT
    DashboardKey,
    DisplayAsOf,
    DisplayAsOfText,
    DatasetVersion,
    MethodologyText,
    LoadedAt
FROM dbo.gold_dim_data_freshness;

CREATE VIEW dbo.vw_pbi_fact_metric_trend AS
SELECT
    MetricKey,
    PeriodYear,
    ValueNumeric,
    Unit,
    SourceCitation,
    LoadedAt
FROM dbo.gold_fact_metric_trend;
