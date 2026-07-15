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
import { Search, Undo2, PackageOpen } from "lucide-react";

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: orders, isLoading } = trpc.orders.list.useQuery();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const { data: orderDetails, isLoading: isLoadingDetails } = trpc.orders.get.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const processReturn = () => {
    // Mock return processing
    toast.success("Return processed and store credit issued!");
    setSelectedOrderId(null);
  };

  const filteredOrders = orders?.filter(o => 
    o.id.toString().includes(searchTerm) || 
    (o.customer?.name && o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Returns & Credit Notes</h1>
          <p className="text-muted-foreground">Process sales returns, restock inventory, and issue store credit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-[fit-content]">
          <CardHeader>
            <CardTitle>Find Order</CardTitle>
            <CardDescription>Search by order ID or customer name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : filteredOrders?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No orders found.</div>
              ) : (
                filteredOrders?.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedOrderId === order.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm">Order #{order.id}</span>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{order.customer?.name || 'Guest'}</span>
                      <span className="font-medium text-foreground">₹{order.total_amount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 min-h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
            <CardDescription>
              {selectedOrderId ? `Processing return for Order #${selectedOrderId}` : "Select an order to view details and process returns."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {!selectedOrderId ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 py-12">
                <PackageOpen className="h-16 w-16 opacity-20" />
                <p>No order selected</p>
              </div>
            ) : isLoadingDetails ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{orderDetails.customer?.name || 'Guest'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Original Total</p>
                    <p className="font-medium">₹{orderDetails.total_amount}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Items to Return</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Return Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderDetails.orderItems?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">{item.product?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.product?.category}</p>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.price}</TableCell>
                          <TableCell>
                            <select className="text-sm border rounded p-1 w-full max-w-[120px]">
                              <option>Restock</option>
                              <option>Damaged</option>
                            </select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedOrderId(null)}>Cancel</Button>
                  <Button onClick={processReturn} className="gap-2">
                    <Undo2 className="h-4 w-4" /> Issue Store Credit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">Order details not found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
