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
import { Search, Plus, User, Edit, History } from "lucide-react";
import { motion } from "framer-motion";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.customers.list.useQuery();

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Customer created successfully");
      setIsAddOpen(false);
      setNewCustomer({ name: "", email: "", phone: "" });
      utils.customers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredCustomers = customers?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage customer profiles and outstanding balances.</p>
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
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  placeholder="John Doe" 
                  value={newCustomer.name} 
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  placeholder="john@example.com" 
                  value={newCustomer.email} 
                  onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  placeholder="+1 234 567 890" 
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} 
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createCustomer.mutate({ ...newCustomer })}
                disabled={createCustomer.isPending || !newCustomer.name || !newCustomer.email}
              >
                {createCustomer.isPending ? "Creating..." : "Save Customer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle>Customer List</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Store Credit / Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers?.map((customer, i) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">{customer.customer_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.email}</div>
                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={customer.loyalty_tier === 'gold' ? 'border-yellow-500 text-yellow-600' : ''}>
                          {customer.loyalty_tier || 'Bronze'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">₹{customer.store_credit || '0.00'}</div>
                        <div className="text-xs text-muted-foreground">{customer.loyalty_points || 0} pts</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
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
