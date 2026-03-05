"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionDetail = {
  affectedUrls: string[];
  fixSteps: string[];
  whyItMatters: string;
};

type ActionDetailModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  detail: string | null;
};

export function ActionDetailModal({ open, onClose, title, detail }: ActionDetailModalProps) {
  let parsed: ActionDetail | null = null;
  let parseError = false;

  if (detail) {
    try {
      parsed = JSON.parse(detail) as ActionDetail;
    } catch {
      parseError = true;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{title}</DialogTitle>
        </DialogHeader>

        {!detail && (
          <p className="text-sm text-muted-foreground">No details available.</p>
        )}

        {parseError && detail && (
          <p className="text-sm text-foreground/80">{detail}</p>
        )}

        {parsed && (
          <div className="space-y-4 text-sm">
            {parsed.affectedUrls.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Affected pages</p>
                <ul className="space-y-1">
                  {parsed.affectedUrls.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsed.fixSteps.length > 0 && (
              <div>
                <p className="font-semibold mb-1">How to fix</p>
                <div className="space-y-1 text-foreground/80">
                  {parsed.fixSteps.map((step, i) => (
                    <p key={i}>{step}</p>
                  ))}
                </div>
              </div>
            )}

            {parsed.whyItMatters && (
              <div>
                <p className="font-semibold mb-1">Why it matters</p>
                <p className="text-foreground/80">{parsed.whyItMatters}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
