import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import {
	ArrowRight,
	Boxes,
	Building2,
	CheckCircle2,
	Network,
	ShoppingBag,
	Store,
	Truck,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function SolutionsPage() {
	const solutions = [
		{
			title: "Retail Stores & Supermarkets",
			description:
				"Fast-paced checkout lines with barcode scanning, automated cash drawer control, integrated UPI/cards, and instant daily ledger settlement.",
			icon: Store,
			features: [
				"High-speed barcode & weighing scale POS",
				"Loyalty programs & customer WhatsApp receipts",
				"Instant reconciliation for cash, UPI, & card",
			],
		},
		{
			title: "Wholesale & Bulk Distributors",
			description:
				"Volume-tier discount schemes, multi-unit conversions (cartons, boxes, pieces), route van dispatch, and credit limit management.",
			icon: Boxes,
			features: [
				"Tiered pricing & wholesale quantity slabs",
				"Credit aging reports & payment reminders",
				"Delivery manifest & van sales dispatch",
			],
		},
		{
			title: "Rural & Tier-3/4 Enterprises",
			description:
				"Purpose-built to operate in areas with intermittent electrical power and network disruptions using offline synchronization.",
			icon: ShoppingBag,
			features: [
				"100% offline billing with auto-sync",
				"Low bandwidth data payload compression",
				"Vernacular English & Hindi interface",
			],
		},
		{
			title: "Multi-Branch Chains & Franchises",
			description:
				"Centralized inventory oversight, inter-store branch transfers, consolidated balance sheets, and granular branch permissions.",
			icon: Building2,
			features: [
				"Inter-branch transfer orders & transit tracking",
				"Consolidated P&L across all franchise branches",
				"Role-based access for local managers & staff",
			],
		},
		{
			title: "Supply Chain & Logistics",
			description:
				"Complete delivery partner tracking, GPS attendance geofencing, route planning, and Proof of Delivery (POD) image capture.",
			icon: Truck,
			features: [
				"Real-time driver location & route logs",
				"Digital signature & photo proof of delivery",
				"Vehicle maintenance & fuel expense tracking",
			],
		},
		{
			title: "Omnichannel & Enterprise",
			description:
				"Unified inventory sync across digital channels, B2B wholesale portals, and open REST/tRPC API integrations.",
			icon: Network,
			features: [
				"Centralized inventory hub for online & offline",
				"B2B ordering portal for downstream dealers",
				"Automated E-way bill & GST filing integration",
			],
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />

			{/* Hero */}
			<section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-6">
					<Building2 className="w-4 h-4" /> Tailored Industry Solutions
				</div>
				<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					Engineered For Your Specific <span className="text-blue-600">Industry Needs</span>
				</h1>
				<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
					Whether you run a single retail store, a multi-warehouse distribution network, or a rural franchise, Evaluna ERP adapts to your unique workflow.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium w-full sm:w-auto" asChild>
						<Link href="/signup">
							Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
					<Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
						<Link href="/contact">Talk to an ERP Specialist</Link>
					</Button>
				</div>
			</section>

			{/* Solutions Grid */}
			<section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{solutions.map((item) => {
						const Icon = item.icon;
						return (
							<Card key={item.title} className="border border-slate-200 hover:shadow-lg transition-all bg-white flex flex-col justify-between">
								<CardHeader className="pb-3">
									<div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
										<Icon className="w-6 h-6" />
									</div>
									<CardTitle className="text-xl font-bold text-slate-900">{item.title}</CardTitle>
									<CardDescription className="text-slate-600 text-sm mt-1">{item.description}</CardDescription>
								</CardHeader>
								<CardContent className="pt-0">
									<div className="border-t border-slate-100 pt-4 mt-2">
										<h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Highlights</h4>
										<ul className="space-y-2">
											{item.features.map((f) => (
												<li key={f} className="flex items-start text-xs sm:text-sm text-slate-700">
													<CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
													<span>{f}</span>
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

			{/* Bottom CTA */}
			<section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-slate-200">
				<h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to automate your business?</h2>
				<p className="text-slate-600 max-w-xl mx-auto mb-8 text-sm sm:text-base">
					Deploy Evaluna ERP across your stores, warehouses, and headquarters in minutes.
				</p>
				<Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
					<Link href="/signup">Get Started Free</Link>
				</Button>
			</section>

			<Footer />
		</div>
	);
}
