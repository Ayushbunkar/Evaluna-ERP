"use client";

import { KpiCard } from "@/components/shared/cards/kpi-card";
import { ActivityCard, type ActivityItem } from "@/components/shared/cards/activity-card";
import { Button } from "@evaluna/ui/components/button";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Banknote,
  AlertTriangle,
  Receipt,
  Plus
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    title: "New Customer Registered",
    description: "Alice Smith signed up for loyalty",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    user: "Cashier 1",
    icon: <Users className="h-4 w-4 text-blue-500" />
  },
  {
    id: 2,
    title: "Large Order Processed",
    description: "Order #8932 totaling $1,250.00",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: "Cashier 2",
    icon: <ShoppingCart className="h-4 w-4 text-emerald-500" />
  },
  {
    id: 3,
    title: "Stock Alert",
    description: "Espresso Beans below minimum threshold",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    user: "System",
    icon: <AlertTriangle className="h-4 w-4 text-rose-500" />
  }
];

export default function ManagerOverviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branch Operations</h1>
          <p className="text-muted-foreground">Today's daily overview and operational metrics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/manager/billing">
              <Receipt className="mr-2 h-4 w-4" /> Start Billing
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/manager/expenses">
              <Plus className="mr-2 h-4 w-4" /> Record Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Daily Revenue"
          value="$4,250.00"
          icon={Banknote}
          trend={8.2}
          trendLabel="vs yesterday"
        />
        <KpiCard
          title="Pending Orders"
          value="12"
          icon={ShoppingCart}
          description="Requires fulfillment"
        />
        <KpiCard
          title="Low Stock Items"
          value="5"
          icon={Package}
          trend={-2}
          trendLabel="restocked today"
        />
        <KpiCard
          title="Staff Present"
          value="8 / 10"
          icon={Users}
          description="2 on leave"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Hourly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[350px] flex items-center justify-center border-dashed border-2 m-4 rounded-xl text-muted-foreground">
            Line Chart Component Placeholder
          </CardContent>
        </Card>

        <div className="col-span-3">
          <ActivityCard
            title="Recent Activity"
            description="Latest transactions and events in this branch."
            items={MOCK_ACTIVITY}
          />
        </div>
      </div>
    </div>
  );
}