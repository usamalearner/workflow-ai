"use client";

import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionCard } from "@/components/actions/action-card";
import { CommDialog } from "@/components/actions/comm-dialog";
import { useActions } from "@/hooks/use-actions";
import type { Action, CommChannel } from "@/lib/types";

const TABS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High Priority" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const PRIO_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ActionsPage() {
  const { data, isLoading } = useActions();
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("priority");
  const [comm, setComm] = useState<{ action: Action; channel: CommChannel } | null>(
    null,
  );

  const actions = data ?? [];

  const filtered = useMemo(() => {
    let list = [...actions];
    if (tab === "critical") list = list.filter((a) => a.priority === "critical");
    else if (tab === "high") list = list.filter((a) => a.priority === "high");
    else if (tab === "pending") list = list.filter((a) => a.status !== "completed");
    else if (tab === "completed")
      list = list.filter((a) => a.status === "completed");

    list.sort((a, b) => {
      if (sort === "priority")
        return PRIO_ORDER[a.priority] - PRIO_ORDER[b.priority];
      if (sort === "deadline")
        return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
      return b.created_at.localeCompare(a.created_at);
    });
    return list;
  }, [actions, tab, sort]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Action Center"
        description="Turn information into accountable work."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Sort: Priority</SelectItem>
              <SelectItem value="deadline">Sort: Deadline</SelectItem>
              <SelectItem value="created">Sort: Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No actions here"
              description="Open a document and choose 'Extract Actions' to turn it into tracked work with owners and deadlines."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((a) => (
                <ActionCard
                  key={a.id}
                  action={a}
                  onGenerate={(channel) => setComm({ action: a, channel })}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CommDialog
        action={comm?.action ?? null}
        channel={comm?.channel ?? "email"}
        open={!!comm}
        onOpenChange={(v) => !v && setComm(null)}
      />
    </div>
  );
}
