import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Briefcase,
	Building2,
	Globe,
	MountainIcon,
	Users,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
						About Our Internal ERP System
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						Evaluna ERP is our comprehensive internal business management system
						designed to streamline operations and improve efficiency across all
						departments.
					</p>
				</div>

				{/* Company Overview */}
				<section className="mb-16">
					<Card className="mx-auto max-w-4xl">
						<CardHeader>
							<h2 className="font-bold text-2xl">Company Overview</h2>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-muted-foreground">
								Evaluna Technologies is a leading business organization that has
								developed and implemented our own comprehensive ERP system to
								manage all aspects of our operations. Our internal ERP system is
								tailored specifically to our business needs and processes.
							</p>
							<p className="text-muted-foreground">
								Founded with the vision of creating efficient business
								processes, we have grown into a multi-department organization
								with operations across various locations. Our ERP system serves
								as the backbone of our daily operations.
							</p>

							<div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
								<div className="flex items-center space-x-3">
									<Building2 className="h-6 w-6 text-primary" />
									<span className="font-medium">Headquarters:</span>
									<span className="text-muted-foreground">
										Evaluna Business Park
									</span>
								</div>
								<div className="flex items-center space-x-3">
									<Users className="h-6 w-6 text-primary" />
									<span className="font-medium">Employees:</span>
									<span className="text-muted-foreground">
										150+ team members
									</span>
								</div>
								<div className="flex items-center space-x-3">
									<Briefcase className="h-6 w-6 text-primary" />
									<span className="font-medium">Departments:</span>
									<span className="text-muted-foreground">
										Sales, Operations, Finance, HR, IT
									</span>
								</div>
								<div className="flex items-center space-x-3">
									<Globe className="h-6 w-6 text-primary" />
									<span className="font-medium">Locations:</span>
									<span className="text-muted-foreground">
										Multiple branches nationwide
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* Our Mission */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Our Mission & Values
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<MountainIcon className="mr-2 h-5 w-5 text-primary" />
									Our Mission
								</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									To create and maintain an efficient, integrated business
									management system that empowers our team members with the
									tools and data they need to make informed decisions and drive
									our business forward.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ Streamline all business processes</li>
									<li>â€¢ Provide real-time business insights</li>
									<li>â€¢ Enhance inter-departmental collaboration</li>
									<li>â€¢ Ensure data security and compliance</li>
									<li>â€¢ Continuously improve operational efficiency</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Users className="mr-2 h-5 w-5 text-primary" />
									Our Values
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-1 font-medium">Innovation</h4>
										<p className="text-muted-foreground text-sm">
											We continuously improve our systems and processes to stay
											ahead.
										</p>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Collaboration</h4>
										<p className="text-muted-foreground text-sm">
											Teamwork across departments is key to our success.
										</p>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Integrity</h4>
										<p className="text-muted-foreground text-sm">
											We maintain the highest ethical standards in all our
											operations.
										</p>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Excellence</h4>
										<p className="text-muted-foreground text-sm">
											We strive for quality and efficiency in everything we do.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* ERP System Overview */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Our ERP System
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">System Architecture</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-muted-foreground">
									Our ERP system is built on modern web technologies with a
									modular architecture that allows for easy maintenance and
									scalability.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ Cloud-based infrastructure for accessibility</li>
									<li>â€¢ Role-based access control for security</li>
									<li>â€¢ Real-time data synchronization</li>
									<li>â€¢ Mobile-responsive design</li>
									<li>â€¢ Comprehensive API integration capabilities</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="font-semibold text-xl">Key Features</h3>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div className="space-y-2">
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Financial Management</span>
										</div>
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Inventory Control</span>
										</div>
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Sales & POS</span>
										</div>
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Customer Management</span>
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>HR & Payroll</span>
										</div>
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Supply Chain</span>
										</div>
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Reporting & Analytics</span>
										</div>
										<div className="flex items-center">
											<span className="mr-2 text-green-500">â€¢</span>
											<span>Multi-branch Support</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Team Section */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Our Team
					</h2>
					<div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
						<Card>
							<CardHeader className="text-center">
								<h3 className="font-semibold text-lg">Leadership Team</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Our experienced leadership team guides the strategic direction
									and implementation of our ERP system to ensure it meets our
									business objectives.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ CEO & Founder</li>
									<li>â€¢ CTO</li>
									<li>â€¢ COO</li>
									<li>â€¢ CFO</li>
									<li>â€¢ Department Heads</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<h3 className="font-semibold text-lg">IT & Development</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Our dedicated IT team maintains, enhances, and supports our
									ERP system, ensuring it runs smoothly and securely.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ System Administrators</li>
									<li>â€¢ Software Developers</li>
									<li>â€¢ Database Specialists</li>
									<li>â€¢ IT Support Staff</li>
									<li>â€¢ Security Experts</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<h3 className="font-semibold text-lg">Department Users</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									All our department teams use the ERP system daily to manage
									their respective operations and collaborate across the
									organization.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ Sales & Marketing</li>
									<li>â€¢ Operations</li>
									<li>â€¢ Finance & Accounting</li>
									<li>â€¢ Human Resources</li>
									<li>â€¢ Customer Service</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Learn More About Our Systems
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						Discover how our comprehensive ERP system supports all aspects of
						our business operations and helps us achieve our goals.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="/features">Explore Our Systems</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/docs">View Documentation</Link>
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
