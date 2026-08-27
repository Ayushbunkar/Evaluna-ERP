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
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token") || "";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters.");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const { data, error: err } = await authClient.resetPassword({
				newPassword: password,
				token: token,
			});

			if (err) {
				setError(err.message || "Invalid or expired token.");
			} else {
				setIsSuccess(true);
				setTimeout(() => router.push("/login"), 3000);
			}
		} catch (err: any) {
			setError(err.message || "Failed to reset password.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isSuccess) {
		return (
			<CardContent className="space-y-4">
				<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
					<CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
					<p className="font-medium text-emerald-700 dark:text-emerald-300">
						Password Reset Successful
					</p>
					<p className="mt-1 text-emerald-600/80 text-sm dark:text-emerald-400/80">
						Redirecting to login...
					</p>
				</div>
			</CardContent>
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<CardContent className="space-y-4">
				{!token && (
					<div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-red-500 text-sm">
						No reset token found in URL.
					</div>
				)}
				{error && (
					<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-red-500 text-sm">
						{error}
					</div>
				)}
				<div className="space-y-2">
					<Label htmlFor="password">New Password</Label>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						disabled={!token}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
						disabled={!token}
					/>
				</div>
			</CardContent>
			<CardFooter>
				<Button type="submit" className="w-full" disabled={isLoading || !token}>
					{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					Reset Password
				</Button>
			</CardFooter>
		</form>
	);
}

export default function ResetPasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-2 pb-6 text-center">
					<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Lock className="h-6 w-6 text-primary" />
					</div>
					<CardTitle className="font-bold text-2xl">Reset Password</CardTitle>
					<CardDescription>
						Enter your new password below to regain access.
					</CardDescription>
				</CardHeader>
				<Suspense
					fallback={
						<div className="p-8 text-center text-muted-foreground text-sm">
							Loading...
						</div>
					}
				>
					<ResetPasswordForm />
				</Suspense>
			</Card>
		</div>
	);
}

