"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import {
	AlertTriangleIcon,
	CalendarDaysIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	ChevronRightIcon,
	EyeIcon,
	FileTextIcon,
	Loader2Icon,
	PackageIcon,
	PlusIcon,
	RefreshCcwIcon,
	TableIcon,
	UserIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

type ReturnItem = {
	id: number;
	quantity: number;
	price: string;
	refund_amount: string;
	condition?: string | null;
	reason?: string | null;
	product?: {
		id: number;
		name: string;
		sku: string;
		unit?: string | null;
	} | null;
};

type SalesReturn = {
	id: number;
	order_id: number;
	customer_id?: number | null;
	customer?: { id: number; name: string | null; phone: string | null } | null;
	order?: { id: number; total_amount: string; bill_number?: string | null } | null;
	total_amount: string;
	created_at: Date | string | null;
	status: string | null;
	returnItems?: ReturnItem[];
};

export default function SalesReturnsList() {
	const utils = trpc.useUtils();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [activeView, setActiveView] = useState<"daywise" | "table">("daywise");
	const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
	const [rejectModalReturn, setRejectModalReturn] = useState<SalesReturn | null>(null);
	const [rejectReason, setRejectReason] = useState("");
	const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
	const locale = useLocale();

	const processMutation = trpc.salesReturns.process.useMutation({
		onSuccess: (data: any) => {
			toast.success(
				locale === "hi"
					? `वापसी #RET-${data.id} स्वीकृत हो गई और सामान स्टॉक में जोड़ दिया गया!`
					: `Sales return #RET-${data.id} approved and stock restored to inventory!`
			);
			utils.salesReturns.list.invalidate();
			setSelectedReturn((prev) => (prev && prev.id === data.id ? { ...prev, status: "processed" } : prev));
		},
		onError: (err) => {
			toast.error(`Failed to process return: ${err.message}`);
		},
	});

	const rejectMutation = trpc.salesReturns.reject.useMutation({
		onSuccess: (data: any) => {
			toast.success(
				locale === "hi"
					? `वापसी #RET-${data.id} अस्वीकृत (Rejected) कर दी गई।`
					: `Sales return #RET-${data.id} rejected.`
			);
			utils.salesReturns.list.invalidate();
			setRejectModalReturn(null);
			setRejectReason("");
			setSelectedReturn((prev) => (prev && prev.id === data.id ? { ...prev, status: "rejected" } : prev));
		},
		onError: (err) => {
			toast.error(`Failed to reject return: ${err.message}`);
		},
	});

	const handleProcessReturn = (id: number) => {
		if (
			confirm(
				locale === "hi"
					? `क्या आप वापसी #RET-${id} को स्वीकृत करके स्टॉक में जोड़ना चाहते हैं?`
					: `Approve sales return #RET-${id} and restore returned items back into branch inventory?`
			)
		) {
			processMutation.mutate({ id });
		}
	};

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "बिक्री वापसी (Sales Returns)" : "Sales Returns",
		subtitle:
			locale === "hi"
				? "ग्राहक की वापसी और डिलीवरी रिटर्न को दिन अनुसार ट्रैक व प्रबंधित करें।"
				: "Manage customer returns, delivery handovers, and process refunds day-wise.",
		newReturnBtn: locale === "hi" ? "नई वापसी" : "New Return",

		totalReturns: locale === "hi" ? "कुल वापसी (Returns)" : "Total Returns",
		pendingReview: locale === "hi" ? "लंबित समीक्षा" : "Pending Review",
		totalRefundValue: locale === "hi" ? "कुल वापसी राशि" : "Total Refund Value",

		searchPlaceholder:
			locale === "hi"
				? "आईडी, ग्राहक का नाम, फोन या ऑर्डर से खोजें..."
				: "Search by Return ID, Customer name, Phone, or Order...",
		emptyMsg:
			locale === "hi"
				? "आपके फ़िल्टर से मेल खाती कोई बिक्री वापसी नहीं मिली।"
				: "No sales returns found matching your filters.",
		viewDetails: locale === "hi" ? "विवरण देखें" : "View Details",

		thReturnId: locale === "hi" ? "वापसी आईडी" : "Return ID",
		thOriginalOrder: locale === "hi" ? "मूल ऑर्डर / बिल" : "Original Order / Bill",
		thCustomer: locale === "hi" ? "ग्राहक का नाम" : "Customer",
		thAmount: locale === "hi" ? "वापसी राशि" : "Refund Amount",
		thItems: locale === "hi" ? "वापस सामान (Items)" : "Returned Items",
		thStatus: locale === "hi" ? "स्थिति" : "Status",
		thDate: locale === "hi" ? "तारीख" : "Date",
		thActions: locale === "hi" ? "कार्रवाइयाँ" : "Actions",

		// Status Options
		statusAll: locale === "hi" ? "सभी स्थिति" : "All Status",
		statusPending: locale === "hi" ? "लंबित" : "Pending",
		statusApproved: locale === "hi" ? "स्वीकृत" : "Approved",
		statusRefunded: locale === "hi" ? "वापस की गई / Processed" : "Refunded / Processed",
		statusRejected: locale === "hi" ? "अस्वीकृत" : "Rejected",
	};

	const { data: salesReturns, isLoading } = trpc.salesReturns.list.useQuery();

	const filteredReturns = useMemo(() => {
		return (salesReturns ?? []).filter((r: SalesReturn) => {
			if (statusFilter !== "all" && r.status !== statusFilter) return false;
			const q = searchTerm.toLowerCase();
			return (
				r.id.toString().includes(q) ||
				r.order_id.toString().includes(q) ||
				(r.customer?.name?.toLowerCase() || "").includes(q) ||
				(r.customer?.phone || "").includes(q) ||
				(r.returnItems || []).some((it) =>
					(it.product?.name || "").toLowerCase().includes(q),
				)
			);
		});
	}, [salesReturns, statusFilter, searchTerm]);

	// Day-wise Grouping of returns
	const dayWiseGroups = useMemo(() => {
		const groups: Record<
			string,
			{
				dateStr: string;
				returns: SalesReturn[];
				totalRefund: number;
				totalItemsCount: number;
			}
		> = {};

		for (const r of filteredReturns) {
			const d = r.created_at ? new Date(r.created_at) : new Date();
			const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
			if (!groups[key]) {
				groups[key] = {
					dateStr: key,
					returns: [],
					totalRefund: 0,
					totalItemsCount: 0,
				};
			}
			groups[key].returns.push(r);
			groups[key].totalRefund += Number(r.total_amount || 0);
			const itemsCount = (r.returnItems || []).reduce(
				(sum, it) => sum + (Number(it.quantity) || 0),
				0,
			);
			groups[key].totalItemsCount += itemsCount;
		}

		// Sort dates descending
		return Object.entries(groups)
			.sort(([a], [b]) => b.localeCompare(a))
			.map(([key, data]) => ({
				date: key,
				...data,
			}));
	}, [filteredReturns]);

	const toggleDateExpanded = (dateKey: string) => {
		setExpandedDates((prev) => ({
			...prev,
			[dateKey]: prev[dateKey] === undefined ? false : !prev[dateKey],
		}));
	};

	const totalRefundSum = useMemo(() => {
		return (filteredReturns || []).reduce(
			(sum, r: SalesReturn) => sum + Number(r.total_amount || 0),
			0,
		);
	}, [filteredReturns]);

	const columns: Column<SalesReturn>[] = [
		{
			key: "id",
			header: t.thReturnId,
			sortable: true,
			className: "font-semibold",
			render: (row) => `#RET-${row.id}`,
		},
		{
			key: "created_at",
			header: t.thDate,
			sortable: true,
			render: (row) =>
				row.created_at
					? new Date(row.created_at).toLocaleDateString(
							locale === "hi" ? "hi-IN" : "en-IN",
							{ day: "2-digit", month: "short", year: "numeric" },
						)
					: "-",
		},
		{
			key: "customer",
			header: t.thCustomer,
			sortable: true,
			render: (row) => (
				<div>
					<p className="font-medium text-foreground">{row.customer?.name || "Customer / ग्राहक"}</p>
					{row.customer?.phone && (
						<p className="text-muted-foreground text-xs">{row.customer.phone}</p>
					)}
				</div>
			),
		},
		{
			key: "order_id",
			header: t.thOriginalOrder,
			sortable: true,
			render: (row) => (
				<Badge variant="outline" className="font-mono text-xs">
					{row.order?.bill_number || `Order #${row.order_id}`}
				</Badge>
			),
		},
		{
			key: "items",
			header: t.thItems,
			render: (row) => {
				const items = row.returnItems || [];
				if (items.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
				return (
					<div className="max-w-[280px] space-y-1">
						{items.slice(0, 2).map((item, idx) => (
							<p key={idx} className="truncate text-xs">
								<span className="font-medium">{item.product?.name || "Item"}</span>
								<span className="text-muted-foreground"> × {item.quantity}</span>
								{item.reason && (
									<span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">
										({item.reason})
									</span>
								)}
							</p>
						))}
						{items.length > 2 && (
							<p className="text-[11px] text-primary">
								+{items.length - 2} more items
							</p>
						)}
					</div>
				);
			},
		},
		{
			key: "amount",
			header: t.thAmount,
			sortable: true,
			render: (row) => (
				<span className="font-semibold text-rose-600 dark:text-rose-400">
					{formatCurrency(Number(row.total_amount), locale)}
				</span>
			),
		},
		{
			key: "status",
			header: t.thStatus,
			sortable: true,
			render: (row) => (
				<span
					className={`rounded-full px-2.5 py-1 font-medium text-xs capitalize ${
						row.status === "refunded" || row.status === "processed"
							? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
							: ""
					} ${
						row.status === "pending"
							? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
							: ""
					} ${
						row.status === "cancelled" || row.status === "rejected"
							? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
							: ""
					}`}
				>
					{row.status === "pending"
						? t.statusPending
						: row.status === "approved"
							? t.statusApproved
							: row.status === "refunded" || row.status === "processed"
								? t.statusRefunded
								: row.status === "rejected"
									? t.statusRejected
									: row.status}
				</span>
			),
		},
		{
			key: "actions",
			header: t.thActions,
			render: (row) => (
				<TableActions>
					<TableActionButton
						icon={<EyeIcon className="h-4 w-4" />}
						label={t.viewDetails}
						onClick={() => setSelectedReturn(row)}
					/>
					{row.status === "pending" && (
						<>
							<TableActionButton
								icon={<CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
								label={locale === "hi" ? "स्वीकारें (Approve & Stock)" : "Approve & Stock"}
								onClick={() => handleProcessReturn(row.id)}
							/>
							<TableActionButton
								icon={<XCircleIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
								label={locale === "hi" ? "अस्वीकार करें (Reject)" : "Reject"}
								onClick={() => {
									setRejectModalReturn(row);
									setRejectReason("");
								}}
							/>
						</>
					)}
				</TableActions>
			),
		},
	];

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			{/* Top Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{t.title}</h1>
					<p className="text-muted-foreground text-sm">{t.subtitle}</p>
				</div>
				<div className="flex items-center gap-2">
					{/* Toggle between Day-wise Breakdown and Standard Table */}
					<div className="flex rounded-lg border border-border bg-muted/40 p-1">
						<Button
							size="sm"
							variant={activeView === "daywise" ? "default" : "ghost"}
							onClick={() => setActiveView("daywise")}
							className="h-8 gap-1.5 text-xs font-medium"
						>
							<CalendarDaysIcon className="h-3.5 w-3.5" />
							{locale === "hi" ? "दिन अनुसार विवरण" : "Day-wise View"}
						</Button>
						<Button
							size="sm"
							variant={activeView === "table" ? "default" : "ghost"}
							onClick={() => setActiveView("table")}
							className="h-8 gap-1.5 text-xs font-medium"
						>
							<TableIcon className="h-3.5 w-3.5" />
							{locale === "hi" ? "तालिका दृश्य" : "Table View"}
						</Button>
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
			</div>

			{/* KPI Cards */}
			<StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardContent className="flex items-center gap-4 p-5">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
									<RefreshCcwIcon className="h-6 w-6" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
										{t.totalReturns}
									</p>
									<h3 className="font-bold text-2xl tracking-tight">
										{salesReturns?.length || 0}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardContent className="flex items-center gap-4 p-5">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
									<PackageIcon className="h-6 w-6" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
										{t.pendingReview}
									</p>
									<h3 className="font-bold text-2xl tracking-tight text-amber-600 dark:text-amber-400">
										{salesReturns?.filter(
											(r: SalesReturn) => r.status?.toLowerCase() === "pending",
										).length || 0}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>

				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
							<CardContent className="flex items-center gap-4 p-5">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
									<FileTextIcon className="h-6 w-6" />
								</div>
								<div>
									<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
										{t.totalRefundValue}
									</p>
									<h3 className="font-bold text-2xl tracking-tight text-rose-600 dark:text-rose-400">
										{formatCurrency(totalRefundSum, locale)}
									</h3>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			{/* Search & Status Filters */}
			<Card className="border-border/50 bg-card/60 p-4 shadow-sm backdrop-blur">
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
			</Card>

			{/* MAIN VIEW: Day-wise Breakdown OR Table View */}
			{activeView === "daywise" ? (
				<div className="space-y-4">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center">
							<div className="flex items-center gap-2 text-muted-foreground">
								<RefreshCcwIcon className="h-5 w-5 animate-spin" />
								<span>Loading day-wise returns data...</span>
							</div>
						</div>
					) : dayWiseGroups.length === 0 ? (
						<Card className="p-8 text-center text-muted-foreground">
							<RefreshCcwIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
							<p className="font-medium">{t.emptyMsg}</p>
						</Card>
					) : (
						dayWiseGroups.map((group) => {
							const isExpanded = expandedDates[group.date] !== false;
							const formattedDate = new Date(group.date).toLocaleDateString(
								locale === "hi" ? "hi-IN" : "en-IN",
								{
									weekday: "long",
									day: "2-digit",
									month: "short",
									year: "numeric",
								},
							);

							return (
								<Card
									key={group.date}
									className="overflow-hidden border-border/60 bg-card shadow-sm transition-all hover:shadow-md"
								>
									{/* Date Group Header */}
									<button
										type="button"
										onClick={() => toggleDateExpanded(group.date)}
										className="flex w-full items-center justify-between border-b border-border/40 bg-muted/30 px-5 py-3.5 text-left transition hover:bg-muted/50"
									>
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
												<CalendarDaysIcon className="h-4 w-4" />
											</div>
											<div>
												<h3 className="font-semibold text-foreground text-sm sm:text-base">
													{formattedDate}
												</h3>
												<p className="text-muted-foreground text-xs">
													{group.returns.length} {locale === "hi" ? "ग्राहकों की वापसी" : "customer returns"} • {group.totalItemsCount} {locale === "hi" ? "सामान" : "items returned"}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<span className="block font-bold text-rose-600 text-sm sm:text-base dark:text-rose-400">
													{formatCurrency(group.totalRefund, locale)}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{locale === "hi" ? "कुल वापसी राशि" : "Day Refund Total"}
												</span>
											</div>
											{isExpanded ? (
												<ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
											) : (
												<ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
											)}
										</div>
									</button>

									{/* Expanded Customer Returns List for this Day */}
									{isExpanded && (
										<div className="divide-y divide-border/30">
											{group.returns.map((ret) => (
												<div
													key={ret.id}
													className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between hover:bg-muted/10 transition-colors"
												>
													{/* Customer & Order Details */}
													<div className="space-y-1.5 sm:max-w-[320px]">
														<div className="flex items-center gap-2">
															<span className="font-semibold text-foreground text-sm">
																{ret.customer?.name || "Customer / ग्राहक"}
															</span>
															{ret.customer?.phone && (
																<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
																	{ret.customer.phone}
																</span>
															)}
														</div>
														<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
															<span className="font-mono text-primary font-medium">
																#RET-{ret.id}
															</span>
															<span>•</span>
															<span>
																{ret.order?.bill_number || `Order #${ret.order_id}`}
															</span>
															<span>•</span>
															<Badge
																variant="outline"
																className={`text-[10px] uppercase font-semibold ${
																	ret.status === "processed" || ret.status === "refunded"
																		? "border-emerald-500 text-emerald-600"
																		: "border-amber-500 text-amber-600"
																}`}
															>
																{ret.status || "pending"}
															</Badge>
														</div>
													</div>

													{/* Returned Items Line-Items */}
													<div className="flex-1 sm:px-4">
														<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
															{locale === "hi" ? "वापस किए गए सामान" : "Returned Products"}
														</p>
														<div className="space-y-1">
															{(ret.returnItems || []).map((item, i) => (
																<div
																	key={i}
																	className="flex items-center justify-between rounded bg-muted/30 px-2.5 py-1 text-xs"
																>
																	<div className="flex items-center gap-2">
																		<span className="font-medium text-foreground">
																			{item.product?.name || "Product"}
																		</span>
																		<span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
																			{item.product?.sku || ""}
																		</span>
																		{item.reason && (
																			<span className="text-[10px] text-amber-600 dark:text-amber-400">
																				({item.reason})
																			</span>
																		)}
																	</div>
																	<div className="flex items-center gap-3">
																		<span className="font-medium text-muted-foreground">
																			× {item.quantity} {item.product?.unit || ""}
																		</span>
																		<span className="font-semibold text-rose-600 dark:text-rose-400">
																			{formatCurrency(Number(item.refund_amount || 0), locale)}
																		</span>
																	</div>
																</div>
															))}
															{(ret.returnItems || []).length === 0 && (
																<p className="text-xs text-muted-foreground italic">
																	Direct delivery return without item breakdown
																</p>
															)}
														</div>
													</div>

													{/* Refund Total & Action */}
													<div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-2 pt-2 sm:pt-0">
														<div className="text-right">
															<span className="block font-bold text-rose-600 text-base dark:text-rose-400">
																{formatCurrency(Number(ret.total_amount), locale)}
															</span>
															<span className="text-[11px] text-muted-foreground">
																{locale === "hi" ? "वापसी राशि" : "Refund Amount"}
															</span>
														</div>
														<div className="flex items-center gap-1.5">
															<Button
																variant="outline"
																size="sm"
																onClick={() => setSelectedReturn(ret)}
																className="h-8 gap-1 text-xs"
															>
																<EyeIcon className="h-3.5 w-3.5" />
																{t.viewDetails}
															</Button>
															{ret.status === "pending" && (
																<Button
																	size="sm"
																	disabled={processMutation.isPending}
																	onClick={() => handleProcessReturn(ret.id)}
																	className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
																>
																	<CheckCircle2Icon className="h-3.5 w-3.5" />
																	{locale === "hi" ? "स्वीकारें" : "Approve"}
																</Button>
															)}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</Card>
							);
						})
					)}
				</div>
			) : (
				<Card className="border-border/50 bg-card/50 p-4 shadow-sm">
					<DataTable
						data={filteredReturns as any}
						columns={columns as any}
						isLoading={isLoading}
						emptyMessage={t.emptyMsg}
						emptyIcon={<RefreshCcwIcon className="h-8 w-8" />}
					/>
				</Card>
			)}

			{/* Full Return Details Modal */}
			<Dialog
				open={!!selectedReturn}
				onOpenChange={(open) => {
					if (!open) setSelectedReturn(null);
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<RefreshCcwIcon className="h-5 w-5 text-primary" />
							<span>
								{locale === "hi" ? "वापसी विवरण" : "Sales Return Details"} #RET-
								{selectedReturn?.id}
							</span>
						</DialogTitle>
						<DialogDescription>
							{locale === "hi"
								? "ग्राहक द्वारा वापस किए गए सामान और रिफंड की पूर्ण जानकारी"
								: "Complete return details, customer info, and line items"}
						</DialogDescription>
					</DialogHeader>

					{selectedReturn && (
						<div className="space-y-4 pt-2">
							{/* Summary Details */}
							<div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:grid-cols-4">
								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "ग्राहक" : "Customer"}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{selectedReturn.customer?.name || "N/A"}
									</span>
									{selectedReturn.customer?.phone && (
										<span className="block text-xs text-muted-foreground">
											{selectedReturn.customer.phone}
										</span>
									)}
								</div>

								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "मूल बिल / ऑर्डर" : "Original Order"}
									</span>
									<span className="font-semibold text-foreground text-sm">
										{selectedReturn.order?.bill_number || `#${selectedReturn.order_id}`}
									</span>
								</div>

								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "तारीख" : "Date"}
									</span>
									<span className="font-medium text-foreground text-xs">
										{selectedReturn.created_at
											? new Date(selectedReturn.created_at).toLocaleString(
													locale === "hi" ? "hi-IN" : "en-IN",
												)
											: "-"}
									</span>
								</div>

								<div>
									<span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
										{locale === "hi" ? "स्थिति" : "Status"}
									</span>
									<Badge
										variant="outline"
										className="mt-0.5 text-xs font-semibold capitalize"
									>
										{selectedReturn.status || "pending"}
									</Badge>
								</div>
							</div>

							{/* Returned Items Table */}
							<div>
								<h4 className="mb-2 font-semibold text-sm">
									{locale === "hi" ? "वापस सामान सूची (Returned Items)" : "Returned Items"}
								</h4>
								<div className="overflow-hidden rounded-lg border border-border/60">
									<table className="w-full text-left text-xs">
										<thead className="bg-muted/50 font-medium text-muted-foreground">
											<tr>
												<th className="p-2.5">Product</th>
												<th className="p-2.5 text-center">Qty</th>
												<th className="p-2.5 text-right">Price</th>
												<th className="p-2.5 text-right">Refund Total</th>
												<th className="p-2.5">Reason / Condition</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/40">
											{(selectedReturn.returnItems || []).map((item, idx) => (
												<tr key={idx} className="hover:bg-muted/10">
													<td className="p-2.5">
														<p className="font-medium text-foreground">
															{item.product?.name || `Product #${item.id}`}
														</p>
														{item.product?.sku && (
															<p className="font-mono text-[10px] text-muted-foreground">
																{item.product.sku}
															</p>
														)}
													</td>
													<td className="p-2.5 text-center font-semibold">
														{item.quantity} {item.product?.unit || ""}
													</td>
													<td className="p-2.5 text-right">
														{formatCurrency(Number(item.price || 0), locale)}
													</td>
													<td className="p-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
														{formatCurrency(Number(item.refund_amount || 0), locale)}
													</td>
													<td className="p-2.5">
														<span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
															{item.reason || item.condition || "Delivery Return"}
														</span>
													</td>
												</tr>
											))}
											{(selectedReturn.returnItems || []).length === 0 && (
												<tr>
													<td
														colSpan={5}
														className="p-4 text-center text-muted-foreground italic"
													>
														No individual line items registered for this return.
													</td>
												</tr>
											)}
										</tbody>
										<tfoot className="border-t border-border/60 bg-muted/20 font-semibold">
											<tr>
												<td colSpan={3} className="p-2.5 text-right">
													{locale === "hi" ? "कुल वापसी राशि:" : "Total Refund:"}
												</td>
												<td className="p-2.5 text-right font-bold text-rose-600 text-sm dark:text-rose-400">
													{formatCurrency(Number(selectedReturn.total_amount), locale)}
												</td>
												<td></td>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>

							{/* Action Footer for Pending or Processed Returns */}
							{selectedReturn.status === "pending" ? (
								<div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
									<div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
										<AlertTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
										<div>
											<p className="font-semibold">
												{locale === "hi" ? "समीक्षा और स्टॉक बहाली" : "Approval & Stock Restoration"}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{locale === "hi"
													? "स्वीकृत करने पर यह सामान तुरंत इन्वेंटरी में जुड़ जाएगा और रिफंड वाउचर रिकॉर्ड होगा।"
													: "Approving will restore all items into branch stock and record the refund entry."}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 w-full sm:w-auto justify-end">
										<Button
											variant="outline"
											size="sm"
											disabled={rejectMutation.isPending || processMutation.isPending}
											onClick={() => {
												setRejectModalReturn(selectedReturn);
												setRejectReason("");
											}}
											className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 text-xs dark:border-rose-800 dark:text-rose-400"
										>
											<XCircleIcon className="mr-1 h-3.5 w-3.5" />
											{locale === "hi" ? "अस्वीकार करें" : "Reject Return"}
										</Button>
										<Button
											size="sm"
											disabled={processMutation.isPending || rejectMutation.isPending}
											onClick={() => handleProcessReturn(selectedReturn.id)}
											className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm"
										>
											{processMutation.isPending ? (
												<Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
											) : (
												<CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />
											)}
											{locale === "hi" ? "वापसी स्वीकृत करें (स्टॉक में जोड़ें)" : "Approve & Add to Stock"}
										</Button>
									</div>
								</div>
							) : selectedReturn.status === "processed" || selectedReturn.status === "refunded" ? (
								<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
									<CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
									<span className="font-medium">
										{locale === "hi"
											? "यह बिक्री वापसी स्वीकृत हो चुकी है और सामान स्टॉक में जोड़ा जा चुका है।"
											: "This sales return is approved and items have been restored to stock."}
									</span>
								</div>
							) : selectedReturn.status === "rejected" ? (
								<div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
									<XCircleIcon className="h-4 w-4 text-rose-600" />
									<span className="font-medium">
										{locale === "hi"
											? "यह वापसी अस्वीकृत (Rejected) कर दी गई है।"
											: "This sales return was rejected."}
									</span>
								</div>
							) : null}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Rejection Reason Dialog */}
			<Dialog
				open={!!rejectModalReturn}
				onOpenChange={(open) => {
					if (!open) {
						setRejectModalReturn(null);
						setRejectReason("");
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
							<XCircleIcon className="h-5 w-5" />
							<span>
								{locale === "hi" ? "वापसी अस्वीकार करें" : "Reject Sales Return"} #RET-
								{rejectModalReturn?.id}
							</span>
						</DialogTitle>
						<DialogDescription>
							{locale === "hi"
								? "कृपया इस बिक्री वापसी को अस्वीकार करने का कारण दर्ज करें:"
								: "Please enter the reason for rejecting this return request:"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<Textarea
							placeholder={
								locale === "hi"
									? "अस्वीकृति का कारण (उदा. सील टूटी हुई, समयावधि समाप्त)..."
									: "Rejection reason (e.g. Broken packaging, expired return window)..."
							}
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
							className="text-sm"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setRejectModalReturn(null)}
							disabled={rejectMutation.isPending}
						>
							{locale === "hi" ? "रद्द करें" : "Cancel"}
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={rejectMutation.isPending}
							onClick={() => {
								if (rejectModalReturn) {
									rejectMutation.mutate({
										id: rejectModalReturn.id,
										reason: rejectReason || undefined,
									});
								}
							}}
						>
							{rejectMutation.isPending ? (
								<Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
							) : (
								<XCircleIcon className="mr-1 h-3.5 w-3.5" />
							)}
							{locale === "hi" ? "अस्वीकार करें" : "Confirm Reject"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
