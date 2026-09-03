"use client";

import { useTRPC } from "@/lib/trpc/client";
import { PageTransition } from "@/lib/animations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import {
  BellIcon,
  CheckCheckIcon,
  CheckIcon,
  Loader2Icon,
  AlertTriangleIcon,
  AlertCircleIcon,
  TrendingDownIcon,
  CalendarIcon,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function NotificationsPage() {
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  // 1. Query notifications
  const { data: notificationsList, isLoading, refetch } = trpc.notifications.list.useQuery(
    { limit: 50 },
    { refetchOnWindowFocus: true }
  );

  // 2. Mark Single Read Mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      toast.success("Notification marked as read");
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // 3. Mark All Read Mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
      utils.notifications.unreadCount.invalidate();
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const handleMarkRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate({});
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "low_stock":
        return <TrendingDownIcon className="h-5 w-5 text-red-500" />;
      case "expiry":
      case "warning":
        return <AlertTriangleIcon className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircleIcon className="h-5 w-5 text-rose-600" />;
      case "birthday":
      case "campaign":
        return <CalendarIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityBadgeColor = (priority: string | null) => {
    switch (priority) {
      case "critical":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200";
      case "high":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200";
    }
  };

  const hasUnread = notificationsList?.some((n) => !n.is_read);

  return (
    <PageTransition className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-blue-500" />
            In-App Notification Center
          </h2>
          <p className="text-muted-foreground text-sm">
            Access, view, and organize deep-linked workflows, alerts, and priority messages.
          </p>
        </div>
        {hasUnread && (
          <Button
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs shadow-sm bg-blue-600 hover:bg-blue-700 h-8"
          >
            <CheckCheckIcon className="mr-1.5 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-bold">Latest Notifications</CardTitle>
          <CardDescription>Up to 50 targeted alerts specifically addressed to your staff account</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notificationsList?.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex gap-4 transition-colors items-start hover:bg-slate-50/50 dark:hover:bg-slate-800/20 ${
                    !n.is_read ? "bg-blue-50/10 dark:bg-blue-900/5 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {getIconForType(n.type)}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${!n.is_read ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
                        {n.title}
                      </span>
                      {n.priority && n.priority !== "normal" && (
                        <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${getPriorityBadgeColor(n.priority)}`}>
                          {n.priority}
                        </Badge>
                      )}
                      {!n.is_read && (
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-[9px] uppercase tracking-wider font-semibold">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                    </span>
                  </div>

                  {!n.is_read && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markAsReadMutation.isPending}
                      className="h-8 w-8 text-slate-400 hover:text-blue-500"
                      title="Mark as Read"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {notificationsList?.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <BellIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-sm">Inbox is completely clear!</p>
                  <p className="text-xs mt-1">There are no unread notifications or alerts addressed to you.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
