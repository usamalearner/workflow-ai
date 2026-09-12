"use client";

import { Loader2, Sparkles, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Doc } from "@/lib/types";
import { useSummarize } from "@/hooks/use-documents";
import { useEffect } from "react";

export function SummaryDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: Doc | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const summarize = useSummarize();

  useEffect(() => {
    if (open && doc) summarize.mutate(doc.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Summary
          </DialogTitle>
          <DialogDescription>{doc?.original_filename}</DialogDescription>
        </DialogHeader>

        {summarize.isPending ? (
          <div className="space-y-2 py-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading document…
            </p>
          </div>
        ) : summarize.data ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{summarize.data.summary}</p>
            {summarize.data.key_points.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Key points
                </p>
                <ul className="space-y-1.5">
                  {summarize.data.key_points.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Could not generate a summary for this document.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
