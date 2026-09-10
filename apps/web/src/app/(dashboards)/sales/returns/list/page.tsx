"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { EyeIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

type SalesReturn = {
	id: number;
	order_id: number;
	customer: { name: string | null } | null;
	order: { id: number; total_amount: string } | null;
	total_amount: string;
	created_at: Date | null;
	status: string | null;
};

export default function SalesReturnsList() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const locale = useLocale();

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "बिक्री वापसी (Sales Returns)" : "Sales Returns",
		subtitle:
			locale === "hi"
				? "ग्राहक की वापसी और धनवापसी (refunds) की प्रक्रिया प्रबंधित करें।"
				: "Manage customer returns and process refunds.",
		newReturnBtn: locale === "hi" ? "नई वापसी" : "New Return",

		totalReturns: locale === "hi" ? "कुल वापसी (Returns)" : "Total Returns",
		pendingReview: locale === "hi" ? "लंबित समीक्षा" : "Pending Review",

		searchPlaceholder:
			locale === "hi"
				? "आईडी, ऑर्डर या ग्राहक द्वारा खोजें..."
				: "Search by ID, Order, or Customer...",
		emptyMsg:
			locale === "hi"
				? "आपके फ़िल्टर से मेल खाती कोई बिक्री वापसी नहीं मिली।"
				: "No sales returns found matching your filters.",
		viewDetails: locale === "hi" ? "विवरण देखें" : "View Details",

		thReturnId: locale === "hi" ? "वापसी आईडी" : "Return ID",
		thOriginalOrder: locale === "hi" ? "मूल ऑर्डर" : "Original Order",
		thCustomer: locale === "hi" ? "ग्राहक" : "Customer",
		thAmount: locale === "hi" ? "वापसी राशि" : "Refund Amount",
		thItems: locale === "hi" ? "इकाइयाँ (Items)" : "Items",
		thStatus: locale === "hi" ? "स्थिति" : "Status",
		thDate: locale === "hi" ? "तारीख" : "Date",
		thActions: locale === "hi" ? "कार्रवाइयाँ" : "Actions",

		// Status Options
		statusAll: locale === "hi" ? "सभी स्थिति" : "All Status",
		statusPending: locale === "hi" ? "लंबित" : "Pending",
		statusApproved: locale === "hi" ? "स्वीकृत" : "Approved",
		statusRefunded: locale === "hi" ? "वापस की गई" : "Refunded",
		statusRejected: locale === "hi" ? "अस्वीकृत" : "Rejected",
	};

	const { data: salesReturns, isLoading } = trpc.salesReturns.list.useQuery();

	const filteredReturns = (salesReturns ?? []).filter((r: SalesReturn) => {
		if (statusFilter !== "all" && r.status !== statusFilter) return false;
		const q = searchTerm.toLowerCase();
		return (
			r.id.toString().includes(q) ||
			r.order_id.toString().includes(q) ||
			(r.customer?.name?.toLowerCase() || "").includes(q)
		);
	});

	const columns: Column<SalesReturn>[] = [
		{
			key: "id",
			header: t.thReturnId,
			sortable: true,
			className: "font-medium",
		},
		{
			key: "order_id",
			header: t.thOriginalOrder,
			sortable: true,
			render: (row) => `#${row.order_id}`,
		},
		{
			key: "customer",
			header: t.thCustomer,
			sortable: true,
			render: (row) => row.customer?.name || "N/A",
		},
		{
			key: "amount",
			header: t.thAmount,
			sortable: true,
			render: (row) => formatCurrency(Number(row.total_amount), locale),
		},
		{ key: "items", header: t.thItems, hideOnMobile: true, render: () => "-" },
		{
			key: "status",
			header: t.thStatus,
			sortable: true,
			render: (row) => (
				<span
					className={`rounded-full px-2.5 py-1 font-medium text-xs capitalize ${row.status === "refunded" || row.status === "processed" ? "bg-emerald-100 text-emerald-700" : ""}
          ${row.status === "pending" ? "bg-amber-100 text-amber-700" : ""}
          ${row.status === "cancelled" ? "bg-red-100 text-red-700" : ""}
        `}
				>
					{row.status === "pending"
						? t.statusPending
						: row.status === "approved"
							? t.statusApproved
							: row.status === "refunded"
								? t.statusRefunded
								: row.status === "rejected"
									? t.statusRejected
									: row.status}
				</span>
			),
		},
		{
			key: "created_at",
			header: t.thDate,
			sortable: true,
			hideOnMobile: true,
			render: (row) =>
				row.created_at ? new Date(row.created_at).toLocaleDateString() : "-",
		},
		{
			key: "actions",
			header: t.thActions,
			render: (_row) => (
				<TableActions>
					<TableActionButton
						icon={<EyeIcon className="h-4 w-4" />}
						label={t.viewDetails}
						onClick={() => {}}
					/>
				</TableActions>
			),
		},
	];

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{t.title}</h1>
					<p className="text-muted-foreground text-sm">{t.subtitle}</p>
				</div>
				<Button
					asChild
					className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
				>
					<Link href="/sales/returns/create">
						<PlusIcon className="mr-2 h-4 w-4" /> {t.newReturnBtn}
					</Link>
				</Button>
			</div>

			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
									<RefreshCcwIcon className="h-6 w-6 text-blue-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										{t.totalReturns}
									</p>
									<h3 className="font-bold text-2xl">
										{salesReturns?.length || 0}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardContent className="flex items-center gap-4 p-6">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
									<RefreshCcwIcon className="h-6 w-6 text-amber-500" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										{t.pendingReview}
									</p>
									<h3 className="font-bold text-2xl">
										{salesReturns?.filter(
											(r: SalesReturn) => r.status?.toLowerCase() === "pending",
										).length || 0}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<Card className="flex flex-col gap-4 border-border/50 bg-card/50 p-3 shadow-sm sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder={t.searchPlaceholder}
						filters={[
							{
								value: statusFilter,
								onChange: setStatusFilter,
								options: [
									{ label: t.statusAll, value: "all" },
									{
										label: t.statusPending,
										value: "pending",
										variant: "warning",
									},
									{
										label: t.statusApproved,
										value: "approved",
										variant: "default",
									},
									{
										label: t.statusRefunded,
										value: "refunded",
										variant: "success",
									},
									{
										label: t.statusRejected,
										value: "rejected",
										variant: "danger",
									},
								],
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredReturns as any}
						columns={columns as any}
						isLoading={isLoading}
						emptyMessage={t.emptyMsg}
						emptyIcon={<RefreshCcwIcon className="h-8 w-8" />}
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
