"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, MessagesSquare, ListChecks, Clock, Info } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { LineTrend, PriorityBars, AreaTrend } from "@/components/analytics/charts";
import { SpreadsheetPanel } from "@/components/analytics/spreadsheet-panel";
import { useAnalytics } from "@/hooks/use-analytics";

function AnalyticsInner() {
  const params = useSearchParams();
  const docId = params.get("doc");
  const { data: a, isLoading } = useAnalytics();

  const hours = a ? (a.estimated_minutes_saved / 60).toFixed(1) : "0.0";
  const reduction =
    a && a.avg_review_before_min
      ? Math.round(
          ((a.avg_review_before_min - a.avg_review_after_min) /
            a.avg_review_before_min) *
            100,
        )
      : 93;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Measurable productivity impact across your workspace."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Documents Processed"
              value={a?.documents_processed ?? 0}
            />
            <StatCard
              icon={MessagesSquare}
              label="AI Interactions"
              value={a?.questions_answered ?? 0}
            />
            <StatCard
              icon={ListChecks}
              label="Actions Generated"
              value={a?.actions_extracted ?? 0}
            />
            <StatCard
              icon={Clock}
              label="Estimated Time Saved"
              value={`${hours} hrs`}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents processed over time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] rounded-lg" />
            ) : (
              <LineTrend data={a?.documents_over_time ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions by priority</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] rounded-lg" />
            ) : (
              <PriorityBars data={a?.actions_by_priority ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimated time saved</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] rounded-lg" />
            ) : (
              <AreaTrend data={a?.time_saved_over_time ?? []} unit=" hrs" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Productivity Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Before AI</p>
                <p className="mt-1 text-2xl font-semibold">
                  {a?.avg_review_before_min ?? 45} min
                </p>
                <p className="text-xs text-muted-foreground">
                  Average document review
                </p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">With WorkFlow AI</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {a?.avg_review_after_min ?? 3} min
                </p>
                <p className="text-xs text-muted-foreground">
                  Average document review
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-success/10 p-3 text-center">
              <p className="text-sm text-muted-foreground">Estimated reduction</p>
              <p className="text-2xl font-semibold text-success">{reduction}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {a?.assumptions_note ??
          "Estimated based on user-defined workflow assumptions, not scientifically validated measurements."}
      </p>

      <SpreadsheetPanel initialDocId={docId} />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh] rounded-xl" />}>
      <AnalyticsInner />
    </Suspense>
  );
}
