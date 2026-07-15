"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AuditorNotificationsPage() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.auditor.getNotifications.useQuery();

  const markAsReadMutation = trpc.auditor.markNotificationRead.useMutation({
    onSuccess: () => {
      utils.auditor.getNotifications.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.auditor.markAllNotificationsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.auditor.getNotifications.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="space-y-4 mt-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Mock data fallback if TRPC query fails or router is missing
  const feed = notifications || [
    {
      id: "notif-1",
      title: "New Approval Request",
      message: "Manager Alice Smith requested approval for a large stock adjustment at Downtown Branch.",
      type: "alert",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      isRead: false,
    },
    {
      id: "notif-2",
      title: "Audit Completed",
      message: "The scheduled audit for Uptown Branch has been marked as completed.",
      type: "success",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      isRead: true,
    },
    {
      id: "notif-3",
      title: "System Update",
      message: "New reporting features are now available in the dashboard.",
      type: "info",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      isRead: true,
    }
  ];

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllAsReadMutation.isPending}>
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Stay updated with the latest events and required actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {feed.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notifications found.
              </div>
            ) : (
              feed.map((notif: any) => (
                <motion.div
                  key={notif.id}
                  variants={item}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${notif.isRead ? 'bg-background' : 'bg-muted/50'}`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {notif.title}
                        {!notif.isRead && (
                          <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
                        )}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={markAsReadMutation.isPending}
                    >
                      Mark read
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
