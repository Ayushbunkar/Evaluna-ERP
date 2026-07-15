"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evaluna/ui/components/table";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Search, Users, History, Mail, Phone, Award } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function CustomerDetailDialog({ customerId, open, onOpenChange }: { customerId: number | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = trpc.customers.getById.useQuery(
    { id: customerId as number },
    { enabled: !!customerId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Customer History & LTV</DialogTitle>
        </DialogHeader>
        
        {isLoading || !data ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{data.customer.name}</h3>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center"><Mail className="mr-1 h-3 w-3" /> {data.customer.email}</span>
                  {data.customer.phone && <span className="flex items-center"><Phone className="mr-1 h-3 w-3" /> {data.customer.phone}</span>}
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center">
                <Award className="mr-1 h-3 w-3" />
                {data.customer.loyalty_tier || "Standard"} Tier
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Store Credit</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold">${parseFloat(data.customer.store_credit || "0").toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm text-muted-foreground">Lifetime Points</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold">{data.customer.loyalty_points || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <History className="mr-2 h-4 w-4" /> Recent Orders
              </h4>
              <div className="border rounded-md max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customer.orders?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No recent orders</TableCell>
                      </TableRow>
                    ) : (
                      data.customer.orders?.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>{order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "N/A"}</TableCell>
                          <TableCell>${parseFloat(order.total_amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.status === 'completed' ? 'border-emerald-500 text-emerald-500' :
                              order.status === 'cancelled' ? 'border-amber-500 text-amber-500' : 'border-primary text-primary'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  const { data: customers, isLoading } = trpc.customers.list.useQuery();

  const filteredCustomers = customers?.filter((c) => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || c.customer_code?.toLowerCase().includes(term);
  }) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer History</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into customer lifetime value, store credit, and past orders.
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>Click on a customer to view their deep-dive history.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                        onClick={() => setSelectedCustomerId(customer.id)}
                      >
                        <TableCell className="font-medium">{customer.customer_code}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{customer.email}</div>
                          {customer.phone && <div className="text-xs text-muted-foreground">{customer.phone}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {customer.loyalty_tier || "Standard"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View History
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDetailDialog 
        customerId={selectedCustomerId} 
        open={!!selectedCustomerId} 
        onOpenChange={(open) => !open && setSelectedCustomerId(null)} 
      />
    </div>
  );
}
