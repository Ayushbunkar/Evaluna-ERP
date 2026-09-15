import { Card, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function GuidesPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />
			<main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
				<Link href="/resources" className="inline-flex items-center text-sm text-blue-600 hover:underline mb-6">
					<ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources
				</Link>
				<h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Implementation & User Guides</h1>
				<p className="text-slate-600 mb-8">Follow our step-by-step operational setup guides for store cashiers, warehouse pickers, and branch administrators.</p>
				
				<div className="space-y-6">
					<Card className="border border-slate-200 bg-white">
						<CardHeader>
							<CardTitle className="text-xl font-bold">1. Quickstart: Setting Up Your First Store & Branch</CardTitle>
							<CardDescription>How to register your company, configure default tax rates (GST), and add your initial product inventory.</CardDescription>
						</CardHeader>
					</Card>
					<Card className="border border-slate-200 bg-white">
						<CardHeader>
							<CardTitle className="text-xl font-bold">2. Configuring Offline POS & Thermal Printers</CardTitle>
							<CardDescription>Setup thermal ESC/POS 58mm & 80mm printers, barcode scanners, and local cache retention.</CardDescription>
						</CardHeader>
					</Card>
					<Card className="border border-slate-200 bg-white">
						<CardHeader>
							<CardTitle className="text-xl font-bold">3. Setting Up GPS Geofences for Staff Attendance</CardTitle>
							<CardDescription>How to define latitude, longitude, and radius boundaries for each branch location to prevent proxy clock-ins.</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</main>
			<Footer />
		</div>
	);
}
