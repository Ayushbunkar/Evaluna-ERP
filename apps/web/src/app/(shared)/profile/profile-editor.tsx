"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { AlertCircle, CheckCircle2, Loader2, Save, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { updateProfileAction } from "./actions";

interface ProfileEditorProps {
	initialData: {
		givenName?: string | null;
		familyName?: string | null;
		dateOfBirth?: string | null;
		locale?: string | null;
	};
}

export function ProfileEditor({ initialData }: ProfileEditorProps) {
	const [givenName, setGivenName] = useState(initialData.givenName || "");
	const [familyName, setFamilyName] = useState(initialData.familyName || "");
	const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth || "");
	const [locale, setLocale] = useState(initialData.locale || "en");
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsPending(true);
		setError(null);
		setSuccess(false);

		const formData = new FormData();
		formData.append("given_name", givenName);
		formData.append("family_name", familyName);
		formData.append("date_of_birth", dateOfBirth);
		formData.append("locale", locale);

		try {
			const res = await updateProfileAction(formData);
			if (res.success) {
				setSuccess(true);
				setTimeout(() => setSuccess(false), 4000);
			} else {
				setError(res.error || "Failed to update profile.");
			}
		} catch (err: any) {
			setError(err?.message || "An unexpected error occurred.");
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-lg">
					<User className="h-5 w-5 text-primary" />
					<span>Personal Information</span>
				</CardTitle>
				<CardDescription>
					Update your personal details. Security-sensitive fields like your
					role, permissions, and email verification status cannot be changed
					here.
				</CardDescription>
			</CardHeader>
			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{error && (
						<div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-600 text-xs dark:text-red-400">
							<AlertCircle className="h-4 w-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}
					{success && (
						<div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-600 text-xs dark:text-emerald-400">
							<CheckCircle2 className="h-4 w-4 shrink-0" />
							<span>Profile details updated successfully!</span>
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="givenName" className="font-medium text-xs">
								First Name (Given Name)
							</Label>
							<Input
								id="givenName"
								value={givenName}
								onChange={(e) => setGivenName(e.target.value)}
								placeholder="e.g. Rupesh"
								className="text-xs sm:text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="familyName" className="font-medium text-xs">
								Last Name (Family Name)
							</Label>
							<Input
								id="familyName"
								value={familyName}
								onChange={(e) => setFamilyName(e.target.value)}
								placeholder="e.g. Sharma"
								className="text-xs sm:text-sm"
							/>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="dateOfBirth" className="font-medium text-xs">
								Date of Birth
							</Label>
							<div className="relative">
								<Input
									id="dateOfBirth"
									type="date"
									value={dateOfBirth}
									onChange={(e) => setDateOfBirth(e.target.value)}
									className="text-xs sm:text-sm"
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="locale" className="font-medium text-xs">
								Preferred Language / Locale
							</Label>
							<div className="relative">
								<Input
									id="locale"
									value={locale}
									onChange={(e) => setLocale(e.target.value)}
									placeholder="en or hi"
									className="text-xs sm:text-sm"
								/>
							</div>
						</div>
					</div>
				</CardContent>
				<CardFooter className="flex justify-end pt-2">
					<Button
						type="submit"
						disabled={isPending}
						className="gap-2 text-xs shadow-sm sm:text-sm"
					>
						{isPending ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}
						{isPending ? "Saving..." : "Save Changes"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
