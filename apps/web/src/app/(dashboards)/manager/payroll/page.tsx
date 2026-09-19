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
	Calendar,
	CheckCircle,
	CheckCircle2,
	Clock,
	DollarSign,
	Download,
	Edit,
	IndianRupee,
	Search,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function PayrollPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [selectedMonth, setSelectedMonth] = useState(
		new Date().toISOString().substring(0, 7),
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

	// Editable Salary Components
	const [baseSalary, setBaseSalary] = useState("25000");
	const [overtimePay, setOvertimePay] = useState("0");
	const [bonus, setBonus] = useState("0");
	const [deductions, setDeductions] = useState("0");

	const { data: payrollList = [], isLoading } =
		trpc.manager.getPayrollApprovals.useQuery({
			month: selectedMonth,
		});

	const approveMutation = trpc.manager.approvePayroll.useMutation({
		onSuccess: (_, variables) => {
			toast.success(
				`Payroll for ${selectedEmployee?.name || "Staff"} marked as ${variables.decision}!`,
			);
			setEditModalOpen(false);
			setSelectedEmployee(null);
			utils.manager.getPayrollApprovals.invalidate();
		},
		onError: (err) => {
			toast.error(`Payroll action failed: ${err.message}`);
		},
	});

	const handleOpenAdjust = (item: any) => {
		setSelectedEmployee(item);
		setBaseSalary(String(item.baseSalary));
		setOvertimePay(String(item.overtimePay));
		setBonus(String(item.bonus));
		setDeductions(String(item.deductions));
		setEditModalOpen(true);
	};

	const handleAction = (decision: "approved" | "rejected" | "paid") => {
		if (!selectedEmployee) return;

		const base = Number.parseFloat(baseSalary) || 0;
		const ot = Number.parseFloat(overtimePay) || 0;
		const b = Number.parseFloat(bonus) || 0;
		const d = Number.parseFloat(deductions) || 0;

		approveMutation.mutate({
			staffId: selectedEmployee.staffId,
			month: selectedMonth,
			baseSalary: base,
			overtimePay: ot,
			bonus: b,
			deductions: d,
			decision,
		});
	};

	const filteredList = payrollList.filter((p) => {
		if (searchTerm) {
			const q = searchTerm.toLowerCase();
			return (
				p.name.toLowerCase().includes(q) ||
				(p.staffCode && p.staffCode.toLowerCase().includes(q)) ||
				(p.role && p.role.toLowerCase().includes(q))
			);
		}
		return true;
	});

	const totalPayrollCost = filteredList.reduce(
		(sum, p) => sum + p.netPayable,
		0,
	);
	const totalPending = filteredList.filter(
		(p) => p.status === "pending_approval" || p.status === "draft",
	).length;
	const totalApproved = filteredList.filter(
		(p) => p.status === "approved" || p.status === "paid",
	).length;

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<IndianRupee className="h-6 w-6 text-blue-600" />
						Monthly Payroll Approvals
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Review monthly salary structures, overtime computations, deductions,
						and authorize disbursements.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Input
						type="month"
						value={selectedMonth}
						onChange={(e) => setSelectedMonth(e.target.value)}
						className="w-44"
					/>
					<Button
						variant="outline"
						onClick={() => toast.info("Downloading payroll register...")}
					>
						<Download className="h-4 w-4 mr-1.5" />
						Export
					</Button>
				</div>
			</div>

			{/* Top Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<IndianRupee className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Total Net Payable ({selectedMonth})
							</div>
							<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
								₹{totalPayrollCost.toLocaleString()}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<Clock className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Pending Sign-off
							</div>
							<div className="font-bold text-2xl text-amber-600 dark:text-amber-400">
								{totalPending}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
							<CheckCircle className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Authorized / Disbursed
							</div>
							<div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
								{totalApproved}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder="Search staff by name, code, role..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Payroll Register Table */}
			<Card>
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="text-base">Staff Payroll Register</CardTitle>
					<CardDescription>
						Salaries, overtime calculations, bonus additions, and net payout
						authorizations.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-slate-500">
							Loading payroll records...
						</div>
					) : filteredList.length === 0 ? (
						<div className="py-12 text-center text-slate-500">
							No staff members found for {selectedMonth}.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
									<tr>
										<th className="px-6 py-3">Employee</th>
										<th className="px-6 py-3">Role</th>
										<th className="px-6 py-3 text-right">Base</th>
										<th className="px-6 py-3 text-right">OT Pay</th>
										<th className="px-6 py-3 text-right">Bonus</th>
										<th className="px-6 py-3 text-right">Deductions</th>
										<th className="px-6 py-3 text-right">Net Payable</th>
										<th className="px-6 py-3 text-center">Status</th>
										<th className="px-6 py-3 text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{filteredList.map((item) => {
										const isPaid = item.status === "paid";
										const isApproved = item.status === "approved";

										return (
											<tr
												key={item.staffId}
												className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
											>
												<td className="px-6 py-4">
													<div className="font-semibold text-slate-900 dark:text-slate-100">
														{item.name}
													</div>
													<div className="text-xs text-slate-400 font-mono">
														{item.staffCode || `STAFF-${item.staffId}`}
													</div>
												</td>
												<td className="px-6 py-4">
													<Badge variant="secondary" className="capitalize text-xs">
														{item.role || "Staff"}
													</Badge>
												</td>
												<td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
													₹{item.baseSalary.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
													₹{item.overtimePay.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-medium text-emerald-600">
													+₹{item.bonus.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-medium text-rose-600">
													-₹{item.deductions.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
													₹{item.netPayable.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-center">
													{isPaid ? (
														<Badge
															variant="outline"
															className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
														>
															Disbursed / Paid
														</Badge>
													) : isApproved ? (
														<Badge
															variant="outline"
															className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
														>
															Approved
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
														>
															Pending Sign-off
														</Badge>
													)}
												</td>
												<td className="px-6 py-4 text-right">
													<Button
														variant="outline"
														size="sm"
														className="h-8 gap-1"
														onClick={() => handleOpenAdjust(item)}
													>
														<Edit className="h-3.5 w-3.5" />
														Review & Sign
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Review & Sign-off Modal */}
			<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle>Review Payroll for {selectedEmployee?.name}</DialogTitle>
						<DialogDescription>
							Month: {selectedMonth} &bull; Staff Code:{" "}
							{selectedEmployee?.staffCode || `STAFF-${selectedEmployee?.staffId}`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="base">Base Salary (₹)</Label>
								<Input
									id="base"
									type="number"
									value={baseSalary}
									onChange={(e) => setBaseSalary(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="ot">Overtime Compensation (₹)</Label>
								<Input
									id="ot"
									type="number"
									value={overtimePay}
									onChange={(e) => setOvertimePay(e.target.value)}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="bon">Incentive / Bonus (₹)</Label>
								<Input
									id="bon"
									type="number"
									value={bonus}
									onChange={(e) => setBonus(e.target.value)}
								/>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="ded">Statutory Deductions (₹)</Label>
								<Input
									id="ded"
									type="number"
									value={deductions}
									onChange={(e) => setDeductions(e.target.value)}
								/>
							</div>
						</div>

						<div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-900 border">
							<div className="flex justify-between items-center text-sm font-semibold">
								<span>Net Payable Authorization:</span>
								<span className="text-base font-bold text-blue-600 dark:text-blue-400">
									₹
									{(
										(Number.parseFloat(baseSalary) || 0) +
										(Number.parseFloat(overtimePay) || 0) +
										(Number.parseFloat(bonus) || 0) -
										(Number.parseFloat(deductions) || 0)
									).toLocaleString()}
								</span>
							</div>
						</div>
					</div>

					<DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
						<Button
							type="button"
							variant="outline"
							onClick={() => setEditModalOpen(false)}
						>
							Close
						</Button>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="default"
								className="bg-blue-600 text-white hover:bg-blue-700"
								disabled={approveMutation.isPending}
								onClick={() => handleAction("approved")}
							>
								Authorize & Approve
							</Button>
							<Button
								type="button"
								className="bg-emerald-600 text-white hover:bg-emerald-700"
								disabled={approveMutation.isPending}
								onClick={() => handleAction("paid")}
							>
								Mark Paid
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
