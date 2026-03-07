export type DetailToastState =
  | {
      kind: "loading";
      message: string;
    }
  | {
      kind: "success";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    };

export function getDetailToastId(detailKey: string): string {
  return `detail:${detailKey}`;
}

export function getDetailToastState(
  phase: "start" | "queued" | "ready" | "error",
  rowTitle: string
): DetailToastState {
  if (phase === "start" || phase === "queued") {
    return { kind: "loading", message: `Generating details for "${rowTitle}"…` };
  }

  if (phase === "ready") {
    return { kind: "success", message: "Details ready" };
  }

  return { kind: "error", message: "Failed to generate details" };
}
