"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { trpc } from "@/lib/trpc/client";
import { MapPin, Users, Building, Plus, Search, MoreVertical, Edit, Trash } from "lucide-react";
import { motion } from "framer-motion";

export default function BranchesPage() {
  const { data: branches, isLoading } = trpc.branches.list.useQuery();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Branches</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your distribution centers and retail hubs</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Branch
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Branches</CardTitle>
            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : branches?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Branches</CardTitle>
            <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : branches?.filter(b => b.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Managers</CardTitle>
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : new Set(branches?.map(b => b.manager)).size || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Branch Directory</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search branches..." 
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-900"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Branch Code & Name</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  branches?.map((branch, i) => (
                    <motion.tr 
                      key={branch.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{branch.name}</div>
                        <div className="text-gray-500 text-xs mt-1">{branch.code} {branch.is_headquarters && <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">HQ</Badge>}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {branch.address}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                            {branch.manager.charAt(0)}
                          </div>
                          {branch.manager}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-gray-300">{branch.contact}</div>
                        <div className="text-gray-500 text-xs mt-1">{branch.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          branch.status === "active" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400" :
                          branch.status === "maintenance" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400" :
                          "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                        }>
                          {branch.status.charAt(0).toUpperCase() + branch.status.slice(1).replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
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
