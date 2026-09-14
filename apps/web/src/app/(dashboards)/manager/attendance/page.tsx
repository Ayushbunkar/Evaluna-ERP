"use client";

import { Badge } from "@evaluna/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { ClockIcon, Loader2Icon, MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AttendancePage() {
	const t = useTranslations("manager");
	const trpc = useTRPC();

	// Query real attendance records
	const { data: attendanceList = [], isLoading } =
		trpc.manager.getAttendance.useQuery();

	return (
		<PageTransition className="space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<ClockIcon className="h-6 w-6 text-blue-600" />
					{t("attendanceTitle")}
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					{t("attendanceSub")}
				</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						{t("todaysAttendanceRoll")}
					</CardTitle>
					<CardDescription>
						{t("todaysAttendanceRollSub")}
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b text-slate-500">
										<th className="p-3 font-semibold">{t("userReferenceIdHeader")}</th>
										<th className="p-3 font-semibold">{t("checkInTimeHeader")}</th>
										<th className="p-3 font-semibold">{t("checkOutTimeHeader")}</th>
										<th className="p-3 font-semibold">{t("statusHeader")}</th>
										<th className="p-3 font-semibold">{t("geofenceStatusHeader")}</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{attendanceList.map((att) => (
										<tr key={att.id} className="hover:bg-slate-50/40">
											<td className="p-3 font-bold text-slate-900 dark:text-slate-100">
												{t("staffIdRef", { id: att.employeeId })}
											</td>
											<td className="p-3 font-medium">
												{att.createdAt
													? new Date(att.createdAt).toLocaleTimeString()
													: "N/A"}
											</td>
											<td className="p-3 font-medium">{t("activeLabel")}</td>
											<td className="p-3">
												<Badge
													className="text-[10px] capitalize"
													variant={
														att.status === "present" ? "default" : "outline"
													}
												>
													{att.status}
												</Badge>
											</td>
											<td className="flex items-center gap-1 p-3 text-slate-500">
												<MapPinIcon className="h-3.5 w-3.5 text-blue-500" />
												<span className="font-medium text-[11px]">
													{t("authorizedGeofence")}
												</span>
											</td>
										</tr>
									))}
									{attendanceList.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-12 text-center text-slate-400 text-xs"
											>
												{t("noTeamCheckinsLoggedToday")}
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
