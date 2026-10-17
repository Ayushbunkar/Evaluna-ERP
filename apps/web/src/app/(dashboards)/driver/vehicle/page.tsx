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
	AlertTriangleIcon,
	BoxIcon,
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
	PackageIcon,
	RefreshCwIcon,
	ShieldCheckIcon,
	TruckIcon,
	WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerItem, StaggerList } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function DriverVehiclePage() {
	const trpc = useTRPC();
	const {
		data: dashboard,
		isLoading,
		refetch,
	} = trpc.driver.getMobileDashboard.useQuery({});
	const {
		data: vanStock,
		isLoading: isVanStockLoading,
		refetch: refetchVanStock,
	} = trpc.driver.getVanStock.useQuery(undefined, {
		refetchInterval: 10000,
	});

	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [issueCategory, setIssueCategory] = useState("Tyre / Brakes");
	const [issueDetails, setIssueDetails] = useState("");
	const [odometerInput, setOdometerInput] = useState("45,210 km");

	const handleReportIssue = () => {
		if (!issueDetails.trim()) {
			toast.error("Please enter a brief description of the issue.");
			return;
		}
		toast.success(`Vehicle inspection issue reported: ${issueCategory}`);
		setIsReportModalOpen(false);
		setIssueDetails("");
	};

	return (
		<PageTransition className="container mx-auto space-y-6 py-6">
			{/* Page Header */}
			<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-2xl text-slate-900 tracking-tight dark:text-slate-100">
						<TruckIcon className="h-7 w-7 text-blue-600" />
						Assigned Vehicle Status & Fleet Inspection
					</h1>
					<p className="text-slate-500 text-sm">
						Monitor vehicle health, report maintenance issues, and record daily
						pre-trip inspections.
					</p>
				</div>
				<Button
					onClick={() => setIsReportModalOpen(true)}
					className="bg-amber-600 font-semibold text-white text-xs shadow-sm hover:bg-amber-700 sm:text-sm"
				>
					<WrenchIcon className="mr-2 h-4 w-4" />
					Report Vehicle Issue
				</Button>
			</div>

			{/* Stats Grid */}
			<StaggerList className="grid gap-4 sm:grid-cols-3" slow>
				<StaggerItem>
					<Card className="border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-blue-700 text-xs uppercase tracking-wider dark:text-blue-400">
										Assigned Truck
									</p>
									<p className="font-bold font-mono text-2xl text-blue-900 dark:text-blue-200">
										MP04AB1234
									</p>
								</div>
								<TruckIcon className="h-8 w-8 text-blue-500 opacity-80" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-emerald-700 text-xs uppercase tracking-wider dark:text-emerald-400">
										Pre-Trip Inspection
									</p>
									<p className="font-bold text-emerald-800 text-xl dark:text-emerald-300">
										Verified & Clear
									</p>
								</div>
								<ShieldCheckIcon className="h-8 w-8 text-emerald-500 opacity-80" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>

				<StaggerItem>
					<Card className="border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-slate-600 text-xs uppercase tracking-wider dark:text-slate-400">
										Odometer Reading
									</p>
									<p className="font-bold font-mono text-slate-800 text-xl dark:text-slate-200">
										{odometerInput}
									</p>
								</div>
								<ClockIcon className="h-8 w-8 text-slate-400" />
							</div>
						</CardContent>
					</Card>
				</StaggerItem>
			</StaggerList>

			{/* Main Vehicle Information & Inspection Checklist */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Vehicle Specifications */}
				<Card className="border-border/60 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 font-bold text-lg">
							<FileTextIcon className="h-5 w-5 text-blue-600" />
							Vehicle Specifications
						</CardTitle>
						<CardDescription className="text-xs">
							Technical specs and active assignment metadata.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex justify-between border-b pb-2">
							<span className="text-slate-500">Fleet Name:</span>
							<span className="font-semibold">
								Bhopal Cargo Delivery Truck 01
							</span>
						</div>
						<div className="flex justify-between border-b pb-2">
							<span className="text-slate-500">Registration Number:</span>
							<span className="font-bold font-mono text-blue-600">
								MP04AB1234
							</span>
						</div>
						<div className="flex justify-between border-b pb-2">
							<span className="text-slate-500">Vehicle Type:</span>
							<span className="font-medium">3-Ton Goods Carrier</span>
						</div>
						<div className="flex justify-between border-b pb-2">
							<span className="text-slate-500">Fuel Type:</span>
							<span className="font-medium">Diesel</span>
						</div>
						<div className="flex justify-between">
							<span className="text-slate-500">Service Status:</span>
							<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 text-xs">
								Available & Active
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Pre-Trip Safety Checklist */}
				<Card className="border-border/60 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 font-bold text-lg">
							<ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
							Pre-Trip Safety Inspection
						</CardTitle>
						<CardDescription className="text-xs">
							Daily verification required before commencing dispatch.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{[
							{ label: "Brake & Handbrake Response", status: "Passed" },
							{ label: "Tyre Pressure & Tread Condition", status: "Passed" },
							{ label: "Headlights & Indicator Signals", status: "Passed" },
							{ label: "Fuel & Engine Oil Levels", status: "Passed" },
							{ label: "Cargo Bay Latch & Lock", status: "Passed" },
						].map((chk, idx) => (
							<div
								key={idx}
								className="flex items-center justify-between border-b pb-2 last:border-0"
							>
								<span className="font-medium text-slate-700 text-xs dark:text-slate-300">
									{chk.label}
								</span>
								<span className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
									<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
									{chk.status}
								</span>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Current Van Inventory & Customer Returns */}
			<Card className="border-border/60 shadow-sm">
				<CardHeader className="border-b bg-gray-50/50 pb-4 dark:bg-gray-800/40">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="flex items-center gap-2 font-bold text-lg">
								<BoxIcon className="h-5 w-5 text-blue-600" />
								Current Van Stock & Customer Returns
							</CardTitle>
							<CardDescription className="text-xs">
								Inventory physically present in your vehicle: warehouse buffer stock and items returned by customers on this route.
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => refetchVanStock()}
								className="h-8 gap-1.5 text-xs font-medium"
							>
								<RefreshCwIcon
									className={`h-3.5 w-3.5 ${isVanStockLoading ? "animate-spin" : ""}`}
								/>
								Sync Van Stock
							</Button>
						</div>
					</div>
					<div className="flex flex-wrap gap-2 pt-2">
						<span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
							<PackageIcon className="h-3.5 w-3.5" /> Total Items: {vanStock?.totalQty ?? 0} units
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
							Est. Value: ₹{vanStock?.totalValue ?? 0}
						</span>
						{(vanStock?.returnedCount ?? 0) > 0 && (
							<span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
								🔄 Customer Returns: {vanStock?.returnedCount} item(s)
							</span>
						)}
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{!vanStock?.items || vanStock.items.length === 0 ? (
						<div className="p-8 text-center text-slate-500 text-xs">
							<BoxIcon className="mx-auto mb-2 h-7 w-7 opacity-30 text-blue-500" />
							<p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
								No extra stock or returned goods in vehicle
							</p>
							<p className="mt-1 text-slate-400 max-w-sm mx-auto">
								When customers reject or return items during delivery stops, or when the warehouse putter allocates buffer stock, they will immediately appear here.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-b bg-gray-100/50 font-semibold text-gray-600 text-xs dark:bg-gray-800 dark:text-gray-300">
									<tr>
										<th className="p-3 pl-4">Product Name</th>
										<th className="p-3">Source & Category</th>
										<th className="p-3">Unit Price</th>
										<th className="p-3">Available in Van</th>
										<th className="p-3 pr-4 text-right">Reason / Notes</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{vanStock.items.map((item, idx) => {
										const isReturn = item.source === "customer_return";
										return (
											<tr
												key={idx}
												className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
											>
												<td className="p-3 pl-4">
													<div className="font-semibold text-slate-900 dark:text-white">
														{item.name}
													</div>
													{isReturn && item.customerName && (
														<div className="text-[11px] text-amber-700 dark:text-amber-400">
															Returned by: {item.customerName}
														</div>
													)}
												</td>
												<td className="p-3">
													{isReturn ? (
														<span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
															🔄 Customer Return
														</span>
													) : (
														<span className="inline-flex items-center rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
															📦 Van Buffer
														</span>
													)}
												</td>
												<td className="p-3 font-mono font-medium">₹{item.price}</td>
												<td className="p-3 font-bold font-mono text-blue-600 dark:text-blue-400">
													{item.availableQty} units
												</td>
												<td className="p-3 pr-4 text-right text-xs text-slate-600 dark:text-slate-400">
													{item.reason || "Available for delivery"}
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

			{/* Report Issue Modal */}
			<Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-amber-700 text-lg">
							<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
							Report Vehicle Issue
						</DialogTitle>
						<DialogDescription className="text-slate-500 text-xs">
							Notify dispatch and maintenance regarding any mechanical or safety
							issues.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-3">
						<div className="space-y-1.5">
							<Label className="font-semibold text-slate-700 text-xs">
								Issue Category
							</Label>
							<select
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
								value={issueCategory}
								onChange={(e) => setIssueCategory(e.target.value)}
							>
								<option value="Tyre / Brakes">Tyre / Brakes</option>
								<option value="Engine / Oil Leak">Engine / Oil Leak</option>
								<option value="Lights / Electrical">Lights / Electrical</option>
								<option value="Cargo Door Lock">Cargo Door Lock</option>
								<option value="Other">Other Maintenance</option>
							</select>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-slate-700 text-xs">
								Issue Description
							</Label>
							<textarea
								rows={3}
								placeholder="Describe the issue in detail..."
								className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-sm"
								value={issueDetails}
								onChange={(e) => setIssueDetails(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsReportModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleReportIssue}
							className="bg-amber-600 font-semibold text-white hover:bg-amber-700"
						>
							Submit Issue Report
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
