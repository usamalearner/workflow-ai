"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Action, ExtractedAction } from "@/lib/types";

export function useActions() {
  return useQuery({ queryKey: ["actions"], queryFn: api.listActions });
}

export function useUpdateAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Action> & { id: string }) =>
      api.updateAction(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useCreateActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Partial<ExtractedAction>[]) => api.createActionsBulk(items),
    onSuccess: (created) => {
      toast.success(`${created.length} action${created.length === 1 ? "" : "s"} saved`);
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useExtractActions() {
  return useMutation({
    mutationFn: (documentId: string) => api.extractActions(documentId),
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useGenerateComm() {
  return useMutation({
    mutationFn: ({ id, channel }: { id: string; channel: "email" | "whatsapp" }) =>
      api.generateComm(id, channel),
    onError: (e: ApiError) => toast.error(e.message),
  });
}
