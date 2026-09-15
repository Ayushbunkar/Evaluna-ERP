import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { BookOpen, Tag } from "lucide-react";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function BlogPage() {
	const posts = [
		{
			title: "Why Offline-First Architecture is Critical for Tier-2/3 Retail in India",
			snippet: "Exploring how local caching and conflict-free data synchronization keep cash registers ringing when networks drop.",
			date: "Sep 2026",
			readTime: "5 min read",
			tag: "Technology",
		},
		{
			title: "Eliminating Inventory Shrinkage in Multi-Warehouse Supply Chains",
			snippet: "Best practices for barcode verification, automated GRN matching, and lot expiry tracking.",
			date: "Aug 2026",
			readTime: "7 min read",
			tag: "Operations",
		},
		{
			title: "How Geofenced GPS Attendance Boosts Field Operations Transparency",
			snippet: "Case study on how distribution fleets reduced phantom shifts and streamlined payroll calculations.",
			date: "Aug 2026",
			readTime: "4 min read",
			tag: "HR & Fleet",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />

			<section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
				<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-6">
					<BookOpen className="w-4 h-4" /> Insights & Engineering
				</div>
				<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight">
					Evaluna <span className="text-blue-600">Blog & Insights</span>
				</h1>
				<p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
					Practical knowledge on rural enterprise tech, supply chain automation, and modern ERP engineering.
				</p>
			</section>

			<section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{posts.map((post) => (
						<Card key={post.title} className="border border-slate-200 hover:shadow-lg transition-all bg-white flex flex-col justify-between">
							<CardHeader>
								<div className="flex items-center gap-2 text-xs text-blue-600 font-semibold mb-2">
									<Tag className="w-3.5 h-3.5" /> {post.tag}
								</div>
								<CardTitle className="text-lg font-bold text-slate-900 leading-snug">{post.title}</CardTitle>
								<CardDescription className="text-slate-600 text-sm mt-2">{post.snippet}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4 mt-2">
									<span>{post.date}</span>
									<span>{post.readTime}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Footer />
		</div>
	);
}
