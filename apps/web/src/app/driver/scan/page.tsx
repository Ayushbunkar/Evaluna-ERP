"use client";

import { Button } from "@evaluna/ui/components/button";
import { ArrowLeftIcon, ScanLineIcon, FlashlightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ScanPage() {
	const t = useTranslations("nav");

	return (
		<div className="flex h-screen flex-col bg-black">
			{/* Header */}
			<header className="absolute top-0 left-0 right-0 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent p-4 pb-10">
				<Button variant="ghost" size="icon" className="text-white hover:bg-white/20" asChild>
					<Link href="/driver">
						<ArrowLeftIcon className="h-6 w-6" />
					</Link>
				</Button>
				<h1 className="text-lg font-semibold text-white">{t("scanQR")}</h1>
			</header>

			{/* Camera Viewfinder */}
			<main className="relative flex-1">
				{/* Simulated Camera Feed Overlay */}
				<div className="absolute inset-0 bg-black/40">
					{/* Scanning Grid Target */}
					<div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2">
						{/* Corners */}
						<div className="absolute top-0 left-0 h-10 w-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
						<div className="absolute top-0 right-0 h-10 w-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
						<div className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
						<div className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
						
						{/* Scanning line animation */}
						<div className="absolute left-0 right-0 h-0.5 bg-primary/80 shadow-[0_0_8px_2px_rgba(var(--primary),0.5)] animate-[scan_2s_ease-in-out_infinite]" />
						
						<p className="absolute -bottom-10 w-full text-center text-sm font-medium text-white/70">
							Align QR code within the frame to scan
						</p>
					</div>
				</div>

				{/* Bottom Controls */}
				<div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6">
					<Button size="icon" variant="secondary" className="h-16 w-16 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20">
						<FlashlightIcon className="h-6 w-6" />
					</Button>
					<Button size="icon" variant="default" className="h-16 w-16 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.4)]" asChild>
						<Link href="/driver/otp">
							<ScanLineIcon className="h-6 w-6" />
						</Link>
					</Button>
				</div>
			</main>

			<style dangerouslySetInnerHTML={{ __html: `
				@keyframes scan {
					0% { top: 0; opacity: 0; }
					10% { opacity: 1; }
					90% { opacity: 1; }
					100% { top: 100%; opacity: 0; }
				}
			`}} />
		</div>
	);
}
