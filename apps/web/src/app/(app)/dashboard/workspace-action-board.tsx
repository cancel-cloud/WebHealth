"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { getWorkspaceActionBoard } from "@webhealth/shared/lib/live-dashboard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { toast } from "sonner";
import { useAppLanguage } from "@/lib/app-language";

type WorkspaceBoard = Awaited<ReturnType<typeof getWorkspaceActionBoard>>;

const ACTION_BOARD_COPY = {
  en: {
    states: {
      open: "Open",
      in_progress: "In progress",
      done: "Done",
      ignored: "Ignored",
      snoozed: "Snoozed",
    },
    stateLabel: "State",
    update: "Update",
    updated: "Action state updated.",
    updateError: "Could not update action state.",
    systemRank: "System #",
    override: "Override",
    updating: "Updating",
    empty: "No durable actions yet. Open a property dashboard to seed the live queue.",
  },
  de: {
    states: {
      open: "Offen",
      in_progress: "In Arbeit",
      done: "Erledigt",
      ignored: "Ignoriert",
      snoozed: "Zurückgestellt",
    },
    stateLabel: "Status",
    update: "Ändern",
    updated: "Maßnahmenstatus aktualisiert.",
    updateError: "Maßnahmenstatus konnte nicht aktualisiert werden.",
    systemRank: "System #",
    override: "Override",
    updating: "Aktualisiert",
    empty: "Noch keine dauerhaften Maßnahmen. Öffne ein Property-Dashboard, um die Live-Liste zu füllen.",
  },
} as const;

const ACTION_STATES = ["open", "in_progress", "done", "ignored", "snoozed"] as const;

export function WorkspaceActionBoard({ board }: { board: WorkspaceBoard }) {
  const router = useRouter();
  const language = useAppLanguage();
  const copy = ACTION_BOARD_COPY[language];

  const updateActionState = async (action: WorkspaceBoard["actions"][number], state: string) => {
    try {
      await requestJson(`/api/properties/${encodeURIComponent(action.propertyId)}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: action.fingerprint,
          actionFamily: action.actionFamily,
          causeFamily: action.causeFamily,
          remedyKey: action.remedyKey,
          targetType: action.targetType,
          targetKey: action.targetKey,
          title: action.title,
          owner: action.owner,
          state,
        }),
      });
      toast.success(copy.updated);
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, copy.updateError));
    }
  };

  return (
    <div className="space-y-3">
      {board.actions.length ? board.actions.slice(0, 8).map((action) => (
        <div
          key={action.id}
          className="flex items-center justify-between gap-3 rounded-[18px] border border-border/70 px-4 py-3"
        >
          <Link href={`/properties/${encodeURIComponent(action.propertyId)}`} className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{action.title}</span>
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{copy.systemRank}{action.systemRank ?? "—"}</span>
              {action.priorityOverride !== "none" ? <span className="rounded-full border px-2 py-0.5 text-[11px] text-sky-700 dark:text-sky-300">{copy.override}: {action.priorityOverride}</span> : null}
              {action.refreshState && (action.refreshState.status === "queued" || action.refreshState.status === "processing") ? <span className="rounded-full border px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">{copy.updating}</span> : null}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{action.propertyName}</div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{copy.stateLabel}</div>
              <div className="text-sm font-medium">{copy.states[action.state as keyof typeof copy.states] ?? action.state.replace("_", " ")}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">{copy.update}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ACTION_STATES.map((state) => (
                  <DropdownMenuItem key={state} onClick={() => updateActionState(action, state)}>
                    {copy.states[state]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )) : (
        <div className="rounded-[18px] border border-border/70 px-4 py-6 text-sm text-muted-foreground">{copy.empty}</div>
      )}
    </div>
  );
}
