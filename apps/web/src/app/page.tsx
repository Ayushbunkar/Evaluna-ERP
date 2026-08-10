import { redirect } from "next/navigation";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@evaluna/ui/components/card";
import { MountainIcon, ArrowRight, Users, ShoppingCart, BarChart3, Truck, Package } from "lucide-react";
import Link from "next/link";

export default function Home() {
	// Redirect to BASE_URL if configured for production deployment
	if (
		process.env.BASE_URL &&
		process.env.BASE_URL !== "http://localhost" &&
		!process.env.BASE_PATH
	) {
		redirect(process.env.BASE_URL);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			{/* Navigation */}
			<nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-2">
							<MountainIcon className="h-8 w-8 text-primary" strokeWidth={2} />
							<span className="font-bold text-xl text-foreground">Evaluna ERP</span>
						</div>
						<div className="flex items-center space-x-4">
							<Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
								Features
							</Link>
							<Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
								About
							</Link>
							<Button asChild variant="outline" className="text-sm">
								<Link href="/login">Login</Link>
							</Button>
							<Button asChild className="text-sm shadow-sm">
								<Link href="/signup">Get Started</Link>
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
				<div className="text-center">
					<div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary mb-6">
						<span className="bg-primary rounded-full h-2 w-2 mr-2 animate-pulse"></span>
						All-in-One Business Management
					</div>

					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
						Transform Your Business with <span className="text-primary">Evaluna ERP</span>
					</h1>

					<p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground mb-8">
						Powerful, scalable ERP solution designed for modern businesses. Manage inventory, sales, customers, and operations
						all in one integrated platform with real-time data and analytics.
					</p>

					<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="/signup">Start Free Trial</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/demo">Book a Demo</Link>
						</Button>
					</div>

					{/* Demo Preview */}
					<div className="mt-16">
						<Card className="max-w-4xl mx-auto shadow-xl">
							<CardHeader>
								<h3 className="text-xl font-semibold">Evaluna ERP Dashboard Preview</h3>
								<p className="text-sm text-muted-foreground">
									See how our real-time analytics and intuitive interface can streamline your business operations.
								</p>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									{/* Sales Overview */}
									<Card className="hover:shadow-md transition-shadow">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardContent className="text-sm text-muted-foreground">Total Sales</CardContent>
											<BarChart3 className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">$12,345.67</div>
											<p className="text-xs text-muted-foreground">+12.5% from last month</p>
											<div className="mt-4 h-20 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg flex items-end p-2">
												{/* Mock chart */}
												<div className="flex space-x-1 w-full">
													{[20, 40, 30, 60, 50, 80, 70].map((height, i) => (
														<div key={i} className="bg-primary rounded-t-sm" style={{ height: `${height}%`, width: '8%' }} />
													))}
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Inventory Status */}
									<Card className="hover:shadow-md transition-shadow">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardContent className="text-sm text-muted-foreground">Inventory Status</CardContent>
											<Package className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">1,248 Items</div>
											<p className="text-xs text-muted-foreground">12 low stock alerts</p>
											<div className="mt-4 space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">In Stock</span>
													<span>984 items</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">Low Stock</span>
													<span className="text-amber-600">12 items</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">Out of Stock</span>
													<span className="text-red-600">8 items</span>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Customer Activity */}
									<Card className="hover:shadow-md transition-shadow">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardContent className="text-sm text-muted-foreground">Customer Activity</CardContent>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="text-2xl font-bold">48 Active</div>
											<p className="text-xs text-muted-foreground">8 new this week</p>
											<div className="mt-4 space-y-3">
												<div className="flex items-center space-x-3">
													<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
														<span className="text-blue-600 font-medium text-sm">RC</span>
													</div>
													<div className="flex-1">
														<p className="text-sm font-medium">Raj Enterprises</p>
														<p className="text-xs text-muted-foreground">$2,450.00 lifetime</p>
													</div>
												</div>
												<div className="flex items-center space-x-3">
													<div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
														<span className="text-green-600 font-medium text-sm">MS</span>
													</div>
													<div className="flex-1">
														<p className="text-sm font-medium">Metro Suppliers</p>
														<p className="text-xs text-muted-foreground">$1,890.50 lifetime</p>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</CardContent>
							<CardFooter className="flex justify-end">
								<Button asChild variant="outline">
									<Link href="/login">
										Explore Full Dashboard <ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			</main>

			{/* Features Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="text-center mb-12">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Everything You Need to Run Your Business
					</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
						Evaluna ERP integrates all your business processes into one seamless system.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{[
						{
							icon: <BarChart3 className="h-8 w-8 text-primary" />,
							title: "Real-time Analytics",
							description: "Get instant insights with powerful dashboards and reports that update in real-time.",
							link: "/features#analytics"
						},
						{
							icon: <Package className="h-8 w-8 text-primary" />,
							title: "Inventory Management",
							description: "Track stock levels, manage suppliers, and automate reordering with smart alerts.",
							link: "/features#inventory"
						},
						{
							icon: <ShoppingCart className="h-8 w-8 text-primary" />,
							title: "Point of Sale",
							description: "Fast, reliable POS system with offline mode and multi-location support.",
							link: "/features#pos"
						},
						{
							icon: <Users className="h-8 w-8 text-primary" />,
							title: "Customer Relationships",
							description: "Complete CRM with loyalty programs, purchase history, and targeted marketing.",
							link: "/features#crm"
						},
						{
							icon: <Truck className="h-8 w-8 text-primary" />,
							title: "Supply Chain",
							description: "Manage suppliers, purchases, and deliveries with end-to-end visibility.",
							link: "/features#supply-chain"
						},
						{
							icon: <MountainIcon className="h-8 w-8 text-primary" />,
							title: "Multi-Branch Support",
							description: "Centralized management for multiple locations with role-based access control.",
							link: "/features#multi-branch"
						}
					].map((feature, index) => (
						<Card key={index} className="hover:shadow-md transition-shadow">
							<CardContent className="pt-6">
								<div className="flex justify-center mb-4">
									{feature.icon}
								</div>
								<h3 className="text-lg font-semibold text-center mb-2">{feature.title}</h3>
								<p className="text-sm text-muted-foreground text-center mb-4">{feature.description}</p>
								<Button asChild variant="outline" size="sm" className="w-full">
									<Link href={feature.link}>Learn More</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-primary text-white py-16 mt-16">
				<div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
						Ready to Transform Your Business?
					</h2>
					<p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
						Join thousands of businesses already using Evaluna ERP to streamline operations, reduce costs, and grow faster.
					</p>
					<div className="flex flex-col sm:flex-row justify-center items-center gap-4">
						<Button asChild size="lg" variant="secondary" className="shadow-lg">
							<Link href="/signup">Start Your Free Trial</Link>
						</Button>
						<Button asChild size="lg" variant="outline" className="text-primary border-primary hover:bg-primary/10">
							<Link href="/demo">Schedule a Demo</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-slate-200 bg-white py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<div className="flex items-center space-x-2 mb-4 md:mb-0">
							<MountainIcon className="h-6 w-6 text-primary" strokeWidth={2} />
							<span className="font-bold text-lg text-foreground">Evaluna ERP</span>
						</div>
						<div className="text-sm text-muted-foreground">
							© {new Date().getFullYear()} Evaluna Technologies. All rights reserved.
						</div>
					</div>
					<div className="mt-4 flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-muted-foreground">
						<Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
						<Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
						<Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
						<Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
						<Link href="/status" className="hover:text-foreground transition-colors">System Status</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
