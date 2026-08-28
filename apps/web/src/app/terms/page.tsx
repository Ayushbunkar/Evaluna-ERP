import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	AlertTriangle,
	ArrowLeft,
	FileText,
	Gavel,
	MountainIcon,
	Shield,
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
			<main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						Terms of Service
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						These Terms of Service govern your access to and use of our internal
						ERP system.
					</p>
					<div className="text-muted-foreground text-sm">
						Effective date:{" "}
						{new Date().toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</div>
				</div>

				{/* Terms Content */}
				<div className="space-y-8">
					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<FileText className="mr-2 h-5 w-5 text-primary" />
								Introduction
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								Welcome to Evaluna Technologies Internal ERP System. These Terms
								of Service ("Terms") govern your access to and use of our
								proprietary business management system, including all related
								services, tools, and content.
							</p>
							<p className="text-muted-foreground">
								By accessing or using our ERP system, you agree to be bound by
								these Terms. If you do not agree to these Terms, you may not
								access or use our system.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Shield className="mr-2 h-5 w-5 text-primary" />
								Acceptable Use Policy
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								When using our ERP system, you agree to:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>
									â€¢ Use the system only for authorized business purposes
								</li>
								<li>â€¢ Comply with all company policies and procedures</li>
								<li>
									â€¢ Maintain the confidentiality of sensitive information
								</li>
								<li>
									â€¢ Use only your assigned credentials and not share them
								</li>
								<li>
									â€¢ Report any security issues or suspicious activity
									immediately
								</li>
								<li>â€¢ Follow all data protection and privacy regulations</li>
							</ul>
							<p className="mt-4 text-muted-foreground">
								Prohibited activities include, but are not limited to:
							</p>
							<ul className="space-y-1 text-muted-foreground text-sm">
								<li>â€¢ Unauthorized access to data or systems</li>
								<li>â€¢ Sharing confidential information externally</li>
								<li>â€¢ Attempting to bypass security measures</li>
								<li>â€¢ Using the system for personal gain</li>
								<li>â€¢ Introducing malware or harmful software</li>
								<li>â€¢ Any activity that violates company policies</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Gavel className="mr-2 h-5 w-5 text-primary" />
								User Responsibilities
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								As a user of our ERP system, you are responsible for:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>
									â€¢ Maintaining the confidentiality of your login credentials
								</li>
								<li>
									â€¢ Using the system in compliance with all applicable laws
								</li>
								<li>
									â€¢ Reporting any suspected security breaches immediately
								</li>
								<li>
									â€¢ Ensuring the accuracy of data you enter into the system
								</li>
								<li>â€¢ Completing required training on system usage</li>
								<li>â€¢ Following all company IT security policies</li>
								<li>
									â€¢ Using the system only for authorized business purposes
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<AlertTriangle className="mr-2 h-5 w-5 text-primary" />
								System Access and Security
							</h2>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h3 className="mb-2 font-medium">Access Control:</h3>
									<ul className="space-y-1 text-muted-foreground text-sm">
										<li>
											â€¢ Access is granted based on job role and
											responsibilities
										</li>
										<li>
											â€¢ Users may only access data necessary for their job
											functions
										</li>
										<li>
											â€¢ Access levels are reviewed and updated regularly
										</li>
										<li>
											â€¢ Unauthorized access attempts will be investigated
										</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">Data Security:</h3>
									<ul className="space-y-1 text-muted-foreground text-sm">
										<li>â€¢ All data is encrypted in transit and at rest</li>
										<li>â€¢ Regular security audits are conducted</li>
										<li>â€¢ System vulnerabilities are patched promptly</li>
										<li>â€¢ Data backups are performed regularly</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">Incident Reporting:</h3>
									<ul className="space-y-1 text-muted-foreground text-sm">
										<li>
											â€¢ Report lost or compromised credentials immediately
										</li>
										<li>â€¢ Report any suspicious system behavior</li>
										<li>â€¢ Report unauthorized access attempts</li>
										<li>â€¢ Report any potential data breaches</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<FileText className="mr-2 h-5 w-5 text-primary" />
								Intellectual Property
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								All content, software, and materials within our ERP system are
								the property of Evaluna Technologies and are protected by
								copyright, trademark, and other intellectual property laws.
							</p>
							<p className="text-muted-foreground">
								You may not copy, modify, distribute, or create derivative works
								from any part of our system without explicit written permission
								from Evaluna Technologies.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Shield className="mr-2 h-5 w-5 text-primary" />
								Confidentiality and Data Protection
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								All information within our ERP system is considered confidential
								and proprietary to Evaluna Technologies. You agree to:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>â€¢ Maintain the confidentiality of all business data</li>
								<li>
									â€¢ Not disclose confidential information to unauthorized
									parties
								</li>
								<li>
									â€¢ Use confidential information only for authorized business
									purposes
								</li>
								<li>
									â€¢ Comply with all data protection laws and regulations
								</li>
								<li>
									â€¢ Report any potential confidentiality breaches immediately
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Gavel className="mr-2 h-5 w-5 text-primary" />
								Termination of Access
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								Your access to our ERP system may be terminated immediately for
								any of the following reasons:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>â€¢ Violation of these Terms of Service</li>
								<li>â€¢ Violation of company policies or procedures</li>
								<li>â€¢ Suspicion of unauthorized or fraudulent activity</li>
								<li>â€¢ Termination of employment or contract</li>
								<li>â€¢ Security concerns or potential breaches</li>
								<li>â€¢ Failure to comply with training requirements</li>
							</ul>
							<p className="mt-4 text-muted-foreground">
								Upon termination of access, you must immediately cease all use
								of the system and return any company property or data in your
								possession.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<AlertTriangle className="mr-2 h-5 w-5 text-primary" />
								Disclaimer of Warranties
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								Our ERP system is provided "as is" without any warranties,
								express or implied. We do not guarantee that:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>â€¢ The system will be error-free or uninterrupted</li>
								<li>â€¢ The system will meet your specific requirements</li>
								<li>â€¢ Any defects will be corrected</li>
								<li>
									â€¢ The system will be compatible with all devices or browsers
								</li>
								<li>â€¢ The system will be secure from all vulnerabilities</li>
							</ul>
							<p className="mt-4 text-muted-foreground">
								We strive to maintain system availability and performance, but
								we do not guarantee 100% uptime. Scheduled maintenance and
								unexpected outages may occur.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Shield className="mr-2 h-5 w-5 text-primary" />
								Limitation of Liability
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								To the fullest extent permitted by law, Evaluna Technologies
								shall not be liable for:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>â€¢ Any indirect, incidental, or consequential damages</li>
								<li>â€¢ Loss of data or business interruption</li>
								<li>â€¢ Errors or omissions in system data</li>
								<li>â€¢ Unauthorized access to the system</li>
								<li>
									â€¢ Any damages resulting from system use or inability to use
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<FileText className="mr-2 h-5 w-5 text-primary" />
								Changes to Terms
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								We reserve the right to modify these Terms at any time. When we
								make changes, we will:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>â€¢ Post the updated Terms on our internal systems</li>
								<li>
									â€¢ Update the "Effective date" at the top of these Terms
								</li>
								<li>
									â€¢ Notify employees of significant changes via company
									communication channels
								</li>
								<li>
									â€¢ Provide reasonable notice before major changes take effect
								</li>
							</ul>
							<p className="mt-4 text-muted-foreground">
								Your continued use of the system after any changes constitutes
								your acceptance of the new Terms.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Gavel className="mr-2 h-5 w-5 text-primary" />
								Governing Law
							</h2>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								These Terms shall be governed by and construed in accordance
								with the laws of the jurisdiction where Evaluna Technologies is
								incorporated, without regard to its conflict of law principles.
							</p>
						</CardContent>
					</Card>
				</div>

				{/* CTA Section */}
				<section className="mt-12 text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Questions About These Terms?
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						If you have any questions about these Terms of Service or need
						clarification, please contact our IT or legal department.
					</p>
					<Button asChild variant="outline">
						<Link href="/contact">Contact IT Support</Link>
					</Button>
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
