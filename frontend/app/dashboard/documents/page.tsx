"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { DocumentRow } from "@/components/documents/document-row";
import { SummaryDialog } from "@/components/documents/summary-dialog";
import { ExtractActionsDialog } from "@/components/documents/extract-actions-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents";
import type { Doc } from "@/lib/types";

export default function DocumentsPage() {
  const { data, isLoading } = useDocuments(true);
  const del = useDeleteDocument();
  const [summaryDoc, setSummaryDoc] = useState<Doc | null>(null);
  const [extractDoc, setExtractDoc] = useState<Doc | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);

  const docs = data?.documents ?? [];
  const usage = data?.usage;
  const atLimit = usage ? usage.documents_used >= usage.documents_limit : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Your organization's knowledge, organized and searchable."
      >
        {usage && (
          <span className="self-center rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
            {usage.documents_used} / {usage.documents_limit} documents
          </span>
        )}
      </PageHeader>

      {atLimit ? (
        <Card className="border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
          You&apos;ve reached the demo limit of {usage?.documents_limit} documents.
          Delete one to upload another.
        </Card>
      ) : (
        <UploadDropzone />
      )}

      <Card>
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">All documents</h2>
        </div>
        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={FileText}
            title="No documents yet"
            description="Upload a PDF, Word doc or spreadsheet — or load the demo workspace from the dashboard."
          />
        ) : (
          <div>
            {docs.map((d) => (
              <DocumentRow
                key={d.id}
                doc={d}
                onSummarize={() => setSummaryDoc(d)}
                onExtract={() => setExtractDoc(d)}
                onDelete={() => setDeleteDoc(d)}
              />
            ))}
          </div>
        )}
      </Card>

      <SummaryDialog
        doc={summaryDoc}
        open={!!summaryDoc}
        onOpenChange={(v) => !v && setSummaryDoc(null)}
      />
      <ExtractActionsDialog
        doc={extractDoc}
        open={!!extractDoc}
        onOpenChange={(v) => !v && setExtractDoc(null)}
      />

      <Dialog open={!!deleteDoc} onOpenChange={(v) => !v && setDeleteDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteDoc?.original_filename}&rdquo; and its knowledge index
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={del.isPending}
              onClick={async () => {
                if (deleteDoc) await del.mutateAsync(deleteDoc.id);
                setDeleteDoc(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
