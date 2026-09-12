"use client";

import { useState } from "react";
import { FileBarChart, Copy, Printer, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Markdown } from "@/components/reports/markdown";
import { GeneratePanel } from "@/components/reports/generate-panel";
import { useDocumentViewer } from "@/components/documents/document-viewer-provider";
import { useReports } from "@/hooks/use-analytics";
import { REPORT_TYPES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import type { Report } from "@/lib/types";

export default function ReportsPage() {
  const { data: reports, isLoading } = useReports();
  const { openDocument } = useDocumentViewer();
  const [active, setActive] = useState<Report | null>(null);
  const [copied, setCopied] = useState(false);

  const current = active ?? reports?.[0] ?? null;

  function copy() {
    if (!current) return;
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    toast.success("Report copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Reports"
        description="Turn complex information into management-ready reports."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <GeneratePanel onGenerated={(r) => setActive(r)} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))
              ) : (reports ?? []).length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No reports yet.
                </p>
              ) : (
                reports!.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActive(r)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      current?.id === r.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(r.created_at)} ·{" "}
                      {REPORT_TYPES.find((t) => t.value === r.report_type)?.label}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[60vh]">
          {!current ? (
            <EmptyState
              className="border-0"
              icon={FileBarChart}
              title="No report selected"
              description="Choose a report type and source documents, then generate a management-ready report."
            />
          ) : (
            <>
              <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border">
                <div className="min-w-0">
                  <CardTitle className="text-base">{current.title}</CardTitle>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Sources:</span>
                    {current.source_filenames.length === 0 && <span>—</span>}
                    {current.source_filenames.map((name, i) => {
                      const docId = current.source_documents[i];
                      return (
                        <button
                          key={`${name}-${i}`}
                          type="button"
                          disabled={!docId}
                          onClick={() => docId && openDocument(docId)}
                          className="rounded-md border border-border bg-secondary/40 px-2 py-0.5 hover:border-primary/40 hover:text-primary disabled:hover:border-border disabled:hover:text-muted-foreground"
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={copy}>
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="prose-report py-6">
                <Markdown content={current.content} />
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
