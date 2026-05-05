"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { getWorkspaceActionBoard } from "@webhealth/shared/lib/live-dashboard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/client/api";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { toast } from "sonner";

type WorkspaceBoard = Awaited<ReturnType<typeof getWorkspaceActionBoard>>;

const ACTION_STATES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "ignored", label: "Ignored" },
  { value: "snoozed", label: "Snoozed" },
] as const;

export function WorkspaceActionBoard({ board }: { board: WorkspaceBoard }) {
  const router = useRouter();

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
      toast.success("Action state updated.");
      router.refresh();
    } catch (error) {
      toast.error(getAppErrorMessage(error, "Could not update action state."));
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
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">System #{action.systemRank ?? "—"}</span>
              {action.priorityOverride !== "none" ? <span className="rounded-full border px-2 py-0.5 text-[11px] text-sky-700 dark:text-sky-300">Override: {action.priorityOverride}</span> : null}
              {action.refreshState && (action.refreshState.status === "queued" || action.refreshState.status === "processing") ? <span className="rounded-full border px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">Updating</span> : null}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{action.propertyName}</div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">State</div>
              <div className="text-sm font-medium">{action.state.replace("_", " ")}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full">Update</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {ACTION_STATES.map((state) => (
                  <DropdownMenuItem key={state.value} onClick={() => updateActionState(action, state.value)}>
                    {state.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )) : (
        <div className="rounded-[18px] border border-border/70 px-4 py-6 text-sm text-muted-foreground">No durable actions yet. Open a property dashboard to seed the live queue.</div>
      )}
    </div>
  );
}
