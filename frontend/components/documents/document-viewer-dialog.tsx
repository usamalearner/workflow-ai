"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileWarning, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocIcon } from "@/components/documents/doc-icon";
import { api, ApiError } from "@/lib/api";

type Mode = "loading" | "pdf" | "pages" | "error";

export function DocumentViewerDialog({
  documentId,
  initialPage,
  open,
  onOpenChange,
}: {
  documentId: string | null;
  initialPage?: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("loading");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<{ page_number: number; content: string }[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fellBackFromPdf, setFellBackFromPdf] = useState(false);

  const { data: doc } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => api.getDocument(documentId as string),
    enabled: open && !!documentId,
  });

  useEffect(() => {
    if (!open || !documentId || !doc) return;
    let cancelled = false;
    let createdUrl: string | null = null;

    async function load() {
      setMode("loading");
      setError(null);
      setFellBackFromPdf(false);

      if (doc!.file_type === "pdf") {
        try {
          const blob = await api.getDocumentFile(documentId as string);
          if (cancelled) return;
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
          setMode("pdf");
          return;
        } catch {
          if (cancelled) return;
          setFellBackFromPdf(true);
          // fall through to the extracted-text reading view
        }
      }

      try {
        const content = await api.getDocumentContent(documentId as string);
        if (cancelled) return;
        setPages(content.pages);
        const idx = initialPage
          ? content.pages.findIndex((p) => p.page_number === initialPage)
          : 0;
        setPageIndex(idx >= 0 ? idx : 0);
        setMode(content.pages.length ? "pages" : "error");
        if (!content.pages.length) setError("No content is available for this document.");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load this document.");
        setMode("error");
      }
    }
    load();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId, doc?.file_type]);

  const page = pages[pageIndex];
  const title = doc?.original_filename ?? "Document";

  const subtitle = useMemo(() => {
    if (mode === "pages" && pages.length) {
      return `Page ${page?.page_number ?? pageIndex + 1} of ${pages.length}${
        fellBackFromPdf ? " · reading view (original file unavailable)" : ""
      }`;
    }
    return doc?.file_type?.toUpperCase();
  }, [mode, pages.length, page, pageIndex, fellBackFromPdf, doc?.file_type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {doc && <DocIcon type={doc.file_type} className="h-7 w-7" />}
            <span className="truncate">{title}</span>
          </DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          {mode === "loading" && (
            <div className="flex h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading document…
            </div>
          )}

          {mode === "error" && (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <FileWarning className="h-6 w-6" />
              {error ?? "Could not load this document."}
            </div>
          )}

          {mode === "pdf" && blobUrl && (
            <iframe
              src={blobUrl}
              title={title}
              className="h-[70vh] w-full rounded-lg border border-border bg-white"
            />
          )}

          {mode === "pages" && page && (
            <div className="flex h-[65vh] flex-col">
              <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-card/40 p-5 scrollbar-thin sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {page.content}
                </p>
              </div>
              {pages.length > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page.page_number} of {pages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageIndex === pages.length - 1}
                    onClick={() =>
                      setPageIndex((i) => Math.min(pages.length - 1, i + 1))
                    }
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
