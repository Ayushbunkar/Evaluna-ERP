"use client";

import { Button } from "@evaluna/ui/components/button";
import { motion } from "framer-motion";
import {
	ArrowRight,
	Facebook,
	Instagram,
	Linkedin,
	Twitter,
} from "lucide-react";
import Link from "next/link";

export function Footer() {
	const currentYear = new Date().getFullYear();

	const productLinks = [
		{ name: "Product Overview", href: "/product" },
		{ name: "Features", href: "/features" },
		{ name: "Solutions", href: "/solutions" },
		{ name: "Pricing", href: "/pricing" },
		{ name: "ERP Dashboard", href: "/login" },
	];

	const companyLinks = [
		{ name: "About Us", href: "/about" },
		{ name: "Careers", href: "/careers" },
		{ name: "Contact", href: "/contact" },
		{ name: "Blog", href: "/blog" },
	];

	const resourcesLinks = [
		{ name: "Documentation", href: "/resources" },
		{ name: "Guides", href: "/resources/guides" },
		{ name: "Product Updates", href: "/resources/updates" },
		{ name: "Help Center", href: "/resources/help" },
	];

	const legalLinks = [
		{ name: "Privacy Policy", href: "/legal/privacy" },
		{ name: "Terms of Service", href: "/legal/terms" },
		{ name: "Cookie Policy", href: "/legal/cookies" },
	];

	return (
		<footer className="border-border border-t bg-background">
			<div className="public-container">
				<div className="py-16">
					<div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
						{/* Brand Section */}
						<div className="lg:col-span-1">
							<h3 className="mb-4 font-bold text-foreground text-xl">
								Evalona
							</h3>
							<p className="mb-6 max-w-xs text-muted-foreground text-sm">
								Business infrastructure for rural and growing businesses.
							</p>

							<div className="flex gap-4">
								<Button size="sm" asChild>
									<Link href="/login">
										Login <ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</div>

						{/* Product Links */}
						<div>
							<h4 className="mb-4 font-semibold text-foreground">Product</h4>
							<ul className="space-y-3">
								{productLinks.map((link) => (
									<li key={link.name}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-foreground"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Company Links */}
						<div>
							<h4 className="mb-4 font-semibold text-foreground">Company</h4>
							<ul className="space-y-3">
								{companyLinks.map((link) => (
									<li key={link.name}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-foreground"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Resources Links */}
						<div>
							<h4 className="mb-4 font-semibold text-foreground">Resources</h4>
							<ul className="space-y-3">
								{resourcesLinks.map((link) => (
									<li key={link.name}>
										<Link
											href={link.href}
											className="text-muted-foreground text-sm transition-colors hover:text-foreground"
										>
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* Bottom Section */}
					<div className="mt-12 flex flex-col items-center justify-between gap-6 border-border border-t pt-8 md:flex-row">
						<div className="text-muted-foreground text-sm">
							Â© {currentYear} Evalona. All rights reserved.
						</div>

						<div className="flex items-center gap-6">
							<div className="flex gap-4">
								{legalLinks.map((link) => (
									<Link
										key={link.name}
										href={link.href}
										className="text-muted-foreground text-sm transition-colors hover:text-foreground"
									>
										{link.name}
									</Link>
								))}
							</div>

							<div className="flex gap-4">
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground"
								>
									<Facebook className="h-5 w-5" />
								</Link>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground"
								>
									<Twitter className="h-5 w-5" />
								</Link>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground"
								>
									<Linkedin className="h-5 w-5" />
								</Link>
								<Link
									href="#"
									className="text-muted-foreground hover:text-foreground"
								>
									<Instagram className="h-5 w-5" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
