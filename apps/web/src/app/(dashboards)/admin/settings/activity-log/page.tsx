"use client";

import { Button } from "@evaluna/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  ActivityIcon,
  BanknoteIcon,
  CalendarCheckIcon,
  ChartLineIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsActivityLogPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const { data } = await trpc.admin.getActivityLog.query();
      setActivities(data);
    } catch (err) {
      setError("Failed to load activity log");
      console.error("Activity log error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition className="container mx-auto py-8">
        <div className="flex h-[200px] items-center justify-center">
          Loading...
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition className="container mx-auto py-8">
        <div className="flex h-[200px] items-center justify-center">
          {error}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
            Activity Log
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            View recent system activities and audit trail
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Export Log
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/admin/settings">
              <ActivityIcon className="mr-2 h-4 w-4" /> Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No activity found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Time</TableHead>
                <TableHead className="text-left">User</TableHead>
                <TableHead className="text-left">Action</TableHead>
                <TableHead className="text-left">Module</TableHead>
                <TableHead className="text-left">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    {new Date(activity.timestamp).toLocaleString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        {activity.type === "staff" && (
                          <UsersIcon className="h-4 w-4 text-primary" />
                        )}
                        {activity.type === "supplier" && (
                          <BanknoteIcon className="h-4 w-4 text-primary" />
                        )}
                        {activity.type === "customer" && (
                          <UsersIcon className="h-4 w-4 text-primary" />
                        )}
                        {activity.type === "company" && (
                          <ChartLineIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-sm">
                        {activity.userId || "System"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{activity.type}</TableCell>
                  <TableCell>
                    {activity.type === "staff" && (
                      <UsersIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                    {activity.type === "supplier" && (
                      <BanknoteIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                    {activity.type === "customer" && (
                      <UsersIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                    {activity.type === "company" && (
                      <ChartLineIcon className="h-3 w-3 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {activity.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageTransition>
  );
}