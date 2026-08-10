// @ts-nocheck
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
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const { data, error: err } = await authClient.forgetPassword({
				email,
				redirectTo: "/reset-password",
			});

			if (err) {
				setError(err.message || "Something went wrong.");
			} else {
				setIsSuccess(true);
			}
		} catch (err: any) {
			setError(err.message || "Failed to send reset email.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-2 pb-6 text-center">
					<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
						<Mail className="h-6 w-6 text-primary" />
					</div>
					<CardTitle className="font-bold text-2xl">Forgot Password?</CardTitle>
					<CardDescription>
						Enter your email address and we'll send you a link to reset your
						password.
					</CardDescription>
				</CardHeader>

				{isSuccess ? (
					<CardContent className="space-y-4">
						<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
							<CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
							<p className="font-medium text-emerald-700 dark:text-emerald-300">
								Check your email
							</p>
							<p className="mt-1 text-emerald-600/80 text-sm dark:text-emerald-400/80">
								We've sent a password reset link to <br />
								<span className="font-semibold text-emerald-700 dark:text-emerald-300">
									{email}
								</span>
							</p>
						</div>
						<Button asChild variant="outline" className="mt-4 w-full">
							<Link href="/login">Return to Login</Link>
						</Button>
					</CardContent>
				) : (
					<form onSubmit={handleSubmit}>
						<CardContent className="space-y-4">
							{error && (
								<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-red-500 text-sm">
									{error}
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoComplete="email"
								/>
							</div>
						</CardContent>
						<CardFooter className="flex flex-col gap-4">
							<Button
								type="submit"
								className="w-full"
								disabled={isLoading || !email}
							>
								{isLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								{isLoading ? "Sending..." : "Send Reset Link"}
							</Button>
							<Link
								href="/login"
								className="flex items-center justify-center text-muted-foreground text-sm transition-colors hover:text-foreground"
							>
								<ArrowLeft className="mr-1 h-4 w-4" /> Back to login
							</Link>
						</CardFooter>
					</form>
				)}
			</Card>
		</div>
	);
}
