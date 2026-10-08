// @ts-nocheck
"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { jsPDF } from "jspdf";
import {
	ArrowLeftIcon,
	BarChart3Icon,
	CalendarDaysIcon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DownloadIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	FilterIcon,
	IndianRupeeIcon,
	LayersIcon,
	Loader2Icon,
	MapPinIcon,
	PackageIcon,
	RefreshCwIcon,
	SearchIcon,
	ShoppingBagIcon,
	StoreIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DateFilterBar } from "@/components/shared/filters/date-filter-bar";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function SalesReportsPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const isHindi = locale === "hi";

	// Date Range Filter States
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [datePreset, setDatePreset] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isPdfGenerating, setIsPdfGenerating] = useState(false);

	// Product Demand & Pieces Breakdown States
	const [productSearchTerm, setProductSearchTerm] = useState("");
	const [productCategoryFilter, setProductCategoryFilter] = useState("all");
	const [productViewTab, setProductViewTab] = useState<"allProducts" | "dayByDay">("allProducts");
	const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

	const toggleExpandDay = (dateStr: string) => {
		setExpandedDays((prev) => ({
			...prev,
			[dateStr]: prev[dateStr] === undefined ? false : !prev[dateStr],
		}));
	};

	// Query Backend Server-Side Aggregation
	const {
		data: reportData,
		isLoading,
		isRefetching,
		refetch,
	} = trpc.orders.getComprehensiveSalesReport.useQuery({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
		search: searchQuery.trim() || undefined,
	});

	const overall = reportData?.overall || {
		totalOrders: 0,
		uniqueCustomers: 0,
		totalSalesAmount: 0,
		totalItemsSoldQuantity: 0,
		avgOrderValue: 0,
		avgItemsPerOrder: 0,
		routesCovered: 0,
		villagesCovered: 0,
	};

	const periodDisplay = useMemo(() => {
		if (startDate && endDate) {
			return `${startDate} to ${endDate}`;
		}
		if (startDate) return `From ${startDate}`;
		if (endDate) return `Until ${endDate}`;
		if (datePreset === "today") return "Today";
		if (datePreset === "yesterday") return "Yesterday";
		if (datePreset === "last7") return "Last 7 Days";
		if (datePreset === "thisMonth") return "This Month";
		return "All Time History";
	}, [startDate, endDate, datePreset]);

	const allProductsList = useMemo(() => {
		return reportData?.allProductsSold || reportData?.mostSellingProducts || [];
	}, [reportData]);

	const productCategories = useMemo(() => {
		const cats = new Set<string>();
		for (const p of allProductsList) {
			if (p.category) cats.add(p.category);
		}
		return Array.from(cats);
	}, [allProductsList]);

	const filteredAllProducts = useMemo(() => {
		return allProductsList.filter((p) => {
			const matchesSearch =
				!productSearchTerm.trim() ||
				p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
				(p.category &&
					p.category.toLowerCase().includes(productSearchTerm.toLowerCase()));
			const matchesCategory =
				productCategoryFilter === "all" || p.category === productCategoryFilter;
			return matchesSearch && matchesCategory;
		});
	}, [allProductsList, productSearchTerm, productCategoryFilter]);

	const filteredTotalPieces = useMemo(() => {
		return filteredAllProducts.reduce(
			(sum, p) => sum + (Number(p.totalQty) || 0),
			0,
		);
	}, [filteredAllProducts]);

	const filteredTotalAmount = useMemo(() => {
		return filteredAllProducts.reduce(
			(sum, p) => sum + (Number(p.totalSalesAmount) || 0),
			0,
		);
	}, [filteredAllProducts]);

	// Helper for escaping CSV fields
	const escapeCsv = (val: any): string => {
		if (val === null || val === undefined) return '""';
		const str = String(val).replace(/"/g, '""');
		return `"${str}"`;
	};

	// Download Product Pieces Breakdown CSV
	const handleDownloadProductsCsv = () => {
		const list = filteredAllProducts || [];
		if (list.length === 0) {
			toast.info("No products found for the selected period.");
			return;
		}

		const rows: string[] = [];
		rows.push("=== EVALUNA ERP - PRODUCT SALES & PIECES BREAKDOWN ===");
		rows.push(`Period,${escapeCsv(periodDisplay)}`);
		rows.push(`Total Pieces Sold,${filteredTotalPieces}`);
		rows.push(`Total Sales Revenue,${filteredTotalAmount}`);
		rows.push(`Total Products Listed,${list.length}`);
		rows.push("");
		rows.push(
			"Product Name,Category,Quantity / Pieces Sold,Unit,Orders Count,Unique Customers,Unit Price (INR),Total Sales Revenue (INR)",
		);

		for (const p of list) {
			rows.push(
				[
					escapeCsv(p.name),
					escapeCsv(p.category || "General"),
					escapeCsv(p.totalQty),
					escapeCsv(p.unit || "Pcs"),
					escapeCsv(p.orderCount),
					escapeCsv(p.uniqueCustomerCount || 0),
					escapeCsv(p.price || 0),
					escapeCsv(p.totalSalesAmount || 0),
				].join(","),
			);
		}

		if (reportData?.dailyTrend && reportData.dailyTrend.length > 0) {
			rows.push("");
			rows.push("=== DAY-BY-DAY PRODUCT DISPATCH & PIECES BREAKDOWN ===");
			rows.push(
				"Date,Orders,Total Pieces,Daily Revenue (INR),Product Name,Product Category,Pieces Sold,Line Revenue (INR)",
			);
			for (const day of reportData.dailyTrend) {
				if (day.products && day.products.length > 0) {
					for (const dp of day.products) {
						rows.push(
							[
								escapeCsv(day.date),
								escapeCsv(day.orders),
								escapeCsv(day.totalPieces),
								escapeCsv(day.sales),
								escapeCsv(dp.name),
								escapeCsv(dp.category),
								escapeCsv(dp.totalQty),
								escapeCsv(dp.totalAmount),
							].join(","),
						);
					}
				}
			}
		}

		const blob = new Blob([rows.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `Product_Pieces_Report_${periodDisplay.replace(/\s+/g, "_")}.csv`;
		link.click();
		URL.revokeObjectURL(url);
		toast.success("Product Pieces CSV downloaded successfully!");
	};

	// 1. Download Detailed Operational CSV
	const handleDownloadDetailedCsv = () => {
		const lines = reportData?.detailedOrderLines || [];
		if (lines.length === 0) {
			toast.info("No sales order items found for the selected date range.");
			return;
		}

		const headers = [
			"Order ID",
			"Order Ref",
			"Order Date",
			"Order Time",
			"Sales Person",
			"Customer ID",
			"Customer Name",
			"Customer Phone",
			"Village / Area",
			"Route Name",
			"Product ID",
			"Product Name",
			"Category",
			"Quantity",
			"Unit",
			"Unit Price (INR)",
			"Line Total (INR)",
			"Order Total (INR)",
			"Order Status",
			"Payment Status",
		];

		const rows = lines.map((l) => [
			escapeCsv(l.orderId),
			escapeCsv(l.orderRef),
			escapeCsv(l.orderDate),
			escapeCsv(l.orderTime),
			escapeCsv(l.salesPerson),
			escapeCsv(l.customerId),
			escapeCsv(l.customerName),
			escapeCsv(l.customerPhone),
			escapeCsv(l.village),
			escapeCsv(l.route),
			escapeCsv(l.productId),
			escapeCsv(l.productName),
			escapeCsv(l.category),
			escapeCsv(l.quantity),
			escapeCsv(l.unit),
			escapeCsv(l.unitPrice),
			escapeCsv(l.lineAmount),
			escapeCsv(l.orderTotal),
			escapeCsv(l.orderStatus),
			escapeCsv(l.paymentStatus),
		]);

		const csvContent =
			"\uFEFF" +
			[headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		const filename = `Sales_Detailed_Orders_${periodDisplay.replace(/\s+/g, "_")}.csv`;
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		toast.success(`Exported ${lines.length} detailed order items to CSV!`);
	};

	// 2. Download Structured Summary Management CSV
	const handleDownloadSummaryCsv = () => {
		if (!reportData || overall.totalOrders === 0) {
			toast.info("No report data available to summarize for this range.");
			return;
		}

		const sections: string[] = [];

		// Section 1: Executive Summary
		sections.push("=== EVALUNA ERP - EXECUTIVE SALES SUMMARY ===");
		sections.push(`Report Period,${escapeCsv(periodDisplay)}`);
		sections.push(`Generated On,${escapeCsv(new Date().toLocaleString())}`);
		sections.push(`Total Orders,${overall.totalOrders}`);
		sections.push(`Unique Customers,${overall.uniqueCustomers}`);
		sections.push(`Total Revenue (INR),${overall.totalSalesAmount}`);
		sections.push(
			`Total Items Quantity Sold,${overall.totalItemsSoldQuantity}`,
		);
		sections.push(`Average Order Value (INR),${overall.avgOrderValue}`);
		sections.push(`Average Items Per Order,${overall.avgItemsPerOrder}`);
		sections.push(`Routes Covered,${overall.routesCovered}`);
		sections.push(`Villages/Areas Covered,${overall.villagesCovered}`);
		sections.push("");

		// Section 2: Product Demand Summary
		sections.push("=== PRODUCT DEMAND SUMMARY ===");
		sections.push(
			"Product ID,Product Name,Category,Unit,Orders Count,Unique Customers,Total Quantity Sold,Total Sales Revenue (INR)",
		);
		for (const p of reportData.mostSellingProducts || []) {
			sections.push(
				[
					escapeCsv(p.id),
					escapeCsv(p.name),
					escapeCsv(p.category),
					escapeCsv(p.unit),
					escapeCsv(p.orderCount),
					escapeCsv(p.uniqueCustomerCount),
					escapeCsv(p.totalQty),
					escapeCsv(p.totalSalesAmount),
				].join(","),
			);
		}
		sections.push("");

		// Section 3: Route Demand Summary
		sections.push("=== ROUTE DEMAND SUMMARY ===");
		sections.push(
			"Route Name,Total Orders,Unique Customers,Total Quantity Sold,Total Sales Amount (INR),Avg Order Value (INR),Top Demanded Product",
		);
		for (const r of reportData.routeList || []) {
			sections.push(
				[
					escapeCsv(r.routeName),
					escapeCsv(r.orderCount),
					escapeCsv(r.customerCount),
					escapeCsv(r.totalQty),
					escapeCsv(r.totalSalesAmount),
					escapeCsv(r.avgOrderValue),
					escapeCsv(r.topProduct),
				].join(","),
			);
		}
		sections.push("");

		// Section 4: Village / Area Demand Summary
		sections.push("=== VILLAGE / AREA DEMAND SUMMARY ===");
		sections.push(
			"Village / Area,Route Name,Orders,Unique Customers,Total Quantity,Total Revenue (INR)",
		);
		for (const v of reportData.villageList || []) {
			sections.push(
				[
					escapeCsv(v.villageName),
					escapeCsv(v.routeName),
					escapeCsv(v.orderCount),
					escapeCsv(v.customerCount),
					escapeCsv(v.totalQty),
					escapeCsv(v.totalSalesAmount),
				].join(","),
			);
		}
		sections.push("");

		// Section 5: Customer Performance Summary
		sections.push("=== CUSTOMER ANALYSIS SUMMARY ===");
		sections.push(
			"Customer Code,Customer Name,Phone,Village,Route,Sales Agent,Order Count,Total Quantity,Total Sales Amount (INR)",
		);
		for (const c of reportData.customerList || []) {
			sections.push(
				[
					escapeCsv(c.code),
					escapeCsv(c.name),
					escapeCsv(c.phone),
					escapeCsv(c.village),
					escapeCsv(c.route),
					escapeCsv(c.salesPerson),
					escapeCsv(c.orderCount),
					escapeCsv(c.totalQty),
					escapeCsv(c.totalAmount),
				].join(","),
			);
		}

		const csvContent = "\uFEFF" + sections.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		const filename = `Sales_Summary_${periodDisplay.replace(/\s+/g, "_")}.csv`;
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Exported Management Sales Summary to CSV!");
	};

	// 3. Download Professional PDF Report using jsPDF + autoTable
	const handleDownloadPdf = async () => {
		if (!reportData || overall.totalOrders === 0) {
			toast.info("No sales data available to generate PDF.");
			return;
		}

		setIsPdfGenerating(true);
		try {
			const autoTableModule = await import("jspdf-autotable");
			const autoTable = autoTableModule.default;

			const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
			const pageWidth = doc.internal.pageSize.getWidth();

			// Header Branding
			doc.setFillColor(15, 23, 42); // slate-900
			doc.rect(0, 0, pageWidth, 26, "F");

			doc.setTextColor(255, 255, 255);
			doc.setFontSize(16);
			doc.setFont("helvetica", "bold");
			doc.text("EVALUNA ERP — SALES PERFORMANCE REPORT", 14, 12);

			doc.setFontSize(9);
			doc.setFont("helvetica", "normal");
			doc.text(
				`Period: ${periodDisplay}  |  Generated: ${new Date().toLocaleString()}`,
				14,
				20,
			);

			let y = 34;

			// Key Metrics Cards Grid Summary
			doc.setTextColor(30, 41, 59);
			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.text("1. EXECUTIVE SUMMARY METRICS", 14, y);
			y += 5;

			const metrics = [
				["Total Orders", String(overall.totalOrders)],
				["Unique Customers", String(overall.uniqueCustomers)],
				[
					"Total Sales Revenue",
					`Rs. ${overall.totalSalesAmount.toLocaleString("en-IN")}`,
				],
				["Items Quantity Sold", String(overall.totalItemsSoldQuantity)],
				[
					"Avg Order Value",
					`Rs. ${overall.avgOrderValue.toLocaleString("en-IN")}`,
				],
				[
					"Routes / Areas",
					`${overall.routesCovered} Routes / ${overall.villagesCovered} Villages`,
				],
			];

			autoTable(doc, {
				startY: y,
				head: [["Metric", "Value"]],
				body: metrics,
				theme: "striped",
				headStyles: {
					fillColor: [30, 58, 138],
					textColor: [255, 255, 255],
					fontStyle: "bold",
				},
				styles: { fontSize: 8.5, overflow: "linebreak" },
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 10;

			// Top Selling Products Table
			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.text("2. TOP SELLING PRODUCTS (BY QUANTITY)", 14, y);
			y += 5;

			const topProductsRows = (reportData.mostSellingProducts || [])
				.slice(0, 10)
				.map((p) => [
					p.name,
					p.category,
					String(p.totalQty) + " " + (p.unit || "Pcs"),
					String(p.orderCount),
					`Rs. ${p.totalSalesAmount.toLocaleString("en-IN")}`,
				]);

			autoTable(doc, {
				startY: y,
				head: [
					[
						"Product Name",
						"Category",
						"Quantity Sold",
						"Orders",
						"Total Revenue",
					],
				],
				body: topProductsRows,
				theme: "grid",
				headStyles: {
					fillColor: [16, 185, 129],
					textColor: [255, 255, 255],
					fontStyle: "bold",
				},
				styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
				columnStyles: {
					0: { cellWidth: 65 },
					1: { cellWidth: 35 },
					2: { cellWidth: 28 },
					3: { cellWidth: 20 },
					4: { cellWidth: 34 },
				},
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 10;

			// Route Demand Analysis Table
			if (y > 240) {
				doc.addPage();
				y = 20;
			}

			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.text("3. ROUTE DEMAND ANALYSIS", 14, y);
			y += 5;

			const routeRows = (reportData.routeList || []).map((r) => [
				r.routeName,
				String(r.orderCount),
				String(r.customerCount),
				String(r.totalQty),
				`Rs. ${r.totalSalesAmount.toLocaleString("en-IN")}`,
				r.topProduct,
			]);

			autoTable(doc, {
				startY: y,
				head: [
					[
						"Route Name",
						"Orders",
						"Customers",
						"Total Qty",
						"Revenue",
						"Top Demanded Product",
					],
				],
				body: routeRows,
				theme: "grid",
				headStyles: {
					fillColor: [99, 102, 241],
					textColor: [255, 255, 255],
					fontStyle: "bold",
				},
				styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
				columnStyles: {
					0: { cellWidth: 32 },
					1: { cellWidth: 16 },
					2: { cellWidth: 20 },
					3: { cellWidth: 22 },
					4: { cellWidth: 28 },
					5: { cellWidth: 64 },
				},
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 10;

			// Village / Area Demand Table
			if (y > 240) {
				doc.addPage();
				y = 20;
			}

			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.text("4. VILLAGE & AREA DEMAND BREAKDOWN", 14, y);
			y += 5;

			const villageRows = (reportData.villageList || [])
				.slice(0, 15)
				.map((v) => [
					v.villageName,
					v.routeName,
					String(v.orderCount),
					String(v.customerCount),
					String(v.totalQty),
					`Rs. ${v.totalSalesAmount.toLocaleString("en-IN")}`,
				]);

			autoTable(doc, {
				startY: y,
				head: [
					[
						"Village / Area",
						"Route",
						"Orders",
						"Customers",
						"Qty",
						"Sales Value",
					],
				],
				body: villageRows,
				theme: "striped",
				headStyles: {
					fillColor: [139, 92, 246],
					textColor: [255, 255, 255],
					fontStyle: "bold",
				},
				styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
				columnStyles: {
					0: { cellWidth: 42 },
					1: { cellWidth: 36 },
					2: { cellWidth: 18 },
					3: { cellWidth: 22 },
					4: { cellWidth: 24 },
					5: { cellWidth: 40 },
				},
				margin: { left: 14, right: 14 },
			});

			// Page numbers
			const pageCount = doc.internal.getNumberOfPages();
			for (let i = 1; i <= pageCount; i++) {
				doc.setPage(i);
				doc.setFontSize(8);
				doc.setTextColor(148, 163, 184);
				doc.text(
					`Evaluna ERP Sales Report — Page ${i} of ${pageCount}`,
					pageWidth / 2,
					doc.internal.pageSize.getHeight() - 8,
					{ align: "center" },
				);
			}

			const filename = `Sales_Report_${periodDisplay.replace(/\s+/g, "_")}.pdf`;
			doc.save(filename);
			toast.success("PDF Sales Report generated and downloaded successfully!");
		} catch (err: any) {
			console.error("PDF generation failed:", err);
			toast.error(`Failed to generate PDF: ${err.message || "Unknown error"}`);
		} finally {
			setIsPdfGenerating(false);
		}
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-3 sm:p-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<Link href="/sales/orders">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-slate-500"
							>
								<ArrowLeftIcon className="h-4 w-4" />
							</Button>
						</Link>
						<h1 className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight sm:text-2xl">
							<BarChart3Icon className="h-6 w-6 text-blue-600" />
							{isHindi
								? "बिक्री रिपोर्ट व एनालिटिक्स"
								: "Sales Orders & Demand Analytics"}
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						{isHindi
							? "तारीख चुनें और उत्पाद मांग, रूट विश्लेषण और विस्तृत बिक्री रिपोर्ट देखें।"
							: "Filter date range to generate comprehensive order, customer, route, and product demand reports."}
					</p>
				</div>

				{/* Export Action Buttons Header */}
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownloadDetailedCsv}
						disabled={isLoading || overall.totalOrders === 0}
						className="h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
					>
						<FileSpreadsheetIcon className="h-4 w-4" />
						{isHindi ? "विस्तृत CSV" : "Detailed CSV"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownloadSummaryCsv}
						disabled={isLoading || overall.totalOrders === 0}
						className="h-9 gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
					>
						<FileTextIcon className="h-4 w-4" />
						{isHindi ? "समरी CSV" : "Summary CSV"}
					</Button>
					<Button
						size="sm"
						onClick={handleDownloadPdf}
						disabled={isLoading || isPdfGenerating || overall.totalOrders === 0}
						className="h-9 gap-1.5 bg-blue-600 font-semibold text-white shadow-xs hover:bg-blue-700"
					>
						{isPdfGenerating ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<DownloadIcon className="h-4 w-4" />
						)}
						{isHindi ? "PDF रिपोर्ट" : "Download PDF"}
					</Button>
				</div>
			</div>

			{/* Date Range Selector Bar */}
			<Card className="border-slate-200 shadow-xs dark:border-slate-800">
				<CardHeader className="px-4 pt-4 pb-3 sm:px-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<CalendarIcon className="h-4 w-4 text-blue-600" />
							<CardTitle className="font-bold text-sm">
								{isHindi
									? "रिपोर्ट समय-सीमा चुनें (Date Range Filter)"
									: "Report Date Range Filter"}
							</CardTitle>
						</div>
						<Badge
							variant="outline"
							className="w-fit border-blue-200 font-mono text-blue-700 text-xs dark:border-blue-800 dark:text-blue-400"
						>
							Active Period: {periodDisplay}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4 sm:px-6">
					<DateFilterBar
						startDate={startDate}
						endDate={endDate}
						datePreset={datePreset}
						totalCount={overall.totalOrders}
						countLabel={isHindi ? "ऑर्डर" : "orders"}
						totalAmount={overall.totalSalesAmount}
						amountLabel={isHindi ? "कुल बिक्री:" : "Total Sales:"}
						onDateChange={(start, end, preset) => {
							setStartDate(start);
							setEndDate(end);
							setDatePreset(preset);
						}}
					/>
				</CardContent>
			</Card>

			{/* Loading State */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
					<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
					<p className="font-medium text-sm">
						Calculating sales analytics for selected date range...
					</p>
				</div>
			) : overall.totalOrders === 0 ? (
				/* Empty State */
				<Card className="border-dashed p-8 text-center">
					<CardContent className="flex flex-col items-center justify-center gap-3 py-10">
						<ShoppingBagIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
						<h3 className="font-bold text-base text-foreground">
							{isHindi
								? "चुनी गई अवधि में कोई बिक्री ऑर्डर नहीं मिला"
								: "No sales orders found for the selected period"}
						</h3>
						<p className="max-w-md text-muted-foreground text-xs">
							{isHindi
								? "कृपया फ़िल्टर बार से दूसरी तारीख सीमा या प्रीसेट (जैसे 'This Month' या 'All') चुनें।"
								: "Try selecting another date range or preset from the filter bar above to view analytics."}
						</p>
					</CardContent>
				</Card>
			) : (
				/* Report Content & Visual Dashboard */
				<div className="space-y-6">
					{/* Top Overall Summary Cards */}
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
						<Card className="bg-slate-50/50 dark:bg-slate-900/40">
							<CardContent className="p-4">
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="font-semibold text-xs uppercase">
										{isHindi ? "कुल बिक्री" : "Total Revenue"}
									</span>
									<IndianRupeeIcon className="h-4 w-4 text-emerald-600" />
								</div>
								<div className="mt-2 font-bold text-emerald-600 text-lg sm:text-2xl">
									{formatCurrency(overall.totalSalesAmount, locale)}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground">
									From {overall.totalOrders} completed orders
								</p>
							</CardContent>
						</Card>

						<Card className="bg-slate-50/50 dark:bg-slate-900/40">
							<CardContent className="p-4">
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="font-semibold text-xs uppercase">
										{isHindi ? "कुल ऑर्डर" : "Total Orders"}
									</span>
									<ShoppingBagIcon className="h-4 w-4 text-blue-600" />
								</div>
								<div className="mt-2 font-bold text-lg text-slate-900 sm:text-2xl dark:text-slate-100">
									{overall.totalOrders}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground">
									Avg: {formatCurrency(overall.avgOrderValue, locale)} / order
								</p>
							</CardContent>
						</Card>

						<Card className="bg-slate-50/50 dark:bg-slate-900/40">
							<CardContent className="p-4">
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="font-semibold text-xs uppercase">
										{isHindi ? "यूनिक ग्राहक" : "Unique Customers"}
									</span>
									<UsersIcon className="h-4 w-4 text-purple-600" />
								</div>
								<div className="mt-2 font-bold text-lg text-slate-900 sm:text-2xl dark:text-slate-100">
									{overall.uniqueCustomers}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground">
									Across {overall.villagesCovered} villages/areas
								</p>
							</CardContent>
						</Card>

						<Card className="bg-slate-50/50 dark:bg-slate-900/40">
							<CardContent className="p-4">
								<div className="flex items-center justify-between text-muted-foreground">
									<span className="font-semibold text-xs uppercase">
										{isHindi ? "आइटम बिके" : "Items Sold Qty"}
									</span>
									<PackageIcon className="h-4 w-4 text-amber-600" />
								</div>
								<div className="mt-2 font-bold text-amber-600 text-lg sm:text-2xl">
									{overall.totalItemsSoldQuantity.toLocaleString("en-IN")}
								</div>
								<p className="mt-1 text-[11px] text-muted-foreground">
									Avg: {overall.avgItemsPerOrder} items / order
								</p>
							</CardContent>
						</Card>
					</div>

					{/* All Products Sold (Piece by Piece & Day-by-Day View) */}
					<Card className="border-slate-200 shadow-sm dark:border-slate-800">
						<CardHeader className="border-b bg-slate-50/50 pb-4 dark:bg-slate-900/50">
							<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<PackageIcon className="h-5 w-5 text-amber-600" />
										<CardTitle className="font-bold text-foreground text-lg">
											{isHindi
												? "सभी बिके हुए उत्पाद (पीस अनुसार विवरण)"
												: "All Products Sold — Pieces & Dispatch Breakdown"}
										</CardTitle>
										<Badge
											variant="secondary"
											className="border-amber-300 bg-amber-100 font-bold text-amber-900 text-xs dark:bg-amber-950/60 dark:text-amber-200"
										>
											{overall.totalItemsSoldQuantity.toLocaleString("en-IN")} Total Pieces (कुल पीस)
										</Badge>
										<Badge variant="outline" className="text-xs">
											{filteredAllProducts.length} Products
										</Badge>
									</div>
									<CardDescription className="mt-1 text-xs">
										{isHindi
											? `${periodDisplay} में गए सभी उत्पादों के पीस, ऑर्डर काउंट और बिक्री राशि का पूरा विवरण।`
											: `Full piece-by-piece tally of every product sold and dispatched during ${periodDisplay}.`}
									</CardDescription>
								</div>

								{/* View Switcher Tabs & CSV Export */}
								<div className="flex flex-wrap items-center gap-2">
									<div className="flex rounded-lg border bg-slate-100 p-0.5 dark:bg-slate-800">
										<button
											type="button"
											onClick={() => setProductViewTab("allProducts")}
											className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-all ${
												productViewTab === "allProducts"
													? "bg-white font-bold text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
													: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
											}`}
										>
											<LayersIcon className="h-3.5 w-3.5" />
											<span>{isHindi ? "सभी उत्पाद" : "All Products"}</span>
											<span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] dark:bg-slate-600">
												{filteredAllProducts.length}
											</span>
										</button>
										<button
											type="button"
											onClick={() => setProductViewTab("dayByDay")}
											className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-all ${
												productViewTab === "dayByDay"
													? "bg-white font-bold text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
													: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
											}`}
										>
											<CalendarDaysIcon className="h-3.5 w-3.5" />
											<span>{isHindi ? "दिन-वार पीस (Day by Day)" : "Day by Day"}</span>
											<span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] dark:bg-slate-600">
												{reportData?.dailyTrend?.length || 0}
											</span>
										</button>
									</div>

									<Button
										variant="outline"
										size="sm"
										onClick={handleDownloadProductsCsv}
										className="h-8 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 text-xs dark:border-amber-800 dark:text-amber-300"
									>
										<FileSpreadsheetIcon className="h-3.5 w-3.5" />
										<span>{isHindi ? "पीस CSV" : "Export Pieces CSV"}</span>
									</Button>
								</div>
							</div>

							{/* Search & Category Filter Toolbar */}
							<div className="mt-4 flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
								<div className="relative flex-1 sm:max-w-xs">
									<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										type="text"
										placeholder={isHindi ? "उत्पाद या श्रेणी खोजें..." : "Search product name or category..."}
										value={productSearchTerm}
										onChange={(e) => setProductSearchTerm(e.target.value)}
										className="h-9 pl-9 text-xs"
									/>
								</div>

								{/* Category Pills */}
								<div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
									<span className="text-[11px] font-medium text-muted-foreground mr-1">
										{isHindi ? "श्रेणी:" : "Category:"}
									</span>
									<button
										type="button"
										onClick={() => setProductCategoryFilter("all")}
										className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
											productCategoryFilter === "all"
												? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										All ({allProductsList.length})
									</button>
									{productCategories.map((cat) => (
										<button
											key={cat}
											type="button"
											onClick={() => setProductCategoryFilter(cat)}
											className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-all ${
												productCategoryFilter === cat
													? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
													: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
											}`}
										>
											{cat}
										</button>
									))}
								</div>
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{productViewTab === "allProducts" ? (
								/* View 1: Consolidated All Products Table */
								<div className="w-full overflow-x-auto">
									<Table className="min-w-[650px] text-xs">
										<TableHeader>
											<TableRow className="bg-slate-100/70 font-semibold dark:bg-slate-900/60">
												<TableHead className="w-12 text-center">#</TableHead>
												<TableHead className="font-bold">
													{isHindi ? "उत्पाद नाम (Product Name)" : "Product Name"}
												</TableHead>
												<TableHead className="font-bold">
													{isHindi ? "श्रेणी (Category)" : "Category"}
												</TableHead>
												<TableHead className="text-center font-bold text-amber-700 dark:text-amber-400">
													{isHindi ? "कुल पीस (Pieces / Qty)" : "Total Pieces Sold"}
												</TableHead>
												<TableHead className="text-center font-bold">
													{isHindi ? "ऑर्डर (Orders)" : "Orders"}
												</TableHead>
												<TableHead className="text-center font-bold">
													{isHindi ? "ग्राहक (Customers)" : "Customers"}
												</TableHead>
												<TableHead className="text-right font-bold">
													{isHindi ? "दर (Price)" : "Unit Price"}
												</TableHead>
												<TableHead className="text-right font-bold text-emerald-600">
													{isHindi ? "कुल बिक्री (Total Sales)" : "Total Revenue"}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
											{filteredAllProducts.length === 0 ? (
												<TableRow>
													<TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
														{isHindi
															? "कोई उत्पाद नहीं मिला।"
															: "No products match your search or filter."}
													</TableCell>
												</TableRow>
											) : (
												filteredAllProducts.map((p, idx) => (
													<TableRow
														key={p.id}
														className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
													>
														<TableCell className="text-center font-mono text-muted-foreground">
															{idx + 1}
														</TableCell>
														<TableCell>
															<div className="font-bold text-slate-900 dark:text-slate-100">
																{p.name}
															</div>
															{p.unit && (
																<span className="text-[10px] text-muted-foreground">
																	Unit: {p.unit}
																</span>
															)}
														</TableCell>
														<TableCell>
															<Badge
																variant="outline"
																className="text-[11px] font-normal capitalize"
															>
																{p.category || "General"}
															</Badge>
														</TableCell>
														<TableCell className="text-center">
															<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700 text-xs shadow-2xs ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-700">
																{p.totalQty} {p.unit || "Pcs"}
															</span>
														</TableCell>
														<TableCell className="text-center font-medium">
															{p.orderCount}
														</TableCell>
														<TableCell className="text-center text-muted-foreground">
															{p.uniqueCustomerCount || "—"}
														</TableCell>
														<TableCell className="text-right text-muted-foreground">
															{formatCurrency(p.price || 0, locale)}
														</TableCell>
														<TableCell className="text-right font-bold text-emerald-600">
															{formatCurrency(p.totalSalesAmount, locale)}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
										{/* Table Summary Footer */}
										{filteredAllProducts.length > 0 && (
											<tfoot>
												<TableRow className="border-t-2 border-slate-300 bg-slate-100/90 font-bold dark:border-slate-700 dark:bg-slate-900">
													<TableCell colSpan={3} className="font-extrabold text-foreground uppercase">
														{isHindi ? "कुल योग (Grand Total)" : "Grand Total"} ({filteredAllProducts.length} Items)
													</TableCell>
													<TableCell className="text-center font-black text-amber-700 text-sm dark:text-amber-400">
														{filteredTotalPieces.toLocaleString("en-IN")} Pcs
													</TableCell>
													<TableCell className="text-center font-bold">
														{overall.totalOrders}
													</TableCell>
													<TableCell className="text-center font-bold text-muted-foreground">
														{overall.uniqueCustomers}
													</TableCell>
													<TableCell className="text-right text-muted-foreground">
														—
													</TableCell>
													<TableCell className="text-right font-black text-emerald-700 text-sm dark:text-emerald-400">
														{formatCurrency(filteredTotalAmount, locale)}
													</TableCell>
												</TableRow>
											</tfoot>
										)}
									</Table>
								</div>
							) : (
								/* View 2: Day-by-Day Pieces Breakdown */
								<div className="space-y-4 p-4">
									{(reportData?.dailyTrend || []).length === 0 ? (
										<div className="py-8 text-center text-muted-foreground">
											{isHindi ? "कोई दैनिक डेटा उपलब्ध नहीं है।" : "No daily records available."}
										</div>
									) : (
										(reportData?.dailyTrend || []).map((day) => {
											const isExpanded = expandedDays[day.date] ?? true;
											const dayProducts = day.products || [];
											const totalPiecesToday = day.totalPieces || dayProducts.reduce((s, p) => s + (Number(p.totalQty) || 0), 0);

											return (
												<Card
													key={day.date}
													className="border border-slate-200 shadow-2xs dark:border-slate-800"
												>
													<div
														onClick={() => toggleExpandDay(day.date)}
														className="flex cursor-pointer flex-col gap-2 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-100/70 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900/60 dark:hover:bg-slate-800/60"
													>
														<div className="flex items-center gap-3">
															<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
																<CalendarDaysIcon className="h-4 w-4" />
															</div>
															<div>
																<div className="font-bold text-foreground text-sm">
																	{new Date(day.date + "T00:00:00").toLocaleDateString(
																		locale === "hi" ? "hi-IN" : "en-IN",
																		{
																			weekday: "short",
																			year: "numeric",
																			month: "short",
																			day: "numeric",
																		},
																	)}
																</div>
																<p className="text-[11px] text-muted-foreground font-mono">
																	{day.date}
																</p>
															</div>
														</div>

														<div className="flex flex-wrap items-center gap-3 text-xs">
															<Badge
																variant="outline"
																className="border-amber-300 bg-amber-50 font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
															>
																📦 {totalPiecesToday} {isHindi ? "पीस गए" : "Pieces Sold"}
															</Badge>
															<Badge variant="outline" className="text-muted-foreground">
																🛒 {day.orders} {isHindi ? "ऑर्डर" : "Orders"}
															</Badge>
															<span className="font-bold text-emerald-600 sm:text-sm">
																{formatCurrency(day.sales, locale)}
															</span>
															{isExpanded ? (
																<ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
															) : (
																<ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
															)}
														</div>
													</div>

													{isExpanded && (
														<div className="border-t">
															{dayProducts.length === 0 ? (
																<div className="p-4 text-center text-muted-foreground text-xs">
																	{isHindi ? "इस दिन कोई आइटम विवरण नहीं मिला।" : "No item line details found for this date."}
																</div>
															) : (
																<Table className="text-xs">
																	<TableHeader>
																		<TableRow className="bg-slate-100/50 dark:bg-slate-900/40">
																			<TableHead className="w-10">#</TableHead>
																			<TableHead className="font-bold">
																				{isHindi ? "उत्पाद" : "Product"}
																			</TableHead>
																			<TableHead className="font-bold">
																				{isHindi ? "श्रेणी" : "Category"}
																			</TableHead>
																			<TableHead className="text-center font-bold text-amber-700 dark:text-amber-400">
																				{isHindi ? "पीस मात्रा" : "Pieces (Qty)"}
																			</TableHead>
																			<TableHead className="text-center font-bold">
																				{isHindi ? "ऑर्डर संख्या" : "Orders"}
																			</TableHead>
																			<TableHead className="text-right font-bold text-emerald-600">
																				{isHindi ? "कुल राशि" : "Revenue"}
																			</TableHead>
																		</TableRow>
																	</TableHeader>
																	<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
																		{dayProducts.map((dp, pIdx) => (
																			<TableRow key={pIdx}>
																				<TableCell className="text-muted-foreground font-mono">
																					{pIdx + 1}
																				</TableCell>
																				<TableCell className="font-semibold text-foreground">
																					{dp.name}
																				</TableCell>
																				<TableCell className="text-muted-foreground capitalize">
																					{dp.category || "General"}
																				</TableCell>
																				<TableCell className="text-center font-bold text-amber-700 dark:text-amber-400">
																					{dp.totalQty} {dp.unit || "Pcs"}
																				</TableCell>
																				<TableCell className="text-center">
																					{dp.orderCount}
																				</TableCell>
																				<TableCell className="text-right font-medium text-emerald-600">
																					{formatCurrency(dp.totalAmount, locale)}
																				</TableCell>
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
															)}
														</div>
													)}
												</Card>
											);
										})
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* 2-Column Section: Product Demand (Most & Least Selling) */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Most Selling Products */}
						<Card className="border-slate-200 shadow-xs dark:border-slate-800">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2 font-bold text-base">
										<TrendingUpIcon className="h-4 w-4 text-emerald-600" />
										{isHindi
											? "सबसे ज़्यादा बिकने वाले उत्पाद (Most Selling)"
											: "Top Selling Products (By Quantity)"}
									</CardTitle>
									<Badge
										variant="outline"
										className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
									>
										Highest Volume
									</Badge>
								</div>
								<CardDescription className="text-xs">
									Products with maximum quantity ordered during {periodDisplay}
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="bg-slate-50/70 dark:bg-slate-900/60">
											<TableHead className="font-bold">Product</TableHead>
											<TableHead className="font-bold">Category</TableHead>
											<TableHead className="text-center font-bold text-emerald-600">
												Qty Sold
											</TableHead>
											<TableHead className="text-right font-bold">
												Revenue
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{(reportData.mostSellingProducts || [])
											.slice(0, 5)
											.map((p) => (
												<TableRow key={p.id}>
													<TableCell className="font-bold text-slate-900 dark:text-slate-100">
														{p.name}
													</TableCell>
													<TableCell className="text-muted-foreground capitalize">
														{p.category}
													</TableCell>
													<TableCell className="text-center font-bold text-emerald-600">
														{p.totalQty} {p.unit || "Pcs"}
													</TableCell>
													<TableCell className="text-right font-semibold">
														{formatCurrency(p.totalSalesAmount, locale)}
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						{/* Highest Revenue Products */}
						<Card className="border-slate-200 shadow-xs dark:border-slate-800">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2 font-bold text-base">
										<IndianRupeeIcon className="h-4 w-4 text-blue-600" />
										{isHindi
											? "सर्वाधिक राजस्व उत्पाद (Highest Revenue)"
											: "Highest Revenue Generating Products"}
									</CardTitle>
									<Badge
										variant="outline"
										className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
									>
										Highest Sales ₹
									</Badge>
								</div>
								<CardDescription className="text-xs">
									Products contributing most to gross sales revenue
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="bg-slate-50/70 dark:bg-slate-900/60">
											<TableHead className="font-bold">Product</TableHead>
											<TableHead className="font-bold">Orders</TableHead>
											<TableHead className="text-center font-bold">
												Qty Sold
											</TableHead>
											<TableHead className="text-right font-bold text-blue-600">
												Total Sales
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{(reportData.highestRevenueProducts || [])
											.slice(0, 5)
											.map((p) => (
												<TableRow key={p.id}>
													<TableCell className="font-bold text-slate-900 dark:text-slate-100">
														{p.name}
													</TableCell>
													<TableCell className="text-muted-foreground">
														{p.orderCount} orders
													</TableCell>
													<TableCell className="text-center font-medium">
														{p.totalQty} {p.unit || "Pcs"}
													</TableCell>
													<TableCell className="text-right font-bold text-blue-600">
														{formatCurrency(p.totalSalesAmount, locale)}
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>

					{/* Route & Area Demand Analysis Section */}
					<Card className="border-slate-200 shadow-xs dark:border-slate-800">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<MapPinIcon className="h-4 w-4 text-indigo-600" />
									{isHindi
										? "रूट वार बिक्री मांग विश्लेषण (Route Demand Analysis)"
										: "Route Demand & Geography Analysis"}
								</CardTitle>
								<Badge
									variant="outline"
									className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
								>
									{overall.routesCovered} Routes Tracked
								</Badge>
							</div>
							<CardDescription className="text-xs">
								Breakdown of orders, quantity, and top demanded products by
								delivery route
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0">
							<div className="w-full overflow-x-auto">
								<Table className="min-w-[700px] text-xs">
									<TableHeader>
										<TableRow className="bg-slate-50/70 dark:bg-slate-900/60">
											<TableHead className="font-bold">Route Name</TableHead>
											<TableHead className="text-center font-bold">
												Orders
											</TableHead>
											<TableHead className="text-center font-bold">
												Customers
											</TableHead>
											<TableHead className="text-center font-bold">
												Total Qty
											</TableHead>
											<TableHead className="text-right font-bold">
												Avg Order Value
											</TableHead>
											<TableHead className="text-right font-bold text-indigo-600">
												Total Sales
											</TableHead>
											<TableHead className="font-bold">
												Top Demanded Item
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{(reportData.routeList || []).map((r, idx) => (
											<TableRow key={idx}>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{r.routeName}
												</TableCell>
												<TableCell className="text-center font-semibold">
													{r.orderCount}
												</TableCell>
												<TableCell className="text-center text-muted-foreground">
													{r.customerCount}
												</TableCell>
												<TableCell className="text-center font-medium">
													{r.totalQty}
												</TableCell>
												<TableCell className="text-right text-muted-foreground">
													{formatCurrency(r.avgOrderValue, locale)}
												</TableCell>
												<TableCell className="text-right font-bold text-indigo-600">
													{formatCurrency(r.totalSalesAmount, locale)}
												</TableCell>
												<TableCell className="font-medium text-slate-700 dark:text-slate-300">
													<Badge
														variant="outline"
														className="font-normal text-[10px]"
													>
														{r.topProduct}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					{/* Village / Area Demand & Salesperson Breakdown Grid */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Village Demand Breakdown */}
						<Card className="border-slate-200 shadow-xs dark:border-slate-800">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<StoreIcon className="h-4 w-4 text-purple-600" />
									{isHindi
										? "गाँव / क्षेत्र मांग विवरण (Village Demand)"
										: "Village / Area Demand Distribution"}
								</CardTitle>
								<CardDescription className="text-xs">
									Concentration of orders across villages and local market areas
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="bg-slate-50/70 dark:bg-slate-900/60">
											<TableHead className="font-bold">
												Village / Area
											</TableHead>
											<TableHead className="font-bold">Route</TableHead>
											<TableHead className="text-center font-bold">
												Orders
											</TableHead>
											<TableHead className="text-right font-bold text-purple-600">
												Sales Value
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{(reportData.villageList || [])
											.slice(0, 8)
											.map((v, idx) => (
												<TableRow key={idx}>
													<TableCell className="font-bold text-slate-900 dark:text-slate-100">
														{v.villageName}
													</TableCell>
													<TableCell className="text-[11px] text-muted-foreground">
														{v.routeName}
													</TableCell>
													<TableCell className="text-center font-medium">
														{v.orderCount}
													</TableCell>
													<TableCell className="text-right font-bold text-purple-600">
														{formatCurrency(v.totalSalesAmount, locale)}
													</TableCell>
												</TableRow>
											))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						{/* Salesperson Performance Summary */}
						<Card className="border-slate-200 shadow-xs dark:border-slate-800">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<UsersIcon className="h-4 w-4 text-amber-600" />
									{isHindi
										? "विक्रेता प्रदर्शन (Salesperson Summary)"
										: "Salesperson Performance Summary"}
								</CardTitle>
								<CardDescription className="text-xs">
									Order count and sales generated per team member
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0">
								<Table className="text-xs">
									<TableHeader>
										<TableRow className="bg-slate-50/70 dark:bg-slate-900/60">
											<TableHead className="font-bold">Sales Agent</TableHead>
											<TableHead className="text-center font-bold">
												Orders
											</TableHead>
											<TableHead className="text-center font-bold">
												Routes
											</TableHead>
											<TableHead className="text-right font-bold text-amber-600">
												Total Sales
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
										{(reportData.salespersonList || []).map((sp, idx) => (
											<TableRow key={idx}>
												<TableCell className="font-bold text-slate-900 dark:text-slate-100">
													{sp.salesPersonName}
												</TableCell>
												<TableCell className="text-center font-medium">
													{sp.orderCount}
												</TableCell>
												<TableCell className="text-center text-muted-foreground">
													{sp.routesCoveredCount} routes
												</TableCell>
												<TableCell className="text-right font-bold text-amber-600">
													{formatCurrency(sp.totalSalesAmount, locale)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</PageTransition>
	);
}
