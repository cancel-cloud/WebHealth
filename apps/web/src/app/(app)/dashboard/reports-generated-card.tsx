"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "seenCompleteReportIds";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function markAllSeen(ids: string[]) {
  try {
    const seen = getSeenIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {}
}

type Report = { id: string; status: string };

export function ReportsGeneratedCard({ reportCount }: { reportCount: number }) {
  const [hasNew, setHasNew] = useState(false);
  const initializedRef = useRef(false);
  const autoMarkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCompleteIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const handleReportsUpdated = (e: Event) => {
      const reports: Report[] = (e as CustomEvent<{ reports: Report[] }>).detail?.reports ?? [];
      const completeIds = reports.filter((r) => r.status === "complete").map((r) => r.id);
      currentCompleteIdsRef.current = completeIds;

      if (!initializedRef.current) {
        // First event from ReportsTable — determine if any complete reports are unseen
        initializedRef.current = true;
        const seenIds = getSeenIds();
        const hasUnseen = completeIds.some((id) => !seenIds.has(id));
        setHasNew(hasUnseen);

        if (hasUnseen) {
          // Auto-dismiss after 8 seconds — user has "seen" the badge
          autoMarkTimerRef.current = setTimeout(() => {
            markAllSeen(currentCompleteIdsRef.current);
            setHasNew(false);
          }, 8000);
        } else {
          // No new reports — mark all as seen so future visits are clean
          markAllSeen(completeIds);
        }
      }
    };

    window.addEventListener("reports-updated", handleReportsUpdated);
    return () => {
      window.removeEventListener("reports-updated", handleReportsUpdated);
      if (autoMarkTimerRef.current) clearTimeout(autoMarkTimerRef.current);
    };
  }, []);

  const handleClick = () => {
    // User is navigating to /reports — mark all as seen immediately
    if (autoMarkTimerRef.current) clearTimeout(autoMarkTimerRef.current);
    markAllSeen(currentCompleteIdsRef.current);
    setHasNew(false);
  };

  return (
    <Link
      href="/reports"
      onClick={handleClick}
      className="group block p-6 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Go to Reports page"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <h3 className="font-medium text-muted-foreground mb-1">Reports Generated</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold font-display text-foreground">{reportCount}</span>
        {hasNew && (
          <span className="text-sm font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            New
          </span>
        )}
      </div>
    </Link>
  );
}
