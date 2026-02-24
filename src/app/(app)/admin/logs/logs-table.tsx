"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  status: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  triggeredByEmail: string | null;
  targetUserEmail: string | null;
}

const ACTION_OPTIONS = [
  "user_signin",
  "property_sync",
  "report_create",
  "report_process",
  "property_link_ga4",
  "user_deleted",
  "metrics_sync",
];
const STATUS_OPTIONS = ["started", "success", "failed"];

const statusVariant = (status: string) => {
  if (status === "success") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
};

export function LogsTable({ initialLogs }: { initialLogs: LogEntry[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (action && action !== "all") params.set("action", action);
      if (status && status !== "all") params.set("status", status);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (userEmail.trim()) params.set("userEmail", userEmail.trim());
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } finally {
      setLoading(false);
    }
  }, [action, status, from, to, userEmail]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-end">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-36"
        />
        <Input
          type="date"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-36"
        />

        <Input
          type="text"
          placeholder="Filter by user email…"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="w-52"
        />

        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Triggered By</TableHead>
            <TableHead>Target User</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No logs found
              </TableCell>
            </TableRow>
          )}
          {logs.map((log) => (
            <>
              <TableRow
                key={log.id}
                className="cursor-pointer"
                onClick={() => toggleExpand(log.id)}
              >
                <TableCell>
                  {log.details ? (
                    expanded.has(log.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">{log.triggeredByEmail ?? "—"}</TableCell>
                <TableCell className="text-sm">{log.targetUserEmail ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                </TableCell>
              </TableRow>
              {expanded.has(log.id) && log.details && (
                <TableRow key={`${log.id}-details`}>
                  <TableCell colSpan={6} className="bg-muted/30 px-4 py-2">
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
