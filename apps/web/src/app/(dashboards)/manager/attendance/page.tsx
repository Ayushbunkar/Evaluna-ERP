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
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { CameraIcon, CoffeeIcon, ClockIcon, Loader2Icon, MapPinIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AttendancePage() {
	const t = useTranslations("manager");
	const trpc = useTRPC();
	const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

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
									<tr className="border-b text-slate-500 bg-slate-50/50">
										<th className="p-3 font-semibold">Employee / User</th>
										<th className="p-3 font-semibold">Live Selfie</th>
										<th className="p-3 font-semibold">{t("checkInTimeHeader")}</th>
										<th className="p-3 font-semibold">{t("checkOutTimeHeader")}</th>
										<th className="p-3 font-semibold">Work Duration</th>
										<th className="p-3 font-semibold">Break Duration</th>
										<th className="p-3 font-semibold">{t("statusHeader")}</th>
										<th className="p-3 font-semibold">{t("geofenceStatusHeader")}</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{attendanceList.map((att: any) => (
										<tr key={att.id} className="hover:bg-slate-50/40">
											<td className="p-3 font-bold text-slate-900 dark:text-slate-100">
												<div>
													<p className="font-bold text-slate-900 dark:text-slate-100">{att.employeeName || `Staff #${att.employeeId}`}</p>
													<p className="font-mono text-[10px] text-slate-500 font-normal">{att.employeeEmail ? `${att.employeeCode} (${att.employeeEmail})` : att.employeeCode}</p>
												</div>
											</td>
											<td className="p-3">
												{att.selfieAttachmentId ? (
													<button
														type="button"
														onClick={() =>
															setSelectedImage({
																url: `/api/attendance/attachments/${att.selfieAttachmentId}`,
																title: `Live Check-in Selfie — ${att.employeeName}`,
															})
														}
														className="group relative flex h-10 w-10 overflow-hidden rounded-full border border-blue-200 bg-blue-50 shadow-xs hover:ring-2 hover:ring-blue-500"
														title="Click to view full photo"
													>
														<img
															src={`/api/attendance/attachments/${att.selfieAttachmentId}`}
															alt={att.employeeName}
															className="h-full w-full object-cover"
														/>
														<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
															<CameraIcon className="h-4 w-4 text-white" />
														</div>
													</button>
												) : (
													<div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400" title="No photo uploaded">
														<UserIcon className="h-4 w-4" />
													</div>
												)}
											</td>
											<td className="p-3 font-medium font-mono text-green-600">
												{att.checkIn || (att.createdAt ? new Date(att.createdAt).toLocaleTimeString() : "N/A")}
											</td>
											<td className="p-3 font-medium font-mono">
												{att.checkOut || (att.status?.includes("present") || att.status?.includes("Break") ? t("activeLabel") : "-")}
											</td>
											<td className="p-3">
												<span className="inline-flex items-center gap-1 font-semibold text-blue-600 font-mono text-xs">
													<ClockIcon className="h-3.5 w-3.5 text-blue-500" />
													{att.workHours || "-"}
												</span>
											</td>
											<td className="p-3">
												<span className="inline-flex items-center gap-1 text-slate-700 font-mono text-[11px]">
													<CoffeeIcon className="h-3.5 w-3.5 text-amber-500" />
													{att.breakMinutes > 0 ? `${att.breakMinutes} mins (${att.breakCount} break)` : "0 mins"}
												</span>
											</td>
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
											<td className="p-3 text-slate-600">
												<div className="flex items-center gap-1">
													<MapPinIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
													<span className="font-medium text-[11px]">
														{att.notes || t("authorizedGeofence")}
													</span>
												</div>
											</td>
										</tr>
									))}
									{attendanceList.length === 0 && (
										<tr>
											<td
												colSpan={8}
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

			{/* Modal Preview for Live Selfie Image */}
			<Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-base font-bold">
							<CameraIcon className="h-5 w-5 text-blue-600" />
							{selectedImage?.title}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center justify-center p-2">
						{selectedImage && (
							<img
								src={selectedImage.url}
								alt="Live Check-in Selfie"
								className="max-h-[450px] w-auto rounded-xl border border-slate-200 object-contain shadow-md"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
