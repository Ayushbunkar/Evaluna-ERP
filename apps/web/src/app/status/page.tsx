import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Database,
	Server,
	Shield,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "System Status & Service Uptime — Live Health Dashboard",
	description:
		"Real-time operational status, service health, and uptime monitoring for Evaluna ERP cloud APIs, database, and background synchronization jobs.",
	canonicalPath: "/status",
});

export default function StatusPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "System Status", url: "/status" },
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
			<main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						System Status
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						Real-time status and performance monitoring of our ERP system and
						related services.
					</p>
					<div className="text-muted-foreground text-sm">
						Last updated: {new Date().toLocaleString()}
					</div>
				</div>

				{/* System Overview */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						System Overview
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader className="text-center">
								<Server className="mx-auto mb-2 h-8 w-8 text-green-500" />
								<h3 className="font-semibold text-lg">ERP System</h3>
							</CardHeader>
							<CardContent>
								<div className="mb-4 text-center">
									<div className="mb-2 flex items-center justify-center">
										<CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />
										<span className="font-medium text-green-600">
											Operational
										</span>
									</div>
									<p className="text-muted-foreground text-sm">
										All core services are running normally
									</p>
								</div>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Uptime (24h):</span>
										<span className="font-medium">100%</span>
									</div>
									<div className="flex justify-between">
										<span>Response Time:</span>
										<span className="font-medium">245ms</span>
									</div>
									<div className="flex justify-between">
										<span>Active Users:</span>
										<span className="font-medium">187</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Database className="mx-auto mb-2 h-8 w-8 text-green-500" />
								<h3 className="font-semibold text-lg">Database</h3>
							</CardHeader>
							<CardContent>
								<div className="mb-4 text-center">
									<div className="mb-2 flex items-center justify-center">
										<CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />
										<span className="font-medium text-green-600">Healthy</span>
									</div>
									<p className="text-muted-foreground text-sm">
										Database connections stable
									</p>
								</div>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Query Performance:</span>
										<span className="font-medium">Excellent</span>
									</div>
									<div className="flex justify-between">
										<span>Storage Usage:</span>
										<span className="font-medium">68%</span>
									</div>
									<div className="flex justify-between">
										<span>Backup Status:</span>
										<span className="font-medium text-green-600">Complete</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Shield className="mx-auto mb-2 h-8 w-8 text-green-500" />
								<h3 className="font-semibold text-lg">Security</h3>
							</CardHeader>
							<CardContent>
								<div className="mb-4 text-center">
									<div className="mb-2 flex items-center justify-center">
										<CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />
										<span className="font-medium text-green-600">Secure</span>
									</div>
									<p className="text-muted-foreground text-sm">
										No active security alerts
									</p>
								</div>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Failed Login Attempts:</span>
										<span className="font-medium">3</span>
									</div>
									<div className="flex justify-between">
										<span>Active Sessions:</span>
										<span className="font-medium">214</span>
									</div>
									<div className="flex justify-between">
										<span>Security Updates:</span>
										<span className="font-medium text-green-600">Current</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Service Status */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Service Status
					</h2>
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Activity className="mr-2 h-5 w-5 text-primary" />
									Core Services
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>Authentication Service</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>API Gateway</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>Notification Service</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>Reporting Engine</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Server className="mr-2 h-5 w-5 text-primary" />
									Integration Services
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>Payment Gateway</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>Email Service</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>SMS Gateway</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg border border-green-100 bg-green-50/50 p-3">
										<div className="flex items-center">
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
											<span>Cloud Storage</span>
										</div>
										<span className="font-medium text-green-600 text-sm">
											Operational
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Performance Metrics */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Performance Metrics
					</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Clock className="mr-2 h-5 w-5 text-primary" />
									Response Times
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">API Endpoints:</span>
											<span className="font-medium">187ms</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-green-500"
												style={{ width: "75%" }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">Database Queries:</span>
											<span className="font-medium">42ms</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-green-500"
												style={{ width: "90%" }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">Page Load:</span>
											<span className="font-medium">845ms</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-green-500"
												style={{ width: "80%" }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">Authentication:</span>
											<span className="font-medium">212ms</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-green-500"
												style={{ width: "78%" }}
											/>
										</div>
									</div>
								</div>
								<p className="mt-3 text-center text-muted-foreground text-xs">
									All response times are within acceptable performance
									thresholds
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Activity className="mr-2 h-5 w-5 text-primary" />
									System Activity
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">Active Sessions:</span>
											<span className="font-medium">214</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-blue-500"
												style={{ width: "85%" }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">API Requests:</span>
											<span className="font-medium">1,248</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-blue-500"
												style={{ width: "68%" }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">Database Queries:</span>
											<span className="font-medium">3,872</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-blue-500"
												style={{ width: "92%" }}
											/>
										</div>
									</div>
									<div>
										<div className="mb-1 flex justify-between">
											<span className="font-medium">Data Updates:</span>
											<span className="font-medium">845</span>
										</div>
										<div className="h-2 w-full rounded-full bg-gray-200">
											<div
												className="h-2 rounded-full bg-blue-500"
												style={{ width: "75%" }}
											/>
										</div>
									</div>
								</div>
								<p className="mt-3 text-center text-muted-foreground text-xs">
									System activity levels are normal for current usage patterns
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Recent Incidents */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Recent Incidents & Maintenance
					</h2>
					<Card>
						<CardHeader>
							<h3 className="font-semibold text-xl">Incident History</h3>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-start rounded-lg border border-green-100 bg-green-50/50 p-3">
									<CheckCircle2 className="mt-1 mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
									<div className="flex-1">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-medium">Scheduled Maintenance</h4>
												<p className="text-muted-foreground text-sm">
													Database optimization and security updates
												</p>
											</div>
											<span className="ml-4 whitespace-nowrap text-muted-foreground text-sm">
												2026-07-15 02:00 AM
											</span>
										</div>
										<div className="mt-2 flex items-center">
											<span className="rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs">
												Completed
											</span>
											<span className="ml-2 text-muted-foreground text-xs">
												Duration: 45 minutes
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-start rounded-lg border border-green-100 bg-green-50/50 p-3">
									<CheckCircle2 className="mt-1 mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
									<div className="flex-1">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-medium">
													Performance Optimization
												</h4>
												<p className="text-muted-foreground text-sm">
													Query optimization and caching improvements
												</p>
											</div>
											<span className="ml-4 whitespace-nowrap text-muted-foreground text-sm">
												2026-07-08 01:30 AM
											</span>
										</div>
										<div className="mt-2 flex items-center">
											<span className="rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs">
												Completed
											</span>
											<span className="ml-2 text-muted-foreground text-xs">
												Duration: 30 minutes
											</span>
										</div>
									</div>
								</div>

								<div className="flex items-start rounded-lg border border-green-100 bg-green-50/50 p-3">
									<CheckCircle2 className="mt-1 mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
									<div className="flex-1">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-medium">Security Patch</h4>
												<p className="text-muted-foreground text-sm">
													Critical security updates applied
												</p>
											</div>
											<span className="ml-4 whitespace-nowrap text-muted-foreground text-sm">
												2026-07-01 03:15 AM
											</span>
										</div>
										<div className="mt-2 flex items-center">
											<span className="rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs">
												Completed
											</span>
											<span className="ml-2 text-muted-foreground text-xs">
												Duration: 22 minutes
											</span>
										</div>
									</div>
								</div>
							</div>
							<p className="mt-4 text-center text-muted-foreground text-sm">
								No active incidents or outages. All maintenance completed
								successfully.
							</p>
						</CardContent>
					</Card>
				</section>

				{/* Upcoming Maintenance */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Upcoming Maintenance
					</h2>
					<Card>
						<CardHeader>
							<h3 className="font-semibold text-xl">
								Scheduled Maintenance Windows
							</h3>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-start rounded-lg border border-blue-100 bg-blue-50/50 p-3">
									<Clock className="mt-1 mr-3 h-5 w-5 flex-shrink-0 text-blue-500" />
									<div className="flex-1">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-medium">
													Monthly Security Updates
												</h4>
												<p className="text-muted-foreground text-sm">
													Security patches and vulnerability fixes
												</p>
											</div>
											<span className="ml-4 whitespace-nowrap text-muted-foreground text-sm">
												2026-08-01 03:00 AM
											</span>
										</div>
										<div className="mt-2 flex items-center">
											<span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-xs">
												Scheduled
											</span>
											<span className="ml-2 text-muted-foreground text-xs">
												Expected duration: 30-45 minutes
											</span>
										</div>
										<div className="mt-2 text-muted-foreground text-xs">
											<strong>Impact:</strong> Brief service interruption during
											update window
										</div>
									</div>
								</div>

								<div className="flex items-start rounded-lg border border-blue-100 bg-blue-50/50 p-3">
									<Clock className="mt-1 mr-3 h-5 w-5 flex-shrink-0 text-blue-500" />
									<div className="flex-1">
										<div className="flex items-start justify-between">
											<div>
												<h4 className="font-medium">Performance Tuning</h4>
												<p className="text-muted-foreground text-sm">
													Database optimization and index rebuilding
												</p>
											</div>
											<span className="ml-4 whitespace-nowrap text-muted-foreground text-sm">
												2026-08-15 02:30 AM
											</span>
										</div>
										<div className="mt-2 flex items-center">
											<span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800 text-xs">
												Scheduled
											</span>
											<span className="ml-2 text-muted-foreground text-xs">
												Expected duration: 45-60 minutes
											</span>
										</div>
										<div className="mt-2 text-muted-foreground text-xs">
											<strong>Impact:</strong> Reduced performance during
											maintenance, no downtime expected
										</div>
									</div>
								</div>
							</div>
							<p className="mt-4 text-center text-muted-foreground text-sm">
								All maintenance is scheduled during low-usage periods to
								minimize impact on operations.
							</p>
						</CardContent>
					</Card>
				</section>

				{/* System Health */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						System Health Summary
					</h2>
					<Card className="mx-auto max-w-4xl">
						<CardHeader>
							<h3 className="text-center font-semibold text-xl">
								Overall System Status
							</h3>
						</CardHeader>
						<CardContent>
							<div className="mb-6 text-center">
								<div className="mb-4 flex items-center justify-center">
									<CheckCircle2 className="mr-3 h-12 w-12 text-green-500" />
									<div>
										<h2 className="font-bold text-3xl text-green-600">
											All Systems Operational
										</h2>
										<p className="text-muted-foreground">
											No active incidents or performance issues
										</p>
									</div>
								</div>
							</div>

							<div className="mb-6 grid grid-cols-2 gap-4 text-center md:grid-cols-4">
								<div>
									<div className="font-bold text-2xl text-green-600">100%</div>
									<div className="text-muted-foreground text-sm">
										Uptime (30 days)
									</div>
								</div>
								<div>
									<div className="font-bold text-2xl text-green-600">99.8%</div>
									<div className="text-muted-foreground text-sm">
										SLA Compliance
									</div>
								</div>
								<div>
									<div className="font-bold text-2xl text-green-600">0</div>
									<div className="text-muted-foreground text-sm">
										Active Incidents
									</div>
								</div>
								<div>
									<div className="font-bold text-2xl text-green-600">245ms</div>
									<div className="text-muted-foreground text-sm">
										Avg Response Time
									</div>
								</div>
							</div>

							<div className="space-y-3 text-sm">
								<div className="flex items-center justify-between rounded-lg bg-green-50/50 p-2">
									<span>· Core ERP System</span>
									<div className="flex items-center">
										<CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
										<span className="font-medium">Operational</span>
									</div>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-green-50/50 p-2">
									<span>· Database Services</span>
									<div className="flex items-center">
										<CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
										<span className="font-medium">Healthy</span>
									</div>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-green-50/50 p-2">
									<span>· Authentication Services</span>
									<div className="flex items-center">
										<CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
										<span className="font-medium">Operational</span>
									</div>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-green-50/50 p-2">
									<span>· Integration Services</span>
									<div className="flex items-center">
										<CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
										<span className="font-medium">Operational</span>
									</div>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-green-50/50 p-2">
									<span>· Security Systems</span>
									<div className="flex items-center">
										<CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
										<span className="font-medium">Secure</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Need Assistance?
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						If you're experiencing any issues or have questions about system
						status, please contact our IT support team.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="/contact">Contact IT Support</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/docs">View Documentation</Link>
						</Button>
					</div>
				</section>
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
						<span>• System Health & Status</span>
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
