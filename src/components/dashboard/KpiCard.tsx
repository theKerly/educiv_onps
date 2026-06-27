import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: number; positive?: boolean };
  icon?: ReactNode;
  accent?: "primary" | "accent" | "info" | "warn" | "danger";
  className?: string;
}

const ACCENTS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "border-l-[var(--ci-orange)]",
  accent:  "border-l-[var(--ci-green)]",
  info:    "border-l-[var(--kpi-info)]",
  warn:    "border-l-[var(--kpi-warn)]",
  danger:  "border-l-[var(--kpi-down)]",
};

export function KpiCard({ label, value, hint, trend, icon, accent = "primary", className }: KpiCardProps) {
  return (
    <Card className={cn("border-l-4", ACCENTS[accent], className)}>
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          {(hint || trend) && (
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    "font-medium",
                    trend.positive ? "text-[color:var(--kpi-up)]" : "text-[color:var(--kpi-down)]"
                  )}
                >
                  {trend.positive ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}%
                </span>
              )}
              {hint && <span className="truncate">{hint}</span>}
            </div>
          )}
        </div>
        {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
      </CardContent>
    </Card>
  );
}