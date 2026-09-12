import {
  LayoutDashboard,
  FileText,
  Sparkles,
  ListChecks,
  FileBarChart,
  BarChart3,
} from "lucide-react";

export const APP_NAME = "WorkFlow AI";
export const APP_TAGLINE = "Turn workplace information into action.";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

/** When Supabase isn't configured the whole app runs in demo mode. */
export const IS_DEMO = !SUPABASE_URL || !SUPABASE_KEY;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/copilot", label: "AI Copilot", icon: Sparkles },
  { href: "/dashboard/actions", label: "Actions", icon: ListChecks },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export const PRIORITY_META: Record<
  string,
  { label: string; class: string; dot: string }
> = {
  critical: {
    label: "Critical",
    class: "bg-destructive/10 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
  high: {
    label: "High",
    class: "bg-warning/10 text-warning border-warning/30",
    dot: "bg-warning",
  },
  medium: {
    label: "Medium",
    class: "bg-primary/10 text-primary border-primary/30",
    dot: "bg-primary",
  },
  low: {
    label: "Low",
    class: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

export const STATUS_META: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", class: "bg-primary/10 text-primary" },
  completed: { label: "Completed", class: "bg-success/10 text-success" },
  ready: { label: "Ready", class: "bg-success/10 text-success" },
  processing: { label: "Processing", class: "bg-primary/10 text-primary" },
  uploading: { label: "Uploading", class: "bg-muted text-muted-foreground" },
  failed: { label: "Failed", class: "bg-destructive/10 text-destructive" },
};

export const REPORT_TYPES = [
  {
    value: "executive_summary",
    label: "Executive Summary",
    desc: "A concise C-suite overview of findings and decisions.",
  },
  {
    value: "technical_report",
    label: "Technical Report",
    desc: "Detailed engineering analysis with specifics.",
  },
  {
    value: "management_brief",
    label: "Management Brief",
    desc: "Status, risks and recommended actions for managers.",
  },
  {
    value: "risk_assessment",
    label: "Risk Assessment",
    desc: "Identified risks, likelihood, impact and mitigation.",
  },
  {
    value: "meeting_summary",
    label: "Meeting Summary",
    desc: "Decisions, owners and follow-ups from meeting notes.",
  },
  {
    value: "document_comparison",
    label: "Document Comparison",
    desc: "Key differences and alignment across documents.",
  },
] as const;

export const SUGGESTED_QUESTIONS = [
  "What are the most critical issues in the latest maintenance report?",
  "Summarize this week's reports",
  "What actions are overdue?",
  "What does the SOP recommend for abnormal vibration?",
];
