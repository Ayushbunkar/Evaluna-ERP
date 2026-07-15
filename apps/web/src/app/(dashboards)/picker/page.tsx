"use client";

import React from "react";
import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { KPICard } from "@/components/shared/cards/kpi-card";
import { ActivityCard } from "@/components/shared/cards/activity-card";
import { ClipboardList, PackageOpen, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PickerDashboardPage() {
  const router = useRouter();
  
  // Using a mock TRPC route as requested for warehouse overview
  const { data, isLoading } = trpc.warehouse.getDashboardOverview.useQuery(undefined, {
    retry: false,
  });

  // Mock data fallback if TRPC is not connected
  const mockData = {
    pendingOrders: 12,
    activePickLists: 4,
    itemsPickedToday: 145,
    exceptions: 2,
    recentActivity: [
      { id: "1", title: "Order #4092 Picked", time: "10 mins ago", status: "completed" },
      { id: "2", title: "Exception on Order #4091", time: "1 hour ago", status: "cancelled" },
    ]
  };

  const dashboardData = data || mockData;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Picker Dashboard</h1>
        <p className="text-muted-foreground">Overview of your picking tasks and warehouse status.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={item}>
            <KPICard 
              title="Pending Orders" 
              value={dashboardData.pendingOrders.toString()} 
              icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} 
              description="Awaiting picking"
            />
          </motion.div>
          <motion.div variants={item}>
            <KPICard 
              title="Active Pick Lists" 
              value={dashboardData.activePickLists.toString()} 
              icon={<PackageOpen className="h-4 w-4 text-muted-foreground" />} 
              description="Currently in progress"
            />
          </motion.div>
          <motion.div variants={item}>
            <KPICard 
              title="Items Picked" 
              value={dashboardData.itemsPickedToday.toString()} 
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} 
              description="Completed today"
            />
          </motion.div>
          <motion.div variants={item}>
            <KPICard 
              title="Exceptions" 
              value={dashboardData.exceptions.toString()} 
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />} 
              description="Needs attention"
            />
          </motion.div>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="h-24 text-lg flex flex-col gap-2" 
              onClick={() => router.push('/picker/orders')}
            >
              <ClipboardList className="h-6 w-6" />
              View Pending Orders
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="h-24 text-lg flex flex-col gap-2" 
              onClick={() => router.push('/picker/pick-lists')}
            >
              <PackageOpen className="h-6 w-6" />
              Start Picking
            </Button>
            <Button 
              size="lg" 
              variant="destructive"
              className="h-24 text-lg flex flex-col gap-2 sm:col-span-2" 
              onClick={() => router.push('/picker/exceptions')}
            >
              <AlertTriangle className="h-6 w-6" />
              Report Exception
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity: any) => (
                  <ActivityCard 
                    key={activity.id}
                    title={activity.title}
                    description={activity.time}
                    status={activity.status}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}