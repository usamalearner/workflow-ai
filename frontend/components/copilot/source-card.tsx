"use client";

import { FileText } from "lucide-react";
import { useDocumentViewer } from "@/components/documents/document-viewer-provider";
import type { Source } from "@/lib/types";

export function SourceCard({ source }: { source: Source }) {
  const { openDocument } = useDocumentViewer();

  return (
    <button
      type="button"
      onClick={() => openDocument(source.document_id, source.page_number)}
      className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[11px] font-semibold text-primary">
          {source.index}
        </span>
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="truncate text-xs font-medium">{source.filename}</p>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Page {source.page_number} · relevance {(source.score * 100).toFixed(0)}%
      </p>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
        {source.snippet}
      </p>
    </button>
  );
}
