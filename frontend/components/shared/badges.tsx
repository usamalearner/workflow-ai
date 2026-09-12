import { cn } from "@/lib/utils";
import { PRIORITY_META, STATUS_META } from "@/lib/constants";

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        meta.class,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.class,
      )}
    >
      {meta.label}
    </span>
  );
}
