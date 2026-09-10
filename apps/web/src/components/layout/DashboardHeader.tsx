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
import {
	Bell,
	Check,
	Clock,
	Globe,
	LogOut,
	RefreshCw,
	Settings,
	ShieldAlert,
	Store,
	UserCircle,
	User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc/client";

export function DashboardHeader() {
	const router = useRouter();
	const pathname = usePathname();
	const locale = "en"; // default; replace with useLocale() once next-intl is confirmed in scope
	const trpc = useTRPC();

	// State
	const [isSyncing, setIsSyncing] = useState(false);
	const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

	// Modals for Profile and Account Settings
	const [profileOpen, setProfileOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);

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

	// Queries
	const sessionData = useSession();
	const user = sessionData.session?.user;

	const { data: branches } = trpc.branches.list.useQuery(undefined);
	const { data: unreadCountData } = trpc.notifications.unreadCount.useQuery({});
	const unreadCount = unreadCountData?.count || 0;
	const { data: attendanceStatus } = trpc.attendance.myStatus.useQuery();

	// Handlers
	const handleLogout = () => {
		// Navigate to the server-side logout route.
		// /api/logout invalidates the session in the DB and clears HttpOnly cookies
		// via Set-Cookie response headers — the ONLY reliable way to log out.
		window.location.href = "/api/logout";
	};

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			// Invalidate and refetch all active queries
			await queryClient.invalidateQueries();
		} finally {
			setTimeout(() => setIsSyncing(false), 500); // UI feedback
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

	// Determine Attendance State Label
	let attendanceLabel = "Clocked Out";
	let attendanceColor = "text-muted-foreground";
	if (attendanceStatus?.activeShift) {
		if (attendanceStatus.activeShift.shift_status === "active") {
			attendanceLabel = "Clocked In";
			attendanceColor = "text-green-600";
		} else if (attendanceStatus.activeShift.shift_status === "on_break") {
			attendanceLabel = "On Break";
			attendanceColor = "text-yellow-600";
		}
	}

	// Branch Selection Label
	const selectedBranchName =
		branches?.find((b: any) => b.id.toString() === selectedBranchId)?.name ||
		"All Branches";

	return (
		<header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center gap-4 border-border/50 border-b bg-white/80 px-4 shadow-sm backdrop-blur-md sm:px-6 dark:bg-gray-900/80">
			{/* 1. Branding (Hidden on desktop to avoid duplication with sidebar) */}
			<div className="flex lg:hidden items-center gap-2">
				<Link href="/admin" className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
						<ShieldAlert className="h-5 w-5 text-blue-600" />
					</div>
					<span className="hidden font-bold text-foreground text-lg tracking-tight sm:inline-block">
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

						{/* 5. Attendance Status */}
						<Button
							variant="ghost"
							size="sm"
							className={`hidden h-8 gap-2 sm:flex ${attendanceColor}`}
							aria-label="Attendance status"
						>
							<Clock className="h-4 w-4" />
							<span className="font-medium text-xs">{attendanceLabel}</span>
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

				{/* 8. User Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-full border border-border/50 bg-secondary/50"
							aria-label="Open profile menu"
						>
							<UserIcon className="h-4 w-4 text-foreground" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[220px]">
						<div className="flex items-center justify-start gap-2 p-2">
							<div className="flex flex-col space-y-1 leading-none">
								{user?.name && (
									<p className="font-medium text-sm">{user.name}</p>
								)}
								{user?.email && (
									<p className="w-[200px] truncate text-muted-foreground text-sm">
										{user.email}
									</p>
								)}
							</div>
						</div>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={() => setProfileOpen(true)}
							className="flex cursor-pointer items-center"
						>
							<UserCircle className="mr-2 h-4 w-4" />
							<span>Profile</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => {
								setNewPwd("");
								setConfirmPwd("");
								setSettingsOpen(true);
							}}
							className="flex cursor-pointer items-center"
						>
							<Settings className="mr-2 h-4 w-4" />
							<span>Account Settings</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={handleLogout}
							className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
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
		</header>
	);
}
