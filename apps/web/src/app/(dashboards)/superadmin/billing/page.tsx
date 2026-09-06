"use client";

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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@evaluna/ui/components/dialog";
import {
	DownloadIcon,
	IndianRupeeIcon,
	TrendingUpIcon,
	UsersIcon,
	FileSpreadsheetIcon,
	CalendarDaysIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/list-shell";
import { PageTransition } from "@/lib/animations";
import { jsPDF } from "jspdf";

import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "next-intl";

export default function SuperAdminBillingPage() {
	const locale = useLocale();
	const { data: stats, isLoading: statsLoading } = trpc.superadmin.getBillingStats.useQuery();
	const { data: invoices, isLoading: invoicesLoading } = trpc.superadmin.getBillingInvoices.useQuery();

	const [exportDialogOpen, setExportOpen] = useState(false);

	const billingLogs = invoices || [];

	const downloadInvoicePDF = (invoice: { id: string; company: string; amount: string; status: string; date: string }) => {
		try {
			const doc = new jsPDF({
				orientation: "p",
				unit: "mm",
				format: "a4",
			});

			// Colors & Styles (Corporate Navy & Slate)
			const primaryColor = [22, 38, 76]; // Deep Navy
			const secondaryColor = [100, 116, 139]; // Slate Gray
			const textColor = [33, 43, 54]; // Off Black
			const accentColor = invoice.status === "PAID" ? [34, 197, 94] : [239, 68, 68]; // Green vs Red

			// Header - Brand Section
			doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
			doc.rect(0, 0, 210, 40, "F");

			doc.setTextColor(255, 255, 255);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(22);
			doc.text("EVALUNA ERP", 15, 18);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.text("Enterprise Resource Planning System", 15, 25);
			doc.text("Multi-Entity Group Operations", 15, 30);

			doc.setFont("helvetica", "bold");
			doc.setFontSize(14);
			doc.text("SUPPLIER BILL VOUCHER", 140, 18);
			doc.setFont("helvetica", "mono");
			doc.setFontSize(9);
			doc.text(`Ref: ${invoice.id}`, 140, 26);

			// Bill Details (Grid Layout)
			doc.setTextColor(textColor[0], textColor[1], textColor[2]);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(12);
			doc.text("VENDOR INFORMATION", 15, 55);
			doc.text("BILLING DETAILS", 120, 55);

			// Decorative under-bars
			doc.setDrawColor(220, 225, 230);
			doc.setLineWidth(0.5);
			doc.line(15, 58, 95, 58);
			doc.line(120, 58, 195, 58);

			// Vendor Grid Details
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.text("Supplier / Vendor Name:", 15, 66);
			doc.setFont("helvetica", "bold");
			doc.text(invoice.company, 58, 66);

			doc.setFont("helvetica", "normal");
			doc.text("Contact:", 15, 73);
			doc.text("Available in registry", 58, 73);

			doc.text("Supplier Category:", 15, 80);
			doc.text("Local Vendor", 58, 80);

			// Bill Grid Details
			doc.setFont("helvetica", "normal");
			doc.text("GRN / Ref Number:", 120, 66);
			doc.setFont("helvetica", "bold");
			doc.text(invoice.id, 160, 66);

			doc.setFont("helvetica", "normal");
			doc.text("Billing Date:", 120, 73);
			doc.setFont("helvetica", "bold");
			doc.text(invoice.date, 160, 73);

			doc.setFont("helvetica", "normal");
			doc.text("Payment Status:", 120, 80);
			doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
			doc.setFont("helvetica", "bold");
			doc.text(invoice.status, 160, 80);

			// Reset color
			doc.setTextColor(textColor[0], textColor[1], textColor[2]);

			// Table (Symmetric Box Layout)
			doc.setFillColor(245, 247, 250);
			doc.rect(15, 95, 180, 8, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10);
			doc.text("S.No.", 18, 100);
			doc.text("Material Item & Specification", 35, 100);
			doc.text("Tax Detail", 120, 100);
			doc.text("Total Cost", 170, 100);

			// Table Rows
			doc.setFont("helvetica", "normal");
			doc.text("1", 18, 112);
			doc.text(`Raw materials purchase from ${invoice.company}`, 35, 112);
			doc.text("Included (GST)", 120, 112);
			doc.text(invoice.amount, 170, 112);

			doc.line(15, 103, 195, 103);
			doc.line(15, 118, 195, 118);

			// Totals Block
			doc.setFont("helvetica", "bold");
			doc.text("Sub-total Amount:", 120, 135);
			doc.setFont("helvetica", "normal");
			doc.text(invoice.amount, 170, 135);

			doc.setFont("helvetica", "bold");
			doc.text("Tax (CGST + SGST):", 120, 142);
			doc.setFont("helvetica", "normal");
			doc.text("Included in Total", 170, 142);

			doc.setFillColor(240, 244, 248);
			doc.rect(118, 148, 77, 10, "F");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
			doc.text("NET TOTAL:", 120, 154);
			doc.text(invoice.amount, 170, 154);

			// Footer / Signatures
			doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
			doc.setFontSize(8);
			doc.setFont("helvetica", "italic");
			doc.text("This is an electronically generated purchase billing voucher and does not require a physical signature.", 15, 265);
			doc.text("Evaluna ERP - Procurement Ledger Compliance System", 15, 270);

			doc.save(`Invoice_${invoice.id}.pdf`);
			toast.success(`Invoice ${invoice.id} downloaded successfully!`);
		} catch (error) {
			console.error("PDF generation failed:", error);
			toast.error("Failed to generate PDF invoice. Please try again.");
		}
	};

	const downloadLedgerPDF = (timeframe: string) => {
		try {
			const doc = new jsPDF({
				orientation: "p",
				unit: "mm",
				format: "a4",
			});

			const now = new Date();
			const todayStr = now.toISOString().split("T")[0];
			
			let filteredLogs = [...billingLogs];
			let rangeLabel = "";

			if (timeframe === "today") {
				filteredLogs = billingLogs.filter(log => log.date === todayStr);
				rangeLabel = "Today";
			} else if (timeframe === "week") {
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(now.getDate() - 7);
				filteredLogs = billingLogs.filter(log => {
					if (log.date === "N/A") return false;
					const logDate = new Date(log.date);
					return logDate >= sevenDaysAgo && logDate <= now;
				});
				rangeLabel = "This Week";
			} else if (timeframe === "month") {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(now.getDate() - 30);
				filteredLogs = billingLogs.filter(log => {
					if (log.date === "N/A") return false;
					const logDate = new Date(log.date);
					return logDate >= thirtyDaysAgo && logDate <= now;
				});
				rangeLabel = "This Month";
			} else if (timeframe === "last_year") {
				const oneYearAgo = new Date();
				oneYearAgo.setDate(now.getDate() - 365);
				filteredLogs = billingLogs.filter(log => {
					if (log.date === "N/A") return false;
					const logDate = new Date(log.date);
					return logDate >= oneYearAgo && logDate <= now;
				});
				rangeLabel = "Last Year";
			}

			const primaryColor = [22, 38, 76]; // Deep Navy
			const secondaryColor = [100, 116, 139]; // Slate Gray
			const textColor = [33, 43, 54]; // Off Black

			// Title Block
			doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
			doc.rect(0, 0, 210, 35, "F");

			doc.setTextColor(255, 255, 255);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(20);
			doc.text("PROCUREMENT LEDGER REPORT", 15, 15);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(10);
			doc.text("Evaluna ERP - Multi-Entity Enterprise Ledger", 15, 23);
			doc.text(`Timeframe: ${rangeLabel} | Date Generated: ${now.toLocaleDateString()}`, 15, 28);

			// Summary Statistics Section
			doc.setTextColor(textColor[0], textColor[1], textColor[2]);
			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.text("LEDGER METRICS SUMMARY", 15, 48);

			doc.setDrawColor(220, 225, 230);
			doc.setLineWidth(0.5);
			doc.line(15, 51, 195, 51);

			// Compute totals
			const totalCount = filteredLogs.length;
			const sumAmount = filteredLogs.reduce((acc, log) => {
				const num = Number.parseFloat(log.amount.replace(/[^0-9.-]+/g, ""));
				return acc + (isNaN(num) ? 0 : num);
			}, 0);

			// Display Stats Cards
			doc.setFillColor(245, 247, 250);
			doc.rect(15, 56, 55, 18, "F");
			doc.rect(75, 56, 60, 18, "F");
			doc.rect(140, 56, 55, 18, "F");

			doc.setFont("helvetica", "normal");
			doc.setFontSize(8);
			doc.text("TOTAL TRANSACTIONS", 18, 61);
			doc.text("TOTAL PROCURED VALUE", 78, 61);
			doc.text("REPORT TIMEFRAME", 143, 61);

			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.text(totalCount.toString(), 18, 69);
			doc.text(`INR ${sumAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 78, 69);
			doc.text(rangeLabel, 143, 69);

			// Table Header
			doc.setFillColor(240, 244, 248);
			doc.rect(15, 83, 180, 8, "F");

			doc.setFont("helvetica", "bold");
			doc.setFontSize(9);
			doc.text("S.No.", 17, 88);
			doc.text("Date", 30, 88);
			doc.text("Invoice / GRN Ref", 60, 88);
			doc.text("Supplier / Vendor", 100, 88);
			doc.text("Payment Status", 145, 88);
			doc.text("Amount", 175, 88);

			doc.line(15, 91, 195, 91);

			// Table Rows
			doc.setFont("helvetica", "normal");
			let currentY = 97;

			if (filteredLogs.length === 0) {
				doc.text("No transaction logs recorded within this timeframe.", 15, currentY);
			} else {
				filteredLogs.forEach((log, index) => {
					if (index % 2 === 1) {
						doc.setFillColor(248, 250, 252);
						doc.rect(15, currentY - 5, 180, 7, "F");
					}

					doc.text((index + 1).toString(), 17, currentY);
					doc.text(log.date, 30, currentY);
					doc.setFont("helvetica", "mono");
					doc.text(log.id, 60, currentY);
					doc.setFont("helvetica", "normal");
					doc.text(log.company, 100, currentY);
					doc.text(log.status, 145, currentY);
					doc.text(log.amount, 175, currentY);

					doc.line(15, currentY + 2, 195, currentY + 2);
					currentY += 7;
				});
			}

			// Footer
			doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
			doc.setFontSize(8);
			doc.setFont("helvetica", "italic");
			doc.text(`Generated automatically by Super Admin of Evaluna ERP. Security Level: Global Admin. Page 1 of 1.`, 15, 275);

			doc.save(`Ledger_Report_${timeframe}_${todayStr}.pdf`);
			setExportOpen(false);
			toast.success(`Ledger report for ${rangeLabel} downloaded successfully!`);
		} catch (error) {
			console.error("Ledger PDF generation failed:", error);
			toast.error("Failed to generate ledger report. Please try again.");
		}
	};

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Procurement & Supplier Billing"
				description="Track system-wide material purchases, outstanding supplier balances, and procurement invoice histories."
				actions={
					<Button size="sm" onClick={() => setExportOpen(true)}>
						<FileSpreadsheetIcon className="mr-2 h-4 w-4" /> Export Ledger Report
					</Button>
				}
			/>

			{/* Stats cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-red-500/10 rounded-full">
							<IndianRupeeIcon className="h-6 w-6 text-red-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs flex items-center gap-1">Total Accounts Payable 🇮🇳</p>
							<p className="font-bold text-2xl">
								{statsLoading ? "..." : formatCurrency(stats?.mrr || 0, locale)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-green-500/10 rounded-full">
							<TrendingUpIcon className="h-6 w-6 text-green-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs flex items-center gap-1">Total Value Procured 🇮🇳</p>
							<p className="font-bold text-2xl">
								{statsLoading ? "..." : formatCurrency(stats?.acv || 0, locale)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-6 flex items-center space-x-4">
						<div className="p-3 bg-blue-500/10 rounded-full">
							<UsersIcon className="h-6 w-6 text-blue-500" />
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Active Registered Suppliers</p>
							<p className="font-bold text-2xl">
								{statsLoading ? "..." : `${stats?.activeTenants || 0} Suppliers`}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Invoice table card */}
			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg">Recent Supplier Invoices</CardTitle>
					<CardDescription>System-wide transactional record for material purchases and raw goods.</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{invoicesLoading ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
							Loading procurement invoices...
						</div>
					) : billingLogs.length === 0 ? (
						<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
							No supplier invoices recorded yet.
						</div>
					) : (
						<Table>
							<TableHeader className="bg-muted/40 backdrop-blur">
								<TableRow>
									<TableHead>Invoice / GRN Ref</TableHead>
									<TableHead>Supplier / Vendor</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Payment Status</TableHead>
									<TableHead>Purchase Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{billingLogs.map((log) => (
									<TableRow key={log.id} className="hover:bg-muted/30">
										<TableCell className="font-medium font-mono text-sm">{log.id}</TableCell>
										<TableCell>{log.company}</TableCell>
										<TableCell>{log.amount}</TableCell>
										<TableCell>
											<span className={`px-2 py-0.5 rounded text-xs font-semibold ${
												log.status === "PAID" 
													? "bg-green-500/10 text-green-500" 
													: log.status === "PARTIAL" 
														? "bg-blue-500/10 text-blue-500" 
														: "bg-red-500/10 text-red-500"
											}`}>
												{log.status}
											</span>
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">{log.date}</TableCell>
										<TableCell className="text-right">
											<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadInvoicePDF(log)}>
												<DownloadIcon className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Timeframe Dialog Modal */}
			<Dialog open={exportDialogOpen} onOpenChange={setExportOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Export Procurement Ledger Report</DialogTitle>
						<DialogDescription>
							Select a timeframe interval to generate and download a clean, production-grade PDF of the supplier billing ledger.
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-2 gap-4 py-4">
						<Button 
							type="button" 
							variant="outline" 
							className="h-20 flex flex-col items-center justify-center gap-2 border hover:bg-muted/20"
							onClick={() => downloadLedgerPDF("today")}
						>
							<CalendarDaysIcon className="h-6 w-6 text-red-500" />
							<span className="font-semibold text-sm">Today</span>
						</Button>

						<Button 
							type="button" 
							variant="outline" 
							className="h-20 flex flex-col items-center justify-center gap-2 border hover:bg-muted/20"
							onClick={() => downloadLedgerPDF("week")}
						>
							<CalendarDaysIcon className="h-6 w-6 text-green-500" />
							<span className="font-semibold text-sm">This Week</span>
						</Button>

						<Button 
							type="button" 
							variant="outline" 
							className="h-20 flex flex-col items-center justify-center gap-2 border hover:bg-muted/20"
							onClick={() => downloadLedgerPDF("month")}
						>
							<CalendarDaysIcon className="h-6 w-6 text-blue-500" />
							<span className="font-semibold text-sm">This Month</span>
						</Button>

						<Button 
							type="button" 
							variant="outline" 
							className="h-20 flex flex-col items-center justify-center gap-2 border hover:bg-muted/20"
							onClick={() => downloadLedgerPDF("last_year")}
						>
							<CalendarDaysIcon className="h-6 w-6 text-purple-500" />
							<span className="font-semibold text-sm">Last Year</span>
						</Button>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" className="w-full" onClick={() => setExportOpen(false)}>
							Cancel Export
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
