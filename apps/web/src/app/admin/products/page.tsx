"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { trpc } from "@/lib/trpc/client";
import { Box, Tag, Truck, DollarSign, Plus, Search, Filter, Edit, Trash } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductsPage() {
  const { data: products, isLoading } = trpc.products.list.useQuery();

  const categoriesCount = new Set(products?.map(p => p.category)).size;
  const suppliersCount = new Set(products?.map(p => p.supplier)).size;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Product Catalog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage items, pricing, and supplier details</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="shadow-sm">
            <Tag className="mr-2 h-4 w-4" /> Categories
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Products</CardTitle>
            <Box className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : products?.length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Categories</CardTitle>
            <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : categoriesCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Suppliers</CardTitle>
            <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : suppliersCount || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Margin</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? <Skeleton className="h-8 w-16" /> : "32%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Product Database</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search products by name or SKU..." 
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
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Cost Price (₹)</th>
                  <th className="px-6 py-4 text-right">Selling Price (₹)</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  products?.map((product, i) => {
                    const margin = Math.round(((product.price - product.cost) / product.cost) * 100);
                    return (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                          <div className="text-gray-500 text-xs mt-1 font-mono">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 font-normal">
                            {product.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 font-medium">
                          {product.cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                          {product.price.toFixed(2)}
                          <span className="block text-[10px] text-green-600 mt-1">{margin}% margin</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {product.supplier}
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
