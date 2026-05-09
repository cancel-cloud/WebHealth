import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TestErrorButton } from "./test-error-button";
import { getGlitchTipTestStatus } from "./glitchtip-test.logic";

export default function GlitchTipTestPage() {
  const status = getGlitchTipTestStatus({
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GlitchTip Test</h1>
        <p className="text-muted-foreground text-sm">
          Verify that browser-side error tracking is configured, then trigger a test error and confirm it appears in GlitchTip Issues.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Tracking Readiness</CardTitle>
            <Badge variant={status.configured ? "default" : "destructive"}>
              {status.configured ? "Configured" : "Missing DSN"}
            </Badge>
          </div>
          <CardDescription>
            This checks whether client-side Sentry or GlitchTip delivery is configured in this app. It does not perform a live upstream health check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-background/60 p-4">
              <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Public DSN</dt>
              <dd className="mt-2 break-all font-mono text-xs">
                {status.dsn ?? "Not configured"}
              </dd>
            </div>
            <div className="rounded-lg border bg-background/60 p-4">
              <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Environment</dt>
              <dd className="mt-2 font-medium">{status.environment ?? "Not set"}</dd>
            </div>
            <div className="rounded-lg border bg-background/60 p-4">
              <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Release</dt>
              <dd className="mt-2 break-all font-medium">{status.release ?? "Not set"}</dd>
            </div>
          </dl>
          <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
            <p className="font-medium">Verification steps</p>
            <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5">
              <li>Open GlitchTip Issues in a separate tab.</li>
              <li>Click the test button below.</li>
              <li>Expect the page interaction to interrupt with <span className="font-mono text-foreground">Generic Error Message</span>.</li>
              <li>Confirm the same error appears as a new issue in GlitchTip.</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 border-t">
          <TestErrorButton disabled={!status.configured} />
          <p className="text-muted-foreground text-xs">
            {status.configured
              ? "Use this only when you want to verify end-to-end client delivery."
              : "Set NEXT_PUBLIC_SENTRY_DSN before using this test page so the browser can send the error event."}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
