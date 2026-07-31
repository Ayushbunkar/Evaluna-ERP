"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { LayoutDashboard, Users, ShoppingCart, Activity, GripVertical, CheckCircle2, Circle } from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";

const roles = [
  { id: "admin", name: "Super Admin", icon: LayoutDashboard },
  { id: "sales", name: "Sales Manager", icon: ShoppingCart },
  { id: "hr", name: "HR Manager", icon: Users },
];

const availableWidgets = [
  { id: "w1", name: "Total Revenue KPI", category: "Sales", type: "KPI" },
  { id: "w2", name: "Recent Orders Table", category: "Sales", type: "Table" },
  { id: "w3", name: "Employee Count KPI", category: "HR", type: "KPI" },
  { id: "w4", name: "Leave Requests List", category: "HR", type: "List" },
  { id: "w5", name: "Inventory Value Chart", category: "Inventory", type: "Chart" },
  { id: "w6", name: "Low Stock Alerts", category: "Inventory", type: "Alerts" },
  { id: "w7", name: "System Health Status", category: "System", type: "Status" },
];

export default function DashboardBuilderPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [activeWidgets, setActiveWidgets] = useState<string[]>(["w1", "w2", "w7"]);

  const toggleWidget = (id: string) => {
    setActiveWidgets((prev) =>
      prev.includes(id) ? prev.filter((wId) => wId !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Builder</h1>
          <p className="text-muted-foreground mt-1">
            Customize dashboard layouts and widgets for different user roles.
          </p>
        </div>
        <Button>Save Configuration</Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Roles Sidebar */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Select a role to configure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => (
                <Button
                  key={role.id}
                  variant={selectedRole === role.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedRole(role.id);
                    // Mock changing layout
                    if (role.id === "sales") setActiveWidgets(["w1", "w2"]);
                    if (role.id === "hr") setActiveWidgets(["w3", "w4"]);
                    if (role.id === "admin") setActiveWidgets(["w1", "w2", "w3", "w5", "w7"]);
                  }}
                >
                  <role.icon className="mr-2 h-4 w-4" />
                  {role.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Builder Area */}
        <div className="col-span-9">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Available Widgets</CardTitle>
              <CardDescription>Drag or click to toggle widgets for the selected role.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableWidgets.map((widget) => {
                  const isActive = activeWidgets.includes(widget.id);
                  return (
                    <div
                      key={widget.id}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        isActive ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                      onClick={() => toggleWidget(widget.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <GripVertical className="text-muted-foreground h-5 w-5" />
                        <div>
                          <p className="font-medium">{widget.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{widget.category}</Badge>
                            <span className="text-xs text-muted-foreground">{widget.type}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        {isActive ? (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
