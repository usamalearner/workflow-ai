import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  hint?: string;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <Card className="p-5 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>
      ) : null}
    </Card>
  );
}
