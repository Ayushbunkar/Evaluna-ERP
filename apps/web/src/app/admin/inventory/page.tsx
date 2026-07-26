"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { trpc } from "@/lib/trpc/client";
import { Package, AlertTriangle, AlertCircle, ArrowRightLeft, Search, Plus, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function InventoryPage() {
  const { data: inventoryData, isLoading } = trpc.inventory.list.useQuery({});
  
  const items = inventoryData?.items || [];
  
  const lowStockCount = items.filter(i => i.status === "low_stock").length;
  const outOfStockCount = items.filter(i => i.status === "out_of_stock").length;
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track stock levels across all branches</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="shadow-sm">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Receive Items
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Unique SKUs</CardTitle>
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : items.length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Out of Stock</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : outOfStockCount}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Stock Value</CardTitle>
            <span className="h-5 w-5 text-green-600 dark:text-green-400 font-bold text-lg flex items-center justify-center">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : "1.2M"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Current Stock Levels</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search SKU or product..." 
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
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Branch Location</th>
                  <th className="px-6 py-4 text-right">Qty on Hand</th>
                  <th className="px-6 py-4 text-right">Reorder Level</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  items.map((item, i) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.product}</div>
                        <div className="text-gray-500 text-xs mt-1 font-mono">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {item.branch}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        {item.qty_on_hand}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {item.reorder_level}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className={
                          item.status === "in_stock" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400" :
                          item.status === "low_stock" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400" :
                          "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                        }>
                          {item.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs font-medium">
                          Update Qty
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
