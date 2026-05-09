"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { PanelLeft } from "lucide-react";
import type { FeedbackSource } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import {
  FeedbackModalProvider,
  getFeedbackModalInitialState,
  getFeedbackModalNextState,
} from "@/components/feedback-modal-context";
import { FeatureRequestModal } from "@/components/feature-request-modal";
import { GoogleAccessRecoveryProvider } from "@/components/google-access-recovery";

export function AppShell({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [feedbackModalState, setFeedbackModalState] = useState(() =>
    getFeedbackModalInitialState(),
  );

  const openFeedback = useCallback(
    (input: {
      source: FeedbackSource;
      initialType?: import("@/lib/feedback").FeedbackType | "";
    }) => {
      setFeedbackModalState(getFeedbackModalNextState(input));
    },
    [],
  );

  return (
    <GoogleAccessRecoveryProvider>
      <FeedbackModalProvider value={{ openFeedback }}>
        <div className="relative isolate flex h-svh w-full overflow-hidden bg-app-shell text-foreground max-lg:flex-col">
        <div className="fixed inset-y-0 left-0 hidden w-72 bg-app-shell lg:block">
          <AppSidebar
            isAdmin={isAdmin}
            onFeatureRequest={() => openFeedback({ source: "sidebar" })}
          />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-[calc(100vw-1rem)] max-w-80 border-none bg-transparent p-3 shadow-none"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>
                Navigate the authenticated WebHealth application.
              </SheetDescription>
            </SheetHeader>
            <AppSidebar
              isAdmin={isAdmin}
              onNavigate={() => setMobileOpen(false)}
              onFeatureRequest={() => openFeedback({ source: "sidebar" })}
              floating
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-0 flex-1 flex-col lg:pl-72">
          <header className="z-20 shrink-0 flex items-center gap-3 border-b border-app-shell-border/70 bg-app-shell px-4 py-3 backdrop-blur lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="rounded-lg border border-app-shell-border/70 bg-background/80"
              onClick={() => setMobileOpen(true)}
            >
              <PanelLeft className="size-4" />
            </Button>

            <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-500 text-primary-foreground shadow-lg shadow-primary/15">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full bg-white/90"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-base font-bold tracking-tight">
                  Webhealth
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  SEO operations cockpit
                </span>
              </span>
            </Link>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden p-3">
            <div className="h-full overflow-hidden rounded-lg border border-app-shell-border/80 bg-background">
              <div className="h-full overflow-y-auto overscroll-contain p-6 lg:p-8">
                <div className="mx-auto w-full max-w-[84rem]">{children}</div>
              </div>
            </div>
          </main>
        </div>

        <CommandPalette
          isAdmin={isAdmin}
          onFeatureRequest={() => openFeedback({ source: "command_palette" })}
        />
        <FeatureRequestModal
          open={feedbackModalState.open}
          onOpenChange={(open) =>
            setFeedbackModalState((prev) => ({ ...prev, open }))
          }
          source={feedbackModalState.source}
          initialType={feedbackModalState.initialType}
        />
        </div>
      </FeedbackModalProvider>
    </GoogleAccessRecoveryProvider>
  );
}
