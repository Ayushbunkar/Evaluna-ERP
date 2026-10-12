import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Briefcase,
	Building2,
	CheckCircle2,
	Globe,
	Layers,
	MapPin,
	ShieldCheck,
	Target,
	Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "About Us — Mission & Enterprise Architecture",
	description:
		"Learn about Evaluna's mission to empower enterprise retailers, FMCG distributors, and warehouse networks across India with resilient cloud and offline infrastructure.",
	canonicalPath: "/about",
});

export default function AboutPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "About", url: "/about" },
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
						Company Profile & Architectural Mission
					</div>
					<h1 className="font-extrabold text-3xl sm:text-5xl text-foreground tracking-tight">
						About Evaluna Technologies
					</h1>
					<p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
						We engineer resilient digital infrastructure that unifies retail point-of-sale, multi-warehouse logistics, field workforce operations, and real-time accounting.
					</p>
				</div>

				{/* Company Overview Card */}
				<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
					<CardHeader className="pb-4">
						<h2 className="font-bold text-2xl text-foreground">Operational Foundation</h2>
						<p className="text-xs text-muted-foreground">
							Rooted in Madhya Pradesh with high-availability enterprise standards
						</p>
					</CardHeader>
					<CardContent className="space-y-6 pt-0">
						<p className="text-sm text-muted-foreground leading-relaxed">
							Evaluna Technologies Pvt. Ltd. was built to eliminate operational disconnects across Indian supply chains. Operating between central distribution hubs in Berasia and technology centers in Bhopal, our architecture powers mission-critical everyday commerce with offline tolerance and real-time ledger synchronization.
						</p>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 pt-2">
							<div className="flex items-center space-x-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs">
								<MapPin className="h-5 w-5 text-primary shrink-0" />
								<div>
									<span className="block font-semibold text-foreground">Headquarters</span>
									<span className="text-muted-foreground">Bhopal & Berasia, MP</span>
								</div>
							</div>

							<div className="flex items-center space-x-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs">
								<Building2 className="h-5 w-5 text-primary shrink-0" />
								<div>
									<span className="block font-semibold text-foreground">Depot Network</span>
									<span className="text-muted-foreground">Central Logistics Hub</span>
								</div>
							</div>

							<div className="flex items-center space-x-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs">
								<Layers className="h-5 w-5 text-primary shrink-0" />
								<div>
									<span className="block font-semibold text-foreground">Platform Scope</span>
									<span className="text-muted-foreground">POS, WMS, CRM & Finance</span>
								</div>
							</div>

							<div className="flex items-center space-x-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs">
								<ShieldCheck className="h-5 w-5 text-primary shrink-0" />
								<div>
									<span className="block font-semibold text-foreground">Standard</span>
									<span className="text-muted-foreground">Zero Downtime Design</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Mission & Values */}
				<section className="space-y-6">
					<h2 className="text-center font-bold text-2xl text-foreground tracking-tight">
						Our Mission & Architectural Pillars
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2 text-primary">
									<Target className="h-5 w-5" />
									<h3 className="font-bold text-xl text-foreground">Our Mission</h3>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 pt-0 text-sm text-muted-foreground leading-relaxed">
								<p>
									To empower fast-growing enterprises with integrated software that performs reliably in all environments — whether handling rapid barcode scanning in rural wholesale depots without internet or consolidating boardroom cash flow metrics in real time.
								</p>
								<p>
									We replace fragmented spreadsheets, manual registers, and unreliable legacy software with one coherent, beautifully designed platform.
								</p>
							</CardContent>
						</Card>

						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<div className="flex items-center gap-2 text-primary">
									<CheckCircle2 className="h-5 w-5" />
									<h3 className="font-bold text-xl text-foreground">Core Values</h3>
								</div>
							</CardHeader>
							<CardContent className="space-y-2.5 pt-0 text-xs text-muted-foreground">
								<div className="flex items-start gap-2.5">
									<span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
									<div>
										<strong className="text-foreground">Resilience First:</strong> Offline caches, atomic database transactions, and zero data loss tolerance.
									</div>
								</div>
								<div className="flex items-start gap-2.5">
									<span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
									<div>
										<strong className="text-foreground">Human-Centric Craft:</strong> Interfaces tailored for speed with barcode scanners, thermal printers, and touchscreens.
									</div>
								</div>
								<div className="flex items-start gap-2.5">
									<span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
									<div>
										<strong className="text-foreground">Total Accountability:</strong> Immutable audit logs, strict role permissions, and full traceability.
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Technical Systems Architecture */}
				<section className="space-y-6">
					<h2 className="text-center font-bold text-2xl text-foreground tracking-tight">
						The Integrated System Ecosystem
					</h2>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<h4 className="font-bold text-base text-foreground">Point of Sale (POS)</h4>
							</CardHeader>
							<CardContent className="space-y-2 pt-0 text-xs text-muted-foreground leading-relaxed">
								<p>Sub-second checkout, thermal ESC/POS receipt generation, barcode lookups, and offline-first queue synchronization.</p>
							</CardContent>
						</Card>

						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<h4 className="font-bold text-base text-foreground">Warehouse & WMS</h4>
							</CardHeader>
							<CardContent className="space-y-2 pt-0 text-xs text-muted-foreground leading-relaxed">
								<p>Put-away bin management, picking queue optimization, FEFO batch surveillance, and physical stock count audit control.</p>
							</CardContent>
						</Card>

						<Card className="border border-border/70 bg-card text-card-foreground shadow-xs">
							<CardHeader className="pb-3">
								<h4 className="font-bold text-base text-foreground">Finance & Accounting</h4>
							</CardHeader>
							<CardContent className="space-y-2 pt-0 text-xs text-muted-foreground leading-relaxed">
								<p>Automated 3-way matching, GST-compliant invoicing, purchase ledger tracking, and instant bank reconciliation.</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Call to Action */}
				<div className="rounded-2xl border border-border/80 bg-muted/30 p-8 sm:p-10 text-center space-y-4">
					<h3 className="font-bold text-2xl text-foreground">
						Explore the Evaluna Architecture
					</h3>
					<p className="text-sm text-muted-foreground max-w-xl mx-auto">
						Experience our modular systems or connect with our engineering team for enterprise inquiries.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3 pt-2">
						<Button asChild size="default" className="shadow-xs">
							<Link href="/features">Explore Features</Link>
						</Button>
						<Button asChild variant="outline" size="default" className="border-border/70 hover:bg-muted">
							<Link href="/contact">Contact Our Team</Link>
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
						<Link href="/contact" className="hover:text-foreground transition-colors">
							Contact
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
