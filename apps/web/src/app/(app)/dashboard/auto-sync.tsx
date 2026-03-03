"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AutoSync({ hasProperties }: { hasProperties: boolean }) {
  const router = useRouter();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasProperties && !hasFired.current) {
      hasFired.current = true;
      const run = async () => {
        toast("Fetching your Google properties…", { id: "auto-sync" });
        try {
          const res = await fetch("/api/properties/sync", { method: "POST" });
          const data = await res.json();
          if (res.ok) {
            const total = (data.gscCount ?? 0) + (data.ga4Count ?? 0);
            toast.success(`Auto synced ${total} properties (${data.gscCount ?? 0} GSC, ${data.ga4Count ?? 0} GA4).`, { id: "auto-sync" });
            router.refresh();
          } else {
            toast.error(`Auto-sync failed: ${data.error}`, { id: "auto-sync" });
          }
        } catch (err) {
          toast.error(`Auto-sync error: ${err instanceof Error ? err.message : "Unknown error"}`, { id: "auto-sync" });
        }
      };
      run();
    }
  }, [hasProperties, router]);

  return null;
}
