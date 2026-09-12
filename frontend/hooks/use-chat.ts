"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

export function useConversations() {
  return useQuery({ queryKey: ["conversations"], queryFn: api.listConversations });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => api.getConversation(id as string),
    enabled: !!id,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      message: string;
      conversation_id?: string | null;
      document_ids?: string[] | null;
    }) => api.chat(body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", res.conversation_id] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["usage"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
