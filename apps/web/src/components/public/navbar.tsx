"use client";

import { Button } from "@evaluna/ui/components/button";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 20);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navItems = [
		{ name: "Product", href: "/product" },
		{ name: "Solutions", href: "/solutions" },
		{ name: "Features", href: "/features" },
		{ name: "Company", href: "/about" },
		{ name: "Resources", href: "/resources" },
	];

	return (
		<header
			className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-white/80"}`}
		>
			<div className="public-container">
				<div className="flex h-20 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center gap-2">
						<Link href="/" className="flex items-center gap-2">
							<span className="font-bold text-foreground text-xl">Evalona</span>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden items-center gap-8 lg:flex">
						{navItems.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
							>
								{item.name}
							</Link>
						))}
					</nav>

					{/* Desktop CTA */}
					<div className="hidden items-center gap-4 lg:flex">
						<Button variant="outline" size="sm" asChild>
							<Link href="/login">
								<LogIn className="mr-2 h-4 w-4" />
								Login
							</Link>
						</Button>
						<Button size="sm" asChild>
							<Link href="/signup">
								Get Started <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<div className="lg:hidden">
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="rounded-md border border-border p-2"
							aria-label="Toggle menu"
						>
							{isMobileMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Navigation */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3 }}
						className="overflow-hidden lg:hidden"
					>
						<div className="border-border border-t bg-white">
							<div className="public-container py-6">
								<div className="flex flex-col gap-4">
									{navItems.map((item) => (
										<Link
											key={item.name}
											href={item.href}
											className="py-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
											onClick={() => setIsMobileMenuOpen(false)}
										>
											{item.name}
										</Link>
									))}
									<div className="mt-6 flex flex-col gap-4 border-border border-t pt-4">
										<Button variant="outline" size="sm" asChild>
											<Link
												href="/login"
												onClick={() => setIsMobileMenuOpen(false)}
											>
												<LogIn className="mr-2 h-4 w-4" />
												Login
											</Link>
										</Button>
										<Button size="sm" asChild>
											<Link
												href="/signup"
												onClick={() => setIsMobileMenuOpen(false)}
											>
												Get Started <ArrowRight className="ml-2 h-4 w-4" />
											</Link>
										</Button>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
