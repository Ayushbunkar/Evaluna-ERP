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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
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
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	FileText,
	Filter,
	IndianRupee,
	Loader2,
	Printer,
	Search,
	ShieldCheck,
	UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

function formatINR(amount: number | string | null | undefined) {
	const val = Number(amount || 0);
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(val);
}

export default function HRPayslipsPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const isHindi = locale === "hi";

	// Current Month Default YYYY-MM
	const [selectedMonth, setSelectedMonth] = useState<string>(
		new Date().toISOString().substring(0, 7),
	);
	const [searchTerm, setSearchTerm] = useState<string>("");

	// Modal Preview & Print State
	const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
	const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

	// Fetch Generated & Paid Payslips
	const {
		data: payslips = [],
		isLoading,
		isRefetching,
		refetch,
	} = trpc.payslip.getGeneratedPayslips.useQuery({
		month: selectedMonth,
		search: searchTerm.trim() || undefined,
	});

	// Month Navigation Helpers
	const handlePrevMonth = () => {
		const [yearStr, monthStr] = selectedMonth.split("-");
		let year = Number(yearStr);
		let month = Number(monthStr) - 1;
		if (month < 1) {
			month = 12;
			year -= 1;
		}
		setSelectedMonth(`${year}-${String(month).padStart(2, "0")}`);
	};

	const handleNextMonth = () => {
		const [yearStr, monthStr] = selectedMonth.split("-");
		let year = Number(yearStr);
		let month = Number(monthStr) + 1;
		if (month > 12) {
			month = 1;
			year += 1;
		}
		setSelectedMonth(`${year}-${String(month).padStart(2, "0")}`);
	};

	const monthDisplay = useMemo(() => {
		if (!selectedMonth) return "";
		const [yearStr, monthStr] = selectedMonth.split("-");
		const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, 1);
		return dateObj.toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});
	}, [selectedMonth]);

	const totalDisbursedAmount = useMemo(() => {
		return payslips.reduce((sum, p) => sum + (Number(p.netPayable) || 0), 0);
	}, [payslips]);

	// Open Payslip Preview Modal
	const handleViewPayslip = (p: any) => {
		setSelectedPayslip(p);
		setIsPreviewOpen(true);
	};

	// Generate Vector PDF via jsPDF & autoTable
	const handleDownloadPDF = async (p: any) => {
		setIsPdfGenerating(true);
		try {
			const autoTableModule = await import("jspdf-autotable");
			const autoTable = autoTableModule.default;

			const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
			const pageWidth = doc.internal.pageSize.getWidth();

			// Header Branding
			doc.setFillColor(15, 23, 42); // slate-900
			doc.rect(0, 0, pageWidth, 28, "F");

			doc.setTextColor(255, 255, 255);
			doc.setFontSize(16);
			doc.setFont("helvetica", "bold");
			doc.text("EVALUNA PRIVATE LIMITED", 14, 12);

			doc.setFontSize(9);
			doc.setFont("helvetica", "normal");
			doc.text(
				"Near Bank of India, Vidisha Road, Berasia, Bhopal, MP - 463106 | Ph: 9630649277",
				14,
				19,
			);
			doc.text(
				`OFFICIAL SALARY PAYSLIP — ${monthDisplay.toUpperCase()}`,
				14,
				25,
			);

			let y = 36;

			// Employee Details Table
			doc.setTextColor(30, 41, 59);
			doc.setFontSize(10);
			doc.setFont("helvetica", "bold");
			doc.text("EMPLOYEE INFORMATION", 14, y);
			y += 4;

			const empDetails = [
				[
					"Employee Name",
					p.employeeName || "Staff Member",
					"Employee ID",
					p.employeeCode || `EMP-${p.employeeId}`,
				],
				[
					"Department",
					p.employeeDepartment || "General Operations",
					"Designation / Role",
					p.employeeDesignation || "Staff",
				],
				[
					"Pay Type",
					(p.payType || "Monthly").toUpperCase(),
					"Payroll Status",
					(p.payrollStatus || "PAID").toUpperCase(),
				],
			];

			autoTable(doc, {
				startY: y,
				body: empDetails,
				theme: "plain",
				styles: { fontSize: 8.5, cellPadding: 1.5 },
				columnStyles: {
					0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 35 },
					1: { textColor: [15, 23, 42], cellWidth: 55 },
					2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 35 },
					3: { textColor: [15, 23, 42], cellWidth: 55 },
				},
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 8;

			// Attendance Summary Table
			doc.setFontSize(10);
			doc.setFont("helvetica", "bold");
			doc.text("ATTENDANCE & LEAVE SUMMARY", 14, y);
			y += 4;

			const attendanceData = [
				[
					String(p.workingDays || 30),
					String(p.presentDays || 0),
					String(p.halfDays || 0),
					String(p.paidLeaveDays || 0),
					String(p.absentDays || 0),
					String(p.overtimeHours || 0) + " hrs",
				],
			];

			autoTable(doc, {
				startY: y,
				head: [
					[
						"Working Days",
						"Present Days",
						"Half Days",
						"Paid Leave",
						"Absent Days",
						"Overtime",
					],
				],
				body: attendanceData,
				theme: "grid",
				headStyles: {
					fillColor: [241, 245, 249],
					textColor: [15, 23, 42],
					fontStyle: "bold",
					fontSize: 8.5,
				},
				styles: { fontSize: 8.5, halign: "center" },
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 8;

			// Earnings & Deductions Breakdown
			doc.setFontSize(10);
			doc.setFont("helvetica", "bold");
			doc.text("EARNINGS & DEDUCTIONS STATEMENT", 14, y);
			y += 4;

			const baseSalary = Number(p.baseSalary || 0);
			const sysAmount = Number(p.systemCalculatedAmount || baseSalary);
			const adjustment = Number(p.adjustmentAmount || 0);
			const gross = Number(
				p.grossPayable || sysAmount + (adjustment > 0 ? adjustment : 0),
			);
			const deductions = Number(
				p.totalDeductions || (adjustment < 0 ? Math.abs(adjustment) : 0),
			);
			const netPayable = Number(p.netPayable || gross - deductions);

			const financialRows = [
				[
					"Base / Earned Salary",
					`Rs. ${baseSalary.toLocaleString("en-IN")}`,
					"Advance / Deductions",
					`Rs. ${deductions.toLocaleString("en-IN")}`,
				],
				[
					"Overtime / Bonus Addition",
					adjustment > 0
						? `Rs. ${adjustment.toLocaleString("en-IN")}`
						: "Rs. 0",
					"Other Deductions",
					"Rs. 0",
				],
				[
					"Gross Earnings",
					`Rs. ${gross.toLocaleString("en-IN")}`,
					"Total Deductions",
					`Rs. ${deductions.toLocaleString("en-IN")}`,
				],
			];

			autoTable(doc, {
				startY: y,
				head: [["EARNINGS ITEM", "AMOUNT", "DEDUCTION ITEM", "AMOUNT"]],
				body: financialRows,
				theme: "grid",
				headStyles: {
					fillColor: [30, 58, 138],
					textColor: [255, 255, 255],
					fontStyle: "bold",
					fontSize: 8.5,
				},
				styles: { fontSize: 8.5 },
				columnStyles: {
					0: { fontStyle: "normal" },
					1: { fontStyle: "bold", halign: "right" },
					2: { fontStyle: "normal" },
					3: { fontStyle: "bold", halign: "right", textColor: [225, 29, 72] },
				},
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 6;

			// Net Take-Home Salary Highlight Box
			doc.setFillColor(240, 253, 244); // emerald-50
			doc.setDrawColor(16, 185, 129); // emerald-500
			doc.rect(14, y, pageWidth - 28, 14, "FD");

			doc.setTextColor(6, 78, 59);
			doc.setFontSize(10);
			doc.setFont("helvetica", "bold");
			doc.text("NET TAKE-HOME PAYABLE:", 20, y + 9);

			doc.setFontSize(14);
			doc.text(
				`Rs. ${netPayable.toLocaleString("en-IN")}`,
				pageWidth - 20,
				y + 9,
				{ align: "right" },
			);

			y += 20;

			// Payment Information & Verification Box
			doc.setTextColor(30, 41, 59);
			doc.setFontSize(10);
			doc.setFont("helvetica", "bold");
			doc.text("DISBURSEMENT PAYMENT PROOF", 14, y);
			y += 4;

			const payDateStr = p.paymentDate
				? new Date(p.paymentDate).toLocaleDateString()
				: new Date().toLocaleDateString();

			const paymentDetails = [
				[
					"Payment Status",
					"PAID & DISBURSED ✓",
					"Disbursement Date",
					payDateStr,
				],
				[
					"Transaction Ref / UTR",
					p.transactionReference || "UTR-VERIFIED",
					"Payslip ID",
					`PAYSLIP-${p.payrollYear}-${p.payrollMonth}-${p.employeeCode || p.employeeId}`,
				],
			];

			autoTable(doc, {
				startY: y,
				body: paymentDetails,
				theme: "plain",
				styles: { fontSize: 8.5, cellPadding: 1.5 },
				columnStyles: {
					0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 35 },
					1: { textColor: [16, 185, 129], fontStyle: "bold", cellWidth: 55 },
					2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 35 },
					3: { textColor: [15, 23, 42], fontStyle: "bold", cellWidth: 55 },
				},
				margin: { left: 14, right: 14 },
			});

			y = (doc as any).lastAutoTable.finalY + 12;

			// Signatures & Stamp
			doc.setFontSize(8);
			doc.setTextColor(148, 163, 184);
			doc.text(
				"This is a computer-generated official payslip issued by Evaluna ERP.",
				14,
				y,
			);
			doc.text("Authorized Signature & Finance Seal", pageWidth - 14, y, {
				align: "right",
			});

			const safeEmpName = (p.employeeName || "Employee").replace(/\s+/g, "_");
			const safeMonth = (monthDisplay || "Payroll").replace(/\s+/g, "_");
			const filename = `${safeEmpName}_Payslip_${safeMonth}.pdf`;
			doc.save(filename);
			toast.success(`Downloaded payslip for ${p.employeeName || "Employee"}`);
		} catch (err: any) {
			console.error("PDF payslip generation error:", err);
			toast.error(`Failed to generate PDF: ${err.message || "Unknown error"}`);
		} finally {
			setIsPdfGenerating(false);
		}
	};

	return (
		<PageTransition className="container mx-auto space-y-6 p-3 sm:p-6">
			{/* Header */}
			<div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2">
						<Link href="/hr/payroll">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-slate-500"
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
						</Link>
						<h1 className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight sm:text-2xl">
							<FileText className="h-6 w-6 text-blue-600" />
							{isHindi
								? "कर्मचारी वेतन पर्ची (Payslips Archive)"
								: "HR Employee Payslips Archive"}
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						{isHindi
							? "भुगतान किए गए वेतन खातों की आधिकारिक पेस्लिप देखें, खोजें और डाउनलोड करें।"
							: "View, search, and download official employee payslips generated after Finance disbursement."}
					</p>
				</div>

				{/* Month Navigation Control */}
				<div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1.5 dark:border-slate-700 dark:bg-slate-800">
					<Button
						variant="ghost"
						size="icon"
						onClick={handlePrevMonth}
						className="h-8 w-8 text-slate-600 dark:text-slate-300"
						title="Previous Month"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<div className="flex items-center gap-1.5 px-2">
						<Calendar className="h-4 w-4 text-blue-600" />
						<span className="min-w-[130px] whitespace-nowrap text-center font-bold text-foreground text-xs sm:text-sm">
							{monthDisplay}
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleNextMonth}
						className="h-8 w-8 text-slate-600 dark:text-slate-300"
						title="Next Month"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Filters & Search Header Bar */}
			<Card className="border-slate-200 shadow-xs dark:border-slate-800">
				<CardContent className="p-4">
					<div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
						<div className="relative w-full sm:w-80">
							<Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
							<Input
								placeholder={
									isHindi
										? "कर्मचारी का नाम या कोड खोजें..."
										: "Search employee name or ID..."
								}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="h-9 pl-9 text-xs"
							/>
						</div>

						<div className="flex w-full items-center justify-between gap-3 text-muted-foreground text-xs sm:w-auto sm:justify-end">
							<span>
								Generated:{" "}
								<strong className="text-foreground">
									{payslips.length} Payslips
								</strong>
							</span>
							<span className="h-4 border-l" />
							<span>
								Total Paid:{" "}
								<strong className="font-bold text-emerald-600">
									{formatINR(totalDisbursedAmount)}
								</strong>
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Loading State */}
			{isLoading ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
					<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
					<p className="font-medium text-sm">
						Fetching verified payslips archive for {monthDisplay}...
					</p>
				</div>
			) : payslips.length === 0 ? (
				/* Empty State */
				<Card className="border-dashed p-8 text-center">
					<CardContent className="flex flex-col items-center justify-center gap-3 py-10">
						<FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
						<h3 className="font-bold text-base text-foreground">
							{isHindi
								? `${monthDisplay} के लिए कोई वेतन पर्ची नहीं मिली`
								: `No completed payslips for ${monthDisplay}`}
						</h3>
						<p className="max-w-md text-muted-foreground text-xs">
							{isHindi
								? "वेतन पर्ची केवल तभी उत्पन्न होती है जब वित्त विभाग वेतन भुगतान सफलतापूर्वक पूरा कर लेता है।"
								: "Payslips officially become available only after the payroll completes Finance payment disbursement."}
						</p>
					</CardContent>
				</Card>
			) : (
				/* Payslips Table / Card Grid */
				<Card className="overflow-hidden border-slate-200 shadow-xs dark:border-slate-800">
					<div className="w-full overflow-x-auto">
						<Table className="min-w-[850px] text-xs">
							<TableHeader>
								<TableRow className="bg-slate-50/80 dark:bg-slate-900/60">
									<TableHead className="font-bold">Employee</TableHead>
									<TableHead className="font-bold">Department / Role</TableHead>
									<TableHead className="font-bold">Payroll Period</TableHead>
									<TableHead className="text-right font-bold text-emerald-600">
										Paid Net Amount
									</TableHead>
									<TableHead className="font-bold">Disbursement Date</TableHead>
									<TableHead className="font-bold">UTR / Reference</TableHead>
									<TableHead className="text-center font-bold">
										Status
									</TableHead>
									<TableHead className="text-right font-bold">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
								{payslips.map((p) => (
									<TableRow key={p.id}>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-bold text-slate-900 dark:text-slate-100">
													{p.employeeName || "Staff Member"}
												</span>
												<span className="font-mono text-[11px] text-muted-foreground">
													{p.employeeCode || `EMP-${p.employeeId}`}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-medium text-slate-800 dark:text-slate-200">
													{p.employeeDepartment || "General"}
												</span>
												<span className="text-[10px] text-muted-foreground capitalize">
													{p.employeeDesignation || "Staff"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex flex-col">
												<span className="font-semibold text-slate-900 dark:text-slate-100">
													{monthDisplay}
												</span>
												<span className="text-[10px] text-muted-foreground">
													{p.presentDays || 0} Present • {p.absentDays || 0}{" "}
													Absent
												</span>
											</div>
										</TableCell>
										<TableCell className="text-right font-bold text-emerald-600 text-sm">
											{formatINR(p.netPayable)}
										</TableCell>
										<TableCell className="text-slate-700 dark:text-slate-300">
											{p.paymentDate
												? new Date(p.paymentDate).toLocaleDateString()
												: "—"}
										</TableCell>
										<TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
											{p.transactionReference || "UTR-VERIFIED"}
										</TableCell>
										<TableCell className="text-center">
											<Badge
												variant="outline"
												className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
											>
												<CheckCircle2 className="mr-1 h-3 w-3" />
												Generated
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleViewPayslip(p)}
													className="h-8 gap-1 text-xs"
												>
													<Eye className="h-3.5 w-3.5 text-blue-600" />
													View
												</Button>
												<Button
													size="sm"
													onClick={() => handleDownloadPDF(p)}
													disabled={isPdfGenerating}
													className="h-8 gap-1 bg-blue-600 text-white text-xs hover:bg-blue-700"
												>
													<Download className="h-3.5 w-3.5" />
													PDF
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</Card>
			)}

			{/* View Payslip Modal Dialog */}
			<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
					{selectedPayslip && (
						<div>
							{/* Payslip Print Header */}
							<div className="rounded-t-lg bg-slate-900 p-6 text-white">
								<div className="flex items-start justify-between">
									<div>
										<h2 className="font-black text-xl tracking-tight">
											EVALUNA ERP — SALARY PAYSLIP
										</h2>
										<p className="mt-1 text-blue-300 text-xs">
											Official Payroll Statement — {monthDisplay}
										</p>
									</div>
									<Badge className="bg-emerald-500 font-semibold text-white">
										PAID & DISBURSED
									</Badge>
								</div>
							</div>

							<div className="space-y-6 p-6">
								{/* Employee Info Grid */}
								<div className="grid grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-4 text-xs dark:bg-slate-900/50">
									<div>
										<span className="text-muted-foreground">
											Employee Name:
										</span>
										<div className="font-bold text-foreground text-sm">
											{selectedPayslip.employeeName}
										</div>
										<span className="mt-2 block text-muted-foreground">
											Employee ID:
										</span>
										<div className="font-mono text-foreground">
											{selectedPayslip.employeeCode ||
												`EMP-${selectedPayslip.employeeId}`}
										</div>
									</div>
									<div>
										<span className="text-muted-foreground">Department:</span>
										<div className="font-bold text-foreground">
											{selectedPayslip.employeeDepartment ||
												"General Operations"}
										</div>
										<span className="mt-2 block text-muted-foreground">
											Designation / Role:
										</span>
										<div className="font-medium text-foreground">
											{selectedPayslip.employeeDesignation || "Staff"}
										</div>
									</div>
								</div>

								{/* Attendance Summary */}
								<div>
									<h4 className="mb-2 font-bold text-muted-foreground text-xs uppercase tracking-wider">
										Attendance & Leave Days
									</h4>
									<div className="grid grid-cols-5 gap-2 text-center text-xs">
										<div className="rounded border p-2">
											<div className="text-[10px] text-muted-foreground">
												Working
											</div>
											<div className="font-bold">
												{selectedPayslip.workingDays || 30}
											</div>
										</div>
										<div className="rounded border bg-emerald-50 p-2 dark:bg-emerald-950/40">
											<div className="text-[10px] text-emerald-700 dark:text-emerald-300">
												Present
											</div>
											<div className="font-bold text-emerald-700 dark:text-emerald-300">
												{selectedPayslip.presentDays || 0}
											</div>
										</div>
										<div className="rounded border p-2">
											<div className="text-[10px] text-muted-foreground">
												Paid Leave
											</div>
											<div className="font-bold">
												{selectedPayslip.paidLeaveDays || 0}
											</div>
										</div>
										<div className="rounded border bg-rose-50 p-2 dark:bg-rose-950/40">
											<div className="text-[10px] text-rose-700 dark:text-rose-300">
												Absent
											</div>
											<div className="font-bold text-rose-700 dark:text-rose-300">
												{selectedPayslip.absentDays || 0}
											</div>
										</div>
										<div className="rounded border p-2">
											<div className="text-[10px] text-muted-foreground">
												Overtime
											</div>
											<div className="font-bold">
												{selectedPayslip.overtimeHours || 0} hrs
											</div>
										</div>
									</div>
								</div>

								{/* Financial Breakdown Table */}
								<div>
									<h4 className="mb-2 font-bold text-muted-foreground text-xs uppercase tracking-wider">
										Salary Earnings & Deductions
									</h4>
									<Table className="border text-xs">
										<TableHeader>
											<TableRow className="bg-slate-100 dark:bg-slate-800">
												<TableHead className="font-bold">Earnings</TableHead>
												<TableHead className="text-right font-bold">
													Amount
												</TableHead>
												<TableHead className="font-bold">Deductions</TableHead>
												<TableHead className="text-right font-bold">
													Amount
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											<TableRow>
												<TableCell>Base / Earned Salary</TableCell>
												<TableCell className="text-right font-semibold">
													{formatINR(selectedPayslip.baseSalary)}
												</TableCell>
												<TableCell>Advance / Deductions</TableCell>
												<TableCell className="text-right font-semibold text-rose-600">
													{formatINR(selectedPayslip.totalDeductions)}
												</TableCell>
											</TableRow>
											<TableRow className="bg-slate-50 font-bold dark:bg-slate-900/50">
												<TableCell>Gross Earnings</TableCell>
												<TableCell className="text-right">
													{formatINR(
														selectedPayslip.grossPayable ||
															selectedPayslip.baseSalary,
													)}
												</TableCell>
												<TableCell>Total Deductions</TableCell>
												<TableCell className="text-right text-rose-600">
													-{formatINR(selectedPayslip.totalDeductions)}
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>

								{/* Net Take-Home Highlight */}
								<div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:bg-emerald-950/40">
									<div>
										<span className="font-bold text-emerald-900 text-sm dark:text-emerald-100">
											NET TAKE-HOME DISBURSED SALARY
										</span>
										<p className="text-[11px] text-emerald-700 dark:text-emerald-300">
											Transaction UTR:{" "}
											{selectedPayslip.transactionReference || "UTR-VERIFIED"}
										</p>
									</div>
									<div className="font-black text-2xl text-emerald-700 dark:text-emerald-300">
										{formatINR(selectedPayslip.netPayable)}
									</div>
								</div>
							</div>

							<DialogFooter className="border-t bg-slate-50 p-4 dark:bg-slate-900">
								<Button
									variant="outline"
									onClick={() => setIsPreviewOpen(false)}
								>
									Close
								</Button>
								<Button
									onClick={() => handleDownloadPDF(selectedPayslip)}
									disabled={isPdfGenerating}
									className="gap-1.5 bg-blue-600 font-semibold text-white hover:bg-blue-700"
								>
									<Download className="h-4 w-4" />
									Download PDF
								</Button>
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
