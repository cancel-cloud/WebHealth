"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TestErrorButton({ disabled }: { disabled: boolean }) {
  return (
    <Button
      type="button"
      variant="destructive"
      disabled={disabled}
      onClick={() => {
        throw Error("Generic Error Message");
      }}
    >
      <TriangleAlert className="h-4 w-4" />
      Trigger Generic Error
    </Button>
  );
}
