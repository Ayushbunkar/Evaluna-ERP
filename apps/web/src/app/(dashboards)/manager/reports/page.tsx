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
	ClockIcon,
	DownloadIcon,
	FileBarChartIcon,
	FileSpreadsheetIcon,
	FileTextIcon,
	FilterIcon,
	Loader2Icon,
	ShieldCheckIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DateFilterBar } from "@/components/shared/filters/date-filter-bar";
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
	const [activeTab, setActiveTab] = useState<"live" | "archive">("live");
	const [isPdfGenerating, setIsPdfGenerating] = useState(false);

	// Saved Reports Archive State
	const [savedArchives, setSavedArchives] = useState<SavedReportArchive[]>([]);

	// Sourced directly from backend procedure with filtering & multi-tier aggregations
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
				</div>
			</div>

			{/* Date Range Filter Bar */}
			<Card className="shadow-sm">
				<CardContent className="p-4 sm:p-6">
					<DateFilterBar
						startDate={startDate}
						endDate={endDate}
						datePreset={datePreset}
						searchQuery={searchQuery}
						onStartDateChange={setStartDate}
						onEndDateChange={setEndDate}
						onDatePresetChange={setDatePreset}
						onSearchQueryChange={setSearchQuery}
						onResetFilters={() => {
							setStartDate("");
							setEndDate("");
							setDatePreset("all");
							setSelectedTeam("all");
							setSearchQuery("");
						}}
						isRefetching={isRefetching}
						onRefetch={refetch}
					/>

					<div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-slate-100 border-t pt-4 dark:border-slate-800">
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

						{/* Navigation Tabs */}
						<div className="flex items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
							<button
								type="button"
								onClick={() => setActiveTab("live")}
								className={`rounded-md px-3 py-1 font-semibold text-xs transition-colors ${
									activeTab === "live"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400"
								}`}
							>
								Live Performance
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
								Historical Reports Archive ({savedArchives.length})
							</button>
						</div>
					</div>
				</CardContent>
			</Card>

			{activeTab === "archive" ? (
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
