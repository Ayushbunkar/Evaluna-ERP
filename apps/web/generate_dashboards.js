const fs = require('fs');
const path = require('path');

const modules = [
  {
    name: 'picker',
    role: 'picker',
    navItems: [
      { href: "/picker", labelKey: "dashboard", icon: "LayoutDashboardIcon" },
      { href: "/picker/pick-lists", labelKey: "pickLists", icon: "ListIcon" },
      { href: "/picker/tasks", labelKey: "currentTask", icon: "ClipboardListIcon" },
      { href: "/picker/completed", labelKey: "completed", icon: "CheckCircleIcon" },
      { href: "/picker/pending", labelKey: "pending", icon: "ClockIcon" },
      { href: "/picker/returns", labelKey: "returns", icon: "RotateCcwIcon" },
      { href: "/picker/reports", labelKey: "reports", icon: "FileTextIcon" }
    ]
  },
  {
    name: 'putter',
    role: 'putter',
    navItems: [
      { href: "/putter", labelKey: "dashboard", icon: "LayoutDashboardIcon" },
      { href: "/putter/receiving", labelKey: "receiving", icon: "DownloadIcon" },
      { href: "/putter/put-away", labelKey: "putAway", icon: "PackagePlusIcon" },
      { href: "/putter/missing", labelKey: "missingStock", icon: "AlertTriangleIcon" },
      { href: "/putter/returns", labelKey: "saleReturn", icon: "RotateCcwIcon" },
      { href: "/putter/damage", labelKey: "damageRaise", icon: "XCircleIcon" },
      { href: "/putter/completed", labelKey: "completed", icon: "CheckCircleIcon" },
      { href: "/putter/reports", labelKey: "reports", icon: "FileTextIcon" }
    ]
  },
  {
    name: 'hr',
    role: 'hr',
    navItems: [
      { href: "/hr", labelKey: "dashboard", icon: "LayoutDashboardIcon" },
      { href: "/hr/employees", labelKey: "employees", icon: "UsersIcon" },
      { href: "/hr/attendance", labelKey: "attendance", icon: "CalendarIcon" },
      { href: "/hr/leave", labelKey: "leave", icon: "CalendarOffIcon" },
      { href: "/hr/salary", labelKey: "salary", icon: "BanknoteIcon" },
      { href: "/hr/payroll", labelKey: "payroll", icon: "CreditCardIcon" },
      { href: "/hr/performance", labelKey: "performance", icon: "TrendingUpIcon" },
      { href: "/hr/recruitment", labelKey: "recruitment", icon: "UserPlusIcon" },
      { href: "/hr/reports", labelKey: "reports", icon: "FileTextIcon" }
    ]
  },
  {
    name: 'customer',
    role: 'customer',
    navItems: [
      { href: "/customer", labelKey: "dashboard", icon: "LayoutDashboardIcon" },
      { href: "/customer/orders", labelKey: "orders", icon: "ShoppingBagIcon" },
      { href: "/customer/invoices", labelKey: "invoices", icon: "ReceiptIcon" },
      { href: "/customer/wishlist", labelKey: "wishlist", icon: "HeartIcon" },
      { href: "/customer/loyalty", labelKey: "loyaltyPoints", icon: "GiftIcon" },
      { href: "/customer/wallet", labelKey: "wallet", icon: "WalletIcon" },
      { href: "/customer/addresses", labelKey: "addresses", icon: "MapPinIcon" },
      { href: "/customer/returns", labelKey: "returns", icon: "RotateCcwIcon" },
      { href: "/customer/support", labelKey: "support", icon: "HeadphonesIcon" },
      { href: "/customer/profile", labelKey: "profile", icon: "UserIcon" }
    ]
  },
  {
    name: 'supplier',
    role: 'supplier',
    navItems: [
      { href: "/supplier", labelKey: "dashboard", icon: "LayoutDashboardIcon" },
      { href: "/supplier/purchase-orders", labelKey: "purchaseOrders", icon: "ShoppingCartIcon" },
      { href: "/supplier/grn", labelKey: "grn", icon: "FileCheckIcon" },
      { href: "/supplier/invoices", labelKey: "invoices", icon: "ReceiptIcon" },
      { href: "/supplier/payments", labelKey: "payments", icon: "BanknoteIcon" },
      { href: "/supplier/returns", labelKey: "returns", icon: "RotateCcwIcon" },
      { href: "/supplier/products", labelKey: "products", icon: "PackageIcon" },
      { href: "/supplier/support", labelKey: "support", icon: "HeadphonesIcon" }
    ]
  }
];

const basePath = path.join(__dirname, 'src', 'app');

modules.forEach(mod => {
  const dirPath = path.join(basePath, mod.name);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Generate layout.tsx
  const layoutContent = `"use client";

import { AppLayoutWithBranch, NavItem } from "@/components/layout/app-layout";
import {
  ${Array.from(new Set(mod.navItems.map(n => n.icon))).join(',\n  ')}
} from "lucide-react";

const ${mod.name}NavItems: NavItem[] = [
${mod.navItems.map(n => `  { href: "${n.href}", labelKey: "${n.labelKey}", icon: ${n.icon} }`).join(',\n')}
];

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppLayoutWithBranch navItems={${mod.name}NavItems} namespace="nav" role="${mod.role}">
      {children}
    </AppLayoutWithBranch>
  );
}
`;
  fs.writeFileSync(path.join(dirPath, 'layout.tsx'), layoutContent);

  // Generate page.tsx
  const pageContent = `"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";

export default function ${mod.name.charAt(0).toUpperCase() + mod.name.slice(1)}Dashboard() {
  const { data: stats, isLoading } = useTRPC().${mod.name}.${mod.name === 'customer' || mod.name === 'supplier' ? 'getPortalStats' : 'getDashboardStats'}.useQuery({});

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold capitalize">${mod.name} Dashboard</h1>
      {isLoading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats && Object.entries(stats).map(([key, value]) => {
            if (Array.isArray(value)) return null;
            return (
              <Card key={key} className="bg-card/50 backdrop-blur-xl border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value as any}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), pageContent);
});

console.log("Dashboards generated successfully!");
