import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function PricingPage() {
	const tiers = [
		{
			name: "Starter",
			price: "₹999",
			period: "/month",
			description: "Perfect for single-store retailers and small business owners.",
			popular: false,
			features: [
				"1 Store / Branch location",
				"Up to 3 Staff User Accounts",
				"Fast Barcode POS Billing",
				"GST Invoicing & Reports",
				"Offline Billing with Auto-Sync",
				"Standard Email & Chat Support",
			],
			cta: "Start 14-Day Trial",
			href: "/signup",
		},
		{
			name: "Growth",
			price: "₹2,499",
			period: "/month",
			description: "Ideal for growing retailers, distributors, and multi-counter stores.",
			popular: true,
			features: [
				"Up to 5 Branches / Warehouses",
				"Unlimited Staff & Cashier Accounts",
				"Advanced Inventory & Lot Tracking",
				"GPS Geofenced Staff Attendance",
				"Purchase Orders & Supplier Portal",
				"Thermal Receipt Printing & Barcode Gen",
				"Priority 24/7 Phone & WhatsApp Support",
			],
			cta: "Start 14-Day Trial",
			href: "/signup",
		},
		{
			name: "Enterprise",
			price: "Custom",
			period: "",
			description: "Tailored for large multi-branch chains, franchise networks, & logistics.",
			popular: false,
			features: [
				"Unlimited Branches & Warehouses",
				"Custom Role-Based Permissions (RBAC)",
				"Dedicated Account Manager",
				"Custom ERP & Tally Integrations",
				"On-premise or Private Cloud Deployment",
				"99.99% SLA & Custom Training",
			],
			cta: "Contact Sales",
			href: "/contact",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />

			<section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-6">
					<Sparkles className="w-4 h-4" /> Transparent & Predictable Pricing
				</div>
				<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					Simple Plans That <span className="text-blue-600">Scale With Your Business</span>
				</h1>
				<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
					No hidden fees, no per-transaction charges. Start free for 14 days and upgrade as your enterprise grows.
				</p>
			</section>

			<section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
					{tiers.map((tier) => (
						<Card
							key={tier.name}
							className={`flex flex-col justify-between relative transition-all duration-200 ${
								tier.popular
									? "border-2 border-blue-600 shadow-xl bg-white scale-105 z-10"
									: "border border-slate-200 shadow bg-white hover:shadow-md"
							}`}
						>
							{tier.popular && (
								<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full uppercase tracking-wide">
									Most Popular
								</div>
							)}
							<CardHeader className="pb-4 pt-6">
								<CardTitle className="text-2xl font-bold text-slate-900">{tier.name}</CardTitle>
								<CardDescription className="text-slate-600 text-sm mt-1">{tier.description}</CardDescription>
								<div className="mt-4 flex items-baseline gap-1">
									<span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
									{tier.period && <span className="text-slate-500 text-sm">{tier.period}</span>}
								</div>
							</CardHeader>
							<CardContent className="flex-1 flex flex-col justify-between">
								<ul className="space-y-3 mb-8 pt-4 border-t border-slate-100">
									{tier.features.map((f) => (
										<li key={f} className="flex items-start text-sm text-slate-700">
											<CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2.5 flex-shrink-0 mt-0.5" />
											<span>{f}</span>
										</li>
									))}
								</ul>
								<Button
									size="lg"
									className={`w-full font-semibold ${
										tier.popular
											? "bg-blue-600 hover:bg-blue-700 text-white"
											: "bg-slate-900 hover:bg-slate-800 text-white"
									}`}
									asChild
								>
									<Link href={tier.href}>{tier.cta}</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Footer />
		</div>
	);
}
