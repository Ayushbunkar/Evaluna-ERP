"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	Download,
	HelpCircle,
	FileText,
	ShieldCheck,
	Languages,
	Keyboard,
	Workflow,
	AlertTriangle,
	Database,
	Users,
	Calculator,
	Truck,
	BadgeCheck,
} from "lucide-react";
import { DOCS_GUIDES, type GuideContent } from "@/lib/docs-guides-data";
import { GuideDownloadModal } from "./GuideDownloadModal";

export function UserGuidesSection() {
	const [activeGuide, setActiveGuide] = useState<GuideContent | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleOpenGuide = (guideId: string) => {
		const guide = DOCS_GUIDES[guideId];
		if (guide) {
			setActiveGuide(guide);
			setIsModalOpen(true);
		}
	};

	const departmentGuides = [
		{
			id: "sales-guide",
			title: "Sales Team Guide",
			titleHi: "बिक्री टीम मार्गदर्शिका",
			desc: "POS checkout, billing transparency & ethical customer engagement",
			icon: BadgeCheck,
		},
		{
			id: "finance-guide",
			title: "Finance & Accounting Guide",
			titleHi: "वित्त एवं लेखा मार्गदर्शिका",
			desc: "Dual authorization, expense verification & fiscal governance",
			icon: Calculator,
		},
		{
			id: "operations-guide",
			title: "Operations & Warehouse Guide",
			titleHi: "संचालन एवं वेयरहाउस मार्गदर्शिका",
			desc: "FEFO picking, bin management & physical inventory control",
			icon: Truck,
		},
		{
			id: "hr-guide",
			title: "HR & Workplace Conduct Guide",
			titleHi: "मानव संसाधन आचार संहिता",
			desc: "Attendance fidelity, employee privacy & POSH ethics",
			icon: Users,
		},
	];

	const quickReferences = [
		{
			id: "keyboard-shortcuts",
			title: "Keyboard Shortcuts",
			titleHi: "कीबोर्ड शॉर्टकट संदर्भ",
			desc: "Rapid checkout keys, command palette & ergonomic navigation",
			icon: Keyboard,
		},
		{
			id: "common-workflows",
			title: "Common Workflows",
			titleHi: "दैनिक कार्यप्रवाह (SOP)",
			desc: "Store opening, stock transfer & day-end cash reconciliation",
			icon: Workflow,
		},
		{
			id: "error-codes",
			title: "System Error Codes",
			titleHi: "सिस्टम त्रुटि कोड एवं समाधान",
			desc: "Diagnostic definitions, user self-fixes & safe IT escalation",
			icon: AlertTriangle,
		},
		{
			id: "data-entry",
			title: "Data Entry Tips",
			titleHi: "डेटा प्रविष्टि मानक",
			desc: "Zero-error master data, phone formats & GSTIN verification",
			icon: Database,
		},
	];

	return (
		<section className="mb-16">
			<div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span>Standard Operating Procedures (SOP)</span>
					</div>
					<h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
						User Guides & Manuals
					</h2>
					<p className="mt-1 text-sm text-muted-foreground max-w-2xl">
						Download verified standard operating procedures and ethics charters in
						Hindi or English. Crafted for operational transparency without exposing
						confidential system credentials.
					</p>
				</div>
				<div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60 self-start md:self-auto">
					<Languages className="h-3.5 w-3.5 text-primary" />
					<span>Bilingual PDFs available (English & हिंदी)</span>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Department Guides Card */}
				<Card className="border-border/70 bg-card text-card-foreground shadow-sm">
					<CardHeader className="flex flex-col items-start border-b border-border/50 pb-4">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<Download className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-semibold text-lg text-foreground">
									Department Guides & Ethics
								</h3>
								<p className="text-xs text-muted-foreground">
									Role-specific protocols tailored to enterprise departments
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-4">
						<div className="space-y-3">
							{departmentGuides.map((item) => {
								const Icon = item.icon;
								return (
									<div
										key={item.id}
										className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-3.5 transition-colors"
									>
										<div className="flex items-start space-x-3 min-w-0">
											<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/80 text-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
												<Icon className="h-4 w-4" />
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-1.5">
													<span className="font-semibold text-foreground text-sm truncate">
														{item.title}
													</span>
													<span className="text-[10px] text-muted-foreground hidden sm:inline">
														({item.titleHi})
													</span>
												</div>
												<p className="text-xs text-muted-foreground truncate">
													{item.desc}
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleOpenGuide(item.id)}
											className="shrink-0 text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
										>
											<Download className="h-3.5 w-3.5 text-primary" />
											<span>Download</span>
										</Button>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Quick Reference Card */}
				<Card className="border-border/70 bg-card text-card-foreground shadow-sm">
					<CardHeader className="flex flex-col items-start border-b border-border/50 pb-4">
						<div className="flex items-center space-x-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
								<HelpCircle className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-semibold text-lg text-foreground">
									Quick Reference & Operations
								</h3>
								<p className="text-xs text-muted-foreground">
									Cheat sheets, workflows, and instant diagnostic guides
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className="pt-4">
						<div className="space-y-3">
							{quickReferences.map((item) => {
								const Icon = item.icon;
								return (
									<div
										key={item.id}
										className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-3.5 transition-colors"
									>
										<div className="flex items-start space-x-3 min-w-0">
											<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/80 text-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors">
												<Icon className="h-4 w-4" />
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-1.5">
													<span className="font-semibold text-foreground text-sm truncate">
														{item.title}
													</span>
													<span className="text-[10px] text-muted-foreground hidden sm:inline">
														({item.titleHi})
													</span>
												</div>
												<p className="text-xs text-muted-foreground truncate">
													{item.desc}
												</p>
											</div>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleOpenGuide(item.id)}
											className="shrink-0 text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
										>
											<FileText className="h-3.5 w-3.5 text-primary" />
											<span>View / PDF</span>
										</Button>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Language Selection & Download Modal */}
			<GuideDownloadModal
				guide={activeGuide}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</section>
	);
}
