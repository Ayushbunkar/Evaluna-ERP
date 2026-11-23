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
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	AlertCircleIcon,
	BarcodeIcon,
	BoxesIcon,
	CheckCircle2Icon,
	CheckIcon,
	CopyIcon,
	EyeIcon,
	EyeOffIcon,
	KeyRoundIcon,
	Loader2Icon,
	LockIcon,
	MapPinIcon,
	PackageCheckIcon,
	SaveIcon,
	SettingsIcon,
	ShieldCheckIcon,
	UserCheckIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditorSettingsPage() {
	const trpc = useTRPC();
	const utils = trpc.useUtils();

	// Load logged-in auditor profile
	const {
		data: profile,
		isLoading: profileLoading,
		refetch: refetchProfile,
	} = trpc.users.getMyProfile.useQuery();

	// Profile form states
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [copiedId, setCopiedId] = useState(false);

	// Password change states
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Synchronize profile data into form fields when loaded
	useEffect(() => {
		if (profile) {
			setFullName(profile.name || "");
			setEmail(profile.email || "");
			setPhone(profile.phone || "");
		}
	}, [profile]);

	// Profile update mutation
	const updateProfileMutation = trpc.users.updateMyProfile.useMutation({
		onSuccess: () => {
			toast.success("Auditor profile updated successfully!");
			refetchProfile();
			utils.users.getMyProfile.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update profile.");
		},
	});

	// Password change mutation
	const changePasswordMutation = trpc.users.changeMyPassword.useMutation({
		onSuccess: () => {
			toast.success("Password changed successfully!");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to change password.");
		},
	});

	// Handle saving profile changes (e.g. changing name)
	const handleSaveProfile = (e: React.FormEvent) => {
		e.preventDefault();
		if (!fullName.trim()) {
			toast.error("Full name cannot be empty.");
			return;
		}

		updateProfileMutation.mutate({
			name: fullName.trim(),
			email: email.trim() || undefined,
			phone: phone.trim() || undefined,
		});
	};

	// Handle password change submission
	const handleChangePassword = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newPassword) {
			toast.error("Please enter a new password.");
			return;
		}
		if (newPassword.length < 6) {
			toast.error("New password must be at least 6 characters long.");
			return;
		}
		if (newPassword !== confirmPassword) {
			toast.error("New password and confirm password do not match.");
			return;
		}

		changePasswordMutation.mutate({
			currentPassword: currentPassword || undefined,
			newPassword,
		});
	};

	// 1-Click Copy Auditor ID
	const handleCopyId = (idToCopy: string) => {
		if (!idToCopy) return;
		navigator.clipboard.writeText(idToCopy);
		setCopiedId(true);
		toast.success("Auditor ID copied to clipboard!");
		setTimeout(() => setCopiedId(false), 2000);
	};

	const auditorDisplayId =
		profile?.employeeCode ||
		(profile?.id
			? `AUD-${profile.id.slice(0, 8).toUpperCase()}`
			: "AUD-LOADING");

	return (
		<PageTransition className="mx-auto max-w-5xl space-y-6 pb-12">
			{/* Page Header */}
			<div className="flex flex-col gap-2 border-border/60 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2.5">
						<div className="rounded-lg bg-blue-600/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
							<SettingsIcon className="h-6 w-6" />
						</div>
						<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
							Auditor Account Settings
						</h1>
					</div>
					<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
						Manage your auditor identity, profile credentials, contact info, and
						security password.
					</p>
				</div>

				{/* Auditor Status Pill */}
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="border-blue-500/30 bg-blue-500/10 px-3 py-1 font-semibold text-blue-700 text-xs dark:text-blue-300"
					>
						<ShieldCheckIcon className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
						Role: Internal Auditor
					</Badge>
					<Badge
						variant="outline"
						className="border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-700 text-xs dark:text-emerald-300"
					>
						<CheckCircle2Icon className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
						Status: {profile?.status || "ACTIVE"}
					</Badge>
				</div>
			</div>

			{profileLoading ? (
				<div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-card p-12">
					<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
					<p className="font-medium text-muted-foreground text-sm">
						Loading auditor settings & credentials...
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Left Column: Auditor ID & Overview Card */}
					<div className="space-y-6 lg:col-span-1">
						{/* Auditor ID Card */}
						<Card className="border-border/60 bg-card shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-base">
									<UserCheckIcon className="h-5 w-5 text-blue-600" />
									Auditor Identity
								</CardTitle>
								<CardDescription className="text-xs">
									Official system identification details
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Avatar Preview */}
								<div className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/40 p-3.5">
									<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xl shadow-md">
										{fullName ? fullName.slice(0, 2).toUpperCase() : "AU"}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate font-bold text-foreground text-sm">
											{profile?.name || "Evaluna Auditor"}
										</p>
										<p className="truncate text-muted-foreground text-xs">
											{profile?.email || "auditor@evaluna.com"}
										</p>
										<div className="mt-1 flex items-center gap-1.5">
											<span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
											<span className="font-medium text-[11px] text-emerald-600 capitalize dark:text-emerald-400">
												{profile?.status || "Active Session"}
											</span>
										</div>
									</div>
								</div>

								{/* Official ID Box */}
								<div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
									<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Auditor Employee ID
									</Label>
									<div className="mt-1.5 flex items-center justify-between gap-2">
										<span className="font-bold font-mono text-base text-foreground tracking-wide">
											{auditorDisplayId}
										</span>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => handleCopyId(auditorDisplayId)}
											className="h-8 gap-1.5 border-blue-200 bg-white text-blue-700 text-xs shadow-xs hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800"
										>
											{copiedId ? (
												<>
													<CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
													<span>Copied</span>
												</>
											) : (
												<>
													<CopyIcon className="h-3.5 w-3.5" />
													<span>Copy</span>
												</>
											)}
										</Button>
									</div>
								</div>

								{/* User UUID */}
								<div className="rounded-lg border border-border/50 bg-muted/20 p-3">
									<div className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">
											System Account UUID:
										</span>
										<button
											type="button"
											onClick={() => handleCopyId(profile?.id || "")}
											className="font-medium text-[11px] text-blue-600 hover:underline"
										>
											Copy UUID
										</button>
									</div>
									<p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
										{profile?.id || "N/A"}
									</p>
								</div>

								{/* Metadata list */}
								<div className="space-y-2 border-border/50 border-t pt-3 text-xs">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Assigned Role:
										</span>
										<span className="font-semibold text-foreground capitalize">
											{profile?.role || "Auditor"}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											Branch Association:
										</span>
										<span className="font-medium text-foreground">
											{profile?.branchId
												? `Branch #${profile.branchId}`
												: "All Warehouse Locations"}
										</span>
									</div>
									{profile?.createdAt && (
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground">
												Member Since:
											</span>
											<span className="font-medium text-foreground">
												{new Date(profile.createdAt).toLocaleDateString(
													undefined,
													{
														year: "numeric",
														month: "short",
														day: "numeric",
													},
												)}
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Audit Scope / Permissions Card */}
						<Card className="border-border/60 bg-card shadow-sm">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 font-bold text-sm">
									<ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
									Auditor Privileges & Scope
								</CardTitle>
								<CardDescription className="text-xs">
									Active functional access rights
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2.5 text-xs">
								<div className="flex items-center gap-2 text-muted-foreground">
									<CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-500" />
									<span>Physical Stock Audits & Discrepancies</span>
								</div>
								<div className="flex items-center gap-2 text-muted-foreground">
									<BarcodeIcon className="h-4 w-4 shrink-0 text-emerald-500" />
									<span>UPC Barcode Integrity Audits</span>
								</div>
								<div className="flex items-center gap-2 text-muted-foreground">
									<PackageCheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
									<span>Inbound Dock Receiving Inspections</span>
								</div>
								<div className="flex items-center gap-2 text-muted-foreground">
									<BoxesIcon className="h-4 w-4 shrink-0 text-emerald-500" />
									<span>Warehouse Rack/Bin Placement Verification</span>
								</div>
								<div className="flex items-center gap-2 text-muted-foreground">
									<MapPinIcon className="h-4 w-4 shrink-0 text-emerald-500" />
									<span>Audit Findings & Action Escalations</span>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Column: Name Changing Form & Password Changing Form */}
					<div className="space-y-6 lg:col-span-2">
						{/* 1. Change Name & Contact Details */}
						<Card className="border-border/60 bg-card shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-base">
									<UserIcon className="h-5 w-5 text-blue-600" />
									Auditor Profile Information
								</CardTitle>
								<CardDescription className="text-xs">
									Update your auditor display name, registered contact number,
									and profile details.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSaveProfile} className="space-y-4">
									{/* Name field (Primary requirement) */}
									<div className="space-y-1.5">
										<Label
											htmlFor="auditorName"
											className="font-semibold text-foreground text-xs"
										>
											Full Name <span className="text-red-500">*</span>
										</Label>
										<Input
											id="auditorName"
											type="text"
											value={fullName}
											onChange={(e) => setFullName(e.target.value)}
											placeholder="Enter your full name"
											required
											className="h-10 border-border/80 text-sm focus-visible:ring-blue-500"
										/>
										<p className="text-[11px] text-muted-foreground">
											This name is recorded on all physical audit logs, barcode
											verifications, and discrepancy reports.
										</p>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										{/* Email field */}
										<div className="space-y-1.5">
											<Label
												htmlFor="auditorEmail"
												className="font-semibold text-foreground text-xs"
											>
												Email Address (Login ID)
											</Label>
											<Input
												id="auditorEmail"
												type="email"
												value={email}
												onChange={(e) => setEmail(e.target.value)}
												placeholder="auditor@evaluna.com"
												className="h-10 border-border/80 text-sm"
											/>
										</div>

										{/* Phone field */}
										<div className="space-y-1.5">
											<Label
												htmlFor="auditorPhone"
												className="font-semibold text-foreground text-xs"
											>
												Phone Number (Mobile)
											</Label>
											<Input
												id="auditorPhone"
												type="tel"
												value={phone}
												onChange={(e) => setPhone(e.target.value)}
												placeholder="+91 98765 43210"
												className="h-10 border-border/80 text-sm"
											/>
										</div>
									</div>

									<div className="flex items-center justify-end pt-3">
										<Button
											type="submit"
											disabled={updateProfileMutation.isPending}
											className="gap-2 bg-blue-600 px-5 font-semibold text-white text-xs shadow-xs hover:bg-blue-700"
										>
											{updateProfileMutation.isPending ? (
												<>
													<Loader2Icon className="h-4 w-4 animate-spin" />
													<span>Saving Changes...</span>
												</>
											) : (
												<>
													<SaveIcon className="h-4 w-4" />
													<span>Save Profile Changes</span>
												</>
											)}
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>

						{/* 2. Change Password Card */}
						<Card className="border-border/60 bg-card shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-base">
									<KeyRoundIcon className="h-5 w-5 text-amber-600" />
									Change Password & Security
								</CardTitle>
								<CardDescription className="text-xs">
									Reset your password to ensure your auditor terminal
									credentials remain secure.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleChangePassword} className="space-y-4">
									{/* Current Password (Optional if user doesn't remember or admin assigned) */}
									<div className="space-y-1.5">
										<Label
											htmlFor="currentPassword"
											className="font-semibold text-foreground text-xs"
										>
											Current Password
										</Label>
										<div className="relative">
											<Input
												id="currentPassword"
												type={showCurrentPassword ? "text" : "password"}
												value={currentPassword}
												onChange={(e) => setCurrentPassword(e.target.value)}
												placeholder="Enter current password (if set)"
												className="h-10 border-border/80 pr-10 text-sm"
											/>
											<button
												type="button"
												onClick={() =>
													setShowCurrentPassword(!showCurrentPassword)
												}
												className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
												tabIndex={-1}
											>
												{showCurrentPassword ? (
													<EyeOffIcon className="h-4 w-4" />
												) : (
													<EyeIcon className="h-4 w-4" />
												)}
											</button>
										</div>
									</div>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										{/* New Password */}
										<div className="space-y-1.5">
											<Label
												htmlFor="newPassword"
												className="font-semibold text-foreground text-xs"
											>
												New Password <span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<Input
													id="newPassword"
													type={showNewPassword ? "text" : "password"}
													value={newPassword}
													onChange={(e) => setNewPassword(e.target.value)}
													placeholder="Minimum 6 characters"
													required
													minLength={6}
													className="h-10 border-border/80 pr-10 text-sm"
												/>
												<button
													type="button"
													onClick={() => setShowNewPassword(!showNewPassword)}
													className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
													tabIndex={-1}
												>
													{showNewPassword ? (
														<EyeOffIcon className="h-4 w-4" />
													) : (
														<EyeIcon className="h-4 w-4" />
													)}
												</button>
											</div>
										</div>

										{/* Confirm New Password */}
										<div className="space-y-1.5">
											<Label
												htmlFor="confirmPassword"
												className="font-semibold text-foreground text-xs"
											>
												Confirm New Password{" "}
												<span className="text-red-500">*</span>
											</Label>
											<div className="relative">
												<Input
													id="confirmPassword"
													type={showConfirmPassword ? "text" : "password"}
													value={confirmPassword}
													onChange={(e) => setConfirmPassword(e.target.value)}
													placeholder="Re-enter new password"
													required
													minLength={6}
													className="h-10 border-border/80 pr-10 text-sm"
												/>
												<button
													type="button"
													onClick={() =>
														setShowConfirmPassword(!showConfirmPassword)
													}
													className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
													tabIndex={-1}
												>
													{showConfirmPassword ? (
														<EyeOffIcon className="h-4 w-4" />
													) : (
														<EyeIcon className="h-4 w-4" />
													)}
												</button>
											</div>
										</div>
									</div>

									{/* Password helper hints */}
									<div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-700 text-xs dark:text-amber-300">
										<AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
										<span>
											Make sure your new password is at least 6 characters long.
											For security, combine letters, numbers, and symbols.
										</span>
									</div>

									<div className="flex items-center justify-end pt-3">
										<Button
											type="submit"
											disabled={changePasswordMutation.isPending}
											className="gap-2 bg-amber-600 px-5 font-semibold text-white text-xs shadow-xs hover:bg-amber-700"
										>
											{changePasswordMutation.isPending ? (
												<>
													<Loader2Icon className="h-4 w-4 animate-spin" />
													<span>Updating Password...</span>
												</>
											) : (
												<>
													<LockIcon className="h-4 w-4" />
													<span>Update Password</span>
												</>
											)}
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</PageTransition>
	);
}
