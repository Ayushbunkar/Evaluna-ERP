"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@evaluna/ui/components/table";
import { Badge } from "@evaluna/ui/components/badge";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Shield, Settings, Store, Banknote, Building2, Percent } from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@evaluna/ui/lib/utils";

// Mock data for Roles
const mockRoles = [
  { id: "1", name: "Admin", description: "Full system access", active: true },
  { id: "2", name: "Manager", description: "Store and staff management", active: true },
  { id: "3", name: "Auditor", description: "Read-only access to reports", active: true },
  { id: "4", name: "Cashier", description: "POS and basic inventory", active: true },
];

const modulesList = ["pos", "inventory", "staff", "settings", "products"];
const actionsList = ["view", "create", "update", "delete"];

// Mock permissions state
const initialPermissions: Record<string, Record<string, Record<string, boolean>>> = {};
mockRoles.forEach((role) => {
  initialPermissions[role.id] = {};
  modulesList.forEach((mod) => {
    initialPermissions[role.id][mod] = {};
    actionsList.forEach((act) => {
      // Admin gets all by default, others get some
      initialPermissions[role.id][mod][act] = role.name === "Admin" || (role.name === "Manager" && act !== "delete");
    });
  });
});

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [selectedRole, setSelectedRole] = useState(mockRoles[0]);
  const [permissionsState, setPermissionsState] = useState(initialPermissions);
  
  // General settings state
  const [storeName, setStoreName] = useState("Evaluna Superstore");
  const [currency, setCurrency] = useState("USD");
  
  // Products config state
  const [canUpdateProducts, setCanUpdateProducts] = useState<string[]>(["1", "2"]);

  const handleSaveGeneral = () => {
    toast.success("General settings updated successfully.");
  };

  const handleSavePermissions = () => {
    toast.success(`Permissions updated for ${selectedRole.name}.`);
  };
  
  const handleToggleProductRole = (roleId: string) => {
    setCanUpdateProducts(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const saveProductConfig = () => {
    toast.success("Products configuration saved.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings & Permissions</h1>
        <p className="text-muted-foreground">Manage global configurations, roles, branches, and taxes.</p>
      </div>

      <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col space-y-6">
        <TabsPrimitive.List className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit">
          <TabsPrimitive.Trigger
            value="general"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              activeTab === "general" && "bg-background text-foreground shadow-sm"
            )}
          >
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger
            value="roles"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              activeTab === "roles" && "bg-background text-foreground shadow-sm"
            )}
          >
            <Shield className="w-4 h-4 mr-2" />
            Roles & Permissions
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger
            value="branches"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              activeTab === "branches" && "bg-background text-foreground shadow-sm"
            )}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Branches
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger
            value="taxes"
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              activeTab === "taxes" && "bg-background text-foreground shadow-sm"
            )}
          >
            <Percent className="w-4 h-4 mr-2" />
            Tax Rates
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* General Tab */}
          <TabsPrimitive.Content value="general" className="outline-none space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Store Settings</CardTitle>
                <CardDescription>Update fundamental configurations for your business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input 
                      id="storeName" 
                      value={storeName} 
                      onChange={(e) => setStoreName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Code</Label>
                    <Input 
                      id="currency" 
                      value={currency} 
                      onChange={(e) => setCurrency(e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveGeneral}>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsPrimitive.Content>

          {/* Roles & Permissions Tab */}
          <TabsPrimitive.Content value="roles" className="outline-none space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Roles</CardTitle>
                <CardDescription>Manage user roles and their granular access permissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Badge variant={role.active ? "default" : "secondary"}>
                            {role.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedRole(role)}>
                                Edit Permissions
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Edit Permissions - {selectedRole?.name}</DialogTitle>
                                <DialogDescription>Configure module-level access for this role.</DialogDescription>
                              </DialogHeader>
                              
                              <div className="py-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Module</TableHead>
                                      {actionsList.map(act => (
                                        <TableHead key={act} className="text-center capitalize">{act}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {modulesList.map(mod => (
                                      <TableRow key={mod}>
                                        <TableCell className="font-medium capitalize">{mod}</TableCell>
                                        {actionsList.map(act => (
                                          <TableCell key={act} className="text-center">
                                            <input
                                              type="checkbox"
                                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                              checked={permissionsState[selectedRole?.id || ""]?.[mod]?.[act] || false}
                                              onChange={(e) => {
                                                const checked = e.target.checked;
                                                setPermissionsState(prev => ({
                                                  ...prev,
                                                  [selectedRole!.id]: {
                                                    ...prev[selectedRole!.id],
                                                    [mod]: {
                                                      ...prev[selectedRole!.id]?.[mod],
                                                      [act]: checked
                                                    }
                                                  }
                                                }));
                                              }}
                                            />
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              <DialogFooter>
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <DialogTrigger asChild>
                                  <Button onClick={handleSavePermissions}>Save Changes</Button>
                                </DialogTrigger>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Products Configuration</CardTitle>
                <CardDescription>Explicitly define which roles are allowed to update products catalog.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {mockRoles.map((role) => (
                    <label key={role.id} className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={canUpdateProducts.includes(role.id)}
                        onChange={() => handleToggleProductRole(role.id)}
                      />
                      <span className="text-sm font-medium">{role.name}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveProductConfig}>Save Product Configuration</Button>
              </CardFooter>
            </Card>
          </TabsPrimitive.Content>

          {/* Branches Tab */}
          <TabsPrimitive.Content value="branches" className="outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
                <CardDescription>Manage your store locations.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">Branch management coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsPrimitive.Content>

          {/* Taxes Tab */}
          <TabsPrimitive.Content value="taxes" className="outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Tax Rates</CardTitle>
                <CardDescription>Configure global and regional tax rates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground">Tax configuration coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsPrimitive.Content>
        </motion.div>
      </TabsPrimitive.Root>
    </div>
  );
}