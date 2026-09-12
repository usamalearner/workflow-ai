"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DocumentViewerDialog } from "./document-viewer-dialog";

interface ViewerState {
  documentId: string | null;
  page: number | null;
}

interface DocumentViewerContextValue {
  /** Opens the in-app viewer for a document — works anywhere a document is
   * referenced (documents list, copilot sources, action cards, report
   * sources) without leaving the page or opening a new tab. */
  openDocument: (documentId: string, page?: number | null) => void;
}

const DocumentViewerContext = createContext<DocumentViewerContextValue | undefined>(
  undefined,
);

export function DocumentViewerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ViewerState>({ documentId: null, page: null });

  const openDocument = useCallback((documentId: string, page: number | null = null) => {
    setState({ documentId, page });
  }, []);

  const value = useMemo(() => ({ openDocument }), [openDocument]);

  return (
    <DocumentViewerContext.Provider value={value}>
      {children}
      <DocumentViewerDialog
        documentId={state.documentId}
        initialPage={state.page}
        open={!!state.documentId}
        onOpenChange={(v) => !v && setState({ documentId: null, page: null })}
      />
    </DocumentViewerContext.Provider>
  );
}

export function useDocumentViewer() {
  const ctx = useContext(DocumentViewerContext);
  if (!ctx) throw new Error("useDocumentViewer must be used within DocumentViewerProvider");
  return ctx;
}
