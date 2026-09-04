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
import { SaveIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";

export default function SettingsPage() {
	const [prefName, setPrefName] = useState("Main Warehouse Manager Panel");
	const [prefRefreshInterval, setPrefRefreshInterval] = useState("30");

	const handleSave = () => {
		toast.success("Preferences saved successfully!");
	};

	return (
		<PageTransition className="mx-auto max-w-2xl space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<SettingsIcon className="h-6 w-6 text-blue-600" />
					Manager Preferences Settings
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					Configure notification preferences, refresh frequencies, and local
					team display filters.
				</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Preferences Control Folder
					</CardTitle>
					<CardDescription>
						Personal display settings authorized for your manager-level account
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label className="font-bold text-slate-700 text-xs">
							Display Label
						</Label>
						<Input
							value={prefName}
							onChange={(e) => setPrefName(e.target.value)}
							className="mt-1 h-9 font-bold text-xs"
						/>
					</div>

					<div>
						<Label className="font-bold text-slate-700 text-xs">
							SLA Dashboard Auto-Refresh Interval (Seconds)
						</Label>
						<Input
							type="number"
							value={prefRefreshInterval}
							onChange={(e) => setPrefRefreshInterval(e.target.value)}
							className="mt-1 h-9 text-xs"
						/>
					</div>

					<div className="pt-2">
						<Button
							size="sm"
							onClick={handleSave}
							className="bg-blue-600 hover:bg-blue-700"
						>
							<SaveIcon className="mr-1.5 h-4 w-4" /> Save Local Preferences
						</Button>
					</div>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
