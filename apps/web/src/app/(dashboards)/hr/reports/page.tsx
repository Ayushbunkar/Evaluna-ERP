"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { jsPDF } from "jspdf";
import { ActivityIcon, DownloadIcon, FileBarChartIcon } from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function HRReportsPage() {
	const trpc = useTRPC();
	const { data: stats } = trpc.hr.getDashboardStats.useQuery({});

	const [selectedReport, setSelectedReport] = useState<string | null>(null);

	const reportCategories = [
		{
			id: 1,
			name: "Attendance & Punctuality Summary",
			type: "Monthly",
			lastGenerated: "Today",
		},
		{
			id: 2,
			name: "Payroll & Compensation Register",
			type: "Monthly",
			lastGenerated: "Yesterday",
		},
		{
			id: 3,
			name: "Leave Balance & Application Log",
			type: "Weekly",
			lastGenerated: "Today",
		},
		{
			id: 4,
			name: "Employee Headcount & Department Distribution",
			type: "Quarterly",
			lastGenerated: "3 days ago",
		},
	];

	const utils = trpc.useUtils();
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async () => {
		if (!selectedReport) return;
		setIsDownloading(true);

		try {
			// dynamically import autotable to avoid SSR issues if any
			const autoTableModule = await import("jspdf-autotable");
			const autoTable = autoTableModule.default;

			const doc = new jsPDF();
			doc.setFontSize(20);
			doc.text("Evaluna ERP - HR Report", 14, 20);

			doc.setFontSize(14);
			doc.text(`Report: ${selectedReport}`, 14, 30);

			doc.setFontSize(10);
			doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 40);

			if (selectedReport === "Attendance & Punctuality Summary") {
				const records = await utils.client.hr.getAttendanceRecords.query({});
				autoTable(doc, {
					startY: 50,
					head: [["Employee", "Date", "Status", "Check In", "Check Out"]],
					body: records.map((r: any) => [
						r.emp_name,
						r.date,
						r.status,
						r.check_in || "-",
						r.check_out || "-",
					]),
				});
			} else if (selectedReport === "Payroll & Compensation Register") {
				const payroll = await utils.client.hr.getPayroll.query({});
				autoTable(doc, {
					startY: 50,
					head: [
						[
							"Employee",
							"Month",
							"Base",
							"Overtime",
							"Bonus",
							"Deductions",
							"Net",
							"Status",
						],
					],
					body: payroll.map((p: any) => [
						p.employee_name,
						p.month,
						`$${p.base_salary}`,
						`$${p.overtime_pay}`,
						`$${p.bonus}`,
						`-$${p.deductions + p.advance_deduction}`,
						`$${p.net_payable}`,
						p.status,
					]),
				});
			} else if (selectedReport === "Leave Balance & Application Log") {
				const leaves = await utils.client.hr.getLeaveRequests.query({});
				autoTable(doc, {
					startY: 50,
					head: [["Employee", "Type", "Start Date", "End Date", "Status"]],
					body: leaves.map((l: any) => [
						l.emp_name,
						l.leave_type,
						l.start_date,
						l.end_date,
						l.status,
					]),
				});
			} else if (
				selectedReport === "Employee Headcount & Department Distribution"
			) {
				const emps = await utils.client.hr.getEmployees.query({});
				autoTable(doc, {
					startY: 50,
					head: [["Code", "Name", "Department", "Role", "Status"]],
					body: emps.map((e: any) => [
						e.emp_code,
						e.name,
						e.department || "-",
						e.role,
						e.status,
					]),
				});
			}

			doc.save(`${selectedReport.replace(/\s+/g, "_").toLowerCase()}.pdf`);
		} catch (err) {
			console.error("Error generating PDF:", err);
			alert("Failed to generate report. Please try again.");
		} finally {
			setIsDownloading(false);
			setSelectedReport(null);
		}
	};

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						HR Reports & Analytics
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Generate and view organizational HR reports
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> HR Analytics
					</Button>
				</div>
			</div>

			<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<span className="font-medium text-muted-foreground text-xs uppercase">
						Total Headcount
					</span>
					<div className="mt-1 font-bold text-2xl">
						{stats?.totalEmployees || 0}
					</div>
				</div>
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<span className="font-medium text-muted-foreground text-xs uppercase">
						Present Today
					</span>
					<div className="mt-1 font-bold text-2xl text-green-600">
						{stats?.presentToday || 0}
					</div>
				</div>
				<div className="rounded-xl border bg-card p-4 shadow-sm">
					<span className="font-medium text-muted-foreground text-xs uppercase">
						On Leave
					</span>
					<div className="mt-1 font-bold text-2xl text-blue-600">
						{stats?.onLeave || 0}
					</div>
				</div>
			</div>

			<div className="mt-8">
				<h2 className="mb-4 font-semibold text-foreground text-lg">
					Available Reports
				</h2>
				<div className="overflow-x-auto rounded-lg border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">Report Name</TableHead>
								<TableHead className="text-left">Frequency</TableHead>
								<TableHead className="text-left">Last Generated</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reportCategories.map((rep) => (
								<TableRow key={rep.id}>
									<TableCell className="font-medium">{rep.name}</TableCell>
									<TableCell>{rep.type}</TableCell>
									<TableCell>{rep.lastGenerated}</TableCell>
									<TableCell>
										<Button
											variant="outline"
											size="xs"
											onClick={() => setSelectedReport(rep.name)}
										>
											<DownloadIcon className="mr-1 h-3 w-3" /> Download PDF
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog
				open={!!selectedReport}
				onOpenChange={(open) => !open && setSelectedReport(null)}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Download Report
						</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="mb-4 text-muted-foreground text-sm">
							You are about to download the following report:
						</p>
						<div className="mb-6 rounded-lg border bg-muted/50 p-4 font-medium text-sm">
							{selectedReport}
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setSelectedReport(null)}
								disabled={isDownloading}
							>
								Cancel
							</Button>
							<Button onClick={handleDownload} disabled={isDownloading}>
								<DownloadIcon className="mr-2 h-4 w-4" />
								{isDownloading ? "Generating PDF..." : "Download PDF"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
