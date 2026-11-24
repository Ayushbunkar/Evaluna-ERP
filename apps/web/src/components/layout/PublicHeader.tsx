"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, MessageCircle, Phone, X } from "lucide-react";
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
						href="/#categories"
						className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
					>
						Categories
					</Link>
					<Link
						href="/#why-choose"
						className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
					>
						Why Evaluna
					</Link>
					<Link
						href="/#how-it-works"
						className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
					>
						How It Works
					</Link>
					<Link
						href="/#trust"
						className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
					>
						Trust & Compliance
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
					<a
						href="https://wa.me/919630649277?text=Namaste%20Evaluna%20Team%2C%20I%20want%20to%20inquire%20about%20wholesale%20grocery%20rates%20and%20orders."
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
						title="WhatsApp Support (+91 96306 49277)"
					>
						<MessageCircle className="h-3 w-3" />
						<span>9630649277</span>
					</a>
					<ThemeToggle />
					<Link
						href="/login"
						className="px-2 py-1 font-mono text-[#666666] text-[11px] uppercase tracking-widest transition-colors hover:text-[#111111] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
					>
						Sign-In
					</Link>
					<Link
						href="/signup"
						className="border border-[#111111] px-3.5 py-1.5 font-mono text-[#111111] text-xs uppercase tracking-wider transition-all duration-200 hover:bg-[#111111] hover:text-[#F7F7F4] dark:border-[#F5F5F2] dark:text-[#F5F5F2] dark:hover:bg-[#F5F5F2] dark:hover:text-[#080808]"
					>
						Register
					</Link>
				</div>

				{/* Mobile Header Actions (Sign-In button visible right on top + ThemeToggle + Hamburger) */}
				<div className="flex items-center space-x-1.5 sm:space-x-2 md:hidden">
					<Link
						href="/login"
						className="rounded-md border border-[#111111]/30 px-2.5 py-1 font-mono text-[#111111] text-[11px] uppercase tracking-wider transition-colors hover:bg-black/5 dark:border-[#F5F5F2]/30 dark:text-[#F5F5F2] dark:hover:bg-white/5"
					>
						Sign-In
					</Link>
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="rounded-md p-1.5 text-[#111111] transition-colors hover:bg-black/5 focus:outline-none dark:text-[#F5F5F2] dark:hover:bg-white/5"
						aria-label={mobileMenuOpen ? "Close menu" : "Open navigation sidebar"}
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

			{/* Slide-out Mobile Sidebar & Backdrop */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<>
						{/* Darkened Backdrop Overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.25 }}
							onClick={() => setMobileMenuOpen(false)}
							className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
							aria-hidden="true"
						/>

						{/* Slide-in Sidebar Panel from Right */}
						<motion.aside
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							transition={{ type: "spring", damping: 28, stiffness: 300 }}
							className="fixed top-0 right-0 bottom-0 z-50 flex w-[85%] max-w-sm flex-col justify-between border-[#DEDEDA] border-l bg-[#F7F7F4] p-6 shadow-2xl md:hidden dark:border-[#292929] dark:bg-[#0c0c0c]"
						>
							<div className="flex flex-col space-y-6">
								{/* Sidebar Header with Brand & Close Button */}
								<div className="flex items-center justify-between border-[#DEDEDA] border-b pb-4 dark:border-[#292929]">
									<div className="flex items-center space-x-2.5">
										<img
											src="/logo.jpg"
											alt="Evaluna"
											className="h-7 w-7 rounded-md border border-[#DEDEDA] object-cover dark:border-[#292929]"
										/>
										<div className="flex flex-col">
											<span className="font-semibold font-serif text-[#111111] text-xs uppercase tracking-tight dark:text-[#F5F5F2]">
												EVALUNA
											</span>
											<span className="-mt-0.5 font-mono text-[#666666] text-[8px] uppercase tracking-widest dark:text-[#A3A3A0]">
												Bhopal & Berasia
											</span>
										</div>
									</div>
									<button
										type="button"
										onClick={() => setMobileMenuOpen(false)}
										className="rounded-md p-1.5 text-[#111111] transition-colors hover:bg-black/5 dark:text-[#F5F5F2] dark:hover:bg-white/5"
										aria-label="Close navigation sidebar"
									>
										<X className="h-5 w-5" />
									</button>
								</div>

								{/* Navigation Directory Header */}
								<div className="flex items-center justify-between text-[#888888] text-[10px] font-mono uppercase tracking-widest dark:text-[#777777]">
									<span>NAVIGATION</span>
									<span>DIRECTORY</span>
								</div>

								{/* Sidebar Navigation Links */}
								<nav className="flex flex-col space-y-2 font-mono text-xs uppercase tracking-widest">
									{[
										{ href: "/#categories", num: "01", label: "Core Categories" },
										{ href: "/#why-choose", num: "02", label: "Why Choose Us" },
										{ href: "/#how-it-works", num: "03", label: "How It Works" },
										{ href: "/#trust", num: "04", label: "Trust & Support" },
										{ href: "/contact", num: "05", label: "Bulk Inquiry" },
									].map((item) => (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setMobileMenuOpen(false)}
											className="group flex items-center justify-between rounded-md px-2 py-2.5 text-[#111111] text-sm transition-all hover:bg-black/5 hover:opacity-90 dark:text-[#F5F5F2] dark:hover:bg-white/5"
										>
											<span className="flex items-center gap-2.5">
												<span className="text-[#888888] text-xs font-normal dark:text-[#666666]">
													{item.num}
												</span>
												<span className="font-medium">{item.label}</span>
											</span>
											<ArrowRight className="h-4 w-4 text-[#888888] transition-transform duration-200 group-hover:translate-x-1 dark:text-[#777777]" />
										</Link>
									))}
								</nav>
							</div>

							{/* Bottom Action Footer */}
							<div className="flex flex-col space-y-3 border-[#DEDEDA] border-t pt-5 dark:border-[#292929]">
								<a
									href="https://wa.me/919630649277?text=Namaste%20Evaluna%20Team%2C%20I%20want%20to%20inquire%20about%20wholesale%20grocery%20rates%20and%20orders."
									target="_blank"
									rel="noopener noreferrer"
									className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 py-2.5 text-center font-mono text-white text-xs uppercase tracking-wider shadow-sm transition-opacity hover:opacity-90"
								>
									<MessageCircle className="h-4 w-4" />
									<span>WhatsApp: +91 96306 49277</span>
								</a>
								<a
									href="tel:+919630649277"
									className="flex w-full items-center justify-center gap-2 rounded-md border border-[#111111] py-2.5 text-center font-mono text-[#111111] text-xs uppercase tracking-wider transition-colors hover:bg-[#111111] hover:text-[#F7F7F4] dark:border-[#F5F5F2] dark:text-[#F5F5F2] dark:hover:bg-[#F5F5F2] dark:hover:text-[#080808]"
								>
									<Phone className="h-4 w-4 text-emerald-600" />
									<span>Call: +91 96306 49277</span>
								</a>
								<Link
									href="/login"
									onClick={() => setMobileMenuOpen(false)}
									className="w-full rounded-md border border-[#DEDEDA] py-2 text-center font-mono text-[#666666] text-xs uppercase tracking-wider transition-colors hover:text-[#111111] dark:border-[#292929] dark:text-[#A3A3A0] dark:hover:text-[#F5F5F2]"
								>
									Employee Sign-In
								</Link>
								<Link
									href="/contact"
									onClick={() => setMobileMenuOpen(false)}
									className="w-full rounded-md bg-[#111111] py-2.5 text-center font-mono text-[#F7F7F4] text-xs uppercase tracking-wider transition-opacity hover:opacity-90 dark:bg-[#F5F5F2] dark:text-[#080808]"
								>
									Talk to a Specialist
								</Link>
								<div className="flex items-center justify-between pt-1 font-mono text-[#666666] text-[10px] dark:text-[#A3A3A0]">
									<Link
										href="/docs"
										onClick={() => setMobileMenuOpen(false)}
										className="hover:underline"
									>
										Docs & SOPs
									</Link>
									<span>23.26° N, 77.41° E</span>
								</div>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</header>
	);
}
