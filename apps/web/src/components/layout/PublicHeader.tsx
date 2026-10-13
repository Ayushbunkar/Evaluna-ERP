"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface PublicHeaderProps {
	className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Prevent background scroll when mobile menu is open
	useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileMenuOpen]);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileMenuOpen(false);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<header
			suppressHydrationWarning
			className={`sticky top-0 z-50 w-full border-[#DEDEDA] border-b bg-[#F7F7F4]/95 py-3 backdrop-blur-md transition-colors dark:border-[#292929] dark:bg-[#080808]/95 ${
				className || ""
			}`}
		>
			<div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-12">
				{/* Brand Lockup */}
				<Link
					href="/"
					onClick={() => setMobileMenuOpen(false)}
					className="group flex items-center space-x-3 transition-opacity hover:opacity-85"
					title="Evaluna — Home"
				>
					<img
						src="/logo.jpg"
						alt="Evaluna"
						className="h-8 w-8 shrink-0 rounded-md border border-[#DEDEDA] object-cover transition-transform duration-300 group-hover:scale-105 dark:border-[#292929]"
					/>
					<div className="flex flex-col">
						<span className="font-semibold font-serif text-[#111111] text-sm uppercase tracking-tight sm:text-base dark:text-[#F5F5F2]">
							EVALUNA
						</span>
						<span className="-mt-0.5 font-mono text-[#666666] text-[8px] uppercase tracking-widest sm:text-[9px] dark:text-[#A3A3A0]">
							Bhopal & Berasia • 23.26° N
						</span>
					</div>
				</Link>

				{/* Desktop Navigation Links */}
				<nav className="hidden items-center space-x-6 font-mono text-[#666666] text-[11px] uppercase tracking-widest md:flex lg:space-x-8 dark:text-[#A3A3A0]">
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
					<Link
						href="/contact"
						className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
					>
						Contact
					</Link>
				</nav>

				{/* Right Utility Actions */}
				<div className="hidden items-center space-x-3 md:flex lg:space-x-4">
					<ThemeToggle />
					<Link
						href="/login"
						className="px-2 py-1 font-mono text-[#666666] text-[11px] uppercase tracking-widest transition-colors hover:text-[#111111] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
					>
						Sign-In
					</Link>
					<Link
						href="/#dialogue"
						className="border border-[#111111] px-3.5 py-1.5 font-mono text-[#111111] text-xs uppercase tracking-wider transition-all duration-200 hover:bg-[#111111] hover:text-[#F7F7F4] dark:border-[#F5F5F2] dark:text-[#F5F5F2] dark:hover:bg-[#F5F5F2] dark:hover:text-[#080808]"
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
						className="rounded-md p-2 text-[#111111] transition-colors hover:bg-black/5 focus:outline-none dark:text-[#F5F5F2] dark:hover:bg-white/5"
						aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
						aria-expanded={mobileMenuOpen}
					>
						{mobileMenuOpen ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>

			{/* Full Viewport Mobile Drawer Overlay */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
						className="fixed inset-x-0 top-[57px] bottom-0 z-50 flex flex-col justify-between overflow-y-auto border-[#DEDEDA] border-t bg-[#F7F7F4] px-6 py-6 md:hidden dark:border-[#292929] dark:bg-[#080808]"
					>
						<div className="flex flex-col space-y-5 font-mono text-xs uppercase tracking-widest">
							<div className="flex items-center justify-between border-[#DEDEDA] border-b pb-2.5 text-[#888888] text-[10px] dark:border-[#292929] dark:text-[#777777]">
								<span>NAVIGATION DIRECTORY</span>
								<span>EVALUNA ARCHITECTURE</span>
							</div>

							<Link
								href="/features"
								onClick={() => setMobileMenuOpen(false)}
								className="flex items-center justify-between py-1.5 text-[#111111] text-sm transition-colors hover:opacity-75 dark:text-[#F5F5F2]"
							>
								<span>01 Features</span>
								<ArrowRight className="h-4 w-4 text-[#888888]" />
							</Link>
							<Link
								href="/solutions"
								onClick={() => setMobileMenuOpen(false)}
								className="flex items-center justify-between py-1.5 text-[#111111] text-sm transition-colors hover:opacity-75 dark:text-[#F5F5F2]"
							>
								<span>02 Solutions</span>
								<ArrowRight className="h-4 w-4 text-[#888888]" />
							</Link>
							<Link
								href="/about"
								onClick={() => setMobileMenuOpen(false)}
								className="flex items-center justify-between py-1.5 text-[#111111] text-sm transition-colors hover:opacity-75 dark:text-[#F5F5F2]"
							>
								<span>03 Company</span>
								<ArrowRight className="h-4 w-4 text-[#888888]" />
							</Link>
							<Link
								href="/contact"
								onClick={() => setMobileMenuOpen(false)}
								className="flex items-center justify-between py-1.5 text-[#111111] text-sm transition-colors hover:opacity-75 dark:text-[#F5F5F2]"
							>
								<span>04 Contact & Inquiries</span>
								<ArrowRight className="h-4 w-4 text-[#888888]" />
							</Link>
							<Link
								href="/pricing"
								onClick={() => setMobileMenuOpen(false)}
								className="flex items-center justify-between py-1.5 text-[#111111] text-sm transition-colors hover:opacity-75 dark:text-[#F5F5F2]"
							>
								<span>05 Pricing</span>
								<ArrowRight className="h-4 w-4 text-[#888888]" />
							</Link>
						</div>

						<div className="flex flex-col space-y-3 border-[#DEDEDA] border-t pt-5 dark:border-[#292929]">
							<Link
								href="/login"
								onClick={() => setMobileMenuOpen(false)}
								className="w-full border border-[#111111] py-3 text-center font-mono text-[#111111] text-xs uppercase tracking-wider transition-colors hover:bg-[#111111] hover:text-[#F7F7F4] dark:border-[#F5F5F2] dark:text-[#F5F5F2] dark:hover:bg-[#F5F5F2] dark:hover:text-[#080808]"
							>
								Employee Sign-In
							</Link>
							<Link
								href="/#dialogue"
								onClick={() => setMobileMenuOpen(false)}
								className="w-full bg-[#111111] py-3 text-center font-mono text-[#F7F7F4] text-xs uppercase tracking-wider transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#080808]"
							>
								Direct Inquiry
							</Link>
							<div className="flex items-center justify-between pt-2 font-mono text-[#666666] text-[11px] dark:text-[#A3A3A0]">
								<Link
									href="/docs"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:underline"
								>
									Documentation & SOPs
								</Link>
								<span>Bhopal & Berasia</span>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
