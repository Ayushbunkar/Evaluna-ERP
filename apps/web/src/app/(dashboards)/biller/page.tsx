"use client";

import { trpc } from "@/lib/trpc/client";
import { KPICard } from "@/components/shared/cards/kpi-card";
import { ActivityCard } from "@/components/shared/cards/activity-card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { DollarSign, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function BillerDashboard() {
  const { data, isLoading } = trpc.biller.dashboardOverview.useQuery();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Mock data if TRPC is not returning
  const metrics = data?.metrics || {
    totalSales: 15423.5,
    totalBills: 142,
    avgBillValue: 108.6,
    activeCashiers: 3,
  };

  const activities = data?.recentActivities || [
    { id: 1, title: "Bill #1042 Paid", description: "$120.50 via Card", time: "2 min ago" },
    { id: 2, title: "Bill #1041 Paid", description: "$45.00 via Cash", time: "15 min ago" },
    { id: 3, title: "Refund #1040", description: "$20.00 returned", time: "1 hour ago" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Today's Sales Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Sales" 
          value={`$${metrics.totalSales.toFixed(2)}`} 
          icon={<DollarSign className="w-4 h-4 text-muted-foreground" />} 
          description="+12.5% from yesterday"
        />
        <KPICard 
          title="Total Bills" 
          value={metrics.totalBills} 
          icon={<ShoppingCart className="w-4 h-4 text-muted-foreground" />} 
          description="+5 from yesterday"
        />
        <KPICard 
          title="Avg Bill Value" 
          value={`$${metrics.avgBillValue.toFixed(2)}`} 
          icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />} 
          description="Steady"
        />
        <KPICard 
          title="Active Cashiers" 
          value={metrics.activeCashiers} 
          icon={<Users className="w-4 h-4 text-muted-foreground" />} 
          description="Currently online"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          <motion.div 
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {activities.map((activity: any) => (
              <motion.div 
                key={activity.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <ActivityCard 
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
