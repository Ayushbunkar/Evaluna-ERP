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
import {
	CameraIcon,
	ClockIcon,
	CoffeeIcon,
	Edit3Icon,
	Loader2Icon,
	MapPinIcon,
	RadioIcon,
	ShieldCheckIcon,
	UserIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	DateFilterBar,
	formatDateDisplay,
	getTodayStr,
} from "@/components/shared/filters/date-filter-bar";
import { PageTransition } from "@/lib/animations";
import { ADJUSTMENT_CATEGORIES, formatTime12h } from "@/lib/attendance-engine";
import { useTRPC } from "@/lib/trpc/client";

export default function AttendancePage() {
	const t = useTranslations("manager");
	let locale = "en";
	try {
		locale = useLocale();
	} catch {
		locale = "en";
	}
	const trpc = useTRPC();
	const [selectedImage, setSelectedImage] = useState<{
		url: string;
		title: string;
	} | null>(null);

	// Date range and preset filtering
	const [startDate, setStartDate] = useState(getTodayStr());
	const [endDate, setEndDate] = useState(getTodayStr());
	const [datePreset, setDatePreset] = useState("today");

	// Geofence Modal State & Query
	const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
	const [geoLat, setGeoLat] = useState("23.259933");
	const [geoLng, setGeoLng] = useState("77.412615");
	const [geoRadius, setGeoRadius] = useState("250");
	const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);

	const { data: existingGeofence, refetch: refetchGeofence } =
		trpc.attendance.getGeofence.useQuery({ branchId: 1 });

	useEffect(() => {
		if (existingGeofence) {
			if (existingGeofence.latitude) setGeoLat(String(existingGeofence.latitude));
			if (existingGeofence.longitude) setGeoLng(String(existingGeofence.longitude));
			if (existingGeofence.radius) setGeoRadius(String(existingGeofence.radius));
		}
	}, [existingGeofence]);

	const setGeofenceMutation = trpc.attendance.setGeofence.useMutation({
		onSuccess: () => {
			toast.success("Warehouse Geofence location updated successfully!");
			refetchGeofence();
			setIsGeofenceModalOpen(false);
		},
		onError: (err) => {
			toast.error(`Failed to save geofence: ${err.message}`);
		},
	});

	const handleGetCurrentLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser.");
			return;
		}
		setIsGettingCurrentLocation(true);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setGeoLat(pos.coords.latitude.toFixed(6));
				setGeoLng(pos.coords.longitude.toFixed(6));
				setIsGettingCurrentLocation(false);
				toast.success("Current GPS coordinates captured!");
			},
			(err) => {
				setIsGettingCurrentLocation(false);
				toast.error(`Could not get current location: ${err.message}`);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const handleSaveGeofence = () => {
		const lat = Number.parseFloat(geoLat);
		const lng = Number.parseFloat(geoLng);
		const rad = Number.parseInt(geoRadius, 10);
		if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(rad)) {
			toast.error("Please enter valid latitude, longitude, and radius numbers.");
			return;
		}
		setGeofenceMutation.mutate({
			branchId: 1,
			latitude: lat,
			longitude: lng,
			radius: rad,
			isActive: true,
		});
	};

	// Adjust Attendance Modal State
	const [adjustModalOpen, setAdjustModalOpen] = useState(false);
	const [adjustTarget, setAdjustTarget] = useState<any>(null);
	const [adjustCheckIn, setAdjustCheckIn] = useState("");
	const [adjustCheckOut, setAdjustCheckOut] = useState("");
	const [adjustCategory, setAdjustCategory] = useState<string>("biometric_malfunction");
	const [adjustReason, setAdjustReason] = useState("");

	const adjustMutation = trpc.hr.adjustAttendance.useMutation({
		onSuccess: () => {
			toast.success("Attendance adjusted successfully & audit trail logged.");
			refetchAttendanceList();
			setAdjustModalOpen(false);
			setAdjustTarget(null);
			setAdjustReason("");
		},
		onError: (err) => {
			toast.error(`Adjustment failed: ${err.message}`);
		},
	});

	// Query real attendance records with active date filters
	const { data: attendanceList = [], isLoading, refetch: refetchAttendanceList } =
		trpc.manager.getAttendance.useQuery({
			startDate: startDate || undefined,
			endDate: endDate || undefined,
		});

	return (
		<PageTransition className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<ClockIcon className="h-6 w-6 text-blue-600" />
						{t("attendanceTitle")}
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						{t("attendanceSub")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{/* Active Geofence Badge & Configure Button */}
					<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-1.5 dark:border-blue-900/60 dark:bg-blue-950/40">
						<MapPinIcon className="h-4 w-4 text-blue-600 shrink-0" />
						<div className="text-xs">
							<div className="flex items-center gap-1.5 font-semibold text-blue-950 dark:text-blue-100">
								<span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Active Geofence:</span>
								{existingGeofence ? (
									<span className="font-mono text-blue-700 dark:text-blue-300 font-bold">
										{Number(existingGeofence.latitude).toFixed(6)}, {Number(existingGeofence.longitude).toFixed(6)}
										<span className="ml-1 text-[11px] text-slate-500 font-normal">
											(±{existingGeofence.radius}m)
										</span>
									</span>
								) : (
									<span className="text-amber-600 dark:text-amber-400 font-medium">Not configured</span>
								)}
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGeofenceModalOpen(true)}
							className="h-7 px-2.5 text-xs font-bold border-blue-300 bg-white hover:bg-blue-100 text-blue-700 dark:bg-slate-900 dark:text-blue-300 dark:border-blue-800"
						>
							Configure
						</Button>
					</div>
				</div>
			</div>

			<Card className="shadow-sm">
				<CardHeader className="space-y-4">
					<div>
						<CardTitle className="font-bold text-base">
							{datePreset === "today"
								? t("todaysAttendanceRoll")
								: datePreset === "yesterday"
									? (locale === "hi" ? "कल की उपस्थिति पंजी (Yesterday's Attendance)" : "Yesterday's Attendance Roll")
									: (locale === "hi" ? "टीम उपस्थिति पंजी (Attendance Roll)" : "Team Attendance Roll")}
						</CardTitle>
						<CardDescription>
							{datePreset === "today"
								? t("todaysAttendanceRollSub")
								: (locale === "hi" ? "चयनित दिनांक / अवधि के अनुसार लाइव चेक-इन एवं पंचिंग रिकॉर्ड" : "Live check-in & punch records for the selected period")}
						</CardDescription>
					</div>

					<DateFilterBar
						startDate={startDate}
						endDate={endDate}
						datePreset={datePreset}
						totalCount={attendanceList.length}
						countLabel={locale === "hi" ? "चेक-इन" : "records"}
						onDateChange={(start, end, preset) => {
							setStartDate(start);
							setEndDate(end);
							setDatePreset(preset);
						}}
					/>
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
									<tr className="border-b bg-slate-50/50 text-slate-500">
										<th className="p-3 font-semibold">{locale === "hi" ? "दिनांक" : "Date"}</th>
										<th className="p-3 font-semibold">Employee / User</th>
										<th className="p-3 font-semibold">Check-In Selfie</th>
										<th className="p-3 font-semibold">Check-Out Selfie</th>
										<th className="p-3 font-semibold">
											{t("checkInTimeHeader")}
										</th>
										<th className="p-3 font-semibold">
											{t("checkOutTimeHeader")}
										</th>
										<th className="p-3 font-semibold">Work Duration</th>
										<th className="p-3 font-semibold">Break Duration</th>
										<th className="p-3 font-semibold">{t("statusHeader")}</th>
										<th className="p-3 font-semibold">
											{t("geofenceStatusHeader")}
										</th>
										<th className="p-3 font-semibold text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{attendanceList.map((att: any) => (
										<tr key={att.id} className="hover:bg-slate-50/40">
											<td className="p-3 font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
												{att.date ? formatDateDisplay(att.date) : "Today"}
											</td>
											<td className="p-3 font-bold text-slate-900 dark:text-slate-100">
												<div className="flex items-center gap-2.5">
													{att.photoUrl ? (
														<img
															src={att.photoUrl}
															alt={att.employeeName}
															className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-500/20 shadow-2xs shrink-0"
															loading="lazy"
														/>
													) : (
														<div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
															{att.employeeName
																?.split(" ")
																.map((n: string) => n[0])
																.slice(0, 2)
																.join("")
																.toUpperCase() || "ST"}
														</div>
													)}
													<div>
														<p className="font-bold text-slate-900 dark:text-slate-100">
															{att.employeeName || `Staff #${att.employeeId}`}
														</p>
														<p className="font-mono font-normal text-[10px] text-slate-500">
															{att.employeeEmail
																? `${att.employeeCode} (${att.employeeEmail})`
																: att.employeeCode}
														</p>
														{att.isAdjusted && (
															<span className="inline-flex items-center gap-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 text-[9px] font-semibold mt-0.5">
																Adjusted
															</span>
														)}
													</div>
												</div>
											</td>
											{/* Check-In Selfie Thumbnail */}
											{/* Check-In Selfie Thumbnail */}
											<td className="p-3">
												{att.checkInSelfieUrl || att.selfieAttachmentId ? (
													<button
														type="button"
														onClick={() =>
															setSelectedImage({
																url: att.checkInSelfieUrl || `/api/attendance/attachments/${att.selfieAttachmentId}`,
																title: `Check-In Selfie — ${att.employeeName}`,
															})
														}
														className="group relative flex h-10 w-10 overflow-hidden rounded-full border-2 border-green-500 bg-green-50 shadow-xs hover:ring-2 hover:ring-green-600"
														title="Click to view Check-In Selfie"
													>
														<img
															src={att.checkInSelfieUrl || `/api/attendance/attachments/${att.selfieAttachmentId}`}
															alt={`Check-in selfie of ${att.employeeName}`}
															className="h-full w-full object-cover"
															loading="lazy"
															onError={(e) => {
																const target = e.currentTarget;
																if (!target.dataset.retried && att.selfieAttachmentId) {
																	target.dataset.retried = "1";
																	setTimeout(() => {
																		target.src = `/api/attendance/attachments/${att.selfieAttachmentId}?retry=1`;
																	}, 300);
																}
															}}
														/>
														<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
															<CameraIcon className="h-4 w-4 text-white" />
														</div>
													</button>
												) : (
													<div
														className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400"
														title="No check-in selfie"
													>
														<UserIcon className="h-4 w-4" />
													</div>
												)}
											</td>
											{/* Check-Out Selfie Thumbnail */}
											<td className="p-3">
												{att.checkOutSelfieUrl || att.checkOutSelfieAttachmentId ? (
													<button
														type="button"
														onClick={() =>
															setSelectedImage({
																url: att.checkOutSelfieUrl || `/api/attendance/attachments/${att.checkOutSelfieAttachmentId}`,
																title: `Check-Out Selfie — ${att.employeeName}`,
															})
														}
														className="group relative flex h-10 w-10 overflow-hidden rounded-full border-2 border-orange-500 bg-orange-50 shadow-xs hover:ring-2 hover:ring-orange-600"
														title="Click to view Check-Out Selfie"
													>
														<img
															src={att.checkOutSelfieUrl || `/api/attendance/attachments/${att.checkOutSelfieAttachmentId}`}
															alt={`Check-out selfie of ${att.employeeName}`}
															className="h-full w-full object-cover"
															loading="lazy"
															onError={(e) => {
																const target = e.currentTarget;
																if (!target.dataset.retried && att.checkOutSelfieAttachmentId) {
																	target.dataset.retried = "1";
																	setTimeout(() => {
																		target.src = `/api/attendance/attachments/${att.checkOutSelfieAttachmentId}?retry=1`;
																	}, 300);
																}
															}}
														/>
														<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
															<CameraIcon className="h-4 w-4 text-white" />
														</div>
													</button>
												) : (
													<div
														className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400"
														title="No check-out selfie yet"
													>
														<UserIcon className="h-4 w-4" />
													</div>
												)}
											</td>
											<td className="p-3 font-medium font-mono text-green-600 whitespace-nowrap">
												{att.checkInFormatted ||
													(att.checkIn ? formatTime12h(att.checkIn) : null) ||
													(att.createdAt
														? formatTime12h(att.createdAt)
														: "N/A")}
											</td>
											<td className="p-3 font-medium font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
												{att.checkOutFormatted ||
													(att.checkOut ? formatTime12h(att.checkOut) : null) ||
													(att.status?.includes("present") ||
													att.status?.includes("Break")
														? t("activeLabel")
														: "-")}
											</td>
											<td className="p-3">
												<span className="inline-flex items-center gap-1 font-mono font-semibold text-blue-600 text-xs">
													<ClockIcon className="h-3.5 w-3.5 text-blue-500" />
													{att.workHours || "-"}
												</span>
											</td>
											<td className="p-3">
												<span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700">
													<CoffeeIcon className="h-3.5 w-3.5 text-amber-500" />
													{att.breakMinutes > 0
														? `${att.breakMinutes} mins (${att.breakCount} break)`
														: "0 mins"}
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
													<MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
													<span className="font-medium text-[11px]">
														{att.notes || t("authorizedGeofence")}
													</span>
												</div>
											</td>
											<td className="p-3 text-right">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setAdjustTarget(att);
														setAdjustCheckIn(att.checkIn || "09:30");
														setAdjustCheckOut(att.checkOut || "18:30");
														setAdjustCategory(att.adjustmentCategory || "biometric_malfunction");
														setAdjustReason(att.adjustmentReason || "");
														setAdjustModalOpen(true);
													}}
													className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
												>
													<Edit3Icon className="h-3 w-3 mr-1 text-blue-600" /> Adjust
												</Button>
											</td>
										</tr>
									))}
									{attendanceList.length === 0 && (
										<tr>
											<td
												colSpan={11}
												className="py-12 text-center text-slate-400 text-xs"
											>
												{datePreset === "today"
													? t("noTeamCheckinsLoggedToday")
													: locale === "hi"
														? "चयनित दिनांक / अवधि के लिए कोई उपस्थिति रिकॉर्ड नहीं मिला।"
														: "No team check-ins logged for the selected period."}
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
			<Dialog
				open={!!selectedImage}
				onOpenChange={() => setSelectedImage(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-base">
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

			{/* CONFIGURE WAREHOUSE GPS GEOFENCE MODAL */}
			<Dialog open={isGeofenceModalOpen} onOpenChange={setIsGeofenceModalOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
							<MapPinIcon className="h-5 w-5 text-blue-600" />
							Configure Warehouse GPS Geofence
						</DialogTitle>
						<DialogDescription>
							Set the official GPS coordinates and allowed radius for Bhopal Main Warehouse. Staff check-in & check-out selfie validation is enforced against this boundary.
						</DialogDescription>
					</DialogHeader>

					<div className="my-2 space-y-4">
						{/* PREVIOUSLY / CURRENTLY SAVED COORDINATES BANNER */}
						{existingGeofence ? (
							<div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/60">
								<div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200 mb-2">
									<span className="flex items-center gap-1.5 font-bold text-xs">
										<ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
										Pehle se Saved Coordinates (Currently Active):
									</span>
									<span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold dark:bg-emerald-950 dark:text-emerald-300">
										<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
										Active
									</span>
								</div>
								<div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-md border border-slate-200 dark:border-slate-700/80 shadow-2xs">
									<div>
										<span className="text-slate-400 block text-[10px] font-sans">Latitude:</span>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{Number(existingGeofence.latitude).toFixed(6)}
										</span>
									</div>
									<div>
										<span className="text-slate-400 block text-[10px] font-sans">Longitude:</span>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{Number(existingGeofence.longitude).toFixed(6)}
										</span>
									</div>
									<div>
										<span className="text-slate-400 block text-[10px] font-sans">Radius:</span>
										<span className="font-bold text-slate-900 dark:text-slate-100">
											{existingGeofence.radius} m
										</span>
									</div>
								</div>
								{existingGeofence.updatedAt && (
									<div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
										<span>Last Updated: {new Date(existingGeofence.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
										<button
											type="button"
											onClick={() => {
												if (existingGeofence.latitude) setGeoLat(String(existingGeofence.latitude));
												if (existingGeofence.longitude) setGeoLng(String(existingGeofence.longitude));
												if (existingGeofence.radius) setGeoRadius(String(existingGeofence.radius));
											}}
											className="text-blue-600 hover:underline font-semibold"
										>
											Reset to Saved
										</button>
									</div>
								)}
							</div>
						) : (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
								⚠️ No geofence coordinates saved yet for this branch. Please set coordinates below.
							</div>
						)}

						<div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
							<div className="flex items-center justify-between">
								<span className="font-semibold">Quick Setup via Browser GPS:</span>
								<Button
									size="sm"
									variant="outline"
									onClick={handleGetCurrentLocation}
									disabled={isGettingCurrentLocation}
									className="h-7 text-xs border-blue-300 bg-white hover:bg-blue-100 dark:bg-slate-800"
								>
									{isGettingCurrentLocation ? (
										<Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
									) : (
										<RadioIcon className="mr-1 h-3.5 w-3.5 text-blue-600" />
									)}
									Use Current Location
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Latitude *
								</Label>
								<Input
									placeholder="23.259933"
									value={geoLat}
									onChange={(e) => setGeoLat(e.target.value)}
									className="mt-1 h-9 font-mono text-xs"
								/>
							</div>

							<div>
								<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
									Longitude *
								</Label>
								<Input
									placeholder="77.412615"
									value={geoLng}
									onChange={(e) => setGeoLng(e.target.value)}
									className="mt-1 h-9 font-mono text-xs"
								/>
							</div>
						</div>

						<div>
							<Label className="font-bold text-slate-700 text-xs dark:text-slate-300">
								Geofence Radius (Meters) *
							</Label>
							<Input
								type="number"
								placeholder="250"
								value={geoRadius}
								onChange={(e) => setGeoRadius(e.target.value)}
								className="mt-1 h-9 font-mono text-xs"
							/>
							<p className="mt-1 text-[11px] text-muted-foreground">
								Staff attempting to clock in outside this radius will be flagged or rejected.
							</p>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsGeofenceModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSaveGeofence}
							disabled={setGeofenceMutation.isPending}
							className="bg-blue-600 text-white font-bold hover:bg-blue-700"
						>
							{setGeofenceMutation.isPending ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Geofence"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ADJUST ATTENDANCE MODAL FOR MANAGER */}
			<Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
				<DialogContent className="max-w-md bg-white dark:bg-slate-900">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-slate-100">
							<Edit3Icon className="h-5 w-5 text-blue-600" />
							Adjust Staff Attendance (Manager Recovery)
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-500">
							Adjust punch-in, punch-out, or status due to biometric failure, network glitch, or system recovery.
						</DialogDescription>
					</DialogHeader>

					{adjustTarget && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								if (!adjustReason.trim() || adjustReason.trim().length < 3) {
									toast.error("Please provide a valid explanation (min 3 chars).");
									return;
								}
								adjustMutation.mutate({
									staffId: adjustTarget.employeeId || adjustTarget.id,
									employeeId: adjustTarget.employeeId,
									date: new Date().toISOString().split("T")[0],
									checkIn: adjustCheckIn.trim() || null,
									checkOut: adjustCheckOut.trim() || null,
									adjustmentCategory: adjustCategory as any,
									adjustmentReason: adjustReason.trim(),
								});
							}}
							className="space-y-3.5 pt-2"
						>
							<div className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/60">
								{adjustTarget.photoUrl ? (
									<img
										src={adjustTarget.photoUrl}
										alt={adjustTarget.employeeName}
										className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20"
									/>
								) : (
									<div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
										{adjustTarget.employeeName?.[0] || "S"}
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
										{adjustTarget.employeeName}
									</h4>
									<p className="font-mono text-[10px] text-slate-500">
										{adjustTarget.employeeCode}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1">
									<Label className="text-xs font-semibold">Adjusted Check-In</Label>
									<Input
										type="time"
										value={adjustCheckIn}
										onChange={(e) => setAdjustCheckIn(e.target.value)}
										className="text-xs font-mono"
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs font-semibold">Adjusted Check-Out</Label>
									<Input
										type="time"
										value={adjustCheckOut}
										onChange={(e) => setAdjustCheckOut(e.target.value)}
										className="text-xs font-mono"
									/>
								</div>
							</div>

							<div className="space-y-1">
								<Label className="text-xs font-semibold">Mandatory Reason Category *</Label>
								<select
									value={adjustCategory}
									onChange={(e) => setAdjustCategory(e.target.value)}
									className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
									required
								>
									{ADJUSTMENT_CATEGORIES.map((cat) => (
										<option key={cat.value} value={cat.value}>
											{cat.label}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-1">
								<Label className="text-xs font-semibold">Manager Explanation / Note *</Label>
								<textarea
									value={adjustReason}
									onChange={(e) => setAdjustReason(e.target.value)}
									placeholder="Explain reasons for adjustment (e.g. Scanner power outage, manual punch verified)..."
									rows={3}
									className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
									required
								/>
							</div>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setAdjustModalOpen(false)}
									disabled={adjustMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={adjustMutation.isPending}
									className="bg-blue-600 hover:bg-blue-700 text-white"
								>
									{adjustMutation.isPending ? "Saving..." : "Save Adjustment"}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
