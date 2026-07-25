import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp: Date;
  icon?: React.ReactNode;
  user?: string;
}

interface ActivityCardProps {
  title: string;
  description?: string;
  items: ActivityItem[];
  emptyMessage?: string;
}

export function ActivityCard({ title, description, items, emptyMessage = "No recent activity." }: ActivityCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px] px-6 pb-6">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="relative flex gap-4">
                  {/* Timeline connector */}
                  {index !== items.length - 1 && (
                    <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
                  )}
                  
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border">
                    {item.icon || <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  
                  <div className="flex flex-col flex-1 space-y-1 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {item.user && (
                      <p className="text-xs font-medium text-primary mt-1">{item.user}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}