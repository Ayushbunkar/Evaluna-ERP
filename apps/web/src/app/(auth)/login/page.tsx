"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardFooter } from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Menu, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { login } from "./actions";

function LoginForm() {
	const emailRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const t = useTranslations("login");
	const searchParams = useSearchParams();
	const expired = searchParams.get("expired");
	const suspended = searchParams.get("suspended");
	const [isPending, setIsPending] = useState(false);
	const [localError, setLocalError] = useState<string | null>(
		searchParams.get("error"),
	);
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setIsOffline(!window.navigator.onLine);
		}
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsPending(true);
		setLocalError(null);
		const formData = new FormData(e.currentTarget);
		const res = await login(formData);
		if (res && !res.success) {
			setLocalError(res.error || "invalid-credentials");
			setIsPending(false);
		} else if (res && res.success && res.redirectUrl) {
			const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
			let target = res.redirectUrl;
			if (basePath && target.startsWith("/") && !target.startsWith(basePath)) {
				target = basePath + target;
			}
			window.location.href = target;
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<CardContent className="space-y-4 pt-6">
				{isOffline && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 text-xs sm:p-4 sm:text-sm dark:text-amber-400"
					>
						<div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
							<WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
							<span>Offline Mode Active</span>
						</div>
						<p className="text-muted-foreground text-xs">
							Internet disconnected. If you were logged in previously, you can
							launch your offline workspace tabs directly:
						</p>
						<div className="space-y-1.5 pt-1 font-medium">
							<Link
								href="/driver"
								className="flex items-center justify-between rounded-lg bg-amber-500/20 px-3 py-2 text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
							>
								<span>🚚 Driver Delivery Tab</span>
								<span>→</span>
							</Link>
							<Link
								href="/sales"
								className="flex items-center justify-between rounded-lg bg-amber-500/20 px-3 py-2 text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
							>
								<span>🛒 Sales & POS Dashboard</span>
								<span>→</span>
							</Link>
							<Link
								href="/dashboard"
								className="flex items-center justify-between rounded-lg bg-amber-500/20 px-3 py-2 text-amber-900 transition-colors hover:bg-amber-500/30 dark:text-amber-100"
							>
								<span>📊 Main Owner ERP</span>
								<span>→</span>
							</Link>
						</div>
					</motion.div>
				)}
				{localError && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500 text-xs sm:p-3 sm:text-sm"
					>
						<AlertCircle className="mt-0.5 h-4 w-4" />
						<p>
							{localError === "locked"
								? "Account locked due to too many failed attempts. Try again later."
								: localError === "suspended"
									? "Your account has been suspended."
									: "Invalid email or password."}
						</p>
					</motion.div>
				)}
				{expired && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500 text-xs sm:p-3 sm:text-sm"
					>
						<AlertCircle className="mt-0.5 h-4 w-4" />
						<p>Your session has expired. Please log in again.</p>
					</motion.div>
				)}
				{suspended && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-500 text-xs sm:p-3 sm:text-sm"
					>
						<AlertCircle className="mt-0.5 h-4 w-4" />
						<p>
							Your account is currently suspended. Contact your administrator.
						</p>
					</motion.div>
				)}

				<div className="grid gap-1 sm:gap-2">
					<Label htmlFor="email" className="text-xs sm:text-sm">
						{t("email")}
					</Label>
					<Input
						ref={emailRef}
						id="email"
						name="email"
						type="email"
						placeholder={t("emailPlaceholder")}
						required
						autoComplete="email"
						className="text-xs transition-all focus-visible:ring-primary sm:text-sm"
					/>
				</div>
				<div className="grid gap-1 sm:gap-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="password" className="text-xs sm:text-sm">
							{t("password")}
						</Label>
						<Link
							href="/forgot-password"
							className="text-muted-foreground text-xs transition-colors hover:text-foreground"
						>
							Forgot password?
						</Link>
					</div>
					<Input
						ref={passwordRef}
						id="password"
						name="password"
						type="password"
						required
						autoComplete="current-password"
						className="text-xs transition-all focus-visible:ring-primary sm:text-sm"
					/>
				</div>
				<div className="mt-1 flex items-center gap-1 sm:gap-2">
					<input
						type="checkbox"
						id="rememberMe"
						name="rememberMe"
						suppressHydrationWarning={true}
						className="h-4 w-4 rounded border-border bg-background accent-primary transition-all"
					/>
					<Label
						htmlFor="rememberMe"
						className="cursor-pointer font-normal text-muted-foreground text-xs transition-colors hover:text-foreground sm:text-sm"
					>
						Remember me for 30 days
					</Label>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col gap-3 pb-4 sm:gap-4 sm:pb-6">
				<Button
					className="w-full text-xs shadow-sm sm:text-sm"
					type="submit"
					disabled={isPending}
				>
					{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					{isPending ? "Logging in..." : t("submit")}
				</Button>

				<p className="mt-1 text-center text-muted-foreground text-xs sm:mt-2 sm:text-sm">
					{t("noAccount")}{" "}
					<Link
						href="/signup"
						className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
					>
						{t("signUp")}
					</Link>
				</p>
			</CardFooter>
		</form>
	);
}

export default function LoginPage() {
	const t = useTranslations("login");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors selection:bg-primary/20">
			{/* Unified Homepage Navigation */}
			<header className="sticky top-0 z-50 w-full border-[#DEDEDA] border-b bg-[#F7F7F4]/90 py-3.5 backdrop-blur-md transition-colors dark:border-[#292929] dark:bg-[#080808]/90">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
					{/* Brand Lockup */}
					<Link
						href="/"
						className="group flex items-center space-x-3.5 transition-opacity hover:opacity-80"
						title="Evaluna — Home"
					>
						<img
							src="/logo.jpg"
							alt="Evaluna"
							className="h-8 w-8 rounded-md border border-[#DEDEDA] object-cover transition-transform duration-300 group-hover:scale-105 dark:border-[#292929]"
						/>
						<div className="flex flex-col">
							<span className="font-semibold font-serif text-[#111111] text-base uppercase tracking-tight dark:text-[#F5F5F2]">
								EVALUNA
							</span>
							<span className="-mt-0.5 font-mono text-[#666666] text-[9px] uppercase tracking-widest dark:text-[#A3A3A0]">
								Bhopal & Berasia • 23.26° N
							</span>
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden items-center space-x-8 font-mono text-[#666666] text-[11px] uppercase tracking-widest md:flex dark:text-[#A3A3A0]">
						<Link
							href="/features"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							Features
						</Link>
						<Link
							href="/solutions"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							Solutions
						</Link>
						<Link
							href="/about"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							Company
						</Link>
					</nav>

					{/* Right Utility Actions */}
					<div className="hidden items-center space-x-4 md:flex">
						<ThemeToggle />
						<Link
							href="/login"
							className="px-2 py-1 font-mono text-[#666666] text-[11px] uppercase tracking-widest transition-colors hover:text-[#111111] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
						>
							Sign-In
						</Link>
						<Link
							href="/#dialogue"
							className="border border-[#111111] px-4 py-2 font-mono text-[#111111] text-xs uppercase tracking-wider transition-all duration-200 hover:bg-[#111111] hover:text-[#F7F7F4] dark:border-[#F5F5F2] dark:text-[#F5F5F2] dark:hover:bg-[#F5F5F2] dark:hover:text-[#080808]"
						>
							Inquire
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center space-x-2 md:hidden">
						<ThemeToggle />
						<button
							type="button"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 text-[#111111] focus:outline-none dark:text-[#F5F5F2]"
							aria-label="Toggle navigation menu"
						>
							{mobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Drawer */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="overflow-hidden border-[#DEDEDA] border-b bg-[#F7F7F4] px-6 py-8 md:hidden dark:border-[#292929] dark:bg-[#080808]"
						>
							<div className="flex flex-col space-y-6 font-mono text-sm uppercase tracking-widest">
								<Link
									href="/features"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] hover:text-[#111111] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
								>
									Features
								</Link>
								<Link
									href="/solutions"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] hover:text-[#111111] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
								>
									Solutions
								</Link>
								<Link
									href="/about"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] hover:text-[#111111] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
								>
									Company
								</Link>
								<div className="flex flex-col space-y-3 border-[#DEDEDA] border-t pt-4 dark:border-[#292929]">
									<Link
										href="/login"
										onClick={() => setMobileMenuOpen(false)}
										className="font-mono text-[#666666] text-xs uppercase tracking-wider dark:text-[#A3A3A0]"
									>
										Employee Sign-In
									</Link>
									<Link
										href="/docs"
										onClick={() => setMobileMenuOpen(false)}
										className="font-mono text-[#666666] text-xs uppercase tracking-wider dark:text-[#A3A3A0]"
									>
										Documentation & Manuals
									</Link>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</header>

			<div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center overflow-hidden bg-background py-12 selection:bg-primary/20">
				{/* Background gradients for premium feel */}
				<div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full overflow-hidden">
					<div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
					<div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
				</div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
					className="mx-auto w-full max-w-md space-y-8 px-4"
				>
					<div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.1, duration: 0.5 }}
							className="mb-2"
						>
							<img
								src="/logo.jpg"
								alt="Evaluna ERP"
								className="h-14 w-14 rounded-2xl object-cover shadow-md ring-1 ring-border"
							/>
						</motion.div>
						<h2 className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
							{t("title")}
						</h2>
						<p className="max-w-sm text-muted-foreground text-xs sm:text-base">
							{t("subtitle")}
						</p>
					</div>

					<Card className="border-border/50 bg-card/80 shadow-xl backdrop-blur-xl">
						<Suspense
							fallback={
								<div className="flex justify-center p-10">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							}
						>
							<LoginForm />
						</Suspense>
					</Card>
				</motion.div>
			</div>
		</div>
	);
}
