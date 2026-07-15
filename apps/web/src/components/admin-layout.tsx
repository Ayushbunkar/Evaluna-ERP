"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Package2Icon,
  LayoutDashboardIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  MenuIcon,
  XIcon,
  ReceiptTextIcon,
  SettingsIcon,
  FileTextIcon,
  Building2Icon,
  ArrowLeftRightIcon,
  WifiOffIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  ClockIcon,
  BanknoteIcon,
  ShieldCheckIcon,
  HeartIcon,
  HeartIcon,
  GlobeIcon,
  MegaphoneIcon,
  BellIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { BranchProvider, useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

import { logout } from "@/app/login/actions";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";

interface NavItem {
  href: string;
  labelKey: "dashboard" | "cashier" | "products" | "customers" | "orders" | "paymentMethods" | "pos" | "invoices" | "suppliers" | "purchases" | "purchase-returns" | "cashbook" | "reports" | "branches" | "transfers" | "staff" | "expenses" | "settings" | "attendance" | "payroll" | "permissions" | "loyalty" | "marketing";
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/cashier", labelKey: "cashier", icon: DollarSignIcon },
  { href: "/admin/products", labelKey: "products", icon: PackageIcon },
  { href: "/admin/customers", labelKey: "customers", icon: UsersIcon },
  { href: "/admin/suppliers", labelKey: "suppliers", icon: UsersIcon },
  { href: "/admin/orders", labelKey: "orders", icon: ShoppingBagIcon },
  { href: "/admin/payment-methods", labelKey: "paymentMethods", icon: CreditCardIcon },
  { href: "/admin/pos", labelKey: "pos", icon: ShoppingCartIcon },
  { href: "/admin/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
  { href: "/admin/purchase-returns", labelKey: "purchase-returns", icon: ReceiptTextIcon },
  { href: "/admin/cash-book", labelKey: "cashbook", icon: DollarSignIcon },
  { href: "/admin/reports", labelKey: "reports", icon: FileTextIcon },
  { href: "/admin/branches", labelKey: "branches", icon: Building2Icon },
  { href: "/admin/transfers", labelKey: "transfers", icon: ArrowLeftRightIcon },
  { href: "/admin/staff", labelKey: "staff", icon: UsersIcon },
  { href: "/admin/attendance", labelKey: "attendance", icon: ClockIcon },
  { href: "/admin/payroll", labelKey: "payroll", icon: BanknoteIcon },
  { href: "/admin/permissions", labelKey: "permissions", icon: ShieldCheckIcon },
  { href: "/admin/loyalty", labelKey: "loyalty", icon: HeartIcon },
  { href: "/admin/marketing", labelKey: "marketing", icon: MegaphoneIcon },
  { href: "/admin/expenses", labelKey: "expenses", icon: DollarSignIcon },
];

function BranchSwitcher() {
  const { activeBranchId, setActiveBranchId } = useBranch();
  const { data: branchesList } = trpc.branches.list.useQuery();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Building2Icon className="h-3.5 w-3.5" />
          {activeBranchId
            ? branchesList?.find((b: any) => b.id === activeBranchId)?.name || "Branch"
            : "All Branches"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setActiveBranchId(null)}>
          <GlobeIcon className="h-3.5 w-3.5 mr-2" /> All Branches
        </DropdownMenuItem>
        {branchesList?.map((branch: any) => (
          <DropdownMenuItem key={branch.id} onClick={() => setActiveBranchId(branch.id)}>
            <Building2Icon className="h-3.5 w-3.5 mr-2" />
            {branch.name} {branch.is_headquarters ? "(HQ)" : ""}
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
            <Button variant="outline" size="icon" className="relative rounded-full shrink-0">
              <motion.div
                animate={unreadCount > 0 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
                transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
              >
                <BellIcon className="h-5 w-5" />
              </motion.div>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-background" />
              )}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const t = useTranslations("nav");

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
    // Check initial status
    setIsOffline(!navigator.onLine);

    // Add event listeners
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
    navItems.map((item) => [item.href, t(item.labelKey)])
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <NetworkStatusBanner />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-4 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden shrink-0"
          onClick={() => setMobileMenuOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">{t("openMenu")}</span>
        </Button>
        <Link
          href="/admin"
          className="hidden sm:flex items-center gap-2 text-lg font-semibold"
        >
          <Package2Icon className="h-6 w-6" />
          <span className="sr-only">{t("adminPanel")}</span>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold truncate">{pageNames[pathname]}</h1>
        
        {isOffline && (
          <div className="hidden sm:flex items-center gap-1.5 bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-semibold">
            <WifiOffIcon className="h-3.5 w-3.5" />
            Offline Mode
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isOffline && (
            <div className="sm:hidden flex items-center bg-red-100 text-red-800 p-1.5 rounded-md">
              <WifiOffIcon className="h-4 w-4" />
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isOffline || isSyncing}
            className="gap-2 hidden sm:flex"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span className="text-xs">Sync</span>
          </Button>

          <NotificationBell />
          <BranchSwitcher />
          <LocaleSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full shrink-0"
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/placeholder-user.jpg`}
                  width={36}
                  height={36}
                  alt="Avatar"
                  className="overflow-hidden rounded-full"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">{t("settings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>{t("support")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/backup`} download>
                  Download Local Backup
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>{t("logout")}</DropdownMenuItem>
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
            className="fixed inset-0 z-50 sm:hidden"
          >
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 w-64 bg-background border-r p-4 flex flex-col gap-2 overflow-y-auto"
            >
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-lg font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Package2Icon className="h-6 w-6" />
                <span>Evaluna ERP</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
              {navItems.map(({ href, labelKey, icon: Icon }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      pathname === href
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t(labelKey)}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <motion.aside
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed mt-[56px] inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex"
        >
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
              {navItems.map(({ href, labelKey, icon: Icon }, i) => (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 25 }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <Link
                        href={href}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          pathname === href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        } transition-colors hover:text-foreground md:h-8 md:w-8`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="sr-only">{t(labelKey)}</span>
                      </Link>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t(labelKey)}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>
        </motion.aside>
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="flex-1 p-3 sm:px-6 sm:py-0 overflow-x-hidden"
        >
          {children}
        </motion.main>
      </div>
      <ChatWidget />
    </div>
  );
}

// Wrap export with BranchProvider
export function AdminLayoutWithBranch({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      <AdminLayout>{children}</AdminLayout>
    </BranchProvider>
  );
}
