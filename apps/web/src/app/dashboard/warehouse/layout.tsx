"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@evaluna/ui/components/button";
import {
  WarehouseIcon,
  TruckIcon,
  BoxesIcon,
  CheckSquareIcon,
  PackageIcon,
  ClipboardListIcon,
  UsersIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  BellIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  LogOutIcon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react";
import { useTRPC } from "@/lib/trpc/client";
import { toast } from "sonner";

export default function WarehouseWMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const trpc = useTRPC();
  const utils = trpc.useUtils();

  // Collapsible sidebar state (desktop)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync state
  const [syncTime, setSyncTime] = useState<string>("now");
  const [isSyncing, setIsSyncing] = useState(false);

  // Queries for dynamic counters
  const { data: stats, refetch: refetchStats } = trpc.warehouse.getOverviewStats.useQuery(
    {},
    {
      refetchInterval: 30000, // poll every 30s
    }
  );

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        refetchStats(),
        utils.warehouse.getReceivingPOs.invalidate(),
        utils.warehouse.getPutAwayQueue.invalidate(),
        utils.warehouse.getPickingQueue.invalidate(),
        utils.warehouse.getPackingQueue.invalidate(),
      ]);
      setSyncTime(new Date().toLocaleTimeString());
      toast.success("All WMS queues synced in real-time.");
    } catch (e) {
      toast.error("Live sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setSyncTime(new Date().toLocaleTimeString());
  }, []);

  // Compute breadcrumbs based on pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const isLast = index === parts.length - 1;
      const formatted = part.charAt(0).toUpperCase() + part.slice(1).replace("-", " ");
      return {
        label: formatted,
        href: "/" + parts.slice(0, index + 1).join("/"),
        isLast,
      };
    });
  };

  const navGroups = [
    {
      title: "Warehouse",
      items: [
        { label: "Dashboard", href: "/dashboard/warehouse", icon: WarehouseIcon },
      ],
    },
    {
      title: "Inbound",
      items: [
        { label: "Receiving", href: "/dashboard/warehouse/receiving", icon: TruckIcon, badge: stats?.receivingQueue },
        { label: "Inspections", href: "/dashboard/warehouse/inspections", icon: ClipboardListIcon },
        { label: "Put-Away", href: "/dashboard/warehouse/put-away", icon: BoxesIcon, badge: stats?.putAwayQueue },
      ],
    },
    {
      title: "Inventory",
      items: [
        { label: "Warehouse Stock", href: "/dashboard/warehouse/stock", icon: BoxesIcon },
      ],
    },
    {
      title: "Outbound",
      items: [
        { label: "Picking Queue", href: "/dashboard/warehouse/picking", icon: CheckSquareIcon, badge: stats?.pickingQueue },
        { label: "Packing Queue", href: "/dashboard/warehouse/packing", icon: PackageIcon, badge: stats?.packingQueue },
      ],
    },
    {
      title: "Task Management",
      items: [
        { label: "All Tasks", href: "/dashboard/warehouse/tasks", icon: ClipboardListIcon },
        { label: "Exceptions", href: "/dashboard/warehouse/exceptions", icon: AlertTriangleIcon, badge: stats?.delayedTasks, badgeVariant: "destructive" },
      ],
    },
    {
      title: "Workforce",
      items: [
        { label: "Operators", href: "/dashboard/warehouse/workforce", icon: UsersIcon },
      ],
    },
    {
      title: "Analytics",
      items: [
        { label: "WMS Analytics", href: "/dashboard/warehouse/analytics", icon: BarChart3Icon },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col border-gray-200 border-r bg-white dark:border-gray-700 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20">
            <WarehouseIcon className="h-5 w-5 text-blue-600" />
          </span>
          {!sidebarCollapsed && (
            <span className="font-bold text-gray-900 text-lg dark:text-gray-100">
              Evaluna WMS
            </span>
          )}
        </Link>
        {/* Toggle inside mobile drawer */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            {!sidebarCollapsed && (
              <h4 className="px-3 font-semibold text-gray-400 text-xs uppercase tracking-wider dark:text-gray-500">
                {group.title}
              </h4>
            )}
            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={itemIdx}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold"
                          : "text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-gray-700 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                            item.badgeVariant === "destructive"
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-blue-500 text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <a
          href="/api/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/25 dark:hover:text-red-400"
        >
          <LogOutIcon className="h-4.5 w-4.5 text-gray-400" />
          {!sidebarCollapsed && <span>Logout</span>}
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar (Persistent) */}
      <aside
        className={`hidden md:block h-full transition-all duration-300 flex-shrink-0 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-gray-900/60 backdrop-blur-sm">
          <div className="w-64 h-full animate-slide-in">{sidebarContent}</div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Right Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top ERP Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-gray-800 px-4 md:px-6 flex-shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-4">
            {/* Burger Trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            {/* Collapse Trigger for Desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 font-medium">
              <span className="text-gray-400">Warehouse</span>
              {getBreadcrumbs().map((b, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span className="text-gray-300">/</span>
                  {b.isLast ? (
                    <span className="text-gray-800 dark:text-gray-100 font-semibold">{b.label}</span>
                  ) : (
                    <Link href={b.href} className="hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
                      {b.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Global live sync status */}
            <div className="hidden lg:flex items-center gap-2 border rounded-full px-3 py-1 bg-gray-50 dark:bg-gray-700 text-[11px] font-semibold text-gray-500 dark:text-gray-300 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
              <span>LIVE</span>
              <span className="text-gray-300">|</span>
              <span className="font-medium text-gray-400">SYNCED {syncTime}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={handleManualSync}
                disabled={isSyncing}
              >
                <RefreshCwIcon className={`h-3 w-3 ${isSyncing ? "animate-spin text-blue-500" : ""}`} />
              </Button>
            </div>

            {/* Global Selector */}
            <div className="relative">
              <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-700 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                <span className="text-blue-600 dark:text-blue-400">Bhopal Main Warehouse</span>
                <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>

            {/* Notifications icon */}
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {stats?.delayedTasks !== undefined && stats.delayedTasks > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>
              )}
            </Button>

            {/* Profile trigger */}
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="rounded-full border shadow-sm">
                <UserIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Content Container (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
