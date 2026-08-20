"use client";

/**
 * HR / admin attendance control (attendance.approve gated on the server).
 *
 * Configure the branch geofence (the authoritative presence boundary — check-in
 * is impossible until this is set), tune verification settings, review the
 * attendance register, approve flagged records, and apply manual corrections.
 * Every correction is appended to the immutable audit log with the original
 * value preserved — nothing here silently overwrites history.
 */
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Checkbox } from "@evaluna/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { MapPinIcon, SaveIcon, ShieldCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

// __APPEND_MARKER__

export default function AttendanceControlPage() {
	const { activeBranchId } = useBranch();
	const utils = trpc.useUtils();
	const branchId = activeBranchId ?? 0;

	// ── Geofence ──────────────────────────────────────────────────────────────
	const { data: geofence } = trpc.attendance.getGeofence.useQuery(
		{ branchId },
		{ enabled: !!activeBranchId },
	);
	const [lat, setLat] = useState("");
	const [lng, setLng] = useState("");
	const [radius, setRadius] = useState("100");
	useEffect(() => {
		if (geofence) {
			setLat(String(geofence.latitude ?? ""));
			setLng(String(geofence.longitude ?? ""));
			setRadius(String(geofence.radius ?? 100));
		}
	}, [geofence]);

	const setGeofence = trpc.attendance.setGeofence.useMutation({
		onSuccess: () => {
			utils.attendance.getGeofence.invalidate();
			toast.success("Geofence saved. Employees can now check in from this site.");
		},
		onError: (e) => toast.error(e.message),
	});

	const useMyLocation = () => {
		if (!("geolocation" in navigator)) return toast.error("No geolocation on this device.");
		navigator.geolocation.getCurrentPosition(
			(p) => {
				setLat(p.coords.latitude.toFixed(6));
				setLng(p.coords.longitude.toFixed(6));
				toast.success("Filled from your current location — verify before saving.");
			},
			() => toast.error("Could not read your location."),
			{ enableHighAccuracy: true },
		);
	};

	// ── Settings ──────────────────────────────────────────────────────────────
	const { data: settings } = trpc.attendance.getSettings.useQuery();
	const updateSettings = trpc.attendance.updateSettings.useMutation({
		onSuccess: () => {
			utils.attendance.getSettings.invalidate();
			toast.success("Settings updated.");
		},
		onError: (e) => toast.error(e.message),
	});
	const toggle = (key: string, value: boolean) =>
		updateSettings.mutate({ [key]: value } as Record<string, boolean>);

	// ── Attendance register ─────────────────────────────────────────────────
	const today = new Date().toISOString().slice(0, 10);
	const [date, setDate] = useState(today);
	const { data: register, isLoading } = trpc.attendance.listAttendance.useQuery({
		branchId: activeBranchId ?? undefined,
		date,
	});

	const approve = trpc.attendance.approvePending.useMutation({
		onSuccess: () => {
			utils.attendance.listAttendance.invalidate();
			toast.success("Record approved.");
		},
		onError: (e) => toast.error(e.message),
	});

	// ── Manual correction (preserves original in the audit log) ──────────────
	const [corr, setCorr] = useState<{ id: number; value: string; reason: string } | null>(
		null,
	);
	const correct = trpc.attendance.manualCorrection.useMutation({
		onSuccess: () => {
			utils.attendance.listAttendance.invalidate();
			setCorr(null);
			toast.success("Correction recorded (original preserved in audit log).");
		},
		onError: (e) => toast.error(e.message),
	});

	const settingFlags: Array<{ key: string; label: string }> = [
		{ key: "enableGeofence", label: "Require geofence" },
		{ key: "enableSelfie", label: "Require live selfie" },
		{ key: "enableDeviceLock", label: "Device binding" },
		{ key: "enableBreakTracking", label: "Break tracking" },
	];

	if (!activeBranchId) {
		return (
			<div className="p-8 text-muted-foreground">
				Select a branch to configure attendance control.
			</div>
		);
	}

	return (
		<div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-3xl tracking-tight">
					<ShieldCheckIcon className="h-7 w-7 text-primary" /> Attendance Control
				</h2>
				<p className="mt-1 text-muted-foreground">
					Geofence, verification policy, and the branch attendance register.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Geofence */}
				<Card>
					<CardHeader>
						<CardTitle>Branch geofence</CardTitle>
						<CardDescription>
							Authoritative presence boundary. Check-in is refused until this is set.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label htmlFor="lat">Latitude</Label>
								<Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="12.9716" />
							</div>
							<div>
								<Label htmlFor="lng">Longitude</Label>
								<Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="77.5946" />
							</div>
						</div>
						<div>
							<Label htmlFor="radius">Radius (metres)</Label>
							<Input
								id="radius"
								type="number"
								value={radius}
								onChange={(e) => setRadius(e.target.value)}
							/>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button variant="secondary" onClick={useMyLocation} className="gap-2">
								<MapPinIcon className="h-4 w-4" /> Use my location
							</Button>
							<Button
								className="gap-2"
								disabled={setGeofence.isPending}
								onClick={() => {
									const latN = Number(lat);
									const lngN = Number(lng);
									const rN = Number(radius);
									if (Number.isNaN(latN) || Number.isNaN(lngN) || Number.isNaN(rN))
										return toast.error("Enter valid numeric coordinates and radius.");
									setGeofence.mutate({
										branchId,
										latitude: latN,
										longitude: lngN,
										radius: rN,
										isActive: true,
									});
								}}
							>
								<SaveIcon className="h-4 w-4" /> Save geofence
							</Button>
						</div>
						{geofence ? (
							<Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
								Active geofence configured
							</Badge>
						) : (
							<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
								No geofence — check-in disabled for this branch
							</Badge>
						)}
					</CardContent>
				</Card>

				{/* Verification settings */}
				<Card>
					<CardHeader>
						<CardTitle>Verification policy</CardTitle>
						<CardDescription>Global attendance verification toggles.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{settingFlags.map((f) => (
							<label key={f.key} className="flex items-center gap-3 text-sm">
								<Checkbox
									checked={
										!!(settings as unknown as Record<string, boolean> | null)?.[f.key]
									}
									onChange={(e) => toggle(f.key, e.target.checked)}
								/>
								{f.label}
							</label>
						))}
						<div className="pt-2">
							<Label htmlFor="acc">Min GPS accuracy (metres)</Label>
							<Input
								id="acc"
								type="number"
								defaultValue={(settings as { minGPSAccuracy?: number } | null)?.minGPSAccuracy ?? 50}
								onBlur={(e) =>
									updateSettings.mutate({ minGPSAccuracy: Number(e.target.value) || 50 })
								}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Attendance register */}
			<Card>
				<CardHeader className="flex-row items-center justify-between gap-4">
					<div>
						<CardTitle>Attendance register</CardTitle>
						<CardDescription>Branch-scoped. Approve flagged records or correct entries.</CardDescription>
					</div>
					<Input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="w-[160px]"
					/>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Emp</TableHead>
								<TableHead>Check in</TableHead>
								<TableHead>Check out</TableHead>
								<TableHead>Hours</TableHead>
								<TableHead>Risk</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading && (
								<TableRow>
									<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
										Loading…
									</TableCell>
								</TableRow>
							)}
							{!isLoading && (!register || register.length === 0) && (
								<TableRow>
									<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
										No attendance records for this date.
									</TableCell>
								</TableRow>
							)}
							{register?.map((r: any) => (
								<TableRow key={r.id}>
									<TableCell className="font-medium">#{r.employeeId}</TableCell>
									<TableCell>{r.checkIn ?? "—"}</TableCell>
									<TableCell>{r.checkOut ?? "—"}</TableCell>
									<TableCell className="font-mono">{r.workingHours ?? "—"}</TableCell>
									<TableCell>
										{r.riskScore > 0 ? (
											<Badge
												variant="outline"
												className={
													r.riskScore >= 50
														? "border-red-200 bg-red-50 text-red-700"
														: "border-amber-200 bg-amber-50 text-amber-700"
												}
											>
												{r.riskScore}
											</Badge>
										) : (
											<span className="text-muted-foreground">0</span>
										)}
									</TableCell>
									<TableCell>
										<Badge variant={r.status === "present" ? "default" : "secondary"}>
											{r.status}
										</Badge>
									</TableCell>
									<TableCell className="space-x-2 text-right">
										{r.status === "pending_approval" && (
											<Button
												size="sm"
												variant="outline"
												disabled={approve.isPending}
												onClick={() => approve.mutate({ id: r.id })}
											>
												Approve
											</Button>
										)}
										<Button
											size="sm"
											variant="ghost"
											onClick={() => setCorr({ id: r.id, value: r.status, reason: "" })}
										>
											Correct
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Manual correction dialog */}
			<Dialog open={!!corr} onOpenChange={(o) => !o && setCorr(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Correct attendance status</DialogTitle>
					</DialogHeader>
					{corr && (
						<div className="space-y-3">
							<div>
								<Label htmlFor="cval">New status</Label>
								<Input
									id="cval"
									value={corr.value}
									onChange={(e) => setCorr({ ...corr, value: e.target.value })}
									placeholder="present / absent / half_day / late"
								/>
							</div>
							<div>
								<Label htmlFor="creason">Reason (required, kept in audit log)</Label>
								<Input
									id="creason"
									value={corr.reason}
									onChange={(e) => setCorr({ ...corr, reason: e.target.value })}
								/>
							</div>
							<p className="text-muted-foreground text-xs">
								The original value is preserved in the immutable audit log alongside your
								name and reason.
							</p>
						</div>
					)}
					<DialogFooter>
						<Button variant="ghost" onClick={() => setCorr(null)}>
							Cancel
						</Button>
						<Button
							disabled={correct.isPending || (corr?.reason.trim().length ?? 0) < 3}
							onClick={() =>
								corr &&
								correct.mutate({
									id: corr.id,
									field: "status",
									value: corr.value,
									reason: corr.reason,
								})
							}
						>
							Save correction
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
