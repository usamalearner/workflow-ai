"use client";

import { useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REPORT_TYPES } from "@/lib/constants";
import { useDocuments } from "@/hooks/use-documents";
import { useGenerateReport } from "@/hooks/use-analytics";
import type { Report, ReportType } from "@/lib/types";
import { DocIcon } from "@/components/documents/doc-icon";

const PHASES = [
  "Analyzing documents…",
  "Identifying key findings…",
  "Extracting risks…",
  "Generating recommendations…",
];

export function GeneratePanel({ onGenerated }: { onGenerated: (r: Report) => void }) {
  const { data } = useDocuments();
  const gen = useGenerateReport();
  const [type, setType] = useState<ReportType>("executive_summary");
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState(0);

  const docs = (data?.documents ?? []).filter((d) => d.status === "ready");

  useEffect(() => {
    if (docs.length && selected.length === 0) {
      setSelected(docs.slice(0, 2).map((d) => d.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs.length]);

  async function generate() {
    setPhase(0);
    const t = setInterval(
      () => setPhase((p) => Math.min(p + 1, PHASES.length - 1)),
      650,
    );
    try {
      const r = await gen.mutateAsync({ report_type: type, document_ids: selected });
      onGenerated(r);
    } finally {
      clearInterval(t);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Report type
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                onClick={() => setType(rt.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  type === rt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <p className="text-sm font-medium">{rt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{rt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Source documents ({selected.length})
          </p>
          {docs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No processed documents yet. Upload one or load the demo workspace.
            </p>
          ) : (
            <div className="space-y-1.5">
              {docs.map((d) => {
                const on = selected.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() =>
                      setSelected((s) =>
                        on ? s.filter((x) => x !== d.id) : [...s, d.id],
                      )
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                      on ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <DocIcon type={d.file_type} className="h-7 w-7" />
                    <span className="flex-1 truncate text-sm">
                      {d.original_filename}
                    </span>
                    <span
                      className={cn(
                        "h-4 w-4 rounded border",
                        on ? "border-primary bg-primary" : "border-border",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {gen.isPending ? (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {PHASES[phase]}
          </div>
        ) : null}

        <Button
          className="w-full"
          onClick={generate}
          loading={gen.isPending}
          disabled={selected.length === 0}
        >
          <Wand2 className="h-4 w-4" /> Generate report
        </Button>
      </CardContent>
    </Card>
  );
}
