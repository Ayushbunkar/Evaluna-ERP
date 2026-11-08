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
	ArchiveIcon,
	CheckCircle2Icon,
	ChevronDownIcon,
	ChevronUpIcon,
	ClockIcon,
	DownloadIcon,
	FileBarChartIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	IndianRupeeIcon,
	LayersIcon,
	PackageIcon,
	PercentIcon,
	CalendarDaysIcon,
	EyeIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	FilterIcon,
	Loader2Icon,
	SearchIcon,
	ShieldCheckIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@evaluna/ui/components/input";
import {
	DateFilterBar,
	getDaysAgoStr,
	getMonthStartStr,
	getTodayStr,
	getYesterdayStr,
} from "@/components/shared/filters/date-filter-bar";
import { downloadCsv } from "@/lib/admin/csv";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

interface SavedReportArchive {
	id: string;
	title: string;
	period: string;
	dateGenerated: string;
	totalEmployees: number;
	overallCompletionRate: number;
	overallQualityRate: number;
}

interface TeamSummaryItem {
	teamName: string;
	employeeCount: number;
	presentEmployees: number;
	absentEmployees: number;
	leaveEmployees: number;
	totalWorkingHours: number;
	totalOvertimeHours: number;
	totalWorkAssigned: number;
	totalWorkCompleted: number;
	totalQuantityProcessed: number;
	totalRevenueGenerated: number;
	totalExceptions: number;
	avgCompletionRate: number;
	avgQualityRate: number;
}

interface EmployeeDetailItem {
	id: number;
	staffCode: string;
	name: string;
	role: string;
	department: string;
	team: string;
	joinDate: string;
	presentDays: number;
	absentDays: number;
	halfDays: number;
	leaveDays: number;
	lateDays: number;
	totalWorkingHours: number;
	overtimeHours: number;
	attendanceStreak: number;
	totalTasks: number;
	completedTasks: number;
	workAssigned: number;
	workCompleted: number;
	pendingWork: number;
	completionRate: number;
	ordersProcessed: number;
	quantityProcessed: number;
	revenueGenerated: number;
	cashCollected: number;
	productivityValue: number;
	productivityUnit: string;
	errorsCount: number;
	exceptionsCount: number;
	qualityRate: number;
}

export default function ReportsPage() {
	const trpc = useTRPC();
	const t = useTranslations("manager");

	// Filter states
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [datePreset, setDatePreset] = useState("all");
	const [selectedTeam, setSelectedTeam] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"sales_strategy" | "live" | "archive">("sales_strategy");
	const [selectedDayOrders, setSelectedDayOrders] = useState<any | null>(null);
	const [isPdfGenerating, setIsPdfGenerating] = useState(false);

	// Products Sold breakdown states (identical feature-set to sales reports + cost & profit visibility)
	const [productViewTab, setProductViewTab] = useState<"allProducts" | "dayByDay">("allProducts");
	const [productSearchTerm, setProductSearchTerm] = useState<string>("");
	const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
	const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
	const [selectedDayModalTab, setSelectedDayModalTab] = useState<"products" | "bills">("products");

	// Saved Reports Archive State
	const [savedArchives, setSavedArchives] = useState<SavedReportArchive[]>([]);

	// Sourced directly from backend procedure with filtering & multi-tier aggregations
	const {
		data: salesStrategyReport,
		isLoading: isSalesLoading,
		refetch: refetchSales,
	} = trpc.reports.getDayWiseSalesMarginReport.useQuery({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const {
		data: reportResponse,
		isLoading,
		isRefetching,
		refetch,
	} = trpc.manager.getPerformance.useQuery({
		startDate: startDate || undefined,
		endDate: endDate || undefined,
		team: selectedTeam !== "all" ? selectedTeam : undefined,
		search: searchQuery.trim() || undefined,
	});

	// Handle both structure formats safely for backward compatibility
	const isMultiTier = Boolean(
		reportResponse &&
			typeof reportResponse === "object" &&
			"companySummary" in reportResponse,
	);

	const companySummary = useMemo(() => {
		if (isMultiTier && reportResponse && "companySummary" in reportResponse) {
			return reportResponse.companySummary;
		}
		const fallbackList = Array.isArray(reportResponse) ? reportResponse : [];
		return {
			totalTeams: 1,
			totalEmployees: fallbackList.length,
			presentEmployees: fallbackList.length,
			absentEmployees: 0,
			leaveEmployees: 0,
			totalWorkingHours: fallbackList.length * 160,
			totalOvertimeHours: 0,
			totalWorkAssigned: fallbackList.reduce(
				(s, p) => s + (p.totalTasks || 0),
				0,
			),
			totalWorkCompleted: fallbackList.reduce(
				(s, p) => s + (p.completedTasks || 0),
				0,
			),
			totalQuantityProcessed: 0,
			totalRevenueGenerated: 0,
			totalExceptions: 0,
			overallCompletionRate:
				fallbackList.length > 0
					? Math.round(
							fallbackList.reduce((s, p) => s + (p.completionRate || 0), 0) /
								fallbackList.length,
						)
					: 100,
			overallQualityRate: 98,
		};
	}, [isMultiTier, reportResponse]);

	const teamSummaries: TeamSummaryItem[] = useMemo(() => {
		if (isMultiTier && reportResponse && "teamSummaries" in reportResponse) {
			return reportResponse.teamSummaries as TeamSummaryItem[];
		}
		return [];
	}, [isMultiTier, reportResponse]);

	const employeeDetails: EmployeeDetailItem[] = useMemo(() => {
		if (isMultiTier && reportResponse && "employeeDetails" in reportResponse) {
			return reportResponse.employeeDetails as EmployeeDetailItem[];
		}
		if (Array.isArray(reportResponse)) {
			return reportResponse.map((p) => ({
				id: p.id,
				staffCode: `EMP-#${p.id}`,
				name: p.name,
				role: p.role,
				department: "Operations",
				team: "Operations",
				joinDate: "—",
				presentDays: p.attendanceStreak || 0,
				absentDays: 0,
				halfDays: 0,
				leaveDays: 0,
				lateDays: 0,
				totalWorkingHours: 160,
				overtimeHours: 0,
				attendanceStreak: p.attendanceStreak || 0,
				totalTasks: p.totalTasks || 0,
				completedTasks: p.completedTasks || 0,
				workAssigned: p.totalTasks || 0,
				workCompleted: p.completedTasks || 0,
				pendingWork: Math.max((p.totalTasks || 0) - (p.completedTasks || 0), 0),
				completionRate: p.completionRate || 0,
				ordersProcessed: p.completedTasks || 0,
				quantityProcessed: p.completedTasks || 0,
				revenueGenerated: 0,
				cashCollected: 0,
				productivityValue:
					Math.round(((p.completedTasks || 0) / 160) * 10) / 10,
				productivityUnit: "Tasks/Hr",
				errorsCount: 0,
				exceptionsCount: 0,
				qualityRate: 98,
			}));
		}
		return [];
	}, [isMultiTier, reportResponse]);

	const periodDisplay = useMemo(() => {
		if (startDate && endDate) return `${startDate} to ${endDate}`;
		if (startDate) return `From ${startDate}`;
		if (endDate) return `Until ${endDate}`;
		if (datePreset === "today") return "Today";
		if (datePreset === "yesterday") return "Yesterday";
		if (datePreset === "last7") return "Last 7 Days";
		if (datePreset === "thisMonth") return "This Month";
		return "All Time";
	}, [startDate, endDate, datePreset]);

	const escapeCsv = (
		val: string | number | boolean | null | undefined,
	): string => {
		if (val === null || val === undefined) return '""';
		const str = String(val).replace(/"/g, '""');
		return `"${str}"`;
	};

	// Strategic Sales & Margin CSV Export
	const handleExportSalesCSV = () => {
		if (!salesStrategyReport || salesStrategyReport.dayWise.length === 0) {
			toast.info("No sales data available to export for selected period.");
			return;
		}

		const sections: string[] = [];
		const summary = salesStrategyReport.summary;

		sections.push("=== EVALUNA ERP - STRATEGIC SALES & PROFITABILITY REPORT ===");
		sections.push(`Report Period,${escapeCsv(periodDisplay)}`);
		sections.push(`Generated On,${escapeCsv(new Date().toLocaleString())}`);
		sections.push(`Total Orders,${summary.totalOrders}`);
		sections.push(`Total Quantity Sold,${summary.totalQuantity}`);
		sections.push(`Total Revenue / Selling Price (INR),${summary.totalSelling}`);
		sections.push(`Total Cost Price / COGS (INR),${summary.totalCost}`);
		sections.push(`Total Gross Profit (INR),${summary.grossProfit}`);
		sections.push(`Overall Profit Margin (%),${summary.overallMarginPercent}%`);
		sections.push(`Total Discounts Given (INR),${summary.totalDiscounts}`);
		sections.push(`Average Order Value (INR),${summary.averageOrderValue}`);
		sections.push("");

		sections.push("=== DAY-WISE SALES & MARGIN BREAKDOWN ===");
		sections.push(
			"Date,Total Orders,Units Sold,Revenue / Selling Price (INR),Cost Price (INR),Gross Profit (INR),Margin (%),Discounts (INR)"
		);
		for (const d of salesStrategyReport.dayWise) {
			sections.push(
				[
					escapeCsv(d.date),
					escapeCsv(d.orderCount),
					escapeCsv(d.totalQuantity),
					escapeCsv(d.sellingTotal),
					escapeCsv(d.costTotal),
					escapeCsv(d.grossProfit),
					escapeCsv(`${d.marginPercent}%`),
					escapeCsv(d.discountTotal),
				].join(",")
			);
		}
		sections.push("");

		sections.push("=== TOP PROFITABLE PRODUCTS ===");
		sections.push(
			"Product Name,SKU,Category,Units Sold,Revenue (INR),Cost (INR),Gross Profit (INR),Margin (%)"
		);
		for (const p of salesStrategyReport.topProducts) {
			sections.push(
				[
					escapeCsv(p.name),
					escapeCsv(p.sku),
					escapeCsv(p.category),
					escapeCsv(p.qty),
					escapeCsv(p.revenue),
					escapeCsv(p.cost),
					escapeCsv(p.profit),
					escapeCsv(`${p.marginPercent}%`),
				].join(",")
			);
		}

		const csvContent = "\uFEFF" + sections.join("\n");
		downloadCsv(
			csvContent,
			`Daywise_Sales_Profit_Report_${periodDisplay.replace(/\s+/g, "_")}.csv`
		);
		toast.success("Strategic sales & margin report exported successfully.");
	};

	// Strategic Sales PDF Export
	const handleExportSalesPDF = () => {
		if (!salesStrategyReport || salesStrategyReport.dayWise.length === 0) {
			toast.info("No sales data available to export for selected period.");
			return;
		}

		const doc = new jsPDF();
		doc.setFont("helvetica", "bold");
		doc.setFontSize(16);
		doc.text("Evaluna ERP - Strategic Sales & Profit Report", 14, 18);
		
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.text(`Period: ${periodDisplay} | Generated: ${new Date().toLocaleDateString()}`, 14, 25);

		// Executive Summary Box
		doc.setFillColor(243, 244, 246);
		doc.rect(14, 30, 182, 28, "F");
		doc.setFont("helvetica", "bold");
		doc.setFontSize(9);
		const sum = salesStrategyReport.summary;
		doc.text(`Total Revenue: INR ${sum.totalSelling}`, 18, 38);
		doc.text(`Cost of Goods: INR ${sum.totalCost}`, 80, 38);
		doc.text(`Gross Profit: INR ${sum.grossProfit} (${sum.overallMarginPercent}% Margin)`, 140, 38);
		doc.text(`Total Orders: ${sum.totalOrders}`, 18, 48);
		doc.text(`Units Sold: ${sum.totalQuantity}`, 80, 48);
		doc.text(`Avg Order Value: INR ${sum.averageOrderValue}`, 140, 48);

		// Day-wise Table
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		doc.text("Day-Wise Sales & Margin Breakdown", 14, 68);

		let y = 76;
		doc.setFontSize(8);
		doc.setFont("helvetica", "bold");
		doc.text("Date", 14, y);
		doc.text("Orders", 45, y);
		doc.text("Units", 65, y);
		doc.text("Selling Price", 85, y);
		doc.text("Cost Price", 120, y);
		doc.text("Gross Profit", 155, y);
		doc.text("Margin", 185, y);
		y += 4;
		doc.line(14, y, 196, y);
		y += 5;

		doc.setFont("helvetica", "normal");
		for (const d of salesStrategyReport.dayWise) {
			if (y > 275) {
				doc.addPage();
				y = 20;
			}
			doc.text(d.date, 14, y);
			doc.text(String(d.orderCount), 45, y);
			doc.text(String(d.totalQuantity), 65, y);
			doc.text(`INR ${d.sellingTotal}`, 85, y);
			doc.text(`INR ${d.costTotal}`, 120, y);
			doc.text(`INR ${d.grossProfit}`, 155, y);
			doc.text(`${d.marginPercent}%`, 185, y);
			y += 6;
		}

		doc.save(`Sales_Strategy_Report_${periodDisplay.replace(/\s+/g, "_")}.pdf`);
		toast.success("Strategic sales PDF exported successfully.");
	};

	// Product Pieces Breakdown Computations
	const allProductsList = useMemo(() => {
		return salesStrategyReport?.allProducts || [];
	}, [salesStrategyReport?.allProducts]);

	const productCategories = useMemo(() => {
		const cats = new Set<string>();
		for (const p of allProductsList) {
			if (p.category) cats.add(p.category);
		}
		return Array.from(cats).sort();
	}, [allProductsList]);

	const filteredAllProducts = useMemo(() => {
		return allProductsList.filter((p) => {
			const matchesCategory =
				productCategoryFilter === "all" ||
				p.category?.toLowerCase() === productCategoryFilter.toLowerCase();
			const matchesSearch =
				!productSearchTerm ||
				p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
				p.sku?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
				p.category?.toLowerCase().includes(productSearchTerm.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}, [allProductsList, productCategoryFilter, productSearchTerm]);

	const filteredTotalPieces = useMemo(() => {
		return filteredAllProducts.reduce((s, p) => s + (p.totalQty || 0), 0);
	}, [filteredAllProducts]);

	const filteredTotalRevenue = useMemo(() => {
		return filteredAllProducts.reduce((s, p) => s + (p.totalRevenue || 0), 0);
	}, [filteredAllProducts]);

	const filteredTotalCost = useMemo(() => {
		return filteredAllProducts.reduce((s, p) => s + (p.totalCost || 0), 0);
	}, [filteredAllProducts]);

	const filteredTotalProfit = useMemo(() => {
		return filteredAllProducts.reduce((s, p) => s + (p.netProfit || 0), 0);
	}, [filteredAllProducts]);

	const toggleExpandDay = (dateStr: string) => {
		setExpandedDays((prev) => ({
			...prev,
			[dateStr]: prev[dateStr] === undefined ? false : !prev[dateStr],
		}));
	};

	const handleSelectPreset = (
		preset: "all" | "today" | "yesterday" | "7days" | "month",
	) => {
		if (preset === "all") {
			setStartDate("");
			setEndDate("");
			setDatePreset("all");
		} else if (preset === "today") {
			const today = getTodayStr();
			setStartDate(today);
			setEndDate(today);
			setDatePreset("today");
		} else if (preset === "yesterday") {
			const yesterday = getYesterdayStr();
			setStartDate(yesterday);
			setEndDate(yesterday);
			setDatePreset("yesterday");
		} else if (preset === "7days") {
			setStartDate(getDaysAgoStr(7));
			setEndDate(getTodayStr());
			setDatePreset("last7");
		} else if (preset === "month") {
			setStartDate(getMonthStartStr());
			setEndDate(getTodayStr());
			setDatePreset("thisMonth");
		}
	};

	const handleDownloadPiecesCsv = () => {
		if (!filteredAllProducts.length) {
			toast.info("No product data to export.");
			return;
		}

		const headers = [
			"Product Name",
			"SKU",
			"Category",
			"Unit",
			"Total Pieces Sold",
			"Orders Count",
			"Unique Customers",
			"Unit Selling Price (INR)",
			"Unit Cost Price (INR)",
			"Total Revenue (INR)",
			"Total Procurement Cost (INR)",
			"Net Profit (INR)",
			"Margin (%)",
		];

		const rows = filteredAllProducts.map((p) => [
			escapeCsv(p.name),
			escapeCsv(p.sku),
			escapeCsv(p.category || "General"),
			escapeCsv(p.unit || "Pcs"),
			escapeCsv(p.totalQty),
			escapeCsv(p.orderCount),
			escapeCsv(p.uniqueCustomerCount || 0),
			escapeCsv(p.unitSellingPrice),
			escapeCsv(p.unitCostPrice),
			escapeCsv(p.totalRevenue),
			escapeCsv(p.totalCost),
			escapeCsv(p.netProfit),
			escapeCsv(`${p.marginPercent}%`),
		]);

		const csvContent =
			"\uFEFF" +
			[
				`=== EVALUNA ERP - ALL PRODUCTS SOLD PIECES, COST & NET PROFIT REPORT ===`,
				`Period: ${periodDisplay}`,
				`Generated: ${new Date().toLocaleString()}`,
				`Total Pieces: ${filteredTotalPieces}`,
				`Total Revenue: INR ${filteredTotalRevenue}`,
				`Total Procurement Cost: INR ${filteredTotalCost}`,
				`Net Profit: INR ${filteredTotalProfit}`,
				"",
				headers.join(","),
				...rows.map((r) => r.join(",")),
			].join("\n");

		downloadCsv(
			csvContent,
			`All_Products_Pieces_Cost_Profit_${periodDisplay.replace(/\s+/g, "_")}.csv`,
		);
		toast.success(`Exported ${filteredAllProducts.length} products to CSV.`);
	};

	// 1. Download Multi-Tier Company CSV Report
	const handleExportCSV = () => {
		if (employeeDetails.length === 0) {
			toast.info("No employee performance data available to export.");
			return;
		}

		const sections: string[] = [];

		// Section 1: Executive Summary
		sections.push(
			"=== EVALUNA ERP - COMPANY-WIDE TEAM PERFORMANCE EXECUTIVE SUMMARY ===",
		);
		sections.push(`Report Period,${escapeCsv(periodDisplay)}`);
		sections.push(`Generated On,${escapeCsv(new Date().toLocaleString())}`);
		sections.push(`Total Teams,${companySummary.totalTeams}`);
		sections.push(`Total Employees,${companySummary.totalEmployees}`);
		sections.push(`Present Staff,${companySummary.presentEmployees}`);
		sections.push(`Absent Staff,${companySummary.absentEmployees}`);
		sections.push(`On Leave Staff,${companySummary.leaveEmployees}`);
		sections.push(`Total Working Hours,${companySummary.totalWorkingHours}`);
		sections.push(`Total Overtime Hours,${companySummary.totalOvertimeHours}`);
		sections.push(`Total Work Assigned,${companySummary.totalWorkAssigned}`);
		sections.push(`Total Work Completed,${companySummary.totalWorkCompleted}`);
		sections.push(
			`Overall SLA Completion Rate (%),${companySummary.overallCompletionRate}%`,
		);
		sections.push(
			`Overall Quality Rate (%),${companySummary.overallQualityRate}%`,
		);
		sections.push(
			`Total Revenue Generated (INR),${companySummary.totalRevenueGenerated}`,
		);
		sections.push(
			`Total Operational Exceptions,${companySummary.totalExceptions}`,
		);
		sections.push("");

		// Section 2: Team Performance Aggregations
		sections.push("=== TEAM PERFORMANCE SUMMARIES ===");
		sections.push(
			"Team Name,Employee Count,Present Staff,Absent Staff,On Leave,Working Hours,Overtime Hours,Work Assigned,Work Completed,Avg SLA Rate (%),Avg Quality Rate (%),Total Revenue (INR),Exceptions",
		);
		for (const t of teamSummaries) {
			sections.push(
				[
					escapeCsv(t.teamName),
					escapeCsv(t.employeeCount),
					escapeCsv(t.presentEmployees),
					escapeCsv(t.absentEmployees),
					escapeCsv(t.leaveEmployees),
					escapeCsv(t.totalWorkingHours),
					escapeCsv(t.totalOvertimeHours),
					escapeCsv(t.totalWorkAssigned),
					escapeCsv(t.totalWorkCompleted),
					escapeCsv(`${t.avgCompletionRate}%`),
					escapeCsv(`${t.avgQualityRate}%`),
					escapeCsv(t.totalRevenueGenerated),
					escapeCsv(t.totalExceptions),
				].join(","),
			);
		}
		sections.push("");

		// Section 3: Employee Detailed Performance Matrix
		sections.push("=== EMPLOYEE PERFORMANCE MATRIX ===");
		sections.push(
			"Staff Code,Employee Name,Role,Team,Present Days,Absent Days,Leave Days,Late Days,Working Hours,Overtime Hours,Work Assigned,Work Completed,Pending Work,SLA Rate (%),Productivity Rate,Quality Rate (%),Revenue Generated (INR),Exceptions",
		);
		for (const emp of employeeDetails) {
			sections.push(
				[
					escapeCsv(emp.staffCode),
					escapeCsv(emp.name),
					escapeCsv(emp.role),
					escapeCsv(emp.team),
					escapeCsv(emp.presentDays),
					escapeCsv(emp.absentDays),
					escapeCsv(emp.leaveDays),
					escapeCsv(emp.lateDays),
					escapeCsv(emp.totalWorkingHours),
					escapeCsv(emp.overtimeHours),
					escapeCsv(emp.workAssigned),
					escapeCsv(emp.workCompleted),
					escapeCsv(emp.pendingWork),
					escapeCsv(`${emp.completionRate}%`),
					escapeCsv(`${emp.productivityValue} ${emp.productivityUnit}`),
					escapeCsv(`${emp.qualityRate}%`),
					escapeCsv(emp.revenueGenerated),
					escapeCsv(emp.exceptionsCount),
				].join(","),
			);
		}

		const csvContent = "\uFEFF" + sections.join("\n");
		downloadCsv(
			csvContent,
			`Company_Team_Performance_Report_${periodDisplay.replace(/\s+/g, "_")}.csv`,
		);
		toast.success(
			`Exported performance report for ${employeeDetails.length} employees.`,
		);
	};

	// 2. Download Vector PDF Performance Report
	const handleExportPDF = async () => {
		if (employeeDetails.length === 0) {
			toast.info("No employee data available to generate PDF.");
			return;
		}

		setIsPdfGenerating(true);
		try {
			const autoTableModule = await import("jspdf-autotable");
			const autoTable = autoTableModule.default;

			const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
			const pageWidth = doc.internal.pageSize.getWidth();

			// Header Header Branding
			doc.setFillColor(15, 23, 42); // slate-900
			doc.rect(0, 0, pageWidth, 26, "F");

			doc.setTextColor(255, 255, 255);
			doc.setFontSize(15);
			doc.setFont("helvetica", "bold");
			doc.text("EVALUNA ERP — COMPANY TEAM PERFORMANCE REPORT", 14, 12);

			doc.setFontSize(9);
			doc.setFont("helvetica", "normal");
			doc.text(
				`Period: ${periodDisplay}  |  Generated: ${new Date().toLocaleString()}`,
				14,
				20,
			);

			let y = 34;

			// Section 1: Executive Summary
			doc.setTextColor(30, 41, 59);
			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.text("1. EXECUTIVE COMPANY PERFORMANCE SUMMARY", 14, y);
			y += 5;

			const summaryMetrics = [
				["Total Teams", String(companySummary.totalTeams)],
				["Total Employees", String(companySummary.totalEmployees)],
				["Present Staff", String(companySummary.presentEmployees)],
				[
					"Absent / Leave",
					`${companySummary.absentEmployees} / ${companySummary.leaveEmployees}`,
				],
				["Total Working Hours", `${companySummary.totalWorkingHours} hrs`],
				["Overtime Hours", `${companySummary.totalOvertimeHours} hrs`],
				[
					"Work Assigned / Completed",
					`${companySummary.totalWorkAssigned} / ${companySummary.totalWorkCompleted}`,
				],
				[
					"Overall SLA Completion Rate",
					`${companySummary.overallCompletionRate}%`,
				],
				["Overall Quality Rate", `${companySummary.overallQualityRate}%`],
				[
					"Total Revenue Generated",
					`Rs. ${companySummary.totalRevenueGenerated.toLocaleString("en-IN")}`,
				],
			];

			autoTable(doc, {
				startY: y,
				head: [["Metric Category", "Value", "Metric Category", "Value"]],
				body: [
					[
						summaryMetrics[0][0],
						summaryMetrics[0][1],
						summaryMetrics[5][0],
						summaryMetrics[5][1],
					],
					[
						summaryMetrics[1][0],
						summaryMetrics[1][1],
						summaryMetrics[6][0],
						summaryMetrics[6][1],
					],
					[
						summaryMetrics[2][0],
						summaryMetrics[2][1],
						summaryMetrics[7][0],
						summaryMetrics[7][1],
					],
					[
						summaryMetrics[3][0],
						summaryMetrics[3][1],
						summaryMetrics[8][0],
						summaryMetrics[8][1],
					],
					[
						summaryMetrics[4][0],
						summaryMetrics[4][1],
						summaryMetrics[9][0],
						summaryMetrics[9][1],
					],
				],
				theme: "grid",
				headStyles: {
					fillStyle: "F",
					fillColor: [30, 41, 59],
					textColor: [255, 255, 255],
					fontStyle: "bold",
					fontSize: 8,
				},
				bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
				alternateRowStyles: { fillColor: [248, 250, 252] },
				margin: { left: 14, right: 14 },
			});

			const docWithAutoTable = doc as jsPDF & {
				lastAutoTable?: { finalY: number };
			};
			y = (docWithAutoTable.lastAutoTable?.finalY ?? y) + 10;

			// Section 2: Team Performance Summaries
			if (teamSummaries.length > 0) {
				doc.setFontSize(11);
				doc.setFont("helvetica", "bold");
				doc.text("2. TEAM PERFORMANCE BREAKDOWN", 14, y);
				y += 5;

				const teamRows = teamSummaries.map((t) => [
					t.teamName,
					String(t.employeeCount),
					`${t.presentEmployees} P / ${t.absentEmployees} A`,
					`${t.totalWorkingHours} hrs`,
					`${t.totalWorkCompleted} / ${t.totalWorkAssigned}`,
					`${t.avgCompletionRate}%`,
					`${t.avgQualityRate}%`,
					t.totalRevenueGenerated > 0
						? `Rs. ${t.totalRevenueGenerated.toLocaleString("en-IN")}`
						: "—",
				]);

				autoTable(doc, {
					startY: y,
					head: [
						[
							"Team",
							"Staff",
							"Present/Absent",
							"Hours",
							"Work (Done/Total)",
							"SLA %",
							"Quality %",
							"Revenue",
						],
					],
					body: teamRows,
					theme: "striped",
					headStyles: {
						fillColor: [37, 99, 235],
						textColor: [255, 255, 255],
						fontSize: 8,
						fontStyle: "bold",
					},
					bodyStyles: { fontSize: 8 },
					margin: { left: 14, right: 14 },
				});

				y = (docWithAutoTable.lastAutoTable?.finalY ?? y) + 10;
			}

			// Section 3: Detailed Employee Matrix
			if (y > 220) {
				doc.addPage();
				y = 20;
			}

			doc.setFontSize(11);
			doc.setFont("helvetica", "bold");
			doc.text("3. INDIVIDUAL EMPLOYEE PERFORMANCE MATRIX", 14, y);
			y += 5;

			const empRows = employeeDetails.map((e) => [
				e.staffCode,
				e.name,
				e.role,
				e.team,
				`${e.presentDays}d`,
				`${e.workCompleted}/${e.workAssigned}`,
				`${e.completionRate}%`,
				`${e.productivityValue} ${e.productivityUnit.split("/")[0]}`,
				`${e.qualityRate}%`,
			]);

			autoTable(doc, {
				startY: y,
				head: [
					[
						"Code",
						"Name",
						"Role",
						"Team",
						"Attendance",
						"Tasks",
						"SLA Rate",
						"Speed",
						"Quality",
					],
				],
				body: empRows,
				theme: "grid",
				headStyles: {
					fillColor: [15, 23, 42],
					textColor: [255, 255, 255],
					fontSize: 8,
					fontStyle: "bold",
				},
				bodyStyles: { fontSize: 7.5 },
				alternateRowStyles: { fillColor: [248, 250, 252] },
				margin: { left: 14, right: 14 },
			});

			doc.save(
				`Company_Team_Performance_${periodDisplay.replace(/\s+/g, "_")}.pdf`,
			);
			toast.success("Generated & downloaded PDF Team Performance Report!");
		} catch (err) {
			console.error("PDF generation failed:", err);
			toast.error("Failed to generate PDF report.");
		} finally {
			setIsPdfGenerating(false);
		}
	};

	// Save Report to Archive
	const handleSaveReportToArchive = () => {
		const newArchive: SavedReportArchive = {
			id: `REP-${Date.now()}`,
			title: `Team Performance Report (${periodDisplay})`,
			period: periodDisplay,
			dateGenerated: new Date().toLocaleDateString(),
			totalEmployees: companySummary.totalEmployees,
			overallCompletionRate: companySummary.overallCompletionRate,
			overallQualityRate: companySummary.overallQualityRate,
		};
		setSavedArchives([newArchive, ...savedArchives]);
		toast.success("Report archived successfully!");
	};

	return (
		<PageTransition className="space-y-6">
			{/* Top Header & Export Actions */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<FileBarChartIcon className="h-6 w-6 text-blue-600" />
						{t("managerReportsHeading")}
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						{t("managerReportsSub")}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{activeTab === "sales_strategy" ? (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportSalesCSV}
								disabled={isSalesLoading || !salesStrategyReport?.dayWise?.length}
								className="gap-1.5 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
							>
								<FileSpreadsheetIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
								Export Sales CSV / एक्सेल
							</Button>
							<Button
								size="sm"
								onClick={handleExportSalesPDF}
								disabled={isSalesLoading || !salesStrategyReport?.dayWise?.length}
								className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
							>
								<FileTextIcon className="h-4 w-4" />
								Export Sales PDF / रिपोर्ट
							</Button>
						</>
					) : (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSaveReportToArchive}
								disabled={isLoading || employeeDetails.length === 0}
								className="gap-1.5"
							>
								<ArchiveIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
								Save Report Archive
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={handleExportCSV}
								disabled={isLoading || employeeDetails.length === 0}
								className="gap-1.5"
							>
								<FileSpreadsheetIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
								{t("exportTeamPerformanceCSV")}
							</Button>

							<Button
								size="sm"
								onClick={handleExportPDF}
								disabled={
									isLoading || isPdfGenerating || employeeDetails.length === 0
								}
								className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
							>
								{isPdfGenerating ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									<FileTextIcon className="h-4 w-4" />
								)}
								Export Vector PDF
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Date Range Filter Bar */}
			<Card className="shadow-sm">
				<CardContent className="p-4 sm:p-6">
					<DateFilterBar
						startDate={startDate}
						endDate={endDate}
						datePreset={datePreset}
						totalCount={companySummary.totalEmployees}
						countLabel="employees"
						onDateChange={(start, end, preset) => {
							setStartDate(start);
							setEndDate(end);
							setDatePreset(preset);
						}}
					/>

					<div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-slate-100 border-t pt-4 dark:border-slate-800">
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2">
								<FilterIcon className="h-4 w-4 text-slate-400" />
								<span className="font-medium text-slate-600 text-xs dark:text-slate-300">
									Filter Team:
								</span>
								<select
									value={selectedTeam}
									onChange={(e) => setSelectedTeam(e.target.value)}
									className="rounded-md border border-slate-200 bg-white px-3 py-1 text-slate-800 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
								>
									<option value="all">All Teams / Departments</option>
									<option value="Operations">Operations</option>
									<option value="Logistics & Delivery">
										Logistics & Delivery
									</option>
									<option value="Warehouse Picking">Warehouse Picking</option>
									<option value="Warehouse Packing">Warehouse Packing</option>
									<option value="Sales & Growth">Sales & Growth</option>
								</select>
							</div>

							<div className="relative flex items-center">
								<SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
								<input
									type="text"
									placeholder="Search staff name, code, role..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-48 rounded-md border border-slate-200 bg-white py-1 pr-3 pl-8 text-slate-800 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
								/>
							</div>
						</div>

						{/* Navigation Tabs */}
						<div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
							<button
								type="button"
								onClick={() => setActiveTab("sales_strategy")}
								className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
									activeTab === "sales_strategy"
										? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-400"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400"
								}`}
							>
								📊 Sales & Profit Strategy / बिक्री व लाभ रणनीति
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("live")}
								className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
									activeTab === "live"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400"
								}`}
							>
								Live Team Performance
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("archive")}
								className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
									activeTab === "archive"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400"
								}`}
							>
								Historical Archives ({savedArchives.length})
							</button>
						</div>
					</div>
				</CardContent>
			</Card>

			{activeTab === "sales_strategy" ? (
				/* Sales & Profit Strategy Tab - Daywise Sales & Product Margin Report */
				<div className="space-y-6">
					{/* KPI Summary Cards */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
						<Card className="border-border/60 bg-card shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
										Total Revenue / विक्रय
									</p>
									<span className="rounded-lg bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
										<IndianRupeeIcon className="h-4 w-4" />
									</span>
								</div>
								<h3 className="mt-2 font-bold text-xl tracking-tight text-foreground">
									{formatCurrency(salesStrategyReport?.summary?.totalSelling || 0, "hi")}
								</h3>
								<p className="mt-1 text-muted-foreground text-[11px]">
									Across {salesStrategyReport?.summary?.totalOrders || 0} orders
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60 bg-card shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
										Cost Price / लागत (COGS)
									</p>
									<span className="rounded-lg bg-slate-500/10 p-1.5 text-slate-600 dark:text-slate-400">
										<PackageIcon className="h-4 w-4" />
									</span>
								</div>
								<h3 className="mt-2 font-bold text-xl tracking-tight text-slate-700 dark:text-slate-300">
									{formatCurrency(salesStrategyReport?.summary?.totalCost || 0, "hi")}
								</h3>
								<p className="mt-1 text-muted-foreground text-[11px]">
									Base procurement cost
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60 bg-card shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
										Net Profit / शुद्ध लाभ
									</p>
									<span className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
										<TrendingUpIcon className="h-4 w-4" />
									</span>
								</div>
								<h3 className="mt-2 font-bold text-xl tracking-tight text-emerald-600 dark:text-emerald-400">
									+{formatCurrency(salesStrategyReport?.summary?.grossProfit || 0, "hi")}
								</h3>
								<p className="mt-1 text-muted-foreground text-[11px]">
									Revenue minus cost price
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60 bg-card shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
										Margin / मार्जिन (%)
									</p>
									<span className="rounded-lg bg-purple-500/10 p-1.5 text-purple-600 dark:text-purple-400">
										<PercentIcon className="h-4 w-4" />
									</span>
								</div>
								<h3 className="mt-2 font-bold text-xl tracking-tight text-purple-600 dark:text-purple-400">
									{salesStrategyReport?.summary?.overallMarginPercent || 0}%
								</h3>
								<p className="mt-1 text-muted-foreground text-[11px]">
									Avg order: {formatCurrency(salesStrategyReport?.summary?.averageOrderValue || 0, "hi")}
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60 bg-card shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
										Pieces Sold / कुल पीस
									</p>
									<span className="rounded-lg bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
										<LayersIcon className="h-4 w-4" />
									</span>
								</div>
								<h3 className="mt-2 font-bold text-xl tracking-tight text-amber-700 dark:text-amber-400">
									{(salesStrategyReport?.summary?.totalQuantity || 0).toLocaleString("en-IN")}
								</h3>
								<p className="mt-1 text-muted-foreground text-[11px]">
									Total units dispatched
								</p>
							</CardContent>
						</Card>

						<Card className="border-border/60 bg-card shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<p className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
										Products / कुल उत्पाद
									</p>
									<span className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
										<PackageIcon className="h-4 w-4" />
									</span>
								</div>
								<h3 className="mt-2 font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400">
									{allProductsList.length}
								</h3>
								<p className="mt-1 text-muted-foreground text-[11px]">
									Distinct items sold
								</p>
							</CardContent>
						</Card>
					</div>

					{/* All Products Sold (Piece by Piece, Cost Price & Day-by-Day View) */}
					<Card className="border-slate-200 shadow-sm dark:border-slate-800">
						<CardHeader className="border-b bg-slate-50/50 pb-4 dark:bg-slate-900/50">
							<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<PackageIcon className="h-5 w-5 text-amber-600" />
										<CardTitle className="font-bold text-foreground text-lg">
											All Products Sold — Pieces, Cost & Net Profit Breakdown
										</CardTitle>
										<Badge
											variant="secondary"
											className="border-amber-300 bg-amber-100 font-bold text-amber-900 text-xs dark:bg-amber-950/60 dark:text-amber-200"
										>
											{(salesStrategyReport?.summary?.totalQuantity || 0).toLocaleString("en-IN")} Total Pieces (कुल पीस)
										</Badge>
										<Badge variant="outline" className="text-xs">
											{filteredAllProducts.length} Products
										</Badge>
										<Badge
											variant="outline"
											className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs dark:bg-emerald-950/40 dark:text-emerald-300"
										>
											+{formatCurrency(salesStrategyReport?.summary?.grossProfit || 0, "hi")} Net Profit
										</Badge>
									</div>
									<CardDescription className="mt-1 text-xs">
										{periodDisplay} में गए सभी उत्पादों के पीस, ऑर्डर काउंट, लागत मूल्य, बिक्री व शुद्ध लाभ (Net Profit) का पूरा विवरण।
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
											<span>All Products (सभी उत्पाद)</span>
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
											<span>Day by Day (दिन-वार पीस)</span>
											<span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] dark:bg-slate-600">
												{salesStrategyReport?.dayWise?.length || 0}
											</span>
										</button>
									</div>

									<Button
										variant="outline"
										size="sm"
										onClick={handleDownloadPiecesCsv}
										disabled={isSalesLoading || !filteredAllProducts.length}
										className="h-8 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 text-xs dark:border-amber-800 dark:text-amber-300"
									>
										<FileSpreadsheetIcon className="h-3.5 w-3.5" />
										<span>Export Pieces CSV</span>
									</Button>
								</div>
							</div>

							{/* Toolbar: Quick Preset Buttons + Search + Category Filter */}
							<div className="mt-4 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
								{/* Quick Date Presets Row */}
								<div className="flex flex-wrap items-center gap-1.5">
									<span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
										<CalendarDaysIcon className="h-3 w-3" /> Quick Period:
									</span>
									<button
										type="button"
										onClick={() => handleSelectPreset("all")}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
											datePreset === "all"
												? "bg-blue-600 text-white font-bold shadow-xs"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										All Days (सभी दिन)
									</button>
									<button
										type="button"
										onClick={() => handleSelectPreset("today")}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
											datePreset === "today"
												? "bg-blue-600 text-white font-bold shadow-xs"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										Today (आज)
									</button>
									<button
										type="button"
										onClick={() => handleSelectPreset("yesterday")}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
											datePreset === "yesterday"
												? "bg-blue-600 text-white font-bold shadow-xs"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										Yesterday (कल)
									</button>
									<button
										type="button"
										onClick={() => handleSelectPreset("7days")}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
											datePreset === "last7"
												? "bg-blue-600 text-white font-bold shadow-xs"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										Last 7 Days (7 दिन)
									</button>
									<button
										type="button"
										onClick={() => handleSelectPreset("month")}
										className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
											datePreset === "thisMonth"
												? "bg-blue-600 text-white font-bold shadow-xs"
												: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										This Month (इस माह)
									</button>
								</div>

								{/* Search & Category Pills */}
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div className="relative flex-1 sm:max-w-xs">
										<SearchIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											type="text"
											placeholder="Search product name, SKU or category..."
											value={productSearchTerm}
											onChange={(e) => setProductSearchTerm(e.target.value)}
											className="h-9 pl-9 text-xs"
										/>
									</div>

									{/* Category Pills */}
									<div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
										<span className="text-[11px] font-medium text-muted-foreground mr-1">
											Category:
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
							</div>
						</CardHeader>

						<CardContent className="p-0">
							{isSalesLoading ? (
								<div className="py-16 text-center text-muted-foreground">
									<Loader2Icon className="mx-auto mb-2 h-6 w-6 animate-spin text-blue-600" />
									Loading product pieces, cost price and profit breakdown...
								</div>
							) : productViewTab === "allProducts" ? (
								/* View 1: Consolidated All Products Table with Cost Price & Net Profit */
								<div className="w-full overflow-x-auto">
									<Table className="min-w-[850px] text-xs">
										<TableHeader>
											<TableRow className="bg-slate-100/70 font-semibold dark:bg-slate-900/60">
												<TableHead className="w-10 text-center">#</TableHead>
												<TableHead className="font-bold">
													Product Name (उत्पाद नाम)
												</TableHead>
												<TableHead className="font-bold">
													Category
												</TableHead>
												<TableHead className="text-center font-bold text-amber-700 dark:text-amber-400">
													Pieces Sold (पीस)
												</TableHead>
												<TableHead className="text-center font-bold">
													Orders
												</TableHead>
												<TableHead className="text-center font-bold">
													Customers
												</TableHead>
												<TableHead className="text-right font-bold">
													Selling Rate (दर)
												</TableHead>
												<TableHead className="text-right font-bold text-slate-600 dark:text-slate-400">
													Cost Price (लागत)
												</TableHead>
												<TableHead className="text-right font-bold">
													Revenue (विक्रय)
												</TableHead>
												<TableHead className="text-right font-bold text-slate-600 dark:text-slate-400">
													Total Cost (कुल लागत)
												</TableHead>
												<TableHead className="text-right font-bold text-emerald-600">
													Net Profit (लाभ)
												</TableHead>
												<TableHead className="text-center font-bold">
													Margin %
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
											{filteredAllProducts.length === 0 ? (
												<TableRow>
													<TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
														No products found matching your search or filters for {periodDisplay}.
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
															<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
																{p.sku && <span>SKU: {p.sku}</span>}
																{p.unit && <span>• Unit: {p.unit}</span>}
															</div>
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
														<TableCell className="text-right font-medium">
															{formatCurrency(p.unitSellingPrice || 0, "hi")}
														</TableCell>
														<TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">
															{formatCurrency(p.unitCostPrice || 0, "hi")}
														</TableCell>
														<TableCell className="text-right font-bold text-foreground">
															{formatCurrency(p.totalRevenue, "hi")}
														</TableCell>
														<TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">
															{formatCurrency(p.totalCost, "hi")}
														</TableCell>
														<TableCell className={`text-right font-bold ${
															p.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
														}`}>
															{p.netProfit >= 0 ? "+" : ""}{formatCurrency(p.netProfit, "hi")}
														</TableCell>
														<TableCell className="text-center">
															<span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
																p.marginPercent >= 20
																	? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
																	: p.marginPercent >= 10
																		? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
																		: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
															}`}>
																{p.marginPercent}%
															</span>
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
														Grand Total ({filteredAllProducts.length} Items)
													</TableCell>
													<TableCell className="text-center font-black text-amber-700 text-sm dark:text-amber-400">
														{filteredTotalPieces.toLocaleString("en-IN")} Pcs
													</TableCell>
													<TableCell className="text-center font-bold">
														{salesStrategyReport?.summary?.totalOrders || 0}
													</TableCell>
													<TableCell className="text-center font-bold text-muted-foreground">
														—
													</TableCell>
													<TableCell className="text-right text-muted-foreground">
														—
													</TableCell>
													<TableCell className="text-right text-muted-foreground">
														—
													</TableCell>
													<TableCell className="text-right font-black text-foreground text-sm">
														{formatCurrency(filteredTotalRevenue, "hi")}
													</TableCell>
													<TableCell className="text-right font-black text-slate-700 text-sm dark:text-slate-300">
														{formatCurrency(filteredTotalCost, "hi")}
													</TableCell>
													<TableCell className="text-right font-black text-emerald-600 text-sm dark:text-emerald-400">
														+{formatCurrency(filteredTotalProfit, "hi")}
													</TableCell>
													<TableCell className="text-center font-black text-purple-700 dark:text-purple-400">
														{filteredTotalRevenue > 0
															? Math.round((filteredTotalProfit / filteredTotalRevenue) * 100)
															: 0}%
													</TableCell>
												</TableRow>
											</tfoot>
										)}
									</Table>
								</div>
							) : (
								/* View 2: Day-by-Day Pieces, Cost & Margin Breakdown */
								<div className="space-y-4 p-4">
									{(salesStrategyReport?.dayWise || []).length === 0 ? (
										<div className="py-10 text-center text-muted-foreground">
											No daily sales records found for {periodDisplay}.
										</div>
									) : (
										(salesStrategyReport?.dayWise || []).map((day) => {
											const isExpanded = expandedDays[day.date] ?? true;
											const dayProducts = day.dayProducts || [];

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
																		"hi-IN",
																		{
																			weekday: "short",
																			year: "numeric",
																			month: "short",
																			day: "numeric",
																		},
																	)}
																</div>
																<p className="text-[11px] text-muted-foreground font-mono">
																	{day.date} • {day.orderCount} Orders
																</p>
															</div>
														</div>

														<div className="flex flex-wrap items-center gap-3 text-xs">
															<Badge
																variant="outline"
																className="border-amber-300 bg-amber-50 font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
															>
																📦 {day.totalQuantity} Pieces Sold
															</Badge>
															<span className="font-semibold text-slate-700 dark:text-slate-300">
																Rev: {formatCurrency(day.sellingTotal, "hi")}
															</span>
															<span className="text-slate-500 text-[11px]">
																Cost: {formatCurrency(day.costTotal, "hi")}
															</span>
															<span className="font-bold text-emerald-600 sm:text-sm">
																+{formatCurrency(day.grossProfit, "hi")} ({day.marginPercent}%)
															</span>
															<Button
																variant="outline"
																size="sm"
																onClick={(e) => {
																	e.stopPropagation();
																	setSelectedDayOrders(day);
																}}
																className="h-7 gap-1 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
															>
																<EyeIcon className="h-3 w-3" />
																Inspect Bills ({day.orders.length})
															</Button>
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
																	No item line details found for this date.
																</div>
															) : (
																<Table className="text-xs">
																	<TableHeader>
																		<TableRow className="bg-slate-100/50 dark:bg-slate-900/40">
																			<TableHead className="w-10">#</TableHead>
																			<TableHead className="font-bold">
																				Product
																			</TableHead>
																			<TableHead className="font-bold">
																				Category
																			</TableHead>
																			<TableHead className="text-center font-bold text-amber-700 dark:text-amber-400">
																				Pieces (Qty)
																			</TableHead>
																			<TableHead className="text-right font-bold">
																				Unit Price
																			</TableHead>
																			<TableHead className="text-right font-bold text-slate-500">
																				Unit Cost
																			</TableHead>
																			<TableHead className="text-right font-bold">
																				Revenue
																			</TableHead>
																			<TableHead className="text-right font-bold text-slate-500">
																				Cost
																			</TableHead>
																			<TableHead className="text-right font-bold text-emerald-600">
																				Net Profit
																			</TableHead>
																			<TableHead className="text-center font-bold">
																				Margin %
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
																					{dp.qty} {dp.unit || "Pcs"}
																				</TableCell>
																				<TableCell className="text-right">
																					{formatCurrency(dp.unitSellingPrice || (dp.qty > 0 ? dp.revenue / dp.qty : 0), "hi")}
																				</TableCell>
																				<TableCell className="text-right text-slate-500">
																					{formatCurrency(dp.unitCostPrice || (dp.qty > 0 ? dp.cost / dp.qty : 0), "hi")}
																				</TableCell>
																				<TableCell className="text-right font-medium">
																					{formatCurrency(dp.revenue, "hi")}
																				</TableCell>
																				<TableCell className="text-right text-slate-500">
																					{formatCurrency(dp.cost, "hi")}
																				</TableCell>
																				<TableCell className="text-right font-bold text-emerald-600">
																					+{formatCurrency(dp.profit, "hi")}
																				</TableCell>
																				<TableCell className="text-center">
																					<span className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
																						dp.marginPercent >= 20
																							? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
																							: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
																					}`}>
																						{dp.marginPercent}%
																					</span>
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

					{/* Top Profitable Products Strategic Matrix */}
					{salesStrategyReport?.topProducts && salesStrategyReport.topProducts.length > 0 && (
						<Card className="shadow-sm border-border/60">
							<CardHeader>
								<CardTitle className="font-bold text-base flex items-center gap-2">
									<TrendingUpIcon className="h-5 w-5 text-emerald-600" />
									Top Profitable Products (रणनीतिक रूप से सबसे अधिक लाभदायक उत्पाद)
								</CardTitle>
								<CardDescription>
									Products ranked by total net profit generated in {periodDisplay}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto rounded-lg border border-border/60">
									<Table>
										<TableHeader className="bg-muted/50">
											<TableRow>
												<TableHead>Product Name</TableHead>
												<TableHead>SKU</TableHead>
												<TableHead>Category</TableHead>
												<TableHead className="text-center">Units Sold</TableHead>
												<TableHead className="text-right">Revenue (विक्रय)</TableHead>
												<TableHead className="text-right">Cost (लागत)</TableHead>
												<TableHead className="text-right">Gross Profit (लाभ)</TableHead>
												<TableHead className="text-center">Margin %</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{salesStrategyReport.topProducts.map((p) => (
												<TableRow key={p.id} className="hover:bg-muted/10">
													<TableCell className="font-medium text-foreground">
														{p.name}
													</TableCell>
													<TableCell className="font-mono text-xs text-muted-foreground">
														{p.sku}
													</TableCell>
													<TableCell>
														<Badge variant="outline" className="text-xs">
															{p.category}
														</Badge>
													</TableCell>
													<TableCell className="text-center font-semibold">
														{p.qty}
													</TableCell>
													<TableCell className="text-right font-medium">
														{formatCurrency(p.revenue, "hi")}
													</TableCell>
													<TableCell className="text-right text-slate-600 dark:text-slate-400">
														{formatCurrency(p.cost, "hi")}
													</TableCell>
													<TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
														+{formatCurrency(p.profit, "hi")}
													</TableCell>
													<TableCell className="text-center">
														<Badge
															variant="outline"
															className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
														>
															{p.marginPercent}%
														</Badge>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Modal to inspect orders & products of a specific day */}
					{selectedDayOrders && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
							<div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[85vh] flex flex-col">
								<div className="flex items-center justify-between border-b pb-3">
									<div>
										<h3 className="font-bold text-lg text-foreground flex items-center gap-2">
											<CalendarDaysIcon className="h-5 w-5 text-primary" />
											Day Details for {selectedDayOrders.date}
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											{selectedDayOrders.orders.length} orders • {selectedDayOrders.totalQuantity} pieces • Selling: {formatCurrency(selectedDayOrders.sellingTotal, "hi")} • Cost: {formatCurrency(selectedDayOrders.costTotal, "hi")} • Profit: {formatCurrency(selectedDayOrders.grossProfit, "hi")} ({selectedDayOrders.marginPercent}%)
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setSelectedDayOrders(null)}
										className="h-8 w-8 p-0"
									>
										✕
									</Button>
								</div>

								{/* Modal Tab Switcher: Products vs Bills */}
								<div className="flex items-center gap-2 pt-3">
									<button
										type="button"
										onClick={() => setSelectedDayModalTab("products")}
										className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
											selectedDayModalTab === "products"
												? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										📦 Products Sold ({(selectedDayOrders.dayProducts || []).length})
									</button>
									<button
										type="button"
										onClick={() => setSelectedDayModalTab("bills")}
										className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
											selectedDayModalTab === "bills"
												? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
												: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										🧾 Invoices / Bills ({(selectedDayOrders.orders || []).length})
									</button>
								</div>

								<div className="flex-1 overflow-y-auto py-3 space-y-2">
									{selectedDayModalTab === "products" ? (
										<table className="w-full text-xs text-left">
											<thead className="bg-muted/50">
												<tr>
													<th className="p-2">#</th>
													<th className="p-2">Product Name</th>
													<th className="p-2 text-center">Qty / Pcs</th>
													<th className="p-2 text-right">Selling Price</th>
													<th className="p-2 text-right">Cost Price</th>
													<th className="p-2 text-right">Net Profit</th>
													<th className="p-2 text-center">Margin</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-border/40">
												{(selectedDayOrders.dayProducts || []).map((dp: any, idx: number) => (
													<tr key={idx} className="hover:bg-muted/10">
														<td className="p-2 text-muted-foreground font-mono">{idx + 1}</td>
														<td className="p-2 font-medium">
															<div>{dp.name}</div>
															<span className="text-[10px] text-muted-foreground">{dp.category || "General"}</span>
														</td>
														<td className="p-2 text-center font-bold text-amber-700 dark:text-amber-400">
															{dp.qty} {dp.unit || "Pcs"}
														</td>
														<td className="p-2 text-right font-semibold">
															{formatCurrency(dp.revenue, "hi")}
														</td>
														<td className="p-2 text-right text-muted-foreground">
															{formatCurrency(dp.cost, "hi")}
														</td>
														<td className="p-2 text-right font-bold text-emerald-600">
															+{formatCurrency(dp.profit, "hi")}
														</td>
														<td className="p-2 text-center">
															<Badge variant="outline" className="text-[10px]">
																{dp.marginPercent}%
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									) : (
										<table className="w-full text-xs text-left">
											<thead className="bg-muted/50">
												<tr>
													<th className="p-2">Bill #</th>
													<th className="p-2">Customer</th>
													<th className="p-2 text-right">Selling Price</th>
													<th className="p-2 text-right">Cost Price</th>
													<th className="p-2 text-right">Profit</th>
													<th className="p-2 text-center">Margin</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-border/40">
												{selectedDayOrders.orders.map((o: any) => (
													<tr key={o.id} className="hover:bg-muted/10">
														<td className="p-2 font-mono font-semibold text-primary">
															{o.billNumber}
														</td>
														<td className="p-2 font-medium">
															{o.customerName}
														</td>
														<td className="p-2 text-right font-semibold">
															{formatCurrency(o.sellingTotal, "hi")}
														</td>
														<td className="p-2 text-right text-muted-foreground">
															{formatCurrency(o.costTotal, "hi")}
														</td>
														<td className="p-2 text-right font-bold text-emerald-600">
															+{formatCurrency(o.grossProfit, "hi")}
														</td>
														<td className="p-2 text-center">
															<Badge variant="outline" className="text-[10px]">
																{o.marginPercent}%
															</Badge>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									)}
								</div>

								<div className="pt-3 border-t text-right">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setSelectedDayOrders(null)}
									>
										Close / बंद करें
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>
			) : activeTab === "archive" ? (
				/* Historical Reports Archive Tab */
				<Card className="shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 font-bold text-base">
							<ArchiveIcon className="h-5 w-5 text-purple-600" />
							Saved Historical Performance Reports
						</CardTitle>
						<CardDescription>
							Access and review previously saved operational performance
							snapshots.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{savedArchives.length === 0 ? (
							<div className="py-12 text-center">
								<ArchiveIcon className="mx-auto mb-3 h-12 w-12 text-slate-300" />
								<p className="font-medium text-slate-500 text-sm">
									No historical reports archived yet.
								</p>
								<p className="mt-1 text-slate-400 text-xs">
									Click "Save Report Archive" above to take a snapshot of the
									active performance dataset.
								</p>
							</div>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Report ID</TableHead>
										<TableHead>Report Title</TableHead>
										<TableHead>Period Covered</TableHead>
										<TableHead>Date Saved</TableHead>
										<TableHead className="text-center">Staff Count</TableHead>
										<TableHead className="text-right">SLA Completion</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{savedArchives.map((arch) => (
										<TableRow key={arch.id}>
											<TableCell className="font-mono font-semibold text-xs">
												{arch.id}
											</TableCell>
											<TableCell className="font-bold text-slate-900 dark:text-slate-100">
												{arch.title}
											</TableCell>
											<TableCell>
												<Badge variant="outline">{arch.period}</Badge>
											</TableCell>
											<TableCell className="text-slate-500 text-xs">
												{arch.dateGenerated}
											</TableCell>
											<TableCell className="text-center font-semibold">
												{arch.totalEmployees}
											</TableCell>
											<TableCell className="text-right font-bold text-emerald-600">
												{arch.overallCompletionRate}%
											</TableCell>
											<TableCell className="text-right">
												<Button
													size="sm"
													variant="ghost"
													onClick={handleExportPDF}
													className="h-8 gap-1 text-xs"
												>
													<DownloadIcon className="h-3.5 w-3.5" /> PDF
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			) : (
				/* Live Performance Dashboard */
				<>
					{/* Executive Summary Cards */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card className="shadow-sm">
							<CardContent className="flex items-center justify-between p-4">
								<div>
									<p className="font-medium text-slate-500 text-xs dark:text-slate-400">
										Total Workforce
									</p>
									<p className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
										{companySummary.totalEmployees}
									</p>
									<p className="mt-1 font-medium text-emerald-600 text-xs">
										{companySummary.presentEmployees} Present Today
									</p>
								</div>
								<div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40">
									<UsersIcon className="h-6 w-6" />
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-sm">
							<CardContent className="flex items-center justify-between p-4">
								<div>
									<p className="font-medium text-slate-500 text-xs dark:text-slate-400">
										Work SLA Completion
									</p>
									<p className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
										{companySummary.overallCompletionRate}%
									</p>
									<p className="mt-1 text-slate-500 text-xs">
										{companySummary.totalWorkCompleted} /{" "}
										{companySummary.totalWorkAssigned} Completed
									</p>
								</div>
								<div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/40">
									<CheckCircle2Icon className="h-6 w-6" />
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-sm">
							<CardContent className="flex items-center justify-between p-4">
								<div>
									<p className="font-medium text-slate-500 text-xs dark:text-slate-400">
										Quality Rate
									</p>
									<p className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
										{companySummary.overallQualityRate}%
									</p>
									<p className="mt-1 font-medium text-amber-600 text-xs">
										{companySummary.totalExceptions} Exceptions Logged
									</p>
								</div>
								<div className="rounded-xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/40">
									<ShieldCheckIcon className="h-6 w-6" />
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-sm">
							<CardContent className="flex items-center justify-between p-4">
								<div>
									<p className="font-medium text-slate-500 text-xs dark:text-slate-400">
										Total Working Hours
									</p>
									<p className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
										{companySummary.totalWorkingHours} hrs
									</p>
									<p className="mt-1 text-slate-500 text-xs">
										{companySummary.totalOvertimeHours} hrs Overtime
									</p>
								</div>
								<div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40">
									<ClockIcon className="h-6 w-6" />
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Team Breakdown Summary Cards */}
					{teamSummaries.length > 0 && (
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 font-bold text-base">
									<UsersIcon className="h-5 w-5 text-blue-600" />
									Team-Wise Performance Summary
								</CardTitle>
								<CardDescription>
									Multi-department operational overview aggregated across teams.
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0 sm:p-6">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="border-b text-slate-500">
												<TableHead>Team Name</TableHead>
												<TableHead className="text-center">Employees</TableHead>
												<TableHead className="text-center">
													Attendance (P/A/L)
												</TableHead>
												<TableHead className="text-center">
													Hours Worked
												</TableHead>
												<TableHead className="text-center">
													Work Completed
												</TableHead>
												<TableHead className="text-right">Avg SLA %</TableHead>
												<TableHead className="text-right">
													Avg Quality %
												</TableHead>
												<TableHead className="text-right">
													Revenue (INR)
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{teamSummaries.map((t) => (
												<TableRow
													key={t.teamName}
													className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
												>
													<TableCell className="font-bold text-slate-900 dark:text-slate-100">
														{t.teamName}
													</TableCell>
													<TableCell className="text-center font-medium">
														{t.employeeCount}
													</TableCell>
													<TableCell className="text-center text-xs">
														<span className="font-semibold text-emerald-600">
															{t.presentEmployees} P
														</span>{" "}
														/{" "}
														<span className="font-semibold text-rose-600">
															{t.absentEmployees} A
														</span>{" "}
														/{" "}
														<span className="font-semibold text-amber-600">
															{t.leaveEmployees} L
														</span>
													</TableCell>
													<TableCell className="text-center font-medium">
														{t.totalWorkingHours} hrs
													</TableCell>
													<TableCell className="text-center font-semibold text-slate-800 dark:text-slate-200">
														{t.totalWorkCompleted} / {t.totalWorkAssigned}
													</TableCell>
													<TableCell className="text-right font-bold text-blue-600">
														{t.avgCompletionRate}%
													</TableCell>
													<TableCell className="text-right font-bold text-purple-600">
														{t.avgQualityRate}%
													</TableCell>
													<TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
														{t.totalRevenueGenerated > 0
															? formatCurrency(t.totalRevenueGenerated)
															: "—"}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Individual Employee Performance Matrix Table */}
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-bold text-base">
								<ZapIcon className="h-5 w-5 text-amber-500" />
								{t("teamPerformanceSLAAuditing")}
							</CardTitle>
							<CardDescription>
								{t("exportableSpreadsheetMatrix")}
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 sm:p-6">
							{isLoading ? (
								<div className="flex justify-center py-12">
									<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="border-b text-slate-500">
												<TableHead>{t("employeeIdCol")}</TableHead>
												<TableHead>{t("nameCol")}</TableHead>
												<TableHead>{t("systemRoleCol")}</TableHead>
												<TableHead>Team</TableHead>
												<TableHead className="text-center">
													Attendance
												</TableHead>
												<TableHead className="text-center">
													{t("tasksAllocatedCol")}
												</TableHead>
												<TableHead className="text-center">
													{t("completedCol")}
												</TableHead>
												<TableHead className="text-center">
													Speed / Rate
												</TableHead>
												<TableHead className="text-center">Quality %</TableHead>
												<TableHead className="text-right">
													{t("completionRateCol")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{employeeDetails.map((p) => (
												<TableRow
													key={p.id}
													className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
												>
													<TableCell className="font-mono font-semibold text-slate-500 text-xs">
														{p.staffCode}
													</TableCell>
													<TableCell className="font-bold text-slate-900 dark:text-slate-100">
														{p.name}
													</TableCell>
													<TableCell className="font-medium text-slate-500 text-xs capitalize">
														{p.role}
													</TableCell>
													<TableCell className="text-xs">
														<Badge
															variant="outline"
															className="text-[10px] uppercase"
														>
															{p.team}
														</Badge>
													</TableCell>
													<TableCell className="text-center font-semibold text-xs">
														<span className="text-emerald-600">
															{p.presentDays} Days Present
														</span>
													</TableCell>
													<TableCell className="text-center font-semibold text-slate-700 dark:text-slate-300">
														{p.workAssigned}
													</TableCell>
													<TableCell className="text-center font-semibold text-emerald-600">
														{p.workCompleted}
													</TableCell>
													<TableCell className="text-center font-medium text-slate-600 text-xs dark:text-slate-400">
														{p.productivityValue} {p.productivityUnit}
													</TableCell>
													<TableCell className="text-center font-bold text-purple-600 text-xs">
														{p.qualityRate}%
													</TableCell>
													<TableCell className="text-right font-bold text-slate-900 dark:text-slate-200">
														<span
															className={
																p.completionRate >= 90
																	? "text-emerald-600"
																	: p.completionRate >= 75
																		? "text-amber-600"
																		: "text-rose-600"
															}
														>
															{p.completionRate}%
														</span>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</PageTransition>
	);
}
