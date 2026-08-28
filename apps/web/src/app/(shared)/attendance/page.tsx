"use client";

/**
 * Self-service attendance â€” geofenced, backend-authoritative.
 *
 * The browser only gathers *evidence*: raw GPS (lat/long/accuracy) from the
 * Geolocation API and a LIVE camera frame (never a gallery upload). The server
 * recomputes presence against the branch geofence and decides â€” this page never
 * sends a "isInside"/"valid" boolean. Server time is the authoritative clock.
 */
import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import { motion } from "framer-motion";
import {
	CameraIcon,
	CameraOffIcon,
	CoffeeIcon,
	LogInIcon,
	LogOutIcon,
	MapPinIcon,
	UtensilsIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

type Gps = {
	latitude: number;
	longitude: number;
	accuracy: number;
	deviceTimestamp: string;
	mocked?: boolean;
};

/** A lightweight, non-PII device fingerprint (NOT a biometric). */
function deviceFingerprint(): { fingerprint: string; userAgent: string } {
	if (typeof navigator === "undefined")
		return { fingerprint: "server", userAgent: "server" };
	const parts = [
		navigator.userAgent,
		navigator.language,
		`${screen.width}x${screen.height}x${screen.colorDepth}`,
		Intl.DateTimeFormat().resolvedOptions().timeZone,
	].join("|");
	let h = 0;
	for (let i = 0; i < parts.length; i++) {
		h = (h << 5) - h + parts.charCodeAt(i);
		h |= 0;
	}
	return {
		fingerprint: `fp_${Math.abs(h).toString(36)}`,
		userAgent: navigator.userAgent,
	};
}

/** Capture one raw GPS reading. Rejects if permission denied / unavailable. */
function captureGps(): Promise<Gps> {
	return new Promise((resolve, reject) => {
		if (!("geolocation" in navigator)) {
			reject(new Error("This device has no GPS / geolocation support."));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) =>
				resolve({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
					accuracy: pos.coords.accuracy,
					deviceTimestamp: new Date(pos.timestamp).toISOString(),
				}),
			(err) =>
				reject(
					new Error(
						err.code === err.PERMISSION_DENIED
							? "Location permission denied. Attendance requires your location."
							: "Could not read your location. Move to open sky and retry.",
					),
				),
			{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
		);
	});
}

const STATE_LABEL: Record<string, { text: string; cls: string }> = {
	NOT_STARTED: {
		text: "Not checked in",
		cls: "border-gray-200 bg-gray-50 text-gray-700",
	},
	CHECKED_IN: {
		text: "On duty",
		cls: "border-green-200 bg-green-50 text-green-700",
	},
	ON_BREAK: {
		text: "On break",
		cls: "border-amber-200 bg-amber-50 text-amber-700",
	},
	ON_LUNCH: {
		text: "On lunch",
		cls: "border-amber-200 bg-amber-50 text-amber-700",
	},
	COMPLETED: {
		text: "Shift complete",
		cls: "border-blue-200 bg-blue-50 text-blue-700",
	},
};

export default function MyAttendancePage() {
	const { activeBranchId } = useBranch();
	const utils = trpc.useUtils();
	const { data: today, isLoading } = trpc.attendance.getToday.useQuery(
		undefined,
		{
			refetchInterval: 60000,
		},
	);

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [cameraOn, setCameraOn] = useState(false);
	const [busy, setBusy] = useState(false);
	const [nowTick, setNowTick] = useState(Date.now());

	// A ticking display clock. Purely cosmetic â€” the RECORD uses server time.
	useEffect(() => {
		const t = setInterval(() => setNowTick(Date.now()), 1000);
		return () => clearInterval(t);
	}, []);

	const stopCamera = useCallback(() => {
		for (const track of streamRef.current?.getTracks() ?? []) track.stop();
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
		setCameraOn(false);
	}, []);

	useEffect(() => () => stopCamera(), [stopCamera]);

	const startCamera = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: "user",
					width: { ideal: 640 },
					height: { ideal: 480 },
				},
				audio: false,
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play().catch(() => {});
			}
			setCameraOn(true);
		} catch {
			toast.error(
				"Camera access denied. A live photo is required to check in/out.",
			);
		}
	}, []);

	/** Grab one live frame and upload it; returns the attachment id. */
	const captureAndUpload = useCallback(
		async (kind: "checkIn" | "checkOut"): Promise<number> => {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			if (!video || !canvas || !streamRef.current)
				throw new Error("Start the camera first â€” a live photo is required.");
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 480;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Could not capture the photo.");
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const blob = await new Promise<Blob | null>((res) =>
				canvas.toBlob(res, "image/jpeg", 0.85),
			);
			if (!blob) throw new Error("Could not encode the photo.");
			const fd = new FormData();
			fd.append("file", blob, `${kind}-${Date.now()}.jpg`);
			fd.append("kind", kind);
			const resp = await fetch("/api/attendance/upload", {
				method: "POST",
				body: fd,
			});
			if (!resp.ok) {
				const msg = await resp.text().catch(() => "");
				throw new Error(msg || "Photo upload failed.");
			}
			const json = (await resp.json()) as { id: number };
			return json.id;
		},
		[],
	);

	const checkIn = trpc.attendance.checkIn.useMutation({
		onSuccess: (r) => {
			stopCamera();
			utils.attendance.getToday.invalidate();
			toast.success(
				r.flagged
					? "Checked in â€” flagged for HR review (verification pending)."
					: `Checked in at ${r.checkInTime} (${r.distance ?? 0}m from site).`,
			);
		},
		onError: (e) => toast.error(e.message),
	});
	const checkOut = trpc.attendance.checkOut.useMutation({
		onSuccess: (r) => {
			stopCamera();
			utils.attendance.getToday.invalidate();
			toast.success(
				`Checked out â€” ${r.workingHours}h worked (${r.breakMinutes}m breaks).`,
			);
		},
		onError: (e) => toast.error(e.message),
	});
	const startBreak = trpc.attendance.startBreak.useMutation({
		onSuccess: () => {
			utils.attendance.getToday.invalidate();
			toast.success("Break started.");
		},
		onError: (e) => toast.error(e.message),
	});
	const endBreak = trpc.attendance.endBreak.useMutation({
		onSuccess: (r) => {
			utils.attendance.getToday.invalidate();
			toast.success(`Break ended (${r.durationMinutes}m).`);
		},
		onError: (e) => toast.error(e.message),
	});

	const doCheck = useCallback(
		async (kind: "checkIn" | "checkOut") => {
			if (kind === "checkIn" && !activeBranchId) {
				toast.error("Select your branch first.");
				return;
			}
			setBusy(true);
			try {
				const gps = await captureGps();
				const imageAttachmentId = await captureAndUpload(kind);
				const device = deviceFingerprint();
				if (kind === "checkIn")
					await checkIn.mutateAsync({
						branchId: activeBranchId as number,
						gps,
						imageAttachmentId,
						device,
					});
				else await checkOut.mutateAsync({ gps, imageAttachmentId, device });
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Something went wrong.");
			} finally {
				setBusy(false);
			}
		},
		[activeBranchId, captureAndUpload, checkIn, checkOut],
	);

	const state = today?.state ?? "NOT_STARTED";
	const row = today?.row ?? null;
	const label = STATE_LABEL[state] ?? STATE_LABEL.NOT_STARTED;
	const pending = busy || checkIn.isPending || checkOut.isPending;

	// Server-authoritative check-in timestamp â†’ display-only elapsed clock.
	let elapsed = "â€”";
	if (row?.checkIn && !row?.checkOut) {
		const startMs = new Date(`${row.date}T${row.checkIn}Z`).getTime();
		const secs = Math.max(0, Math.floor((nowTick - startMs) / 1000));
		const h = String(Math.floor(secs / 3600)).padStart(2, "0");
		const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
		const s = String(secs % 60).padStart(2, "0");
		elapsed = `${h}:${m}:${s}`;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="mx-auto max-w-2xl space-y-6 p-4 pt-6 md:p-8"
		>
			<div>
				<h2 className="font-bold text-3xl tracking-tight">My Attendance</h2>
				<p className="mt-1 text-muted-foreground">
					Check in from the warehouse. Your location and a live photo are
					verified by the server â€” presence cannot be faked from the app.
				</p>
			</div>

			<div className="rounded-xl border bg-card p-6 shadow-sm">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-muted-foreground text-sm">Current status</p>
						<Badge variant="outline" className={`mt-1 ${label.cls}`}>
							{label.text}
						</Badge>
					</div>
					{row?.checkIn && !row?.checkOut && (
						<div className="text-right">
							<p className="text-muted-foreground text-sm">Elapsed</p>
							<p className="font-mono font-semibold text-2xl tabular-nums">
								{elapsed}
							</p>
						</div>
					)}
				</div>

				{isLoading ? null : today && !today.employeeLinked ? (
					<p className="mt-4 rounded-md bg-amber-50 p-3 text-amber-800 text-sm">
						Your account isn't linked to an employee profile yet. Contact HR
						before you can record attendance.
					</p>
				) : (
					<>
						{/* Live camera preview (getUserMedia, not a gallery picker) */}
						<div className="mt-5 overflow-hidden rounded-lg border bg-black/90">
							{/* biome-ignore lint/a11y/useMediaCaption: live self-view, no audio track */}
							<video
								ref={videoRef}
								playsInline
								muted
								className={`aspect-video w-full object-cover ${cameraOn ? "" : "hidden"}`}
							/>
							{!cameraOn && (
								<div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-white/70">
									<CameraOffIcon className="h-8 w-8" />
									<span className="text-sm">Camera off</span>
								</div>
							)}
						</div>
						<canvas ref={canvasRef} className="hidden" />

						<div className="mt-4 flex flex-wrap gap-3">
							{!cameraOn ? (
								<Button
									variant="secondary"
									onClick={startCamera}
									className="gap-2"
								>
									<CameraIcon className="h-4 w-4" /> Start camera
								</Button>
							) : (
								<Button variant="ghost" onClick={stopCamera} className="gap-2">
									<CameraOffIcon className="h-4 w-4" /> Stop camera
								</Button>
							)}

							{state === "NOT_STARTED" && (
								<Button
									onClick={() => doCheck("checkIn")}
									disabled={pending || !cameraOn}
									className="gap-2 bg-green-600 text-white hover:bg-green-700"
								>
									<LogInIcon className="h-4 w-4" />
									{pending ? "Verifyingâ€¦" : "Check in"}
								</Button>
							)}

							{state === "CHECKED_IN" && (
								<>
									<Button
										variant="outline"
										onClick={() => startBreak.mutate({ type: "tea" })}
										disabled={startBreak.isPending}
										className="gap-2"
									>
										<CoffeeIcon className="h-4 w-4" /> Break
									</Button>
									<Button
										variant="outline"
										onClick={() => startBreak.mutate({ type: "lunch" })}
										disabled={startBreak.isPending}
										className="gap-2"
									>
										<UtensilsIcon className="h-4 w-4" /> Lunch
									</Button>
									<Button
										onClick={() => doCheck("checkOut")}
										disabled={pending || !cameraOn}
										className="gap-2 bg-orange-600 text-white hover:bg-orange-700"
									>
										<LogOutIcon className="h-4 w-4" />
										{pending ? "Verifyingâ€¦" : "Check out"}
									</Button>
								</>
							)}

							{(state === "ON_BREAK" || state === "ON_LUNCH") && (
								<Button
									onClick={() => endBreak.mutate()}
									disabled={endBreak.isPending}
									className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
								>
									<CoffeeIcon className="h-4 w-4" /> End break
								</Button>
							)}

							{state === "COMPLETED" && (
								<p className="flex items-center gap-2 text-muted-foreground text-sm">
									<MapPinIcon className="h-4 w-4" /> You've completed today's
									shift.
								</p>
							)}
						</div>

						{cameraOn && state !== "COMPLETED" && (
							<p className="mt-3 text-muted-foreground text-xs">
								Keep your face in frame â€” a live photo is captured at
								check-in/out.
							</p>
						)}
					</>
				)}
			</div>
		</motion.div>
	);
}
