export const DETAIL_READY_TOAST_DURATION_MS = 15_000;

export type DetailToastState = {
  kind: "loading" | "success" | "error";
  message: string;
  id?: string;
  duration?: number;
};

export function getDetailToastId(detailKey: string): string {
  return `detail:${detailKey}`;
}

export function getDetailToastState(
  phase: "start" | "queued" | "ready" | "error",
  args: { detailKey: string; rowTitle: string }
): DetailToastState {
  const { detailKey, rowTitle } = args;

  if (phase === "start" || phase === "queued") {
    return {
      kind: "loading",
      id: getDetailToastId(detailKey),
      message: `Generating details for "${rowTitle}"…`,
      duration: Infinity,
    };
  }

  if (phase === "ready") {
    return {
      kind: "success",
      message: "Details ready",
      duration: DETAIL_READY_TOAST_DURATION_MS,
    };
  }

  return {
    kind: "error",
    id: getDetailToastId(detailKey),
    message: "Failed to generate details",
  };
}
