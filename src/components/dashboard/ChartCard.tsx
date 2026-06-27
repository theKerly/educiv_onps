import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

export function ChartCard({
  title, description, children, action,
}: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-2 h-[280px]">{children}</CardContent>
    </Card>
  );
}