"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Badge } from "@evaluna/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Label } from "@evaluna/ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@evaluna/ui/components/tabs";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { Users, Search, Plus, Filter, Award, CreditCard, Clock, ChevronRight } from "lucide-react";
import { KPICard } from "@/components/shared/cards/kpi-card";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: customers, isLoading: isLoadingCustomers } = trpc.customers.list.useQuery();
  const { data: customerDetail, isLoading: isLoadingDetail } = trpc.customers.getById.useQuery(
    { id: selectedCustomerId as string },
    { enabled: !!selectedCustomerId }
  );

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer added successfully!");
      setIsAddOpen(false);
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Error adding customer: ${error.message}`);
    },
  });

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      marketingOptIn: formData.get("marketing") === "on",
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "bronze":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "silver":
        return "bg-slate-100 text-slate-800 hover:bg-slate-200";
      case "gold":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "platinum":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your branch customers and loyalty.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" required placeholder="+1 234 567 8900" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="123 Main St" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="marketing" name="marketing" className="rounded border-gray-300" />
                <Label htmlFor="marketing" className="font-normal">
                  Opt-in for marketing emails/SMS
                </Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Customer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mock Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <h3 className="text-2xl font-bold mt-1">2,481</h3>
              </div>
              <Users className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active (30d)</p>
                <h3 className="text-2xl font-bold mt-1">842</h3>
              </div>
              <Clock className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Loyalty Members</p>
                <h3 className="text-2xl font-bold mt-1">1,940</h3>
              </div>
              <Award className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Spend</p>
                <h3 className="text-2xl font-bold mt-1">$148.50</h3>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle>Customer Directory</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingCustomers ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody as={motion.tbody} variants={container} initial="hidden" animate="show">
                  {customers?.map((customer: any) => (
                    <motion.tr key={customer.id} variants={item} className="group">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.phone}</div>
                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierColor(customer.loyaltyTier)} variant="secondary">
                          {customer.loyaltyTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{customer.points}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ${customer.storeCredit?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.lastPurchase ? format(new Date(customer.lastPurchase), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCustomerId(customer.id)}>
                              View Profile <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Customer Profile</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6">
                              {isLoadingDetail ? (
                                <Skeleton className="h-40 w-full" />
                              ) : (
                                <>
                                  <div className="flex items-start justify-between bg-muted/50 p-6 rounded-lg">
                                    <div>
                                      <h2 className="text-2xl font-bold">{customerDetail?.name}</h2>
                                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                        <span>{customerDetail?.phone}</span>
                                        <span>{customerDetail?.email}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge className={getTierColor(customerDetail?.loyaltyTier)} variant="secondary" text="lg">
                                        {customerDetail?.loyaltyTier}
                                      </Badge>
                                      <div className="mt-2 font-semibold">Points: {customerDetail?.points}</div>
                                    </div>
                                  </div>

                                  <Tabs defaultValue="orders">
                                    <TabsList>
                                      <TabsTrigger value="orders">Order History</TabsTrigger>
                                      <TabsTrigger value="loyalty">Loyalty Points</TabsTrigger>
                                      <TabsTrigger value="ledger">Ledger / Credit</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="orders" className="pt-4">
                                      {/* Mock Order History */}
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Order #</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>ORD-1029</TableCell>
                                            <TableCell>{format(new Date(), "MMM d, yyyy")}</TableCell>
                                            <TableCell><Badge className="bg-green-100 text-green-800">Completed</Badge></TableCell>
                                            <TableCell className="text-right">$45.00</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>ORD-0988</TableCell>
                                            <TableCell>{format(new Date(Date.now() - 864000000), "MMM d, yyyy")}</TableCell>
                                            <TableCell><Badge className="bg-green-100 text-green-800">Completed</Badge></TableCell>
                                            <TableCell className="text-right">$120.50</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </TabsContent>
                                    <TabsContent value="loyalty" className="pt-4">
                                      <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold">Points History</h3>
                                        <Button size="sm">Adjust Points</Button>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell>{format(new Date(), "MMM d, yyyy")}</TableCell>
                                            <TableCell>Purchase ORD-1029</TableCell>
                                            <TableCell className="text-right text-green-600">+45</TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell>{format(new Date(Date.now() - 400000000), "MMM d, yyyy")}</TableCell>
                                            <TableCell>Reward Redemption</TableCell>
                                            <TableCell className="text-right text-red-600">-100</TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </TabsContent>
                                    <TabsContent value="ledger" className="pt-4">
                                      <p className="text-sm text-muted-foreground">Store credit balance: <strong>${customerDetail?.storeCredit || "0.00"}</strong></p>
                                    </TabsContent>
                                  </Tabs>
                                </>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
