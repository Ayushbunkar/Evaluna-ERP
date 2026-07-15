"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
  Bell,
  BellOff,
  AlertTriangle,
  Package,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Info,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@evaluna/ui/lib/utils";
import { useState } from "react";

type NotificationType = "low_stock" | "order" | "damage" | "payment" | "info" | string;

const NOTIFICATION_ICON: Record<string, React.ElementType> = {
  low_stock: Package,
  order: ShoppingCart,
  damage: XCircle,
  payment: CheckCircle2,
  info: Info,
  alert: AlertTriangle,
};

const NOTIFICATION_COLOR: Record<string, string> = {
  low_stock: "text-amber-500",
  order: "text-blue-500",
  damage: "text-rose-500",
  payment: "text-emerald-500",
  info: "text-sky-500",
  alert: "text-orange-500",
};

type FilterType = "all" | "unread" | "read";

export default function ManagerNotificationsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const utils = trpc.useUtils();

  const { data: notificationsData, isLoading } = trpc.notifications.list.useQuery({
    is_read: filter === "all" ? undefined : filter === "unread" ? false : true,
  } as any);

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
    },
    onError: () => toast.error("Failed to mark as read"),
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.notifications.list.invalidate();
    },
    onError: () => toast.error("Failed to mark all as read"),
  });

  const notifications = (notificationsData as any) ?? [];
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: `Unread (${unreadCount})`, value: "unread" },
    { label: "Read", value: "read" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Branch alerts, stock warnings, and system messages.
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead.mutate({} as any)}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Bell className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">
            You have {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md transition-all font-medium",
              filter === tab.value
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <motion.div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification: any, i: number) => {
                  const IconComponent =
                    NOTIFICATION_ICON[notification.type] ?? Info;
                  const iconColor =
                    NOTIFICATION_COLOR[notification.type] ?? "text-muted-foreground";

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        "flex items-start gap-4 p-4 hover:bg-accent/40 transition-colors group",
                        !notification.is_read && "bg-primary/5"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background",
                          !notification.is_read && "border-primary/20"
                        )}
                      >
                        <IconComponent className={cn("h-5 w-5", iconColor)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              !notification.is_read ? "font-semibold" : "font-medium text-muted-foreground"
                            )}
                          >
                            {notification.title || notification.message}
                          </p>
                          {!notification.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                          )}
                        </div>
                        {notification.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.created_at),
                              { addSuffix: true }
                            )}
                          </span>
                          <Badge variant="secondary" className="text-xs py-0 capitalize">
                            {(notification.type ?? "info").replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 text-xs"
                          onClick={() =>
                            markAsRead.mutate({ id: notification.id })
                          }
                          disabled={markAsRead.isPending}
                        >
                          Mark read
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}