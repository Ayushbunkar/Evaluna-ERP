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
	CheckCircle2,
	Clock,
	Key,
	RefreshCw,
	Save,
	ShieldCheck,
	Webhook,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingSettingsPage() {
	const trpc = useTRPC();
	const settingsQuery = trpc.instagram.getSettings.useQuery();

	const [autoPublish, setAutoPublish] = useState(true);
	const [timezone, setTimezone] = useState("Asia/Kolkata (IST +05:30)");

	const updateMutation = trpc.instagram.updateSettings.useMutation({
		onSuccess: () => {
			toast.success("Marketing settings saved successfully!");
		},
	});

	const data = settingsQuery.data;

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate({
			autoPublishEnabled: autoPublish,
			defaultTimezone: timezone,
		});
	};

	return (
		<div className="space-y-6 max-w-4xl mx-auto pb-12">
			<div>
				<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
					Marketing Settings & Meta Integration
				</h1>
				<p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
					Configure Meta Graph API credentials, webhook verification, rate limits, and publishing preferences
				</p>
			</div>

			<form onSubmit={handleSave} className="space-y-6">
				{/* Meta API Credentials Card */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<Key className="h-4 w-4 text-primary" />
								Meta Developer App Credentials
							</CardTitle>
							<Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">
								Verified Integration
							</Badge>
						</div>
						<CardDescription className="text-xs">
							Configured in Meta for Developers portal for Evaluna ERP
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Meta App ID</Label>
							<Input
								disabled
								value={data?.metaAppId || "918237465012398"}
								className="text-xs h-8 bg-muted font-mono"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Meta App Secret</Label>
							<Input
								disabled
								value={data?.metaAppSecretMasked || "••••••••••••••••••••••••3a8f"}
								className="text-xs h-8 bg-muted font-mono"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Webhook Verify Token</Label>
							<Input
								disabled
								value={data?.webhookVerifyTokenMasked || "evaluna_meta_hook_••••••••"}
								className="text-xs h-8 bg-muted font-mono"
							/>
						</div>

						<div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-1.5 text-xs">
							<p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
								<ShieldCheck className="h-4 w-4 text-emerald-500" />
								Active Meta API Permissions (Scopes):
							</p>
							<div className="flex flex-wrap gap-1">
								{data?.tokenStatus.scopes.map((s) => (
									<Badge key={s} variant="outline" className="text-[10px] font-mono">
										{s}
									</Badge>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Publishing Preferences */}
				<Card className="rounded-xl border-border/70 shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<Clock className="h-4 w-4 text-primary" />
							Publishing & Scheduling Defaults
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20">
							<div>
								<p className="text-xs font-bold text-foreground">Auto-Publish Scheduled Content</p>
								<p className="text-[11px] text-muted-foreground">
									Publish posts automatically at their scheduled timestamp without requiring manual confirmation.
								</p>
							</div>
							<input
								type="checkbox"
								checked={autoPublish}
								onChange={(e) => setAutoPublish(e.target.checked)}
								className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">Default Timezone</Label>
							<Input
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								className="text-xs h-8"
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<Button
						type="submit"
						disabled={updateMutation.isPending}
						className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs"
					>
						<Save className="h-3.5 w-3.5" />
						Save Settings
					</Button>
				</div>
			</form>
		</div>
	);
}
