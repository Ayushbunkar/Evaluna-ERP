import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent } from "@evaluna/ui/components/card";
import { Rocket } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function CareersPage() {
	const openPositions = [
		{
			title: "Senior Full-Stack Engineer (Next.js / Node.js)",
			department: "Engineering",
			location: "Remote / Hybrid (Indore / Bangalore)",
			type: "Full-time",
		},
		{
			title: "Staff Database & Reliability Engineer (Postgres)",
			department: "Infrastructure",
			location: "Remote",
			type: "Full-time",
		},
		{
			title: "Enterprise Solutions Architect",
			department: "Sales & Solutions",
			location: "Delhi NCR / Mumbai",
			type: "Full-time",
		},
		{
			title: "Product Support Specialist (Vernacular Hindi / English)",
			department: "Customer Success",
			location: "Indore, MP",
			type: "Full-time",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />

			<section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-6">
					<Rocket className="w-4 h-4" /> Join The Evaluna Team
				</div>
				<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					Building The Digital Nervous System For <span className="text-blue-600">Bharat</span>
				</h1>
				<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
					We are on a mission to digitize supply chains, retail stores, and warehouses across growing and rural markets.
				</p>
			</section>

			<section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
				<h2 className="text-2xl font-bold text-slate-900 mb-6">Open Positions</h2>
				<div className="space-y-4">
					{openPositions.map((pos) => (
						<Card key={pos.title} className="border border-slate-200 hover:border-blue-300 transition-all bg-white">
							<CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div>
									<h3 className="text-lg font-bold text-slate-900">{pos.title}</h3>
									<div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
										<span className="px-2 py-0.5 bg-slate-100 rounded font-medium text-slate-700">{pos.department}</span>
										<span>•</span>
										<span>{pos.location}</span>
										<span>•</span>
										<span>{pos.type}</span>
									</div>
								</div>
								<Button asChild className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
									<Link href="/contact?subject=CareerApplication">Apply Now</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Footer />
		</div>
	);
}
