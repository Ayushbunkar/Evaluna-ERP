"use client";

import { useState } from "react";
import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	BookOpen,
	HelpCircle,
	Video,
	Download,
	Play,
	CheckCircle2,
	ArrowRight,
	Languages,
	ShieldCheck,
} from "lucide-react";
import { DOCS_GUIDES, type GuideContent } from "@/lib/docs-guides-data";
import { GuideDownloadModal } from "./GuideDownloadModal";
import { VideoTutorialModal } from "./VideoTutorialModal";

export function GettingStartedSection() {
	const [activeGuide, setActiveGuide] = useState<GuideContent | null>(null);
	const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
	const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

	const handleOpenGuide = (guideId: string) => {
		const guide = DOCS_GUIDES[guideId];
		if (guide) {
			setActiveGuide(guide);
			setIsGuideModalOpen(true);
		}
	};

	return (
		<section className="mb-16">
			<div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-primary mb-1">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span>Enterprise Onboarding & Orientation</span>
					</div>
					<h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
						Getting Started
					</h2>
					<p className="mt-1 text-sm text-muted-foreground max-w-2xl">
						Explore system architecture, operator quick-start procedures, and interactive bilingual video tutorials with instant PDF manual downloads.
					</p>
				</div>
				<div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg border border-border/60 self-start md:self-auto">
					<Languages className="h-3.5 w-3.5 text-primary" />
					<span>Bilingual PDF & Video Available</span>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{/* 1. System Overview */}
				<Card className="flex flex-col justify-between border border-border/70 bg-card text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
					<CardHeader className="text-center pb-3">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<BookOpen className="h-6 w-6" />
						</div>
						<h3 className="font-bold text-xl text-foreground">System Overview</h3>
						<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
							Learn about our ERP system architecture, modular hierarchy, security, and key capabilities.
						</p>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="border-t border-border/60 pt-4 mb-4">
							<h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">
								Core Dimensions
							</h4>
							<ul className="space-y-2 text-xs text-foreground/90">
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>System & offline database architecture</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Role-based access & privileges (RBAC)</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Hardware & thermal printer requirements</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Multi-branch data routing protocols</span>
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handleOpenGuide("system-overview")}
							className="w-full text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
							variant="outline"
							size="sm"
						>
							<Download className="h-3.5 w-3.5 text-primary" />
							<span>Read Overview / PDF</span>
						</Button>
					</CardContent>
				</Card>

				{/* 2. Quick Start Guide */}
				<Card className="flex flex-col justify-between border border-border/70 bg-card text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
					<CardHeader className="text-center pb-3">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<HelpCircle className="h-6 w-6" />
						</div>
						<h3 className="font-bold text-xl text-foreground">Quick Start Guide</h3>
						<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
							Step-by-step operator guide to get you up and running quickly with our ERP system.
						</p>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="border-t border-border/60 pt-4 mb-4">
							<h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">
								Operator Workflows
							</h4>
							<ul className="space-y-2 text-xs text-foreground/90">
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>First-time login & terminal pairing</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Dashboard setup & float cash balance</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Basic keyboard shortcuts & navigation</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Shift settlement & handover sign-off</span>
								</li>
							</ul>
						</div>
						<Button
							onClick={() => handleOpenGuide("quick-start-guide")}
							className="w-full text-xs font-medium border-border hover:border-primary hover:bg-primary/10 hover:text-primary gap-1.5"
							variant="outline"
							size="sm"
						>
							<Download className="h-3.5 w-3.5 text-primary" />
							<span>Start Quick Guide / PDF</span>
						</Button>
					</CardContent>
				</Card>

				{/* 3. Video Tutorials */}
				<Card className="flex flex-col justify-between border border-border/70 bg-card text-card-foreground shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
					<CardHeader className="text-center pb-3">
						<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
							<Video className="h-6 w-6" />
						</div>
						<h3 className="font-bold text-xl text-foreground">Video Tutorials</h3>
						<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
							Interactive audio-visual guides and step-by-step walkthroughs for key ERP features.
						</p>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="border-t border-border/60 pt-4 mb-4">
							<h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">
								Walkthrough Series
							</h4>
							<ul className="space-y-2 text-xs text-foreground/90">
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Platform Architecture Tour (5:32)</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Terminal Hardware & POS Setup (4:18)</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Daily SOP & Shift Handover (6:45)</span>
								</li>
								<li className="flex items-start gap-1.5">
									<CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
									<span>Financial Ledgers & Tax Reports (7:22)</span>
								</li>
							</ul>
						</div>
						<Button
							onClick={() => setIsVideoModalOpen(true)}
							className="w-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-xs"
							size="sm"
						>
							<Play className="h-3.5 w-3.5 fill-current" />
							<span>Watch Video Tutorials</span>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Bilingual PDF Download Modal */}
			<GuideDownloadModal
				guide={activeGuide}
				isOpen={isGuideModalOpen}
				onClose={() => setIsGuideModalOpen(false)}
			/>

			{/* Bilingual Video Tutorial Modal */}
			<VideoTutorialModal
				isOpen={isVideoModalOpen}
				onClose={() => setIsVideoModalOpen(false)}
			/>
		</section>
	);
}
