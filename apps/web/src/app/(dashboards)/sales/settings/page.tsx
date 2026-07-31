"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";

export default function SalespersonSettingsPage() {
	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Salesperson Settings
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Manage your preferences and POS settings.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>POS Configuration</CardTitle>
					<CardDescription>
						Configure your point-of-sale defaults.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						Settings configuration panel will be loaded here.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
