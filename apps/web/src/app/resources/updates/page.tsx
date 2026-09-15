import { Card, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function UpdatesPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />
			<main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
				<Link href="/resources" className="inline-flex items-center text-sm text-blue-600 hover:underline mb-6">
					<ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources
				</Link>
				<h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Product Updates & Release Notes</h1>
				<p className="text-slate-600 mb-8">Continuous improvements and new feature additions to the Evaluna ERP platform.</p>

				<div className="space-y-6">
					<Card className="border border-blue-200 bg-white shadow-sm">
						<CardHeader>
							<div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
								<Sparkles className="w-3.5 h-3.5" /> Version 2.4.0 (Latest Release)
							</div>
							<CardTitle className="text-xl font-bold">Full Hindi & English Internationalization + Geofenced Attendance</CardTitle>
							<CardDescription>Added comprehensive dual-language localization across Superadmin, Admin, HRMS, and Attendance modules with photo capture.</CardDescription>
						</CardHeader>
					</Card>
					<Card className="border border-slate-200 bg-white">
						<CardHeader>
							<div className="text-xs font-semibold text-slate-500 mb-1">Version 2.3.1</div>
							<CardTitle className="text-lg font-bold">Performance & Database Optimization</CardTitle>
							<CardDescription>Enhanced tRPC edge caching, index optimization for inventory searches, and automated backup routines.</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</main>
			<Footer />
		</div>
	);
}
