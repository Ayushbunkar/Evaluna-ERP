import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import {
	ArrowRight,
	BarChart3,
	CheckCircle2,
	Layers,
	Package,
	ShieldCheck,
	Truck,
	Users,
	WifiOff,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function ProductPage() {
	const coreModules = [
		{
			title: "Point of Sale & Billing",
			description:
				"Ultra-fast barcode scanning, offline invoice creation, thermal receipt printing, and seamless GST compliance.",
			icon: Zap,
			highlights: ["Barcode & QR scanning", "Offline receipt generation", "Multi-payment support"],
		},
		{
			title: "Inventory & Warehouse",
			description:
				"Real-time stock tracking across multiple warehouses, automated reorder triggers, and lot/expiry tracking.",
			icon: Package,
			highlights: ["Batch & expiry tracking", "Low stock alerts", "Multi-warehouse transfers"],
		},
		{
			title: "Procurement & Suppliers",
			description:
				"End-to-end purchase order lifecycle, vendor quotation comparison, and automated goods received notes (GRN).",
			icon: Truck,
			highlights: ["PO to GRN matching", "Supplier performance analytics", "Payment ledger sync"],
		},
		{
			title: "HR & Geofenced Attendance",
			description:
				"GPS geofence check-in/out, face photo capture, shift management, biometric sync, and payroll processing.",
			icon: Users,
			highlights: ["GPS + photo check-in", "Branch geofencing", "Leave & payroll calculation"],
		},
		{
			title: "Financial Accounting",
			description:
				"Double-entry bookkeeping, automated bank reconciliation, profit/loss statements, and balance sheet generation.",
			icon: BarChart3,
			highlights: ["Automated P&L reports", "GST filing reports", "Audit-ready ledgers"],
		},
		{
			title: "Enterprise Security & RBAC",
			description:
				"Fine-grained role-based permissions, multi-branch data isolation, and comprehensive audit trail logging.",
			icon: ShieldCheck,
			highlights: ["14+ predefined roles", "Audit trail logs", "Multi-branch security"],
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />

			{/* Hero Section */}
			<section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-6">
					<Layers className="w-4 h-4" /> Next-Generation Enterprise Platform
				</div>
				<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					All Your Business Operations In <span className="text-blue-600">One Unified ERP</span>
				</h1>
				<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
					Engineered for Indian businesses, distributors, and rural enterprises. Works reliably online and offline with zero downtime.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium" asChild>
						<Link href="/signup">
							Start 14-Day Free Trial <ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
					<Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
						<Link href="/demo">Explore Interactive Demo</Link>
					</Button>
				</div>
			</section>

			{/* Key Capabilities Grid */}
			<section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
				<div className="text-center mb-12">
					<h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Enterprise Modules Built to Scale</h2>
					<p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
						Every tool you need to run, audit, and grow your enterprise with complete operational clarity.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
					{coreModules.map((module) => {
						const Icon = module.icon;
						return (
							<Card key={module.title} className="border border-slate-200 hover:shadow-lg transition-all bg-white">
								<CardHeader className="pb-3">
									<div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
										<Icon className="w-6 h-6" />
									</div>
									<CardTitle className="text-xl font-bold text-slate-900">{module.title}</CardTitle>
									<CardDescription className="text-slate-600 text-sm">{module.description}</CardDescription>
								</CardHeader>
								<CardContent className="pt-0">
									<ul className="space-y-2 mt-2">
										{module.highlights.map((h) => (
											<li key={h} className="flex items-center text-xs sm:text-sm text-slate-700">
												<CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
												{h}
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>

			{/* Architecture & Offline section */}
			<section className="py-16 bg-slate-900 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<div>
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-medium mb-4">
								<WifiOff className="w-3.5 h-3.5" /> Offline-First Engine
							</div>
							<h2 className="text-2xl sm:text-4xl font-bold mb-4">
								Uninterrupted operations even with spotty internet.
							</h2>
							<p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
								Evaluna ERP stores transactions locally with client-side indexing and syncs in the background when connectivity resumes. Your checkout line never stops moving.
							</p>
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
									<div>
										<h4 className="font-semibold text-sm">IndexedDB Local Cache</h4>
										<p className="text-xs text-slate-400">Stores products, customer data, and sales offline.</p>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
									<div>
										<h4 className="font-semibold text-sm">Conflict-Free Sync Protocol</h4>
										<p className="text-xs text-slate-400">Automatic merge resolution for distributed branch registers.</p>
									</div>
								</div>
							</div>
						</div>
						<div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-2xl">
							<div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full bg-red-500" />
									<div className="w-3 h-3 rounded-full bg-yellow-500" />
									<div className="w-3 h-3 rounded-full bg-emerald-500" />
									<span className="text-xs text-slate-400 ml-2">Evaluna Sync Monitor</span>
								</div>
								<span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
									Online & Synchronized
								</span>
							</div>
							<div className="space-y-3 text-xs font-mono text-slate-300">
								<div className="p-3 bg-slate-900/60 rounded border border-slate-700/50 flex justify-between">
									<span>POS Terminal 01:</span>
									<span className="text-emerald-400">0 Pending Buffers</span>
								</div>
								<div className="p-3 bg-slate-900/60 rounded border border-slate-700/50 flex justify-between">
									<span>Warehouse Scanner:</span>
									<span className="text-emerald-400">Synced 12s ago</span>
								</div>
								<div className="p-3 bg-slate-900/60 rounded border border-slate-700/50 flex justify-between">
									<span>Branch Central:</span>
									<span className="text-blue-400">Latency: 28ms</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
				<h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to transform your operations?</h2>
				<p className="text-slate-600 max-w-xl mx-auto mb-8 text-sm sm:text-base">
					Join hundreds of enterprises boosting revenue and slashing inventory shrinkage with Evaluna ERP.
				</p>
				<div className="flex flex-wrap justify-center gap-4">
					<Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
						<Link href="/signup">Get Started Now</Link>
					</Button>
					<Button size="lg" variant="outline" asChild>
						<Link href="/contact">Schedule a Sales Demo</Link>
					</Button>
				</div>
			</section>

			<Footer />
		</div>
	);
}
