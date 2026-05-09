"use client";

import { useReducer } from "react";
import {
  ArrowLeft,
  LayoutGrid,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  AGENCY_HOME_COPY,
  AGENCY_WORKSPACE_CLIENTS,
} from "./agency-homepage.content";
import {
  getDefaultWorkspaceSelection,
  getLocalizedValue,
  getNextWorkspaceSelection,
  type AgencyLandingLanguage,
  type WorkspaceAction,
  type WorkspaceSelection,
} from "./agency-homepage.logic";

function workspaceReducer(
  state: WorkspaceSelection,
  action: WorkspaceAction,
): WorkspaceSelection {
  return getNextWorkspaceSelection(
    state,
    action,
    AGENCY_WORKSPACE_CLIENTS.length,
  );
}

function TrendValue({
  value,
  trend,
}: {
  value: string;
  trend: "up" | "down";
}) {
  const isUp = trend === "up";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        isUp ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {isUp ? (
        <TrendingUp className="size-3.5" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3.5" aria-hidden="true" />
      )}
      {value}
    </span>
  );
}

export function AgencyWorkspaceDemo({
  language,
  className = "mt-12",
}: {
  language: AgencyLandingLanguage;
  className?: string;
}) {
  const [workspaceSelection, dispatchWorkspace] = useReducer(
    workspaceReducer,
    undefined,
    getDefaultWorkspaceSelection,
  );

  return (
    <div
      data-agency-workspace-demo
      className={`${className} overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_24px_60px_-32px_rgba(15,23,42,0.26)]`}
    >
      <div className="flex flex-col items-start justify-between gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex gap-2">
            <span className="size-3 rounded-full bg-rose-300" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-300" />
          </div>
          <span className="min-w-0 max-w-[14rem] truncate rounded-full border border-border bg-muted/55 px-3 py-1 text-xs font-medium text-muted-foreground sm:max-w-none">
            app.webhealth.dev/agency/devbrew
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground sm:shrink-0">
          {getLocalizedValue(AGENCY_HOME_COPY.workspace.teamLabel, language)}
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-muted/30 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {getLocalizedValue(AGENCY_HOME_COPY.workspace.clientsLabel, language)}
          </p>

          <button
            type="button"
            onClick={() => dispatchWorkspace({ type: "show_portfolio" })}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              workspaceSelection.view === "portfolio"
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            {getLocalizedValue(AGENCY_HOME_COPY.workspace.portfolioLabel, language)}
          </button>

          <div className="space-y-2">
            {AGENCY_WORKSPACE_CLIENTS.map((client, index) => {
              const isActive =
                workspaceSelection.view === "client" &&
                workspaceSelection.index === index;

              return (
                <button
                  key={client.domain}
                  type="button"
                  onClick={() =>
                    dispatchWorkspace({
                      type: "show_client",
                      index,
                    })
                  }
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ background: client.badgeGradient }}
                  >
                    {client.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {client.name}
                    </span>
                    <span className="block text-xs">
                      {client.openFixes}{" "}
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.workspace.openFixesLabel,
                        language,
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
            + {getLocalizedValue(AGENCY_HOME_COPY.workspace.addClientLabel, language)}
          </div>
        </aside>

        <div className="p-5 sm:p-6">
          {workspaceSelection.view === "portfolio" ? (
            <>
              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.workspace.portfolioTitle,
                      language,
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.workspace.portfolioSubtitle,
                      language,
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.values(AGENCY_HOME_COPY.workspace.filters).map(
                    (filterLabel, index) => (
                      <span
                        key={filterLabel.en}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          index === 0
                            ? "border-primary/20 bg-primary/10 text-foreground"
                            : "border-border bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {getLocalizedValue(filterLabel, language)}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {AGENCY_WORKSPACE_CLIENTS.map((client, index) => (
                  <button
                    key={client.domain}
                    type="button"
                    onClick={() => dispatchWorkspace({ type: "show_client", index })}
                    className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-transform hover:-tranzinc-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ background: client.badgeGradient }}
                        >
                          {client.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {client.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {client.domain}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          client.status === "healthy"
                            ? "bg-emerald-50 text-emerald-700"
                            : client.status === "attention"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {getLocalizedValue(client.statusLabel, language)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-muted/55 p-3">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          Clicks
                        </p>
                        <p className="mt-1 font-display text-xl font-bold">
                          {client.clicks}
                        </p>
                        <TrendValue
                          value={client.clicksDelta}
                          trend={client.clicksTrend}
                        />
                      </div>
                      <div className="rounded-xl bg-muted/55 p-3">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          CTR
                        </p>
                        <p className="mt-1 font-display text-xl font-bold">
                          {client.ctr}
                        </p>
                        <TrendValue value={client.ctrDelta} trend={client.ctrTrend} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.workspace.openFixesLabel,
                          language,
                        )}
                        : <strong className="text-foreground">{client.openFixes}</strong>
                      </span>
                      <span className="font-semibold text-primary">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.workspace.openDetailsLabel,
                          language,
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            (() => {
              const client = AGENCY_WORKSPACE_CLIENTS[workspaceSelection.index];
              return (
                <>
                  <div className="flex flex-col gap-4 border-b border-border pb-5">
                    <button
                      type="button"
                      onClick={() => dispatchWorkspace({ type: "show_portfolio" })}
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      {getLocalizedValue(AGENCY_HOME_COPY.workspace.backLabel, language)}
                    </button>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span
                            className="flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                            style={{ background: client.badgeGradient }}
                          >
                            {client.initials}
                          </span>
                          <h3 className="font-display text-2xl font-semibold">
                            {client.name}
                          </h3>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {client.domain} ·{" "}
                          {getLocalizedValue(client.snapshotLabel, language)}
                        </p>
                      </div>
                      <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.workspace.snapshotPreviewLabel,
                          language,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 xl:grid-cols-4">
                    {[
                      {
                        label: "Clicks",
                        value: client.clicks,
                        delta: client.clicksDelta,
                        trend: client.clicksTrend,
                      },
                      {
                        label: "CTR",
                        value: client.ctr,
                        delta: client.ctrDelta,
                        trend: client.ctrTrend,
                      },
                      {
                        label: language === "en" ? "Impressions" : "Impressionen",
                        value: client.impressions,
                        delta: client.impressionsDelta,
                        trend: client.impressionsTrend,
                      },
                      {
                        label: language === "en" ? "Avg. position" : "Ø Position",
                        value: client.position,
                        delta: client.positionDelta,
                        trend: client.positionTrend,
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-border bg-muted/40 p-4"
                      >
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className="mt-2 font-display text-3xl font-bold">
                          {metric.value}
                        </p>
                        <div className="mt-2">
                          <TrendValue value={metric.delta} trend={metric.trend} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                      <h4 className="font-display text-xl font-semibold">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.workspace.prioritisedFixesLabel,
                          language,
                        )}
                      </h4>
                      <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
                        {client.openFixes}{" "}
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.workspace.openFixesLabel,
                          language,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {client.fixList.map((fix) => (
                        <div
                          key={`${fix.url}-${fix.priority}`}
                          className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[auto_1fr_auto] sm:items-start"
                        >
                          <span
                            className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-bold ${
                              fix.priority === 1
                                ? "bg-rose-100 text-rose-700"
                                : fix.priority === 2
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            P{fix.priority}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {getLocalizedValue(fix.title, language)}
                            </p>
                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              {fix.url}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-display text-lg font-bold text-primary">
                              {fix.impact}
                            </p>
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              {getLocalizedValue(
                                AGENCY_HOME_COPY.workspace.estimatedClicksLabel,
                                language,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
