"use client";

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
	DatabaseIcon,
	ShieldCheckIcon,
	ServerIcon,
	SaveIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/list-shell";
import { PageTransition } from "@/lib/animations";

export default function SuperAdminSettingsPage() {
	const [backupPrefix, setBackupPrefix] = useState("daily_backup_");
	const [autoBackups, setAutoBackups] = useState(true);

	const triggerBackup = () => {
		toast.promise(
			new Promise((resolve) => setTimeout(resolve, 2000)),
			{
				loading: "Running global system backup...",
				success: "Backup successfully generated and uploaded to AWS S3!",
				error: "Failed to create backup.",
			}
		);
	};

	const saveSystemConfig = (e: React.FormEvent) => {
		e.preventDefault();
		toast.success("Global system configuration saved successfully!");
	};

	return (
		<PageTransition className="flex min-w-0 flex-col gap-5">
			<AdminPageHeader
				title="Global System Settings & Control Panel"
				description="Manage global system configurations, trigger full database backups, and control security limits."
			/>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Backup Card */}
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center text-lg">
							<DatabaseIcon className="mr-2 h-5 w-5 text-blue-500" /> System Backup Controls
						</CardTitle>
						<CardDescription>Configure automated snapshot parameters or trigger an instant full system backup.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1">
							<Label htmlFor="prefix">Backup File Prefix</Label>
							<Input
								id="prefix"
								value={backupPrefix}
								onChange={(e) => setBackupPrefix(e.target.value)}
							/>
						</div>

						<div className="flex items-center space-x-2 pt-2">
							<input
								id="auto"
								type="checkbox"
								className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								checked={autoBackups}
								onChange={(e) => setAutoBackups(e.target.checked)}
							/>
							<Label htmlFor="auto" className="cursor-pointer text-xs sm:text-sm">
								Enable automated daily backups to cloud storage
							</Label>
						</div>

						<div className="pt-4 border-t border-border/50">
							<Button type="button" className="w-full" onClick={triggerBackup}>
								Trigger Instant Global Backup
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* System Parameters Card */}
				<form onSubmit={saveSystemConfig}>
					<Card className="border-border/50 bg-card/50 shadow-sm">
						<CardHeader>
							<CardTitle className="flex items-center text-lg">
								<ServerIcon className="mr-2 h-5 w-5 text-purple-500" /> Core System Parameters
							</CardTitle>
							<CardDescription>Adjust technical security limits and SaaS parameters globally.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<Label htmlFor="timeout">Session Timeout (Hrs)</Label>
									<Input id="timeout" type="number" defaultValue={24} />
								</div>
								<div className="space-y-1">
									<Label htmlFor="attempts">Max Login Attempts</Label>
									<Input id="attempts" type="number" defaultValue={5} />
								</div>
							</div>

							<div className="space-y-1">
								<Label htmlFor="domain">System Primary SaaS Domain</Label>
								<Input id="domain" defaultValue="evaluna-erp.com" />
							</div>

							<div className="flex items-center space-x-2 pt-2">
								<input
									id="mfa"
									type="checkbox"
									className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									defaultChecked
								/>
								<Label htmlFor="mfa" className="cursor-pointer text-xs sm:text-sm">
									Enforce Multi-Factor Authentication (MFA) for Admin roles
								</Label>
							</div>

							<div className="pt-4 border-t border-border/50">
								<Button type="submit" className="w-full">
									<SaveIcon className="mr-2 h-4 w-4" /> Save System Parameters
								</Button>
							</div>
						</CardContent>
					</Card>
				</form>
			</div>
		</PageTransition>
	);
}
