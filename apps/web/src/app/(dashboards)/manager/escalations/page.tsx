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
	AlertOctagon,
	AlertTriangle,
	CheckCircle2,
	Clock,
	FileWarning,
	Lock,
	PauseCircle,
	ShieldAlert,
	Unlock,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function EscalationsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const [activeTab, setActiveTab] = useState<"findings" | "held_bills">(
		"held_bills",
	);
	const [resolveModalOpen, setResolveModalOpen] = useState(false);
	const [selectedFindingId, setSelectedFindingId] = useState<number | null>(
		null,
	);
	const [resolutionText, setResolutionText] = useState("");

	const { data, isLoading } = trpc.manager.getEscalations.useQuery();
	const findings = data?.findings || [];
	const heldOrders = data?.heldOrders || [];

	const resolveFindingMutation = trpc.manager.resolveEscalation.useMutation({
		onSuccess: () => {
			toast.success("Finding marked as resolved!");
			setResolveModalOpen(false);
			setSelectedFindingId(null);
			setResolutionText("");
			utils.manager.getEscalations.invalidate();
		},
		onError: (err) => {
			toast.error(`Resolution failed: ${err.message}`);
		},
	});

	const releaseOrderMutation = trpc.manager.releaseHoldOrder.useMutation({
		onSuccess: (_, variables) => {
			toast.success(
				`Order #${variables.orderId} ${variables.action === "approve" ? "released & confirmed" : "cancelled"}!`,
			);
			utils.manager.getEscalations.invalidate();
			utils.manager.getDashboardStats.invalidate();
		},
		onError: (err) => {
			toast.error(`Action failed: ${err.message}`);
		},
	});

	const handleResolveFindingSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedFindingId) return;
		if (!resolutionText || resolutionText.trim().length < 3) {
			toast.error("Please enter a resolution summary.");
			return;
		}

		resolveFindingMutation.mutate({
			findingId: selectedFindingId,
			resolution: resolutionText.trim(),
			status: "RESOLVED",
		});
	};

	const criticalFindings = findings.filter(
		(f) => f.severity === "CRITICAL" || f.severity === "HIGH",
	).length;

	return (
		<PageTransition className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<AlertTriangle className="h-6 w-6 text-amber-500" />
						Escalations & Hold Bills
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Resolve operational audit discrepancies and release suspended orders
						on credit/price hold.
					</p>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
							<PauseCircle className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Orders on Hold
							</div>
							<div className="font-bold text-2xl text-amber-600 dark:text-amber-400">
								{heldOrders.length}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
							<FileWarning className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								Audit Findings
							</div>
							<div className="font-bold text-2xl text-rose-600 dark:text-rose-400">
								{findings.length}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex items-center gap-4 p-5">
						<div className="rounded-xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
							<ShieldAlert className="h-6 w-6" />
						</div>
						<div>
							<div className="text-slate-500 text-xs font-medium dark:text-slate-400">
								High Severity Issues
							</div>
							<div className="font-bold text-2xl text-purple-600 dark:text-purple-400">
								{criticalFindings}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Navigation Tabs */}
			<div className="flex gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
				<Button
					variant={activeTab === "held_bills" ? "default" : "ghost"}
					onClick={() => setActiveTab("held_bills")}
					className="gap-2"
				>
					<Lock className="h-4 w-4" />
					Suspended & Hold Bills ({heldOrders.length})
				</Button>
				<Button
					variant={activeTab === "findings" ? "default" : "ghost"}
					onClick={() => setActiveTab("findings")}
					className="gap-2"
				>
					<AlertOctagon className="h-4 w-4" />
					Operational Exceptions ({findings.length})
				</Button>
			</div>

			{/* Held Bills Tab */}
			{activeTab === "held_bills" && (
				<Card>
					<CardHeader className="border-b px-6 py-4">
						<CardTitle className="text-base">Suspended Orders Queue</CardTitle>
						<CardDescription>
							Orders flagged for manager override due to credit limits or
							excessive manual discounts.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="py-12 text-center text-slate-500">
								Loading held orders...
							</div>
						) : heldOrders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
								<p className="font-medium text-slate-700 dark:text-slate-300">
									All Clear! No Orders on Hold
								</p>
								<p className="text-xs text-slate-400 mt-1">
									All customer orders have satisfied credit rules and automated
									checks.
								</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
										<tr>
											<th className="px-6 py-3">Order ID</th>
											<th className="px-6 py-3">Customer</th>
											<th className="px-6 py-3 text-right">Order Amount</th>
											<th className="px-6 py-3">Hold Reason</th>
											<th className="px-6 py-3">Date</th>
											<th className="px-6 py-3 text-right">Manager Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
										{heldOrders.map((ord) => (
											<tr
												key={ord.id}
												className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
											>
												<td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">
													#{ord.id}
												</td>
												<td className="px-6 py-4">
													<div className="font-semibold text-slate-900 dark:text-slate-100">
														{ord.customer_name || "Direct Customer"}
													</div>
													<div className="text-xs text-slate-400">
														{ord.customer_phone || "No phone"}
													</div>
												</td>
												<td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
													₹{Number(ord.total_amount || 0).toLocaleString()}
												</td>
												<td className="px-6 py-4">
													<Badge
														variant="outline"
														className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
													>
														{ord.discount_reason ||
															"Credit threshold exceeded"}
													</Badge>
												</td>
												<td className="px-6 py-4 text-xs text-slate-400">
													{ord.created_at
														? new Date(ord.created_at).toLocaleDateString()
														: "-"}
												</td>
												<td className="px-6 py-4 text-right">
													<div className="flex items-center justify-end gap-2">
														<Button
															size="sm"
															className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1 h-8"
															onClick={() =>
																releaseOrderMutation.mutate({
																	orderId: ord.id,
																	action: "approve",
																})
															}
															disabled={releaseOrderMutation.isPending}
														>
															<Unlock className="h-3.5 w-3.5" />
															Release
														</Button>
														<Button
															size="sm"
															variant="outline"
															className="text-rose-600 hover:text-rose-700 border-rose-200 h-8"
															onClick={() =>
																releaseOrderMutation.mutate({
																	orderId: ord.id,
																	action: "cancel",
																})
															}
															disabled={releaseOrderMutation.isPending}
														>
															<XCircle className="h-3.5 w-3.5" />
															Reject
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Findings Tab */}
			{activeTab === "findings" && (
				<Card>
					<CardHeader className="border-b px-6 py-4">
						<CardTitle className="text-base">Operational Discrepancies</CardTitle>
						<CardDescription>
							Auditor-logged damage, quantity shortages, barcode mismatches, and
							route exceptions.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="py-12 text-center text-slate-500">
								Loading exceptions...
							</div>
						) : findings.length === 0 ? (
							<div className="py-12 text-center text-slate-500">
								No audit findings or discrepancies recorded.
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase dark:bg-slate-900/50 dark:text-slate-400">
										<tr>
											<th className="px-6 py-3">Issue Title</th>
											<th className="px-6 py-3">Type</th>
											<th className="px-6 py-3">Severity</th>
											<th className="px-6 py-3">Status</th>
											<th className="px-6 py-3">Logged Date</th>
											<th className="px-6 py-3 text-right">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
										{findings.map((f) => (
											<tr
												key={f.id}
												className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
											>
												<td className="px-6 py-4">
													<div className="font-semibold text-slate-900 dark:text-slate-100">
														{f.title}
													</div>
													<div className="text-xs text-slate-500 max-w-sm">
														{f.description}
													</div>
												</td>
												<td className="px-6 py-4">
													<Badge variant="outline" className="capitalize text-xs">
														{f.finding_type}
													</Badge>
												</td>
												<td className="px-6 py-4">
													<Badge
														variant={
															f.severity === "CRITICAL" ||
															f.severity === "HIGH"
																? "destructive"
																: "secondary"
														}
														className="text-xs font-semibold"
													>
														{f.severity}
													</Badge>
												</td>
												<td className="px-6 py-4">
													<span className="capitalize text-xs font-medium text-slate-600 dark:text-slate-400">
														{f.status}
													</span>
												</td>
												<td className="px-6 py-4 text-xs text-slate-400">
													{f.created_at
														? new Date(f.created_at).toLocaleDateString()
														: "-"}
												</td>
												<td className="px-6 py-4 text-right">
													{f.status !== "RESOLVED" &&
														f.status !== "CLOSED" && (
															<Button
																size="sm"
																variant="outline"
																className="h-8"
																onClick={() => {
																	setSelectedFindingId(f.id);
																	setResolveModalOpen(true);
																}}
															>
																Resolve
															</Button>
														)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Resolve Modal */}
			<Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle>Resolve Audit Escalation</DialogTitle>
						<DialogDescription>
							Provide corrective action details to close this operational
							finding.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleResolveFindingSubmit} className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="res">Resolution Notes *</Label>
							<Input
								id="res"
								placeholder="e.g. Stock adjusted / credit note issued"
								value={resolutionText}
								onChange={(e) => setResolutionText(e.target.value)}
								required
							/>
						</div>

						<DialogFooter className="pt-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setResolveModalOpen(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={resolveFindingMutation.isPending}
								className="bg-emerald-600 text-white hover:bg-emerald-700"
							>
								{resolveFindingMutation.isPending
									? "Saving..."
									: "Mark as Resolved"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
