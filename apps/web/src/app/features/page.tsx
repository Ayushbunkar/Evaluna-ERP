import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	BarChart3,
	MountainIcon,
	Package,
	ShoppingCart,
	Truck,
	Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Features & Systems — POS, WMS, Field Sales & HR",
	description:
		"Explore the modular ERP features: offline-first POS cash registers, intelligent warehouse bin routing, GPS geofenced workforce tracking, and automated GST reporting.",
	canonicalPath: "/features",
});

export default function FeaturesPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Features", url: "/features" },
	]);

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors selection:bg-primary/20">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
			/>
			{/* Ambient background glow */}
			<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
			</div>

			{/* Navigation */}
			<nav className="sticky top-0 z-50 border-border/80 border-b bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<Link href="/" className="group flex items-center space-x-2.5">
							<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
								<MountainIcon className="h-5 w-5" strokeWidth={2.5} />
							</div>
							<span className="font-bold text-foreground text-xl tracking-tight">
								Evaluna ERP
							</span>
						</Link>
						<div className="flex items-center space-x-2 sm:space-x-3">
							<LocaleSwitcher />
							<ThemeToggle />
							<Button
								asChild
								variant="outline"
								size="sm"
								className="font-medium text-sm"
							>
								<Link href="/">
									<ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						Our Internal ERP System Features
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						Evaluna ERP provides comprehensive tools for managing our business
						operations efficiently. All features are tailored for our internal
						use and operational needs.
					</p>
				</div>

				{/* Features Grid */}
				<div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{[
						{
							icon: <BarChart3 className="h-8 w-8 text-primary" />,
							title: "Real-time Analytics",
							description:
								"Monitor our business performance with live dashboards and comprehensive reports that update in real-time for better decision making.",
							id: "analytics",
						},
						{
							icon: <Package className="h-8 w-8 text-primary" />,
							title: "Inventory Management",
							description:
								"Track our stock levels across all locations, manage supplier relationships, and receive automated alerts for low stock items.",
							id: "inventory",
						},
						{
							icon: <ShoppingCart className="h-8 w-8 text-primary" />,
							title: "Point of Sale",
							description:
								"Our internal POS system supports multiple locations with offline capabilities, ensuring smooth sales operations even during connectivity issues.",
							id: "pos",
						},
						{
							icon: <Users className="h-8 w-8 text-primary" />,
							title: "Customer Management",
							description:
								"Maintain comprehensive customer records, track purchase history, and manage loyalty programs for our valued customers.",
							id: "crm",
						},
						{
							icon: <Truck className="h-8 w-8 text-primary" />,
							title: "Supply Chain Management",
							description:
								"Manage our supplier relationships, track purchases, and monitor deliveries with complete end-to-end visibility of our supply chain.",
							id: "supply-chain",
						},
						{
							icon: <MountainIcon className="h-8 w-8 text-primary" />,
							title: "Multi-Branch Operations",
							description:
								"Centralized management system for all our branches with role-based access control tailored to our organizational structure.",
							id: "multi-branch",
						},
					].map((feature, index) => (
						<Card
							key={index}
							id={feature.id}
							className="transition-shadow hover:shadow-md"
						>
							<CardHeader className="flex flex-col items-center text-center">
								<div className="mb-4">{feature.icon}</div>
								<h3 className="font-semibold text-xl">{feature.title}</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									{feature.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Internal Systems Section */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Our Internal Business Systems
					</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">Financial Management</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Comprehensive accounting tools for managing our finances,
									including accounts payable/receivable, general ledger, and
									financial reporting.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Expense tracking and approval workflows</li>
									<li>Budget management and forecasting</li>
									<li>Tax calculation and compliance tools</li>
									<li>Multi-currency support for international operations</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">Human Resources</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Complete HR management system for our workforce, including
									employee records, attendance tracking, and payroll processing.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Employee onboarding and offboarding</li>
									<li>Time and attendance management</li>
									<li>Leave and vacation tracking</li>
									<li>Performance evaluation system</li>
									<li>Payroll processing and tax filings</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">Operations Management</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Tools for managing our day-to-day business operations across
									all departments.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Workflow automation and process management</li>
									<li>Document management and version control</li>
									<li>Task assignment and progress tracking</li>
									<li>Inter-departmental communication tools</li>
									<li>Compliance and audit tracking</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">Business Intelligence</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Advanced analytics and reporting tools to help us make
									data-driven decisions.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Custom report builder with drag-and-drop interface</li>
									<li>Data visualization tools and dashboards</li>
									<li>Predictive analytics for business forecasting</li>
									<li>Key performance indicator tracking</li>
									<li>Data export and integration capabilities</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Access Our Internal Systems
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						Our ERP system is designed exclusively for internal use. All
						employees can access the tools they need based on their roles and
						permissions.
					</p>
					<Button asChild size="lg" className="shadow-lg">
						<Link href="/login">Employee Login</Link>
					</Button>
				</section>
			</main>

			{/* Footer */}
			<footer className="mt-16 border-border border-t bg-card/40 py-10">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div className="flex items-center space-x-2.5">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<MountainIcon className="h-4 w-4" strokeWidth={2.5} />
							</div>
							<span className="font-bold text-foreground text-lg">
								Evaluna ERP
							</span>
						</div>
						<div className="text-muted-foreground text-xs sm:text-sm">
							© {new Date().getFullYear()} Evaluna Technologies. Internal Use
							Only.
						</div>
					</div>
					<div className="mt-6 flex flex-wrap justify-center space-x-6 text-muted-foreground text-xs sm:text-sm md:justify-end">
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
							href="/contact"
							className="transition-colors hover:text-foreground"
						>
							Contact IT Support
						</Link>
						<Link
							href="/docs"
							className="transition-colors hover:text-foreground"
						>
							Internal Documentation
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
