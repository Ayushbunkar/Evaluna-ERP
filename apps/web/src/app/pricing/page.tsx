import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Footer } from "@/components/public/footer";
import {
	constructMetadata,
	generateBreadcrumbSchema,
	generatePricingProductSchema,
} from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Pricing Plans — Transparent ERP Subscriptions",
	description:
		"Affordable, transparent pricing plans for retailers, wholesalers, and FMCG distributors. Start your 14-day free trial with no lock-in.",
	canonicalPath: "/pricing",
});

export default function PricingPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Pricing", url: "/pricing" },
	]);
	const productJson = generatePricingProductSchema();
	const tiers = [
		{
			name: "Starter",
			price: "₹999",
			period: "/month",
			description:
				"Perfect for single-store retailers and small business owners.",
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
			description:
				"Ideal for growing retailers, distributors, and multi-counter stores.",
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
			description:
				"Tailored for large multi-branch chains, franchise networks, & logistics.",
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
		<div className="min-h-screen bg-background text-foreground transition-colors duration-300">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(productJson) }}
			/>
			<PublicHeader />

			<section className="mx-auto max-w-7xl px-4 pt-10 pb-16 text-center sm:px-6 lg:px-8">
				<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 font-medium text-blue-700 text-xs sm:text-sm">
					<Sparkles className="h-4 w-4" /> Transparent & Predictable Pricing
				</div>
				<h1 className="mx-auto mb-6 max-w-4xl font-extrabold text-3xl text-slate-900 leading-tight tracking-tight sm:text-5xl lg:text-6xl">
					Simple Plans That{" "}
					<span className="text-blue-600">Scale With Your Business</span>
				</h1>
				<p className="mx-auto mb-10 max-w-2xl text-base text-slate-600 sm:text-lg lg:text-xl">
					No hidden fees, no per-transaction charges. Start free for 14 days and
					upgrade as your enterprise grows.
				</p>
			</section>

			<section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3">
					{tiers.map((tier) => (
						<Card
							key={tier.name}
							className={`relative flex flex-col justify-between transition-all duration-200 ${
								tier.popular
									? "z-10 scale-105 border-2 border-blue-600 bg-white shadow-xl"
									: "border border-slate-200 bg-white shadow hover:shadow-md"
							}`}
						>
							{tier.popular && (
								<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 font-semibold text-white text-xs uppercase tracking-wide">
									Most Popular
								</div>
							)}
							<CardHeader className="pt-6 pb-4">
								<CardTitle className="font-bold text-2xl text-slate-900">
									{tier.name}
								</CardTitle>
								<CardDescription className="mt-1 text-slate-600 text-sm">
									{tier.description}
								</CardDescription>
								<div className="mt-4 flex items-baseline gap-1">
									<span className="font-extrabold text-4xl text-slate-900">
										{tier.price}
									</span>
									{tier.period && (
										<span className="text-slate-500 text-sm">
											{tier.period}
										</span>
									)}
								</div>
							</CardHeader>
							<CardContent className="flex flex-1 flex-col justify-between">
								<ul className="mb-8 space-y-3 border-slate-100 border-t pt-4">
									{tier.features.map((f) => (
										<li
											key={f}
											className="flex items-start text-slate-700 text-sm"
										>
											<CheckCircle2 className="mt-0.5 mr-2.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
											<span>{f}</span>
										</li>
									))}
								</ul>
								<Button
									size="lg"
									className={`w-full font-semibold ${
										tier.popular
											? "bg-blue-600 text-white hover:bg-blue-700"
											: "bg-slate-900 text-white hover:bg-slate-800"
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
