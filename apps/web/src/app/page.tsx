import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@evaluna/ui/components/card";
import {
	ArrowRight,
	BarChart3,
	BookOpen,
	FileText,
	HelpCircle,
	HomeIcon,
	Mail,
	MountainIcon,
	Package,
	Settings,
	ShoppingCart,
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
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
							<Link
								href="/features"
								className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
							>
								Our Systems
							</Link>
							<Link
								href="/docs"
								className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
							>
								Documentation
							</Link>
							<Button asChild variant="outline" className="text-sm">
								<Link href="/login">Employee Login</Link>
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
				<div className="text-center">
					<div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1 font-medium text-primary text-sm">
						<span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary" />
						Our Internal Business Management System
					</div>

					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
						Evaluna Internal ERP System
					</h1>

					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground sm:text-xl">
						Our comprehensive ERP solution for managing all aspects of our
						business operations. Integrated platform with real-time data and
						analytics for better decision making.
					</p>

					<div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="/login">Employee Login</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/features">Explore Our Systems</Link>
						</Button>
					</div>

					{/* System Overview */}
					<div className="mt-16">
						<Card className="mx-auto max-w-4xl shadow-xl">
							<CardHeader>
								<h3 className="font-semibold text-xl">
									Evaluna ERP System Overview
								</h3>
								<p className="text-muted-foreground text-sm">
									Our integrated business management system provides real-time
									insights and tools for all departments.
								</p>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
									{/* Business Performance */}
									<Card className="transition-shadow hover:shadow-md">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardContent className="text-muted-foreground text-sm">
												Business Performance
											</CardContent>
											<BarChart3 className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl">₹12,345.67</div>
											<p className="text-muted-foreground text-xs">
												+12.5% from last month
											</p>
											<div className="mt-4 flex h-20 items-end rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 p-2">
												{/* Mock chart */}
												<div className="flex w-full space-x-1">
													{[20, 40, 30, 60, 50, 80, 70].map((height, i) => (
														<div
															key={i}
															className="rounded-t-sm bg-primary"
															style={{ height: `${height}%`, width: "8%" }}
														/>
													))}
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Inventory Status */}
									<Card className="transition-shadow hover:shadow-md">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardContent className="text-muted-foreground text-sm">
												Inventory Status
											</CardContent>
											<Package className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl">1,248 Items</div>
											<p className="text-muted-foreground text-xs">
												12 low stock alerts
											</p>
											<div className="mt-4 space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														In Stock
													</span>
													<span>984 items</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Low Stock
													</span>
													<span className="text-amber-600">12 items</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Out of Stock
													</span>
													<span className="text-red-600">8 items</span>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Team Activity */}
									<Card className="transition-shadow hover:shadow-md">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<CardContent className="text-muted-foreground text-sm">
												Team Activity
											</CardContent>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl">48 Active</div>
											<p className="text-muted-foreground text-xs">
												8 new team members this month
											</p>
											<div className="mt-4 space-y-3">
												<div className="flex items-center space-x-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
														<span className="font-medium text-blue-600 text-sm">
															RC
														</span>
													</div>
													<div className="flex-1">
														<p className="font-medium text-sm">Raj Choudhary</p>
														<p className="text-muted-foreground text-xs">
															Sales Team
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
														<span className="font-medium text-green-600 text-sm">
															MS
														</span>
													</div>
													<div className="flex-1">
														<p className="font-medium text-sm">Meera Sharma</p>
														<p className="text-muted-foreground text-xs">
															Operations
														</p>
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
										Access Full System <ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			</main>

			{/* Systems Section */}
			<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
						Our Integrated Business Systems
					</h2>
					<p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
						Evaluna ERP provides comprehensive tools for managing all aspects of
						our business operations.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{[
						{
							icon: <BarChart3 className="h-8 w-8 text-primary" />,
							title: "Business Analytics",
							description:
								"Real-time dashboards and comprehensive reports for monitoring our business performance and making data-driven decisions.",
							link: "/features#analytics",
						},
						{
							icon: <Package className="h-8 w-8 text-primary" />,
							title: "Inventory Management",
							description:
								"Track stock levels across all locations, manage supplier relationships, and receive automated alerts for low stock items.",
							link: "/features#inventory",
						},
						{
							icon: <ShoppingCart className="h-8 w-8 text-primary" />,
							title: "Sales Operations",
							description:
								"Our internal POS system with offline capabilities, supporting multiple locations and ensuring smooth sales operations.",
							link: "/features#pos",
						},
						{
							icon: <Users className="h-8 w-8 text-primary" />,
							title: "Customer Management",
							description:
								"Comprehensive customer records, purchase history tracking, and loyalty program management for our valued clients.",
							link: "/features#crm",
						},
						{
							icon: <Truck className="h-8 w-8 text-primary" />,
							title: "Supply Chain Operations",
							description:
								"Manage supplier relationships, track purchases, and monitor deliveries with complete visibility of our supply chain.",
							link: "/features#supply-chain",
						},
						{
							icon: <MountainIcon className="h-8 w-8 text-primary" />,
							title: "Multi-Location Management",
							description:
								"Centralized management system for all our branches with role-based access control tailored to our organization.",
							link: "/features#multi-branch",
						},
					].map((feature, index) => (
						<Card key={index} className="transition-shadow hover:shadow-md">
							<CardContent className="pt-6">
								<div className="mb-4 flex justify-center">{feature.icon}</div>
								<h3 className="mb-2 text-center font-semibold text-lg">
									{feature.title}
								</h3>
								<p className="mb-4 text-center text-muted-foreground text-sm">
									{feature.description}
								</p>
								<Button asChild variant="outline" size="sm" className="w-full">
									<Link href={feature.link}>Learn More</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Access Section */}
			<section className="mt-16 bg-primary py-16 text-white">
				<div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
					<h2 className="mb-4 font-bold text-3xl tracking-tight sm:text-4xl">
						Access Our Internal ERP System
					</h2>
					<p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">
						Our comprehensive ERP system is designed exclusively for internal
						use by our team members. Access the tools and data you need based on
						your role and permissions.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" variant="secondary" className="shadow-lg">
							<Link href="/login">Employee Login</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="border-primary text-primary hover:bg-primary/10"
						>
							<Link href="/features">Explore Our Systems</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-slate-200 border-t bg-white py-8">
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
						<Link
							href="/status"
							className="transition-colors hover:text-foreground"
						>
							System Status
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
