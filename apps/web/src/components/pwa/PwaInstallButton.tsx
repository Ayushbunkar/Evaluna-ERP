"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { motion, useReducedMotion } from "framer-motion";
import {
	CheckCircle2,
	Download,
	PlusSquare,
	Share,
	Smartphone,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallButton() {
	const shouldReduceMotion = useReducedMotion();
	const [isMounted, setIsMounted] = useState(false);
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isIOS, setIsIOS] = useState(false);
	const [showIOSModal, setShowIOSModal] = useState(false);
	const [showDesktopHelpModal, setShowDesktopHelpModal] = useState(false);

	useEffect(() => {
		setIsMounted(true);

		// 1. Check if already installed in standalone mode
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as any).standalone === true ||
			document.referrer.includes("android-app://");

		if (isStandalone) {
			setIsInstalled(true);
			return;
		}

		// 2. Check for iOS device
		const ua = window.navigator.userAgent.toLowerCase();
		const isAppleDevice =
			/iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
		if (isAppleDevice) {
			setIsIOS(true);
		}

		// 3. Listen for native beforeinstallprompt
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};

		// 4. Listen for appinstalled
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setDeferredPrompt(null);
			setShowIOSModal(false);
			setShowDesktopHelpModal(false);
			toast.success("Evaluna ERP has been successfully installed!");
		};

		// 5. Standalone media query change listener
		const mediaQuery = window.matchMedia("(display-mode: standalone)");
		const handleMediaChange = (e: MediaQueryListEvent) => {
			if (e.matches) {
				setIsInstalled(true);
			}
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);
		mediaQuery.addEventListener("change", handleMediaChange);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
			mediaQuery.removeEventListener("change", handleMediaChange);
		};
	}, []);

	// Do not render during SSR, or if the app is already installed
	if (!isMounted || isInstalled) {
		return null;
	}

	const handleInstallClick = async () => {
		// Android / Chrome / Edge native prompt
		if (deferredPrompt) {
			try {
				await deferredPrompt.prompt();
				const choiceResult = await deferredPrompt.userChoice;
				if (choiceResult.outcome === "accepted") {
					setIsInstalled(true);
					toast.success("Installing Evaluna ERP to your device...");
				}
				setDeferredPrompt(null);
			} catch (err) {
				console.error("Installation prompt error:", err);
			}
			return;
		}

		// iOS Safari instructions
		if (isIOS) {
			setShowIOSModal(true);
			return;
		}

		// Other desktop browsers (Chrome, Edge, Brave, etc.) when prompt was dismissed or address-bar installable
		setShowDesktopHelpModal(true);
	};

	return (
		<>
			{/* Entrance Animated Install App Button */}
			<motion.div
				initial={{
					opacity: 0,
					y: shouldReduceMotion ? 0 : 24,
					scale: shouldReduceMotion ? 1 : 0.95,
				}}
				animate={{
					opacity: 1,
					y: 0,
					scale: 1,
				}}
				transition={{
					type: "spring",
					stiffness: 420,
					damping: 24,
					mass: 0.8,
					delay: 0.35,
				}}
				whileHover={{ y: -2 }}
				whileTap={{ scale: 0.97 }}
				className="inline-block"
			>
				<button
					type="button"
					onClick={handleInstallClick}
					aria-label="Install Evaluna ERP App"
					className="group relative flex w-full items-center justify-between gap-3 border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-[#F7F7F4] text-xs uppercase tracking-wider shadow-sm transition-all duration-200 hover:bg-[#222222] hover:shadow-md sm:w-auto sm:px-6 sm:py-3.5 dark:border-[#F5F5F2] dark:bg-[#F5F5F2] dark:text-[#080808] dark:hover:bg-white"
				>
					<div className="flex items-center space-x-2.5">
						<Download className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
						<span className="font-semibold">Install App</span>
					</div>

					<span className="flex items-center gap-1 rounded bg-[#F7F7F4]/15 px-1.5 py-0.5 font-mono text-[9px] text-[#F7F7F4] tracking-normal dark:bg-[#080808]/15 dark:text-[#080808]">
						<Sparkles className="h-2.5 w-2.5" />
						<span>PWA</span>
					</span>
				</button>
			</motion.div>

			{/* iOS Safari Installation Guide Modal */}
			<Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
				<DialogContent className="max-w-md border border-[#DEDEDA] bg-[#F7F7F4] p-6 text-[#111111] shadow-2xl dark:border-[#292929] dark:bg-[#0C0C0C] dark:text-[#F5F5F2]">
					<DialogHeader className="space-y-2 text-left">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DEDEDA] bg-[#EFEFEA] dark:border-[#292929] dark:bg-[#1A1A1A]">
								<Smartphone className="h-5 w-5 text-[#111111] dark:text-[#F5F5F2]" />
							</div>
							<div>
								<DialogTitle className="font-medium font-serif text-lg tracking-tight">
									Install Evaluna ERP on iOS
								</DialogTitle>
								<DialogDescription className="font-sans text-[#666666] text-xs dark:text-[#A3A3A0]">
									Add to your home screen for full-screen offline access.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4 pt-4">
						<div className="flex items-start space-x-3.5 rounded-lg border border-[#DEDEDA] bg-white/70 p-3.5 dark:border-[#292929] dark:bg-[#141414]/80">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#F7F7F4] text-xs font-semibold dark:bg-[#F5F5F2] dark:text-[#111111]">
								1
							</div>
							<div className="space-y-1 text-xs">
								<p className="font-medium">
									Tap the <span className="font-semibold underline">Share</span>{" "}
									button
								</p>
								<p className="text-[#666666] dark:text-[#A3A3A0]">
									Located at the bottom of Safari's navigation toolbar.
								</p>
								<div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#444444] dark:text-[#CCCCCC]">
									<Share className="h-4 w-4 text-blue-500" />
									<span>(Square with upward arrow)</span>
								</div>
							</div>
						</div>

						<div className="flex items-start space-x-3.5 rounded-lg border border-[#DEDEDA] bg-white/70 p-3.5 dark:border-[#292929] dark:bg-[#141414]/80">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#F7F7F4] text-xs font-semibold dark:bg-[#F5F5F2] dark:text-[#111111]">
								2
							</div>
							<div className="space-y-1 text-xs">
								<p className="font-medium">
									Select{" "}
									<span className="font-semibold underline">
										Add to Home Screen
									</span>
								</p>
								<p className="text-[#666666] dark:text-[#A3A3A0]">
									Scroll down the options list and choose "Add to Home Screen".
								</p>
								<div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#444444] dark:text-[#CCCCCC]">
									<PlusSquare className="h-4 w-4 text-emerald-500" />
									<span>Add to Home Screen icon</span>
								</div>
							</div>
						</div>

						<div className="flex items-start space-x-3.5 rounded-lg border border-[#DEDEDA] bg-white/70 p-3.5 dark:border-[#292929] dark:bg-[#141414]/80">
							<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#F7F7F4] text-xs font-semibold dark:bg-[#F5F5F2] dark:text-[#111111]">
								3
							</div>
							<div className="space-y-1 text-xs">
								<p className="font-medium">
									Tap <span className="font-semibold underline">Add</span>
								</p>
								<p className="text-[#666666] dark:text-[#A3A3A0]">
									In the top right corner. Evaluna ERP will appear on your
									phone's app grid.
								</p>
							</div>
						</div>
					</div>

					<div className="pt-4">
						<Button
							type="button"
							onClick={() => setShowIOSModal(false)}
							className="w-full bg-[#111111] font-mono text-[#F7F7F4] text-xs uppercase tracking-wider hover:bg-[#222222] dark:bg-[#F5F5F2] dark:text-[#080808] dark:hover:bg-white"
						>
							Got It
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Desktop Browser Installation Help Modal */}
			<Dialog
				open={showDesktopHelpModal}
				onOpenChange={setShowDesktopHelpModal}
			>
				<DialogContent className="max-w-md border border-[#DEDEDA] bg-[#F7F7F4] p-6 text-[#111111] shadow-2xl dark:border-[#292929] dark:bg-[#0C0C0C] dark:text-[#F5F5F2]">
					<DialogHeader className="space-y-2 text-left">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DEDEDA] bg-[#EFEFEA] dark:border-[#292929] dark:bg-[#1A1A1A]">
								<Download className="h-5 w-5 text-[#111111] dark:text-[#F5F5F2]" />
							</div>
							<div>
								<DialogTitle className="font-medium font-serif text-lg tracking-tight">
									Install Evaluna Desktop App
								</DialogTitle>
								<DialogDescription className="font-sans text-[#666666] text-xs dark:text-[#A3A3A0]">
									Run as a fast, dedicated desktop workspace.
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-3 pt-3 text-xs">
						<div className="rounded-lg border border-[#DEDEDA] bg-white/70 p-3.5 leading-relaxed dark:border-[#292929] dark:bg-[#141414]/80">
							<p className="font-medium text-[#111111] dark:text-[#F5F5F2]">
								In Google Chrome or Microsoft Edge:
							</p>
							<ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[#666666] dark:text-[#A3A3A0]">
								<li>
									Look for the{" "}
									<span className="font-semibold text-foreground">
										Install icon
									</span>{" "}
									(a computer with a down arrow) on the right side of the URL
									address bar.
								</li>
								<li>
									Or click the browser menu (⋮) →{" "}
									<span className="font-semibold text-foreground">
										Save and share
									</span>{" "}
									→{" "}
									<span className="font-semibold text-foreground">
										Install Evaluna ERP
									</span>
									.
								</li>
								<li>Click Install to pin it to your desktop taskbar.</li>
							</ol>
						</div>
					</div>

					<div className="pt-4">
						<Button
							type="button"
							onClick={() => setShowDesktopHelpModal(false)}
							className="w-full bg-[#111111] font-mono text-[#F7F7F4] text-xs uppercase tracking-wider hover:bg-[#222222] dark:bg-[#F5F5F2] dark:text-[#080808] dark:hover:bg-white"
						>
							Understood
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
