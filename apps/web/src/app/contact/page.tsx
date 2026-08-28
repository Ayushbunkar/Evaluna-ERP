import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	FileText,
	Headset,
	Laptop,
	Mail,
	MapPin,
	MountainIcon,
	Phone,
	Shield,
	User,
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
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
						Contact IT Support
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						Need assistance with our ERP system? Our IT support team is here to
						help with any technical issues, questions, or training needs.
					</p>
				</div>

				{/* Contact Options */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						How to Reach Us
					</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader className="text-center">
								<Mail className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-xl">Email Support</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									For non-urgent issues and detailed requests
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">General Support</span>
										<span className="text-muted-foreground text-sm">
											support@evaluna.com
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">ERP Issues</span>
										<span className="text-muted-foreground text-sm">
											erp-support@evaluna.com
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">Security Concerns</span>
										<span className="text-muted-foreground text-sm">
											security@evaluna.com
										</span>
									</div>
								</div>
								<p className="mt-4 text-center text-muted-foreground text-xs">
									Response time: 1-2 business days
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Phone className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-xl">Phone Support</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									For urgent issues requiring immediate assistance
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">IT Help Desk</span>
										<span className="text-muted-foreground text-sm">
											Ext. 1500
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">ERP Hotline</span>
										<span className="text-muted-foreground text-sm">
											Ext. 1501
										</span>
									</div>
									<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
										<span className="font-medium">After Hours</span>
										<span className="text-muted-foreground text-sm">
											Ext. 1502
										</span>
									</div>
								</div>
								<p className="mt-4 text-center text-muted-foreground text-xs">
									Available: Mon-Fri, 8 AM - 6 PM
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Support Teams */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Our Support Teams
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						<Card>
							<CardHeader className="text-center">
								<User className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">User Support</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Assistance with system navigation, features, and general
									usage.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ Account access issues</li>
									<li>â€¢ Feature explanations</li>
									<li>â€¢ Basic troubleshooting</li>
									<li>â€¢ User guide assistance</li>
									<li>â€¢ Password resets</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Contact User Support
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Laptop className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Technical Support</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Help with technical issues, system errors, and performance
									problems.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ System errors</li>
									<li>â€¢ Performance issues</li>
									<li>â€¢ Integration problems</li>
									<li>â€¢ Data import/export</li>
									<li>â€¢ Browser compatibility</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Contact Technical Support
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="text-center">
								<Shield className="mx-auto mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Security Team</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Report security concerns, access issues, and compliance
									questions.
								</p>
								<ul className="space-y-2 text-sm">
									<li>â€¢ Suspicious activity</li>
									<li>â€¢ Access violations</li>
									<li>â€¢ Data breaches</li>
									<li>â€¢ Compliance questions</li>
									<li>â€¢ Security training</li>
								</ul>
								<Button className="mt-4 w-full" variant="outline" size="sm">
									Contact Security Team
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Common Issues */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Common Issues & Solutions
					</h2>
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Headset className="mr-2 h-5 w-5 text-primary" />
									Login Problems
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-1 font-medium">Forgot Password:</h4>
										<p className="mb-2 text-muted-foreground text-sm">
											Use the "Forgot Password" link on the login page or
											contact IT support.
										</p>
										<Button variant="outline" size="sm">
											Reset Password
										</Button>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Account Locked:</h4>
										<p className="mb-2 text-muted-foreground text-sm">
											After 5 failed attempts, your account will be locked for
											30 minutes.
										</p>
										<Button variant="outline" size="sm">
											Unlock Account
										</Button>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Access Denied:</h4>
										<p className="text-muted-foreground text-sm">
											Contact your manager or IT support to verify your access
											permissions.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<Laptop className="mr-2 h-5 w-5 text-primary" />
									System Performance
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div>
										<h4 className="mb-1 font-medium">Slow Performance:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Clear your browser cache</li>
											<li>â€¢ Try a different browser</li>
											<li>â€¢ Check your internet connection</li>
											<li>â€¢ Close unused tabs</li>
										</ul>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Error Messages:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Note the exact error message</li>
											<li>â€¢ Try refreshing the page</li>
											<li>â€¢ Check if others are experiencing issues</li>
											<li>â€¢ Report to IT with screenshots</li>
										</ul>
									</div>
									<div>
										<h4 className="mb-1 font-medium">Data Not Saving:</h4>
										<ul className="space-y-1 text-muted-foreground text-sm">
											<li>â€¢ Check your internet connection</li>
											<li>â€¢ Verify you have edit permissions</li>
											<li>â€¢ Try saving smaller batches of data</li>
											<li>â€¢ Contact IT if issues persist</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Support Resources */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Self-Help Resources
					</h2>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<MapPin className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">IT Support Portal</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Access our comprehensive support portal for knowledge base
									articles, FAQs, and troubleshooting guides.
								</p>
								<Button className="w-full" variant="outline">
									Visit Support Portal
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<Headset className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Training Videos</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Watch step-by-step video tutorials on using our ERP system
									features and best practices.
								</p>
								<Button className="w-full" variant="outline">
									View Training Videos
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<FileText className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">User Guides</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Download comprehensive user manuals and quick reference guides
									for all system modules.
								</p>
								<Button className="w-full" variant="outline">
									Download User Guides
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-col items-center text-center">
								<User className="mb-2 h-8 w-8 text-primary" />
								<h3 className="font-semibold text-lg">Community Forum</h3>
							</CardHeader>
							<CardContent>
								<p className="mb-4 text-center text-muted-foreground">
									Connect with other users, share tips, and get answers from our
									community of experienced ERP users.
								</p>
								<Button className="w-full" variant="outline">
									Join Community Forum
								</Button>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Office Locations */}
				<section className="mb-16">
					<h2 className="mb-8 text-center font-bold text-3xl text-foreground tracking-tight">
						Our Office Locations
					</h2>
					<div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<MapPin className="mr-2 h-5 w-5 text-primary" />
									Headquarters
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<h4 className="font-medium">Address:</h4>
										<p className="text-muted-foreground text-sm">
											Evaluna Business Park
											<br />
											123 Tech Avenue, Suite 500
											<br />
											Innovation City, ST 12345
										</p>
									</div>
									<div>
										<h4 className="font-medium">Contact:</h4>
										<p className="text-muted-foreground text-sm">
											Phone: (555) 123-4567
											<br />
											Fax: (555) 123-4568
										</p>
									</div>
									<div>
										<h4 className="font-medium">IT Support:</h4>
										<p className="text-muted-foreground text-sm">
											Ext. 1500 (Internal)
											<br />
											support@evaluna.com
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h3 className="flex items-center font-semibold text-xl">
									<MapPin className="mr-2 h-5 w-5 text-primary" />
									Regional Office
								</h3>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div>
										<h4 className="font-medium">Address:</h4>
										<p className="text-muted-foreground text-sm">
											Evaluna Tech Center
											<br />
											456 Innovation Drive
											<br />
											Business City, ST 67890
										</p>
									</div>
									<div>
										<h4 className="font-medium">Contact:</h4>
										<p className="text-muted-foreground text-sm">
											Phone: (555) 234-5678
											<br />
											Fax: (555) 234-5679
										</p>
									</div>
									<div>
										<h4 className="font-medium">IT Support:</h4>
										<p className="text-muted-foreground text-sm">
											Ext. 1501 (Internal)
											<br />
											regional-support@evaluna.com
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Need Immediate Assistance?
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						Our IT support team is available to help with any issues you're
						experiencing. Don't hesitate to reach out for prompt assistance.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<Button asChild size="lg" className="shadow-lg">
							<Link href="mailto:support@evaluna.com">Email Support Team</Link>
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
