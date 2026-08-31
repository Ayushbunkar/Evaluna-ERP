"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ActivityIcon,
	ArrowRightIcon,
	BanknoteIcon,
	LayoutIcon,
	SettingsIcon,
	ShieldIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsPage() {
	const trpc = useTRPC();
	const locale = "en"; // hardcoded — no next-intl provider in admin layout

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Settings
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Configure system settings and preferences
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Activity Log
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings/users">
							<UsersIcon className="mr-2 h-4 w-4" /> Users
						</Link>
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings/roles">
							<ShieldIcon className="mr-2 h-4 w-4" /> Roles & Permissions
						</Link>
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings/branches">
							<LayoutIcon className="mr-2 h-4 w-4" /> Branches
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{/* General Settings */}
				<div className="flex flex-col gap-4">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									General Settings
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Company information, date/time formats, and currency settings
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/settings/general">
									Configure <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<p className="text-muted-foreground text-sm">
								Set up your company profile, tax information, and regional
								preferences.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Notification Settings */}
				<div className="flex flex-col gap-4">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Notification Settings
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Email and SMS notification preferences
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/settings/notifications">
									Configure <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<p className="text-muted-foreground text-sm">
								Configure how and when users receive notifications for various
								events.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Security Settings */}
				<div className="flex flex-col gap-4">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Security Settings
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Password policies, session management, and access controls
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/settings/security">
									Configure <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<p className="text-muted-foreground text-sm">
								Set password complexity rules, session timeouts, and access
								control policies.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Integration Settings */}
				<div className="flex flex-col gap-4">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Integration Settings
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Third-party API connections and webhooks
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/settings/integrations">
									Configure <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<p className="text-muted-foreground text-sm">
								Connect to accounting software, payment gateways, and other
								business tools.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Backup & Restore */}
				<div className="flex flex-col gap-4">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									Backup & Restore
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									Data backup schedules and recovery options
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/settings/backup">
									Configure <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<p className="text-muted-foreground text-sm">
								Set up automated backups and manage data recovery procedures.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* System Maintenance */}
				<div className="flex flex-col gap-4">
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
							<div className="space-y-0.5">
								<CardTitle className="text-base sm:text-lg">
									System Maintenance
								</CardTitle>
								<CardDescription className="text-xs sm:text-sm">
									System updates, logs, and diagnostics
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link href="/admin/settings/maintenance">
									Configure <ArrowRightIcon className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-1 sm:pt-2">
							<p className="text-muted-foreground text-sm">
								Monitor system health, apply updates, and review diagnostic
								logs.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</PageTransition>
	);
}
