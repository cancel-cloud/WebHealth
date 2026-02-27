import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  date,
  integer,
  numeric,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  isRestricted: boolean("is_restricted").default(false).notNull(),
  restrictionMessage: text("restriction_message"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Domain Specific Schema
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  tier: text("tier").default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner, member
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: text("id").primaryKey(), // sc-domain:example.com or GA4 property ID
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'gsc', 'ga4'
  name: text("name").notNull(),
  url: text("url").notNull(),
  ga4PropertyId: text("ga4_property_id"), // To link GSC to GA4
  syncStatus: text("sync_status").default("pending").notNull(), // pending, syncing, complete, failed
  lastSyncedAt: timestamp("last_synced_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  dateRangeStart: date("date_range_start").notNull(),
  dateRangeEnd: date("date_range_end").notNull(),
  compareRangeStart: date("compare_range_start").notNull(),
  compareRangeEnd: date("compare_range_end").notNull(),
  status: text("status").default("queued").notNull(), // queued, waiting_for_metrics, processing, complete, failed, scheduled
  data: jsonb("data"), // Raw GSC / GA4
  quickWins: jsonb("quick_wins"), // AI results
  aiStatus: text("ai_status").default("queued"),
  aiReportJson: jsonb("ai_report_json"),
  aiReportMarkdown: text("ai_report_markdown"),
  aiInputSnapshotSanitized: jsonb("ai_input_snapshot_sanitized"),
  aiModel: text("ai_model"),
  aiOutputStrategy: text("ai_output_strategy"),
  aiPromptVersionId: text("ai_prompt_version_id"),
  aiPromptSnapshot: text("ai_prompt_snapshot"),
  openaiResponseId: text("openai_response_id"),
  aiUsage: jsonb("ai_usage"),
  aiEstimatedCostUsd: numeric("ai_estimated_cost_usd", { precision: 12, scale: 6 }),
  openaiRequestIds: jsonb("openai_request_ids"),
  siteChanges: jsonb("site_changes"),
  xlsxStatus: text("xlsx_status").default("pending"),
  xlsxArtifactKey: text("xlsx_artifact_key"),
  xlsxArtifactUrl: text("xlsx_artifact_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const crawls = pgTable("crawls", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // pending, running, complete, failed
  pagesCrawled: integer("pages_crawled").default(0).notNull(),
  data: jsonb("data"), // Array of structural issues (missing H1, bad titles)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id:             text("id").primaryKey(),
  userId:         text("user_id").notNull().unique()
                    .references(() => user.id, { onDelete: "cascade" }),
  // Notification preferences
  weeklyDigest:   boolean("weekly_digest").default(false).notNull(),
  reportComplete: boolean("report_complete").default(true).notNull(),
  syncFailure:    boolean("sync_failure").default(true).notNull(),
  // Billing preferences
  emailReceipts:  boolean("email_receipts").default(true).notNull(),
  // Report generation language (auto = infer from Google locale)
  reportLanguage: text("report_language").default("auto").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

// Admin Tables

export const systemLogs = pgTable("system_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(), // 'property_sync' | 'metrics_sync' | 'report_process'
  triggeredBy: text("triggered_by").notNull().references(() => user.id),
  targetUserId: text("target_user_id").references(() => user.id),
  status: text("status").notNull(), // 'started' | 'success' | 'failed'
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const metricsBackfillJobs = pgTable("metrics_backfill_jobs", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  triggeredByUserId: text("triggered_by_user_id").notNull().references(() => user.id),
  targetPropertyId: text("target_property_id").references(() => properties.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").references(() => user.id),
  includeGsc: boolean("include_gsc").default(true).notNull(),
  includeGa4: boolean("include_ga4").default(true).notNull(),
  timeframeMode: text("timeframe_mode").default("custom").notNull(), // preset | custom
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end").notNull(),
  refreshRecentDays: integer("refresh_recent_days").default(7).notNull(),
  reason: text("reason").notNull(), // admin_sync | report_preflight | manual_backfill
  status: text("status").default("queued").notNull(), // queued | processing | complete | failed | partial
  totals: jsonb("totals"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
}, (t) => [
  index("metrics_backfill_jobs_team_status_idx").on(t.teamId, t.status, t.createdAt),
  index("metrics_backfill_jobs_property_created_idx").on(t.targetPropertyId, t.createdAt),
]);

export const gscDailyRaw = pgTable("gsc_daily_raw", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  sourceDate: date("source_date").notNull(),
  siteUrl: text("site_url").notNull(),
  summaryPayload: jsonb("summary_payload").notNull(),
  queriesPayload: jsonb("queries_payload"),
  pagesPayload: jsonb("pages_payload"),
  countriesPayload: jsonb("countries_payload"),
  devicesPayload: jsonb("devices_payload"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  syncJobId: text("sync_job_id").references(() => metricsBackfillJobs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.propertyId, t.sourceDate),
  index("gsc_daily_raw_team_date_idx").on(t.teamId, t.sourceDate),
  index("gsc_daily_raw_property_fetched_idx").on(t.propertyId, t.fetchedAt),
]);

export const ga4DailyRaw = pgTable("ga4_daily_raw", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  gscPropertyId: text("gsc_property_id").references(() => properties.id, { onDelete: "set null" }),
  ga4PropertyId: text("ga4_property_id").notNull(),
  sourceDate: date("source_date").notNull(),
  runReportPayload: jsonb("run_report_payload").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  syncJobId: text("sync_job_id").references(() => metricsBackfillJobs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.ga4PropertyId, t.sourceDate),
  index("ga4_daily_raw_gsc_date_idx").on(t.gscPropertyId, t.sourceDate),
  index("ga4_daily_raw_team_date_idx").on(t.teamId, t.sourceDate),
]);

export const gscDailyFacts = pgTable("gsc_daily_facts", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  sourceDate: date("source_date").notNull(),
  clicks: integer("clicks").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  ctr: text("ctr").default("0").notNull(),
  position: text("position").default("0").notNull(),
  queryCount: integer("query_count").default(0).notNull(),
  pageCount: integer("page_count").default(0).notNull(),
  rawVersion: text("raw_version").default("v1").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.propertyId, t.sourceDate),
  index("gsc_daily_facts_team_date_idx").on(t.teamId, t.sourceDate),
]);

export const ga4DailyFacts = pgTable("ga4_daily_facts", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  gscPropertyId: text("gsc_property_id").references(() => properties.id, { onDelete: "set null" }),
  ga4PropertyId: text("ga4_property_id").notNull(),
  sourceDate: date("source_date").notNull(),
  sessions: integer("sessions").default(0).notNull(),
  users: integer("users").default(0).notNull(),
  newUsers: integer("new_users").default(0).notNull(),
  rawVersion: text("raw_version").default("v1").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.ga4PropertyId, t.sourceDate),
  index("ga4_daily_facts_gsc_date_idx").on(t.gscPropertyId, t.sourceDate),
  index("ga4_daily_facts_team_date_idx").on(t.teamId, t.sourceDate),
]);

export const propertyDailyAiSummaries = pgTable("property_daily_ai_summaries", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  sourceDate: date("source_date").notNull(),
  hasGsc: boolean("has_gsc").default(false).notNull(),
  hasGa4: boolean("has_ga4").default(false).notNull(),
  model: text("model"),
  inputVersion: text("input_version").default("v1").notNull(),
  summaryJson: jsonb("summary_json"),
  summaryText: text("summary_text"),
  status: text("status").default("queued").notNull(), // queued | processing | complete | failed
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.propertyId, t.sourceDate),
  index("property_daily_ai_summaries_team_property_date_idx").on(t.teamId, t.propertyId, t.sourceDate),
]);

export const featureFlags = pgTable("feature_flags", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  enabledGlobally: boolean("enabled_globally").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userFeatureFlags = pgTable("user_feature_flags", {
  id: text("id").primaryKey(),
  flagId: text("flag_id").notNull().references(() => featureFlags.id),
  userId: text("user_id").notNull().references(() => user.id),
  enabled: boolean("enabled").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.flagId, t.userId)]);

export const planSettings = pgTable("plan_settings", {
  id: text("id").primaryKey(),
  tier: text("tier").unique().notNull(), // 'free' | 'pro' | 'team'
  displayName: text("display_name").notNull(),
  reportsPerMonth: integer("reports_per_month"), // null = unlimited
  maxProperties: integer("max_properties"), // null = unlimited
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiReportPromptVersions = pgTable("ai_report_prompt_versions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  template: text("template").notNull(),
  examples: text("examples"),
  schemaVersion: text("schema_version").default("v1").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiReportSettings = pgTable("ai_report_settings", {
  id: text("id").primaryKey(),
  model: text("model").notNull(),
  outputStrategy: text("output_strategy").default("json_schema").notNull(),
  temperature: numeric("temperature", { precision: 4, scale: 2 }).default("0.2").notNull(),
  maxOutputTokens: integer("max_output_tokens").default(6000).notNull(),
  inputTokenBudget: integer("input_token_budget").default(90000).notNull(),
  language: text("language").default("de").notNull(),
  serviceTier: text("service_tier").default("default").notNull(),
  useBackgroundMode: boolean("use_background_mode").default(true).notNull(),
  usePromptCaching: boolean("use_prompt_caching").default(true).notNull(),
  useStrictSchema: boolean("use_strict_schema").default(true).notNull(),
  schemaVersion: text("schema_version").default("v1").notNull(),
  promptVersionId: text("prompt_version_id").references(() => aiReportPromptVersions.id, { onDelete: "set null" }),
  updatedByUserId: text("updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportJobs = pgTable("report_jobs", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // generate_report | render_xlsx
  status: text("status").default("queued").notNull(), // queued | processing | complete | failed
  phase: text("phase").default("queued").notNull(),
  priority: integer("priority").default(100).notNull(),
  availableAt: timestamp("available_at").defaultNow().notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(3).notNull(),
  claimedBy: text("claimed_by"),
  claimedAt: timestamp("claimed_at"),
  claimExpiresAt: timestamp("claim_expires_at"),
  heartbeatAt: timestamp("heartbeat_at"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  lastError: text("last_error"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("report_jobs_status_available_idx").on(t.status, t.availableAt, t.priority, t.createdAt),
  index("report_jobs_team_status_claim_idx").on(t.teamId, t.status, t.claimExpiresAt),
  index("report_jobs_report_kind_status_idx").on(t.reportId, t.kind, t.status),
]);

export const reportJobEvents = pgTable("report_job_events", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => reportJobs.id, { onDelete: "cascade" }),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  phase: text("phase").notNull(),
  level: text("level").default("info").notNull(), // info | warn | error
  message: text("message").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("report_job_events_job_created_idx").on(t.jobId, t.createdAt),
  index("report_job_events_report_created_idx").on(t.reportId, t.createdAt),
  index("report_job_events_team_created_idx").on(t.teamId, t.createdAt),
]);

export const crawlPageSnapshots = pgTable("crawl_page_snapshots", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  crawlId: text("crawl_id").references(() => crawls.id, { onDelete: "set null" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  h1Texts: jsonb("h1_texts"),
  extractedTextHash: text("extracted_text_hash"),
  seoFingerprintHash: text("seo_fingerprint_hash").notNull(),
  machineDiffSummary: text("machine_diff_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("crawl_page_snapshots_property_url_created_idx").on(t.propertyId, t.canonicalUrl, t.createdAt),
  index("crawl_page_snapshots_property_fingerprint_idx").on(t.propertyId, t.seoFingerprintHash),
  index("crawl_page_snapshots_report_idx").on(t.reportId, t.createdAt),
]);

export const propertyPageRegistry = pgTable("property_page_registry", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  canonicalUrl: text("canonical_url").notNull(),
  currentFingerprintHash: text("current_fingerprint_hash").notNull(),
  currentSnapshotId: text("current_snapshot_id").references(() => crawlPageSnapshots.id, { onDelete: "set null" }),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  lastChangedAt: timestamp("last_changed_at"),
  lastReportId: text("last_report_id").references(() => reports.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.propertyId, t.canonicalUrl),
  index("property_page_registry_property_active_idx").on(t.propertyId, t.isActive, t.lastSeenAt),
]);

export const openaiDailyCosts = pgTable("openai_daily_costs", {
  id: text("id").primaryKey(),
  sourceDate: date("source_date").notNull(),
  projectId: text("project_id"),
  lineItem: text("line_item"),
  amountUsd: numeric("amount_usd", { precision: 14, scale: 6 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  rawBucket: jsonb("raw_bucket").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.sourceDate, t.projectId, t.lineItem),
  index("openai_daily_costs_source_date_idx").on(t.sourceDate),
  index("openai_daily_costs_project_date_idx").on(t.projectId, t.sourceDate),
]);
