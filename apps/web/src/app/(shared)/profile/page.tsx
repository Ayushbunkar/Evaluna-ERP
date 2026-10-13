import { UserManagement } from "@evaluna/db";
import { account as accountTable, user as userTable } from "@evaluna/db/schema";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { eq } from "drizzle-orm";
import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	Globe,
	Lock,
	Mail,
	RefreshCw,
	Shield,
	ShieldCheck,
	Sparkles,
	User as UserIcon,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCanonicalDashboardRoute } from "@/lib/rbac-config";
import { ProfileEditor } from "./profile-editor";

export const metadata = {
	title: "My Profile | Evaluna ERP",
	description: "Manage your user profile and synchronization details.",
};

export default async function ProfilePage() {
	const reqHeaders = await headers();
	const session = await auth.api.getSession({ headers: reqHeaders });

	if (!session?.user?.id) {
		redirect("/login");
	}

	const [dbUser] = await db
		.select()
		.from(userTable)
		.where(eq(userTable.id, session.user.id))
		.limit(1);

	if (!dbUser) {
		redirect("/login");
	}

	const accounts = await db
		.select()
		.from(accountTable)
		.where(eq(accountTable.userId, session.user.id));

	const isGoogleConnected = accounts.some(
		(a) => a.providerId?.toLowerCase() === "google",
	);

	const profile = await UserManagement.getSecurityProfileByUserId(
		session.user.id,
	);
	const userRole = profile?.role || (dbUser as any)?.role || "customer";
	const dashboardRoute = getCanonicalDashboardRoute(userRole);

	const formatDate = (date: Date | string | null | undefined) => {
		if (!date) return "—";
		try {
			const d = new Date(date);
			return d.toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		} catch {
			return String(date);
		}
	};

	const formatTimestamp = (date: Date | string | null | undefined) => {
		if (!date) return "—";
		try {
			const d = new Date(date);
			return d.toLocaleString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return String(date);
		}
	};

	return (
		<div className="min-h-screen bg-background/95 px-4 py-8 text-foreground sm:px-6 lg:px-8">
			<div className="mx-auto max-w-6xl space-y-8">
				{/* Top Bar Navigation */}
				<div className="flex flex-col gap-4 border-border/40 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<Link
							href={dashboardRoute}
							className="inline-flex items-center gap-2 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
							<span>Back to Dashboard</span>
						</Link>
						<h1 className="mt-2 font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
							User Profile & Security
						</h1>
						<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
							Review your verified identity, account synchronization, and
							personal information.
						</p>
					</div>

					<div className="flex items-center gap-2">
						<Link href={dashboardRoute}>
							<Button variant="outline" size="sm" className="text-xs">
								Go to Workspace
							</Button>
						</Link>
					</div>
				</div>

				{/* Hero Card */}
				<Card className="overflow-hidden border-border/60 bg-card/60 shadow-md backdrop-blur-sm">
					<div className="h-24 border-border/40 border-b bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
					<CardContent className="relative px-6 pt-0 pb-6">
						<div className="-mt-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
							<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
								{dbUser.image ? (
									<img
										src={dbUser.image}
										alt={dbUser.name}
										className="h-24 w-24 rounded-2xl border-4 border-background bg-muted object-cover shadow-md"
									/>
								) : (
									<div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-primary font-bold text-2xl text-primary-foreground shadow-md">
										{dbUser.name?.slice(0, 2).toUpperCase() || "EU"}
									</div>
								)}

								<div className="space-y-1">
									<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
										<h2 className="font-bold text-foreground text-xl sm:text-2xl">
											{dbUser.name}
										</h2>
										{dbUser.emailVerified ? (
											<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
												<CheckCircle2 className="h-3 w-3" />
												Verified
											</span>
										) : (
											<span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold text-[11px] text-amber-600 dark:text-amber-400">
												<AlertCircle className="h-3 w-3" />
												Unverified
											</span>
										)}
									</div>
									<p className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs sm:justify-start sm:text-sm">
										<Mail className="h-3.5 w-3.5" />
										{dbUser.email}
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center justify-center gap-2 pt-2 sm:justify-end sm:pt-0">
								<span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2.5 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									<Shield className="h-3.5 w-3.5 text-primary" />
									{userRole.replace(/_/g, " ")}
								</span>

								{isGoogleConnected ? (
									<span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 font-medium text-blue-600 text-xs dark:text-blue-400">
										<svg
											className="h-3.5 w-3.5"
											viewBox="0 0 24 24"
											role="img"
											aria-label="Google logo"
										>
											<title>Google</title>
											<path
												fill="#4285F4"
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											/>
											<path
												fill="#34A853"
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											/>
											<path
												fill="#FBBC05"
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
											/>
											<path
												fill="#EA4335"
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
											/>
										</svg>
										Google Connected
									</span>
								) : null}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Two-column Layout */}
				<div className="grid gap-8 lg:grid-cols-3">
					{/* Left: Editable details */}
					<div className="space-y-6 lg:col-span-2">
						<ProfileEditor
							initialData={{
								givenName: dbUser.given_name,
								familyName: dbUser.family_name,
								dateOfBirth: dbUser.date_of_birth,
								locale: dbUser.locale,
							}}
						/>

						{/* Security & Access Protection Card */}
						<Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Lock className="h-5 w-5 text-primary" />
									<span>Security & Role Guard</span>
								</CardTitle>
								<CardDescription>
									Administrative security policies and protected credentials.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3 rounded-xl border border-muted bg-muted/40 p-4">
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="text-muted-foreground">Account Role</span>
										<span className="font-semibold text-foreground uppercase">
											{userRole}
										</span>
									</div>
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="text-muted-foreground">
											Two-Factor Authentication
										</span>
										<span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
											<ShieldCheck className="h-4 w-4" />
											Active (Email OTP)
										</span>
									</div>
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="text-muted-foreground">
											Email Verification Status
										</span>
										<span className="font-semibold text-foreground">
											{dbUser.emailVerified ? "Verified (Strict)" : "Pending"}
										</span>
									</div>
									<div className="flex items-center justify-between text-xs sm:text-sm">
										<span className="text-muted-foreground">User ID</span>
										<span className="font-mono text-muted-foreground text-xs">
											{dbUser.id}
										</span>
									</div>
								</div>

								<div className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-background/50 p-3 text-muted-foreground text-xs">
									<Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
									<p>
										System roles, organizational branch assignments, and email
										verification flags are strictly governed by RBAC security
										policies. To request elevated permissions, contact a system
										super administrator.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right: Synchronization & Metadata Card */}
					<div className="space-y-6">
						<Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<RefreshCw className="h-4 w-4 text-primary" />
									<span>Identity & Sync State</span>
								</CardTitle>
								<CardDescription className="text-xs">
									Automated metadata synchronized from OAuth providers and
									sessions.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-xs sm:text-sm">
								<div className="space-y-3 divide-y divide-border/40">
									<div className="flex items-center justify-between pt-2">
										<span className="flex items-center gap-1.5 text-muted-foreground">
											<UserIcon className="h-3.5 w-3.5" />
											Given Name
										</span>
										<span className="font-medium text-foreground">
											{dbUser.given_name || "—"}
										</span>
									</div>

									<div className="flex items-center justify-between pt-2">
										<span className="flex items-center gap-1.5 text-muted-foreground">
											<UserIcon className="h-3.5 w-3.5" />
											Family Name
										</span>
										<span className="font-medium text-foreground">
											{dbUser.family_name || "—"}
										</span>
									</div>

									<div className="flex items-center justify-between pt-2">
										<span className="flex items-center gap-1.5 text-muted-foreground">
											<Globe className="h-3.5 w-3.5" />
											Language Locale
										</span>
										<span className="font-medium text-foreground uppercase">
											{dbUser.locale || "EN"}
										</span>
									</div>

									<div className="flex items-center justify-between pt-2">
										<span className="flex items-center gap-1.5 text-muted-foreground">
											<Calendar className="h-3.5 w-3.5" />
											Account Created
										</span>
										<span className="font-medium text-foreground">
											{formatDate(dbUser.createdAt)}
										</span>
									</div>

									<div className="flex items-center justify-between pt-2">
										<span className="flex items-center gap-1.5 text-muted-foreground">
											<Clock className="h-3.5 w-3.5" />
											Last Login
										</span>
										<span className="font-medium text-foreground">
											{formatTimestamp(dbUser.last_login_at)}
										</span>
									</div>

									<div className="flex items-center justify-between pt-2">
										<span className="flex items-center gap-1.5 text-muted-foreground">
											<RefreshCw className="h-3.5 w-3.5" />
											Last Profile Sync
										</span>
										<span className="font-medium text-foreground">
											{formatTimestamp(dbUser.last_profile_sync_at)}
										</span>
									</div>
								</div>

								{isGoogleConnected && (
									<div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-blue-700 text-xs dark:text-blue-300">
										<div className="flex items-center gap-2 font-semibold">
											<Sparkles className="h-3.5 w-3.5" />
											<span>Google Profile Synced</span>
										</div>
										<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
											Your avatar, name, and email verification status are
											continuously synchronized with your Google Workspace
											identity upon login.
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
