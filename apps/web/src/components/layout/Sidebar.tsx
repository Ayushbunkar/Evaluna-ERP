"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@evaluna/ui/lib/utils";
import { LucideIcon, LayoutDashboard, ShoppingCart, Users, Package, Settings, LogOut } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
};

export const defaultNavItems: NavItem[] = [
  { title: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard, roles: ["manager", "admin"] },
  { title: "Sales", href: "/manager/sales", icon: ShoppingCart, roles: ["manager", "admin"] },
  { title: "Inventory", href: "/manager/inventory", icon: Package, roles: ["manager", "admin"] },
  { title: "Staff", href: "/manager/staff", icon: Users, roles: ["manager", "admin"] },
  { title: "Settings", href: "/manager/settings", icon: Settings, roles: ["manager", "admin"] },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: NavItem[];
  userRole?: string;
  onItemClick?: () => void;
}

export function Sidebar({ className, items = defaultNavItems, userRole = "manager", onItemClick, ...props }: SidebarProps) {
  const pathname = usePathname();
  
  const filteredItems = items.filter(item => item.roles.includes(userRole));

  return (
    <div className={cn("pb-12 h-screen border-r bg-card text-card-foreground flex flex-col", className)} {...props}>
      <div className="space-y-4 py-4 flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center gap-2">
            <span className="bg-primary text-primary-foreground p-1 rounded-md">
              <Package className="h-4 w-4" />
            </span>
            Evaluna ERP
          </h2>
          <div className="space-y-1 mt-6">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="px-3 py-4 mt-auto border-t">
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}
