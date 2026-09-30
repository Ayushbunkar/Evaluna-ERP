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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CalendarIcon,
	CalendarOffIcon,
	CameraIcon,
	CameraOffIcon,
	CheckCircle2Icon,
	ClockIcon,
	DownloadIcon,
	Edit3Icon,
	EyeIcon,
	FilterIcon,
	HistoryIcon,
	InfoIcon,
	Loader2Icon,
	MapPinIcon,
	RefreshCwIcon,
	SearchIcon,
	ShieldCheckIcon,
	UserCheckIcon,
	UserIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTransition } from "@/lib/animations";
import {
	ADJUSTMENT_CATEGORIES,
	type CanonicalAttendanceStatus,
} from "@/lib/attendance-engine";
import { useTRPC } from "@/lib/trpc/client";

export default function HRAttendancePage() {
	const trpc = useTRPC();
	const [selectedImage, setSelectedImage] = useState<{
		url: string;
		title: string;
	} | null>(null);

	// ── Filter State ────────────────────────────────────────────────────────────
	const [activeTab, setActiveTab] = useState("today");
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [selectedDepartment, setSelectedDepartment] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");

	// ── Monthly Tab State ───────────────────────────────────────────────────────
	const currentDate = new Date();
	const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
	const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

	// ── Modal States ────────────────────────────────────────────────────────────
	// 1. Adjust Modal
	const [adjustModalOpen, setAdjustModalOpen] = useState(false);
	const [adjustTarget, setAdjustTarget] = useState<any>(null);
	const [adjustCheckIn, setAdjustCheckIn] = useState("");
	const [adjustCheckOut, setAdjustCheckOut] = useState("");
	const [adjustStatus, setAdjustStatus] = useState<string>("present");
	const [adjustCategory, setAdjustCategory] = useState<string>(
		"biometric_malfunction",
	);
	const [adjustReason, setAdjustReason] = useState("");

	// 2. Detail Modal
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedRecordForDetail, setSelectedRecordForDetail] =
		useState<any>(null);

	// 3. Mark Off Modal
	const [isMarkOffOpen, setIsMarkOffOpen] = useState(false);
	const [offEmployeeId, setOffEmployeeId] = useState<number | "">("");
	const [offDate, setOffDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [offStatus, setOffStatus] = useState<
		"leave" | "holiday" | "absent" | "week_off"
	>("leave");
	const [offReason, setOffReason] = useState("");

	// ── Queries ─────────────────────────────────────────────────────────────────
	const {
		data: attendanceRecords = [],
		isLoading: isRecordsLoading,
		refetch: refetchAttendance,
	} = trpc.hr.getAttendanceRecords.useQuery({
		date: selectedDate,
		department: selectedDepartment !== "all" ? selectedDepartment : undefined,
		status: statusFilter !== "all" ? statusFilter : undefined,
		search: searchQuery.trim() || undefined,
	});

	const {
		data: summaryStats,
		isLoading: isSummaryLoading,
		refetch: refetchSummary,
	} = trpc.hr.getAttendanceSummary.useQuery({
		date: selectedDate,
		department: selectedDepartment !== "all" ? selectedDepartment : undefined,
	});

	const { data: employeesList = [] } = trpc.hr.getEmployees.useQuery({});

	const {
		data: monthlyData,
		isLoading: isMonthlyLoading,
		refetch: refetchMonthly,
	} = trpc.hr.getMonthlySummary.useQuery(
		{
			year: selectedYear,
			month: selectedMonth,
			department: selectedDepartment !== "all" ? selectedDepartment : undefined,
		},
		{ enabled: activeTab === "monthly" },
	);

	const {
		data: adjustmentsReport,
		isLoading: isAdjustmentsLoading,
		refetch: refetchAdjustments,
	} = trpc.hr.getAttendanceReports.useQuery(
		{ reportType: "adjustments", date: selectedDate },
		{ enabled: activeTab === "adjustments" },
	);

	const {
		data: exceptionsReport,
		isLoading: isExceptionsLoading,
		refetch: refetchExceptions,
	} = trpc.hr.getAttendanceReports.useQuery(
		{ reportType: "exceptions", date: selectedDate },
		{ enabled: activeTab === "reports" },
	);

	const { data: recordDetail, isLoading: isDetailLoading } =
		trpc.hr.getAttendanceDetail.useQuery(
			{
				attendanceId: selectedRecordForDetail?.id,
				staffId: selectedRecordForDetail?.staffId,
				date: selectedDate,
			},
			{ enabled: detailModalOpen && Boolean(selectedRecordForDetail) },
		);

	// ── Mutations ───────────────────────────────────────────────────────────────
	const adjustMutation = trpc.hr.adjustAttendance.useMutation({
		onSuccess: () => {
			toast.success("Attendance adjusted successfully & audit trail logged.");
			refetchAttendance();
			refetchSummary();
			refetchMonthly();
			refetchAdjustments();
			setAdjustModalOpen(false);
			setAdjustTarget(null);
			setAdjustReason("");
		},
		onError: (err) => {
			toast.error(`Adjustment failed: ${err.message}`);
		},
	});

	const markOffMutation = trpc.hr.markEmployeeOff.useMutation({
		onSuccess: () => {
			toast.success("Employee marked off / holiday updated.");
			refetchAttendance();
			refetchSummary();
			refetchMonthly();
			setIsMarkOffOpen(false);
			setOffEmployeeId("");
			setOffReason("");
		},
		onError: (err) => {
			toast.error(`Failed to mark off: ${err.message}`);
		},
	});

	// ── Helpers ─────────────────────────────────────────────────────────────────
	const handleOpenAdjust = (rec: any) => {
		setAdjustTarget(rec);
		setAdjustCheckIn(rec.checkIn || "09:30");
		setAdjustCheckOut(rec.checkOut || "18:30");
		setAdjustStatus(
			rec.status === "HALF_DAY"
				? "half_day"
				: rec.status === "ABSENT"
					? "absent"
					: "present",
		);
		setAdjustCategory(rec.adjustmentCategory || "biometric_malfunction");
		setAdjustReason(rec.adjustmentReason || "");
		setAdjustModalOpen(true);
	};

	const handleSubmitAdjust = (e: React.FormEvent) => {
		e.preventDefault();
		if (!adjustReason.trim() || adjustReason.trim().length < 3) {
			toast.error("Please provide a valid adjustment explanation (min 3 chars).");
			return;
		}
		if (!adjustTarget) return;

		adjustMutation.mutate({
			staffId: adjustTarget.staffId,
			employeeId: adjustTarget.employeeId,
			date: selectedDate,
			checkIn: adjustCheckIn.trim() || null,
			checkOut: adjustCheckOut.trim() || null,
			status: adjustStatus as any,
			adjustmentCategory: adjustCategory as any,
			adjustmentReason: adjustReason.trim(),
		});
	};

	const handleOpenDetail = (rec: any) => {
		setSelectedRecordForDetail(rec);
		setDetailModalOpen(true);
	};

	const exportToCSV = (dataRows: any[], fileName: string) => {
		if (!dataRows || !dataRows.length) {
			toast.error("No data available to export.");
			return;
		}
		const keys = Object.keys(dataRows[0]);
		const csvContent = [
			keys.join(","),
			...dataRows.map((row) =>
				keys
					.map((k) => {
						const val = row[k] ?? "";
						return `"${String(val).replace(/"/g, '""')}"`;
					})
					.join(","),
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `${fileName}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		toast.success(`Exported ${dataRows.length} rows to ${fileName}.csv`);
	};

	// Status badge renderer
	const renderStatusBadge = (status: CanonicalAttendanceStatus | string) => {
		switch (status) {
			case "FULL_DAY":
				return (
					<Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 font-medium">
						Full Day
					</Badge>
				);
			case "HALF_DAY":
				return (
					<Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-medium">
						Half Day
					</Badge>
				);
			case "LATE":
				return (
					<Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 font-medium">
						Late Arrival
					</Badge>
				);
			case "EARLY_DEPARTURE":
				return (
					<Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 font-medium">
						Early Exit
					</Badge>
				);
			case "LEAVE":
				return (
					<Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 font-medium">
						Leave
					</Badge>
				);
			case "HOLIDAY":
				return (
					<Badge className="bg-purple-500 hover:bg-purple-600 text-white border-0 font-medium">
						Holiday
					</Badge>
				);
			case "WEEKLY_OFF":
				return (
					<Badge variant="outline" className="text-slate-600 border-slate-300 font-medium">
						Weekly Off
					</Badge>
				);
			case "INCOMPLETE":
				return (
					<Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 font-medium">
						Missing Out
					</Badge>
				);
			case "ABSENT":
				return (
					<Badge className="bg-red-500 hover:bg-red-600 text-white border-0 font-medium">
						Absent
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="capitalize">
						{status}
					</Badge>
				);
		}
	};

	return (
		<PageTransition className="container mx-auto space-y-6 py-6 px-3 sm:px-6">
			{/* Top Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
							<UserCheckIcon className="h-7 w-7 text-blue-600" />
							HR Attendance Management System
						</h1>
						<Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
							Enterprise HR
						</Badge>
					</div>
					<p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
						Live roll, shift-based punctuality, canonical profile photos, system recovery adjustments, and audit trail.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetchAttendance();
							refetchSummary();
							toast.success("Attendance refreshed");
						}}
						className="text-xs h-9"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" /> Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsMarkOffOpen(true)}
						className="text-xs h-9 border-blue-200 hover:bg-blue-50 dark:border-blue-900 text-blue-700 dark:text-blue-300"
					>
						<CalendarOffIcon className="mr-1.5 h-3.5 w-3.5" /> Mark Leave / Holiday
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
				<Card className="p-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-slate-500">Total Staff</span>
						<UsersIcon className="h-4 w-4 text-slate-400" />
					</div>
					<div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
						{summaryStats?.totalEmployees ?? employeesList.length}
					</div>
				</Card>

				<Card className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Present</span>
						<CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
					</div>
					<div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
						{summaryStats?.presentCount ?? 0}
					</div>
				</Card>

				<Card className="p-3 bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Late Arrival</span>
						<ClockIcon className="h-4 w-4 text-orange-600" />
					</div>
					<div className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-300">
						{summaryStats?.lateCount ?? 0}
					</div>
				</Card>

				<Card className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Half Day</span>
						<AlertTriangleIcon className="h-4 w-4 text-amber-600" />
					</div>
					<div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
						{summaryStats?.halfDayCount ?? 0}
					</div>
				</Card>

				<Card className="p-3 bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-red-700 dark:text-red-400">Absent</span>
						<XCircleIcon className="h-4 w-4 text-red-600" />
					</div>
					<div className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">
						{summaryStats?.absentCount ?? 0}
					</div>
				</Card>

				<Card className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-blue-700 dark:text-blue-400">On Leave</span>
						<CalendarIcon className="h-4 w-4 text-blue-600" />
					</div>
					<div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
						{summaryStats?.leaveCount ?? 0}
					</div>
				</Card>

				<Card className="p-3 bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40 shadow-xs">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Adjusted</span>
						<HistoryIcon className="h-4 w-4 text-purple-600" />
					</div>
					<div className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-300">
						{summaryStats?.adjustedCount ?? 0}
					</div>
				</Card>
			</div>

			{/* Main Interactive Tabs Navigation */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border">
					<TabsList className="bg-transparent border-0">
						<TabsTrigger value="today" className="text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs">
							<ClockIcon className="mr-1.5 h-4 w-4 text-blue-600" /> Today / Daily Roll
						</TabsTrigger>
						<TabsTrigger value="monthly" className="text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs">
							<CalendarIcon className="mr-1.5 h-4 w-4 text-emerald-600" /> Monthly Summary & Grid
						</TabsTrigger>
						<TabsTrigger value="adjustments" className="text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs">
							<HistoryIcon className="mr-1.5 h-4 w-4 text-purple-600" /> Adjustments & Recovery Queue
						</TabsTrigger>
						<TabsTrigger value="reports" className="text-xs sm:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs">
							<DownloadIcon className="mr-1.5 h-4 w-4 text-indigo-600" /> Reports & Export
						</TabsTrigger>
					</TabsList>

					{/* Date & Filter Toolbar */}
					<div className="flex flex-wrap items-center gap-2">
						{activeTab === "today" && (
							<>
								<div className="flex items-center gap-1 bg-white dark:bg-slate-800 border rounded-md px-2 py-1 shadow-2xs">
									<CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
									<input
										type="date"
										value={selectedDate}
										onChange={(e) => setSelectedDate(e.target.value)}
										className="bg-transparent text-xs font-medium focus:outline-hidden"
									/>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
									className="text-xs h-7"
								>
									Today
								</Button>
							</>
						)}

						{activeTab === "monthly" && (
							<div className="flex items-center gap-2">
								<select
									value={selectedMonth}
									onChange={(e) => setSelectedMonth(Number(e.target.value))}
									className="bg-white dark:bg-slate-800 border rounded-md px-2 py-1 text-xs font-semibold"
								>
									{[
										"January", "February", "March", "April", "May", "June",
										"July", "August", "September", "October", "November", "December"
									].map((m, idx) => (
										<option key={m} value={idx + 1}>{m}</option>
									))}
								</select>
								<select
									value={selectedYear}
									onChange={(e) => setSelectedYear(Number(e.target.value))}
									className="bg-white dark:bg-slate-800 border rounded-md px-2 py-1 text-xs font-semibold"
								>
									{[2025, 2026, 2027].map((yr) => (
										<option key={yr} value={yr}>{yr}</option>
									))}
								</select>
							</div>
						)}
					</div>
				</div>

				{/* ══════════════════════════════════════════════════════════════════════ */}
				{/* TAB 1: TODAY / DAILY ATTENDANCE ROLL */}
				{/* ══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="today" className="space-y-4 m-0">
					{/* Search & Department Filters Bar */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div className="flex flex-wrap items-center gap-2 flex-1">
							<div className="relative w-full sm:w-64">
								<SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
								<Input
									placeholder="Search name, code, email..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-8 text-xs h-9"
								/>
							</div>

							<select
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
								className="h-9 rounded-md border border-slate-200 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-200"
							>
								<option value="all">All Departments</option>
								<option value="General">General</option>
								<option value="Operations">Operations</option>
								<option value="Warehouse">Warehouse</option>
								<option value="Logistics">Logistics</option>
								<option value="Sales">Sales</option>
							</select>

							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="h-9 rounded-md border border-slate-200 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-200"
							>
								<option value="all">All Statuses</option>
								<option value="PRESENT">Present (Full Day)</option>
								<option value="LATE">Late Arrival</option>
								<option value="HALF_DAY">Half Day</option>
								<option value="ABSENT">Absent</option>
								<option value="LEAVE">On Leave</option>
								<option value="INCOMPLETE">Missing Check-out</option>
								<option value="ADJUSTED">Adjusted / Corrected</option>
							</select>
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								exportToCSV(
									attendanceRecords.map((r: any) => ({
										Employee: r.name,
										Code: r.employeeCode,
										Department: r.department,
										Date: r.date,
										Status: r.status,
										CheckIn: r.checkInFormatted || "-",
										CheckOut: r.checkOutFormatted || "-",
										WorkingHours: r.workingHoursFormatted,
										IsAdjusted: r.isAdjusted ? "YES" : "NO",
										AdjustmentReason: r.adjustmentReason || "",
									})),
									`Attendance_Roll_${selectedDate}`,
								)
							}
							className="text-xs h-9 shrink-0"
						>
							<DownloadIcon className="mr-1.5 h-3.5 w-3.5 text-blue-600" /> Export Roll CSV
						</Button>
					</div>

					{/* Attendance Table */}
					<Card className="shadow-xs overflow-hidden">
						{isRecordsLoading ? (
							<div className="flex flex-col items-center justify-center py-16 gap-2">
								<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
								<span className="text-xs text-slate-500 font-medium">Loading attendance records...</span>
							</div>
						) : attendanceRecords.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
								<AlertCircleIcon className="h-8 w-8 text-slate-300" />
								<span className="text-xs sm:text-sm font-medium">No attendance records found for this date & filters.</span>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
											<TableHead className="w-14 text-center">Photo</TableHead>
											<TableHead>Employee Details</TableHead>
											<TableHead>Shift</TableHead>
											<TableHead>Check-In</TableHead>
											<TableHead>Check-Out</TableHead>
											<TableHead>Duration</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Audit / Adjustment</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{attendanceRecords.map((rec: any) => (
											<TableRow key={rec.staffId || rec.id} className="hover:bg-slate-50/50">
												{/* Canonical Photo column (no duplicate storage!) */}
												<TableCell className="text-center py-2.5">
													{rec.photoUrl ? (
														<img
															src={rec.photoUrl}
															alt={rec.name}
															className="h-10 w-10 rounded-full object-cover mx-auto ring-2 ring-blue-500/20 shadow-2xs"
															loading="lazy"
														/>
													) : (
														<div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-2xs">
															{rec.name
																?.split(" ")
																.map((n: string) => n[0])
																.slice(0, 2)
																.join("")
																.toUpperCase() || "EM"}
														</div>
													)}
												</TableCell>

												{/* Employee Details */}
												<TableCell>
													<div>
														<p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
															{rec.name}
														</p>
														<div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
															<span className="font-mono font-medium text-blue-600 dark:text-blue-400">
																{rec.employeeCode}
															</span>
															<span>•</span>
															<span>{rec.department}</span>
														</div>
													</div>
												</TableCell>

												{/* Shift Info */}
												<TableCell>
													<div className="text-xs">
														<span className="font-medium text-slate-800 dark:text-slate-200 block">
															{rec.shiftName || "General Shift"}
														</span>
														<span className="text-[11px] text-slate-500 font-mono">
															{rec.shiftTimings || "09:30 AM - 06:30 PM"}
														</span>
													</div>
												</TableCell>

												{/* Check In */}
												<TableCell>
													<div className="flex items-center gap-2">
														{rec.checkInSelfieUrl || rec.selfieAttachmentId ? (
															<button
																type="button"
																onClick={() =>
																	setSelectedImage({
																		url: rec.checkInSelfieUrl || `/api/attendance/attachments/${rec.selfieAttachmentId}`,
																		title: `Check-In Selfie — ${rec.name} (${rec.checkInFormatted || ""})`,
																	})
																}
																className="group relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-emerald-500 bg-emerald-50 shadow-xs hover:ring-2 hover:ring-emerald-600"
																title="Click to view Check-In Selfie"
															>
																<img
																	src={rec.checkInSelfieUrl || `/api/attendance/attachments/${rec.selfieAttachmentId}`}
																	alt={`Check-in selfie of ${rec.name}`}
																	className="h-full w-full object-cover"
																	loading="lazy"
																	onError={(e) => {
																		const target = e.currentTarget;
																		if (!target.dataset.retried && rec.selfieAttachmentId) {
																			target.dataset.retried = "1";
																			setTimeout(() => {
																				target.src = `/api/attendance/attachments/${rec.selfieAttachmentId}?retry=1`;
																			}, 300);
																		}
																	}}
																/>
																<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
																	<CameraIcon className="h-3.5 w-3.5 text-white" />
																</div>
															</button>
														) : rec.checkIn ? (
															<div
																className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"
																title="No check-in selfie"
															>
																<CameraOffIcon className="h-3.5 w-3.5" />
															</div>
														) : null}

														<div className="text-xs font-mono">
															{rec.checkInFormatted ? (
																<div className="flex flex-col">
																	<span className="font-semibold text-emerald-600">
																		{rec.checkInFormatted}
																	</span>
																	{rec.isLate && (
																		<Badge variant="outline" className="text-[10px] px-1 py-0 bg-orange-50 text-orange-700 border-orange-200 w-fit mt-0.5">
																			+{rec.lateMinutes}m Late
																		</Badge>
																	)}
																</div>
															) : (
																<span className="text-slate-400">--:--</span>
															)}
														</div>
													</div>
												</TableCell>

												{/* Check Out */}
												<TableCell>
													<div className="flex items-center gap-2">
														{rec.checkOutSelfieUrl || rec.checkOutSelfieAttachmentId ? (
															<button
																type="button"
																onClick={() =>
																	setSelectedImage({
																		url: rec.checkOutSelfieUrl || `/api/attendance/attachments/${rec.checkOutSelfieAttachmentId}`,
																		title: `Check-Out Selfie — ${rec.name} (${rec.checkOutFormatted || ""})`,
																	})
																}
																className="group relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-orange-500 bg-orange-50 shadow-xs hover:ring-2 hover:ring-orange-600"
																title="Click to view Check-Out Selfie"
															>
																<img
																	src={rec.checkOutSelfieUrl || `/api/attendance/attachments/${rec.checkOutSelfieAttachmentId}`}
																	alt={`Check-out selfie of ${rec.name}`}
																	className="h-full w-full object-cover"
																	loading="lazy"
																	onError={(e) => {
																		const target = e.currentTarget;
																		if (!target.dataset.retried && rec.checkOutSelfieAttachmentId) {
																			target.dataset.retried = "1";
																			setTimeout(() => {
																				target.src = `/api/attendance/attachments/${rec.checkOutSelfieAttachmentId}?retry=1`;
																			}, 300);
																		}
																	}}
																/>
																<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
																	<CameraIcon className="h-3.5 w-3.5 text-white" />
																</div>
															</button>
														) : rec.checkOut ? (
															<div
																className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"
																title="No check-out selfie"
															>
																<CameraOffIcon className="h-3.5 w-3.5" />
															</div>
														) : null}

														<div className="text-xs font-mono">
															{rec.checkOutFormatted ? (
																<div className="flex flex-col">
																	<span className="font-semibold text-slate-800 dark:text-slate-200">
																		{rec.checkOutFormatted}
																	</span>
																	{rec.isEarlyDeparture && (
																		<Badge variant="outline" className="text-[10px] px-1 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 w-fit mt-0.5">
																			-{rec.earlyDepartureMinutes}m Early
																		</Badge>
																	)}
																</div>
															) : rec.checkIn ? (
																<Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-200 font-sans">
																	Missing Out
																</Badge>
															) : (
																<span className="text-slate-400">--:--</span>
															)}
														</div>
													</div>
												</TableCell>

												{/* Duration */}
												<TableCell>
													<span className="text-xs font-mono font-medium text-blue-700 dark:text-blue-300">
														{rec.workingHoursFormatted || "0h"}
													</span>
												</TableCell>

												{/* Status */}
												<TableCell>{renderStatusBadge(rec.status)}</TableCell>

												{/* Adjustment Badge & Indicator */}
												<TableCell>
													{rec.isAdjusted ? (
														<div>
															<Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-300 flex items-center gap-1 w-fit">
																<ShieldCheckIcon className="h-3 w-3 text-purple-600" /> Adjusted
															</Badge>
															<p className="text-[10px] text-slate-500 mt-1 max-w-[140px] truncate" title={rec.adjustmentReason}>
																{rec.adjustmentReason || rec.adjustmentCategory}
															</p>
														</div>
													) : (
														<span className="text-xs text-slate-400">Standard</span>
													)}
												</TableCell>

												{/* Actions */}
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleOpenAdjust(rec)}
															className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
															title="Adjust Attendance"
														>
															<Edit3Icon className="h-3.5 w-3.5 mr-1 text-blue-600" /> Adjust
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenDetail(rec)}
															className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
															title="View Details"
														>
															<EyeIcon className="h-3.5 w-3.5" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</Card>
				</TabsContent>

				{/* ══════════════════════════════════════════════════════════════════════ */}
				{/* TAB 2: MONTHLY ATTENDANCE SUMMARY & GRID */}
				{/* ══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="monthly" className="space-y-4 m-0">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
								Monthly Attendance Roll — {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
							</h3>
							<p className="text-xs text-slate-500">
								Employee-by-employee aggregate metrics and day-by-day status matrix.
							</p>
						</div>

						{monthlyData?.employeeSummaries && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									exportToCSV(
										monthlyData.employeeSummaries.map((emp: any) => ({
											Employee: emp.name,
											Code: emp.code,
											Department: emp.department,
											PresentDays: emp.presentDays,
											HalfDays: emp.halfDays,
											LateDays: emp.lateDays,
											AbsentDays: emp.absentDays,
											LeaveDays: emp.leaveDays,
											AdjustedDays: emp.adjustedDays,
											TotalHours: emp.totalWorkingHoursFormatted,
										})),
										`Monthly_Attendance_${selectedYear}_${selectedMonth}`,
									)
								}
								className="text-xs h-9"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Export Month CSV
							</Button>
						)}
					</div>

					{isMonthlyLoading ? (
						<div className="flex flex-col items-center justify-center py-16 gap-2">
							<Loader2Icon className="h-8 w-8 animate-spin text-emerald-600" />
							<span className="text-xs text-slate-500 font-medium">Generating monthly matrix...</span>
						</div>
					) : (
						<Card className="shadow-xs overflow-hidden">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
											<TableHead className="w-12 text-center">Photo</TableHead>
											<TableHead className="min-w-[160px]">Employee</TableHead>
											<TableHead className="text-center font-bold text-emerald-700">Present (P)</TableHead>
											<TableHead className="text-center font-bold text-amber-700">Half Day (HD)</TableHead>
											<TableHead className="text-center font-bold text-orange-700">Late (L)</TableHead>
											<TableHead className="text-center font-bold text-red-700">Absent (A)</TableHead>
											<TableHead className="text-center font-bold text-blue-700">Leave (LV)</TableHead>
											<TableHead className="text-center font-bold text-purple-700">Adjusted</TableHead>
											<TableHead className="text-center font-bold text-slate-800">Total Hours</TableHead>
											<TableHead className="min-w-[320px]">Monthly Day-by-Day Matrix (1..{monthlyData?.daysInMonth})</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{monthlyData?.employeeSummaries.map((emp: any) => (
											<TableRow key={emp.staffId} className="hover:bg-slate-50/50">
												<TableCell className="text-center py-2">
													{emp.photoUrl ? (
														<img
															src={emp.photoUrl}
															alt={emp.name}
															className="h-8 w-8 rounded-full object-cover mx-auto"
														/>
													) : (
														<div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center mx-auto">
															{emp.name?.[0] || "E"}
														</div>
													)}
												</TableCell>
												<TableCell>
													<div>
														<p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{emp.name}</p>
														<p className="text-[10px] text-slate-500 font-mono">{emp.code}</p>
													</div>
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-emerald-600 text-xs">
													{emp.presentDays}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-amber-600 text-xs">
													{emp.halfDays}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-orange-600 text-xs">
													{emp.lateDays}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-red-600 text-xs">
													{emp.absentDays}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-blue-600 text-xs">
													{emp.leaveDays}
												</TableCell>
												<TableCell className="text-center font-mono font-bold text-purple-600 text-xs">
													{emp.adjustedDays}
												</TableCell>
												<TableCell className="text-center font-mono font-semibold text-xs">
													{emp.totalWorkingHoursFormatted}
												</TableCell>

												{/* Mini Day 1..31 Status Matrix */}
												<TableCell>
													<div className="flex flex-wrap gap-1 max-w-[420px]">
														{emp.dailyMatrix?.map((dm: any) => (
															<span
																key={dm.day}
																title={`Day ${dm.day} (${dm.date}): ${dm.statusLabel}${dm.isAdjusted ? " (Adjusted)" : ""}`}
																className={`h-5 w-5 rounded-xs flex items-center justify-center text-[9px] font-bold font-mono transition-transform hover:scale-125 cursor-pointer ${
																	dm.code === "P"
																		? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
																		: dm.code === "L"
																			? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
																			: dm.code === "HD"
																				? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
																				: dm.code === "LV"
																					? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
																					: dm.code === "H"
																						? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
																						: dm.code === "WO"
																							? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
																							: dm.code === "A"
																								? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
																								: "bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
																} ${dm.isAdjusted ? "ring-1 ring-purple-500" : ""}`}
															>
																{dm.code}
															</span>
														))}
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</Card>
					)}
				</TabsContent>

				{/* ══════════════════════════════════════════════════════════════════════ */}
				{/* TAB 3: ADJUSTMENTS & RECOVERY AUDIT QUEUE */}
				{/* ══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="adjustments" className="space-y-4 m-0">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
								Attendance Adjustments & System Recovery Queue
							</h3>
							<p className="text-xs text-slate-500">
								Immutable log of all punch adjustments, reasons, biometric/system failure recovery, and original values.
							</p>
						</div>

						{adjustmentsReport?.rows && (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									exportToCSV(
										adjustmentsReport.rows,
										`Attendance_Adjustments_Audit_${new Date().toISOString().split("T")[0]}`,
									)
								}
								className="text-xs h-9"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5 text-purple-600" /> Export Audit CSV
							</Button>
						)}
					</div>

					<Card className="shadow-xs overflow-hidden">
						{isAdjustmentsLoading ? (
							<div className="flex flex-col items-center justify-center py-16 gap-2">
								<Loader2Icon className="h-8 w-8 animate-spin text-purple-600" />
								<span className="text-xs text-slate-500 font-medium">Loading adjustments audit trail...</span>
							</div>
						) : !adjustmentsReport?.rows || adjustmentsReport.rows.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
								<ShieldCheckIcon className="h-8 w-8 text-emerald-500" />
								<span className="text-xs sm:text-sm font-medium">No manual adjustments or system recoveries recorded yet.</span>
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
											<TableHead>Employee</TableHead>
											<TableHead>Attendance Date</TableHead>
											<TableHead>Original Punches</TableHead>
											<TableHead>Adjusted Punches</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Mandatory Reason / Notes</TableHead>
											<TableHead>Adjusted Timestamp</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{adjustmentsReport.rows.map((row: any) => (
											<TableRow key={row.id} className="hover:bg-slate-50/50">
												<TableCell>
													<div>
														<p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{row.name}</p>
														<p className="text-[10px] text-slate-500 font-mono">{row.code} ({row.department})</p>
													</div>
												</TableCell>
												<TableCell className="font-mono text-xs font-medium">{row.date}</TableCell>
												<TableCell className="text-xs font-mono text-slate-500">
													<div>In: {row.originalCheckIn || "Missing"}</div>
													<div>Out: {row.originalCheckOut || "Missing"}</div>
												</TableCell>
												<TableCell className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
													<div>In: {row.adjustedCheckIn || "None"}</div>
													<div>Out: {row.adjustedCheckOut || "None"}</div>
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-[10px] capitalize bg-purple-50 text-purple-700 border-purple-200">
														{row.category?.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-slate-700 dark:text-slate-300 max-w-[250px]">
													<span className="font-medium">{row.reason}</span>
												</TableCell>
												<TableCell className="text-xs text-slate-500 font-mono">{row.adjustedAt}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</Card>
				</TabsContent>

				{/* ══════════════════════════════════════════════════════════════════════ */}
				{/* TAB 4: REPORTS & EXPORT */}
				{/* ══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="reports" className="space-y-4 m-0">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Daily Report Card */}
						<Card className="p-4 flex flex-col justify-between border-slate-200 shadow-xs">
							<div>
								<div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
									<ClockIcon className="h-5 w-5" />
								</div>
								<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Daily Attendance Register</h4>
								<p className="text-xs text-slate-500 mt-1">
									Complete roll of check-in, check-out, working hours, and punctuality flags for date {selectedDate}.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									exportToCSV(
										attendanceRecords.map((r: any) => ({
											Name: r.name,
											Code: r.employeeCode,
											Department: r.department,
											Date: r.date,
											CheckIn: r.checkInFormatted || "-",
											CheckOut: r.checkOutFormatted || "-",
											WorkingHours: r.workingHoursFormatted,
											Status: r.status,
										})),
										`Daily_Register_${selectedDate}`,
									)
								}
								className="mt-4 text-xs"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Download Daily CSV
							</Button>
						</Card>

						{/* Exceptions Card */}
						<Card className="p-4 flex flex-col justify-between border-slate-200 shadow-xs">
							<div>
								<div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
									<AlertCircleIcon className="h-5 w-5" />
								</div>
								<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Missing Check-Out Exceptions</h4>
								<p className="text-xs text-slate-500 mt-1">
									Audit report of all employees who punched in but missed checkout.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									exportToCSV(
										exceptionsReport?.rows || [],
										`Missing_Checkout_Exceptions_${selectedDate}`,
									)
								}
								className="mt-4 text-xs"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Download Exceptions CSV
							</Button>
						</Card>

						{/* Adjustments Audit Card */}
						<Card className="p-4 flex flex-col justify-between border-slate-200 shadow-xs">
							<div>
								<div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
									<HistoryIcon className="h-5 w-5" />
								</div>
								<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Adjustments & Recovery Audit</h4>
								<p className="text-xs text-slate-500 mt-1">
									Complete trail of manual adjustments, reasons, before/after values, and managers who adjusted.
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									exportToCSV(
										adjustmentsReport?.rows || [],
										`Adjustments_Audit_Report_${selectedDate}`,
									)
								}
								className="mt-4 text-xs"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Download Audit CSV
							</Button>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			{/* ══════════════════════════════════════════════════════════════════════ */}
			{/* MODAL 1: ADJUST ATTENDANCE & SYSTEM RECOVERY */}
			{/* ══════════════════════════════════════════════════════════════════════ */}
			<Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
				<DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
							<Edit3Icon className="h-5 w-5 text-blue-600" />
							Adjust Attendance & Recovery
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Adjust punch-in, punch-out, or status due to biometric failure, network down, or forgot punch.
						</DialogDescription>
					</DialogHeader>

					{adjustTarget && (
						<form onSubmit={handleSubmitAdjust} className="space-y-4 pt-2">
							{/* Employee Banner with Canonical Photo */}
							<div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/60">
								{adjustTarget.photoUrl ? (
									<img
										src={adjustTarget.photoUrl}
										alt={adjustTarget.name}
										className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-500/20"
									/>
								) : (
									<div className="h-11 w-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
										{adjustTarget.name?.[0] || "E"}
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
										{adjustTarget.name}
									</h4>
									<div className="flex items-center gap-2 text-xs text-slate-500">
										<span className="font-mono text-blue-600 font-semibold">{adjustTarget.employeeCode}</span>
										<span>•</span>
										<span>{adjustTarget.department}</span>
									</div>
								</div>
								<Badge variant="outline" className="text-xs">
									{selectedDate}
								</Badge>
							</div>

							{/* Original Raw Punches Info Banner */}
							<div className="text-xs p-2.5 rounded-md bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200">
								<span className="font-semibold block mb-0.5">Original System Punches (Preserved):</span>
								<span className="font-mono text-[11px]">
									Check-in: {adjustTarget.originalCheckInFormatted || adjustTarget.checkInFormatted || "None"} | Check-out: {adjustTarget.originalCheckOutFormatted || adjustTarget.checkOutFormatted || "None"}
								</span>
							</div>

							{/* Check In / Check Out Inputs */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<Label className="text-xs font-semibold">Adjusted Check-In (HH:MM)</Label>
									<Input
										type="time"
										value={adjustCheckIn}
										onChange={(e) => setAdjustCheckIn(e.target.value)}
										className="text-xs font-mono"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs font-semibold">Adjusted Check-Out (HH:MM)</Label>
									<Input
										type="time"
										value={adjustCheckOut}
										onChange={(e) => setAdjustCheckOut(e.target.value)}
										className="text-xs font-mono"
									/>
								</div>
							</div>

							{/* Status Override */}
							<div className="space-y-1">
								<Label className="text-xs font-semibold">Status Override</Label>
								<select
									value={adjustStatus}
									onChange={(e) => setAdjustStatus(e.target.value)}
									className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
								>
									<option value="present">Present (Full Day)</option>
									<option value="half_day">Half Day</option>
									<option value="absent">Absent</option>
									<option value="leave">On Leave</option>
									<option value="holiday">Official Holiday</option>
									<option value="week_off">Week Off</option>
								</select>
							</div>

							{/* Mandatory Reason Category */}
							<div className="space-y-1">
								<Label className="text-xs font-semibold flex items-center gap-1">
									Mandatory Reason Category <span className="text-red-500">*</span>
								</Label>
								<select
									value={adjustCategory}
									onChange={(e) => setAdjustCategory(e.target.value)}
									className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
									required
								>
									{ADJUSTMENT_CATEGORIES.map((cat) => (
										<option key={cat.value} value={cat.value}>
											{cat.label}
										</option>
									))}
								</select>
							</div>

							{/* Mandatory Explanation Notes */}
							<div className="space-y-1">
								<Label className="text-xs font-semibold flex items-center gap-1">
									Detailed Explanation / Manager Remarks <span className="text-red-500">*</span>
								</Label>
								<textarea
									value={adjustReason}
									onChange={(e) => setAdjustReason(e.target.value)}
									placeholder="Explain reason for manual adjustment (e.g. Biometric scanner lost power from 9am to 10am; verified on CCTV)..."
									rows={3}
									className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
									required
								/>
							</div>

							<div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-[11px]">
								<InfoIcon className="h-4 w-4 shrink-0 text-amber-600" />
								<span>Changes will be logged in the immutable audit log with your account email and timestamp.</span>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setAdjustModalOpen(false)}
									disabled={adjustMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={adjustMutation.isPending}
									className="bg-blue-600 hover:bg-blue-700 text-white"
								>
									{adjustMutation.isPending ? (
										<>
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
										</>
									) : (
										"Save Adjustment"
									)}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* ══════════════════════════════════════════════════════════════════════ */}
			{/* MODAL 2: DETAILED ATTENDANCE INSPECTION */}
			{/* ══════════════════════════════════════════════════════════════════════ */}
			<Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
				<DialogContent className="sm:max-w-[550px] bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
							<EyeIcon className="h-5 w-5 text-blue-600" />
							Attendance Inspection Detail
						</DialogTitle>
					</DialogHeader>

					{isDetailLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
						</div>
					) : (
						<div className="space-y-4 pt-2">
							{/* Employee Card */}
							<div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/60">
								{recordDetail?.staff?.photoUrl ? (
									<img
										src={recordDetail.staff.photoUrl}
										alt={recordDetail.staff.name}
										className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/20"
									/>
								) : (
									<div className="h-12 w-12 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
										{recordDetail?.staff?.name?.[0] || "E"}
									</div>
								)}
								<div className="flex-1">
									<h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
										{recordDetail?.staff?.name}
									</h4>
									<div className="flex items-center gap-2 text-xs text-slate-500">
										<span className="font-mono text-blue-600 font-semibold">{recordDetail?.staff?.code}</span>
										<span>•</span>
										<span>{recordDetail?.staff?.department}</span>
										<span>•</span>
										<span>{recordDetail?.staff?.role}</span>
									</div>
								</div>
							</div>

							{/* Timings & Punctuality Breakdown */}
							<div className="grid grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-md border">
								<div>
									<span className="text-slate-400 block">Check-In Time:</span>
									<span className="font-mono font-bold text-sm text-emerald-600">
										{recordDetail?.attendance?.checkIn || "Not Recorded"}
									</span>
									{Boolean(recordDetail?.attendance?.lateMinutes && recordDetail.attendance.lateMinutes > 0) && (
										<span className="text-[11px] text-orange-600 block mt-0.5 font-medium">
											Late by {recordDetail?.attendance?.lateMinutes} minutes
										</span>
									)}
								</div>
								<div>
									<span className="text-slate-400 block">Check-Out Time:</span>
									<span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
										{recordDetail?.attendance?.checkOut || "Not Recorded"}
									</span>
									{Boolean(recordDetail?.attendance?.earlyExitMinutes && recordDetail.attendance.earlyExitMinutes > 0) && (
										<span className="text-[11px] text-indigo-600 block mt-0.5 font-medium">
											Early departure by {recordDetail?.attendance?.earlyExitMinutes} minutes
										</span>
									)}
								</div>
								<div>
									<span className="text-slate-400 block">Working Hours:</span>
									<span className="font-mono font-bold text-sm text-blue-600">
										{recordDetail?.attendance?.workingHours ? `${recordDetail.attendance.workingHours} hrs` : "0 hrs"}
									</span>
								</div>
								<div>
									<span className="text-slate-400 block">Status:</span>
									<div className="mt-1">
										{renderStatusBadge(recordDetail?.attendance?.status || "absent")}
									</div>
								</div>
							</div>

							{/* Notes & Location */}
							{recordDetail?.attendance?.notes && (
								<div className="text-xs p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border text-slate-700 dark:text-slate-300">
									<span className="font-semibold block mb-0.5">Location & Notes:</span>
									<span>{recordDetail.attendance.notes}</span>
								</div>
							)}

							{/* Audit Trail History */}
							{recordDetail?.auditTrail && recordDetail.auditTrail.length > 0 && (
								<div className="space-y-1.5">
									<h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
										<HistoryIcon className="h-3.5 w-3.5 text-purple-600" />
										Adjustment History & Audit Trail
									</h5>
									<div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
										{recordDetail.auditTrail.map((log: any) => (
											<div key={log.id} className="text-[11px] p-2 rounded-sm border bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
												<div className="flex justify-between font-semibold text-purple-950 dark:text-purple-200">
													<span>{log.action}</span>
													<span className="font-mono text-[10px] text-slate-500">
														{new Date(log.created_at).toLocaleString()}
													</span>
												</div>
												{log.new_values?.reason && (
													<p className="text-slate-600 dark:text-slate-300 mt-0.5">
														Reason: {log.new_values.reason}
													</p>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* ══════════════════════════════════════════════════════════════════════ */}
			{/* MODAL 3: MARK EMPLOYEE OFF / HOLIDAY */}
			{/* ══════════════════════════════════════════════════════════════════════ */}
			<Dialog open={isMarkOffOpen} onOpenChange={setIsMarkOffOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg flex items-center gap-2">
							<CalendarOffIcon className="h-5 w-5 text-blue-600" />
							Mark Employee Off / Holiday
						</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!offEmployeeId) {
								toast.error("Please select an employee");
								return;
							}
							markOffMutation.mutate({
								employeeId: Number(offEmployeeId),
								date: offDate,
								status: offStatus,
								reason: offReason,
							});
						}}
						className="space-y-4 pt-2"
					>
						<div className="space-y-1">
							<Label className="text-xs font-semibold">Select Employee</Label>
							<select
								value={offEmployeeId}
								onChange={(e) => setOffEmployeeId(e.target.value ? Number(e.target.value) : "")}
								className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
								required
							>
								<option value="">-- Choose Employee --</option>
								{employeesList.map((emp: any) => (
									<option key={emp.id} value={emp.id}>
										{emp.name} ({emp.emp_code})
									</option>
								))}
							</select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs font-semibold">Date</Label>
							<Input
								type="date"
								value={offDate}
								onChange={(e) => setOffDate(e.target.value)}
								className="text-xs font-mono"
								required
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs font-semibold">Status / Type</Label>
							<select
								value={offStatus}
								onChange={(e) => setOffStatus(e.target.value as any)}
								className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
							>
								<option value="leave">Leave / Day Off</option>
								<option value="holiday">Official Holiday</option>
								<option value="absent">Mark Absent</option>
								<option value="week_off">Week Off</option>
							</select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs font-semibold">Reason / Remarks</Label>
							<textarea
								value={offReason}
								onChange={(e) => setOffReason(e.target.value)}
								placeholder="e.g. Festival Holiday, Medical leave, Approved day-off..."
								rows={3}
								className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
							/>
						</div>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsMarkOffOpen(false)}
								disabled={markOffMutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" size="sm" disabled={markOffMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
								{markOffMutation.isPending ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
									</>
								) : (
									"Save Record"
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal Preview for Live Selfie Image */}
			<Dialog
				open={!!selectedImage}
				onOpenChange={() => setSelectedImage(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-base">
							<CameraIcon className="h-5 w-5 text-blue-600" />
							{selectedImage?.title}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center justify-center p-2">
						{selectedImage && (
							<img
								src={selectedImage.url}
								alt="Live Attendance Selfie"
								className="max-h-[450px] w-auto rounded-xl border border-slate-200 object-contain shadow-md"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
