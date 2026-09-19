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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@evaluna/ui/components/dropdown-menu";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { useQueryClient } from "@tanstack/react-query";
import {
	Bell,
	Camera,
	CameraOff,
	Check,
	Clock,
	Coffee,
	Globe,
	LogIn,
	LogOut,
	MapPin,
	Menu,
	RefreshCw,
	Settings,
	ShieldAlert,
	Store,
	UserCircle,
	User as UserIcon,
	Utensils,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { useBranch } from "@/lib/branch-context";
import { useTRPC } from "@/lib/trpc/client";

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void } = {}) {
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// State
	const [isSyncing, setIsSyncing] = useState(false);
	const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

	// Modals for Profile, Account Settings, and Attendance
	const [profileOpen, setProfileOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [attendanceOpen, setAttendanceOpen] = useState(false);
	const [workNotes, setWorkNotes] = useState("");

	const { activeBranchId } = useBranch();
	const sessionData = useSession();
	const user = sessionData.session?.user;

	// Queries
	const { data: branches } = trpc.branches.list.useQuery(undefined);
	const { data: unreadCountData } = trpc.notifications.unreadCount.useQuery({});
	const unreadCount = unreadCountData?.count || 0;
	const { data: todayAttendance, refetch: refetchToday } =
		trpc.attendance.getToday.useQuery(undefined, { refetchInterval: 30000 });

	// Camera & GPS State for Production Attendance
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [cameraOn, setCameraOn] = useState(false);
	const [attendanceBusy, setAttendanceBusy] = useState(false);

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

	const captureAndUpload = useCallback(
		async (kind: "checkIn" | "checkOut"): Promise<number> => {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			if (!video || !canvas || !streamRef.current)
				throw new Error("Start the camera first — a live photo is required.");
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

	const checkInMutation = trpc.attendance.checkIn.useMutation({
		onSuccess: (r) => {
			stopCamera();
			void refetchToday();
			toast.success(
				r.flagged
					? "Checked in — flagged for HR review."
					: `Checked in successfully at ${r.checkInTime}!`,
			);
			setAttendanceOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	const checkOutMutation = trpc.attendance.checkOut.useMutation({
		onSuccess: (r) => {
			stopCamera();
			void refetchToday();
			toast.success(
				`Checked out — ${r.workingHours}h worked (${r.breakMinutes}m breaks).`,
			);
			setAttendanceOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	const startBreakMutation = trpc.attendance.startBreak.useMutation({
		onSuccess: () => {
			void refetchToday();
			toast.success("Break started.");
		},
		onError: (err) => toast.error(err.message),
	});

	const endBreakMutation = trpc.attendance.endBreak.useMutation({
		onSuccess: (r) => {
			void refetchToday();
			toast.success(`Break ended (${r.durationMinutes}m).`);
		},
		onError: (err) => toast.error(err.message),
	});

	const doCheck = useCallback(
		async (kind: "checkIn" | "checkOut") => {
			const effectiveBranchId = activeBranchId || (user as any)?.branchId || 1;
			setAttendanceBusy(true);
			try {
				const gps = await new Promise<{
					latitude: number;
					longitude: number;
					accuracy: number;
					deviceTimestamp: string;
				}>((resolve, reject) => {
					if (!("geolocation" in navigator)) {
						reject(new Error("This device has no GPS support."));
						return;
					}
					navigator.geolocation.getCurrentPosition(
						(pos) =>
							resolve({
								latitude: pos.coords.latitude,
								longitude: pos.coords.longitude,
								accuracy: Math.min(pos.coords.accuracy || 20, 200),
								deviceTimestamp: new Date(pos.timestamp).toISOString(),
							}),
						(err) =>
							reject(
								new Error(
									err.code === err.PERMISSION_DENIED
										? "Location permission denied. Attendance requires location access."
										: "Could not read location. Move to open sky and retry.",
								),
							),
						{ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
					);
				});

				const imageAttachmentId = await captureAndUpload(kind);
				const device = {
					fingerprint: `fp_${Math.abs(user?.id ? user.id.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0) : 12345).toString(36)}`,
					userAgent:
						typeof navigator !== "undefined" ? navigator.userAgent : "browser",
				};

				if (kind === "checkIn") {
					await checkInMutation.mutateAsync({
						branchId: effectiveBranchId,
						gps,
						imageAttachmentId,
						device,
					});
				} else {
					await checkOutMutation.mutateAsync({
						gps,
						imageAttachmentId,
						device,
					});
				}
			} catch (e: any) {
				toast.error(e?.message || "Something went wrong during check-in/out.");
			} finally {
				setAttendanceBusy(false);
			}
		},
		[activeBranchId, user, captureAndUpload, checkInMutation, checkOutMutation],
	);

	// Change Password State
	const [newPwd, setNewPwd] = useState("");
	const [confirmPwd, setConfirmPwd] = useState("");

	const changePasswordMutation = trpc.users.resetCredentials.useMutation({
		onSuccess: () => {
			toast.success("Password changed successfully!");
			setNewPwd("");
			setConfirmPwd("");
			setSettingsOpen(false);
		},
		onError: (err) => {
			toast.error(`Failed to change password: ${err.message}`);
		},
	});

	// Notifications Queries & Mutations
	const { data: notificationsList, refetch: refetchNotifs } =
		trpc.notifications.list.useQuery({ limit: 10 }, { enabled: notifOpen });

	const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [["notifications", "unreadCount"]],
			});
			void refetchNotifs();
		},
		onError: (err) => {
			toast.error(`Failed to mark read: ${err.message}`);
		},
	});

	const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [["notifications", "unreadCount"]],
			});
			void refetchNotifs();
			toast.success("All notifications marked as read.");
		},
		onError: (err) => {
			toast.error(`Failed to mark all read: ${err.message}`);
		},
	});

	// Handlers
	const handleLogout = () => {
		window.location.href = "/api/logout";
	};

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			await queryClient.invalidateQueries();
		} finally {
			setTimeout(() => setIsSyncing(false), 500);
		}
	};

	const handleLanguageChange = (newLocale: string) => {
		document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
		router.refresh();
	};

	// Compute breadcrumb path
	const breadcrumbText =
		pathname === "/admin"
			? "/ Dashboard"
			: `/ ${(pathname || "")
					.split("/")
					.filter(Boolean)
					.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
					.join(" / ")}`;

	// Determine Attendance State Label from Production getToday Query
	const currentState = todayAttendance?.state ?? "NOT_STARTED";
	let attendanceLabel = "Clocked Out";
	let attendanceColor = "text-muted-foreground";

	if (currentState === "CHECKED_IN") {
		attendanceLabel = "Clocked In";
		attendanceColor = "text-green-600";
	} else if (currentState === "ON_BREAK" || currentState === "ON_LUNCH") {
		attendanceLabel = "On Break";
		attendanceColor = "text-yellow-600";
	} else if (currentState === "COMPLETED") {
		attendanceLabel = "Shift Done";
		attendanceColor = "text-blue-600";
	}

	// Branch Selection Label
	const selectedBranchName =
		branches?.find((b: any) => b.id.toString() === selectedBranchId)?.name ||
		"All Branches";

	return (
		<header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center gap-2 border-border/50 border-b bg-white/80 px-3 shadow-sm backdrop-blur-md sm:gap-4 sm:px-6 dark:bg-gray-900/80">
			{/* Mobile Hamburger Button */}
			{onMenuClick && (
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 shrink-0 md:hidden"
					onClick={onMenuClick}
					aria-label="Toggle Navigation Menu"
				>
					<Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
				</Button>
			)}

			{/* 1. Branding (Hidden on desktop to avoid duplication with sidebar) */}
			<div className="flex items-center gap-2 md:hidden">
				<Link href="/" className="flex items-center gap-2">
					<img
						src="/logo.jpg"
						alt="Evaluna ERP"
						className="h-7 w-7 rounded-lg object-cover shadow-sm ring-1 ring-border/50"
					/>
					<span className="hidden font-bold text-foreground text-base tracking-tight sm:inline-block">
						Evaluna ERP
					</span>
				</Link>
			</div>
			{/* 2. Breadcrumbs */}
			<div className="hidden flex-1 items-center gap-2 text-muted-foreground text-sm sm:flex">
				<span className="max-w-[200px] truncate lg:max-w-[400px]">
					{breadcrumbText}
				</span>
			</div>
			<div className="flex-1 sm:hidden" /> {/* Spacer for mobile */}
			{/* Action Controls */}
			<div className="flex items-center gap-2">
				{/* 3. Sync Button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={handleSync}
					disabled={isSyncing}
					title="Sync data"
					aria-label="Sync data"
				>
					<RefreshCw
						className={`h-4 w-4 ${isSyncing ? "animate-spin text-primary" : "text-muted-foreground"}`}
					/>
				</Button>

				{/* 4. Notification Button */}
				<Button
					variant="ghost"
					size="icon"
					className="relative h-8 w-8"
					title="Notifications"
					aria-label="Notifications"
					onClick={() => setNotifOpen(true)}
				>
					<Bell className="h-4 w-4 text-muted-foreground" />
					{unreadCount > 0 && (
						<span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive" />
					)}
				</Button>

				{!pathname?.startsWith("/superadmin") && (
					<>
						<div className="hidden h-5 w-px bg-border/50 sm:block" />

						{/* 5. Attendance Status Button & Modal Trigger */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setAttendanceOpen(true)}
							className={`h-8 w-8 p-0 sm:w-auto sm:px-2.5 sm:gap-2 border-slate-200 bg-slate-50/80 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-800 ${attendanceColor}`}
							aria-label="Attendance status"
							title="Click to Check In / Check Out"
						>
							<Clock className="h-4 w-4" />
							<span className="hidden font-semibold text-xs sm:inline">{attendanceLabel}</span>
						</Button>
					</>
				)}

				<div className="hidden h-5 w-px bg-border/50 sm:block" />

				{/* 6. Branch Selector */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="hidden h-8 gap-2 sm:flex"
							aria-label="Select branch"
						>
							<Store className="h-4 w-4 text-muted-foreground" />
							<span className="max-w-[100px] truncate text-xs">
								{selectedBranchName}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[200px]">
						<DropdownMenuLabel>Select Branch</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => setSelectedBranchId(null)}>
							All Branches
						</DropdownMenuItem>
						{branches?.map((branch: any) => (
							<DropdownMenuItem
								key={branch.id}
								onClick={() => setSelectedBranchId(branch.id.toString())}
							>
								{branch.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* 7. Language Selector */}
				<LocaleSwitcher />

				{/* 8. Unified User Profile Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-8 p-0 sm:w-auto sm:px-3 sm:gap-2 rounded-full sm:rounded-lg border-slate-200 bg-white font-medium text-slate-700 text-xs shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
							aria-label="Open profile menu"
						>
							<UserIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
							<span className="hidden sm:inline">Profile</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[230px]">
						<div className="flex items-center justify-start gap-2 p-2.5">
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 font-bold text-blue-600 text-xs">
								{user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
							</div>
							<div className="flex flex-col space-y-0.5 leading-tight">
								{user?.name && (
									<p className="font-semibold text-slate-900 text-sm dark:text-slate-100">
										{user.name}
									</p>
								)}
								{user?.email && (
									<p className="w-[150px] truncate text-muted-foreground text-xs">
										{user.email}
									</p>
								)}
							</div>
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={() => setProfileOpen(true)}
							className="flex cursor-pointer items-center text-xs"
						>
							<UserCircle className="mr-2 h-4 w-4 text-slate-500" />
							<span>View Profile Details</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								setNewPwd("");
								setConfirmPwd("");
								setSettingsOpen(true);
							}}
							className="flex cursor-pointer items-center text-xs"
						>
							<Settings className="mr-2 h-4 w-4 text-slate-500" />
							<span>Account Security</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={handleLogout}
							className="flex cursor-pointer items-center font-medium text-destructive text-xs focus:bg-destructive focus:text-destructive-foreground"
						>
							<LogOut className="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			{/* Profile Dialog Modal */}
			<Dialog open={profileOpen} onOpenChange={setProfileOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>My Profile Details</DialogTitle>
						<DialogDescription>
							Overview of your authenticated ERP system credentials.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-3">
						<div className="flex items-center justify-center pb-2">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
								<UserIcon className="h-8 w-8" />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 border-border/40 border-b pb-4 text-xs sm:text-sm">
							<div>
								<span className="block font-semibold text-muted-foreground text-xs">
									Full Name
								</span>
								<span className="font-medium text-foreground">
									{user?.name || "N/A"}
								</span>
							</div>
							<div>
								<span className="block font-semibold text-muted-foreground text-xs">
									Email / Login ID
								</span>
								<span className="font-medium text-foreground">
									{user?.email || "N/A"}
								</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
							<div>
								<span className="block font-semibold text-muted-foreground text-xs">
									Primary Role
								</span>
								<span className="font-medium text-foreground capitalize">
									{user?.role
										? user.role.toUpperCase().replace("_", " ")
										: "N/A"}
								</span>
							</div>
							<div>
								<span className="block font-semibold text-muted-foreground text-xs">
									Account Status
								</span>
								<span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 font-medium text-green-700 text-xs dark:text-green-400">
									Active Login
								</span>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							className="w-full"
							onClick={() => setProfileOpen(false)}
						>
							Close Profile
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* Account Settings Dialog Modal */}
			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Account Security Settings</DialogTitle>
						<DialogDescription>
							Manage security settings and reset your user account password.
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (newPwd.length < 8) {
								toast.error("Password must be at least 8 characters.");
								return;
							}
							if (newPwd !== confirmPwd) {
								toast.error("Passwords do not match.");
								return;
							}
							changePasswordMutation.mutate({
								userId: user?.id || "",
								newPassword: newPwd,
								forcePasswordChange: false,
							});
						}}
						className="space-y-4 py-2"
					>
						<div className="space-y-1">
							<Label htmlFor="currentName">My Name (Read Only)</Label>
							<Input
								id="currentName"
								value={user?.name || ""}
								disabled
								className="cursor-not-allowed bg-muted/40"
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="currentEmail">
								My Email / Login ID (Read Only)
							</Label>
							<Input
								id="currentEmail"
								value={user?.email || ""}
								disabled
								className="cursor-not-allowed bg-muted/40"
							/>
						</div>

						<div className="space-y-3 border-border/40 border-t pt-3">
							<h4 className="font-semibold text-foreground text-sm">
								Change Password
							</h4>

							<div className="space-y-1">
								<Label htmlFor="newPwd">New Password *</Label>
								<Input
									id="newPwd"
									type="password"
									value={newPwd}
									onChange={(e) => setNewPwd(e.target.value)}
									placeholder="At least 8 characters"
									required
								/>
							</div>

							<div className="space-y-1">
								<Label htmlFor="confirmPwd">Confirm New Password *</Label>
								<Input
									id="confirmPwd"
									type="password"
									value={confirmPwd}
									onChange={(e) => setConfirmPwd(e.target.value)}
									placeholder="Re-enter new password"
									required
								/>
							</div>
						</div>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setSettingsOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={changePasswordMutation.isPending}>
								{changePasswordMutation.isPending
									? "Saving..."
									: "Change Password"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
			{/* Notifications Dialog Modal */}
			<Dialog open={notifOpen} onOpenChange={setNotifOpen}>
				<DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
					<DialogHeader className="flex flex-row items-center justify-between border-border/40 border-b pb-3">
						<div>
							<DialogTitle className="font-bold text-base">
								Notifications Inbox
							</DialogTitle>
							<DialogDescription className="mt-0.5 text-muted-foreground text-xs">
								System-wide alerts, activities, and operational warnings.
							</DialogDescription>
						</div>
						{unreadCount > 0 && (
							<Button
								variant="outline"
								size="xs"
								className="h-7 text-xs"
								disabled={markAllAsReadMutation.isPending}
								onClick={() => markAllAsReadMutation.mutate({})}
							>
								Mark All Read
							</Button>
						)}
					</DialogHeader>

					<div className="max-h-96 space-y-3 divide-y divide-border/30 overflow-y-auto py-2">
						{notificationsList && notificationsList.length > 0 ? (
							notificationsList.map((notif: any) => (
								<div
									key={notif.id}
									className="flex items-start justify-between gap-3 pt-3 text-xs first:pt-0 sm:text-sm"
								>
									<div className="flex-1 space-y-1">
										<div className="flex items-center gap-1.5">
											<span
												className={`h-2 w-2 flex-shrink-0 rounded-full ${
													notif.is_read
														? "bg-transparent"
														: "animate-pulse bg-red-500"
												}`}
											/>
											<span className="font-semibold text-foreground">
												{notif.title}
											</span>
											<span className="ml-auto text-[10px] text-muted-foreground">
												{notif.created_at
													? new Date(notif.created_at).toLocaleDateString()
													: ""}
											</span>
										</div>
										<p className="text-muted-foreground text-xs leading-normal">
											{notif.message}
										</p>
									</div>

									{!notif.is_read && (
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-blue-500 hover:text-blue-600"
											disabled={markAsReadMutation.isPending}
											onClick={() =>
												markAsReadMutation.mutate({ id: notif.id })
											}
											title="Mark as read"
										>
											<Check className="h-3.5 w-3.5" />
										</Button>
									)}
								</div>
							))
						) : (
							<div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<Bell className="h-8 w-8 text-muted-foreground/40" />
								<span>No notifications received yet.</span>
							</div>
						)}
					</div>

					<DialogFooter className="border-border/40 border-t pt-2">
						<Button
							type="button"
							className="w-full"
							onClick={() => setNotifOpen(false)}
						>
							Close Inbox
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* Attendance Action Dialog Modal */}
			<Dialog
				open={attendanceOpen}
				onOpenChange={(open) => {
					setAttendanceOpen(open);
					if (!open) stopCamera();
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-base">
							<Clock className="h-5 w-5 text-blue-600" />
							Employee Attendance & Live Geofence
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-xs">
							Verified attendance requires live GPS coordinates and a camera
							selfie preview.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">
									Logged-in Employee:
								</span>
								<span className="font-semibold text-foreground">
									{user?.name || user?.email || "Employee"}
								</span>
							</div>
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Assigned Role:</span>
								<span className="font-semibold text-blue-700 capitalize">
									{(user as any)?.role?.replace("_", " ") || "Staff"}
								</span>
							</div>
							<div className="flex items-center justify-between border-blue-200/40 border-t pt-2 text-xs">
								<span className="text-muted-foreground">Shift Status:</span>
								<span className={`font-bold text-xs ${attendanceColor}`}>
									● {attendanceLabel}
								</span>
							</div>
							{todayAttendance?.row?.checkIn && (
								<div className="flex items-center justify-between text-xs">
									<span className="text-muted-foreground">Check-in Time:</span>
									<span className="font-medium font-mono text-foreground">
										{(() => {
											const [h, m, s] = (
												todayAttendance.row.checkIn || ""
											).split(":");
											if (!h || !m) return todayAttendance.row.checkIn;
											const date = new Date();
											date.setHours(
												Number.parseInt(h, 10),
												Number.parseInt(m, 10),
												Number.parseInt(s || "0", 10),
											);
											return date.toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
											});
										})()}
									</span>
								</div>
							)}
						</div>

						{todayAttendance && !todayAttendance.employeeLinked ? (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-xs">
								Your account isn't linked to an employee profile yet. Please ask
								your Manager to backfill staff profiles from the Manager
								Dashboard.
							</div>
						) : (
							<div className="space-y-3">
								<div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-black/90">
									<video
										ref={videoRef}
										playsInline
										muted
										className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
									/>
									{!cameraOn && (
										<div className="flex flex-col items-center gap-1.5 text-white/70 text-xs">
											<CameraOff className="h-7 w-7 text-muted-foreground" />
											<span>Camera Off</span>
										</div>
									)}
								</div>
								<canvas ref={canvasRef} className="hidden" />

								<div className="flex flex-wrap gap-2 pt-1">
									{!cameraOn ? (
										<Button
											type="button"
											variant="outline"
											onClick={startCamera}
											className="w-full gap-2 text-xs"
										>
											<Camera className="h-4 w-4 text-blue-600" /> Start Live
											Camera
										</Button>
									) : (
										<Button
											type="button"
											variant="ghost"
											onClick={stopCamera}
											className="w-full gap-2 text-muted-foreground text-xs"
										>
											<CameraOff className="h-4 w-4" /> Stop Camera
										</Button>
									)}

									{currentState === "NOT_STARTED" && (
										<Button
											type="button"
											disabled={
												attendanceBusy || !cameraOn || checkInMutation.isPending
											}
											onClick={() => doCheck("checkIn")}
											className="w-full gap-2 bg-green-600 font-semibold text-white text-xs hover:bg-green-700"
										>
											<LogIn className="h-4 w-4" />
											{attendanceBusy || checkInMutation.isPending
												? "Verifying GPS & Check-In Selfie..."
												: "Take Check-In Selfie & Check In"}
										</Button>
									)}

									{currentState === "CHECKED_IN" && (
										<div className="w-full space-y-2">
											<div className="grid grid-cols-2 gap-2">
												<Button
													type="button"
													variant="outline"
													disabled={startBreakMutation.isPending}
													onClick={() =>
														startBreakMutation.mutate({ type: "tea" })
													}
													className="gap-1.5 text-xs"
												>
													<Coffee className="h-3.5 w-3.5 text-amber-600" /> Tea
													Break
												</Button>
												<Button
													type="button"
													variant="outline"
													disabled={startBreakMutation.isPending}
													onClick={() =>
														startBreakMutation.mutate({ type: "lunch" })
													}
													className="gap-1.5 text-xs"
												>
													<Utensils className="h-3.5 w-3.5 text-orange-600" />{" "}
													Lunch Break
												</Button>
											</div>

											<Button
												type="button"
												disabled={
													attendanceBusy ||
													!cameraOn ||
													checkOutMutation.isPending
												}
												onClick={() => doCheck("checkOut")}
												className="w-full gap-2 bg-orange-600 font-semibold text-white text-xs hover:bg-orange-700"
											>
												<LogOut className="h-4 w-4" />
												{attendanceBusy || checkOutMutation.isPending
													? "Verifying GPS & Check-Out Selfie..."
													: "Take Check-Out Selfie & Check Out"}
											</Button>
										</div>
									)}

									{(currentState === "ON_BREAK" ||
										currentState === "ON_LUNCH") && (
										<Button
											type="button"
											disabled={endBreakMutation.isPending}
											onClick={() => endBreakMutation.mutate()}
											className="w-full gap-2 bg-amber-600 font-semibold text-white text-xs hover:bg-amber-700"
										>
											<Coffee className="h-4 w-4" /> End Break & Resume Duty
										</Button>
									)}

									{currentState === "COMPLETED" && (
										<p className="flex w-full items-center justify-center gap-1 text-center text-muted-foreground text-xs">
											<MapPin className="h-3.5 w-3.5 text-blue-500" /> Shift
											complete for today.
										</p>
									)}
								</div>
							</div>
						)}
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								stopCamera();
								setAttendanceOpen(false);
							}}
							className="w-full text-xs"
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</header>
	);
}
