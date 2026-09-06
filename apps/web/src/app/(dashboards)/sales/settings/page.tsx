"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import {
	KeyboardIcon,
	MonitorSmartphoneIcon,
	PrinterIcon,
	SaveIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useLocale } from "next-intl";

export default function SalespersonSettingsPage() {
	const locale = useLocale();

	const handleSave = () => {
		toast.success(t.saveSuccess);
	};

	const now = new Date();

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "विक्रेता सेटिंग्स (Settings)" : "Salesperson Settings",
		subtitle: locale === "hi" ? "अपनी पीओएस प्राथमिकताओं, मुद्रण विकल्पों और शॉर्टकट्स को प्रबंधित करें।" : "Manage your POS preferences, printing options, and shortcuts.",
		
		tabPos: locale === "hi" ? "पीओएस सेटिंग्स" : "POS Settings",
		tabPrinting: locale === "hi" ? "रसीद और मुद्रण" : "Receipt & Printing",
		tabShortcuts: locale === "hi" ? "शॉर्टकट्स" : "Shortcuts",
		
		posConfigTitle: locale === "hi" ? "पीओएस कॉन्फ़िगरेशन" : "POS Configuration",
		posConfigDesc: locale === "hi" ? "पीओएस इंटरफ़ेस में अपने डिफ़ॉल्ट व्यवहार को कॉन्फ़िगर करें।" : "Configure your default behaviors in the POS interface.",
		
		defPaymentLabel: locale === "hi" ? "डिफ़ॉल्ट भुगतान विधि" : "Default Payment Method",
		selectPaymentPlh: locale === "hi" ? "भुगतान विधि चुनें" : "Select payment method",
		cashDefault: locale === "hi" ? "कैश (डिफ़ॉल्ट)" : "Cash (Default)",
		upiQR: locale === "hi" ? "UPI / QR कोड" : "UPI / QR Code",
		creditCard: locale === "hi" ? "क्रेडिट/डेबिट कार्ड" : "Credit/Debit Card",
		paymentHint: locale === "hi" ? "चेकआउट के दौरान यह विधि स्वतः चुनी जाएगी।" : "This method will be auto-selected during checkout.",
		
		quickCashLabel: locale === "hi" ? "त्वरित नकद बटन" : "Quick Cash Buttons",
		quickCashHint: locale === "hi" ? "त्वरित नकद राशि बटन के लिए अल्पविराम से अलग किए गए मान (जैसे 50,100,500)।" : "Comma-separated values for quick tender buttons (e.g. 50,100,500).",
		
		soundEffectsLabel: locale === "hi" ? "ध्वनि प्रभाव सक्षम करें" : "Enable Sound Effects",
		soundEffectsHint: locale === "hi" ? "सफल स्कैन और चेकआउट पर आवाज चलाएं।" : "Play sounds on successful scan and checkout.",
		
		printingTitle: locale === "hi" ? "रसीद और प्रिंटर विकल्प" : "Receipt & Printer Options",
		printingDesc: locale === "hi" ? "प्रबंधित करें कि रसीदें कैसे उत्पन्न और मुद्रित की जाती हैं।" : "Manage how receipts are generated and printed.",
		
		autoPrintLabel: locale === "hi" ? "रसीद स्वतः प्रिंट करें" : "Auto-Print Receipt",
		autoPrintHint: locale === "hi" ? "चेकआउट के बाद स्वचालित रूप से प्रिंट संवाद ट्रिगर करें।" : "Automatically trigger print dialog after checkout.",
		
		paperSizeLabel: locale === "hi" ? "कागज का आकार (Paper Size)" : "Paper Size",
		selectPaperPlh: locale === "hi" ? "कागज का आकार चुनें" : "Select paper size",
		thermal80: locale === "hi" ? "80mm रोल (थर्मल)" : "80mm Roll (Thermal)",
		thermal58: locale === "hi" ? "58mm रोल (थर्मल)" : "58mm Roll (Thermal)",
		standardA4: locale === "hi" ? "A4 मानक आकार" : "A4 Standard",
		
		footerMsgLabel: locale === "hi" ? "रसीद के नीचे का संदेश (Footer Message)" : "Footer Message",
		footerMsgDefault: locale === "hi" ? "आपके व्यवसाय के लिए धन्यवाद! कृपया पुनः पधारें।" : "Thank you for your business! Please visit again.",
		footerMsgHint: locale === "hi" ? "मुद्रित रसीद के नीचे दिखाने के लिए पाठ।" : "Text to show at the bottom of the printed receipt.",
		
		shortcutsTitle: locale === "hi" ? "कीबोर्ड शॉर्टकट्स" : "Keyboard Shortcuts",
		shortcutsDesc: locale === "hi" ? "कीबोर्ड हॉटकीज़ का उपयोग करके अपने वर्कफ़्लो को तेज़ करें।" : "Speed up your workflow using keyboard hotkeys.",
		
		shSearch: locale === "hi" ? "उत्पाद खोजें" : "Search Product",
		shCheckout: locale === "hi" ? "चेकआउट (Checkout)" : "Checkout",
		shHold: locale === "hi" ? "बिल होल्ड करें" : "Hold Bill",
		shClear: locale === "hi" ? "कार्ट खाली करें" : "Clear Cart",
		
		saveBtn: locale === "hi" ? "सेटिंग्स सहेजें" : "Save Settings",
		saveSuccess: locale === "hi" ? "सेटिंग्स सफलतापूर्वक सहेजी गईं!" : "Settings saved successfully!",
	};

	return (
		<PageTransition className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-8">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					{t.title}
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					{t.subtitle}
				</p>
			</div>

			<Tabs defaultValue="pos" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="pos" className="flex items-center gap-2">
						<MonitorSmartphoneIcon className="h-4 w-4" />
						{t.tabPos}
					</TabsTrigger>
					<TabsTrigger value="printing" className="flex items-center gap-2">
						<PrinterIcon className="h-4 w-4" />
						{t.tabPrinting}
					</TabsTrigger>
					<TabsTrigger value="shortcuts" className="flex items-center gap-2">
						<KeyboardIcon className="h-4 w-4" />
						{t.tabShortcuts}
					</TabsTrigger>
				</TabsList>

				{/* POS Settings */}
				<TabsContent value="pos">
					<Card>
						<CardHeader>
							<CardTitle>{t.posConfigTitle}</CardTitle>
							<CardDescription>
								{t.posConfigDesc}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-3">
								<Label>{t.defPaymentLabel}</Label>
								<Select defaultValue="cash">
									<SelectTrigger className="w-[300px]">
										<SelectValue placeholder={t.selectPaperPlh} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="cash">{t.cashDefault}</SelectItem>
										<SelectItem value="upi">{t.upiQR}</SelectItem>
										<SelectItem value="card">{t.creditCard}</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									{t.paymentHint}
								</p>
							</div>

							<div className="grid gap-3">
								<Label>{t.quickCashLabel}</Label>
								<div className="flex items-center gap-2">
									<Input defaultValue="50,100,500,1000" className="w-[300px]" />
								</div>
								<p className="text-muted-foreground text-xs">
									{t.quickCashHint}
								</p>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<Label className="font-medium text-base">
										{t.soundEffectsLabel}
									</Label>
									<p className="mt-1 text-muted-foreground text-xs">
										{t.soundEffectsHint}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										defaultChecked
										className="h-4 w-4 accent-primary"
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Printing */}
				<TabsContent value="printing">
					<Card>
						<CardHeader>
							<CardTitle>{t.printingTitle}</CardTitle>
							<CardDescription>
								{t.printingDesc}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<Label className="font-medium text-base">
										{t.autoPrintLabel}
									</Label>
									<p className="mt-1 text-muted-foreground text-xs">
										{t.autoPrintHint}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										defaultChecked
										className="h-4 w-4 accent-primary"
									/>
								</div>
							</div>

							<div className="grid gap-3">
								<Label>{t.paperSizeLabel}</Label>
								<Select defaultValue="80mm">
									<SelectTrigger className="w-[300px]">
										<SelectValue placeholder={t.selectPaperPlh} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="80mm">{t.thermal80}</SelectItem>
										<SelectItem value="58mm">{t.thermal58}</SelectItem>
										<SelectItem value="A4">{t.standardA4}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-3">
								<Label>{t.footerMsgLabel}</Label>
								<Input
									defaultValue={t.footerMsgDefault}
									className="w-full max-w-md"
								/>
								<p className="text-muted-foreground text-xs">
									{t.footerMsgHint}
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Shortcuts */}
				<TabsContent value="shortcuts">
					<Card>
						<CardHeader>
							<CardTitle>{t.shortcutsTitle}</CardTitle>
							<CardDescription>
								{t.shortcutsDesc}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">{t.shSearch}</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										F2
									</kbd>
								</div>
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">{t.shCheckout}</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										F9
									</kbd>
								</div>
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">{t.shHold}</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										F8
									</kbd>
								</div>
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">{t.shClear}</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										Esc
									</kbd>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<div className="mt-2 flex justify-end">
				<Button onClick={handleSave} className="gap-2">
					<SaveIcon className="h-4 w-4" />
					{t.saveBtn}
				</Button>
			</div>
		</PageTransition>
	);
}
