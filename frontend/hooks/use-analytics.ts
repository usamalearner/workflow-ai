"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

export function useAnalytics() {
  return useQuery({ queryKey: ["analytics"], queryFn: api.analytics });
}

export function useUsage() {
  return useQuery({ queryKey: ["usage"], queryFn: api.usage });
}

export function useReports() {
  return useQuery({ queryKey: ["reports"], queryFn: api.listReports });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.generateReport,
    onSuccess: () => {
      toast.success("Report generated");
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["usage"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useSeedDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.seedDemo,
    onSuccess: () => {
      toast.success("Demo workspace loaded");
      qc.invalidateQueries();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useResetWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.resetWorkspace,
    onSuccess: () => {
      toast.success("Workspace cleared");
      qc.invalidateQueries();
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
