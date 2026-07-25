"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  MenuIcon,
  XIcon,
  WifiOffIcon,
  RefreshCwIcon,
  Building2Icon,
  GlobeIcon,
  BellIcon,
  Package2Icon,
  type LucideIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@evaluna/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@evaluna/ui/components/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@evaluna/ui/components/tooltip";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { BranchProvider, useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";
import { logout } from "@/app/(auth)/login/actions";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: "Admin", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/40" },
  manager: { label: "Manager", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/40" },
  sales: { label: "Salesperson", color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/40" },
  biller: { label: "Biller", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/40" },
  auditor: { label: "Auditor", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-900/40" },
  picker: { label: "Picker", color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-100 dark:bg-cyan-900/40" },
  putter: { label: "Putter", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-100 dark:bg-teal-900/40" },
};

function BranchSwitcher() {
  const { activeBranchId, setActiveBranchId } = useBranch();
  const { data: branchesList } = trpc.branches.list.useQuery();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 px-3 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-all rounded-full shadow-sm text-xs font-medium">
          <Building2Icon className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline-block max-w-[120px] truncate">
            {activeBranchId
              ? branchesList?.find((b: any) => b.id === activeBranchId)?.name || "Branch"
              : "All Branches"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-xl shadow-xl border-border/50">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground uppercase tracking-wider">Switch Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setActiveBranchId(null)} className="rounded-md cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary">
          <GlobeIcon className="h-4 w-4 mr-2 opacity-70" /> All Branches
        </DropdownMenuItem>
        {branchesList?.map((branch: any) => (
          <DropdownMenuItem key={branch.id} onClick={() => setActiveBranchId(branch.id)} className="rounded-md cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary">
            <Building2Icon className="h-4 w-4 mr-2 opacity-70" />
            <span className="truncate">{branch.name} {branch.is_headquarters ? "(HQ)" : ""}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const { data: notifications } = trpc.notifications.list.useQuery(
    { is_read: false },
    { refetchInterval: 30000, refetchOnWindowFocus: true }
  );

  const unreadCount = notifications?.length || 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/admin/notifications">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-colors">
              <motion.div
                animate={unreadCount > 0 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
                transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
              >
                <BellIcon className="h-5 w-5 text-muted-foreground" />
              </motion.div>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent className="rounded-lg text-xs font-medium">Notifications</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AppLayout({ children, navItems, namespace = "nav", role }: { children: React.ReactNode; navItems: NavItem[]; namespace?: string; role?: string; }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const t = useTranslations(namespace);

  const handleSync = async () => {
    if (isOffline) {
      toast.error("Cannot sync while offline");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/sync`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sync complete. ${data.syncedCount} records synced.`);
      } else {
        toast.error(`Sync failed: ${data.error}`);
      }
    } catch (err) {
      toast.error("Failed to connect to sync server");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const pageNames: Record<string, string> = Object.fromEntries(
    navItems.map((item) => [item.href, t(item.labelKey as any)])
  );

  return (
    <div className="flex h-screen w-full flex-col bg-background selection:bg-primary/20 overflow-hidden">
      <NetworkStatusBanner />
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 shrink-0 transition-all">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-9 w-9 rounded-full hover:bg-accent/50 transition-colors"
          onClick={() => setMobileMenuOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Open Menu</span>
        </Button>
        
        <div className="flex items-center gap-2 md:w-[240px] shrink-0">
          <Package2Icon className="h-6 w-6 text-primary" />
          <span className="hidden md:inline-block font-bold tracking-tight text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Evaluna ERP
          </span>
          {role && ROLE_CONFIG[role] && (
            <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${ROLE_CONFIG[role].bg} ${ROLE_CONFIG[role].color} ml-1`}>
              {ROLE_CONFIG[role].label}
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>/</span>
          <span className="text-foreground">{pageNames[pathname] || "Dashboard"}</span>
        </div>
        
        {isOffline && (
          <div className="hidden md:flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-destructive/20 shadow-sm">
            <WifiOffIcon className="h-3.5 w-3.5" />
            Offline Mode
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {isOffline && (
            <div className="md:hidden flex items-center bg-destructive/10 text-destructive p-1.5 rounded-full ring-1 ring-destructive/20">
              <WifiOffIcon className="h-4 w-4" />
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isOffline || isSyncing}
            className="gap-2 hidden md:flex h-9 rounded-full border-border/50 bg-background/50 hover:bg-accent/50 shadow-sm transition-all text-xs font-medium"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 text-muted-foreground ${isSyncing ? "animate-spin text-primary" : ""}`} />
            Sync
          </Button>

          <NotificationBell />
          <BranchSwitcher />
          
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all ring-1 ring-border/50 shadow-sm"
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/placeholder-user.jpg`}
                  width={36}
                  height={36}
                  alt="Avatar"
                  className="object-cover"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border/50">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground">Admin User</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-md cursor-pointer focus:bg-accent/50">
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-md cursor-pointer focus:bg-accent/50">Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-md cursor-pointer focus:bg-accent/50">
                <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/backup`} download>
                  Download Local Backup
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="rounded-md cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-background border-r border-border/40 p-4 flex flex-col gap-2 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <Package2Icon className="h-6 w-6 text-primary" />
                  <span className="font-bold tracking-tight text-lg">Evaluna ERP</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full h-8 w-8 hover:bg-accent/50"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex-1 space-y-1">
                {navItems.map(({ href, labelKey, icon: Icon }, i) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {t(labelKey as any)}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isSidebarCollapsed ? 64 : 240 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden md:flex flex-col border-r border-border/40 bg-background/50 backdrop-blur-xl relative group z-10 shrink-0"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border/50 bg-background shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>

          <TooltipProvider delayDuration={0}>
            <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 overflow-x-hidden no-scrollbar">
              {navItems.map(({ href, labelKey, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                
                const NavLink = (
                  <Link
                    href={href}
                    className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all relative ${
                      isActive
                        ? "text-primary font-medium bg-primary/10"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav-indicator"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <AnimatePresence>
                      {!isSidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="truncate whitespace-nowrap"
                        >
                          {t(labelKey as any)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );

                if (isSidebarCollapsed) {
                  return (
                    <Tooltip key={href}>
                      <TooltipTrigger asChild>
                        {NavLink}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="rounded-lg text-xs font-medium border-border/50 ml-2">
                        {t(labelKey as any)}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={href}>{NavLink}</div>;
              })}
            </div>
          </TooltipProvider>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20 relative">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
            className="p-4 md:p-6 max-w-7xl mx-auto w-full h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      <ChatWidget />
    </div>
  );
}

export function AppLayoutWithBranch({ children, navItems, namespace, role }: { children: React.ReactNode; navItems: NavItem[]; namespace?: string; role?: string }) {
  return (
    <BranchProvider>
      <AppLayout navItems={navItems} namespace={namespace} role={role}>{children}</AppLayout>
    </BranchProvider>
  );
}
