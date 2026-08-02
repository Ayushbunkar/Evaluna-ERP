"use client";

import {
	ClockIcon,
	CreditCardIcon,
	FileTextIcon,
	LayoutDashboardIcon,
	PackageIcon,
	ReceiptIcon,
	ShoppingBagIcon,
	TruckIcon,
	UsersIcon,
	WalletIcon,
	WarehouseIcon,
} from "lucide-react";
import {
	AppLayoutWithBranch,
	type NavItem,
} from "@/components/layout/app-layout";

const managerNavItems: NavItem[] = [
	{ href: "/manager", labelKey: "dashboard", icon: LayoutDashboardIcon },
	{ href: "/manager/orders", labelKey: "orders", icon: ShoppingBagIcon },
	{
		href: "/manager/purchase-returns",
		labelKey: "purchaseReturns",
		icon: ReceiptIcon,
	},
	{ href: "/manager/warehouse", labelKey: "warehouse", icon: WarehouseIcon },
	{ href: "/manager/inventory", labelKey: "inventory", icon: PackageIcon },
	{ href: "/manager/billing", labelKey: "billing", icon: CreditCardIcon },
	{ href: "/manager/delivery", labelKey: "delivery", icon: TruckIcon },
	{ href: "/manager/customers", labelKey: "customers", icon: UsersIcon },
	{ href: "/manager/staff", labelKey: "staff", icon: UsersIcon },
	{ href: "/manager/attendance", labelKey: "attendance", icon: ClockIcon },
	{ href: "/manager/expenses", labelKey: "expenses", icon: ReceiptIcon },
	{ href: "/manager/cash-book", labelKey: "cashbook", icon: WalletIcon },
	{ href: "/manager/reports", labelKey: "reports", icon: FileTextIcon },
	// Newly Added Missing Pages
	{ href: "/manager/products", labelKey: "products", icon: PackageIcon },
	{ href: "/manager/purchases", labelKey: "purchases", icon: ShoppingBagIcon },
	{ href: "/manager/cashbook", labelKey: "cashbook", icon: WalletIcon },
	{ href: "/manager/cashier", labelKey: "cashier", icon: WalletIcon },
	{
		href: "/manager/warehouse/movement",
		labelKey: "warehouseMovement",
		icon: WarehouseIcon,
	},
	{
		href: "/manager/warehouse/locations",
		labelKey: "warehouseLocations",
		icon: WarehouseIcon,
	},
	{
		href: "/manager/warehouse/conversions",
		labelKey: "warehouseConversions",
		icon: WarehouseIcon,
	},
	{
		href: "/manager/warehouse/scanner",
		labelKey: "warehouseScanner",
		icon: WarehouseIcon,
	},
];

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AppLayoutWithBranch navItems={managerNavItems} namespace="nav">
			{children}
		</AppLayoutWithBranch>
	);
}
