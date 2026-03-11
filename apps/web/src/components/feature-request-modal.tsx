"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@webhealth/shared/lib/auth-client";
import type { FeedbackSource, FeedbackType } from "@/lib/feedback";
import { FEEDBACK_TYPE_OPTIONS } from "@/lib/feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getFeatureRequestDialogTitle,
  getFeatureRequestInitialFocusFieldId,
  getFeatureRequestSubmissionState,
  getFeatureRequestSuccessDismissDelayMs,
  getFeatureRequestSubmitLabel,
} from "./feature-request-modal.logic";
import { getAppErrorMessage } from "@/lib/client/app-error";
import { requestJson } from "@/lib/client/api";

export function FeatureRequestModal({
  open,
  onOpenChange,
  source,
  initialType = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: FeedbackSource;
  initialType?: FeedbackType | "";
}) {
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<FeedbackType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const submissionState = getFeatureRequestSubmissionState({ type, message });
  const submitLabel = getFeatureRequestSubmitLabel(submitted);
  const isDisabled = submitted || isSubmitting;
  const messageFieldId = getFeatureRequestInitialFocusFieldId();
  const successDismissDelayMs = getFeatureRequestSuccessDismissDelayMs();
  const dialogTitle = getFeatureRequestDialogTitle();

  useEffect(() => {
    if (open) {
      setType(initialType);
    }
  }, [initialType, open]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setType("");
      setMessage("");
      setError(null);
      setIsSubmitting(false);
      setSubmitted(false);
    }

    onOpenChange(nextOpen);
  }, [onOpenChange]);

  useEffect(() => {
    if (!submitted || !open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleOpenChange(false);
    }, successDismissDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [handleOpenChange, open, submitted, successDismissDelayMs]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!submissionState.canSubmit || submitted || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await requestJson("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          source,
          message: submissionState.trimmedMessage,
        }),
      });

      setMessage(submissionState.trimmedMessage);
      setSubmitted(true);
    } catch (error) {
      setError(getAppErrorMessage(error, "Could not send your feedback."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[460px]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          messageRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription>
            Tell us what you wish existed or what you want to report. We&apos;ll use your account email as the reply
            address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="feature-request-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as FeedbackType)} disabled={isDisabled}>
              <SelectTrigger id="feature-request-type" className="w-full">
                <SelectValue placeholder="Select what you want to send" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature-request-email">Email</Label>
            <Input
              id="feature-request-email"
              value={session?.user?.email ?? ""}
              readOnly
              disabled={isDisabled}
              className="bg-muted/35"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature-request-message">What would you like to add or report?</Label>
            <Textarea
              id={messageFieldId}
              ref={messageRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={isDisabled}
              placeholder="Describe the feature, workflow, or issue you want to share."
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isDisabled}>
              Cancel
            </Button>
            <Button type="submit" disabled={!submissionState.canSubmit || isDisabled} className="rounded-full">
              {submitted || isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitted ? submitLabel : isSubmitting ? "Sending..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
