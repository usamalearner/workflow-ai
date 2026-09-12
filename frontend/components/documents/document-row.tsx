"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Sparkles,
  ListChecks,
  Trash2,
  MessageSquareText,
  Loader2,
  AlertCircle,
  Table2,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DocIcon } from "./doc-icon";
import { StatusBadge } from "@/components/shared/badges";
import { useDocumentViewer } from "./document-viewer-provider";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import type { Doc } from "@/lib/types";

export function DocumentRow({
  doc,
  onSummarize,
  onExtract,
  onDelete,
}: {
  doc: Doc;
  onSummarize: () => void;
  onExtract: () => void;
  onDelete: () => void;
}) {
  const ready = doc.status === "ready";
  const spreadsheet = doc.file_type === "xlsx" || doc.file_type === "csv";
  const { openDocument } = useDocumentViewer();

  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-3 last:border-0 hover:bg-secondary/40">
      <DocIcon type={doc.file_type} />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          disabled={!ready}
          onClick={() => openDocument(doc.id)}
          className="truncate text-left text-sm font-medium hover:text-primary hover:underline disabled:no-underline disabled:hover:text-foreground"
        >
          {doc.original_filename}
        </button>
        <p className="text-xs text-muted-foreground">
          <span className="uppercase">{doc.file_type}</span>
          {doc.page_count ? ` · ${doc.page_count} pages` : ""}
          {doc.chunk_count ? ` · ${doc.chunk_count} chunks` : ""} ·{" "}
          {formatBytes(doc.file_size)}
        </p>
        {doc.status === "failed" && doc.error && (
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" /> {doc.error}
          </p>
        )}
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        {(doc.status === "processing" || doc.status === "uploading") && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        )}
        <StatusBadge status={doc.status} />
      </div>

      <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground md:block">
        {formatRelativeTime(doc.created_at)}
      </span>

      <div className="hidden shrink-0 gap-1 lg:flex">
        <Button
          variant="ghost"
          size="sm"
          disabled={!ready}
          onClick={() => openDocument(doc.id)}
        >
          <BookOpen className="h-3.5 w-3.5" /> Open
        </Button>
        <Button variant="ghost" size="sm" disabled={!ready} asChild={ready}>
          {ready ? (
            <Link href={`/dashboard/copilot?doc=${doc.id}`}>
              <MessageSquareText className="h-3.5 w-3.5" /> Ask AI
            </Link>
          ) : (
            <span>
              <MessageSquareText className="h-3.5 w-3.5" /> Ask AI
            </span>
          )}
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Document actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openDocument(doc.id)} disabled={!ready}>
            <BookOpen /> Open
          </DropdownMenuItem>
          <DropdownMenuItem asChild disabled={!ready}>
            <Link href={`/dashboard/copilot?doc=${doc.id}`}>
              <MessageSquareText /> Ask AI
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onSummarize} disabled={!ready}>
            <Sparkles /> Summarize
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExtract} disabled={!ready}>
            <ListChecks /> Extract Actions
          </DropdownMenuItem>
          {spreadsheet && (
            <DropdownMenuItem asChild disabled={!ready}>
              <Link href={`/dashboard/analytics?doc=${doc.id}`}>
                <Table2 /> Analyze
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
