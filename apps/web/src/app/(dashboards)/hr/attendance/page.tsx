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
import {
	ActivityIcon,
	CalendarOffIcon,
	Loader2Icon,
	PlusIcon,
} from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function HRAttendancePage() {
	const trpc = useTRPC();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
	const [offDate, setOffDate] = useState(
		new Date().toISOString().split("T")[0],
	);
	const [offStatus, setOffStatus] = useState<
		"leave" | "holiday" | "absent" | "week_off"
	>("leave");
	const [offReason, setOffReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		data: attendanceRecords = [],
		isLoading,
		error,
		refetch,
	} = trpc.hr.getAttendanceRecords.useQuery();
	const { data: employees = [] } = trpc.hr.getEmployees.useQuery({});

	const markOffMutation = trpc.hr.markEmployeeOff.useMutation({
		onSuccess: () => {
			refetch();
			setIsModalOpen(false);
			setSelectedEmployeeId("");
			setOffReason("");
			setIsSubmitting(false);
		},
		onError: (err) => {
			alert(err.message || "Failed to mark employee off");
			setIsSubmitting(false);
		},
	});

	const handleSubmitOff = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedEmployeeId) {
			alert("Please select an employee");
			return;
		}
		setIsSubmitting(true);
		markOffMutation.mutate({
			employeeId: Number(selectedEmployeeId),
			date: offDate,
			status: offStatus,
			reason: offReason,
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
						Attendance Records & Mark Off
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View live attendance and mark employee off/leave/holiday with
						reasons
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button
						onClick={() => setIsModalOpen(true)}
						className="text-xs shadow-sm sm:text-sm"
					>
						<CalendarOffIcon className="mr-2 h-4 w-4" /> Mark Employee Off /
						Holiday
					</Button>
				</div>
			</div>

			{error ? (
				<div className="mt-6 flex h-[150px] items-center justify-center rounded-lg border text-muted-foreground text-sm">
					Failed to load attendance records.
				</div>
			) : !attendanceRecords || attendanceRecords.length === 0 ? (
				<div className="mt-6 flex h-[200px] items-center justify-center rounded-lg border text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No attendance records found
				</div>
			) : (
				<div className="mt-6 overflow-x-auto rounded-lg border">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">Date</TableHead>
								<TableHead className="text-left">Employee</TableHead>
								<TableHead className="text-left">Check In</TableHead>
								<TableHead className="text-left">Check Out</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{attendanceRecords.map((rec) => (
								<TableRow key={rec.id}>
									<TableCell className="font-medium">{rec.date}</TableCell>
									<TableCell>{rec.employee_name}</TableCell>
									<TableCell>{rec.check_in}</TableCell>
									<TableCell>{rec.check_out}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2.5 py-0.5 font-medium text-xs ${
												rec.status === "present"
													? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
													: rec.status === "leave" || rec.status === "holiday"
														? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
														: rec.status === "absent"
															? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
															: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
											}`}
										>
											{rec.status}
										</span>
									</TableCell>
									<TableCell>
										<Button
											variant="outline"
											size="xs"
											onClick={() => {
												const emp = employees.find(
													(e) => e.name === rec.employee_name,
												);
												if (emp) setSelectedEmployeeId(emp.id);
												setIsModalOpen(true);
											}}
										>
											<CalendarOffIcon className="mr-1 h-3 w-3" /> Update Off
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Mark Employee Off / Holiday Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="sm:max-w-[450px]">
					<DialogHeader>
						<DialogTitle className="font-bold text-lg">
							Mark Employee Off / Holiday
						</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleSubmitOff} className="space-y-4 pt-2">
						<div className="space-y-1">
							<label className="font-semibold text-foreground text-xs">
								Select Employee
							</label>
							<select
								value={selectedEmployeeId}
								onChange={(e) =>
									setSelectedEmployeeId(
										e.target.value ? Number(e.target.value) : "",
									)
								}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
							<label className="font-semibold text-foreground text-xs">
								Off Date
							</label>
							<input
								type="date"
								value={offDate}
								onChange={(e) => setOffDate(e.target.value)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								required
							/>
						</div>

						<div className="space-y-1">
							<label className="font-semibold text-foreground text-xs">
								Status / Type
							</label>
							<select
								value={offStatus}
								onChange={(e) => setOffStatus(e.target.value as any)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="leave">Leave / Day Off</option>
								<option value="holiday">Official Holiday</option>
								<option value="absent">Mark Absent</option>
								<option value="week_off">Week Off</option>
							</select>
						</div>

						<div className="space-y-1">
							<label className="font-semibold text-foreground text-xs">
								Reason / Remarks
							</label>
							<textarea
								value={offReason}
								onChange={(e) => setOffReason(e.target.value)}
								placeholder="e.g. Personal illness, Festival Holiday, Emergency..."
								rows={3}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

						<div className="flex justify-end gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsModalOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />{" "}
										Saving...
									</>
								) : (
									"Save Record"
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
