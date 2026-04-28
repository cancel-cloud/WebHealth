"use client";

import { useCallback, useMemo, useState } from "react";
import { Search, RefreshCw, CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestJson } from "@/lib/client/api";

type FeedbackSubmission = {
  id: string;
  userName: string;
  email: string;
  type: string;
  source: string;
  message: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  planLabel: string | null;
};

type FeedbackPagination = {
  page: number;
  limit: number;
  hasNext: boolean;
};

function typeLabel(type: string) {
  return type === "bug_report" ? "Bug report" : "Feature request";
}

export function FeedbackInbox({
  initialSubmissions,
  initialPagination,
}: {
  initialSubmissions: FeedbackSubmission[];
  initialPagination: FeedbackPagination;
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [pagination, setPagination] = useState(initialPagination);
  const [status, setStatus] = useState<"open" | "resolved" | "all">("open");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const hasPrevious = pagination.page > 1;

  const fetchSubmissions = useCallback(async (nextPage: number, nextStatus: "open" | "resolved" | "all", nextSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(pagination.limit),
        status: nextStatus,
      });
      if (nextSearch.trim()) {
        params.set("q", nextSearch.trim());
      }

      try {
        const data = await requestJson<{ submissions?: FeedbackSubmission[]; pagination?: FeedbackPagination }>(
          `/api/admin/feedback?${params.toString()}`
        );
        setSubmissions(data?.submissions ?? []);
        setPagination(data?.pagination ?? { page: nextPage, limit: pagination.limit, hasNext: false });
      } catch {
        // Preserve the current list on fetch failures.
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  const handleSearch = useCallback(async () => {
    const nextSearch = searchDraft.trim();
    setSearch(nextSearch);
    await fetchSubmissions(1, status, nextSearch);
  }, [fetchSubmissions, searchDraft, status]);

  const handleStatusChange = useCallback(async (value: "open" | "resolved" | "all") => {
    setStatus(value);
    await fetchSubmissions(1, value, search);
  }, [fetchSubmissions, search]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSubmissions = useMemo(() => submissions, [submissions]);

  const updateSubmissionStatus = useCallback(async (id: string, nextStatus: "open" | "resolved") => {
    try {
      await requestJson(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      return;
    }

    setSubmissions((prev) => {
      const matchesFilter =
        status === "all" ||
        (status === "open" && nextStatus === "open") ||
        (status === "resolved" && nextStatus === "resolved");

      if (!matchesFilter) {
        return prev.filter((item) => item.id !== id);
      }

      return prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              resolvedAt: nextStatus === "resolved" ? new Date().toISOString() : null,
            }
          : item,
      );
    });
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[18rem] flex-1">
          <label className="mb-2 block text-sm font-medium">Search</label>
          <Input
            placeholder="Search message, user name, or email…"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSearch();
              }
            }}
          />
        </div>

        <div className="w-44">
          <label className="mb-2 block text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(value) => void handleStatusChange(value as "open" | "resolved" | "all")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => void handleSearch()} disabled={loading}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {visibleSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No feedback submissions match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleSubmissions.map((submission) => {
            const expanded = expandedIds.has(submission.id);
            const shouldClamp = submission.message.length > 240 && !expanded;

            return (
              <Card key={submission.id}>
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{typeLabel(submission.type)}</Badge>
                    <Badge variant="secondary">{submission.source === "sidebar" ? "Sidebar" : "Command Palette"}</Badge>
                    <Badge variant={submission.status === "resolved" ? "secondary" : "default"}>
                      {submission.status === "resolved" ? "Resolved" : "Open"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle>{submission.userName}</CardTitle>
                    <CardDescription>
                      {submission.email} · {new Date(submission.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className={shouldClamp ? "line-clamp-4 text-sm leading-6" : "text-sm leading-6"}>
                      {submission.message}
                    </p>
                    {submission.message.length > 240 ? (
                      <Button type="button" variant="ghost" size="sm" className="-ml-3" onClick={() => toggleExpanded(submission.id)}>
                        {expanded ? "Show less" : "Show more"}
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em]">Plan</p>
                      <p className="mt-1 text-foreground">{submission.planLabel ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="justify-between gap-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    {submission.status === "resolved" && submission.resolvedAt
                      ? `Resolved ${new Date(submission.resolvedAt).toLocaleString()}`
                      : "Awaiting review"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void updateSubmissionStatus(submission.id, submission.status === "resolved" ? "open" : "resolved")}
                  >
                    {submission.status === "resolved" ? (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Reopen
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Mark resolved
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {pagination.page}</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!hasPrevious || loading}
            onClick={() => void fetchSubmissions(pagination.page - 1, status, search)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!pagination.hasNext || loading}
            onClick={() => void fetchSubmissions(pagination.page + 1, status, search)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
