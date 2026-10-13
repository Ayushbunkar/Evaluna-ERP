import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	ArrowRight,
	Boxes,
	Building2,
	CheckCircle2,
	Clock,
	Layers,
	Network,
	ShieldCheck,
	ShoppingBag,
	Sparkles,
	Store,
	Truck,
	Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Industry Solutions — Tailored ERP Deployments",
	description:
		"Purpose-engineered ERP configurations for retail supermarkets, FMCG bulk distribution networks, multi-branch franchises, and supply chain logistics in Central India.",
	canonicalPath: "/solutions",
});

export default function SolutionsPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Solutions", url: "/solutions" },
	]);

	const solutions = [
		{
			title: "Retail Stores & Supermarkets",
			tag: "Fast Checkout & POS",
			description:
				"High-velocity checkout terminals with barcode scanning, automated cash drawer control, integrated UPI/cards, and instant daily ledger reconciliation.",
			icon: Store,
			features: [
				"Sub-second barcode & weighing scale POS checkout",
				"Instant reconciliation for cash, UPI, cards & split payments",
				"Direct-to-WhatsApp digital customer receipts & paperless billing",
				"Offline mode resilience when local internet disconnects",
			],
		},
		{
			title: "Wholesale & Bulk Distributors",
			tag: "B2B Trade & Slabs",
			description:
				"Volume-tier price slabs, multi-unit conversions (cartons, boxes, pieces), route van dispatch, and real-time customer credit limit enforcement.",
			icon: Boxes,
			features: [
				"Custom tiered pricing and volume slab automation",
				"Strict credit aging reports & automatic overdue alerts",
				"Delivery manifest generation & van sales dispatch",
				"Real-time customer outstanding balances at order booking",
			],
		},
		{
			title: "Rural & Tier-3/4 Enterprises",
			tag: "Offline-First Design",
			description:
				"Engineered specifically for semi-urban and rural regions prone to intermittent power and network drops, using local SQLite synchronization.",
			icon: ShoppingBag,
			features: [
				"100% offline billing with automatic background sync",
				"Compressed data payloads for 2G/3G low-bandwidth environments",
				"Bilingual English & Hindi interface for operators",
				"Thermal receipt printing via USB, Bluetooth, or LAN",
			],
		},
		{
			title: "Multi-Branch Chains & Franchises",
			tag: "Unified Multi-Location",
			description:
				"Centralized inventory visibility across all depots, inter-store branch transfer orders, consolidated balance sheets, and granular branch roles.",
			icon: Building2,
			features: [
				"Inter-branch transfer workflows with in-transit tracking",
				"Consolidated P&L and balance sheets across all locations",
				"Role-based permission matrix for branch managers & staff",
				"Real-time central stock audit without manual spreadsheets",
			],
		},
		{
			title: "Supply Chain & Logistics",
			tag: "Fleet & Last-Mile",
			description:
				"Complete delivery partner tracking, GPS attendance geofencing, route planning, vehicle fuel tracking, and digital Proof of Delivery (POD).",
			icon: Truck,
			features: [
				"Real-time driver route logs with GPS verification",
				"Digital signature and photo-verified Proof of Delivery (POD)",
				"Fleet maintenance schedules and fuel expense tracking",
				"Automated E-way bill generation & GST invoice matching",
			],
		},
		{
			title: "Omnichannel & Enterprise",
			tag: "Connected Ecosystem",
			description:
				"Unified inventory sync across digital channels, dedicated B2B wholesale portals, and open high-throughput REST/tRPC API integrations.",
			icon: Network,
			features: [
				"Single inventory source of truth across online & physical retail",
				"Self-service B2B ordering portal for downstream dealers",
				"Direct automated GST (GSTR-1 & GSTR-3B) filing integration",
				"Audit-proof immutable ledger records with timestamped logs",
			],
		},
	];

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors selection:bg-primary/20">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
			/>

			{/* Subtle ambient lighting */}
			<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
			</div>

			{/* Synchronized Homepage Navigation */}
			<PublicHeader />

			{/* Main Content */}
			<main className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
				{/* Hero Section */}
				<section className="mx-auto max-w-3xl space-y-5 pt-4 text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 font-medium text-primary text-xs">
						<Building2 className="h-3.5 w-3.5" /> Tailored Industry Solutions
					</div>
					<h1 className="font-extrabold text-3xl text-foreground leading-tight tracking-tight sm:text-5xl lg:text-6xl">
						Engineered For Your Specific{" "}
						<span className="text-primary">Industry Needs</span>
					</h1>
					<p className="mx-auto max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg">
						Whether you run a fast-paced retail counter, a multi-warehouse
						distribution network, or a regional franchise, Evaluna ERP adapts
						directly to your operational workflow.
					</p>
					<div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
						<Button size="lg" asChild className="w-full shadow-sm sm:w-auto">
							<Link href="/login">
								Open ERP Dashboard <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							asChild
							className="w-full border-border/80 hover:bg-muted sm:w-auto"
						>
							<Link href="/contact">Talk to an ERP Specialist</Link>
						</Button>
					</div>
				</section>

				{/* Key Architecture Badges */}
				<div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
					<div className="flex items-center space-x-3 rounded-xl border border-border/70 bg-card/60 p-3.5 text-card-foreground text-xs shadow-xs">
						<Zap className="h-5 w-5 shrink-0 text-primary" />
						<div>
							<span className="block font-semibold text-foreground">
								Zero-Lag POS
							</span>
							<span className="text-muted-foreground">Barcode & UPI sync</span>
						</div>
					</div>
					<div className="flex items-center space-x-3 rounded-xl border border-border/70 bg-card/60 p-3.5 text-card-foreground text-xs shadow-xs">
						<ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
						<div>
							<span className="block font-semibold text-foreground">
								100% Offline
							</span>
							<span className="text-muted-foreground">
								Auto-syncs on reconnect
							</span>
						</div>
					</div>
					<div className="flex items-center space-x-3 rounded-xl border border-border/70 bg-card/60 p-3.5 text-card-foreground text-xs shadow-xs">
						<Layers className="h-5 w-5 shrink-0 text-primary" />
						<div>
							<span className="block font-semibold text-foreground">
								Multi-Branch
							</span>
							<span className="text-muted-foreground">
								Central stock control
							</span>
						</div>
					</div>
					<div className="flex items-center space-x-3 rounded-xl border border-border/70 bg-card/60 p-3.5 text-card-foreground text-xs shadow-xs">
						<Clock className="h-5 w-5 shrink-0 text-primary" />
						<div>
							<span className="block font-semibold text-foreground">
								GST Invoicing
							</span>
							<span className="text-muted-foreground">Instant compliance</span>
						</div>
					</div>
				</div>

				{/* Solutions Grid */}
				<section className="space-y-6">
					<div className="flex flex-col justify-between gap-4 border-border/70 border-b pb-4 md:flex-row md:items-end">
						<div>
							<h2 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Purpose-Built Deployments
							</h2>
							<p className="mt-1 text-muted-foreground text-sm">
								Choose your sector configuration or deploy combined
								multi-channel capabilities.
							</p>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							<Sparkles className="h-4 w-4 text-primary" />
							<span>Fully integrated with Evaluna Ledger & WMS</span>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{solutions.map((item) => {
							const Icon = item.icon;
							return (
								<Card
									key={item.title}
									className="group flex flex-col justify-between border border-border/70 bg-card text-card-foreground shadow-xs transition-all hover:border-primary/50 hover:shadow-md"
								>
									<CardHeader className="space-y-3 pb-3">
										<div className="flex items-center justify-between">
											<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
												<Icon className="h-5 w-5" />
											</div>
											<span className="rounded-full border border-border/70 bg-muted/60 px-2.5 py-0.5 font-medium text-[11px] text-muted-foreground">
												{item.tag}
											</span>
										</div>
										<div>
											<CardTitle className="font-bold text-foreground text-lg">
												{item.title}
											</CardTitle>
											<CardDescription className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
												{item.description}
											</CardDescription>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="mt-2 border-border/60 border-t pt-4">
											<h4 className="mb-2.5 font-semibold text-[11px] text-foreground uppercase tracking-wider">
												Operational Capabilities
											</h4>
											<ul className="space-y-2">
												{item.features.map((f) => (
													<li
														key={f}
														className="flex items-start text-muted-foreground text-xs"
													>
														<CheckCircle2 className="mt-0.5 mr-2 h-3.5 w-3.5 flex-shrink-0 text-primary" />
														<span className="text-foreground/90 leading-tight">
															{f}
														</span>
													</li>
												))}
											</ul>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</section>

				{/* Bottom CTA Card */}
				<section className="space-y-6 rounded-2xl border border-border/80 bg-card p-8 text-center shadow-xs sm:p-12">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 font-medium text-primary text-xs">
						Unified Cloud & Offline Infrastructure
					</div>
					<h2 className="font-extrabold text-2xl text-foreground tracking-tight sm:text-4xl">
						Ready to streamline your enterprise operations?
					</h2>
					<p className="mx-auto max-w-xl text-muted-foreground text-sm leading-relaxed sm:text-base">
						Experience seamless inventory routing, high-velocity POS counters,
						and real-time financial tracking built for Indian enterprises.
					</p>
					<div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
						<Button size="lg" asChild className="w-full shadow-sm sm:w-auto">
							<Link href="/login">
								Launch Evaluna ERP <ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							asChild
							className="w-full border-border/80 hover:bg-muted sm:w-auto"
						>
							<Link href="/contact">Contact Support</Link>
						</Button>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="mt-16 border-border border-t bg-card/40 py-10">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<Link href="/" className="flex items-center space-x-2.5">
							<img
								src="/logo.jpg"
								alt="Evaluna ERP"
								className="h-7 w-7 rounded-lg object-cover"
							/>
							<span className="font-bold text-foreground text-lg">
								Evaluna ERP
							</span>
						</Link>
						<div className="text-muted-foreground text-xs sm:text-sm">
							© {new Date().getFullYear()} Evaluna Technologies Pvt. Ltd.
							Central India Hub (Bhopal & Berasia).
						</div>
					</div>
					<div className="mt-6 flex flex-wrap justify-center space-x-6 text-muted-foreground text-xs sm:text-sm md:justify-end">
						<Link
							href="/features"
							className="transition-colors hover:text-foreground"
						>
							Features
						</Link>
						<Link
							href="/about"
							className="transition-colors hover:text-foreground"
						>
							About Company
						</Link>
						<Link
							href="/privacy"
							className="transition-colors hover:text-foreground"
						>
							Privacy Policy
						</Link>
						<Link
							href="/terms"
							className="transition-colors hover:text-foreground"
						>
							Terms of Service
						</Link>
						<Link
							href="/docs"
							className="transition-colors hover:text-foreground"
						>
							Documentation
						</Link>
						<Link
							href="/contact"
							className="transition-colors hover:text-foreground"
						>
							Contact
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
