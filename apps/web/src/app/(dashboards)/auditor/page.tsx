"use client";

import React from "react";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { KpiCard } from "@/components/shared/cards/kpi-card";
import { ActivityCard } from "@/components/shared/cards/activity-card";
import { motion } from "framer-motion";
import { ClipboardCheck, AlertTriangle, Clock, TrendingDown } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AuditorDashboardPage() {
  // Replace with actual TRPC endpoint when available
  const { data: stats, isLoading } = trpc.audits?.stats?.useQuery(undefined, {
    enabled: false,
  }) ?? { data: null, isLoading: false };

  // Mock data for display
  const mockStats = {
    totalAudits: 142,
    pendingReviews: 12,
    discrepancyValue: 4520.5,
    completedThisWeek: 8,
  };

  const mockActivities = [
    { id: "1", title: "Audit Complete - Branch A", description: "All items matched expected counts.", date: new Date().toISOString(), type: "success" },
    { id: "2", title: "Discrepancy Found - Branch B", description: "Missing 5 units of Product X.", date: new Date(Date.now() - 86400000).toISOString(), type: "warning" },
    { id: "3", title: "New Audit Scheduled", description: "Audit for Main Warehouse starting tomorrow.", date: new Date(Date.now() - 172800000).toISOString(), type: "info" },
  ];

  const displayStats = stats || mockStats;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditor Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of stock audits and inventory discrepancies.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <KpiCard
              title="Total Audits"
              value={displayStats.totalAudits.toString()}
              icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
              description="All time audits completed"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KpiCard
              title="Pending Reviews"
              value={displayStats.pendingReviews.toString()}
              icon={<Clock className="h-4 w-4 text-amber-500" />}
              description="Requires manager approval"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KpiCard
              title="Discrepancy Value"
              value={`$${displayStats.discrepancyValue.toLocaleString()}`}
              icon={<TrendingDown className="h-4 w-4 text-red-500" />}
              description="Total value of missing items"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <KpiCard
              title="Completed This Week"
              value={displayStats.completedThisWeek.toString()}
              icon={<AlertTriangle className="h-4 w-4 text-blue-500" />}
              description="Recent audit velocity"
            />
          </motion.div>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full lg:col-span-4">
          <ActivityCard
            title="Recent Audit Activity"
            description="Latest events from inventory verifications."
            activities={mockActivities}
          />
        </div>
      </div>
    </div>
  );
}