"use client";

import { trpc } from "@/lib/trpc/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MapPinIcon,
} from "lucide-react";

const statusBadge = (status: string) => {
  if (status === "delivered") return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
  if (status === "out_for_delivery") return <Badge className="bg-blue-100 text-blue-800">Out for Delivery</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
};

export default function DeliveryPage() {
  const { data, isLoading } = trpc.delivery.getDashboard.useQuery({});

  const kpis = [
    { label: "Today's Deliveries", value: data?.todaysDeliveries?.toString() ?? "0", icon: TruckIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Completed", value: data?.completedDeliveries?.toString() ?? "0", icon: CheckCircleIcon, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending", value: data?.pendingDeliveries?.toString() ?? "0", icon: ClockIcon, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Failed", value: data?.failedDeliveries?.toString() ?? "0", icon: XCircleIcon, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <motion.div
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Delivery
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor deliveries, drivers, and logistics in real-time</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white gap-2">
          <TruckIcon className="w-4 h-4" />
          Assign Delivery
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`${kpi.bg} p-2 rounded-lg`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-6 w-20 mt-1" /> : <p className="text-xl font-bold">{kpi.value}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm flex gap-2 items-center">
              <MapPinIcon className="w-4 h-4 text-blue-600" /> Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-3">
                {(data?.activeDrivers ?? []).map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{driver.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{driver.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">🔋{driver.battery}%</span>
                      <Badge className={driver.status === "driving" ? "bg-blue-100 text-blue-800" : driver.status === "delivering" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {driver.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-semibold text-green-600">{data?.deliverySuccessRate}%</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg. Delivery Time</span>
                {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-semibold">{data?.averageDeliveryTime}</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">COD Collected</span>
                {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-semibold text-green-600">₹{data?.codCollection?.toLocaleString("en-IN")}</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vehicles Active</span>
                {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-semibold">{data?.vehiclesActive}</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Distance Travelled</span>
                {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="font-semibold">{data?.distanceTravelled} km</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-indigo-600" />
            Delivery Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.deliveryOrders ?? []).map((order, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{order.address}</TableCell>
                    <TableCell>{order.driver}</TableCell>
                    <TableCell className="font-semibold">₹{order.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell>{statusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
