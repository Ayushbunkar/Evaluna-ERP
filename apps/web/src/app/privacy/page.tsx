import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	Eye,
	FileText,
	Lock,
	Shield,
	User,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { constructMetadata, generateBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = constructMetadata({
	title: "Privacy Policy — Data Protection & Privacy Practices",
	description:
		"Read Evaluna ERP's privacy policy regarding data collection, encryption, geofencing coordinates, and enterprise security compliance.",
	canonicalPath: "/privacy",
});

export default function PrivacyPage() {
	const breadcrumbJson = generateBreadcrumbSchema([
		{ name: "Home", url: "/" },
		{ name: "Privacy Policy", url: "/privacy" },
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
			<main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-12 text-center">
					<h1 className="mb-6 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
						Privacy Policy
					</h1>
					<p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground">
						This Privacy Policy explains how we collect, use, disclose, and
						safeguard your information when you use our internal ERP system.
					</p>
					<div className="text-muted-foreground text-sm">
						Last updated:{" "}
						{new Date().toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</div>
				</div>

				{/* Privacy Policy Content */}
				<div className="space-y-8">
					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Shield className="mr-2 h-5 w-5 text-primary" />
								Introduction
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								Evaluna Technologies ("we", "our", "us") is committed to
								protecting the privacy and security of our employees' personal
								information. This Privacy Policy describes how we collect, use,
								and safeguard information within our internal ERP system.
							</p>
							<p className="text-muted-foreground">
								This policy applies to all users of our ERP system, including
								employees, contractors, and authorized personnel. By accessing
								or using our system, you consent to the practices described in
								this policy.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<FileText className="mr-2 h-5 w-5 text-primary" />
								Information We Collect
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								We collect various types of information to provide and improve
								our ERP system services:
							</p>
							<div className="space-y-4">
								<div>
									<h3 className="mb-2 font-medium">Personal Information:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>Full name and contact information</li>
										<li>Employee ID and job title</li>
										<li>Department and location</li>
										<li>Contact information (email, phone)</li>
										<li>Emergency contact details</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">Business Information:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>Job performance data</li>
										<li>Attendance and time records</li>
										<li>Training and certification records</li>
										<li>Project assignments and progress</li>
										<li>Department-specific operational data</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">System Usage Data:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>Login times and session duration</li>
										<li>IP addresses and device information</li>
										<li>System access logs</li>
										<li>Feature usage patterns</li>
										<li>Error reports and debugging information</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Lock className="mr-2 h-5 w-5 text-primary" />
								How We Use Your Information
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								We use the information we collect for various business purposes:
							</p>
							<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
								<li>To provide and maintain our ERP system services</li>
								<li>To manage employee records and HR processes</li>
								<li>To process payroll and benefits administration</li>
								<li>To track business operations and performance</li>
								<li>To generate reports and analytics for management</li>
								<li>To ensure system security and prevent fraud</li>
								<li>To comply with legal and regulatory requirements</li>
								<li>To improve system functionality and user experience</li>
								<li>To communicate important company information</li>
								<li>To provide technical support and troubleshooting</li>
							</ul>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<User className="mr-2 h-5 w-5 text-primary" />
								Information Sharing and Disclosure
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								We may share your information in the following circumstances:
							</p>
							<div className="space-y-4">
								<div>
									<h3 className="mb-2 font-medium">Within Our Organization:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>With your direct managers and supervisors</li>
										<li>With HR and payroll departments</li>
										<li>With IT support staff for troubleshooting</li>
										<li>
											· With authorized personnel based on role-based access
										</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">With Service Providers:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>Cloud hosting and infrastructure providers</li>
										<li>Payroll processing services</li>
										<li>IT security and maintenance vendors</li>
										<li>
											· All service providers are bound by confidentiality
											agreements
										</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">For Legal Compliance:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>To comply with applicable laws and regulations</li>
										<li>To respond to lawful requests from authorities</li>
										<li>To protect our rights and property</li>
										<li>
											· To investigate potential violations of our policies
										</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Eye className="mr-2 h-5 w-5 text-primary" />
								Data Security and Retention
							</h2>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h3 className="mb-2 font-medium">Security Measures:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>Role-based access control and authentication</li>
										<li>Data encryption in transit and at rest</li>
										<li>· Regular security audits and vulnerability testing</li>
										<li>
											· Secure data backup and disaster recovery procedures
										</li>
										<li>· Employee training on data security best practices</li>
									</ul>
								</div>
								<div>
									<h3 className="mb-2 font-medium">Data Retention:</h3>
									<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
										<li>
											· Employee records: Retained for duration of employment +
											7 years
										</li>
										<li>
											· Financial records: Retained for 7 years as per legal
											requirements
										</li>
										<li>System logs: Retained for 12 months</li>
										<li>
											· Deleted data may be retained in backups for up to 90
											days
										</li>
										<li>
											· Specific retention periods may vary based on legal
											requirements
										</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<User className="mr-2 h-5 w-5 text-primary" />
								Your Rights and Choices
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								As an employee using our ERP system, you have certain rights
								regarding your personal information:
							</p>
							<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
								<li>Right to access your personal information</li>
								<li>Right to request correction of inaccurate data</li>
								<li>
									· Right to request deletion of certain information (subject to
									legal requirements)
								</li>
								<li>Right to limit processing of your personal data</li>
								<li>Right to receive information about data sharing</li>
								<li>· Right to file complaints with appropriate authorities</li>
							</ul>
							<p className="mt-4 text-muted-foreground">
								To exercise these rights, please contact our HR department or IT
								security team.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<Shield className="mr-2 h-5 w-5 text-primary" />
								Policy Updates
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								We may update this Privacy Policy from time to time. When we
								make changes, we will:
							</p>
							<ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
								<li>Post the updated policy on our internal systems</li>
								<li>
									· Update the "Last updated" date at the top of this policy
								</li>
								<li>
									· Notify employees of significant changes via company
									communication channels
								</li>
								<li>
									· Provide reasonable notice before major policy changes take
									effect
								</li>
							</ul>
							<p className="mt-4 text-muted-foreground">
								We encourage you to review this Privacy Policy periodically to
								stay informed about how we are protecting your information.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h2 className="flex items-center font-bold text-xl">
								<FileText className="mr-2 h-5 w-5 text-primary" />
								Contact Information
							</h2>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground">
								If you have any questions or concerns about this Privacy Policy
								or our data practices, please contact:
							</p>
							<div className="space-y-4">
								<div>
									<h3 className="mb-1 font-medium">HR Department:</h3>
									<p className="text-muted-foreground text-sm">
										hr@evaluna.com
									</p>
									<p className="text-muted-foreground text-sm">Ext. 1200</p>
								</div>
								<div>
									<h3 className="mb-1 font-medium">IT Security Team:</h3>
									<p className="text-muted-foreground text-sm">
										security@evaluna.com
									</p>
									<p className="text-muted-foreground text-sm">Ext. 1201</p>
								</div>
								<div>
									<h3 className="mb-1 font-medium">Data Protection Officer:</h3>
									<p className="text-muted-foreground text-sm">
										dpo@evaluna.com
									</p>
									<p className="text-muted-foreground text-sm">Ext. 1202</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* CTA Section */}
				<section className="mt-12 text-center">
					<h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
						Need More Information?
					</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						If you have any questions about our privacy practices or need to
						exercise your rights, please don't hesitate to contact our HR or IT
						security teams.
					</p>
					<Button asChild variant="outline">
						<Link href="/contact">Contact IT Support</Link>
					</Button>
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
						<span>• Privacy & Compliance</span>
					</div>
					<div>
						© {new Date().getFullYear()} Evaluna Technologies Pvt. Ltd. All rights reserved.
					</div>
					<div className="flex items-center space-x-4">
						<Link href="/terms" className="hover:text-foreground transition-colors">
							Terms
						</Link>
						<Link href="/contact" className="hover:text-foreground transition-colors">
							Contact
						</Link>
						<Link href="/about" className="hover:text-foreground transition-colors">
							About
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
