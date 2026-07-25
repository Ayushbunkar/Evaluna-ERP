import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { cn } from "@evaluna/ui/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number; // percentage change
  trendLabel?: string;
  description?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, trendLabel, description }: KpiCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {trend !== undefined ? (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                "flex items-center text-xs font-medium",
                trend > 0 ? "text-emerald-500" : trend < 0 ? "text-rose-500" : "text-muted-foreground"
              )}
            >
              {trend > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : trend < 0 ? <ArrowDown className="h-3 w-3 mr-0.5" /> : null}
              {Math.abs(trend)}%
            </span>
            {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
          </div>
        ) : description ? (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}