import { API_URL } from "./constants";
import { getAccessToken } from "./supabase";
import type {
  Action,
  Analytics,
  ChatResponse,
  Conversation,
  ConversationDetail,
  Doc,
  DocumentContent,
  DocumentListResponse,
  ExtractActionsResponse,
  ExtractedAction,
  GeneratedComm,
  Report,
  ReportType,
  SpreadsheetAnalysis,
  Summary,
  Usage,
} from "./types";

const BASE = `${API_URL}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { raw = false }: { raw?: boolean } = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!raw && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "Cannot reach the WorkFlow AI backend. Is it running?",
      0,
    );
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(
      typeof detail === "string" ? detail : JSON.stringify(detail),
      res.status,
    );
  }
  return data as T;
}

/** For binary responses (the raw document file) — same auth header, but
 * resolves to a Blob instead of parsing JSON. */
async function requestBlob(path: string): Promise<Blob> {
  const token = await getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { headers });
  } catch {
    throw new ApiError("Cannot reach the WorkFlow AI backend. Is it running?", 0);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(
      typeof detail === "string" ? detail : JSON.stringify(detail),
      res.status,
    );
  }
  return res.blob();
}

export const api = {
  health: () =>
    fetch(`${API_URL}/health`).then((r) => r.json()) as Promise<{
      demo_mode: boolean;
      groq_configured: boolean;
      supabase_configured: boolean;
    }>,

  // Documents
  listDocuments: () => request<DocumentListResponse>("/documents"),
  getDocument: (id: string) => request<Doc>(`/documents/${id}`),
  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<Doc>(
      "/documents/upload",
      { method: "POST", body: form },
      { raw: true },
    );
  },
  deleteDocument: (id: string) =>
    request<void>(`/documents/${id}`, { method: "DELETE" }),
  summarize: (id: string) =>
    request<Summary>(`/documents/${id}/summarize`, { method: "POST" }),
  extractActions: (id: string) =>
    request<ExtractActionsResponse>(`/documents/${id}/extract-actions`, {
      method: "POST",
    }),
  analyzeStored: (id: string) =>
    request<SpreadsheetAnalysis>(`/documents/${id}/analyze`, { method: "POST" }),
  getDocumentContent: (id: string) =>
    request<DocumentContent>(`/documents/${id}/content`),
  getDocumentFile: (id: string) => requestBlob(`/documents/${id}/file`),

  // Copilot
  chat: (body: {
    message: string;
    conversation_id?: string | null;
    document_ids?: string[] | null;
  }) => request<ChatResponse>("/chat", { method: "POST", body: JSON.stringify(body) }),
  listConversations: () => request<Conversation[]>("/conversations"),
  getConversation: (id: string) =>
    request<ConversationDetail>(`/conversations/${id}`),

  // Actions
  listActions: () => request<Action[]>("/actions"),
  createAction: (body: Partial<Action>) =>
    request<Action>("/actions", { method: "POST", body: JSON.stringify(body) }),
  createActionsBulk: (items: Partial<ExtractedAction>[]) =>
    request<Action[]>("/actions/bulk", {
      method: "POST",
      body: JSON.stringify(items),
    }),
  updateAction: (id: string, body: Partial<Action>) =>
    request<Action>(`/actions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  generateComm: (id: string, channel: "email" | "whatsapp") =>
    request<GeneratedComm>(`/actions/${id}/communication`, {
      method: "POST",
      body: JSON.stringify({ channel }),
    }),

  // Reports
  listReports: () => request<Report[]>("/reports"),
  generateReport: (body: {
    report_type: ReportType;
    document_ids: string[];
    title?: string;
  }) =>
    request<Report>("/reports/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Files
  analyzeFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<SpreadsheetAnalysis>(
      "/files/analyze",
      { method: "POST", body: form },
      { raw: true },
    );
  },

  // Analytics + demo
  analytics: () => request<Analytics>("/analytics"),
  usage: () => request<Usage>("/usage"),
  seedDemo: () => request<{ seeded: boolean }>("/demo/seed", { method: "POST" }),
  resetWorkspace: () =>
    request<{ reset: boolean }>("/demo/reset", { method: "POST" }),
};
