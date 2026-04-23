import {
  __export
} from "./chunk-3LHI6BO3.js";

// packages/shared/src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  account: () => account,
  actionFeedback: () => actionFeedback,
  actionItems: () => actionItems,
  adminEmails: () => adminEmails,
  aiReportPromptVersions: () => aiReportPromptVersions,
  aiReportSettings: () => aiReportSettings,
  analysisWindowCache: () => analysisWindowCache,
  crawlPageSnapshots: () => crawlPageSnapshots,
  crawls: () => crawls,
  featureFlags: () => featureFlags,
  feedbackSubmissions: () => feedbackSubmissions,
  ga4DailyFacts: () => ga4DailyFacts,
  ga4DailyRaw: () => ga4DailyRaw,
  gscDailyFacts: () => gscDailyFacts,
  gscDailyRaw: () => gscDailyRaw,
  metricsBackfillJobs: () => metricsBackfillJobs,
  openaiDailyCosts: () => openaiDailyCosts,
  planSettings: () => planSettings,
  productEvents: () => productEvents,
  properties: () => properties,
  propertyCrawlSnapshots: () => propertyCrawlSnapshots,
  propertyDailyAiSummaries: () => propertyDailyAiSummaries,
  propertyPageRegistry: () => propertyPageRegistry,
  propertyRefreshJobs: () => propertyRefreshJobs,
  propertyWeeklyReviews: () => propertyWeeklyReviews,
  reportDetailAiExpansions: () => reportDetailAiExpansions,
  reportJobEvents: () => reportJobEvents,
  reportJobs: () => reportJobs,
  reportRecommendationFeedback: () => reportRecommendationFeedback,
  reportRecommendationStates: () => reportRecommendationStates,
  reports: () => reports,
  session: () => session,
  snapshotExports: () => snapshotExports,
  systemLogs: () => systemLogs,
  teamBrandingProfiles: () => teamBrandingProfiles,
  teamMembers: () => teamMembers,
  teamUsage: () => teamUsage,
  teams: () => teams,
  user: () => user,
  userFeatureFlags: () => userFeatureFlags,
  userSettings: () => userSettings,
  verification: () => verification,
  weeklyReviewRuns: () => weeklyReviewRuns
});
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
  index
} from "drizzle-orm/pg-core";
var user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  isRestricted: boolean("is_restricted").default(false).notNull(),
  restrictionMessage: text("restriction_message")
});
var session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
});
var account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});
var verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
});
var teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull().references(() => user.id),
  tier: text("tier").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionCancelAt: timestamp("subscription_cancel_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var teamBrandingProfiles = pgTable("team_branding_profiles", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  agencyName: text("agency_name"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  iconUrl: text("icon_url"),
  primaryColor: text("primary_color"),
  accentColor: text("accent_color"),
  footerNote: text("footer_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.teamId),
  index("team_branding_profiles_team_updated_idx").on(t.teamId, t.updatedAt)
]);
var teamMembers = pgTable("team_members", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  // owner, member
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var properties = pgTable("properties", {
  id: text("id").primaryKey(),
  // sc-domain:example.com or GA4 property ID
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  // 'gsc', 'ga4'
  name: text("name").notNull(),
  url: text("url").notNull(),
  ga4PropertyId: text("ga4_property_id"),
  // To link GSC to GA4
  gscDataStartDate: date("gsc_data_start_date"),
  syncStatus: text("sync_status").default("pending").notNull(),
  // pending, syncing, complete, failed
  lastSyncedAt: timestamp("last_synced_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var reports = pgTable("reports", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  dateRangeStart: date("date_range_start").notNull(),
  dateRangeEnd: date("date_range_end").notNull(),
  compareRangeStart: date("compare_range_start").notNull(),
  compareRangeEnd: date("compare_range_end").notNull(),
  status: text("status").default("queued").notNull(),
  // queued, waiting_for_metrics, processing, complete, failed, scheduled
  data: jsonb("data"),
  // Raw GSC / GA4
  quickWins: jsonb("quick_wins"),
  // AI results
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
  detailsCostUsd: numeric("details_cost_usd", { precision: 12, scale: 6 }),
  detailsRequestCount: integer("details_request_count").default(0).notNull(),
  openaiRequestIds: jsonb("openai_request_ids"),
  siteChanges: jsonb("site_changes"),
  source: text("source").default("manual").notNull(),
  // manual | auto_weekly
  autoRunKey: text("auto_run_key"),
  weeklyReviewFindings: jsonb("weekly_review_findings"),
  xlsxStatus: text("xlsx_status").default("pending"),
  xlsxArtifactKey: text("xlsx_artifact_key"),
  xlsxArtifactUrl: text("xlsx_artifact_url"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var reportRecommendationStates = pgTable("report_recommendation_states", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  recommendationId: text("recommendation_id").notNull(),
  state: text("state").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.reportId, t.recommendationId),
  index("report_recommendation_states_report_state_idx").on(t.reportId, t.state, t.updatedAt)
]);
var reportRecommendationFeedback = pgTable("report_recommendation_feedback", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  recommendationId: text("recommendation_id").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  feedbackType: text("feedback_type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.reportId, t.recommendationId),
  index("report_recommendation_feedback_report_type_idx").on(t.reportId, t.feedbackType, t.updatedAt)
]);
var actionItems = pgTable("action_items", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  actionFamily: text("action_family").notNull(),
  causeFamily: text("cause_family").notNull(),
  remedyKey: text("remedy_key").notNull(),
  targetType: text("target_type").notNull(),
  targetKey: text("target_key").notNull(),
  title: text("title").notNull(),
  owner: text("owner"),
  state: text("state").default("open").notNull(),
  systemRank: integer("system_rank"),
  systemScore: integer("system_score"),
  priorityOverride: text("priority_override").default("none").notNull(),
  overrideReason: text("override_reason"),
  overrideUpdatedByUserId: text("override_updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
  overrideUpdatedAt: timestamp("override_updated_at"),
  snoozedUntil: date("snoozed_until"),
  lastEvaluatedAt: timestamp("last_evaluated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.propertyId, t.fingerprint),
  index("action_items_property_state_idx").on(t.propertyId, t.state, t.updatedAt),
  index("action_items_team_property_updated_idx").on(t.teamId, t.propertyId, t.updatedAt),
  index("action_items_team_rank_idx").on(t.teamId, t.systemRank, t.updatedAt)
]);
var actionFeedback = pgTable("action_feedback", {
  id: text("id").primaryKey(),
  actionItemId: text("action_item_id").notNull().references(() => actionItems.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  feedbackType: text("feedback_type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  index("action_feedback_item_created_idx").on(t.actionItemId, t.createdAt),
  index("action_feedback_user_created_idx").on(t.userId, t.createdAt)
]);
var analysisWindowCache = pgTable("analysis_window_cache", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  preset: text("preset").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  compareMode: text("compare_mode").notNull(),
  compareStartDate: date("compare_start_date"),
  compareEndDate: date("compare_end_date"),
  requestedEndDate: date("requested_end_date").notNull(),
  sourceVersionHash: text("source_version_hash").notNull(),
  freshnessState: text("freshness_state").default("complete").notNull(),
  freshnessSummary: jsonb("freshness_summary"),
  resolvedPayload: jsonb("resolved_payload").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(
    t.propertyId,
    t.startDate,
    t.endDate,
    t.compareMode,
    t.compareStartDate,
    t.compareEndDate,
    t.sourceVersionHash
  ),
  index("analysis_window_cache_property_expiry_idx").on(t.propertyId, t.expiresAt, t.updatedAt),
  index("analysis_window_cache_team_property_idx").on(t.teamId, t.propertyId, t.updatedAt)
]);
var snapshotExports = pgTable("snapshot_exports", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  preset: text("preset").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  compareMode: text("compare_mode").notNull(),
  compareStartDate: date("compare_start_date"),
  compareEndDate: date("compare_end_date"),
  requestedEndDate: date("requested_end_date").notNull(),
  freshnessState: text("freshness_state").default("complete").notNull(),
  freshnessSummary: jsonb("freshness_summary"),
  brandingSnapshot: jsonb("branding_snapshot"),
  dashboardPayload: jsonb("dashboard_payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  index("snapshot_exports_property_created_idx").on(t.propertyId, t.createdAt),
  index("snapshot_exports_team_created_idx").on(t.teamId, t.createdAt)
]);
var propertyRefreshJobs = pgTable("property_refresh_jobs", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  triggeredByUserId: text("triggered_by_user_id").references(() => user.id, { onDelete: "set null" }),
  jobType: text("job_type").notNull(),
  // crawl_refresh | decision_refresh
  status: text("status").default("queued").notNull(),
  // queued | processing | complete | failed | partial
  phase: text("phase").default("queued").notNull(),
  message: text("message"),
  progressMeta: jsonb("progress_meta"),
  payload: jsonb("payload"),
  lastError: text("last_error"),
  availableAt: timestamp("available_at").defaultNow().notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(2).notNull(),
  claimedBy: text("claimed_by"),
  claimedAt: timestamp("claimed_at"),
  claimExpiresAt: timestamp("claim_expires_at"),
  heartbeatAt: timestamp("heartbeat_at"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  supersededAt: timestamp("superseded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  index("property_refresh_jobs_team_property_idx").on(t.teamId, t.propertyId, t.createdAt),
  index("property_refresh_jobs_status_available_idx").on(t.status, t.availableAt, t.createdAt),
  index("property_refresh_jobs_property_status_idx").on(t.propertyId, t.status, t.updatedAt)
]);
var propertyCrawlSnapshots = pgTable("property_crawl_snapshots", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  refreshJobId: text("refresh_job_id").references(() => propertyRefreshJobs.id, { onDelete: "set null" }),
  source: text("source").default("property_refresh").notNull(),
  // property_refresh | report_fallback
  crawlData: jsonb("crawl_data").notNull(),
  pageCount: integer("page_count").default(0).notNull(),
  fingerprint: text("fingerprint"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  index("property_crawl_snapshots_property_created_idx").on(t.propertyId, t.createdAt),
  index("property_crawl_snapshots_refresh_idx").on(t.refreshJobId)
]);
var propertyWeeklyReviews = pgTable("property_weekly_reviews", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.teamId, t.propertyId),
  index("property_weekly_reviews_team_enabled_idx").on(t.teamId, t.enabled)
]);
var weeklyReviewRuns = pgTable("weekly_review_runs", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  reportId: text("report_id").references(() => reports.id, { onDelete: "set null" }),
  runKey: text("run_key").notNull(),
  status: text("status").default("queued").notNull(),
  // queued | processing | complete | skipped | failed
  skipReason: text("skip_reason"),
  dateRangeStart: date("date_range_start").notNull(),
  dateRangeEnd: date("date_range_end").notNull(),
  compareRangeStart: date("compare_range_start").notNull(),
  compareRangeEnd: date("compare_range_end").notNull(),
  actionableCount: integer("actionable_count").default(0).notNull(),
  notificationSeenAt: timestamp("notification_seen_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.teamId, t.propertyId, t.runKey),
  index("weekly_review_runs_team_created_idx").on(t.teamId, t.createdAt),
  index("weekly_review_runs_report_idx").on(t.reportId),
  index("weekly_review_runs_status_created_idx").on(t.status, t.createdAt)
]);
var crawls = pgTable("crawls", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(),
  // pending, running, complete, failed
  pagesCrawled: integer("pages_crawled").default(0).notNull(),
  data: jsonb("data"),
  // Array of structural issues (missing H1, bad titles)
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  // Notification preferences
  weeklyDigest: boolean("weekly_digest").default(false).notNull(),
  reportComplete: boolean("report_complete").default(true).notNull(),
  syncFailure: boolean("sync_failure").default(true).notNull(),
  // Billing preferences
  emailReceipts: boolean("email_receipts").default(true).notNull(),
  // Report generation language (auto = infer from Google locale)
  reportLanguage: text("report_language").default("auto").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var feedbackSubmissions = pgTable("feedback_submissions", {
  id: text("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  userNameSnapshot: text("user_name_snapshot").notNull(),
  emailSnapshot: text("email_snapshot").notNull(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  message: text("message").notNull(),
  status: text("status").default("open").notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedByUserId: text("resolved_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  index("feedback_submissions_status_created_idx").on(t.status, t.createdAt),
  index("feedback_submissions_team_created_idx").on(t.teamId, t.createdAt),
  index("feedback_submissions_user_created_idx").on(t.userId, t.createdAt)
]);
var systemLogs = pgTable("system_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  // 'property_sync' | 'metrics_sync' | 'report_process'
  triggeredBy: text("triggered_by").notNull().references(() => user.id),
  targetUserId: text("target_user_id").references(() => user.id),
  status: text("status").notNull(),
  // 'started' | 'success' | 'failed'
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var productEvents = pgTable("product_events", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  source: text("source").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  properties: jsonb("properties"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  index("product_events_team_created_idx").on(t.teamId, t.createdAt),
  index("product_events_name_created_idx").on(t.name, t.createdAt),
  index("product_events_user_created_idx").on(t.userId, t.createdAt)
]);
var adminEmails = pgTable("admin_emails", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var metricsBackfillJobs = pgTable("metrics_backfill_jobs", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  triggeredByUserId: text("triggered_by_user_id").notNull().references(() => user.id),
  targetPropertyId: text("target_property_id").references(() => properties.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").references(() => user.id),
  includeGsc: boolean("include_gsc").default(true).notNull(),
  includeGa4: boolean("include_ga4").default(true).notNull(),
  timeframeMode: text("timeframe_mode").default("custom").notNull(),
  // preset | custom
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end").notNull(),
  refreshRecentDays: integer("refresh_recent_days").default(7).notNull(),
  reason: text("reason").notNull(),
  // admin_sync | report_preflight | manual_backfill
  status: text("status").default("queued").notNull(),
  // queued | processing | complete | failed | partial
  totals: jsonb("totals"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at")
}, (t) => [
  index("metrics_backfill_jobs_team_status_idx").on(t.teamId, t.status, t.createdAt),
  index("metrics_backfill_jobs_property_created_idx").on(t.targetPropertyId, t.createdAt)
]);
var gscDailyRaw = pgTable("gsc_daily_raw", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.propertyId, t.sourceDate),
  index("gsc_daily_raw_team_date_idx").on(t.teamId, t.sourceDate),
  index("gsc_daily_raw_property_fetched_idx").on(t.propertyId, t.fetchedAt)
]);
var ga4DailyRaw = pgTable("ga4_daily_raw", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  gscPropertyId: text("gsc_property_id").references(() => properties.id, { onDelete: "set null" }),
  ga4PropertyId: text("ga4_property_id").notNull(),
  sourceDate: date("source_date").notNull(),
  runReportPayload: jsonb("run_report_payload").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  syncJobId: text("sync_job_id").references(() => metricsBackfillJobs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.ga4PropertyId, t.sourceDate),
  index("ga4_daily_raw_gsc_date_idx").on(t.gscPropertyId, t.sourceDate),
  index("ga4_daily_raw_team_date_idx").on(t.teamId, t.sourceDate)
]);
var gscDailyFacts = pgTable("gsc_daily_facts", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.propertyId, t.sourceDate),
  index("gsc_daily_facts_team_date_idx").on(t.teamId, t.sourceDate)
]);
var ga4DailyFacts = pgTable("ga4_daily_facts", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.ga4PropertyId, t.sourceDate),
  index("ga4_daily_facts_gsc_date_idx").on(t.gscPropertyId, t.sourceDate),
  index("ga4_daily_facts_team_date_idx").on(t.teamId, t.sourceDate)
]);
var propertyDailyAiSummaries = pgTable("property_daily_ai_summaries", {
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
  status: text("status").default("queued").notNull(),
  // queued | processing | complete | failed
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.propertyId, t.sourceDate),
  index("property_daily_ai_summaries_team_property_date_idx").on(t.teamId, t.propertyId, t.sourceDate)
]);
var featureFlags = pgTable("feature_flags", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  description: text("description"),
  enabledGlobally: boolean("enabled_globally").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var userFeatureFlags = pgTable("user_feature_flags", {
  id: text("id").primaryKey(),
  flagId: text("flag_id").notNull().references(() => featureFlags.id),
  userId: text("user_id").notNull().references(() => user.id),
  enabled: boolean("enabled").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [unique().on(t.flagId, t.userId)]);
var planSettings = pgTable("plan_settings", {
  id: text("id").primaryKey(),
  tier: text("tier").unique().notNull(),
  // 'free' | 'pro' | 'agency'
  displayName: text("display_name").notNull(),
  reportsPerMonth: integer("reports_per_month"),
  // null = unlimited
  maxProperties: integer("max_properties"),
  // null = unlimited
  detailsPerMonth: integer("details_per_month"),
  // null = unlimited
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var teamUsage = pgTable("team_usage", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  yearMonth: text("year_month").notNull(),
  // e.g. "2026-03"
  detailsCount: integer("details_count").default(0).notNull()
}, (t) => [unique().on(t.teamId, t.yearMonth)]);
var aiReportPromptVersions = pgTable("ai_report_prompt_versions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  template: text("template").notNull(),
  examples: text("examples"),
  schemaVersion: text("schema_version").default("v1").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var aiReportSettings = pgTable("ai_report_settings", {
  id: text("id").primaryKey(),
  model: text("model").notNull(),
  outputStrategy: text("output_strategy").default("json_schema").notNull(),
  temperature: numeric("temperature", { precision: 4, scale: 2 }).default("0.2").notNull(),
  maxOutputTokens: integer("max_output_tokens").default(6e3).notNull(),
  inputTokenBudget: integer("input_token_budget").default(9e4).notNull(),
  language: text("language").default("de").notNull(),
  serviceTier: text("service_tier").default("default").notNull(),
  useBackgroundMode: boolean("use_background_mode").default(true).notNull(),
  usePromptCaching: boolean("use_prompt_caching").default(true).notNull(),
  useStrictSchema: boolean("use_strict_schema").default(true).notNull(),
  schemaVersion: text("schema_version").default("v1").notNull(),
  promptVersionId: text("prompt_version_id").references(() => aiReportPromptVersions.id, { onDelete: "set null" }),
  updatedByUserId: text("updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var reportJobs = pgTable("report_jobs", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  // generate_report | render_xlsx
  status: text("status").default("queued").notNull(),
  // queued | processing | complete | failed
  phase: text("phase").default("queued").notNull(),
  priority: integer("priority").default(100).notNull(),
  availableAt: timestamp("available_at").defaultNow().notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(2).notNull(),
  claimedBy: text("claimed_by"),
  claimedAt: timestamp("claimed_at"),
  claimExpiresAt: timestamp("claim_expires_at"),
  heartbeatAt: timestamp("heartbeat_at"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  lastError: text("last_error"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  index("report_jobs_status_available_idx").on(t.status, t.availableAt, t.priority, t.createdAt),
  index("report_jobs_team_status_claim_idx").on(t.teamId, t.status, t.claimExpiresAt),
  index("report_jobs_report_kind_status_idx").on(t.reportId, t.kind, t.status)
]);
var reportJobEvents = pgTable("report_job_events", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => reportJobs.id, { onDelete: "cascade" }),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  phase: text("phase").notNull(),
  level: text("level").default("info").notNull(),
  // info | warn | error
  message: text("message").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  index("report_job_events_job_created_idx").on(t.jobId, t.createdAt),
  index("report_job_events_report_created_idx").on(t.reportId, t.createdAt),
  index("report_job_events_team_created_idx").on(t.teamId, t.createdAt)
]);
var reportDetailAiExpansions = pgTable("report_detail_ai_expansions", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  requestedByUserId: text("requested_by_user_id").references(() => user.id, { onDelete: "set null" }),
  requestNumber: integer("request_number").notNull(),
  kind: text("kind").notNull(),
  rowId: text("row_id").notNull(),
  model: text("model"),
  usage: jsonb("usage"),
  estimatedCostUsd: numeric("estimated_cost_usd", { precision: 12, scale: 6 }),
  xRequestId: text("x_request_id"),
  xClientRequestId: text("x_client_request_id"),
  status: text("status").notNull(),
  // success | failed
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.reportId, t.requestNumber),
  index("report_detail_ai_expansions_report_created_idx").on(t.reportId, t.createdAt),
  index("report_detail_ai_expansions_team_created_idx").on(t.teamId, t.createdAt),
  index("report_detail_ai_expansions_user_created_idx").on(t.requestedByUserId, t.createdAt)
]);
var crawlPageSnapshots = pgTable("crawl_page_snapshots", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  index("crawl_page_snapshots_property_url_created_idx").on(t.propertyId, t.canonicalUrl, t.createdAt),
  index("crawl_page_snapshots_property_fingerprint_idx").on(t.propertyId, t.seoFingerprintHash),
  index("crawl_page_snapshots_report_idx").on(t.reportId, t.createdAt)
]);
var propertyPageRegistry = pgTable("property_page_registry", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.propertyId, t.canonicalUrl),
  index("property_page_registry_property_active_idx").on(t.propertyId, t.isActive, t.lastSeenAt)
]);
var openaiDailyCosts = pgTable("openai_daily_costs", {
  id: text("id").primaryKey(),
  sourceDate: date("source_date").notNull(),
  projectId: text("project_id"),
  lineItem: text("line_item"),
  amountUsd: numeric("amount_usd", { precision: 14, scale: 6 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  rawBucket: jsonb("raw_bucket").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull()
}, (t) => [
  unique().on(t.sourceDate, t.projectId, t.lineItem),
  index("openai_daily_costs_source_date_idx").on(t.sourceDate),
  index("openai_daily_costs_project_date_idx").on(t.projectId, t.sourceDate)
]);

export {
  user,
  session,
  account,
  verification,
  teams,
  teamBrandingProfiles,
  teamMembers,
  properties,
  reports,
  reportRecommendationStates,
  reportRecommendationFeedback,
  actionItems,
  actionFeedback,
  analysisWindowCache,
  snapshotExports,
  propertyRefreshJobs,
  propertyCrawlSnapshots,
  propertyWeeklyReviews,
  weeklyReviewRuns,
  crawls,
  userSettings,
  feedbackSubmissions,
  systemLogs,
  productEvents,
  adminEmails,
  metricsBackfillJobs,
  gscDailyRaw,
  ga4DailyRaw,
  gscDailyFacts,
  ga4DailyFacts,
  propertyDailyAiSummaries,
  featureFlags,
  userFeatureFlags,
  planSettings,
  teamUsage,
  aiReportPromptVersions,
  aiReportSettings,
  reportJobs,
  reportJobEvents,
  reportDetailAiExpansions,
  crawlPageSnapshots,
  propertyPageRegistry,
  openaiDailyCosts,
  schema_exports
};
