"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import {
	AlertCircleIcon,
	AlertTriangleIcon,
	CalendarPlusIcon,
	CheckCircle2Icon,
	ClockIcon,
	Loader2Icon,
	ShieldAlertIcon,
	UserCheckIcon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

interface LeaveAlertModalState {
	open: boolean;
	type: "warning" | "error" | "info";
	title: string;
	message: string;
	details?: string;
}

interface ConfirmActionState {
	open: boolean;
	leaveId: number;
	empName: string;
	status: "approved" | "rejected";
}

export default function HRLeavePage() {
	const trpc = useTRPC();
	const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
	const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | "">(
		"",
	);
	const [startDate, setStartDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [endDate, setEndDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [reason, setReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [alertModal, setAlertModal] = useState<LeaveAlertModalState | null>(
		null,
	);
	const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(
		null,
	);

	const {
		data: leaveRequests = [],
		isLoading,
		error,
		refetch,
	} = trpc.hr.getLeaveRequests.useQuery();
	const { data: employees = [] } = trpc.hr.getEmployees.useQuery({});
	const { data: leaveTypes = [] } = trpc.hr.getLeaveTypes.useQuery();

	const [formError, setFormError] = useState<string | null>(null);

	const createLeaveMutation = trpc.hr.createLeaveRequest.useMutation({
		onSuccess: () => {
			refetch();
			setIsApplyModalOpen(false);
			setSelectedEmployeeId("");
			setReason("");
			setFormError(null);
			setIsSubmitting(false);
		},
		onError: (err) => {
			setFormError(err.message || "Failed to submit leave application");
			setIsSubmitting(false);
		},
	});

	const updateLeaveMutation = trpc.hr.updateLeaveRequest.useMutation({
		onSuccess: () => {
			refetch();
			setConfirmAction(null);
		},
		onError: (err) => {
			setConfirmAction(null);
			const isPrecondition =
				err.message?.includes("Manager approval required") ||
				err.data?.code === "PRECONDITION_FAILED";

			setAlertModal({
				open: true,
				type: "warning",
				title: isPrecondition
					? "Manager Approval Required"
					: "Leave Action Failed",
				message: err.message || "Failed to update leave request",
				details: isPrecondition
					? "Under company compliance policy, employee leave requests require authorization from their reporting manager before HR finalization."
					: undefined,
			});
		},
	});

	const handleApplyLeave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedEmployeeId || !selectedLeaveTypeId) {
			setFormError("Please select both an employee and leave type.");
			return;
		}
		setIsSubmitting(true);
		createLeaveMutation.mutate({
			employeeId: Number(selectedEmployeeId),
			leaveTypeId: Number(selectedLeaveTypeId),
			startDate,
			endDate,
			reason,
		});
	};

	const handleAction = (
		req: {
			id: number;
			emp_name: string;
			manager_approved?: boolean;
		},
		status: "approved" | "rejected",
	) => {
		if (status === "approved" && req.manager_approved === false) {
			setAlertModal({
				open: true,
				type: "warning",
				title: "Manager Approval Required",
				message:
					"Manager approval required before HR can approve this leave request.",
				details:
					"Under company policy, employee leave requests must be approved by their department or reporting manager before HR final approval can be granted.",
			});
			return;
		}

		setConfirmAction({
			open: true,
			leaveId: req.id,
			empName: req.emp_name,
			status,
		});
	};

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				<Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Production Leave Management
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Submit new employee leave applications & approve/reject leave
						requests
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button
						onClick={() => setIsApplyModalOpen(true)}
						className="text-xs shadow-sm sm:text-sm"
					>
						<CalendarPlusIcon className="mr-2 h-4 w-4" /> Apply Employee Leave
					</Button>
				</div>
			</div>

			{error ? (
				<div className="mt-6 flex h-[150px] items-center justify-center rounded-lg border text-muted-foreground text-sm">
					Failed to load leave requests.
				</div>
			) : !leaveRequests || leaveRequests.length === 0 ? (
				<div className="mt-6 flex h-[200px] items-center justify-center rounded-lg border text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No leave requests found
				</div>
			) : (
				<div className="mt-6 overflow-x-auto rounded-lg border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Employee</TableHead>
								<TableHead className="text-left">Leave Type</TableHead>
								<TableHead className="text-left">Start Date</TableHead>
								<TableHead className="text-left">End Date</TableHead>
								<TableHead className="text-left">Reason</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{leaveRequests.map((req) => (
								<TableRow key={req.id}>
									<TableCell className="font-mono text-xs">#{req.id}</TableCell>
									<TableCell className="font-semibold">
										{req.emp_name}
									</TableCell>
									<TableCell>{req.leave_type}</TableCell>
									<TableCell>{req.start_date}</TableCell>
									<TableCell>{req.end_date}</TableCell>
									<TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
										{req.reason || "N/A"}
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											<span
												className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
													req.status === "approved"
														? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
														: req.status === "rejected"
															? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
															: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
												}`}
											>
												{req.status}
											</span>
											{req.status === "pending" && (
												<span
													className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-normal text-[11px] ${
														(req as any).manager_approved
															? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
															: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
													}`}
												>
													{(req as any).manager_approved ? (
														<>
															<UserCheckIcon className="h-3 w-3" /> Mgr Approved
														</>
													) : (
														<>
															<ClockIcon className="h-3 w-3" /> Awaiting Manager
														</>
													)}
												</span>
											)}
										</div>
									</TableCell>
									<TableCell className="flex flex-row gap-2">
										{req.status === "pending" ? (
											<>
												<Button
													variant="outline"
													size="xs"
													className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
													onClick={() => handleAction(req, "approved")}
												>
													<CheckCircle2Icon className="mr-1 h-3 w-3" /> Approve
												</Button>
												<Button
													variant="outline"
													size="xs"
													className="border-red-600 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
													onClick={() => handleAction(req, "rejected")}
												>
													<XCircleIcon className="mr-1 h-3 w-3" /> Reject
												</Button>
											</>
										) : (
											<span className="text-muted-foreground text-xs italic">
												Resolved ({req.approved_by || "HR"})
											</span>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Apply Employee Leave Modal */}
			<Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Apply Employee Leave Application
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleApplyLeave} className="space-y-4 pt-2">
						{formError && (
							<div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-xs dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
								{formError}
							</div>
						)}
						<div className="space-y-1">
							<label
								htmlFor="leave-employee"
								className="font-semibold text-foreground text-xs"
							>
								Employee
							</label>
							<select
								id="leave-employee"
								value={selectedEmployeeId}
								onChange={(e) =>
									setSelectedEmployeeId(
										e.target.value ? Number(e.target.value) : "",
									)
								}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
								required
							>
								<option value="">-- Choose Employee --</option>
								{employees.map((emp) => (
									<option key={emp.id} value={emp.id}>
										{emp.name} ({emp.emp_code})
									</option>
								))}
							</select>
						</div>

						<div className="space-y-1">
							<label
								htmlFor="leave-type"
								className="font-semibold text-foreground text-xs"
							>
								Leave Type
							</label>
							<select
								id="leave-type"
								value={selectedLeaveTypeId}
								onChange={(e) =>
									setSelectedLeaveTypeId(
										e.target.value ? Number(e.target.value) : "",
									)
								}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
								required
							>
								<option value="">-- Choose Leave Type --</option>
								{leaveTypes.map((type) => (
									<option key={type.id} value={type.id}>
										{type.name} ({type.code})
									</option>
								))}
							</select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<label
									htmlFor="leave-start-date"
									className="font-semibold text-foreground text-xs"
								>
									Start Date
								</label>
								<input
									id="leave-start-date"
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
									required
								/>
							</div>

							<div className="space-y-1">
								<label
									htmlFor="leave-end-date"
									className="font-semibold text-foreground text-xs"
								>
									End Date
								</label>
								<input
									id="leave-end-date"
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
									required
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label
								htmlFor="leave-reason"
								className="font-semibold text-foreground text-xs"
							>
								Reason / Purpose
							</label>
							<textarea
								id="leave-reason"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="e.g. Medical emergency, Family event, Annual vacation..."
								rows={3}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
								required
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsApplyModalOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
										Submitting...
									</>
								) : (
									"Submit Application"
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Alert / Precondition Requirement Modal */}
			<Dialog
				open={!!alertModal?.open}
				onOpenChange={(open) => {
					if (!open) setAlertModal(null);
				}}
			>
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<div className="flex items-start gap-3.5 text-left">
							<div
								className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
									alertModal?.type === "warning"
										? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
										: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
								}`}
							>
								{alertModal?.type === "warning" ? (
									<ShieldAlertIcon className="h-6 w-6" />
								) : (
									<AlertCircleIcon className="h-6 w-6" />
								)}
							</div>
							<div className="space-y-1">
								<DialogTitle className="font-semibold text-foreground text-lg">
									{alertModal?.title || "Notice"}
								</DialogTitle>
								<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
									Workflow Policy & Approval Requirements
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-3 py-2 text-left">
						<div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900 text-xs sm:text-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
							<div className="flex items-start gap-2.5 font-medium">
								<AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
								<span>{alertModal?.message}</span>
							</div>
						</div>

						{alertModal?.details && (
							<div className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground text-xs leading-relaxed">
								{alertModal.details}
							</div>
						)}
					</div>

					<DialogFooter className="sm:justify-end">
						<Button
							variant="default"
							onClick={() => setAlertModal(null)}
							className="w-full sm:w-auto"
						>
							Understood
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm Action Dialog */}
			<Dialog
				open={!!confirmAction?.open}
				onOpenChange={(open) => {
					if (!open) setConfirmAction(null);
				}}
			>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle className="font-semibold text-foreground text-lg">
							{confirmAction?.status === "approved"
								? "Approve Leave Request"
								: "Reject Leave Request"}
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
							Are you sure you want to{" "}
							<span className="font-semibold text-foreground">
								{confirmAction?.status}
							</span>{" "}
							this leave application for{" "}
							<span className="font-semibold text-foreground">
								{confirmAction?.empName}
							</span>
							?
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="flex gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => setConfirmAction(null)}
							disabled={updateLeaveMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant={
								confirmAction?.status === "rejected" ? "destructive" : "default"
							}
							onClick={() => {
								if (confirmAction) {
									updateLeaveMutation.mutate({
										leaveId: confirmAction.leaveId,
										status: confirmAction.status,
									});
								}
							}}
							disabled={updateLeaveMutation.isPending}
						>
							{updateLeaveMutation.isPending ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
									Processing...
								</>
							) : confirmAction?.status === "rejected" ? (
								"Reject Leave"
							) : (
								"Approve Leave"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
