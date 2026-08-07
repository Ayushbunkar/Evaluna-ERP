"use client";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { AnimatedCard, PageTransition, StaggerList, StaggerItem } from "@/lib/animations";
import { Clock, User, LogIn, LogOut, CheckCircle2, History } from "lucide-react";

export default function StaffProfilePage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	const { data: statusData, isLoading: isLoadingStatus } =
		trpc.attendance.myStatus.useQuery();

	const staffMember = statusData?.staff;
	const activeShift = statusData?.activeShift;

	const { data: history, isLoading: isLoadingHistory } =
		trpc.attendance.history.useQuery(
			{ staff_id: staffMember?.id ?? 0 },
			{ enabled: !!staffMember?.id }
		);

	const clockIn = trpc.attendance.clockIn.useMutation({
		onSuccess: () => {
			utils.attendance.myStatus.invalidate();
			utils.attendance.history.invalidate();
		},
	});

	const clockOut = trpc.attendance.clockOut.useMutation({
		onSuccess: () => {
			utils.attendance.myStatus.invalidate();
			utils.attendance.history.invalidate();
		},
	});

	if (isLoadingStatus) {
		return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
	}

	if (!staffMember) {
		return (
			<div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-4">
				<User className="h-12 w-12 opacity-20" />
				<p>Your account is not linked to a staff profile.</p>
				<p className="text-sm">Please contact your administrator to associate your email with a staff record.</p>
			</div>
		);
	}

	return (
		<PageTransition>
			<div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Staff Portal</h1>
					<p className="text-muted-foreground">Manage your attendance and profile</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all h-full">
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<User className="h-5 w-5 text-blue-500" /> My Profile
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Name</p>
										<p className="font-medium text-lg">{staffMember.name}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Staff ID</p>
										<p className="font-medium font-mono">{staffMember.staff_code}</p>
									</div>
									<div className="flex gap-4">
										<div className="flex-1">
											<p className="text-sm text-muted-foreground">Role</p>
											<p className="font-medium capitalize">{staffMember.role}</p>
										</div>
										<div className="flex-1">
											<p className="text-sm text-muted-foreground">Department</p>
											<p className="font-medium capitalize">{staffMember.department || "N/A"}</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>

					<AnimatedCard>
						<Card className={`border-border/50 shadow-sm backdrop-blur-xl transition-all h-full ${activeShift ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20' : 'bg-card/80'}`}>
							<CardHeader>
								<CardTitle className="text-lg flex items-center gap-2">
									<Clock className={`h-5 w-5 ${activeShift ? 'text-green-500' : 'text-orange-500'}`} /> 
									Today's Attendance
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center py-6 gap-6">
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-2">Current Status</p>
									{activeShift ? (
										<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-500 font-bold text-lg">
											<CheckCircle2 className="h-5 w-5" /> Clocked In
										</div>
									) : (
										<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-500 font-bold text-lg">
											<Clock className="h-5 w-5" /> Clocked Out
										</div>
									)}
								</div>

								{activeShift && (
									<p className="text-sm text-muted-foreground">
										Clocked in at {new Date(activeShift.clock_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
									</p>
								)}

								<div className="w-full flex gap-4 justify-center">
									{!activeShift ? (
										<Button 
											size="lg" 
											className="w-full max-w-[200px] gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-105"
											onClick={() => clockIn.mutate({})}
											disabled={clockIn.isPending}
										>
											<LogIn className="h-5 w-5" /> 
											{clockIn.isPending ? "Clocking In..." : "Clock In"}
										</Button>
									) : (
										<Button 
											size="lg" 
											variant="destructive"
											className="w-full max-w-[200px] gap-2 shadow-md shadow-red-500/20 transition-all hover:scale-105"
											onClick={() => clockOut.mutate({})}
											disabled={clockOut.isPending}
										>
											<LogOut className="h-5 w-5" /> 
											{clockOut.isPending ? "Clocking Out..." : "Clock Out"}
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					</AnimatedCard>
				</div>

				<h2 className="font-bold text-xl mt-4 flex items-center gap-2">
					<History className="h-5 w-5 text-muted-foreground" /> Attendance History
				</h2>

				<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
					<CardContent className="p-0">
						{isLoadingHistory ? (
							<div className="p-8 text-center text-muted-foreground">Loading history...</div>
						) : !history || history.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground">No attendance records found.</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="border-border/50 border-b">
										<tr className="text-left text-muted-foreground">
											<th className="px-4 py-3 font-medium">Date</th>
											<th className="px-4 py-3 font-medium">Clock In</th>
											<th className="px-4 py-3 font-medium">Clock Out</th>
											<th className="px-4 py-3 font-medium">Status</th>
											<th className="px-4 py-3 font-medium">Work Type</th>
										</tr>
									</thead>
									<tbody>
										<StaggerList>
											{history.map((record: any) => (
												<StaggerItem key={record.id}>
													<tr className="border-border/30 border-b hover:bg-muted/30 transition-colors">
														<td className="px-4 py-3 font-medium">
															{record.date}
														</td>
														<td className="px-4 py-3">
															{new Date(record.clock_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
														</td>
														<td className="px-4 py-3">
															{record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "-"}
														</td>
														<td className="px-4 py-3">
															<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
																record.shift_status === 'active' 
																	? 'bg-green-500/20 text-green-500' 
																	: 'bg-muted text-muted-foreground'
															}`}>
																{record.shift_status}
															</span>
														</td>
														<td className="px-4 py-3 capitalize text-muted-foreground">
															{record.work_type}
														</td>
													</tr>
												</StaggerItem>
											))}
										</StaggerList>
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
