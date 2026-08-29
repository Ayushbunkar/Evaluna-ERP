"use client";

import { useEffect, useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { 
  Bell, 
  Clock, 
  Store, 
  RefreshCw, 
  Globe, 
  User as UserIcon,
  ShieldAlert,
  LogOut,
  Settings,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTRPC } from "@/lib/trpc/client";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";

export function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // State
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Queries
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const { data: branches } = trpc.branches.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();
  const { data: attendanceStatus } = trpc.attendance.myStatus.useQuery();

  // Handlers
  const handleLogout = async () => {
    try {
      await authClient.signOut();
      // Invalidate everything to be safe
      queryClient.clear();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Invalidate and refetch all active queries
      await queryClient.invalidateQueries();
    } finally {
      setTimeout(() => setIsSyncing(false), 500); // UI feedback
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  // Compute breadcrumb path
  const breadcrumbText = pathname === "/admin" 
    ? "/ Dashboard" 
    : `/ ${pathname.split("/").filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ")}`;

  // Determine Attendance State Label
  let attendanceLabel = "Clocked Out";
  let attendanceColor = "text-muted-foreground";
  if (attendanceStatus) {
    if (attendanceStatus.status === "present") {
      attendanceLabel = "Clocked In";
      attendanceColor = "text-green-600";
    } else if (attendanceStatus.status === "on_break") {
      attendanceLabel = "On Break";
      attendanceColor = "text-yellow-600";
    }
  }

  // Branch Selection Label
  const selectedBranchName = branches?.find((b: any) => b.id.toString() === selectedBranchId)?.name || "All Branches";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center gap-4 border-b border-border/50 bg-white/80 px-4 shadow-sm backdrop-blur-md dark:bg-gray-900/80 sm:px-6">
      
      {/* 1. Branding */}
      <div className="flex items-center gap-2">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
          </div>
          <span className="hidden font-bold text-foreground text-lg tracking-tight sm:inline-block">
            Evaluna ERP
          </span>
        </Link>
      </div>

      {/* 2. Breadcrumbs */}
      <div className="hidden flex-1 items-center gap-2 text-muted-foreground text-sm sm:flex">
        <span className="truncate max-w-[200px] lg:max-w-[400px]">
          {breadcrumbText}
        </span>
      </div>
      <div className="flex-1 sm:hidden" /> {/* Spacer for mobile */}

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        
        {/* 3. Sync Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleSync}
          disabled={isSyncing}
          title="Sync data"
          aria-label="Sync data"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
        </Button>

        {/* 4. Notification Button */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8" title="Notifications" aria-label="Notifications">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {(unreadCount as number) > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive"></span>
          )}
        </Button>

        <div className="hidden h-5 w-px bg-border/50 sm:block" />

        {/* 5. Attendance Status */}
        <Button variant="ghost" size="sm" className={`hidden h-8 gap-2 sm:flex ${attendanceColor}`} aria-label="Attendance status">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-xs">{attendanceLabel}</span>
        </Button>

        <div className="hidden h-5 w-px bg-border/50 sm:block" />

        {/* 6. Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden h-8 gap-2 sm:flex" aria-label="Select branch">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[100px] truncate text-xs">{selectedBranchName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelectedBranchId(null)}>
              All Branches
            </DropdownMenuItem>
            {branches?.map((branch: any) => (
              <DropdownMenuItem key={branch.id} onClick={() => setSelectedBranchId(branch.id.toString())}>
                {branch.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 7. Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Select language">
              <Globe className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
              English {locale === "en" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLanguageChange("hi")}>
              Hindi {locale === "hi" && "✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 8. User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border/50 bg-secondary/50" aria-label="Open profile menu">
              <UserIcon className="h-4 w-4 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {user?.name && <p className="font-medium text-sm">{user.name}</p>}
                {user?.email && (
                  <p className="w-[200px] truncate text-muted-foreground text-sm">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex cursor-pointer items-center">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="flex cursor-pointer items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
