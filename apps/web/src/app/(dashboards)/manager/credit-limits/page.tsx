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
import { Checkbox } from "@evaluna/ui/components/checkbox";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	AlertOctagon,
	CheckCircle,
	CreditCard,
	Edit,
	IndianRupee,
	Search,
	ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function CreditLimitsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchTerm, setSearchTerm] = useState("");
	const [onlyHeld, setOnlyHeld] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);

	// Selected Customer for Editing
	const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
	const [creditLimit, setCreditLimit] = useState("");
	const [creditHold, setCreditHold] = useState(false);
	const [paymentTerms, setPaymentTerms] = useState("30");

	const { data: customers = [], isLoading } =
		trpc.manager.getCreditLimits.useQuery({
			search: searchTerm,
			onlyHeld,
		});

	const updateMutation = trpc.manager.updateCreditLimit.useMutation({
		onSuccess: () => {
			toast.success("Customer credit parameters updated successfully!");
			setEditModalOpen(false);
			setSelectedCustomer(null);
			utils.manager.getCreditLimits.invalidate();
		},
		onError: (err) => {
			toast.error(`Update failed: ${err.message}`);
		},
	});

	const handleOpenEdit = (customer: any) => {
		setSelectedCustomer(customer);
		setCreditLimit(customer.credit_limit ? String(customer.credit_limit) : "0");
		setCreditHold(Boolean(customer.credit_hold));
		setPaymentTerms(
			customer.payment_terms ? String(customer.payment_terms) : "30",
		);
		setEditModalOpen(true);
	};

	const handleSaveSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedCustomer) return;

		const numLimit = Number.parseFloat(creditLimit);
		const numTerms = Number.parseInt(paymentTerms, 10);

		if (Number.isNaN(numLimit) || numLimit < 0) {
			toast.error("Please enter a valid credit limit.");
			return;
		}

		updateMutation.mutate({
			customerId: selectedCustomer.id,
			creditLimit: numLimit,
			creditHold,
			paymentTerms: Number.isNaN(numTerms) ? 30 : numTerms,
		});
	};

	const totalHeld = customers.filter((c) => c.credit_hold).length;
	const totalCreditExposure = customers.reduce(
		(sum, c) => sum + Number(c.credit_used || 0),
		0,
	);
	const totalCreditPool = customers.reduce(
		(sum, c) => sum + Number(c.credit_limit || 0),
		0,
	);

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<CreditCard className="h-6 w-6 text-blue-600" />
						Customer Credit Limits & Holds
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Enforce customer risk control, outstanding balances, and credit
						holds.
					</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<IndianRupee className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Total Extended Credit
							</div>
							<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
								₹{totalCreditPool.toLocaleString()}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<CreditCard className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Current Exposure (Used)
							</div>
							<div className="font-bold text-2xl text-amber-600 dark:text-amber-400">
								₹{totalCreditExposure.toLocaleString()}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
							<ShieldAlert className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Accounts on Credit Hold
							</div>
							<div className="font-bold text-2xl text-rose-600 dark:text-rose-400">
								{totalHeld}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder="Search customer name, code, phone..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant={!onlyHeld ? "default" : "outline"}
						size="sm"
						onClick={() => setOnlyHeld(false)}
					>
						All Customers
					</Button>
					<Button
						variant={onlyHeld ? "destructive" : "outline"}
						size="sm"
						onClick={() => setOnlyHeld(true)}
						className="flex items-center gap-1.5"
					>
						<AlertOctagon className="h-4 w-4" />
						Held Only ({totalHeld})
					</Button>
				</div>
			</div>

			{/* Table */}
			<Card>
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="text-base">Customer Credit Ledger</CardTitle>
					<CardDescription>
						Manage individual credit ceilings, payment grace periods, and lock
						delinquent accounts.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-slate-500">
							Loading credit limits...
						</div>
					) : customers.length === 0 ? (
						<div className="py-12 text-center text-slate-500">
							No customer accounts found.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
									<tr>
										<th className="px-6 py-3">Customer</th>
										<th className="px-6 py-3">Type / Phone</th>
										<th className="px-6 py-3 text-right">Credit Limit</th>
										<th className="px-6 py-3 text-right">Used Credit</th>
										<th className="px-6 py-3 text-center">Terms (Days)</th>
										<th className="px-6 py-3 text-center">Status</th>
										<th className="px-6 py-3 text-right">Action</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{customers.map((c) => {
										const limit = Number(c.credit_limit || 0);
										const used = Number(c.credit_used || 0);
										const isOverLimit = limit > 0 && used > limit;

										return (
											<tr
												key={c.id}
												className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 ${
													c.credit_hold
														? "bg-rose-50/30 dark:bg-rose-950/20"
														: ""
												}`}
											>
												<td className="px-6 py-4">
													<div className="font-semibold text-slate-900 dark:text-slate-100">
														{c.name}
													</div>
													<div className="text-xs text-slate-400">
														{c.customer_code || `CUST-${c.id}`}
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="capitalize text-slate-700 dark:text-slate-300">
														{c.customer_type || "Retail"}
													</div>
													<div className="text-xs text-slate-400">
														{c.phone || "No Phone"}
													</div>
												</td>
												<td className="px-6 py-4 text-right font-medium text-slate-800 dark:text-slate-200">
													₹{limit.toLocaleString()}
												</td>
												<td className="px-6 py-4 text-right font-medium">
													<span
														className={
															isOverLimit
																? "font-bold text-rose-600"
																: "text-slate-600 dark:text-slate-400"
														}
													>
														₹{used.toLocaleString()}
													</span>
												</td>
												<td className="px-6 py-4 text-center">
													<span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
														{c.payment_terms || 30} Days
													</span>
												</td>
												<td className="px-6 py-4 text-center">
													{c.credit_hold ? (
														<Badge
															variant="destructive"
															className="flex w-fit items-center gap-1 mx-auto"
														>
															<ShieldAlert className="h-3 w-3" />
															On Hold
														</Badge>
													) : isOverLimit ? (
														<Badge
															variant="outline"
															className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
														>
															Limit Exceeded
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
														>
															Healthy
														</Badge>
													)}
												</td>
												<td className="px-6 py-4 text-right">
													<Button
														variant="outline"
														size="sm"
														className="h-8 gap-1"
														onClick={() => handleOpenEdit(c)}
													>
														<Edit className="h-3.5 w-3.5" />
														Manage
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

			{/* Edit Credit Limit Modal */}
			<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
				<DialogContent className="sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle>Update Credit Settings</DialogTitle>
						<DialogDescription>
							Adjust credit threshold and hold status for {selectedCustomer?.name}.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSaveSubmit} className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="limit">Credit Limit (₹)</Label>
							<Input
								id="limit"
								type="number"
								min="0"
								placeholder="e.g. 50000"
								value={creditLimit}
								onChange={(e) => setCreditLimit(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="terms">Payment Terms (Days)</Label>
							<Input
								id="terms"
								type="number"
								min="0"
								max="365"
								placeholder="e.g. 30"
								value={paymentTerms}
								onChange={(e) => setPaymentTerms(e.target.value)}
								required
							/>
						</div>

						<div className="flex items-center justify-between rounded-lg border p-3.5">
							<div className="space-y-0.5">
								<Label className="text-base font-semibold text-rose-600">
									Credit Hold
								</Label>
								<p className="text-xs text-slate-500">
									Block customer from placing new orders until debt is cleared.
								</p>
							</div>
							<Checkbox
								checked={creditHold}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setCreditHold(e.target.checked)
								}
								className="h-5 w-5"
							/>
						</div>

						<DialogFooter className="pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={updateMutation.isPending}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{updateMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
