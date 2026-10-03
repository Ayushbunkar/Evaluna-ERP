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
	const [selectedMonth, setSelectedMonth] = useState(
		currentDate.getMonth() + 1,
	);

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
			toast.error(
				"Please provide a valid adjustment explanation (min 3 chars).",
			);
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
					<Badge className="border-0 bg-emerald-500 font-medium text-white hover:bg-emerald-600">
						Full Day
					</Badge>
				);
			case "HALF_DAY":
				return (
					<Badge className="border-0 bg-amber-500 font-medium text-white hover:bg-amber-600">
						Half Day
					</Badge>
				);
			case "LATE":
				return (
					<Badge className="border-0 bg-orange-500 font-medium text-white hover:bg-orange-600">
						Late Arrival
					</Badge>
				);
			case "EARLY_DEPARTURE":
				return (
					<Badge className="border-0 bg-indigo-500 font-medium text-white hover:bg-indigo-600">
						Early Exit
					</Badge>
				);
			case "LEAVE":
				return (
					<Badge className="border-0 bg-blue-500 font-medium text-white hover:bg-blue-600">
						Leave
					</Badge>
				);
			case "HOLIDAY":
				return (
					<Badge className="border-0 bg-purple-500 font-medium text-white hover:bg-purple-600">
						Holiday
					</Badge>
				);
			case "WEEKLY_OFF":
				return (
					<Badge
						variant="outline"
						className="border-slate-300 font-medium text-slate-600"
					>
						Weekly Off
					</Badge>
				);
			case "INCOMPLETE":
				return (
					<Badge className="border-0 bg-rose-500 font-medium text-white hover:bg-rose-600">
						Missing Out
					</Badge>
				);
			case "ABSENT":
				return (
					<Badge className="border-0 bg-red-500 font-medium text-white hover:bg-red-600">
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
		<PageTransition className="container mx-auto space-y-6 px-3 py-6 sm:px-6">
			{/* Top Page Header */}
			<div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<h1 className="flex items-center gap-2 font-bold text-2xl text-slate-900 tracking-tight dark:text-slate-100">
							<UserCheckIcon className="h-7 w-7 text-blue-600" />
							HR Attendance Management System
						</h1>
						<Badge
							variant="outline"
							className="border-blue-200 bg-blue-50 text-blue-700 text-xs"
						>
							Enterprise HR
						</Badge>
					</div>
					<p className="mt-1 text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Live roll, shift-based punctuality, canonical profile photos, system
						recovery adjustments, and audit trail.
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
						className="h-9 text-xs"
					>
						<RefreshCwIcon className="mr-1.5 h-3.5 w-3.5" /> Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsMarkOffOpen(true)}
						className="h-9 border-blue-200 text-blue-700 text-xs hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300"
					>
						<CalendarOffIcon className="mr-1.5 h-3.5 w-3.5" /> Mark Leave /
						Holiday
					</Button>
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
				<Card className="border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center justify-between">
						<span className="font-medium text-slate-500 text-xs">
							Total Staff
						</span>
						<UsersIcon className="h-4 w-4 text-slate-400" />
					</div>
					<div className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
						{summaryStats?.totalEmployees ?? employeesList.length}
					</div>
				</Card>

				<Card className="border-emerald-200 bg-emerald-50/60 p-3 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-emerald-700 text-xs dark:text-emerald-400">
							Present
						</span>
						<CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
					</div>
					<div className="mt-1 font-bold text-2xl text-emerald-700 dark:text-emerald-300">
						{summaryStats?.presentCount ?? 0}
					</div>
				</Card>

				<Card className="border-orange-200 bg-orange-50/60 p-3 shadow-xs dark:border-orange-900/40 dark:bg-orange-950/20">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-orange-700 text-xs dark:text-orange-400">
							Late Arrival
						</span>
						<ClockIcon className="h-4 w-4 text-orange-600" />
					</div>
					<div className="mt-1 font-bold text-2xl text-orange-700 dark:text-orange-300">
						{summaryStats?.lateCount ?? 0}
					</div>
				</Card>

				<Card className="border-amber-200 bg-amber-50/60 p-3 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-amber-700 text-xs dark:text-amber-400">
							Half Day
						</span>
						<AlertTriangleIcon className="h-4 w-4 text-amber-600" />
					</div>
					<div className="mt-1 font-bold text-2xl text-amber-700 dark:text-amber-300">
						{summaryStats?.halfDayCount ?? 0}
					</div>
				</Card>

				<Card className="border-red-200 bg-red-50/60 p-3 shadow-xs dark:border-red-900/40 dark:bg-red-950/20">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-red-700 text-xs dark:text-red-400">
							Absent
						</span>
						<XCircleIcon className="h-4 w-4 text-red-600" />
					</div>
					<div className="mt-1 font-bold text-2xl text-red-700 dark:text-red-300">
						{summaryStats?.absentCount ?? 0}
					</div>
				</Card>

				<Card className="border-blue-200 bg-blue-50/60 p-3 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-blue-700 text-xs dark:text-blue-400">
							On Leave
						</span>
						<CalendarIcon className="h-4 w-4 text-blue-600" />
					</div>
					<div className="mt-1 font-bold text-2xl text-blue-700 dark:text-blue-300">
						{summaryStats?.leaveCount ?? 0}
					</div>
				</Card>

				<Card className="border-purple-200 bg-purple-50/60 p-3 shadow-xs dark:border-purple-900/40 dark:bg-purple-950/20">
					<div className="flex items-center justify-between">
						<span className="font-semibold text-purple-700 text-xs dark:text-purple-400">
							Adjusted
						</span>
						<HistoryIcon className="h-4 w-4 text-purple-600" />
					</div>
					<div className="mt-1 font-bold text-2xl text-purple-700 dark:text-purple-300">
						{summaryStats?.adjustedCount ?? 0}
					</div>
				</Card>
			</div>

			{/* Main Interactive Tabs Navigation */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<div className="flex flex-col justify-between gap-3 rounded-lg border bg-slate-50 p-1.5 sm:flex-row sm:items-center dark:bg-slate-900/50">
					<TabsList className="border-0 bg-transparent">
						<TabsTrigger
							value="today"
							className="font-semibold text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs sm:text-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
						>
							<ClockIcon className="mr-1.5 h-4 w-4 text-blue-600" /> Today /
							Daily Roll
						</TabsTrigger>
						<TabsTrigger
							value="monthly"
							className="font-semibold text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs sm:text-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
						>
							<CalendarIcon className="mr-1.5 h-4 w-4 text-emerald-600" />{" "}
							Monthly Summary & Grid
						</TabsTrigger>
						<TabsTrigger
							value="adjustments"
							className="font-semibold text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs sm:text-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
						>
							<HistoryIcon className="mr-1.5 h-4 w-4 text-purple-600" />{" "}
							Adjustments & Recovery Queue
						</TabsTrigger>
						<TabsTrigger
							value="reports"
							className="font-semibold text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs sm:text-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-slate-100"
						>
							<DownloadIcon className="mr-1.5 h-4 w-4 text-indigo-600" />{" "}
							Reports & Export
						</TabsTrigger>
					</TabsList>

					{/* Date & Filter Toolbar */}
					<div className="flex flex-wrap items-center gap-2">
						{activeTab === "today" && (
							<>
								<div className="flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 shadow-2xs dark:bg-slate-800">
									<CalendarIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-300" />
									<input
										type="date"
										value={selectedDate}
										onChange={(e) => setSelectedDate(e.target.value)}
										className="w-[115px] min-w-0 cursor-pointer bg-transparent font-medium text-foreground text-xs focus:outline-hidden sm:w-[125px] dark:text-slate-100"
									/>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										setSelectedDate(new Date().toISOString().split("T")[0])
									}
									className="h-7 text-xs"
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
									className="rounded-md border bg-white px-2 py-1 font-semibold text-xs dark:bg-slate-800"
								>
									{[
										"January",
										"February",
										"March",
										"April",
										"May",
										"June",
										"July",
										"August",
										"September",
										"October",
										"November",
										"December",
									].map((m, idx) => (
										<option key={m} value={idx + 1}>
											{m}
										</option>
									))}
								</select>
								<select
									value={selectedYear}
									onChange={(e) => setSelectedYear(Number(e.target.value))}
									className="rounded-md border bg-white px-2 py-1 font-semibold text-xs dark:bg-slate-800"
								>
									{[2025, 2026, 2027].map((yr) => (
										<option key={yr} value={yr}>
											{yr}
										</option>
									))}
								</select>
							</div>
						)}
					</div>
				</div>

				{/* ══════════════════════════════════════════════════════════════════════ */}
				{/* TAB 1: TODAY / DAILY ATTENDANCE ROLL */}
				{/* ══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="today" className="m-0 space-y-4">
					{/* Search & Department Filters Bar */}
					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div className="flex flex-1 flex-wrap items-center gap-2">
							<div className="relative w-full sm:w-64">
								<SearchIcon className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-400" />
								<Input
									placeholder="Search name, code, email..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-9 pl-8 text-xs"
								/>
							</div>

							<select
								value={selectedDepartment}
								onChange={(e) => setSelectedDepartment(e.target.value)}
								className="h-9 rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-200"
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
								className="h-9 rounded-md border border-slate-200 bg-white px-3 font-medium text-slate-700 text-xs dark:bg-slate-800 dark:text-slate-200"
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
							className="h-9 shrink-0 text-xs"
						>
							<DownloadIcon className="mr-1.5 h-3.5 w-3.5 text-blue-600" />{" "}
							Export Roll CSV
						</Button>
					</div>

					{/* Attendance Table */}
					<Card className="overflow-hidden shadow-xs">
						{isRecordsLoading ? (
							<div className="flex flex-col items-center justify-center gap-2 py-16">
								<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
								<span className="font-medium text-slate-500 text-xs">
									Loading attendance records...
								</span>
							</div>
						) : attendanceRecords.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
								<AlertCircleIcon className="h-8 w-8 text-slate-300" />
								<span className="font-medium text-xs sm:text-sm">
									No attendance records found for this date & filters.
								</span>
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
											<TableRow
												key={rec.staffId || rec.id}
												className="hover:bg-slate-50/50"
											>
												{/* Canonical Photo column (no duplicate storage!) */}
												<TableCell className="py-2.5 text-center">
													{rec.photoUrl ? (
														<img
															src={rec.photoUrl}
															alt={rec.name}
															className="mx-auto h-10 w-10 rounded-full object-cover shadow-2xs ring-2 ring-blue-500/20"
															loading="lazy"
														/>
													) : (
														<div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 font-bold text-white text-xs shadow-2xs">
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
														<p className="font-semibold text-slate-900 text-sm dark:text-slate-100">
															{rec.name}
														</p>
														<div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
															<span className="font-medium font-mono text-blue-600 dark:text-blue-400">
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
														<span className="block font-medium text-slate-800 dark:text-slate-200">
															{rec.shiftName || "General Shift"}
														</span>
														<span className="font-mono text-[11px] text-slate-500">
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
																		url:
																			rec.checkInSelfieUrl ||
																			`/api/attendance/attachments/${rec.selfieAttachmentId}`,
																		title: `Check-In Selfie — ${rec.name} (${rec.checkInFormatted || ""})`,
																	})
																}
																className="group relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-emerald-500 bg-emerald-50 shadow-xs hover:ring-2 hover:ring-emerald-600"
																title="Click to view Check-In Selfie"
															>
																<img
																	src={
																		rec.checkInSelfieUrl ||
																		`/api/attendance/attachments/${rec.selfieAttachmentId}`
																	}
																	alt={`Check-in selfie of ${rec.name}`}
																	className="h-full w-full object-cover"
																	loading="lazy"
																	onError={(e) => {
																		const target = e.currentTarget;
																		if (
																			!target.dataset.retried &&
																			rec.selfieAttachmentId
																		) {
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

														<div className="font-mono text-xs">
															{rec.checkInFormatted ? (
																<div className="flex flex-col">
																	<span className="font-semibold text-emerald-600">
																		{rec.checkInFormatted}
																	</span>
																	{rec.isLate && (
																		<Badge
																			variant="outline"
																			className="mt-0.5 w-fit border-orange-200 bg-orange-50 px-1 py-0 text-[10px] text-orange-700"
																		>
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
														{rec.checkOutSelfieUrl ||
														rec.checkOutSelfieAttachmentId ? (
															<button
																type="button"
																onClick={() =>
																	setSelectedImage({
																		url:
																			rec.checkOutSelfieUrl ||
																			`/api/attendance/attachments/${rec.checkOutSelfieAttachmentId}`,
																		title: `Check-Out Selfie — ${rec.name} (${rec.checkOutFormatted || ""})`,
																	})
																}
																className="group relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-orange-500 bg-orange-50 shadow-xs hover:ring-2 hover:ring-orange-600"
																title="Click to view Check-Out Selfie"
															>
																<img
																	src={
																		rec.checkOutSelfieUrl ||
																		`/api/attendance/attachments/${rec.checkOutSelfieAttachmentId}`
																	}
																	alt={`Check-out selfie of ${rec.name}`}
																	className="h-full w-full object-cover"
																	loading="lazy"
																	onError={(e) => {
																		const target = e.currentTarget;
																		if (
																			!target.dataset.retried &&
																			rec.checkOutSelfieAttachmentId
																		) {
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

														<div className="font-mono text-xs">
															{rec.checkOutFormatted ? (
																<div className="flex flex-col">
																	<span className="font-semibold text-slate-800 dark:text-slate-200">
																		{rec.checkOutFormatted}
																	</span>
																	{rec.isEarlyDeparture && (
																		<Badge
																			variant="outline"
																			className="mt-0.5 w-fit border-indigo-200 bg-indigo-50 px-1 py-0 text-[10px] text-indigo-700"
																		>
																			-{rec.earlyDepartureMinutes}m Early
																		</Badge>
																	)}
																</div>
															) : rec.checkIn ? (
																<Badge
																	variant="outline"
																	className="border-rose-200 bg-rose-50 px-1.5 py-0 font-sans text-[10px] text-rose-700"
																>
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
													<span className="font-medium font-mono text-blue-700 text-xs dark:text-blue-300">
														{rec.workingHoursFormatted || "0h"}
													</span>
												</TableCell>

												{/* Status */}
												<TableCell>{renderStatusBadge(rec.status)}</TableCell>

												{/* Adjustment Badge & Indicator */}
												<TableCell>
													{rec.isAdjusted ? (
														<div>
															<Badge
																variant="outline"
																className="flex w-fit items-center gap-1 border-purple-300 bg-purple-50 text-[10px] text-purple-700"
															>
																<ShieldCheckIcon className="h-3 w-3 text-purple-600" />{" "}
																Adjusted
															</Badge>
															<p
																className="mt-1 max-w-[140px] truncate text-[10px] text-slate-500"
																title={rec.adjustmentReason}
															>
																{rec.adjustmentReason || rec.adjustmentCategory}
															</p>
														</div>
													) : (
														<span className="text-slate-400 text-xs">
															Standard
														</span>
													)}
												</TableCell>

												{/* Actions */}
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1.5">
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleOpenAdjust(rec)}
															className="h-7 border-blue-200 px-2 text-blue-700 text-xs hover:bg-blue-50"
															title="Adjust Attendance"
														>
															<Edit3Icon className="mr-1 h-3.5 w-3.5 text-blue-600" />{" "}
															Adjust
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenDetail(rec)}
															className="h-7 px-2 text-slate-600 text-xs hover:text-slate-900"
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
				<TabsContent value="monthly" className="m-0 space-y-4">
					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
								Monthly Attendance Roll —{" "}
								{new Date(selectedYear, selectedMonth - 1).toLocaleString(
									"default",
									{ month: "long", year: "numeric" },
								)}
							</h3>
							<p className="text-slate-500 text-xs">
								Employee-by-employee aggregate metrics and day-by-day status
								matrix.
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
								className="h-9 text-xs"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />{" "}
								Export Month CSV
							</Button>
						)}
					</div>

					{isMonthlyLoading ? (
						<div className="flex flex-col items-center justify-center gap-2 py-16">
							<Loader2Icon className="h-8 w-8 animate-spin text-emerald-600" />
							<span className="font-medium text-slate-500 text-xs">
								Generating monthly matrix...
							</span>
						</div>
					) : (
						<Card className="overflow-hidden shadow-xs">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
											<TableHead className="w-12 text-center">Photo</TableHead>
											<TableHead className="min-w-[160px]">Employee</TableHead>
											<TableHead className="text-center font-bold text-emerald-700">
												Present (P)
											</TableHead>
											<TableHead className="text-center font-bold text-amber-700">
												Half Day (HD)
											</TableHead>
											<TableHead className="text-center font-bold text-orange-700">
												Late (L)
											</TableHead>
											<TableHead className="text-center font-bold text-red-700">
												Absent (A)
											</TableHead>
											<TableHead className="text-center font-bold text-blue-700">
												Leave (LV)
											</TableHead>
											<TableHead className="text-center font-bold text-purple-700">
												Adjusted
											</TableHead>
											<TableHead className="text-center font-bold text-slate-800">
												Total Hours
											</TableHead>
											<TableHead className="min-w-[320px]">
												Monthly Day-by-Day Matrix (1..{monthlyData?.daysInMonth}
												)
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{monthlyData?.employeeSummaries.map((emp: any) => (
											<TableRow
												key={emp.staffId}
												className="hover:bg-slate-50/50"
											>
												<TableCell className="py-2 text-center">
													{emp.photoUrl ? (
														<img
															src={emp.photoUrl}
															alt={emp.name}
															className="mx-auto h-8 w-8 rounded-full object-cover"
														/>
													) : (
														<div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 font-bold text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
															{emp.name?.[0] || "E"}
														</div>
													)}
												</TableCell>
												<TableCell>
													<div>
														<p className="font-semibold text-slate-900 text-xs dark:text-slate-100">
															{emp.name}
														</p>
														<p className="font-mono text-[10px] text-slate-500">
															{emp.code}
														</p>
													</div>
												</TableCell>
												<TableCell className="text-center font-bold font-mono text-emerald-600 text-xs">
													{emp.presentDays}
												</TableCell>
												<TableCell className="text-center font-bold font-mono text-amber-600 text-xs">
													{emp.halfDays}
												</TableCell>
												<TableCell className="text-center font-bold font-mono text-orange-600 text-xs">
													{emp.lateDays}
												</TableCell>
												<TableCell className="text-center font-bold font-mono text-red-600 text-xs">
													{emp.absentDays}
												</TableCell>
												<TableCell className="text-center font-bold font-mono text-blue-600 text-xs">
													{emp.leaveDays}
												</TableCell>
												<TableCell className="text-center font-bold font-mono text-purple-600 text-xs">
													{emp.adjustedDays}
												</TableCell>
												<TableCell className="text-center font-mono font-semibold text-xs">
													{emp.totalWorkingHoursFormatted}
												</TableCell>

												{/* Mini Day 1..31 Status Matrix */}
												<TableCell>
													<div className="flex max-w-[420px] flex-wrap gap-1">
														{emp.dailyMatrix?.map((dm: any) => (
															<span
																key={dm.day}
																title={`Day ${dm.day} (${dm.date}): ${dm.statusLabel}${dm.isAdjusted ? " (Adjusted)" : ""}`}
																className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-xs font-bold font-mono text-[9px] transition-transform hover:scale-125 ${
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
				<TabsContent value="adjustments" className="m-0 space-y-4">
					<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
								Attendance Adjustments & System Recovery Queue
							</h3>
							<p className="text-slate-500 text-xs">
								Immutable log of all punch adjustments, reasons,
								biometric/system failure recovery, and original values.
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
								className="h-9 text-xs"
							>
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5 text-purple-600" />{" "}
								Export Audit CSV
							</Button>
						)}
					</div>

					<Card className="overflow-hidden shadow-xs">
						{isAdjustmentsLoading ? (
							<div className="flex flex-col items-center justify-center gap-2 py-16">
								<Loader2Icon className="h-8 w-8 animate-spin text-purple-600" />
								<span className="font-medium text-slate-500 text-xs">
									Loading adjustments audit trail...
								</span>
							</div>
						) : !adjustmentsReport?.rows ||
							adjustmentsReport.rows.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
								<ShieldCheckIcon className="h-8 w-8 text-emerald-500" />
								<span className="font-medium text-xs sm:text-sm">
									No manual adjustments or system recoveries recorded yet.
								</span>
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
														<p className="font-semibold text-slate-900 text-xs dark:text-slate-100">
															{row.name}
														</p>
														<p className="font-mono text-[10px] text-slate-500">
															{row.code} ({row.department})
														</p>
													</div>
												</TableCell>
												<TableCell className="font-medium font-mono text-xs">
													{row.date}
												</TableCell>
												<TableCell className="font-mono text-slate-500 text-xs">
													<div>In: {row.originalCheckIn || "Missing"}</div>
													<div>Out: {row.originalCheckOut || "Missing"}</div>
												</TableCell>
												<TableCell className="font-bold font-mono text-emerald-700 text-xs dark:text-emerald-400">
													<div>In: {row.adjustedCheckIn || "None"}</div>
													<div>Out: {row.adjustedCheckOut || "None"}</div>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className="border-purple-200 bg-purple-50 text-[10px] text-purple-700 capitalize"
													>
														{row.category?.replace(/_/g, " ")}
													</Badge>
												</TableCell>
												<TableCell className="max-w-[250px] text-slate-700 text-xs dark:text-slate-300">
													<span className="font-medium">{row.reason}</span>
												</TableCell>
												<TableCell className="font-mono text-slate-500 text-xs">
													{row.adjustedAt}
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
				{/* TAB 4: REPORTS & EXPORT */}
				{/* ══════════════════════════════════════════════════════════════════════ */}
				<TabsContent value="reports" className="m-0 space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{/* Daily Report Card */}
						<Card className="flex flex-col justify-between border-slate-200 p-4 shadow-xs">
							<div>
								<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
									<ClockIcon className="h-5 w-5" />
								</div>
								<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
									Daily Attendance Register
								</h4>
								<p className="mt-1 text-slate-500 text-xs">
									Complete roll of check-in, check-out, working hours, and
									punctuality flags for date {selectedDate}.
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
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Download Daily
								CSV
							</Button>
						</Card>

						{/* Exceptions Card */}
						<Card className="flex flex-col justify-between border-slate-200 p-4 shadow-xs">
							<div>
								<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
									<AlertCircleIcon className="h-5 w-5" />
								</div>
								<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
									Missing Check-Out Exceptions
								</h4>
								<p className="mt-1 text-slate-500 text-xs">
									Audit report of all employees who punched in but missed
									checkout.
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
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Download
								Exceptions CSV
							</Button>
						</Card>

						{/* Adjustments Audit Card */}
						<Card className="flex flex-col justify-between border-slate-200 p-4 shadow-xs">
							<div>
								<div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
									<HistoryIcon className="h-5 w-5" />
								</div>
								<h4 className="font-bold text-slate-900 text-sm dark:text-slate-100">
									Adjustments & Recovery Audit
								</h4>
								<p className="mt-1 text-slate-500 text-xs">
									Complete trail of manual adjustments, reasons, before/after
									values, and managers who adjusted.
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
								<DownloadIcon className="mr-1.5 h-3.5 w-3.5" /> Download Audit
								CSV
							</Button>
						</Card>
					</div>
				</TabsContent>
			</Tabs>

			{/* ══════════════════════════════════════════════════════════════════════ */}
			{/* MODAL 1: ADJUST ATTENDANCE & SYSTEM RECOVERY */}
			{/* ══════════════════════════════════════════════════════════════════════ */}
			<Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
				<DialogContent className="bg-white sm:max-w-[500px] dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
							<Edit3Icon className="h-5 w-5 text-blue-600" />
							Adjust Attendance & Recovery
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-xs">
							Adjust punch-in, punch-out, or status due to biometric failure,
							network down, or forgot punch.
						</DialogDescription>
					</DialogHeader>

					{adjustTarget && (
						<form onSubmit={handleSubmitAdjust} className="space-y-4 pt-2">
							{/* Employee Banner with Canonical Photo */}
							<div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-800/60">
								{adjustTarget.photoUrl ? (
									<img
										src={adjustTarget.photoUrl}
										alt={adjustTarget.name}
										className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-500/20"
									/>
								) : (
									<div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-sm text-white">
										{adjustTarget.name?.[0] || "E"}
									</div>
								)}
								<div className="min-w-0 flex-1">
									<h4 className="truncate font-bold text-slate-900 text-sm dark:text-slate-100">
										{adjustTarget.name}
									</h4>
									<div className="flex items-center gap-2 text-slate-500 text-xs">
										<span className="font-mono font-semibold text-blue-600">
											{adjustTarget.employeeCode}
										</span>
										<span>•</span>
										<span>{adjustTarget.department}</span>
									</div>
								</div>
								<Badge variant="outline" className="text-xs">
									{selectedDate}
								</Badge>
							</div>

							{/* Original Raw Punches Info Banner */}
							<div className="rounded-md border border-blue-200 bg-blue-50/70 p-2.5 text-blue-950 text-xs dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
								<span className="mb-0.5 block font-semibold">
									Original System Punches (Preserved):
								</span>
								<span className="font-mono text-[11px]">
									Check-in:{" "}
									{adjustTarget.originalCheckInFormatted ||
										adjustTarget.checkInFormatted ||
										"None"}{" "}
									| Check-out:{" "}
									{adjustTarget.originalCheckOutFormatted ||
										adjustTarget.checkOutFormatted ||
										"None"}
								</span>
							</div>

							{/* Check In / Check Out Inputs */}
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<Label className="font-semibold text-xs">
										Adjusted Check-In (HH:MM)
									</Label>
									<Input
										type="time"
										value={adjustCheckIn}
										onChange={(e) => setAdjustCheckIn(e.target.value)}
										className="font-mono text-xs"
									/>
								</div>
								<div className="space-y-1">
									<Label className="font-semibold text-xs">
										Adjusted Check-Out (HH:MM)
									</Label>
									<Input
										type="time"
										value={adjustCheckOut}
										onChange={(e) => setAdjustCheckOut(e.target.value)}
										className="font-mono text-xs"
									/>
								</div>
							</div>

							{/* Status Override */}
							<div className="space-y-1">
								<Label className="font-semibold text-xs">Status Override</Label>
								<select
									value={adjustStatus}
									onChange={(e) => setAdjustStatus(e.target.value)}
									className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-medium text-xs focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900"
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
								<Label className="flex items-center gap-1 font-semibold text-xs">
									Mandatory Reason Category{" "}
									<span className="text-red-500">*</span>
								</Label>
								<select
									value={adjustCategory}
									onChange={(e) => setAdjustCategory(e.target.value)}
									className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
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
								<Label className="flex items-center gap-1 font-semibold text-xs">
									Detailed Explanation / Manager Remarks{" "}
									<span className="text-red-500">*</span>
								</Label>
								<textarea
									value={adjustReason}
									onChange={(e) => setAdjustReason(e.target.value)}
									placeholder="Explain reason for manual adjustment (e.g. Biometric scanner lost power from 9am to 10am; verified on CCTV)..."
									rows={3}
									className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900"
									required
								/>
							</div>

							<div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 text-[11px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
								<InfoIcon className="h-4 w-4 shrink-0 text-amber-600" />
								<span>
									Changes will be logged in the immutable audit log with your
									account email and timestamp.
								</span>
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
									className="bg-blue-600 text-white hover:bg-blue-700"
								>
									{adjustMutation.isPending ? (
										<>
											<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
											Saving...
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
				<DialogContent className="bg-white sm:max-w-[550px] dark:bg-slate-900">
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
							<div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3 dark:bg-slate-800/60">
								{recordDetail?.staff?.photoUrl ? (
									<img
										src={recordDetail.staff.photoUrl}
										alt={recordDetail.staff.name}
										className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/20"
									/>
								) : (
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-bold text-sm text-white">
										{recordDetail?.staff?.name?.[0] || "E"}
									</div>
								)}
								<div className="flex-1">
									<h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
										{recordDetail?.staff?.name}
									</h4>
									<div className="flex items-center gap-2 text-slate-500 text-xs">
										<span className="font-mono font-semibold text-blue-600">
											{recordDetail?.staff?.code}
										</span>
										<span>•</span>
										<span>{recordDetail?.staff?.department}</span>
										<span>•</span>
										<span>{recordDetail?.staff?.role}</span>
									</div>
								</div>
							</div>

							{/* Timings & Punctuality Breakdown */}
							<div className="grid grid-cols-2 gap-3 rounded-md border bg-white p-3 text-xs dark:bg-slate-900">
								<div>
									<span className="block text-slate-400">Check-In Time:</span>
									<span className="font-bold font-mono text-emerald-600 text-sm">
										{recordDetail?.attendance?.checkIn || "Not Recorded"}
									</span>
									{Boolean(
										recordDetail?.attendance?.lateMinutes &&
											recordDetail.attendance.lateMinutes > 0,
									) && (
										<span className="mt-0.5 block font-medium text-[11px] text-orange-600">
											Late by {recordDetail?.attendance?.lateMinutes} minutes
										</span>
									)}
								</div>
								<div>
									<span className="block text-slate-400">Check-Out Time:</span>
									<span className="font-bold font-mono text-slate-900 text-sm dark:text-slate-100">
										{recordDetail?.attendance?.checkOut || "Not Recorded"}
									</span>
									{Boolean(
										recordDetail?.attendance?.earlyExitMinutes &&
											recordDetail.attendance.earlyExitMinutes > 0,
									) && (
										<span className="mt-0.5 block font-medium text-[11px] text-indigo-600">
											Early departure by{" "}
											{recordDetail?.attendance?.earlyExitMinutes} minutes
										</span>
									)}
								</div>
								<div>
									<span className="block text-slate-400">Working Hours:</span>
									<span className="font-bold font-mono text-blue-600 text-sm">
										{recordDetail?.attendance?.workingHours
											? `${recordDetail.attendance.workingHours} hrs`
											: "0 hrs"}
									</span>
								</div>
								<div>
									<span className="block text-slate-400">Status:</span>
									<div className="mt-1">
										{renderStatusBadge(
											recordDetail?.attendance?.status || "absent",
										)}
									</div>
								</div>
							</div>

							{/* Notes & Location */}
							{recordDetail?.attendance?.notes && (
								<div className="rounded-md border bg-slate-50 p-2.5 text-slate-700 text-xs dark:bg-slate-800/40 dark:text-slate-300">
									<span className="mb-0.5 block font-semibold">
										Location & Notes:
									</span>
									<span>{recordDetail.attendance.notes}</span>
								</div>
							)}

							{/* Audit Trail History */}
							{recordDetail?.auditTrail &&
								recordDetail.auditTrail.length > 0 && (
									<div className="space-y-1.5">
										<h5 className="flex items-center gap-1 font-bold text-slate-900 text-xs dark:text-slate-100">
											<HistoryIcon className="h-3.5 w-3.5 text-purple-600" />
											Adjustment History & Audit Trail
										</h5>
										<div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
											{recordDetail.auditTrail.map((log: any) => (
												<div
													key={log.id}
													className="rounded-sm border border-purple-200 bg-purple-50/40 p-2 text-[11px] dark:border-purple-900 dark:bg-purple-950/20"
												>
													<div className="flex justify-between font-semibold text-purple-950 dark:text-purple-200">
														<span>{log.action}</span>
														<span className="font-mono text-[10px] text-slate-500">
															{new Date(log.created_at).toLocaleString()}
														</span>
													</div>
													{log.new_values?.reason && (
														<p className="mt-0.5 text-slate-600 dark:text-slate-300">
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
						<DialogTitle className="flex items-center gap-2 font-bold text-lg">
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
							<Label className="font-semibold text-xs">Select Employee</Label>
							<select
								value={offEmployeeId}
								onChange={(e) =>
									setOffEmployeeId(e.target.value ? Number(e.target.value) : "")
								}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
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
							<Label className="font-semibold text-xs">Date</Label>
							<Input
								type="date"
								value={offDate}
								onChange={(e) => setOffDate(e.target.value)}
								className="font-mono text-xs"
								required
							/>
						</div>

						<div className="space-y-1">
							<Label className="font-semibold text-xs">Status / Type</Label>
							<select
								value={offStatus}
								onChange={(e) => setOffStatus(e.target.value as any)}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
							>
								<option value="leave">Leave / Day Off</option>
								<option value="holiday">Official Holiday</option>
								<option value="absent">Mark Absent</option>
								<option value="week_off">Week Off</option>
							</select>
						</div>

						<div className="space-y-1">
							<Label className="font-semibold text-xs">Reason / Remarks</Label>
							<textarea
								value={offReason}
								onChange={(e) => setOffReason(e.target.value)}
								placeholder="e.g. Festival Holiday, Medical leave, Approved day-off..."
								rows={3}
								className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900"
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
							<Button
								type="submit"
								size="sm"
								disabled={markOffMutation.isPending}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{markOffMutation.isPending ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
										Saving...
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
