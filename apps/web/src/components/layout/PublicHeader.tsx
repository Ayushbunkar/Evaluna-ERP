"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

interface PublicHeaderProps {
	className?: string;
}

export function PublicHeader({ className }: PublicHeaderProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<header
			suppressHydrationWarning
			className={`sticky top-0 z-50 w-full border-[#DEDEDA] border-b bg-[#F7F7F4]/90 py-3.5 backdrop-blur-md transition-colors dark:border-[#292929] dark:bg-[#080808]/90 ${className || ""}`}
		>
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
	);
}
