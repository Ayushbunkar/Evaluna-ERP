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
	Play,
	Pause,
	Volume2,
	VolumeX,
	Maximize2,
	Video,
	Languages,
	CheckCircle2,
	Sparkles,
	Clock,
	Layers,
	ShieldCheck,
} from "lucide-react";

interface VideoTutorialModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function VideoTutorialModal({ isOpen, onClose }: VideoTutorialModalProps) {
	const [activeTrack, setActiveTrack] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(true);
	const [isMuted, setIsMuted] = useState<boolean>(false);
	const [videoLanguage, setVideoLanguage] = useState<"en" | "hi">("en");

	const tutorials = [
		{
			id: "system-tour",
			title: {
				en: "Evaluna ERP Platform Tour & Architecture",
				hi: "इवालूना ईआरपी संपूर्ण प्लेटफॉर्म टूर एवं आर्किटेक्चर",
			},
			duration: "5:32",
			badge: "Architecture & Modules",
			description: {
				en: "Interactive overview of multi-warehouse inventory, offline sync, real-time POS cash counters, and financial ledger settlement.",
				hi: "मल्टी-वेयरहाउस इन्वेंटरी, ऑफलाइन सिंक, रीयल-टाइम पीओएस कैश काउंटर और वित्तीय लेजर सेटलमेंट का वीडियो वॉकथ्रू।",
			},
			highlights: {
				en: [
					"High-throughput offline POS checkout with barcode scanning",
					"Automatic SQLite to Cloud sync upon reconnection",
					"Audit-proof immutable general ledger with dual approval",
				],
				hi: [
					"बारकोड स्कैनिंग के साथ हाई-स्पीड ऑफलाइन पीओएस चेकआउट",
					"नेटवर्क पुनः जुड़ने पर ऑटोमैटिक बैकग्राउंड डेटा सिंक",
					"दोहरे अनुमोदन वाला सुरक्षित एवं अपरिवर्तनीय बहीखाता",
				],
			},
		},
		{
			id: "dashboard-setup",
			title: {
				en: "Operator Dashboard Setup & Terminal Config",
				hi: "ऑपरेटर डैशबोर्ड सेटअप एवं टर्मिनल कॉन्फ़िगरेशन",
			},
			duration: "4:18",
			badge: "Quick Onboarding",
			description: {
				en: "First-time sign-in, configuring ESC/POS thermal printers, setting up cash drawer float, and initializing barcode scanners.",
				hi: "प्रथम लॉगिन, थर्मल प्रिंटर सेटअप, शुरुआती नकद दराज राशि प्रविष्टि और 2D बारकोड स्कैनर चालू करने की विधि।",
			},
			highlights: {
				en: [
					"Connecting 2-inch and 3-inch thermal bill printers",
					"Setting shift opening cash drawer float balances",
					"Role-based privilege boundaries (Admin, Cashier, Warehouse)",
				],
				hi: [
					"2-इंच और 3-इंच थर्मल प्रिंटर को सिस्टम से जोड़ना",
					"शिफ्ट शुरुआत पर नकद फ्लोट राशि दर्ज करना",
					"भूमिका आधारित अधिकार (एडमिन, कैशियर, वेयरहाउस)",
				],
			},
		},
		{
			id: "basic-workflows",
			title: {
				en: "Daily Operations & Shift Handover",
				hi: "दैनिक कार्यप्रवाह एवं शिफ्ट हैंडओवर (SOP)",
			},
			duration: "6:45",
			badge: "Daily SOP",
			description: {
				en: "Step-by-step walk-through of store opening checklists, processing split payments (UPI + Cash), and generating end-of-day reports.",
				hi: "दुकान खोलने की चेकलिस्ट, मिश्रित भुगतान (यूपीआई + नकद) और दिन के अंत की रसीद निकालने की संपूर्ण विधि।",
			},
			highlights: {
				en: [
					"Instant split payment entry and customer WhatsApp receipt",
					"FEFO batch selection for perishable warehouse inventory",
					"Shift settlement printout with dual cashier signature",
				],
				hi: [
					"विभाजित भुगतान (नकद + यूपीआई) और व्हाट्सएप बिल भेजना",
					"समाप्ति तिथि (FEFO) के आधार पर बैच चयन प्रक्रिया",
					"दैनिक शिफ्ट समापन रिपोर्ट और नकद मिलान सत्यापन",
				],
			},
		},
		{
			id: "reporting-tools",
			title: {
				en: "Financial Ledgers & Tax Reports",
				hi: "वित्तीय बहीखाता एवं जीएसटी टैक्स रिपोर्ट",
			},
			duration: "7:22",
			badge: "Finance & Tax",
			description: {
				en: "Generating GSTR-1 sales registers, accounts receivable aging slabs, profit & loss statements, and export formats.",
				hi: "जीएसटीआर-1 बिक्री रजिस्टर, देनदारी रिपोर्ट, लाभ-हानि खाता और एक्सेल/पीडीएफ निर्यात करने की जानकारी।",
			},
			highlights: {
				en: [
					"Automated CGST, SGST & IGST tax breakdown calculations",
					"Customer credit aging analysis and payment reminder alerts",
					"Tamper-proof financial statement export in Excel and PDF",
				],
				hi: [
					"स्वचालित सीजीएसटी, एसजीएसटी व आईजीएसटी टैक्स गणना",
					"ग्राहक उधारी समय-सीमा रिपोर्ट और भुगतान स्मरण अलर्ट",
					"एक्सेल एवं पीडीएफ में वित्तीय रिपोर्ट का सुरक्षित निर्यात",
				],
			},
		},
	];

	const active = tutorials[activeTrack] ?? tutorials[0];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl p-0 overflow-hidden border-border/80 bg-background text-foreground shadow-2xl">
				{/* Header */}
				<div className="p-6 border-b border-border/60 bg-card/60 flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Video className="h-5 w-5" />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold text-foreground">
								Evaluna ERP Interactive Video Walkthrough
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground mt-0.5">
								Bilingual interactive simulator with step-by-step audio-visual walkthroughs
							</DialogDescription>
						</div>
					</div>

					{/* Language Selector */}
					<div className="flex items-center bg-muted/60 rounded-lg p-1 border border-border/70 text-xs">
						<button
							type="button"
							onClick={() => setVideoLanguage("en")}
							className={`px-2.5 py-1 rounded-md font-medium transition-all ${
								videoLanguage === "en"
									? "bg-primary text-primary-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							English
						</button>
						<button
							type="button"
							onClick={() => setVideoLanguage("hi")}
							className={`px-2.5 py-1 rounded-md font-medium transition-all ${
								videoLanguage === "hi"
									? "bg-primary text-primary-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							हिंदी
						</button>
					</div>
				</div>

				{/* Video Player Canvas / Simulation Frame */}
				<div className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between p-6 sm:p-8 overflow-hidden select-none">
					{/* Ambient screen glows */}
					<div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-500/10 pointer-events-none" />
					<div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

					{/* Top Overlay Badge */}
					<div className="relative z-10 flex items-center justify-between">
						<span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-mono text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
							<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
							{isPlaying ? "SIMULATOR ACTIVE • 1080p 60FPS" : "PAUSED"}
						</span>
						<span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
							{active?.duration}
						</span>
					</div>

					{/* Center Cinematic Display */}
					<div className="relative z-10 my-auto text-center max-w-2xl mx-auto space-y-3">
						<div className="inline-block rounded-md bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary uppercase tracking-wider border border-primary/30">
							{active?.badge}
						</div>
						<h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
							{videoLanguage === "hi" ? active?.title.hi : active?.title.en}
						</h3>
						<p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
							{videoLanguage === "hi" ? active?.description.hi : active?.description.en}
						</p>

						{/* Mock Dashboard Wireframe Graphic */}
						<div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
							<span className="flex items-center gap-1">
								<Layers className="h-3.5 w-3.5 text-primary" /> Central Hub
							</span>
							<span className="flex items-center gap-1">
								<ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Offline Synced
							</span>
							<span className="flex items-center gap-1">
								<Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Bilingual Audio
							</span>
						</div>
					</div>

					{/* Bottom Playback Controls Bar */}
					<div className="relative z-10 flex items-center justify-between rounded-xl bg-slate-900/90 p-3 border border-slate-800 backdrop-blur-md">
						<div className="flex items-center space-x-3">
							<button
								type="button"
								onClick={() => setIsPlaying(!isPlaying)}
								className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
							>
								{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
							</button>

							<button
								type="button"
								onClick={() => setIsMuted(!isMuted)}
								className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
							>
								{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
							</button>

							<div className="hidden sm:block text-xs font-mono text-slate-400">
								<span>02:14</span> / <span>{active?.duration}</span>
							</div>
						</div>

						{/* Timeline Progress Bar */}
						<div className="flex-1 mx-4">
							<div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer">
								<div className="h-full bg-primary rounded-full w-2/5 relative">
									<div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-md" />
								</div>
							</div>
						</div>

						<div className="flex items-center space-x-2 text-xs text-slate-400">
							<span className="hidden sm:inline font-mono">CC: {videoLanguage.toUpperCase()}</span>
							<button
								type="button"
								onClick={() => alert("Full screen simulator mode active.")}
								className="p-1 hover:text-white"
								title="Fullscreen"
							>
								<Maximize2 className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>

				{/* Playlist Tabs Underneath Video */}
				<div className="p-6 bg-card/40 border-t border-border/70 space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
							Tutorial Playlist ({tutorials.length} Modules)
						</h4>
						<span className="text-xs text-muted-foreground">
							Select a lesson to switch walkthrough
						</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						{tutorials.map((t, idx) => (
							<button
								key={t.id}
								type="button"
								onClick={() => setActiveTrack(idx)}
								className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
									activeTrack === idx
										? "border-primary bg-primary/10 shadow-xs"
										: "border-border/70 bg-background/50 hover:border-primary/40 hover:bg-muted/30"
								}`}
							>
								<div className="flex items-center justify-between w-full mb-1">
									<span className="text-[10px] font-mono text-primary font-semibold">
										EP {idx + 1}
									</span>
									<span className="text-[10px] text-muted-foreground flex items-center gap-1">
										<Clock className="h-3 w-3" /> {t.duration}
									</span>
								</div>
								<span className="font-semibold text-xs text-foreground line-clamp-1">
									{videoLanguage === "hi" ? t.title.hi : t.title.en}
								</span>
								<p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
									{t.badge}
								</p>
							</button>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
