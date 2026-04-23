"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import type {
  RecommendationFeedbackType,
  RecommendationState,
  WeeklyActionRow,
} from "@webhealth/shared/lib/reports/types";
import { cn } from "@webhealth/shared/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { requestJson } from "@/lib/client/api";
import {
  formatRecommendationClassLabel,
  formatRecommendationConfidence,
  formatRecommendationEffort,
  formatRecommendationFeedback,
  formatRecommendationOwner,
  formatRecommendationState,
  formatValueAtStake,
  toggleExpandedAction,
} from "./action-surface.logic";

type ActionBacklogProps = {
  reportId: string;
  rows?: WeeklyActionRow[] | null;
  stateByRecommendationId?: Record<string, RecommendationState>;
  feedbackByRecommendationId?: Record<string, RecommendationFeedbackType>;
};

const STATE_OPTIONS: RecommendationState[] = [
  "open",
  "in_progress",
  "done",
  "ignored",
  "snoozed",
];

const FEEDBACK_OPTIONS: RecommendationFeedbackType[] = [
  "helpful",
  "not_helpful",
  "too_generic",
  "not_applicable",
  "already_done",
];

function QuietChip({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="border-report-separator bg-report-chip text-report-chip-foreground shadow-none"
    >
      {children}
    </Badge>
  );
}

function DetailList({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <ul className="space-y-2 text-sm leading-6 text-foreground/88">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h4>
      <DetailList items={items} />
    </section>
  );
}

export function ActionBacklog({
  reportId,
  rows,
  stateByRecommendationId,
  feedbackByRecommendationId,
}: ActionBacklogProps) {
  const data = rows ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, RecommendationState>>(stateByRecommendationId ?? {});
  const [feedback, setFeedback] = useState<Record<string, RecommendationFeedbackType>>(feedbackByRecommendationId ?? {});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});

  if (!data.length) return null;

  async function updateState(recommendationId: string, nextState: RecommendationState) {
    setSavingById((current) => ({ ...current, [recommendationId]: true }));
    try {
      await requestJson(`/api/reports/${reportId}/recommendations/${encodeURIComponent(recommendationId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
      setStates((current) => ({ ...current, [recommendationId]: nextState }));
    } finally {
      setSavingById((current) => ({ ...current, [recommendationId]: false }));
    }
  }

  async function updateFeedback(recommendationId: string, nextFeedback: RecommendationFeedbackType) {
    setSavingById((current) => ({ ...current, [recommendationId]: true }));
    try {
      await requestJson(`/api/reports/${reportId}/recommendations/${encodeURIComponent(recommendationId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackType: nextFeedback }),
      });
      setFeedback((current) => ({ ...current, [recommendationId]: nextFeedback }));
    } finally {
      setSavingById((current) => ({ ...current, [recommendationId]: false }));
    }
  }

  return (
    <section className="space-y-4" data-report-primary>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold font-display tracking-tight">What To Do This Week</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Scan the ranked actions first. Open one when you need the evidence, the likely cause, and the exact next move.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-report-separator bg-report-panel shadow-sm">
        {data.map((row, index) => {
          const currentState = states[row.id] ?? "open";
          const currentFeedback = feedback[row.id];
          const isSaving = savingById[row.id] === true;
          const isExpanded = expandedId === row.id;

          return (
            <article
              key={row.id}
              className={cn(index > 0 && "border-t border-report-separator")}
              data-action-row
            >
              <div className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:px-5">
                <div className="min-w-0 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-report-subtle text-sm font-semibold text-foreground">
                      #{row.rank}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                          {row.title}
                        </h3>
                        {currentState !== "open" ? (
                          <QuietChip>{formatRecommendationState(currentState)}</QuietChip>
                        ) : null}
                      </div>
                      <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                        {row.whyNow}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <QuietChip>{formatRecommendationClassLabel(row.recommendationClass)}</QuietChip>
                    <QuietChip>{formatRecommendationOwner(row.owner)}</QuietChip>
                    <QuietChip>{formatRecommendationEffort(row.effort)}</QuietChip>
                    <QuietChip>{formatRecommendationConfidence(row.confidenceLabel)}</QuietChip>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Value at stake
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {formatValueAtStake(row)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        First visible win
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {row.firstVisibleWin}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <Button
                    size="sm"
                    variant={isExpanded ? "secondary" : "outline"}
                    onClick={() => setExpandedId((current) => toggleExpandedAction(current, row.id))}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? "Hide details" : "View details"}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={isSaving}
                        aria-label={`More actions for ${row.title}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Action state</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={currentState}
                        onValueChange={(value) => {
                          void updateState(row.id, value as RecommendationState);
                        }}
                      >
                        {STATE_OPTIONS.map((option) => (
                          <DropdownMenuRadioItem key={option} value={option}>
                            {formatRecommendationState(option)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Feedback</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={currentFeedback ?? ""}
                        onValueChange={(value) => {
                          if (!value) return;
                          void updateFeedback(row.id, value as RecommendationFeedbackType);
                        }}
                      >
                        {FEEDBACK_OPTIONS.map((option) => (
                          <DropdownMenuRadioItem key={option} value={option}>
                            {formatRecommendationFeedback(option)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {isExpanded ? (
                <div className="border-t border-report-separator bg-report-subtle px-4 py-4 lg:px-5">
                  <div className="space-y-5">
                    <DetailSection title="Observed" items={row.detail.observed} />
                    <DetailSection title="Likely cause" items={row.detail.likelyCauses} />
                    <DetailSection title="Recommended action" items={row.detail.recommendedActions} />
                    <DetailSection title="Why this helps" items={row.detail.whyThisHelps} />
                    <DetailSection title="Expected outcome" items={row.detail.expectedOutcome} />

                    <section className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Evidence
                      </h4>

                      {row.detail.evidence.deterministic.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {row.detail.evidence.deterministic.map((fact) => (
                            <div
                              key={`${fact.label}:${fact.value}`}
                              className="rounded-lg border border-report-separator bg-report-panel px-3 py-3"
                            >
                              <p className="text-xs text-muted-foreground">{fact.label}</p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{fact.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {row.detail.evidence.inferred.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            Supporting read
                          </p>
                          <DetailList items={row.detail.evidence.inferred} />
                        </div>
                      ) : null}

                      {row.detail.evidence.deterministic.length === 0 && row.detail.evidence.inferred.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No extra evidence was attached to this action.
                        </p>
                      ) : null}
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Success signal
                      </h4>
                      <p className="text-sm leading-6 text-foreground/88">{row.successSignal}</p>
                    </section>

                    <div className="flex flex-col gap-3 border-t border-report-separator pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-5">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status</p>
                          <p className="mt-1 font-medium text-foreground">{formatRecommendationState(currentState)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Feedback</p>
                          <p className="mt-1 font-medium text-foreground">
                            {currentFeedback ? formatRecommendationFeedback(currentFeedback) : "Not rated"}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Use the menu to update status or leave feedback without taking focus away from the action itself.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
