"use client";

import { useEffect, useState } from "react";
import { Loader2, ListChecks, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc, ExtractedAction, Priority } from "@/lib/types";
import { useExtractActions, useCreateActions } from "@/hooks/use-actions";
import { PRIORITY_META } from "@/lib/constants";

const PHASES = [
  "Reading document…",
  "Identifying action items…",
  "Assigning owners & priorities…",
];

export function ExtractActionsDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: Doc | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const extract = useExtractActions();
  const save = useCreateActions();
  const [rows, setRows] = useState<ExtractedAction[]>([]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!open || !doc) return;
    setRows([]);
    setPhase(0);
    const timer = setInterval(
      () => setPhase((p) => Math.min(p + 1, PHASES.length - 1)),
      600,
    );
    extract
      .mutateAsync(doc.id)
      .then((res) => setRows(res.actions))
      .finally(() => clearInterval(timer));
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.id]);

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.priority] = (acc[r.priority] ?? 0) + 1;
    return acc;
  }, {});

  function update(i: number, patch: Partial<ExtractedAction>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function onSave() {
    await save.mutateAsync(
      rows.map((r) => ({
        ...r,
        source_document_id: doc?.id ?? null,
      })) as never,
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" /> Extract Actions
          </DialogTitle>
          <DialogDescription>{doc?.original_filename}</DialogDescription>
        </DialogHeader>

        {extract.isPending ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {PHASES[phase]}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No actionable items were detected in this document.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 rounded-lg bg-secondary/50 p-3 text-xs">
              <span className="font-medium">
                AI identified {rows.length} actionable item
                {rows.length === 1 ? "" : "s"}.
              </span>
              {(["critical", "high", "medium", "low"] as Priority[])
                .filter((p) => counts[p])
                .map((p) => (
                  <span key={p} className={PRIORITY_META[p].class + " rounded border px-1.5"}>
                    {counts[p]} {PRIORITY_META[p].label}
                  </span>
                ))}
            </div>

            <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-lg border border-border p-3"
                >
                  <Input
                    value={row.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    className="font-medium"
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Owner"
                      value={row.owner}
                      onChange={(e) => update(i, { owner: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={row.deadline ?? ""}
                      onChange={(e) =>
                        update(i, { deadline: e.target.value || null })
                      }
                    />
                    <Select
                      value={row.priority}
                      onValueChange={(v) =>
                        update(i, { priority: v as Priority })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["low", "medium", "high", "critical"] as Priority[]).map(
                          (p) => (
                            <SelectItem key={p} value={p}>
                              {PRIORITY_META[p].label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            loading={save.isPending}
            disabled={rows.length === 0}
          >
            <Wand2 className="h-4 w-4" /> Save {rows.length} action
            {rows.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
