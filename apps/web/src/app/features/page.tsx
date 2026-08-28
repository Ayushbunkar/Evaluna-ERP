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
import Link from "next/link";

export default function FeaturesPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			{/* Navigation */}
			<nav className="border-slate-200 border-b bg-white/80 backdrop-blur-sm">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<div className="flex items-center space-x-2">
							<MountainIcon className="h-8 w-8 text-primary" strokeWidth={2} />
							<span className="font-bold text-foreground text-xl">
								Evaluna ERP
							</span>
						</div>
						<div className="flex items-center space-x-4">
							<Button asChild variant="outline" className="text-sm">
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Expense tracking and approval workflows</li>
									<li>â€¢ Budget management and forecasting</li>
									<li>â€¢ Tax calculation and compliance tools</li>
									<li>
										â€¢ Multi-currency support for international operations
									</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Employee onboarding and offboarding</li>
									<li>â€¢ Time and attendance management</li>
									<li>â€¢ Leave and vacation tracking</li>
									<li>â€¢ Performance evaluation system</li>
									<li>â€¢ Payroll processing and tax filings</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Workflow automation and process management</li>
									<li>â€¢ Document management and version control</li>
									<li>â€¢ Task assignment and progress tracking</li>
									<li>â€¢ Inter-departmental communication tools</li>
									<li>â€¢ Compliance and audit tracking</li>
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
								<ul className="space-y-2 text-sm">
									<li>
										â€¢ Custom report builder with drag-and-drop interface
									</li>
									<li>â€¢ Data visualization tools and dashboards</li>
									<li>â€¢ Predictive analytics for business forecasting</li>
									<li>â€¢ Key performance indicator tracking</li>
									<li>â€¢ Data export and integration capabilities</li>
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
			<footer className="mt-16 border-slate-200 border-t bg-white py-8">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col items-center justify-between md:flex-row">
						<div className="mb-4 flex items-center space-x-2 md:mb-0">
							<MountainIcon className="h-6 w-6 text-primary" strokeWidth={2} />
							<span className="font-bold text-foreground text-lg">
								Evaluna ERP
							</span>
						</div>
						<div className="text-muted-foreground text-sm">
							Â© {new Date().getFullYear()} Evaluna Technologies. Internal Use
							Only.
						</div>
					</div>
					<div className="mt-4 flex flex-wrap justify-center space-x-6 text-muted-foreground text-sm md:justify-end">
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
