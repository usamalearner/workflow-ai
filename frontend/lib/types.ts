export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";
export type FileType = "pdf" | "docx" | "xlsx" | "csv";
export type Priority = "low" | "medium" | "high" | "critical";
export type ActionStatus = "pending" | "in_progress" | "completed";
export type CommChannel = "email" | "whatsapp";
export type ReportType =
  | "executive_summary"
  | "technical_report"
  | "management_brief"
  | "risk_assessment"
  | "meeting_summary"
  | "document_comparison";

export interface Usage {
  documents_used: number;
  documents_limit: number;
  chat_used: number;
  chat_limit: number;
  reports_used: number;
  reports_limit: number;
}

export interface Doc {
  id: string;
  filename: string;
  original_filename: string;
  file_type: FileType;
  file_size: number;
  status: DocumentStatus;
  page_count: number;
  chunk_count: number;
  is_demo: boolean;
  error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Doc[];
  usage: Usage;
}

export interface DocumentPage {
  page_number: number;
  content: string;
}

export interface DocumentContent {
  document_id: string;
  filename: string;
  file_type: FileType;
  has_original_file: boolean;
  pages: DocumentPage[];
}

export interface Source {
  index: number;
  document_id: string;
  filename: string;
  page_number: number;
  chunk_number: number;
  snippet: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  message: ChatMessage;
  grounded: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface Action {
  id: string;
  title: string;
  description: string;
  owner: string;
  deadline: string | null;
  priority: Priority;
  status: ActionStatus;
  source_document_id: string | null;
  source_filename: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedAction {
  title: string;
  description: string;
  owner: string;
  deadline: string | null;
  priority: Priority;
  status: ActionStatus;
  source_filename: string | null;
}

export interface ExtractActionsResponse {
  document_id: string;
  count: number;
  by_priority: Record<string, number>;
  actions: ExtractedAction[];
}

export interface GeneratedComm {
  channel: CommChannel;
  subject: string | null;
  to: string;
  body: string;
}

export interface Report {
  id: string;
  title: string;
  report_type: ReportType;
  content: string;
  source_documents: string[];
  source_filenames: string[];
  is_demo: boolean;
  created_at: string;
}

export interface Summary {
  document_id: string;
  summary: string;
  key_points: string[];
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface Analytics {
  documents_processed: number;
  questions_answered: number;
  actions_extracted: number;
  reports_generated: number;
  estimated_minutes_saved: number;
  documents_over_time: TrendPoint[];
  actions_by_priority: TrendPoint[];
  time_saved_over_time: TrendPoint[];
  avg_review_before_min: number;
  avg_review_after_min: number;
  assumptions_note: string;
}

export interface ColumnStat {
  name: string;
  dtype: string;
  missing: number;
  mean: number | null;
  minimum: number | null;
  maximum: number | null;
  total: number | null;
}

export interface SpreadsheetAnalysis {
  document_id?: string | null;
  filename: string;
  overview: {
    rows: number;
    columns: number;
    missing_values: number;
    column_stats: ColumnStat[];
  };
  insights: string[];
  charts: { label: string; points: TrendPoint[] }[];
}
