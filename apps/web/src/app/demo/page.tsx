import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Database,
	Monitor,
	MousePointer,
	Settings,
	Shield,
	User,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Interactive Live Demo & System Sandbox",
	description:
		"Experience Evaluna ERP hands-on with role-based demo accounts: Retail Cashier POS, Warehouse Manager, Field Sales Agent, and Finance Officer.",
	canonicalPath: "/demo",
});

export default function DemoPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Demo", url: "/demo" },
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
			<main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						System Overview & Interactive Demo
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						Explore our comprehensive ERP system through interactive
						demonstrations and detailed walkthroughs of our internal business
						management tools.
					</p>
				</div>

				{/* Demo Sections */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Interactive System Demonstrations
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<Monitor className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-xl">Dashboard Overview</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Explore our comprehensive dashboard with real-time analytics,
									KPI tracking, and customized views for different departments.
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Sales Dashboard</span>
										<Button variant="outline" size="sm">
											View Demo
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Inventory Dashboard</span>
										<Button variant="outline" size="sm">
											View Demo
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Financial Dashboard</span>
										<Button variant="outline" size="sm">
											View Demo
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<MousePointer className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-xl">Interactive Features</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Try out our key system features with guided demonstrations and
									interactive tutorials.
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">POS System Demo</span>
										<Button variant="outline" size="sm">
											Try Now
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Inventory Management</span>
										<Button variant="outline" size="sm">
											Try Now
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Reporting Tools</span>
										<Button variant="outline" size="sm">
											Try Now
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* System Modules */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						System Modules & Components
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
						<Card>
							<CardHeader className="text-center">
								<Database className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Data Management</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Our robust data management system ensures data integrity,
									security, and accessibility.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Centralized database</li>
									<li>Real-time synchronization</li>
									<li>Data backup & recovery</li>
									<li>Advanced search capabilities</li>
									<li>Custom data views</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Shield className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Security Features</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Comprehensive security measures to protect our business data
									and ensure compliance.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>Role-based access control</li>
									<li>Data encryption</li>
									<li>Audit logging</li>
									<li>Two-factor authentication</li>
									<li>Regular security updates</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<User className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">User Management</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Flexible user management system with customizable permissions
									and profiles.
								</p>
								<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
									<li>User roles & permissions</li>
									<li>Profile customization</li>
									<li>Activity tracking</li>
									<li>Department-based access</li>
									<li>User onboarding workflows</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Video Tutorials Section */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Video Tutorials & Guides
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Monitor className="mr-2 h-5 w-5 text-primary" />
									Getting Started
								</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Video tutorials to help new users get familiar with our ERP
									system.
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">System Overview (5:32)</span>
										<Button variant="outline" size="sm">
											Watch
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Navigation Guide (3:45)</span>
										<Button variant="outline" size="sm">
											Watch
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Dashboard Tour (4:12)</span>
										<Button variant="outline" size="sm">
											Watch
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Settings className="mr-2 h-5 w-5 text-primary" />
									Advanced Features
								</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									In-depth guides for advanced system features and
									customization.
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Reporting Tools (7:22)</span>
										<Button variant="outline" size="sm">
											Watch
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">
											Custom Dashboards (6:18)
										</span>
										<Button variant="outline" size="sm">
											Watch
										</Button>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">
											Integration Guide (8:05)
										</span>
										<Button variant="outline" size="sm">
											Watch
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* System Requirements */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						System Requirements & Access
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">
									Technical Requirements
								</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Our ERP system is designed to work on modern devices and
									browsers.
								</p>
								<div className="space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Supported Browsers:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Chrome (latest version)</li>
											<li>Firefox (latest version)</li>
											<li>Safari (latest version)</li>
											<li>Edge (latest version)</li>
										</ul>
									</div>
									<div className="mt-4">
										<h4 className="mb-2 font-medium">Device Requirements:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Desktop or laptop computer</li>
											<li>Tablet devices</li>
											<li>Minimum 1024x768 resolution</li>
											<li>Internet connection</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">Access Information</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Learn how to access our ERP system and get support when
									needed.
								</p>
								<div className="space-y-4">
									<div>
										<h4 className="mb-2 font-medium">Access Methods:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>Web browser access</li>
											<li>Mobile responsive design</li>
											<li>VPN access for remote users</li>
											<li>Single sign-on (SSO) support</li>
										</ul>
									</div>
									<div className="mt-4">
										<h4 className="mb-2 font-medium">Support Options:</h4>
										<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
											<li>IT help desk</li>
											<li>Online documentation</li>
											<li>Training sessions</li>
											<li>User community forum</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Ready to Explore Our System?
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						Access our comprehensive ERP system to manage all aspects of our
						business operations. Login with your credentials to get started.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="/login">Employee Login</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/features">View System Features</Link>
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
						<span>• Interactive Sandbox</span>
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
