import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TestErrorButton } from "./test-error-button";
import { getGlitchTipTestStatus } from "./glitchtip-test.logic";
import { ADMIN_PAGE_COPY, getAdminLanguage } from "../admin-page-copy";

export default async function GlitchTipTestPage() {
  const copy = ADMIN_PAGE_COPY[await getAdminLanguage()].glitchtip;
  const status = getGlitchTipTestStatus({
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    SENTRY_RELEASE: process.env.SENTRY_RELEASE,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          {copy.description}
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>{copy.readiness}</CardTitle>
            <Badge variant={status.configured ? "default" : "destructive"}>
              {status.configured ? copy.configured : copy.missingDsn}
            </Badge>
          </div>
          <CardDescription>
            {copy.readinessDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-background/60 p-4">
              <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{copy.publicDsn}</dt>
              <dd className="mt-2 break-all font-mono text-xs">
                {status.dsn ?? copy.notConfigured}
              </dd>
            </div>
            <div className="rounded-lg border bg-background/60 p-4">
              <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{copy.environment}</dt>
              <dd className="mt-2 font-medium">{status.environment ?? copy.notSet}</dd>
            </div>
            <div className="rounded-lg border bg-background/60 p-4">
              <dt className="text-muted-foreground text-xs uppercase tracking-[0.18em]">{copy.release}</dt>
              <dd className="mt-2 break-all font-medium">{status.release ?? copy.notSet}</dd>
            </div>
          </dl>
          <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
            <p className="font-medium">{copy.verificationSteps}</p>
            <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5">
              {copy.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-3 border-t">
          <TestErrorButton disabled={!status.configured} />
          <p className="text-muted-foreground text-xs">
            {status.configured
              ? copy.readyHint
              : copy.missingHint}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
