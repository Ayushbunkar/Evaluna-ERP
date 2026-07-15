"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Skeleton } from "@evaluna/ui/components/skeleton";
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
import { Search, Plus, Tag, Percent } from "lucide-react";
import { motion } from "framer-motion";

export default function DiscountsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    discount_type: "percentage" | "flat";
    discount_value: number;
    min_order_value: number;
    usage_limit: number | null;
  }>({
    code: "",
    discount_type: "percentage",
    discount_value: 0,
    min_order_value: 0,
    usage_limit: null,
  });

  const utils = trpc.useUtils();
  const { data: coupons, isLoading } = trpc.marketing.listCoupons.useQuery();

  const createCoupon = trpc.marketing.createCoupon.useMutation({
    onSuccess: () => {
      toast.success("Coupon created successfully");
      setIsAddOpen(false);
      setNewCoupon({
        code: "",
        discount_type: "percentage",
        discount_value: 0,
        min_order_value: 0,
        usage_limit: null,
      });
      utils.marketing.listCoupons.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredCoupons = coupons?.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discounts & Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and promotional offers.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <Input 
                  placeholder="SUMMER2026" 
                  value={newCoupon.code} 
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newCoupon.discount_type}
                    onChange={(e: any) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input 
                    type="number"
                    placeholder="10" 
                    value={newCoupon.discount_value || ""} 
                    onChange={e => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimum Order Value (₹)</Label>
                <Input 
                  type="number"
                  placeholder="500" 
                  value={newCoupon.min_order_value || ""} 
                  onChange={e => setNewCoupon({ ...newCoupon, min_order_value: Number(e.target.value) })} 
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createCoupon.mutate({ ...newCoupon })}
                disabled={createCoupon.isPending || !newCoupon.code || !newCoupon.discount_value}
              >
                {createCoupon.isPending ? "Creating..." : "Save Coupon"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle>Active Coupons</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search codes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No coupons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons?.map((coupon, i) => (
                    <motion.tr
                      key={coupon.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{coupon.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <><Percent className="h-3 w-3" /> {coupon.discount_value}%</>
                          ) : (
                            <>₹{coupon.discount_value}</>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        ₹{coupon.min_order_value || '0.00'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? "default" : "secondary"}>
                          {coupon.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {coupon.usage_count || 0} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''} uses
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
