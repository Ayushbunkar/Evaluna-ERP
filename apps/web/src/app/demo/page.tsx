import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Database,
	Monitor,
	MountainIcon,
	MousePointer,
	Settings,
	Shield,
	User,
} from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Centralized database</li>
									<li>â€¢ Real-time synchronization</li>
									<li>â€¢ Data backup & recovery</li>
									<li>â€¢ Advanced search capabilities</li>
									<li>â€¢ Custom data views</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Role-based access control</li>
									<li>â€¢ Data encryption</li>
									<li>â€¢ Audit logging</li>
									<li>â€¢ Two-factor authentication</li>
									<li>â€¢ Regular security updates</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ User roles & permissions</li>
									<li>â€¢ Profile customization</li>
									<li>â€¢ Activity tracking</li>
									<li>â€¢ Department-based access</li>
									<li>â€¢ User onboarding workflows</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Chrome (latest version)</li>
											<li>â€¢ Firefox (latest version)</li>
											<li>â€¢ Safari (latest version)</li>
											<li>â€¢ Edge (latest version)</li>
										</ul>
									</div>
									<div className="mt-4">
										<h4 className="mb-2 font-medium">Device Requirements:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Desktop or laptop computer</li>
											<li>â€¢ Tablet devices</li>
											<li>â€¢ Minimum 1024x768 resolution</li>
											<li>â€¢ Internet connection</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Web browser access</li>
											<li>â€¢ Mobile responsive design</li>
											<li>â€¢ VPN access for remote users</li>
											<li>â€¢ Single sign-on (SSO) support</li>
										</ul>
									</div>
									<div className="mt-4">
										<h4 className="mb-2 font-medium">Support Options:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ IT help desk</li>
											<li>â€¢ Online documentation</li>
											<li>â€¢ Training sessions</li>
											<li>â€¢ User community forum</li>
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
