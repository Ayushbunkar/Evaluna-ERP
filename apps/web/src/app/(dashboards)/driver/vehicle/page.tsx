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
	CheckCircle2Icon,
	ClockIcon,
	FileTextIcon,
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
	const { data: dashboard, isLoading, refetch } = trpc.driver.getMobileDashboard.useQuery({});

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
					<h1 className="flex items-center gap-2 font-bold text-2xl tracking-tight text-slate-900 dark:text-slate-100">
						<TruckIcon className="h-7 w-7 text-blue-600" />
						Assigned Vehicle Status & Fleet Inspection
					</h1>
					<p className="text-slate-500 text-sm">
						Monitor vehicle health, report maintenance issues, and record daily pre-trip inspections.
					</p>
				</div>
				<Button
					onClick={() => setIsReportModalOpen(true)}
					className="bg-amber-600 text-white hover:bg-amber-700 font-semibold shadow-sm text-xs sm:text-sm"
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
									<p className="font-mono font-bold text-2xl text-blue-900 dark:text-blue-200">
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
									<p className="font-bold text-xl text-emerald-800 dark:text-emerald-300">
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
									<p className="font-mono font-bold text-xl text-slate-800 dark:text-slate-200">
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
						<CardTitle className="flex items-center gap-2 text-lg font-bold">
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
							<span className="font-semibold">Bhopal Cargo Delivery Truck 01</span>
						</div>
						<div className="flex justify-between border-b pb-2">
							<span className="text-slate-500">Registration Number:</span>
							<span className="font-mono font-bold text-blue-600">MP04AB1234</span>
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
							<span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-xs text-emerald-800">
								Available & Active
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Pre-Trip Safety Checklist */}
				<Card className="border-border/60 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg font-bold">
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
							<div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
								<span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
									{chk.label}
								</span>
								<span className="flex items-center gap-1 font-bold text-xs text-emerald-600">
									<CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
									{chk.status}
								</span>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Report Issue Modal */}
			<Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-amber-700">
							<AlertTriangleIcon className="h-5 w-5 text-amber-600" />
							Report Vehicle Issue
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Notify dispatch and maintenance regarding any mechanical or safety issues.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-3">
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs text-slate-700">Issue Category</Label>
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
							<Label className="font-semibold text-xs text-slate-700">Issue Description</Label>
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
						<Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleReportIssue} className="bg-amber-600 text-white hover:bg-amber-700 font-semibold">
							Submit Issue Report
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
