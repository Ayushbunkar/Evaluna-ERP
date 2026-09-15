"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Camera,
	CheckCircle2,
	Clock,
	History,
	LayoutDashboard,
	LogIn,
	LogOut,
	MapPin,
	ShieldCheck,
	User,
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useSession } from "@/hooks/use-session";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function StaffProfilePage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const sessionData = useSession();

	const { data: statusData, isLoading: isLoadingStatus } =
		trpc.attendance.myStatus.useQuery();

	const staffMember = statusData?.staff;
	const activeShift = statusData?.activeShift;

	const { data: history, isLoading: isLoadingHistory } =
		trpc.attendance.history.useQuery(
			{ staff_id: staffMember?.id ?? 0 },
			{ enabled: !!staffMember?.id },
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
		return (
			<div className="p-8 text-center text-muted-foreground">
				Loading profile...
			</div>
		);
	}

	if (!staffMember) {
		return (
			<div className="flex flex-col items-center gap-4 p-8 text-center text-muted-foreground">
				<User className="h-12 w-12 opacity-20" />
				<p>Your account is not linked to a staff profile.</p>
				<p className="text-sm">
					Please contact your administrator to associate your email with a staff
					record.
				</p>
			</div>
		);
	}

	const userRole =
		sessionData.session?.user?.role || staffMember?.role || "sales_person";

	const dashboardRouteMap: Record<string, string> = {
		super_admin: "/superadmin",
		admin: "/admin",
		manager: "/manager",
		auditor: "/auditor",
		hr: "/hr",
		finance: "/finance",
		marketing: "/marketing",
		warehouse_supervisor: "/warehouse",
		putter: "/putter",
		picker: "/picker",
		packer: "/packer",
		dispatcher: "/packing-dispatch",
		procurement: "/procurement",
		driver: "/driver",
		biller: "/biller",
		sales_person: "/sales",
		sales: "/sales",
		delivery_manager: "/manager",
		delivery_boy: "/driver",
		customer: "/customer",
	};

	const userDashboardRoute = dashboardRouteMap[userRole] || "/sales";

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-900">
			<DashboardHeader />
			<PageTransition>
				<div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="font-bold text-3xl tracking-tight">
								Staff Portal
							</h1>
							<p className="text-muted-foreground text-sm">
								Manage your attendance, live GPS & camera verification, and
								profile
							</p>
						</div>

						<Link href={userDashboardRoute}>
							<Button
								variant="outline"
								className="gap-2 font-semibold text-xs shadow-sm"
							>
								<ArrowLeft className="h-4 w-4" />
								<LayoutDashboard className="h-4 w-4 text-blue-600" />
								Back to My Dashboard
							</Button>
						</Link>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<AnimatedCard>
							<Card className="h-full border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all">
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<User className="h-5 w-5 text-blue-500" /> My Profile
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col gap-4">
										<div>
											<p className="text-muted-foreground text-sm">Name</p>
											<p className="font-medium text-lg">{staffMember.name}</p>
										</div>
										<div>
											<p className="text-muted-foreground text-sm">Staff ID</p>
											<p className="font-medium font-mono">
												{staffMember.staff_code}
											</p>
										</div>
										<div className="flex gap-4">
											<div className="flex-1">
												<p className="text-muted-foreground text-sm">Role</p>
												<p className="font-medium capitalize">
													{staffMember.role}
												</p>
											</div>
											<div className="flex-1">
												<p className="text-muted-foreground text-sm">
													Department
												</p>
												<p className="font-medium capitalize">
													{staffMember.department || "N/A"}
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</AnimatedCard>

						<AnimatedCard>
							<Card
								className={`h-full border-border/50 shadow-sm backdrop-blur-xl transition-all ${activeShift ? "border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5" : "bg-card/80"}`}
							>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<Clock
											className={`h-5 w-5 ${activeShift ? "text-green-500" : "text-orange-500"}`}
										/>
										Today's Attendance
									</CardTitle>
								</CardHeader>
								<CardContent className="flex flex-col items-center justify-center gap-6 py-6">
									<div className="text-center">
										<p className="mb-2 text-muted-foreground text-sm">
											Current Status
										</p>
										{activeShift ? (
											<div className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 font-bold text-green-500 text-lg">
												<CheckCircle2 className="h-5 w-5" /> Clocked In
											</div>
										) : (
											<div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-2 font-bold text-lg text-orange-500">
												<Clock className="h-5 w-5" /> Clocked Out
											</div>
										)}
									</div>

									{activeShift && (
										<p className="text-muted-foreground text-sm">
											Clocked in at{" "}
											{new Date(activeShift.clock_in_time).toLocaleTimeString(
												[],
												{ hour: "2-digit", minute: "2-digit" },
											)}
										</p>
									)}

									<div className="flex w-full flex-col items-center justify-center gap-3">
										<Link href="/attendance" className="w-full max-w-[280px]">
											<Button
												size="lg"
												className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 shadow-md transition-all hover:scale-105"
											>
												<Camera className="h-5 w-5" />
												<MapPin className="h-4 w-4" />
												Live GPS & Camera Attendance
											</Button>
										</Link>

										<p className="mt-1 flex items-center gap-1.5 text-center font-medium text-muted-foreground text-xs">
											<ShieldCheck className="inline h-4 w-4 text-green-600" />
											Captures live photo & verifies GPS location against branch
											geofence.
										</p>
									</div>
								</CardContent>
							</Card>
						</AnimatedCard>
					</div>

					<h2 className="mt-4 flex items-center gap-2 font-bold text-xl">
						<History className="h-5 w-5 text-muted-foreground" /> Attendance
						History
					</h2>

					<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl">
						<CardContent className="p-0">
							{isLoadingHistory ? (
								<div className="p-8 text-center text-muted-foreground">
									Loading history...
								</div>
							) : !history || history.length === 0 ? (
								<div className="p-8 text-center text-muted-foreground">
									No attendance records found.
								</div>
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
											{history.map((record: any) => (
												<tr
													key={record.id}
													className="border-border/30 border-b transition-colors hover:bg-muted/30"
												>
													<td className="px-4 py-3 font-medium">
														{record.date}
													</td>
													<td className="px-4 py-3">
														{new Date(record.clock_in_time).toLocaleTimeString(
															[],
															{
																hour: "2-digit",
																minute: "2-digit",
															},
														)}
													</td>
													<td className="px-4 py-3">
														{record.clock_out_time
															? new Date(
																	record.clock_out_time,
																).toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})
															: "-"}
													</td>
													<td className="px-4 py-3">
														<span
															className={`inline-flex items-center rounded px-2 py-0.5 font-medium text-xs ${
																record.shift_status === "active"
																	? "bg-green-500/20 text-green-500"
																	: "bg-muted text-muted-foreground"
															}`}
														>
															{record.shift_status}
														</span>
													</td>
													<td className="px-4 py-3 text-muted-foreground capitalize">
														{record.work_type}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</PageTransition>
		</div>
	);
}
