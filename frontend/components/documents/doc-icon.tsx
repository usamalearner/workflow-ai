import { FileText, FileSpreadsheet, FileType2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { Icon: typeof FileText; class: string }> = {
  pdf: { Icon: FileText, class: "text-rose-400 bg-rose-500/10" },
  docx: { Icon: FileType2, class: "text-blue-400 bg-blue-500/10" },
  xlsx: { Icon: FileSpreadsheet, class: "text-emerald-400 bg-emerald-500/10" },
  csv: { Icon: FileSpreadsheet, class: "text-teal-400 bg-teal-500/10" },
};

export function DocIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const meta = MAP[type] ?? MAP.pdf;
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        meta.class,
        className,
      )}
    >
      <meta.Icon className="h-[18px] w-[18px]" />
    </div>
  );
}
