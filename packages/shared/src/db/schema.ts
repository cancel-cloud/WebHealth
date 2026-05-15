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
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  onboardingCompletionReason: text("onboarding_completion_reason"),
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
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionCancelAt: timestamp("subscription_cancel_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamBrandingProfiles = pgTable("team_branding_profiles", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.teamId),
  index("team_branding_profiles_team_updated_idx").on(t.teamId, t.updatedAt),
]);

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
  ga4LinkConfidence: text("ga4_link_confidence"),
  ga4LinkSource: text("ga4_link_source"),
  ga4LinkUpdatedAt: timestamp("ga4_link_updated_at"),
  gscDataStartDate: date("gsc_data_start_date"),
  syncStatus: text("sync_status").default("pending").notNull(), // pending, syncing, complete, failed
  lastSyncedAt: timestamp("last_synced_at"),
  active: boolean("active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actionItems = pgTable("action_items", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  actionFamily: text("action_family").notNull(),
  causeFamily: text("cause_family").notNull(),
  remedyKey: text("remedy_key").notNull(),
  targetType: text("target_type").notNull(),
  targetKey: text("target_key").notNull(),
  title: text("title").notNull(),
  owner: text("owner"),
  assigneeUserId: text("assignee_user_id").references(() => user.id, { onDelete: "set null" }),
  assigneeEmail: text("assignee_email"),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.propertyId, t.fingerprint),
  index("action_items_property_state_idx").on(t.propertyId, t.state, t.updatedAt),
  index("action_items_team_property_updated_idx").on(t.teamId, t.propertyId, t.updatedAt),
  index("action_items_team_rank_idx").on(t.teamId, t.systemRank, t.updatedAt),
]);

export const propertyShareLinks = pgTable("property_share_links", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
  windowPreset: text("window_preset").notNull(),
  compareMode: text("compare_mode").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  brandSnapshot: jsonb("brand_snapshot").notNull(),
  payloadSnapshot: jsonb("payload_snapshot").notNull(),
  language: text("language").default("de").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("property_share_links_token_idx").on(t.token),
  index("property_share_links_property_created_idx").on(t.propertyId, t.createdAt),
  index("property_share_links_team_created_idx").on(t.teamId, t.createdAt),
]);

export const actionFeedback = pgTable("action_feedback", {
  id: text("id").primaryKey(),
  actionItemId: text("action_item_id")
    .notNull()
    .references(() => actionItems.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  feedbackType: text("feedback_type").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("action_feedback_item_created_idx").on(t.actionItemId, t.createdAt),
  index("action_feedback_user_created_idx").on(t.userId, t.createdAt),
]);

export const analysisWindowCache = pgTable("analysis_window_cache", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(
    t.propertyId,
    t.startDate,
    t.endDate,
    t.compareMode,
    t.compareStartDate,
    t.compareEndDate,
    t.sourceVersionHash,
  ),
  index("analysis_window_cache_property_expiry_idx").on(t.propertyId, t.expiresAt, t.updatedAt),
  index("analysis_window_cache_team_property_idx").on(t.teamId, t.propertyId, t.updatedAt),
]);

export const snapshotExports = pgTable("snapshot_exports", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
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
  language: text("language").default("de").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("snapshot_exports_property_created_idx").on(t.propertyId, t.createdAt),
  index("snapshot_exports_team_created_idx").on(t.teamId, t.createdAt),
]);

export const propertyRefreshJobs = pgTable("property_refresh_jobs", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  triggeredByUserId: text("triggered_by_user_id").references(() => user.id, { onDelete: "set null" }),
  jobType: text("job_type").notNull(), // crawl_refresh | decision_refresh
  status: text("status").default("queued").notNull(), // queued | processing | complete | failed | partial
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("property_refresh_jobs_team_property_idx").on(t.teamId, t.propertyId, t.createdAt),
  index("property_refresh_jobs_status_available_idx").on(t.status, t.availableAt, t.createdAt),
  index("property_refresh_jobs_property_status_idx").on(t.propertyId, t.status, t.updatedAt),
]);

export const propertyCrawlSnapshots = pgTable("property_crawl_snapshots", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  refreshJobId: text("refresh_job_id").references(() => propertyRefreshJobs.id, { onDelete: "set null" }),
  source: text("source").default("property_refresh").notNull(), // property_refresh | report_fallback
  crawlData: jsonb("crawl_data").notNull(),
  pageCount: integer("page_count").default(0).notNull(),
  fingerprint: text("fingerprint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("property_crawl_snapshots_property_created_idx").on(t.propertyId, t.createdAt),
  index("property_crawl_snapshots_refresh_idx").on(t.refreshJobId),
]);

export const propertySetupDismissals = pgTable("property_setup_dismissals", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  dismissedAt: timestamp("dismissed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.userId, t.propertyId),
  index("property_setup_dismissals_team_property_idx").on(t.teamId, t.propertyId),
]);

export const userSettings = pgTable("user_settings", {
  id:             text("id").primaryKey(),
  userId:         text("user_id").notNull().unique()
                    .references(() => user.id, { onDelete: "cascade" }),
  // Notification preferences
  weeklyDigest:   boolean("weekly_digest").default(false).notNull(),
  syncFailure:    boolean("sync_failure").default(true).notNull(),
  // Billing preferences
  emailReceipts:  boolean("email_receipts").default(true).notNull(),
  // Language preference
  preferredLanguage: text("preferred_language"),
  preferredLanguageSource: text("preferred_language_source"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const feedbackSubmissions = pgTable("feedback_submissions", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("feedback_submissions_status_created_idx").on(t.status, t.createdAt),
  index("feedback_submissions_team_created_idx").on(t.teamId, t.createdAt),
  index("feedback_submissions_user_created_idx").on(t.userId, t.createdAt),
]);

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

export const productEvents = pgTable("product_events", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  source: text("source").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  properties: jsonb("properties"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("product_events_team_created_idx").on(t.teamId, t.createdAt),
  index("product_events_name_created_idx").on(t.name, t.createdAt),
  index("product_events_user_created_idx").on(t.userId, t.createdAt),
]);

export const adminEmails = pgTable("admin_emails", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
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
  triggerSource: text("trigger_source").default("manual").notNull(),
  totals: jsonb("totals"),
  error: text("error"),
  availableAt: timestamp("available_at").defaultNow().notNull(),
  attempts: integer("attempts").default(0).notNull(),
  maxAttempts: integer("max_attempts").default(2).notNull(),
  claimedBy: text("claimed_by"),
  claimedAt: timestamp("claimed_at"),
  claimExpiresAt: timestamp("claim_expires_at"),
  heartbeatAt: timestamp("heartbeat_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
}, (t) => [
  index("metrics_backfill_jobs_team_status_idx").on(t.teamId, t.status, t.createdAt),
  index("metrics_backfill_jobs_property_created_idx").on(t.targetPropertyId, t.createdAt),
  index("metrics_backfill_jobs_status_available_idx").on(t.status, t.availableAt, t.createdAt),
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
  queryPagePairsPayload: jsonb("query_page_pairs_payload"),
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

export const ga4ReportArtifacts = pgTable("ga4_report_artifacts", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  gscPropertyId: text("gsc_property_id").references(() => properties.id, { onDelete: "set null" }),
  ga4PropertyId: text("ga4_property_id").notNull(),
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end").notNull(),
  reportPayload: jsonb("report_payload").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  syncJobId: text("sync_job_id").references(() => metricsBackfillJobs.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.ga4PropertyId, t.dateStart, t.dateEnd),
  index("ga4_report_artifacts_gsc_range_idx").on(t.gscPropertyId, t.dateStart, t.dateEnd),
  index("ga4_report_artifacts_team_fetched_idx").on(t.teamId, t.fetchedAt),
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

export const aiPromptTemplates = pgTable("ai_prompt_templates", {
  id: text("id").primaryKey(),
  purpose: text("purpose").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdByUserId: text("created_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.purpose, t.version),
  index("ai_prompt_templates_purpose_active_idx").on(t.purpose, t.isActive),
]);

export const aiRuntimeSettings = pgTable("ai_runtime_settings", {
  id: text("id").primaryKey(),
  summaryModel: text("summary_model").default("gpt-5-mini").notNull(),
  analyzerModel: text("analyzer_model").default("gpt-5-mini").notNull(),
  maxOutputTokens: integer("max_output_tokens").default(128000).notNull(),
  updatedByUserId: text("updated_by_user_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiAnalysisRuns = pgTable("ai_analysis_runs", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  refreshJobId: text("refresh_job_id").references(() => propertyRefreshJobs.id, { onDelete: "set null" }),
  preset: text("preset").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  compareMode: text("compare_mode").notNull(),
  compareStartDate: date("compare_start_date"),
  compareEndDate: date("compare_end_date"),
  sourceVersionHash: text("source_version_hash").notNull(),
  status: text("status").default("queued").notNull(),
  phase: text("phase").default("queued").notNull(),
  summaryModel: text("summary_model"),
  analyzerModel: text("analyzer_model"),
  promptVersions: jsonb("prompt_versions").notNull(),
  sourceSummaryInput: jsonb("source_summary_input"),
  sourceSummaries: jsonb("source_summaries"),
  analyzerOutput: jsonb("analyzer_output"),
  usageSnapshot: jsonb("usage_snapshot"),
  costEstimateUsd: numeric("cost_estimate_usd", { precision: 14, scale: 6 }),
  error: text("error"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(
    t.propertyId,
    t.startDate,
    t.endDate,
    t.compareMode,
    t.compareStartDate,
    t.compareEndDate,
    t.sourceVersionHash,
  ),
  index("ai_analysis_runs_property_status_idx").on(t.propertyId, t.status, t.updatedAt),
  index("ai_analysis_runs_team_created_idx").on(t.teamId, t.createdAt),
]);

export const aiRecommendations = pgTable("ai_recommendations", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  aiRunId: text("ai_run_id").notNull().references(() => aiAnalysisRuns.id, { onDelete: "cascade" }),
  actionItemId: text("action_item_id").references(() => actionItems.id, { onDelete: "set null" }),
  fingerprint: text("fingerprint").notNull(),
  source: text("source").default("ai").notNull(),
  title: text("title").notNull(),
  area: text("area").notNull(),
  targetType: text("target_type").notNull(),
  targetKey: text("target_key").notNull(),
  confidence: text("confidence").notNull(),
  summary: text("summary").notNull(),
  clientSafeSummary: text("client_safe_summary").notNull(),
  evidenceAnchors: jsonb("evidence_anchors").notNull(),
  rawRecommendation: jsonb("raw_recommendation").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.aiRunId, t.fingerprint),
  index("ai_recommendations_property_created_idx").on(t.propertyId, t.createdAt),
  index("ai_recommendations_team_created_idx").on(t.teamId, t.createdAt),
  index("ai_recommendations_action_item_idx").on(t.actionItemId),
]);

export const openaiCostLedger = pgTable("openai_cost_ledger", {
  id: text("id").primaryKey(),
  aiRunId: text("ai_run_id").notNull().references(() => aiAnalysisRuns.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  refreshJobId: text("refresh_job_id").references(() => propertyRefreshJobs.id, { onDelete: "set null" }),
  callPurpose: text("call_purpose").notNull(),
  model: text("model").notNull(),
  requestId: text("request_id"),
  outcome: text("outcome").default("succeeded").notNull(),
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  cachedInputTokens: integer("cached_input_tokens").default(0).notNull(),
  reasoningTokens: integer("reasoning_tokens").default(0).notNull(),
  usageSnapshot: jsonb("usage_snapshot").notNull(),
  costEstimateUsd: numeric("cost_estimate_usd", { precision: 14, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("openai_cost_ledger_run_outcome_idx").on(t.aiRunId, t.outcome, t.createdAt),
  index("openai_cost_ledger_team_created_idx").on(t.teamId, t.createdAt),
  index("openai_cost_ledger_property_created_idx").on(t.propertyId, t.createdAt),
  index("openai_cost_ledger_request_idx").on(t.requestId),
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
  tier: text("tier").unique().notNull(), // 'free' | 'starter' | 'studio' | 'agency'
  displayName: text("display_name").notNull(),
  maxProperties: integer("max_properties"), // null = unlimited
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propertyPageRegistry = pgTable("property_page_registry", {
  id: text("id").primaryKey(),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  canonicalUrl: text("canonical_url").notNull(),
  currentFingerprintHash: text("current_fingerprint_hash").notNull(),
  currentSnapshotId: text("current_snapshot_id").references(() => propertyCrawlSnapshots.id, { onDelete: "set null" }),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  lastChangedAt: timestamp("last_changed_at"),
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
