"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { trpc } from "@/lib/trpc/client";
import { Map, Grid3X3, Layers, Settings, Maximize, Plus, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function WarehousePage() {
  const { data: zones, isLoading } = trpc.warehouse.list.useQuery();

  const totalCapacity = zones?.reduce((sum, zone) => sum + zone.capacity, 0) || 0;
  const totalUsed = zones?.reduce((sum, zone) => sum + zone.used, 0) || 0;
  const utilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Warehouse Mapping</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage zones, racks, and bin locations visually</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="shadow-sm">
            <Maximize className="mr-2 h-4 w-4" /> Layout View
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Zone
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Zones</CardTitle>
            <Map className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : new Set(zones?.map(z => z.zone)).size || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Racks</CardTitle>
            <Grid3X3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : zones?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Capacity</CardTitle>
            <Layers className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white flex items-baseline gap-2">
              {isLoading ? <Skeleton className="h-8 w-24" /> : 
                <>{totalUsed.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ {totalCapacity.toLocaleString()}</span></>
              }
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Space Utilization</CardTitle>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{utilization}%</span>
          </CardHeader>
          <CardContent>
            <div className="mt-2 h-4 w-full bg-green-200 dark:bg-green-900/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${utilization}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Zones & Racks</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search zone or rack..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Zone</th>
                  <th className="px-6 py-4">Rack ID</th>
                  <th className="px-6 py-4 text-right">Capacity (Bins)</th>
                  <th className="px-6 py-4 text-right">Used Space</th>
                  <th className="px-6 py-4">Utilization</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-2 w-full mt-2" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  zones?.map((zone, i) => {
                    const pct = Math.round((zone.used / zone.capacity) * 100);
                    return (
                      <motion.tr 
                        key={zone.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                          {zone.zone}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono font-medium">
                          {zone.rack}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {zone.capacity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                          {zone.used.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className={
                            zone.status === "active" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400" :
                            zone.status === "near_full" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400" :
                            zone.status === "full" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400" :
                            "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400"
                          }>
                            {zone.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
