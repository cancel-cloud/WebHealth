"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const DISMISS_KEY = "restriction_dismissed";

export function RestrictionNotice({ message }: { message: string }) {
  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    toast.warning(
      message || "Some features on your account have been limited by an admin.",
      {
        duration: Infinity,
        dismissible: true,
        onDismiss: () => localStorage.setItem(DISMISS_KEY, "1"),
      },
    );
  }, [message]);

  return null;
}
