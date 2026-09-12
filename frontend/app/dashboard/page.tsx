"use client";

import Link from "next/link";
import {
  FileText,
  MessagesSquare,
  ListChecks,
  Clock,
  Upload,
  Sparkles,
  FileBarChart,
  ArrowRight,
  Table2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductivityChart } from "@/components/dashboard/productivity-chart";
import { DemoBanner } from "@/components/layout/demo-banner";
import { DocIcon } from "@/components/documents/doc-icon";
import { useDocumentViewer } from "@/components/documents/document-viewer-provider";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDocuments } from "@/hooks/use-documents";
import { useActions } from "@/hooks/use-actions";
import { useAuth } from "@/lib/auth";
import { greeting, formatRelativeTime } from "@/lib/utils";

const QUICK_ACTIONS = [
  { href: "/dashboard/documents", label: "Upload Document", icon: Upload },
  { href: "/dashboard/copilot", label: "Ask AI", icon: Sparkles },
  { href: "/dashboard/actions", label: "Extract Actions", icon: ListChecks },
  { href: "/dashboard/reports", label: "Generate Report", icon: FileBarChart },
  { href: "/dashboard/analytics", label: "Analyze Spreadsheet", icon: Table2 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const analytics = useAnalytics();
  const docs = useDocuments();
  const actions = useActions();
  const { openDocument } = useDocumentViewer();

  const a = analytics.data;
  const recentDocs = (docs.data?.documents ?? []).slice(0, 3);
  const recentActions = (actions.data ?? [])
    .filter((x) => x.status !== "completed")
    .slice(0, 3);
  const hoursSaved = a ? (a.estimated_minutes_saved / 60).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {user?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your workspace.
        </p>
      </div>

      <DemoBanner />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {analytics.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Documents Processed"
              value={a?.documents_processed ?? 0}
              trend={12}
            />
            <StatCard
              icon={MessagesSquare}
              label="AI Questions"
              value={a?.questions_answered ?? 0}
              trend={8}
            />
            <StatCard
              icon={ListChecks}
              label="Actions Extracted"
              value={a?.actions_extracted ?? 0}
              trend={5}
            />
            <StatCard
              icon={Clock}
              label="Time Saved"
              value={`${hoursSaved} hrs`}
              trend={16}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Documents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/documents">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {docs.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))
            ) : recentDocs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No documents yet. Upload one or load the demo workspace.
              </p>
            ) : (
              recentDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={d.status !== "ready"}
                  onClick={() => openDocument(d.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-secondary/50 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <DocIcon type={d.file_type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {d.original_filename}
                    </p>
                    <p className="text-xs uppercase text-muted-foreground">
                      {d.file_type}
                      {d.page_count ? ` · ${d.page_count} pages` : ""}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatRelativeTime(d.created_at)}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {QUICK_ACTIONS.map((q) => (
              <Button
                key={q.href}
                variant="secondary"
                className="w-full justify-start"
                asChild
              >
                <Link href={q.href}>
                  <q.icon className="h-4 w-4 text-primary" />
                  {q.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent actions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Actions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/actions">
                Action Center <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {actions.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : recentActions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No open actions. Extract actions from a document to get started.
              </p>
            ) : (
              recentActions.map((x) => (
                <div
                  key={x.id}
                  className="rounded-lg border border-border p-3.5 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <PriorityBadge priority={x.priority} />
                    <StatusBadge status={x.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium">{x.title}</p>
                  {x.source_filename && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Source: {x.source_filename}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Productivity impact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Productivity Impact</CardTitle>
            <p className="text-xs text-muted-foreground">
              Estimated time saved this week
            </p>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-3xl font-semibold text-primary">
              {hoursSaved} hrs
            </p>
            {analytics.isLoading ? (
              <Skeleton className="h-[200px] rounded-lg" />
            ) : (
              <ProductivityChart data={a?.time_saved_over_time ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
