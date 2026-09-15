import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { ArrowRight, BookOpen, Download, FileText, HelpCircle, Layers } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function ResourcesPage() {
	const sections = [
		{
			title: "Documentation & API",
			description: "Comprehensive guides, schema references, and integration docs for developers and IT administrators.",
			icon: BookOpen,
			href: "/docs",
			cta: "View Documentation",
		},
		{
			title: "Interactive Demo",
			description: "Test-drive the Evaluna POS billing terminal, warehouse management, and analytics in your browser.",
			icon: Layers,
			href: "/demo",
			cta: "Launch Demo",
		},
		{
			title: "Guides & Tutorials",
			description: "Step-by-step walkthroughs on setting up barcode printers, geofencing, GST tax slabs, and employee roles.",
			icon: FileText,
			href: "/resources/guides",
			cta: "Read Guides",
		},
		{
			title: "Product Updates & Changelog",
			description: "Stay up-to-date with new feature releases, speed improvements, and security patches.",
			icon: Download,
			href: "/resources/updates",
			cta: "View Changelog",
		},
		{
			title: "Help Center & FAQs",
			description: "Answers to common questions regarding offline synchronization, hardware compatibility, and billing.",
			icon: HelpCircle,
			href: "/resources/help",
			cta: "Visit Help Center",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />

			<section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-6">
					<BookOpen className="w-4 h-4" /> Resource Center
				</div>
				<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					Guides, Documentation, & <span className="text-blue-600">Knowledge Hub</span>
				</h1>
				<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
					Everything you need to successfully roll out, operate, and master Evaluna ERP in your business.
				</p>
			</section>

			<section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{sections.map((sec) => {
						const Icon = sec.icon;
						return (
							<Card key={sec.title} className="border border-slate-200 hover:shadow-lg transition-all bg-white flex flex-col justify-between">
								<CardHeader>
									<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
										<Icon className="w-5 h-5" />
									</div>
									<CardTitle className="text-lg font-bold text-slate-900">{sec.title}</CardTitle>
									<CardDescription className="text-slate-600 text-sm mt-1">{sec.description}</CardDescription>
								</CardHeader>
								<CardContent>
									<Button variant="outline" className="w-full text-blue-600 hover:text-blue-700" asChild>
										<Link href={sec.href}>
											{sec.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
										</Link>
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>

			<Footer />
		</div>
	);
}
