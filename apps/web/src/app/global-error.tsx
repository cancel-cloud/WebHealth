"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div
            className="size-20 rounded-lg flex items-center justify-center mb-6"
            style={{ backgroundColor: "#f43f5e10", border: "1px solid #f43f5e20" }}
          >
            <span className="font-display text-3xl font-extrabold" style={{ color: "#f43f5e" }}>
              !
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-3">
            Something went wrong
          </h1>
          <p className="text-muted-foreground max-w-sm mb-8">
            An unexpected error occurred. Try refreshing the page or head back to the dashboard.
            {error.digest && (
              <span className="block mt-2 text-xs font-mono opacity-60">
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <Button onClick={reset} className="rounded-full px-6">
              Try Again
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
