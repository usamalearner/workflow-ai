"use client";

import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeedDemo, useResetWorkspace, useUsage } from "@/hooks/use-analytics";
import { useDocuments } from "@/hooks/use-documents";
import { IS_DEMO } from "@/lib/constants";

export function DemoBanner() {
  const { data } = useDocuments();
  const { data: usage } = useUsage();
  const seed = useSeedDemo();
  const reset = useResetWorkspace();
  const hasDocs = (data?.documents.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {IS_DEMO ? "Demo mode" : "Sample workspace"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasDocs
              ? "This workspace contains clearly-labelled sample data. Reset any time."
              : "Load a realistic sample workspace to explore every feature instantly."}
            {usage
              ? ` · ${usage.documents_used}/${usage.documents_limit} documents · ${usage.chat_used}/${usage.chat_limit} AI questions`
              : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        {hasDocs ? (
          <Button
            variant="outline"
            size="sm"
            loading={reset.isPending}
            onClick={() => reset.mutate()}
          >
            <RotateCcw className="h-4 w-4" /> Reset workspace
          </Button>
        ) : (
          <Button
            size="sm"
            loading={seed.isPending}
            onClick={() => seed.mutate()}
          >
            <Sparkles className="h-4 w-4" /> Load Demo Workspace
          </Button>
        )}
      </div>
    </div>
  );
}
