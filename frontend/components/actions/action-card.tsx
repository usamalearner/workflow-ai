"use client";

import { Mail, MessageCircle, Check, User, CalendarDays, FileText, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { useDocumentViewer } from "@/components/documents/document-viewer-provider";
import { formatDate } from "@/lib/utils";
import type { Action } from "@/lib/types";
import { useUpdateAction } from "@/hooks/use-actions";

export function ActionCard({
  action,
  onGenerate,
}: {
  action: Action;
  onGenerate: (channel: "email" | "whatsapp") => void;
}) {
  const update = useUpdateAction();
  const { openDocument } = useDocumentViewer();
  const done = action.status === "completed";

  return (
    <Card className="p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={action.priority} />
          <StatusBadge status={action.status} />
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-snug">{action.title}</h3>
      {action.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {action.description}
        </p>
      )}

      <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> {action.owner || "Unassigned"}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(action.deadline)}
        </span>
        {action.source_filename && (
          <button
            type="button"
            disabled={!action.source_document_id}
            onClick={() =>
              action.source_document_id && openDocument(action.source_document_id)
            }
            className="flex items-center gap-1.5 text-left hover:text-primary hover:underline disabled:hover:text-muted-foreground disabled:no-underline"
          >
            <FileText className="h-3.5 w-3.5" /> {action.source_filename}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onGenerate("email")}>
          <Mail className="h-3.5 w-3.5" /> Email
        </Button>
        <Button size="sm" variant="outline" onClick={() => onGenerate("whatsapp")}>
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
        <Button
          size="sm"
          variant={done ? "ghost" : "secondary"}
          loading={update.isPending}
          onClick={() =>
            update.mutate({
              id: action.id,
              status: done ? "pending" : "completed",
            })
          }
        >
          {done ? (
            <>
              <Undo2 className="h-3.5 w-3.5" /> Reopen
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" /> Mark Complete
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
