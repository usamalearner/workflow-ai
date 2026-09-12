import { Brain, FileText, MessageSquareText, ListChecks, FileBarChart } from "lucide-react";

const NODES = [
  { icon: MessageSquareText, label: "Answers" },
  { icon: ListChecks, label: "Actions" },
  { icon: FileBarChart, label: "Reports" },
];

/** A sophisticated AI workplace command center — Documents → AI → outputs. */
export function CommandCenter() {
  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <svg
        viewBox="0 0 400 360"
        className="w-full"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(199 89% 52%)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(199 89% 52%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(186 94% 44%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[
          "M200 92 L200 150",
          "M200 210 L96 288",
          "M200 210 L200 288",
          "M200 210 L304 288",
        ].map((d, i) => (
          <path
            key={d}
            d={d}
            stroke="url(#wire)"
            strokeWidth="2"
            strokeDasharray="4 6"
            className="animate-[dash_1.2s_linear_infinite]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </svg>

      {/* Documents node */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <NodeChip icon={FileText} label="Documents" tone="muted" />
      </div>

      {/* AI Intelligence core */}
      <div className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <span className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse-ring" />
          <div className="relative flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border border-primary/40 bg-card shadow-lg shadow-primary/20">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              AI Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Output nodes */}
      <div className="absolute bottom-0 left-0 flex w-full justify-between px-1">
        {NODES.map((n) => (
          <NodeChip key={n.label} icon={n.icon} label={n.label} tone="accent" />
        ))}
      </div>
    </div>
  );
}

function NodeChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  tone: "muted" | "accent";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl border bg-card shadow-sm ${
          tone === "accent"
            ? "border-accent/40 text-accent"
            : "border-border text-muted-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
