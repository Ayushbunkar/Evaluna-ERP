import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	ArrowLeft,
	BookOpen,
	Database,
	FileText,
	HelpCircle,
	Search,
	Video,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserGuidesSection } from "@/components/docs/UserGuidesSection";
import { ModuleDocumentationSection } from "@/components/docs/ModuleDocumentationSection";
import { GettingStartedSection } from "@/components/docs/GettingStartedSection";
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
									className="flex-1 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
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
				<GettingStartedSection />

				{/* Module Documentation */}
				<ModuleDocumentationSection />

				{/* User Guides & Manuals (Bilingual PDF Generation) */}
				<UserGuidesSection />

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
							<img
								src="/logo.jpg"
								alt="Evaluna ERP"
								className="h-7 w-7 rounded-lg object-cover"
							/>
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
