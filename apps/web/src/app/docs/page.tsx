import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	BookOpen,
	Database,
	Download,
	FileText,
	HelpCircle,
	MountainIcon,
	Search,
	Video,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "System Documentation & Technical Architecture",
	description:
		"Comprehensive technical and user documentation for Evaluna ERP: offline cache synchronization, tRPC API schema, hardware integration, and database setup.",
	canonicalPath: "/docs",
});

export default function DocsPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Documentation", url: "/docs" },
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
			<main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						Internal Documentation
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						Comprehensive documentation, guides, and resources for our ERP
						system. Find everything you need to effectively use our business
						management tools.
					</p>
				</div>

				{/* Search Section */}
				<section className="mb-16">
					<Card className="mx-auto max-w-4xl">
						<CardHeader>
							<h2 className="flex items-center font-semibold text-xl">
								<Search className="mr-2 h-5 w-5 text-primary" />
								Search Documentation
							</h2>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="Search for topics, features, or keywords..."
									className="flex-1 rounded-lg border border-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<Button type="submit">
									<Search className="mr-2 h-4 w-4" /> Search
								</Button>
							</div>
							<p className="mt-2 text-muted-foreground text-sm">
								Try searching for: "inventory management", "payroll processing",
								"report generation", etc.
							</p>
						</CardContent>
					</Card>
				</section>

				{/* Getting Started */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Getting Started
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<Card>
							<CardHeader className="text-center">
								<BookOpen className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">System Overview</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Learn about our ERP system architecture, modules, and key
									features.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>System architecture</li>
									<li>Module descriptions</li>
									<li>User roles and permissions</li>
									<li>System requirements</li>
									<li>Navigation guide</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Read Overview
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<HelpCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Quick Start Guide</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Step-by-step guide to get you up and running quickly with our
									ERP system.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>First-time login</li>
									<li>Dashboard setup</li>
									<li>Basic navigation</li>
									<li>Common tasks</li>
									<li>Tips and best practices</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Start Quick Guide
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Video className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Video Tutorials</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Visual guides and walkthroughs for key system features.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>System tour (5:32)</li>
									<li>Dashboard setup (4:18)</li>
									<li>Basic workflows (6:45)</li>
									<li>Reporting tools (7:22)</li>
									<li>Advanced features (8:10)</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Watch Tutorials
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Module Documentation */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Module Documentation
					</h2>
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Database className="mr-2 h-5 w-5 text-primary" />
									Core Modules
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Financial Management:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Accounts payable/receivable</li>
											<li>General ledger</li>
											<li>Budget management</li>
											<li>Financial reporting</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Docs
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Inventory Management:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Stock tracking</li>
											<li>Supplier management</li>
											<li>Reorder automation</li>
											<li>Warehouse operations</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Docs
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<FileText className="mr-2 h-5 w-5 text-primary" />
									Business Operations
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Sales & POS:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Point of sale system</li>
											<li>Order management</li>
											<li>Customer records</li>
											<li>Sales analytics</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Docs
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Human Resources:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Employee management</li>
											<li>Payroll processing</li>
											<li>Attendance tracking</li>
											<li>Performance reviews</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Docs
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* User Guides */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						User Guides & Manuals
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<Download className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Department Guides</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Role-specific guides tailored to different departments.
								</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Sales Team Guide</span>
										<Button variant="outline" size="sm">
											Download
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Finance Guide</span>
										<Button variant="outline" size="sm">
											Download
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Operations Guide</span>
										<Button variant="outline" size="sm">
											Download
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>HR Guide</span>
										<Button variant="outline" size="sm">
											Download
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<HelpCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Quick Reference</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Handy cheat sheets and quick reference guides.
								</p>
								<div className="space-y-2 text-sm">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Keyboard Shortcuts</span>
										<Button variant="outline" size="sm">
											View
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Common Workflows</span>
										<Button variant="outline" size="sm">
											View
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Error Codes</span>
										<Button variant="outline" size="sm">
											View
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
										<span>Data Entry Tips</span>
										<Button variant="outline" size="sm">
											View
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* API Documentation */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						API & Integration
					</h2>
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Database className="mr-2 h-5 w-5 text-primary" />
									API Documentation
								</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Comprehensive API documentation for developers and system
									integrators.
								</p>
								<div className="space-y-3">
									<div>
										<h4 className="mb-1 font-medium">REST API:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Authentication methods</li>
											<li>Endpoint reference</li>
											<li>Request/response formats</li>
											<li>Rate limiting</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											API Reference
										</Button>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Webhooks:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Event types</li>
											<li>Payload structures</li>
											<li>Security requirements</li>
											<li>Error handling</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											Webhook Guide
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<FileText className="mr-2 h-5 w-5 text-primary" />
									Integration Guides
								</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Step-by-step guides for integrating with third-party systems.
								</p>
								<div className="space-y-3">
									<div>
										<h4 className="mb-1 font-medium">Accounting Software:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>QuickBooks integration</li>
											<li>Xero setup</li>
											<li>Data mapping</li>
											<li>Synchronization</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Guide
										</Button>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Payment Gateways:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Stripe integration</li>
											<li>PayPal setup</li>
											<li>Transaction processing</li>
											<li>Security requirements</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Guide
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Advanced Topics */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Advanced Topics
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<Card>
							<CardHeader className="text-center">
								<FileText className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Custom Reports</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Create and manage custom reports tailored to your needs.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Report builder guide</li>
									<li>Custom fields</li>
									<li>Advanced filtering</li>
									<li>Scheduled reports</li>
									<li>Export options</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Reporting Guide
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Database className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Data Management</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Advanced data import, export, and management techniques.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Bulk data import</li>
									<li>Data validation</li>
									<li>Backup procedures</li>
									<li>Data cleanup</li>
									<li>Migration guides</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Data Guide
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<HelpCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Troubleshooting</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Solutions to common issues and error resolution.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Error code reference</li>
									<li>Performance issues</li>
									<li>Login problems</li>
									<li>Data sync errors</li>
									<li>Browser compatibility</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Troubleshooting Guide
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Additional Resources */}
				<section className="mb-16">
					<h2 className="mb-8 font-bold text-3xl text-foreground tracking-tight">
						Additional Resources
					</h2>
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<BookOpen className="mr-2 h-5 w-5 text-primary" />
									Training Materials
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Training Courses:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Beginner course (2 hours)</li>
											<li>Intermediate course (4 hours)</li>
											<li>Advanced course (6 hours)</li>
											<li>Department-specific training</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Courses
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Certification:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>User certification program</li>
											<li>Exam preparation</li>
											<li>Certification benefits</li>
											<li>Renewal process</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											Certification Info
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<HelpCircle className="mr-2 h-5 w-5 text-primary" />
									Support & Community
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Support Options:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>IT help desk (Ext. 1500)</li>
											<li>Email support (support@evaluna.com)</li>
											<li>Live chat support</li>
											<li>Priority support levels</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											Contact Support
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Community:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>User forum</li>
											<li>Knowledge base</li>
											<li>Best practices sharing</li>
											<li>Feature requests</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											Join Community
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Need More Help?
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						Can't find what you're looking for? Our IT support team is available
						to assist you with any questions or issues you may have.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="/contact">Contact IT Support</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/features">Explore System Features</Link>
						</Button>
					</div>
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
					</div>
				</div>
			</footer>
		</div>
	);
}
