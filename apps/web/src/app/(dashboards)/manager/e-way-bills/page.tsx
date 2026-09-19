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
	AlertTriangle,
	CheckCircle2,
	Clock,
	FileCheck,
	FileText,
	Plus,
	Search,
	Truck,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function EWayBillsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [generateOpen, setGenerateOpen] = useState(false);
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
	const [cancelReason, setCancelReason] = useState("");

	// Form State
	const [orderId, setOrderId] = useState("");
	const [vehicleNo, setVehicleNo] = useState("");
	const [transporterName, setTransporterName] = useState("");
	const [modeOfTransport, setModeOfTransport] = useState<
		"road" | "rail" | "air" | "ship"
	>("road");

	const { data: bills = [], isLoading } = trpc.manager.getEWayBills.useQuery({
		search: searchTerm,
		status: statusFilter,
	});

	const generateMutation = trpc.manager.generateEWayBill.useMutation({
		onSuccess: (data) => {
			toast.success(`E-Way Bill generated: ${data.e_way_bill_no}`);
			setGenerateOpen(false);
			setOrderId("");
			setVehicleNo("");
			setTransporterName("");
			utils.manager.getEWayBills.invalidate();
		},
		onError: (err) => {
			toast.error(`Generation failed: ${err.message}`);
		},
	});

	const cancelMutation = trpc.manager.cancelEWayBill.useMutation({
		onSuccess: () => {
			toast.success("E-Way Bill marked as cancelled.");
			setCancelModalOpen(false);
			setSelectedBillId(null);
			setCancelReason("");
			utils.manager.getEWayBills.invalidate();
		},
		onError: (err) => {
			toast.error(`Cancellation failed: ${err.message}`);
		},
	});

	const handleGenerateSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const numId = Number.parseInt(orderId.replace(/\D/g, ""), 10);
		if (!numId || Number.isNaN(numId)) {
			toast.error("Please enter a valid numeric Order ID.");
			return;
		}
		if (!vehicleNo || vehicleNo.trim().length < 4) {
			toast.error("Please enter a valid vehicle registration number.");
			return;
		}

		generateMutation.mutate({
			orderId: numId,
			vehicleNo: vehicleNo.trim(),
			transporterName: transporterName.trim() || undefined,
			modeOfTransport,
		});
	};

	const handleCancelSubmit = () => {
		if (!selectedBillId) return;
		if (!cancelReason || cancelReason.trim().length < 5) {
			toast.error("Please enter a detailed cancellation reason.");
			return;
		}
		cancelMutation.mutate({
			eWayBillId: selectedBillId,
			reason: cancelReason.trim(),
		});
	};

	const totalActive = bills.filter(
		(b) => b.status === "generated" || b.status === "active",
	).length;
	const totalCancelled = bills.filter((b) => b.status === "cancelled").length;

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<FileCheck className="h-6 w-6 text-blue-600" />
						E-Way Bills Management
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Generate, track, and manage GST-compliant electronic transport bills
						for shipments.
					</p>
				</div>
				<Button
					onClick={() => setGenerateOpen(true)}
					className="bg-blue-600 text-white hover:bg-blue-700"
				>
					<Plus className="mr-2 h-4 w-4" />
					Generate E-Way Bill
				</Button>
			</div>

			{/* Top Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
							<FileText className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Total Generated
							</div>
							<div className="font-bold text-2xl text-slate-900 dark:text-slate-100">
								{bills.length}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
							<CheckCircle2 className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Active Transits
							</div>
							<div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">
								{totalActive}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
							<XCircle className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Cancelled / Void
							</div>
							<div className="font-bold text-2xl text-rose-600 dark:text-rose-400">
								{totalCancelled}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative w-full sm:w-80">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder="Search by Bill No, Vehicle, Customer..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					{["all", "generated", "active", "cancelled"].map((st) => (
						<Button
							key={st}
							variant={statusFilter === st ? "default" : "outline"}
							size="sm"
							onClick={() => setStatusFilter(st)}
							className="capitalize"
						>
							{st}
						</Button>
					))}
				</div>
			</div>

			{/* Bills List */}
			<Card>
				<CardHeader className="border-b px-6 py-4">
					<CardTitle className="text-base">Electronic Consignment Bills</CardTitle>
					<CardDescription>
						All e-way bill receipts linked with dispatch orders and logistics.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="py-12 text-center text-slate-500">
							Loading E-Way Bills records...
						</div>
					) : bills.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
							<p className="font-medium text-slate-700 dark:text-slate-300">
								No E-Way Bills Found
							</p>
							<p className="text-xs text-slate-400 mt-1 max-w-sm">
								Generate an e-way bill for any high-value order or dispatch
								consignment exceeding the mandatory statutory limit.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
									<tr>
										<th className="px-6 py-3">E-Way Bill No</th>
										<th className="px-6 py-3">Order / Customer</th>
										<th className="px-6 py-3">Vehicle / Mode</th>
										<th className="px-6 py-3">Valid Until</th>
										<th className="px-6 py-3">Status</th>
										<th className="px-6 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{bills.map((bill) => {
										const isCancelled = bill.status === "cancelled";
										return (
											<tr
												key={bill.id}
												className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
											>
												<td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">
													{bill.e_way_bill_no}
													<div className="text-[11px] text-slate-400 font-sans">
														{bill.created_at
															? new Date(bill.created_at).toLocaleDateString()
															: "-"}
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="font-medium text-slate-900 dark:text-slate-100">
														Order #{bill.order_id}
													</div>
													<div className="text-xs text-slate-500">
														{bill.customer_name || "Direct Customer"}
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
														<Truck className="h-3.5 w-3.5 text-slate-400" />
														{bill.vehicle_no || "N/A"}
													</div>
													<div className="text-xs text-slate-400 capitalize">
														{bill.mode_of_transport} &bull;{" "}
														{bill.transporter_name || "Self"}
													</div>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
														<Clock className="h-3 w-3" />
														{bill.valid_until
															? new Date(bill.valid_until).toLocaleDateString()
															: "3 Days"}
													</div>
												</td>
												<td className="px-6 py-4">
													{isCancelled ? (
														<Badge
															variant="outline"
															className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400"
														>
															Cancelled
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
														>
															Generated
														</Badge>
													)}
												</td>
												<td className="px-6 py-4 text-right">
													{!isCancelled && (
														<Button
															variant="ghost"
															size="sm"
															className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
															onClick={() => {
																setSelectedBillId(bill.id);
																setCancelModalOpen(true);
															}}
														>
															Cancel Bill
														</Button>
													)}
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

			{/* Generate Modal */}
			<Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle>Generate Electronic Way Bill</DialogTitle>
						<DialogDescription>
							Create a compliant E-Way Bill for order transit and dispatch.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleGenerateSubmit} className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="orderId">Order Number / ID *</Label>
							<Input
								id="orderId"
								placeholder="e.g. 524 or ORD-524"
								value={orderId}
								onChange={(e) => setOrderId(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="vehicleNo">Vehicle Registration No *</Label>
							<Input
								id="vehicleNo"
								placeholder="e.g. DL 01 AB 1234"
								value={vehicleNo}
								onChange={(e) => setVehicleNo(e.target.value)}
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label htmlFor="mode">Mode of Transport</Label>
								<select
									id="mode"
									value={modeOfTransport}
									onChange={(e) =>
										setModeOfTransport(e.target.value as any)
									}
									className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
								>
									<option value="road">Road</option>
									<option value="rail">Rail</option>
									<option value="air">Air</option>
									<option value="ship">Ship</option>
								</select>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor="transporter">Transporter Name</Label>
								<Input
									id="transporter"
									placeholder="e.g. In-house Fleet"
									value={transporterName}
									onChange={(e) => setTransporterName(e.target.value)}
								/>
							</div>
						</div>

						<DialogFooter className="pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setGenerateOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={generateMutation.isPending}
								className="bg-blue-600 text-white hover:bg-blue-700"
							>
								{generateMutation.isPending ? "Generating..." : "Generate Bill"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Cancel Modal */}
			<Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-rose-600">
							<AlertTriangle className="h-5 w-5" />
							Cancel E-Way Bill
						</DialogTitle>
						<DialogDescription>
							Cancelled bills cannot be reactivated. Please provide an audit
							reason.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<Label htmlFor="reason">Cancellation Reason *</Label>
						<Input
							id="reason"
							placeholder="e.g. Order cancelled by client / vehicle breakdown"
							value={cancelReason}
							onChange={(e) => setCancelReason(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCancelModalOpen(false)}
						>
							Back
						</Button>
						<Button
							variant="destructive"
							disabled={cancelMutation.isPending}
							onClick={handleCancelSubmit}
						>
							{cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
