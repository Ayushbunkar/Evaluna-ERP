"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@evaluna/ui/components/button";
import { Badge } from "@evaluna/ui/components/badge";
import {
	Download,
	FileText,
	Languages,
	Loader2,
	ShieldCheck,
	CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { GuideContent } from "@/lib/docs-guides-data";
import { generateGuidePdf } from "@/lib/utils/guide-pdf-generator";

interface GuideDownloadModalProps {
	guide: GuideContent | null;
	isOpen: boolean;
	onClose: () => void;
}

export function GuideDownloadModal({
	guide,
	isOpen,
	onClose,
}: GuideDownloadModalProps) {
	const [selectedLang, setSelectedLang] = useState<"en" | "hi">("en");
	const [isGenerating, setIsGenerating] = useState(false);

	if (!guide) return null;

	const handleDownload = async (lang: "en" | "hi") => {
		try {
			setIsGenerating(true);
			setSelectedLang(lang);
			await generateGuidePdf(guide, lang);
			toast.success(
				lang === "hi"
					? `"${guide.title.hi}" पीडीएफ सफलतापूर्वक डाउनलोड हो गया!`
					: `"${guide.title.en}" PDF downloaded successfully!`,
			);
			onClose();
		} catch (error) {
			console.error("PDF generation failed:", error);
			toast.error(
				lang === "hi"
					? "पीडीएफ जनरेट करने में त्रुटि हुई। कृपया पुनः प्रयास करें।"
					: "Failed to generate PDF. Please try again.",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-xl border-border bg-card text-card-foreground shadow-2xl p-6 sm:p-7">
				<DialogHeader className="space-y-2">
					<div className="flex items-center justify-between">
						<Badge
							variant="outline"
							className="border-primary/30 bg-primary/10 text-primary font-medium text-xs tracking-wide"
						>
							<ShieldCheck className="mr-1 h-3.5 w-3.5 text-primary" />
							{guide.badge.en} • ISO 9001:2015
						</Badge>
						<span className="text-[11px] font-mono text-muted-foreground uppercase">
							Ref: {guide.id}
						</span>
					</div>
					<DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						{guide.title.en}
					</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground leading-relaxed">
						{guide.summary.en}
					</DialogDescription>
				</DialogHeader>

				{/* Ethics & Public Scope Callout */}
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
					<div className="flex items-center space-x-2 text-xs font-semibold text-primary uppercase tracking-wider">
						<ShieldCheck className="h-4 w-4 text-primary" />
						<span>Public Ethics & Standard Operating Charter</span>
					</div>
					<p className="text-xs text-foreground/80 leading-relaxed">
						This official document provides operational protocols and ethical
						standards without revealing confidential internal database schemas,
						passwords, or server credentials. Safe for employee onboarding and
						client verification.
					</p>
					<ul className="grid grid-cols-1 gap-1 pt-1 text-xs text-muted-foreground">
						{guide.ethicsHighlights.en.slice(0, 3).map((item, idx) => (
							<li key={idx} className="flex items-start space-x-1.5">
								<CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Language Selection Grid */}
				<div className="space-y-3 pt-1">
					<div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
						<Languages className="h-3.5 w-3.5 text-primary" />
						<span>Select Document Language / भाषा चुनें</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{/* English Card Button */}
						<button
							type="button"
							onClick={() => handleDownload("en")}
							disabled={isGenerating}
							className="group relative flex flex-col items-start rounded-xl border border-border/80 bg-background/50 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
						>
							<div className="flex w-full items-center justify-between mb-2">
								<span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
									<FileText className="h-4 w-4 text-primary" />
									English Edition
								</span>
								<span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
									EN
								</span>
							</div>
							<p className="text-xs text-muted-foreground mb-3 leading-relaxed">
								Formal international English, standard enterprise terminology,
								and detailed audit checklists.
							</p>
							<Button
								size="sm"
								className="w-full mt-auto text-xs font-medium"
								disabled={isGenerating}
							>
								{isGenerating && selectedLang === "en" ? (
									<>
										<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										Generating PDF...
									</>
								) : (
									<>
										<Download className="mr-1.5 h-3.5 w-3.5" />
										Download English (PDF)
									</>
								)}
							</Button>
						</button>

						{/* Hindi Card Button */}
						<button
							type="button"
							onClick={() => handleDownload("hi")}
							disabled={isGenerating}
							className="group relative flex flex-col items-start rounded-xl border border-border/80 bg-background/50 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
						>
							<div className="flex w-full items-center justify-between mb-2">
								<span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
									<FileText className="h-4 w-4 text-primary" />
									हिंदी संस्करण
								</span>
								<span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
									HI
								</span>
							</div>
							<p className="text-xs text-muted-foreground mb-3 leading-relaxed">
								सरल एवं स्पष्ट हिंदी भाषा, आचार संहिता, दैनिक कार्यप्रवाह एवं
								सुरक्षा नियमों की संपूर्ण मार्गदर्शिका।
							</p>
							<Button
								variant="outline"
								size="sm"
								className="w-full mt-auto text-xs font-medium border-primary/40 hover:bg-primary hover:text-primary-foreground"
								disabled={isGenerating}
							>
								{isGenerating && selectedLang === "hi" ? (
									<>
										<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
										पीडीएफ बन रहा है...
									</>
								) : (
									<>
										<Download className="mr-1.5 h-3.5 w-3.5 text-primary group-hover:text-primary-foreground" />
										हिंदी में डाउनलोड करें (PDF)
									</>
								)}
							</Button>
						</button>
					</div>
				</div>

				<div className="pt-2 text-center text-[11px] text-muted-foreground">
					Evaluna Technologies • Vidisha Road, Berasia, Bhopal, MP - 463106
				</div>
			</DialogContent>
		</Dialog>
	);
}
