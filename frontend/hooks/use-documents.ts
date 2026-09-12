"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Doc } from "@/lib/types";

export function useDocuments(poll = false) {
  return useQuery({
    queryKey: ["documents"],
    queryFn: api.listDocuments,
    refetchInterval: (query) => {
      if (!poll) return false;
      const docs = query.state.data?.documents ?? [];
      return docs.some((d) => d.status === "processing" || d.status === "uploading")
        ? 2000
        : false;
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadDocument(file),
    onSuccess: (doc: Doc) => {
      toast.success(`"${doc.original_filename}" uploaded — processing…`);
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useSummarize() {
  return useMutation({
    mutationFn: (id: string) => api.summarize(id),
    onError: (e: ApiError) => toast.error(e.message),
  });
}
