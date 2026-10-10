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
import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Evaluna ERP — Unified Retail POS, Warehouse WMS & Field Operations Platform",
	description:
		"Transform your supply chain with Evaluna ERP: offline-first POS billing, smart warehouse logistics, live field sales GPS tracking, and GST accounting.",
	canonicalPath: "/",
});

export default function Home() {
	return (
		<div className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors selection:bg-primary/20">
			{/* Ambient background glow for high-end theme aesthetics */}
			<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
				<div className="absolute top-1/3 -left-40 h-[400px] w-[500px] rounded-full bg-blue-500/5 blur-[120px] dark:bg-blue-500/10" />
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
							<Link
								href="/features"
								className="hidden px-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground sm:inline-block"
							>
								Our Systems
							</Link>
							<Link
								href="/docs"
								className="hidden px-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground sm:inline-block"
							>
								Documentation
							</Link>
							<LocaleSwitcher />
							<ThemeToggle />
							<Button asChild size="sm" className="font-semibold shadow-xs">
								<Link href="/login">Employee Login</Link>
							</Button>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
				<div className="text-center">
					<div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 font-medium text-primary text-xs shadow-2xs sm:text-sm">
						<span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary" />
						Our Internal Business Management System
					</div>

					<h1 className="mx-auto mb-6 max-w-4xl font-extrabold text-4xl text-foreground tracking-tight sm:text-5xl lg:text-6xl">
						Evaluna Internal ERP System
					</h1>

					<p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
						Our comprehensive ERP solution for managing all aspects of our
						business operations. Integrated platform with real-time data and
						analytics for better decision making.
					</p>

					<div className="mb-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button
							asChild
							size="lg"
							className="w-full px-6 font-semibold shadow-md sm:w-auto"
						>
							<Link href="/login">Employee Login</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="w-full border-border/80 px-6 font-semibold hover:bg-accent sm:w-auto"
						>
							<Link href="/features">Explore Our Systems</Link>
						</Button>
					</div>

					{/* System Overview */}
					<div className="mt-16">
						<Card className="mx-auto max-w-4xl border-border/70 bg-card/80 shadow-xl backdrop-blur-sm">
							<CardHeader>
								<h3 className="font-bold text-foreground text-xl">
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
									<Card className="border-border/60 bg-background/60 text-left shadow-xs transition-shadow hover:shadow-md">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<span className="font-medium text-muted-foreground text-sm">
												Business Performance
											</span>
											<BarChart3 className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl text-foreground">
												₹12,345.67
											</div>
											<p className="mt-0.5 font-medium text-emerald-600 text-xs dark:text-emerald-400">
												+12.5% from last month
											</p>
											<div className="mt-4 flex h-20 items-end rounded-lg border border-blue-100 bg-blue-50 p-2 dark:border-blue-900/40 dark:bg-blue-950/40">
												{/* Mock chart */}
												<div className="flex w-full items-end justify-between gap-1">
													{[20, 40, 30, 60, 50, 80, 70].map((height, i) => (
														<div
															key={i}
															className="rounded-t-xs bg-primary/80 transition-all hover:bg-primary"
															style={{ height: `${height}%`, width: "10%" }}
														/>
													))}
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Inventory Status */}
									<Card className="border-border/60 bg-background/60 text-left shadow-xs transition-shadow hover:shadow-md">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<span className="font-medium text-muted-foreground text-sm">
												Inventory Status
											</span>
											<Package className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl text-foreground">
												1,248 Items
											</div>
											<p className="mt-0.5 font-medium text-amber-600 text-xs dark:text-amber-400">
												12 low stock alerts
											</p>
											<div className="mt-4 space-y-2">
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														In Stock
													</span>
													<span className="font-medium text-foreground">
														984 items
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Low Stock
													</span>
													<span className="font-semibold text-amber-600 dark:text-amber-400">
														12 items
													</span>
												</div>
												<div className="flex justify-between text-sm">
													<span className="text-muted-foreground">
														Out of Stock
													</span>
													<span className="font-semibold text-red-600 dark:text-red-400">
														8 items
													</span>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Team Activity */}
									<Card className="border-border/60 bg-background/60 text-left shadow-xs transition-shadow hover:shadow-md">
										<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
											<span className="font-medium text-muted-foreground text-sm">
												Team Activity
											</span>
											<Users className="h-4 w-4 text-muted-foreground" />
										</CardHeader>
										<CardContent>
											<div className="font-bold text-2xl text-foreground">
												48 Active
											</div>
											<p className="mt-0.5 text-muted-foreground text-xs">
												8 new team members this month
											</p>
											<div className="mt-4 space-y-3">
												<div className="flex items-center space-x-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 text-xs ring-1 ring-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800">
														RC
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate font-medium text-foreground text-sm">
															Raj Choudhary
														</p>
														<p className="text-muted-foreground text-xs">
															Sales Team
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700 text-xs ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800">
														MS
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate font-medium text-foreground text-sm">
															Meera Sharma
														</p>
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
							<CardFooter className="flex justify-end border-border/50 border-t pt-4">
								<Button asChild variant="outline" className="font-medium">
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
					<p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
						Evaluna ERP provides comprehensive tools for managing all aspects of
						our business operations.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[
						{
							icon: <BarChart3 className="h-6 w-6" />,
							title: "Business Analytics",
							description:
								"Real-time dashboards and comprehensive reports for monitoring our business performance and making data-driven decisions.",
							link: "/features#analytics",
						},
						{
							icon: <Package className="h-6 w-6" />,
							title: "Inventory Management",
							description:
								"Track stock levels across all locations, manage supplier relationships, and receive automated alerts for low stock items.",
							link: "/features#inventory",
						},
						{
							icon: <ShoppingCart className="h-6 w-6" />,
							title: "Sales Operations",
							description:
								"Our internal POS system with offline capabilities, supporting multiple locations and ensuring smooth sales operations.",
							link: "/features#pos",
						},
						{
							icon: <Users className="h-6 w-6" />,
							title: "Customer Management",
							description:
								"Comprehensive customer records, purchase history tracking, and loyalty program management for our valued clients.",
							link: "/features#crm",
						},
						{
							icon: <Truck className="h-6 w-6" />,
							title: "Supply Chain Operations",
							description:
								"Manage supplier relationships, track purchases, and monitor deliveries with complete visibility of our supply chain.",
							link: "/features#supply-chain",
						},
						{
							icon: <MountainIcon className="h-6 w-6" />,
							title: "Multi-Location Management",
							description:
								"Centralized management system for all our branches with role-based access control tailored to our organization.",
							link: "/features#multi-branch",
						},
					].map((feature, index) => (
						<Card
							key={index}
							className="border-border/60 bg-card/70 text-center backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
						>
							<CardContent className="pt-6">
								<div className="mb-4 flex justify-center">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
										{feature.icon}
									</div>
								</div>
								<h3 className="mb-2 font-bold text-foreground text-lg">
									{feature.title}
								</h3>
								<p className="mb-5 text-muted-foreground text-sm leading-relaxed">
									{feature.description}
								</p>
								<Button
									asChild
									variant="outline"
									size="sm"
									className="w-full border-border/80 font-medium hover:bg-accent"
								>
									<Link href={feature.link}>Learn More</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Access Section (CTA) */}
			<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl sm:p-14 dark:bg-slate-900/90">
					<div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
					<h2 className="relative mb-4 font-extrabold text-3xl text-white tracking-tight sm:text-4xl">
						Access Our Internal ERP System
					</h2>
					<p className="relative mx-auto mb-8 max-w-2xl text-base text-slate-300 sm:text-lg">
						Our comprehensive ERP system is designed exclusively for internal
						use by our team members. Access the tools and data you need based on
						your role and permissions.
					</p>
					<div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button
							asChild
							size="lg"
							className="w-full bg-white px-8 font-bold text-slate-950 shadow-lg hover:bg-slate-100 sm:w-auto"
						>
							<Link href="/login">Employee Login</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="w-full border-white/20 bg-white/5 px-8 font-semibold text-white hover:bg-white/10 sm:w-auto"
						>
							<Link href="/features">Explore Our Systems</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-border border-t bg-card/40 py-10">
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
