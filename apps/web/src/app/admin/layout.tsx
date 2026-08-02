"use client";

import {
	BanknoteIcon,
	BarChart3Icon,
	BarcodeIcon,
	Building2Icon,
	ClockIcon,
	CreditCardIcon,
	DatabaseZapIcon,
	FileTextIcon,
	HardDriveIcon,
	KeyIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	LifeBuoyIcon,
	MapIcon,
	PackageIcon,
	ReceiptTextIcon,
	RotateCcwIcon,
	SettingsIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
	TruckIcon,
	UserCheckIcon,
	UsersIcon,
	WalletIcon,
	WarehouseIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const companyAdminNavItems: NavItem[] = [
	{ href: "/admin", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/admin/branches", labelKey: "branches", icon: Building2Icon },
	{ href: "/admin/inventory", labelKey: "inventory", icon: PackageIcon },
	{ href: "/admin/warehouse", labelKey: "warehouse", icon: WarehouseIcon },
	{ href: "/admin/sales", labelKey: "sales", icon: ShoppingCartIcon },
	{ href: "/admin/billing", labelKey: "billing", icon: CreditCardIcon },
	{ href: "/admin/customers", labelKey: "customers", icon: UsersIcon },
	{ href: "/admin/suppliers", labelKey: "suppliers", icon: UserCheckIcon },
	{ href: "/admin/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
	{
		href: "/admin/purchase-returns",
		labelKey: "purchaseReturns",
		icon: RotateCcwIcon,
	},
	{ href: "/admin/delivery", labelKey: "delivery", icon: TruckIcon },
	{ href: "/admin/finance", labelKey: "finance", icon: LandmarkIcon },
	{ href: "/admin/cash-book", labelKey: "cashbook", icon: WalletIcon },
	{ href: "/admin/expenses", labelKey: "expenses", icon: ReceiptTextIcon },
	{ href: "/admin/staff", labelKey: "staff", icon: UsersIcon },
	{ href: "/admin/attendance", labelKey: "attendance", icon: ClockIcon },
	{ href: "/admin/payroll", labelKey: "payroll", icon: BanknoteIcon },
	{ href: "/admin/salary", labelKey: "salary", icon: BanknoteIcon },
	{ href: "/admin/reports", labelKey: "reports", icon: FileTextIcon },
	{ href: "/admin/monitoring", labelKey: "monitoring", icon: BarChart3Icon },
	{ href: "/admin/settings", labelKey: "settings", icon: SettingsIcon },
	{
		href: "/admin/client-management",
		labelKey: "clientManagement",
		icon: ShieldIcon,
	},
	{ href: "/admin/companies", labelKey: "companies", icon: Building2Icon },
	{ href: "/admin/users", labelKey: "users", icon: UsersIcon },
	{ href: "/admin/roles", labelKey: "roles", icon: ShieldCheckIcon },
	{ href: "/admin/api-keys", labelKey: "apiKeys", icon: KeyIcon },
	{
		href: "/admin/master-data",
		labelKey: "Master Data",
		icon: DatabaseZapIcon,
	},
	{
		href: "/admin/dashboard-builder",
		labelKey: "Dashboard Builder",
		icon: LayoutDashboardIcon,
	},
	{ href: "/admin/health", labelKey: "systemHealth", icon: DatabaseZapIcon },
	{ href: "/admin/audit-logs", labelKey: "auditLogs", icon: FileTextIcon },
	// Newly Added Missing Pages
	{ href: "/admin/products", labelKey: "products", icon: PackageIcon },
	{ href: "/admin/orders", labelKey: "orders", icon: ShoppingCartIcon },
	{
		href: "/admin/payment-methods",
		labelKey: "paymentMethods",
		icon: CreditCardIcon,
	},
	{ href: "/admin/cashier", labelKey: "cashier", icon: LandmarkIcon },
	{ href: "/admin/pos", labelKey: "pos", icon: ShoppingCartIcon },
	{ href: "/admin/transfers", labelKey: "transfers", icon: TruckIcon },
	{ href: "/admin/loyalty", labelKey: "loyalty", icon: LifeBuoyIcon },
	{ href: "/admin/backups", labelKey: "backups", icon: HardDriveIcon },
	{ href: "/admin/marketing", labelKey: "marketing", icon: BarChart3Icon },
	{
		href: "/admin/warehouse/movement",
		labelKey: "warehouseMovement",
		icon: WarehouseIcon,
	},
	{
		href: "/admin/warehouse/locations",
		labelKey: "warehouseLocations",
		icon: Building2Icon,
	},
	{
		href: "/admin/audit/scanner",
		labelKey: "auditScanner",
		icon: ShieldCheckIcon,
	},
	{ href: "/admin/accounting", labelKey: "accounting", icon: FileTextIcon },
	{
		href: "/admin/finance/approvals",
		labelKey: "approvals",
		icon: ShieldCheckIcon,
	},
	{
		href: "/admin/permissions",
		labelKey: "permissions",
		icon: ShieldCheckIcon,
	},
	{
		href: "/admin/warehouse/conversions",
		labelKey: "warehouseConversions",
		icon: WarehouseIcon,
	},
	{
		href: "/admin/warehouse/picking",
		labelKey: "warehousePicking",
		icon: PackageIcon,
	},
	{
		href: "/admin/warehouse/scanner",
		labelKey: "warehouseScanner",
		icon: BarcodeIcon,
	},
	{
		href: "/admin/delivery/tracking",
		labelKey: "deliveryTracking",
		icon: MapIcon,
	},
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={companyAdminNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
