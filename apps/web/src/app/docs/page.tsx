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
import Link from "next/link";

export default function DocsPage() {
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ System architecture</li>
									<li>â€¢ Module descriptions</li>
									<li>â€¢ User roles and permissions</li>
									<li>â€¢ System requirements</li>
									<li>â€¢ Navigation guide</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ First-time login</li>
									<li>â€¢ Dashboard setup</li>
									<li>â€¢ Basic navigation</li>
									<li>â€¢ Common tasks</li>
									<li>â€¢ Tips and best practices</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ System tour (5:32)</li>
									<li>â€¢ Dashboard setup (4:18)</li>
									<li>â€¢ Basic workflows (6:45)</li>
									<li>â€¢ Reporting tools (7:22)</li>
									<li>â€¢ Advanced features (8:10)</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Accounts payable/receivable</li>
											<li>â€¢ General ledger</li>
											<li>â€¢ Budget management</li>
											<li>â€¢ Financial reporting</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Docs
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Inventory Management:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Stock tracking</li>
											<li>â€¢ Supplier management</li>
											<li>â€¢ Reorder automation</li>
											<li>â€¢ Warehouse operations</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Point of sale system</li>
											<li>â€¢ Order management</li>
											<li>â€¢ Customer records</li>
											<li>â€¢ Sales analytics</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Docs
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Human Resources:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Employee management</li>
											<li>â€¢ Payroll processing</li>
											<li>â€¢ Attendance tracking</li>
											<li>â€¢ Performance reviews</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Authentication methods</li>
											<li>â€¢ Endpoint reference</li>
											<li>â€¢ Request/response formats</li>
											<li>â€¢ Rate limiting</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											API Reference
										</Button>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Webhooks:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Event types</li>
											<li>â€¢ Payload structures</li>
											<li>â€¢ Security requirements</li>
											<li>â€¢ Error handling</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ QuickBooks integration</li>
											<li>â€¢ Xero setup</li>
											<li>â€¢ Data mapping</li>
											<li>â€¢ Synchronization</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Guide
										</Button>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Payment Gateways:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Stripe integration</li>
											<li>â€¢ PayPal setup</li>
											<li>â€¢ Transaction processing</li>
											<li>â€¢ Security requirements</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Report builder guide</li>
									<li>â€¢ Custom fields</li>
									<li>â€¢ Advanced filtering</li>
									<li>â€¢ Scheduled reports</li>
									<li>â€¢ Export options</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Bulk data import</li>
									<li>â€¢ Data validation</li>
									<li>â€¢ Backup procedures</li>
									<li>â€¢ Data cleanup</li>
									<li>â€¢ Migration guides</li>
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
								<ul className="space-y-2 text-sm">
									<li>â€¢ Error code reference</li>
									<li>â€¢ Performance issues</li>
									<li>â€¢ Login problems</li>
									<li>â€¢ Data sync errors</li>
									<li>â€¢ Browser compatibility</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Beginner course (2 hours)</li>
											<li>â€¢ Intermediate course (4 hours)</li>
											<li>â€¢ Advanced course (6 hours)</li>
											<li>â€¢ Department-specific training</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											View Courses
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Certification:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ User certification program</li>
											<li>â€¢ Exam preparation</li>
											<li>â€¢ Certification benefits</li>
											<li>â€¢ Renewal process</li>
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
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ IT help desk (Ext. 1500)</li>
											<li>â€¢ Email support (support@evaluna.com)</li>
											<li>â€¢ Live chat support</li>
											<li>â€¢ Priority support levels</li>
										</ul>
										<Button className="mt-2" variant="outline" size="sm">
											Contact Support
										</Button>
									</div>
									<div>
										<h4 className="mb-2 font-medium">Community:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ User forum</li>
											<li>â€¢ Knowledge base</li>
											<li>â€¢ Best practices sharing</li>
											<li>â€¢ Feature requests</li>
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
					</div>
				</div>
			</footer>
		</div>
	);
}
