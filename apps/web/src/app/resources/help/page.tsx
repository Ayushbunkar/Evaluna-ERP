import { Card, CardHeader, CardTitle, CardDescription } from "@evaluna/ui/components/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

export default function HelpPage() {
	const faqs = [
		{
			q: "Can I use Evaluna ERP without an active internet connection?",
			a: "Yes. Evaluna POS and inventory management are built offline-first. Transactions are stored locally in your browser/terminal cache and synchronize automatically once connectivity is restored.",
		},
		{
			q: "Does Evaluna support Indian GST invoicing and HSN codes?",
			a: "Yes. Evaluna automatically calculates CGST, SGST, and IGST based on customer state and product HSN codes, generating GST-compliant tax invoices.",
		},
		{
			q: "How does GPS Geofenced Attendance work?",
			a: "When employees check in via their smartphone or branch tablet, the app verifies their GPS coordinates against the branch perimeter and captures a live photo to ensure authentic attendance.",
		},
	];

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
			<Navbar />
			<main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
				<Link href="/resources" className="inline-flex items-center text-sm text-blue-600 hover:underline mb-6">
					<ArrowLeft className="w-4 h-4 mr-1" /> Back to Resources
				</Link>
				<h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Help Center & Frequently Asked Questions</h1>
				<p className="text-slate-600 mb-8">Find fast answers to common questions about Evaluna ERP.</p>

				<div className="space-y-4">
					{faqs.map((f) => (
						<Card key={f.q} className="border border-slate-200 bg-white">
							<CardHeader>
								<CardTitle className="text-lg font-bold text-slate-900">{f.q}</CardTitle>
								<CardDescription className="text-slate-700 text-sm mt-2 leading-relaxed">{f.a}</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</main>
			<Footer />
		</div>
	);
}
