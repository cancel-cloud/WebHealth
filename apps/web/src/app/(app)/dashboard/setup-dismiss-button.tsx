"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

export function SetupDismissButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (hidden) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      disabled={isPending}
      aria-label="Dismiss setup notice"
      onClick={async () => {
        setHidden(true);
        setIsPending(true);
        try {
          await requestJson(`/api/properties/${encodeURIComponent(propertyId)}/setup-dismissal`, {
            method: "POST",
          });
          router.refresh();
        } catch {
          setHidden(false);
        } finally {
          setIsPending(false);
        }
      }}
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
