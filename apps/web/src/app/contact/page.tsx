import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Clock,
	Headset,
	Laptop,
	Mail,
	MapPin,
	Phone,
	Shield,
	User,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Contact Us — Sales Inquiries & Enterprise Support",
	description:
		"Get in touch with our solutions engineering team for custom ERP deployment, enterprise sales, or technical support across India.",
	canonicalPath: "/contact",
});

export default function ContactPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Contact", url: "/contact" },
	]);

	return (
		<div className="min-h-screen bg-background text-foreground transition-colors duration-300">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
			/>

			{/* Navigation */}
			<nav className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md transition-colors">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<Link href="/" className="group flex items-center space-x-2.5">
							<img
								src="/logo.jpg"
								alt="Evaluna ERP"
								className="h-9 w-9 rounded-xl object-cover shadow-xs transition-transform group-hover:scale-105"
							/>
							<span className="font-bold text-foreground text-xl tracking-tight">
								Evaluna ERP
							</span>
						</Link>
						<div className="flex items-center space-x-2 sm:space-x-3">
							<LocaleSwitcher />
							<ThemeToggle />
							<Button asChild variant="outline" size="sm" className="border-border/70 hover:bg-muted text-xs">
								<Link href="/">
									<ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Home
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
				{/* Header */}
				<div className="text-center space-y-4 max-w-3xl mx-auto">
					<div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
						Enterprise Support & Inquiries
					</div>
					<h1 className="font-extrabold text-3xl sm:text-5xl text-foreground tracking-tight">
						Get in Touch with Evaluna
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
						Need assistance with our systems or planning a regional enterprise deployment? Our technical and solutions team is here to support you.
					</p>
				</div>

				{/* Primary Contact Channels */}
				<section className="space-y-6">
					<h2 className="text-center font-bold text-2xl text-foreground tracking-tight">
						Direct Support Channels
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						{/* Email Channel */}
						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors">
							<CardHeader className="text-center pb-4">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
									<Mail className="h-6 w-6" />
								</div>
								<h3 className="font-bold text-xl text-foreground">Email Support</h3>
								<p className="text-xs text-muted-foreground">
									For technical documentation, account queries, and enterprise inquiries
								</p>
							</CardHeader>
							<CardContent className="space-y-3 pt-0">
								<div className="space-y-2.5">
									<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
										<span className="font-medium text-foreground">General Support</span>
										<a
											href="mailto:support@evaluna.com"
											className="font-mono text-primary hover:underline"
										>
											support@evaluna.com
										</a>
									</div>
									<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
										<span className="font-medium text-foreground">ERP Operations</span>
										<a
											href="mailto:erp-support@evaluna.com"
											className="font-mono text-primary hover:underline"
										>
											erp-support@evaluna.com
										</a>
									</div>
									<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
										<span className="font-medium text-foreground">Security & Audit</span>
										<a
											href="mailto:security@evaluna.com"
											className="font-mono text-primary hover:underline"
										>
											security@evaluna.com
										</a>
									</div>
								</div>
								<div className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
									<Clock className="h-3.5 w-3.5" />
									<span>Average response time: 1–2 business hours</span>
								</div>
							</CardContent>
						</Card>

						{/* Phone Channel */}
						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs hover:border-primary/40 transition-colors">
							<CardHeader className="text-center pb-4">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
									<Phone className="h-6 w-6" />
								</div>
								<h3 className="font-bold text-xl text-foreground">Phone Support</h3>
								<p className="text-xs text-muted-foreground">
									For critical warehouse line issues and real-time operational assistance
								</p>
							</CardHeader>
							<CardContent className="space-y-3 pt-0">
								<div className="space-y-2.5">
									<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
										<span className="font-medium text-foreground">Direct Desk</span>
										<span className="font-mono font-bold text-foreground">
											+91 96306 49277
										</span>
									</div>
									<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
										<span className="font-medium text-foreground">Warehouse Hotline</span>
										<span className="font-mono text-muted-foreground">
											Ext. 1501
										</span>
									</div>
									<div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
										<span className="font-medium text-foreground">After Hours Emergency</span>
										<span className="font-mono text-muted-foreground">
											Ext. 1502
										</span>
									</div>
								</div>
								<div className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
									<Clock className="h-3.5 w-3.5" />
									<span>Hours: Monday to Saturday, 8:00 AM – 8:00 PM IST</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Specialized Support Teams */}
				<section className="space-y-6">
					<h2 className="text-center font-bold text-2xl text-foreground tracking-tight">
						Our Dedicated Support Units
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="text-center pb-3">
								<div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<User className="h-5 w-5" />
								</div>
								<h3 className="font-bold text-lg text-foreground">Field & POS Support</h3>
								<p className="text-xs text-muted-foreground">
									Assistance for store cashiers, sales agents & operators
								</p>
							</CardHeader>
							<CardContent className="space-y-4 pt-0">
								<ul className="space-y-2 text-xs text-muted-foreground">
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Offline POS receipt sync issues</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>ESC/POS Thermal printer setup</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Field GPS agent app support</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Staff PIN & password resets</span>
									</li>
								</ul>
								<Button className="w-full text-xs h-9" variant="outline" asChild>
									<Link href="mailto:support@evaluna.com?subject=Field%20POS%20Support">
										Contact Field Support
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="text-center pb-3">
								<div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Laptop className="h-5 w-5" />
								</div>
								<h3 className="font-bold text-lg text-foreground">Technical & WMS</h3>
								<p className="text-xs text-muted-foreground">
									Depot inventory, FEFO batching & database sync
								</p>
							</CardHeader>
							<CardContent className="space-y-4 pt-0">
								<ul className="space-y-2 text-xs text-muted-foreground">
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Warehouse bin & batch tracking</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>GST tax ledger reconciliation</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Bulk SKU data import/export</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Discrepancy audit investigations</span>
									</li>
								</ul>
								<Button className="w-full text-xs h-9" variant="outline" asChild>
									<Link href="mailto:erp-support@evaluna.com?subject=WMS%20Technical%20Query">
										Contact Technical Support
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="text-center pb-3">
								<div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Shield className="h-5 w-5" />
								</div>
								<h3 className="font-bold text-lg text-foreground">Security & Compliance</h3>
								<p className="text-xs text-muted-foreground">
									Permissions, audit trails & access oversight
								</p>
							</CardHeader>
							<CardContent className="space-y-4 pt-0">
								<ul className="space-y-2 text-xs text-muted-foreground">
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Role-based permission elevation</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Two-factor authentication setup</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Financial payment approval logs</span>
									</li>
									<li className="flex items-center gap-2">
										<span className="h-1.5 w-1.5 rounded-full bg-primary" />
										<span>Data privacy compliance requests</span>
									</li>
								</ul>
								<Button className="w-full text-xs h-9" variant="outline" asChild>
									<Link href="mailto:security@evaluna.com?subject=Security%20Compliance">
										Contact Security Team
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Physical Office & Depot Locations */}
				<section className="space-y-6">
					<h2 className="text-center font-bold text-2xl text-foreground tracking-tight">
						Our Facilities & Presence
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2 text-primary">
									<MapPin className="h-5 w-5" />
									<h3 className="font-bold text-lg text-foreground">Berasia Central Depot</h3>
								</div>
								<p className="text-xs text-muted-foreground">
									Primary Warehouse & Receiving Hub
								</p>
							</CardHeader>
							<CardContent className="space-y-3 pt-0 text-xs">
								<div className="space-y-1">
									<p className="font-medium text-foreground">Physical Address:</p>
									<p className="text-muted-foreground leading-relaxed">
										Near Bank of India, Vidisha Road, Berasia,
										<br />
										Bhopal, Madhya Pradesh — 463106, India
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-foreground">Direct Desk:</p>
									<p className="font-mono text-muted-foreground">+91 96306 49277</p>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-foreground">Operations:</p>
									<p className="text-muted-foreground">
										Inbound Supplier Receiving, Batch Allocation & Quality Inspection
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2 text-primary">
									<MapPin className="h-5 w-5" />
									<h3 className="font-bold text-lg text-foreground">Bhopal Technology Network</h3>
								</div>
								<p className="text-xs text-muted-foreground">
									Solutions Engineering & Architecture
								</p>
							</CardHeader>
							<CardContent className="space-y-3 pt-0 text-xs">
								<div className="space-y-1">
									<p className="font-medium text-foreground">Location:</p>
									<p className="text-muted-foreground leading-relaxed">
										Bhopal Technology Network,
										<br />
										Central Madhya Pradesh, India
									</p>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-foreground">Inquiries:</p>
									<p className="font-mono text-muted-foreground">support@evaluna-erp.com</p>
								</div>
								<div className="space-y-1">
									<p className="font-medium text-foreground">Scope:</p>
									<p className="text-muted-foreground">
										Platform Engineering, Cloud Infrastructure & Central Analytics
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Final Callout */}
				<div className="rounded-2xl border border-border/80 bg-muted/30 p-8 sm:p-10 text-center space-y-4">
					<h3 className="font-bold text-2xl text-foreground">
						Ready to streamline your enterprise operations?
					</h3>
					<p className="text-sm text-muted-foreground max-w-xl mx-auto">
						Whether you need a custom multi-store POS rollout or multi-depot WMS integration, our engineering team is ready to assist.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
						<Button asChild size="default" className="shadow-xs">
							<Link href="mailto:support@evaluna.com">Email Us Directly</Link>
						</Button>
						<Button asChild variant="outline" size="default" className="border-border/70 hover:bg-muted">
							<Link href="/login">Employee Login</Link>
						</Button>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="mt-16 border-t border-border/60 bg-muted/20 py-8 transition-colors">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
					<div className="flex items-center space-x-2">
						<img
							src="/logo.jpg"
							alt="Evaluna ERP"
							className="h-5 w-5 rounded-md object-cover"
						/>
						<span className="font-bold text-foreground">Evaluna ERP</span>
						<span>• Bhopal & Berasia, MP</span>
					</div>
					<div>
						© {new Date().getFullYear()} Evaluna Technologies Pvt. Ltd. All rights reserved.
					</div>
					<div className="flex items-center space-x-4">
						<Link href="/privacy" className="hover:text-foreground transition-colors">
							Privacy
						</Link>
						<Link href="/terms" className="hover:text-foreground transition-colors">
							Terms
						</Link>
						<Link href="/about" className="hover:text-foreground transition-colors">
							About
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
