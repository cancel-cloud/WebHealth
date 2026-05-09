"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PosthogConfigStatus = {
  hasServerProjectToken: boolean;
  hasBrowserKey: boolean;
  hasProjectId: boolean;
  captureHost: string;
  uiHost: string;
  projectId: string | null;
};

type PosthogCheckResult = {
  ok: boolean;
  status: number | null;
  endpoint: string;
  eventName: string;
};

export function PosthogInstallCheck({
  initialConfig,
}: {
  initialConfig: PosthogConfigStatus;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [result, setResult] = useState<PosthogCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const runCheck = () => {
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const response = await fetch("/api/admin/posthog/install-check", {
          method: "POST",
        });
        const body = await response.json();
        if (body.config) setConfig(body.config);
        if (body.result) setResult(body.result);
        if (!response.ok) {
          setError("PostHog rejected the install check.");
        }
      } catch {
        setError("PostHog install check could not be sent.");
      }
    });
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display">PostHog Install Check</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Web proxy, browser key, project, and capture health for the PostHog EU setup.
          </p>
        </div>
        <Button type="button" size="sm" onClick={runCheck} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Run install check
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatusItem label="Web server token" ok={config.hasServerProjectToken} />
        <StatusItem label="Browser key" ok={config.hasBrowserKey} />
        <StatusItem label="Project ID" ok={config.hasProjectId} />
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Capture host</dt>
          <dd className="mt-1 font-medium text-foreground">{config.captureHost}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">UI host</dt>
          <dd className="mt-1 font-medium text-foreground">{config.uiHost}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Project ID</dt>
          <dd className="mt-1 font-medium text-foreground">{config.projectId ?? "Missing"}</dd>
        </div>
      </dl>

      {result ? (
        <div className="mt-5 rounded-lg border border-border bg-background p-4 text-sm">
          <div className="flex items-center gap-2 font-medium">
            {result.ok ? (
              <CheckCircle2 className="text-emerald-600" />
            ) : (
              <XCircle className="text-destructive" />
            )}
            <span>{result.eventName}</span>
          </div>
          <p className="mt-2 text-muted-foreground">
            Endpoint {result.endpoint} returned {result.status ?? "no HTTP status"}.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm font-medium text-destructive">{error}</p>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        Worker capture is configured separately with POSTHOG_PROJECT_TOKEN and POSTHOG_CAPTURE_HOST in the worker environment.
      </p>
    </section>
  );
}

function StatusItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
      {ok ? (
        <CheckCircle2 className="text-emerald-600" />
      ) : (
        <XCircle className="text-destructive" />
      )}
      <span className="font-medium">{label}</span>
    </div>
  );
}
