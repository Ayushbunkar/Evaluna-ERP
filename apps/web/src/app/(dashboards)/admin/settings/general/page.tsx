"use client";

import React, { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { ActivityIcon, CheckCircle2, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AdminSettingsGeneralPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [success, setSuccess] = useState(false);
	const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
	const [initialized, setInitialized] = useState(false);

	const settingsQueryOptions = trpc.settings.getAll.queryOptions();
	const { data: settingsData, isLoading, error } = useQuery(settingsQueryOptions);

	React.useEffect(() => {
		if (settingsData?.data && !initialized) {
			setLocalSettings(settingsData.data as Record<string, string>);
			setInitialized(true);
		}
	}, [settingsData, initialized]);

	const updateMutation = useMutation(
		trpc.settings.setMany.mutationOptions({
			onSuccess: () => {
				setSuccess(true);
				queryClient.invalidateQueries({ queryKey: settingsQueryOptions.queryKey });
				setTimeout(() => setSuccess(false), 3000);
			},
		}),
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate({ settings: localSettings });
	};

	if (isLoading) {
		return (
			<PageTransition className="container mx-auto py-8">
				<div className="flex h-[200px] items-center justify-center">
					Loading...
				</div>
			</PageTransition>
		);
	}

	if (error) {
		return (
			<PageTransition className="container mx-auto py-8">
				<div className="flex h-[200px] items-center justify-center">
					Failed to load settings
				</div>
			</PageTransition>
		);
	}

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						General Settings
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Configure company information and regional preferences
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Activity Log
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/settings">
							<SettingsIcon className="mr-2 h-4 w-4" /> Back to Settings
						</Link>
					</Button>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="mt-6 space-y-6">
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="font-semibold text-lg">
							Company Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="companyName">Company Name</Label>
							<Input
								id="companyName"
								value={localSettings.company_name || ""}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										company_name: e.target.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="companyAddress">Address</Label>
							<Input
								id="companyAddress"
								value={localSettings.address || ""}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										address: e.target.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="companyPhone">Phone</Label>
							<Input
								id="companyPhone"
								value={localSettings.phone || ""}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										phone: e.target.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="companyEmail">Email</Label>
							<Input
								id="companyEmail"
								type="email"
								value={localSettings.email || ""}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										email: e.target.value,
									}));
								}}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="font-semibold text-lg">
							Regional Settings
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="currency">Currency</Label>
							<Input
								id="currency"
								value={localSettings.currency || "INR"}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										currency: e.target.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="timezone">Timezone</Label>
							<Input
								id="timezone"
								value={localSettings.timezone || "Asia/Kolkata"}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										timezone: e.target.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="dateFormat">Date Format</Label>
							<Input
								id="dateFormat"
								value={localSettings.date_format || "DD/MM/YYYY"}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										date_format: e.target.value,
									}));
								}}
							/>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardHeader>
						<CardTitle className="font-semibold text-lg">
							Financial Settings
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="financialYearStart">Financial Year Start</Label>
							<Input
								id="financialYearStart"
								type="month"
								value={localSettings.financial_year_start || ""}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										financial_year_start: e.target.value,
									}));
								}}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="financialYearEnd">Financial Year End</Label>
							<Input
								id="financialYearEnd"
								type="month"
								value={localSettings.financial_year_end || ""}
								onChange={(e) => {
									setLocalSettings((prev) => ({
										...prev,
										financial_year_end: e.target.value,
									}));
								}}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="flex items-center gap-4">
					<Button type="submit" disabled={updateMutation.isPending}>
						{updateMutation.isPending ? "Saving..." : "Save Settings"}
					</Button>
					{success && (
						<div className="flex items-center space-x-2 text-green-600">
							<CheckCircle2 className="h-4 w-4" />
							<span className="text-sm">Settings saved successfully!</span>
						</div>
					)}
					{updateMutation.isError && (
						<p className="text-destructive text-sm">Failed to save settings.</p>
					)}
				</div>
			</form>
		</PageTransition>
	);
}
