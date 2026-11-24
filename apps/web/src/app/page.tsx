"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	Award,
	CheckCircle2,
	ChevronRight,
	Clock,
	Coffee,
	Droplets,
	FileCheck,
	FileText,
	Headphones,
	Layers,
	MapPin,
	MessageCircle,
	Package,
	Percent,
	Phone,
	Repeat,
	ShieldCheck,
	ShoppingBag,
	Sparkles,
	Star,
	Store,
	Truck,
	UserCheck,
	Wheat,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";

// ── Direct B2B Wholesale Contact & WhatsApp Support ──
const CONTACT_PHONE = "+91 96306 49277";
const CONTACT_TEL_HREF = "tel:+919630649277";
const WHATSAPP_NUMBER = "919630649277";
const WHATSAPP_INQUIRY_TEXT =
	"Namaste Evaluna Team,\n\nMujhe wholesale grocery supply / order ke bare mein jankari chahiye.\n\n• Shop / Business Name: \n• Location / City: \n• Products Needed: \n• My Query: \n\nKripya wholesale rate card aur order process share karein.";
const WHATSAPP_INQUIRY_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_INQUIRY_TEXT)}`;

// ── Core Categories Data ──
const CATEGORIES = [
	{
		id: "staples-grains",
		title: "Staples & Grains",
		hindiTitle: "अनाज, दालें और बुनियादी राशन",
		description:
			"Atta, chawal (Basmati & Daily rice), toor/moong/chana daal, besan, poha, sugar, namak, aur maida.",
		badge: "High Velocity Sourcing",
		items: ["Chakki Fresh Atta", "Premium Basmati", "Toor & Moong Daal", "Sugar & Besan"],
		icon: Wheat,
		accent: "from-amber-500/20 to-orange-500/10",
		border: "hover:border-amber-500/40",
		link: "/customer/products?category=staples",
	},
	{
		id: "edible-oils-ghee",
		title: "Edible Oils & Ghee",
		hindiTitle: "खाद्य तेल, वनस्पति और शुद्ध घी",
		description:
			"Mustard oil (Kachhi Ghani), refined soyabean oil, sunflower oil, vanaspati, aur Shuddh Deshi Ghee (1L, 5L, 15L tins/pouches).",
		badge: "Direct Refinery Tie-Ups",
		items: ["Mustard Oil 15L", "Soyabean Oil 1L Pouch", "Sunflower Oil", "Pure Cow & Buffalo Ghee"],
		icon: Droplets,
		accent: "from-yellow-500/20 to-amber-500/10",
		border: "hover:border-yellow-500/40",
		link: "/customer/products?category=oils",
	},
	{
		id: "packaged-foods-snacks",
		title: "Packaged Foods & Snacks",
		hindiTitle: "पैकेज्ड फूड्स, बिस्कुट और चाय-नाश्ता",
		description:
			"Top brand biscuits, namkeen packets, instant noodles, tomato ketchup, sauces, CTC premium tea, aur coffee.",
		badge: "100% Genuine Brands",
		items: ["Parle & Britannia Biscuits", "Namkeen & Bhujia", "Noodles & Pasta", "Premium Chai Patti"],
		icon: Coffee,
		accent: "from-rose-500/20 to-red-500/10",
		border: "hover:border-rose-500/40",
		link: "/customer/products?category=packaged",
	},
	{
		id: "fmcg-daily-needs",
		title: "FMCG & Daily Needs",
		hindiTitle: "दैनिक उपयोग, साबुन और क्लीनिंग",
		description:
			"Bathing soaps, detergent powders, bars, shampoo sachets/bottles, toothpaste, floor cleaners, aur dishwash supplies.",
		badge: "HUL, P&G, Godrej Sourcing",
		items: ["Detergent Powder 1kg/5kg", "Bathing Soaps Pack", "Toothpaste & Brushes", "Floor & Glass Cleaners"],
		icon: Sparkles,
		accent: "from-blue-500/20 to-cyan-500/10",
		border: "hover:border-blue-500/40",
		link: "/customer/products?category=fmcg",
	},
	{
		id: "beverages",
		title: "Beverages & Soft Drinks",
		hindiTitle: "कोल्ड ड्रिंक्स, जूस और मिनरल वाटर",
		description:
			"Soft drinks, canned soda, packaged fruit juices, energy drinks, aur packaged drinking water crates (250ml to 2L).",
		badge: "Chilled Ready Supply",
		items: ["Cold Drinks Crates", "Mango & Mixed Juices", "Energy Drinks", "Packaged Mineral Water"],
		icon: Package,
		accent: "from-emerald-500/20 to-teal-500/10",
		border: "hover:border-emerald-500/40",
		link: "/customer/products?category=beverages",
	},
];

// ── Why Choose Evaluna USPs ──
const USPs = [
	{
		icon: Percent,
		title: "Competitive Wholesale Pricing",
		hindi: "सर्वश्रेष्ठ थोक भाव व अधिकतम मार्जिन",
		description:
			"Direct mill aur authorized brand manufacturers se bulk volume sourcing hone ki wajah se aapko milte hain market se behtar wholesale rates, jisse aapka retail profit margin 12% se 20% tak badhta hai.",
	},
	{
		icon: Layers,
		title: "Bulk Schemes & Quantity Slabs",
		hindi: "अतिरिक्त डिस्काउंट और बल्क स्कीम्स",
		description:
			"Zyada quantity order karne par seedha extra discount slabs aur company freebies milte hain. Har invoice par clear slab pricing milti hai bina kisi hidden charges ke.",
	},
	{
		icon: ShieldCheck,
		title: "100% Genuine Products (FEFO)",
		hindi: "असली प्रोडक्ट्स और एक्सपायरी ट्रैकिंग",
		description:
			"Zero duplicates. Hamara central warehouse automated First-Expired-First-Out (FEFO) rules aur batch tracking use karta hai taaki aapko hamesha fresh manufacturing date ka genuine stock mile.",
	},
	{
		icon: Truck,
		title: "Reliable & Timely Doorstep Delivery",
		hindi: "समय पर सुरक्षित डिलीवरी आपके काउंटर पर",
		description:
			"Bhopal, Berasia aur aas-paas ke retail corridors ke liye scheduled delivery vans. Safe handling, live order status, aur transit damage protection guarantee.",
	},
	{
		icon: Repeat,
		title: "Easy 1-Click Reordering",
		hindi: "1-क्लिक में आसान री-ऑर्डरिंग",
		description:
			"Roz-marra ke kirana kaam ko asaan banane ke liye hamare web aur mobile app par single-click reorder option hai. Pichle diye gaye order ko 10 second me repeat karein.",
	},
];

// ── How It Works Steps ──
const STEPS = [
	{
		step: "01",
		title: "Sign Up & Verify",
		hindi: "अकाउंट बनाएं और विवरण भरें",
		description:
			"Apna mobile number, shop / business name, aur address daalein. GSTIN ya business license details (agar applicable ho) daalkar business account activate karein.",
	},
	{
		step: "02",
		title: "Browse & Add to Cart",
		hindi: "थोक भाव व कार्ट में सामान जोड़ें",
		description:
			"Category ya brand ke hisaab se live wholesale rates aur minimum order quantity (MOQ) check karein. Bulk slabs par automatically discount apply hota hai.",
	},
	{
		step: "03",
		title: "Place Order & Pay",
		hindi: "आसान भुगतान व ऑर्डर कन्फर्मेशन",
		description:
			"UPI, Net Banking, NEFT/RTGS, ya pre-approved retailer credit terms ke zariye order confirm karein. Instant digital GST bill turant generate hota hai.",
	},
	{
		step: "04",
		title: "Doorstep Delivery",
		hindi: "दुकान तक सुरक्षित व समय पर डिलीवरी",
		description:
			"Samaan seedha aapki dukaan, store ya warehouse ke counter par hamari logistics team dwara safely deliver kiya jata hai.",
	},
];

// ── Testimonials ──
const REVIEWS = [
	{
		name: "Mukesh Sharma",
		role: "Proprietor",
		store: "Sharma Kirana Store, Berasia",
		quote:
			"Evaluna se judne ke baad daal, atta aur edible oil par hamara wholesale margin 12% tak badh gaya hai. Pehle Bhopal mandi jana padta tha, ab time par dukaan par hi delivery aa jaati hai.",
		rating: 5,
	},
	{
		name: "Rajesh Patidar",
		role: "Store Manager",
		store: "Patidar Supermarket, Kolar Road, Bhopal",
		quote:
			"GST invoice har order ke sath bina kisi delay ke milta hai jisse tax filing me aasaani hoti hai. Sabhi products fresh batch ke hote hain aur customer complaints zero ho gayi hain.",
		rating: 5,
	},
	{
		name: "Anand Agarwal",
		role: "Head of Procurement",
		store: "Agarwal Bakers & HoReCa Cafe, MP Nagar",
		quote:
			"Commercial kitchen ke liye bulk edible oil tins aur maida ki supply hamesha time par milti hai. Ek click re-order feature se hamara daily ordering ka bahut samay bachta hai.",
		rating: 5,
	},
];

export default function HomePage() {
	const [activeFaq, setActiveFaq] = useState<number | null>(null);

	return (
		<div
			suppressHydrationWarning
			className="min-h-screen w-full overflow-x-clip bg-[#F7F7F4] font-sans text-[#111111] transition-colors duration-500 selection:bg-[#111111] selection:text-[#F7F7F4] dark:bg-[#080808] dark:text-[#F5F5F2] dark:selection:bg-[#F5F5F2] dark:selection:text-[#080808]"
		>
			{/* Top Synchronized Header */}
			<PublicHeader />

			{/* ══════════════════════════════════════════════════════════════
			    SECTION 1 — HERO SECTION
			══════════════════════════════════════════════════════════════ */}
			<section className="relative overflow-hidden border-[#DEDEDA] border-b pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 dark:border-[#292929]">
				<div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
					<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
						{/* Left Column: Core Value Proposition */}
						<div className="space-y-6 sm:space-y-8 lg:col-span-7">
							{/* Trust Badge Pill */}
							<motion.div
								initial={{ opacity: 0, y: 15 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
								className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 rounded-full border border-[#DEDEDA] bg-[#EFEFEA]/80 px-3 py-1.5 font-mono text-[10px] sm:text-[11px] text-[#444444] tracking-wide whitespace-nowrap dark:border-[#292929] dark:bg-[#141414] dark:text-[#A3A3A0]"
							>
								<span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
								<span className="font-semibold whitespace-nowrap text-[#111111] dark:text-[#F5F5F2]">
									B2B Wholesale Supply
								</span>
								<span className="hidden sm:inline">•</span>
								<span className="hidden sm:inline whitespace-nowrap">Bhopal & Berasia Hub</span>
								<span>•</span>
								<a
									href={WHATSAPP_INQUIRY_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="flex shrink-0 items-center gap-1 font-semibold whitespace-nowrap text-emerald-600 hover:underline dark:text-emerald-400"
									title={`Inquire on WhatsApp: ${CONTACT_PHONE}`}
								>
									<MessageCircle className="h-3 w-3 shrink-0" />
									<span className="whitespace-nowrap">{CONTACT_PHONE}</span>
								</a>
							</motion.div>

							{/* Main Heading */}
							<motion.h1
								initial={{ opacity: 0, y: 25 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.1 }}
								className="font-serif text-3xl font-normal leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-6xl dark:text-[#F5F5F2]"
							>
								Evaluna Pvt Ltd —{" "}
								<span className="font-light italic">
									Smart Wholesale Grocery Supply
								</span>{" "}
								for Your Business
							</motion.h1>

							{/* Sub-heading */}
							<motion.p
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="max-w-2xl text-base text-[#555555] leading-relaxed sm:text-lg lg:text-xl dark:text-[#B0B0AC]"
							>
								Kirana stores, supermarkets, aur HoReCa ke liye best wholesale
								rates, genuine brands, aur time-par delivery. Direct mill
								sourcing aur bulk schemes ke sath apna munafa badhayein.
							</motion.p>

							{/* Call-to-Action (CTA) Buttons */}
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.3 }}
								className="flex flex-col items-stretch gap-3.5 pt-2 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap"
							>
								{/* Primary Action: Order Now / Browse Catalog */}
								<Link
									href="/customer/products"
									className="group inline-flex items-center justify-center space-x-2.5 bg-[#111111] px-6 py-3.5 font-mono text-xs uppercase text-[#F7F7F4] tracking-wider transition-all duration-200 hover:bg-[#252525] hover:shadow-lg active:scale-95 dark:bg-[#F5F5F2] dark:text-[#080808] dark:hover:bg-white"
								>
									<ShoppingBag className="h-4 w-4" />
									<span className="font-semibold">Order Now / Browse Catalog</span>
									<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
								</Link>

								{/* Secondary Action: Register as Retailer / Partner */}
								<Link
									href="/signup"
									className="group inline-flex items-center justify-center space-x-2 border border-[#DEDEDA] bg-white/70 px-6 py-3.5 font-mono text-xs uppercase text-[#111111] tracking-wider transition-all hover:border-[#111111] hover:bg-white active:scale-95 dark:border-[#292929] dark:bg-[#111111] dark:text-[#F5F5F2] dark:hover:border-[#F5F5F2]"
									title="Sign up with GST and Business details"
								>
									<Store className="h-4 w-4" />
									<span>Register as Retailer</span>
								</Link>

								{/* Direct WhatsApp Inquiry CTA */}
								<a
									href={WHATSAPP_INQUIRY_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="group inline-flex items-center justify-center space-x-2 border border-emerald-600/40 bg-emerald-500/10 px-5 py-3.5 font-mono text-xs uppercase text-emerald-700 tracking-wider transition-all hover:bg-emerald-600 hover:text-white active:scale-95 dark:border-emerald-500/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
									title={`Inquire on WhatsApp (${CONTACT_PHONE})`}
								>
									<MessageCircle className="h-4 w-4 text-emerald-600 group-hover:text-white dark:text-emerald-400" />
									<span>WhatsApp Inquiry</span>
								</a>

								{/* PWA Install Button (with smooth bounce-up entrance) */}
								<PwaInstallButton />
							</motion.div>

							{/* Key Metrics / Highlights Strip */}
							<div className="grid grid-cols-2 gap-4 border-t border-[#DEDEDA] pt-6 sm:grid-cols-4 dark:border-[#292929]">
								<div>
									<p className="font-serif text-2xl font-semibold text-[#111111] dark:text-[#F5F5F2]">
										100%
									</p>
									<p className="font-mono text-[11px] text-[#666666] uppercase tracking-wider dark:text-[#A3A3A0]">
										GST Invoice & ITC
									</p>
								</div>
								<div>
									<p className="font-serif text-2xl font-semibold text-[#111111] dark:text-[#F5F5F2]">
										500+
									</p>
									<p className="font-mono text-[11px] text-[#666666] uppercase tracking-wider dark:text-[#A3A3A0]">
										Daily FMCG SKUs
									</p>
								</div>
								<div>
									<p className="font-serif text-2xl font-semibold text-[#111111] dark:text-[#F5F5F2]">
										Fixed
									</p>
									<p className="font-mono text-[11px] text-[#666666] uppercase tracking-wider dark:text-[#A3A3A0]">
										Morning Delivery
									</p>
								</div>
								<div>
									<p className="font-serif text-2xl font-semibold text-[#111111] dark:text-[#F5F5F2]">
										FEFO
									</p>
									<p className="font-mono text-[11px] text-[#666666] uppercase tracking-wider dark:text-[#A3A3A0]">
										Fresh Batch Expiry
									</p>
								</div>
							</div>
						</div>

						{/* Right Column: Hero Visual Showcase */}
						<div className="relative lg:col-span-5">
							<div className="relative overflow-hidden rounded-2xl border border-[#DEDEDA] bg-[#EFEFEA] p-6 shadow-xl dark:border-[#292929] dark:bg-[#101010]">
								{/* Accent Badge */}
								<div className="mb-5 flex items-center justify-between border-b border-[#DEDEDA] pb-4 dark:border-[#292929]">
									<div className="flex items-center space-x-2">
										<Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
										<span className="font-mono text-xs font-semibold uppercase tracking-wider">
											Evaluna B2B Portal
										</span>
									</div>
									<span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
										LIVE STOCK
									</span>
								</div>

								{/* Order Snapshot Cards */}
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-xl border border-[#DEDEDA] bg-white p-3.5 shadow-sm dark:border-[#292929] dark:bg-[#161616]">
										<div className="flex items-center space-x-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
												<Wheat className="h-5 w-5" />
											</div>
											<div>
												<p className="font-medium text-sm">Chakki Fresh Atta 50kg</p>
												<p className="text-xs text-[#666666] dark:text-[#A3A3A0]">
													Wholesale Tier-1 Slabs
												</p>
											</div>
										</div>
										<span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
											In Stock
										</span>
									</div>

									<div className="flex items-center justify-between rounded-xl border border-[#DEDEDA] bg-white p-3.5 shadow-sm dark:border-[#292929] dark:bg-[#161616]">
										<div className="flex items-center space-x-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
												<Droplets className="h-5 w-5" />
											</div>
											<div>
												<p className="font-medium text-sm">Mustard Oil Tin 15L</p>
												<p className="text-xs text-[#666666] dark:text-[#A3A3A0]">
													Kachhi Ghani Refinery Pack
												</p>
											</div>
										</div>
										<span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
											Best Rate
										</span>
									</div>

									<div className="flex items-center justify-between rounded-xl border border-[#DEDEDA] bg-white p-3.5 shadow-sm dark:border-[#292929] dark:bg-[#161616]">
										<div className="flex items-center space-x-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
												<Sparkles className="h-5 w-5" />
											</div>
											<div>
												<p className="font-medium text-sm">Detergent & Soap Master Case</p>
												<p className="text-xs text-[#666666] dark:text-[#A3A3A0]">
													Genuine FMCG Brand Lot
												</p>
											</div>
										</div>
										<span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
											Scheme Active
										</span>
									</div>
								</div>

								{/* Bottom Dispatch Confirmation Bar */}
								<div className="mt-5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-3 text-center">
									<p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
										⚡ Next Morning Guaranteed Delivery Available in Bhopal & Berasia
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION 2 — CORE CATEGORIES (मुख्य सामान की लिस्ट)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="categories"
				className="border-b border-[#DEDEDA] py-16 sm:py-24 dark:border-[#292929]"
			>
				<div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
					{/* Section Header */}
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
						<div className="space-y-2">
							<span className="font-mono text-xs uppercase tracking-widest text-[#666666] dark:text-[#A3A3A0]">
								Catalog Spectrum • 02
							</span>
							<h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl lg:text-5xl">
								Core Categories (मुख्य सामान की लिस्ट)
							</h2>
							<p className="max-w-xl text-sm text-[#555555] sm:text-base dark:text-[#A3A3A0]">
								Retailers ko aasani se apna kaam ka samaan mil sake, isliye
								sabse zaroori categories wholesale rates aur bulk packing ke sath
								available hain.
							</p>
						</div>

						<Link
							href="/customer/products"
							className="inline-flex items-center space-x-2 font-mono text-xs uppercase tracking-wider text-[#111111] hover:underline dark:text-[#F5F5F2]"
						>
							<span>View Complete Wholesale Catalog</span>
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					{/* Category Cards Grid */}
					<div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{CATEGORIES.map((cat) => {
							const IconComponent = cat.icon;
							return (
								<div
									key={cat.id}
									className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#DEDEDA] bg-white p-6 transition-all duration-300 hover:shadow-lg dark:border-[#292929] dark:bg-[#0E0E0E] ${cat.border}`}
								>
									{/* Top Bar with Icon & Tag */}
									<div>
										<div className="flex items-center justify-between">
											<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br p-2.5 shadow-xs transition-transform duration-300 group-hover:scale-105">
												<IconComponent className="h-6 w-6 text-[#111111] dark:text-[#F5F5F2]" />
											</div>
											<span className="rounded-full border border-[#DEDEDA] bg-[#F7F7F4] px-2.5 py-1 font-mono text-[10px] text-[#666666] uppercase tracking-wider dark:border-[#292929] dark:bg-[#161616] dark:text-[#A3A3A0]">
												{cat.badge}
											</span>
										</div>

										{/* Titles */}
										<div className="mt-5 space-y-1">
											<h3 className="font-serif text-xl font-medium tracking-tight">
												{cat.title}
											</h3>
											<p className="font-sans text-xs font-semibold text-[#888888] dark:text-[#888888]">
												{cat.hindiTitle}
											</p>
										</div>

										{/* Description */}
										<p className="mt-3 text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
											{cat.description}
										</p>

										{/* Popular Item Pills */}
										<div className="mt-5 flex flex-wrap gap-1.5">
											{cat.items.map((item, idx) => (
												<span
													key={idx}
													className="rounded-md bg-[#F0F0EC] px-2 py-0.5 font-sans text-[11px] text-[#444444] dark:bg-[#1C1C1C] dark:text-[#CCCCCC]"
												>
													{item}
												</span>
											))}
										</div>
									</div>

									{/* Action Link */}
									<div className="mt-6 border-t border-[#EDEDEA] pt-4 dark:border-[#222222]">
										<Link
											href={cat.link}
											className="inline-flex w-full items-center justify-between font-mono text-xs uppercase tracking-wider text-[#111111] transition-colors group-hover:text-emerald-600 dark:text-[#F5F5F2] dark:group-hover:text-emerald-400"
										>
											<span>Browse Category Rates</span>
											<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
										</Link>
									</div>
								</div>
							);
						})}

						{/* Custom Bulk Ordering Card */}
						<div className="flex flex-col justify-between rounded-2xl border border-dashed border-[#111111]/30 bg-[#111111] p-6 text-[#F7F7F4] dark:border-[#F5F5F2]/30 dark:bg-[#141414]">
							<div>
								<span className="font-mono text-[10px] uppercase tracking-widest text-[#888888]">
									Custom Procurement
								</span>
								<h3 className="mt-2 font-serif text-2xl font-medium">
									Require Special Bulk Order?
								</h3>
								<p className="mt-2 text-xs leading-relaxed text-[#B0B0AC]">
									Supermarkets, institutional buyers, aur HoReCa ke liye bulk truckload
									discounts, direct mill contracts, aur customized packaging available hai.
								</p>
							</div>

							<div className="mt-6">
								<Link
									href="/contact"
									className="inline-flex w-full items-center justify-center space-x-2 rounded-lg bg-white px-4 py-3 font-mono text-xs uppercase tracking-wider text-[#111111] transition-transform hover:scale-[1.02] dark:bg-[#F5F5F2]"
								>
									<span>Contact Bulk Sales Desk</span>
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION 3 — WHY CHOOSE EVALUNA PVT LTD? (USPs)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="why-choose"
				className="border-b border-[#DEDEDA] bg-[#EFEFEA]/50 py-16 sm:py-24 dark:border-[#292929] dark:bg-[#0B0B0B]"
			>
				<div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
					<div className="text-center max-w-3xl mx-auto space-y-3">
						<span className="font-mono text-xs uppercase tracking-widest text-[#666666] dark:text-[#A3A3A0]">
							Core Advantages • 03
						</span>
						<h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl lg:text-5xl">
							Why Choose Evaluna Pvt Ltd?
						</h2>
						<p className="text-sm text-[#555555] sm:text-base dark:text-[#A3A3A0]">
							Traditional wholesale mandiyon ke chakkar aur unorganized supply ki
							pareshaniyon ko khatam karke Evaluna deta hai technology-driven B2B
							wholesale grocery experience.
						</p>
					</div>

					<div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{USPs.map((usp, idx) => {
							const IconComponent = usp.icon;
							return (
								<div
									key={idx}
									className="flex flex-col justify-between rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-xs transition-all hover:shadow-md dark:border-[#292929] dark:bg-[#111111]"
								>
									<div className="space-y-4">
										<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111111] text-[#F7F7F4] dark:bg-[#F5F5F2] dark:text-[#080808]">
											<IconComponent className="h-6 w-6" />
										</div>
										<div>
											<h3 className="font-serif text-xl font-medium tracking-tight">
												{usp.title}
											</h3>
											<p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
												{usp.hindi}
											</p>
										</div>
										<p className="text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
											{usp.description}
										</p>
									</div>

									<div className="mt-6 flex items-center gap-1.5 text-[11px] font-mono text-[#777777] dark:text-[#888888]">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
										<span>Standard on every order</span>
									</div>
								</div>
							);
						})}

						{/* Highlighted Assurance Banner Card */}
						<div className="flex flex-col justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 dark:bg-emerald-950/20">
							<div className="space-y-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
									<Award className="h-6 w-6" />
								</div>
								<h3 className="font-serif text-xl font-medium text-emerald-900 dark:text-emerald-200">
									Zero Counterfeit & Transparency
								</h3>
								<p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
									Har product par authentic packaging, valid barcode, aur legal
									tax invoice. Koi duplicate ya near-expiry product deliver nahi
									hota.
								</p>
							</div>

							<div className="mt-6 pt-4 border-t border-emerald-500/30">
								<Link
									href="/signup"
									className="inline-flex items-center space-x-1.5 font-mono text-xs uppercase font-bold text-emerald-700 hover:underline dark:text-emerald-300"
								>
									<span>Join Retailer Network</span>
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION 4 — HOW IT WORKS (4 Simple Steps)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="how-it-works"
				className="border-b border-[#DEDEDA] py-16 sm:py-24 dark:border-[#292929]"
			>
				<div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
					<div className="text-center max-w-2xl mx-auto space-y-3">
						<span className="font-mono text-xs uppercase tracking-widest text-[#666666] dark:text-[#A3A3A0]">
							Order Lifecycle • 04
						</span>
						<h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl lg:text-5xl">
							How It Works
						</h2>
						<p className="text-sm text-[#555555] sm:text-base dark:text-[#A3A3A0]">
							Sirf 4 aasaan kadmon mein apni dukaan ke liye wholesale grocery order
							karein aur safe doorstep delivery paayein.
						</p>
					</div>

					<div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{STEPS.map((step, idx) => (
							<div
								key={idx}
								className="relative flex flex-col justify-between rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-xs dark:border-[#292929] dark:bg-[#101010]"
							>
								<div>
									{/* Step Number Tag */}
									<div className="flex items-center justify-between">
										<span className="font-mono text-3xl font-bold text-[#CCCCCC] dark:text-[#333333]">
											{step.step}
										</span>
										<span className="h-2 w-2 rounded-full bg-emerald-500" />
									</div>

									<h3 className="mt-4 font-serif text-xl font-medium tracking-tight">
										{step.title}
									</h3>
									<p className="mt-1 text-xs font-semibold text-[#777777] dark:text-[#999999]">
										{step.hindi}
									</p>

									<p className="mt-3 text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
										{step.description}
									</p>
								</div>

								<div className="mt-6 border-t border-[#EDEDEA] pt-3 text-[11px] font-mono text-[#888888] dark:border-[#222222]">
									Step {idx + 1} of 4
								</div>
							</div>
						))}
					</div>

					{/* Step Action Banner */}
					<div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#DEDEDA] bg-[#EFEFEA] p-6 sm:flex-row sm:px-8 dark:border-[#292929] dark:bg-[#121212]">
						<div>
							<h4 className="font-serif text-lg font-medium">
								Ready to order wholesale grocery for your shop?
							</h4>
							<p className="text-xs text-[#666666] dark:text-[#A3A3A0]">
								Sign-up takes under 2 minutes. Start ordering with live stock availability.
							</p>
						</div>
						<div className="flex items-center space-x-3">
							<Link
								href="/signup"
								className="inline-flex items-center space-x-2 bg-[#111111] px-5 py-2.5 font-mono text-xs uppercase text-[#F7F7F4] hover:bg-[#252525] dark:bg-[#F5F5F2] dark:text-[#080808]"
							>
								<span>Start Sign Up</span>
								<ArrowRight className="h-3.5 w-3.5" />
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION 5 — TRUST, COMPLIANCE & SUPPORT
			══════════════════════════════════════════════════════════════ */}
			<section
				id="trust"
				className="border-b border-[#DEDEDA] bg-[#EFEFEA]/50 py-16 sm:py-24 dark:border-[#292929] dark:bg-[#0B0B0B]"
			>
				<div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
					<div className="text-center max-w-3xl mx-auto space-y-3">
						<span className="font-mono text-xs uppercase tracking-widest text-[#666666] dark:text-[#A3A3A0]">
							Reliability & Governance • 05
						</span>
						<h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl lg:text-5xl">
							Trust, Compliance & Dedicated Support
						</h2>
						<p className="text-sm text-[#555555] sm:text-base dark:text-[#A3A3A0]">
							B2B trade mein bharosa sabse zaroori hai. Evaluna Pvt Ltd ensures legal
							compliance, standard GST invoicing, aur prompt human support.
						</p>
					</div>

					{/* 4 Trust Pillars */}
					<div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{/* Company Overview */}
						<div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-xs dark:border-[#292929] dark:bg-[#101010]">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
								<Store className="h-5 w-5" />
							</div>
							<h3 className="mt-4 font-serif text-lg font-medium">
								Company Details & Infrastructure
							</h3>
							<p className="mt-2 text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
								Evaluna Pvt Ltd operates primary central warehouse facilities in
								Bhopal and Berasia. Equipped with barcode scanners, multi-bay bin
								storage, and climate control for edible grocery safety.
							</p>
							<div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-[#666666] dark:text-[#A3A3A0]">
								<MapPin className="h-3.5 w-3.5 text-blue-500" />
								<span>Bhopal & Berasia, Madhya Pradesh</span>
							</div>
						</div>

						{/* Quality & Licensing */}
						<div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-xs dark:border-[#292929] dark:bg-[#101010]">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
								<FileCheck className="h-5 w-5" />
							</div>
							<h3 className="mt-4 font-serif text-lg font-medium">
								Quality, FSSAI & 100% GST Billing
							</h3>
							<p className="mt-2 text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
								Har order par transparent GST invoice milta hai jisse aap 100%
								Input Tax Credit (ITC) claim kar sakte hain. FSSAI certified
								hygiene standards ke sath proper batch/expiry tracking.
							</p>
							<div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-[#666666] dark:text-[#A3A3A0]">
								<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
								<span>FSSAI Certified • GST Compliant</span>
							</div>
						</div>

						{/* Dedicated Direct Support */}
						<div className="rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-xs dark:border-[#292929] dark:bg-[#101010]">
							<div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
								<Headphones className="h-5 w-5" />
							</div>
							<h3 className="mt-4 font-serif text-lg font-medium">
								Dedicated Area Manager & Support
							</h3>
							<p className="mt-2 text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
								Aapke business ke liye dedicated sales executive aur WhatsApp
								helpline available hai. Order tracking, scheme updates, ya billing
								clarifications ke liye turant call ya chat karein.
							</p>
							<div className="mt-4 flex flex-col gap-1.5 font-mono text-[11px] text-[#666666] dark:text-[#A3A3A0]">
								<div className="flex items-center gap-2">
									<Clock className="h-3.5 w-3.5 text-amber-500" />
									<span>Mon - Sat: 8:00 AM - 8:00 PM</span>
								</div>
								<div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
									<Phone className="h-3.5 w-3.5" />
									<a href={CONTACT_TEL_HREF} className="font-semibold hover:underline">
										Direct Call: {CONTACT_PHONE}
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* Retailer Reviews & Testimonials Carousel */}
					<div className="mt-16">
						<div className="text-center mb-8">
							<span className="font-mono text-xs uppercase tracking-widest text-[#666666] dark:text-[#A3A3A0]">
								Merchant Voices
							</span>
							<h3 className="mt-1 font-serif text-2xl font-medium sm:text-3xl">
								What Retailers Say About Evaluna
							</h3>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
							{REVIEWS.map((rev, idx) => (
								<div
									key={idx}
									className="flex flex-col justify-between rounded-2xl border border-[#DEDEDA] bg-white p-6 shadow-xs dark:border-[#292929] dark:bg-[#101010]"
								>
									<div>
										<div className="flex items-center space-x-1 text-amber-500 mb-3">
											{[...Array(rev.rating)].map((_, i) => (
												<Star
													key={i}
													className="h-4 w-4 fill-amber-500 text-amber-500"
												/>
											))}
										</div>
										<p className="text-xs leading-relaxed italic text-[#444444] dark:text-[#CCCCCC]">
											"{rev.quote}"
										</p>
									</div>

									<div className="mt-6 pt-4 border-t border-[#EDEDEA] dark:border-[#222222]">
										<p className="font-semibold text-sm">{rev.name}</p>
										<p className="text-[11px] text-[#777777] dark:text-[#999999]">
											{rev.role} • {rev.store}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* WhatsApp & Phone Direct Contact Banner */}
					<div className="mt-12 rounded-2xl border border-[#DEDEDA] bg-white p-6 sm:p-8 dark:border-[#292929] dark:bg-[#101010]">
						<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
							<div className="space-y-1">
								<h4 className="font-serif text-xl font-medium">
									Need Assistance or Bulk Custom Quotes?
								</h4>
								<p className="text-xs text-[#555555] dark:text-[#A3A3A0]">
									Hamari dedicated retail onboarding team se WhatsApp ({CONTACT_PHONE}) ya direct call par baat karein.
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-3">
								<a
									href={WHATSAPP_INQUIRY_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center space-x-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-mono text-xs uppercase text-white hover:bg-emerald-700 transition-colors shadow-sm"
								>
									<MessageCircle className="h-4 w-4" />
									<span>Chat on WhatsApp</span>
								</a>

								<a
									href={CONTACT_TEL_HREF}
									className="inline-flex items-center space-x-2 rounded-lg border border-[#DEDEDA] px-5 py-2.5 font-mono text-xs uppercase text-[#111111] hover:border-[#111111] dark:border-[#292929] dark:text-[#F5F5F2] dark:hover:border-[#F5F5F2]"
								>
									<Phone className="h-3.5 w-3.5 text-emerald-600" />
									<span>Call: {CONTACT_PHONE}</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION 6 — COMPREHENSIVE B2B FOOTER
			══════════════════════════════════════════════════════════════ */}
			<footer className="border-t border-[#DEDEDA] bg-white pt-16 pb-12 text-[#111111] dark:border-[#292929] dark:bg-[#070707] dark:text-[#F5F5F2]">
				<div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
					<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 pb-12 border-b border-[#DEDEDA] dark:border-[#292929]">
						{/* Company Lockup & Intro */}
						<div className="space-y-4 lg:col-span-4">
							<div className="flex items-center space-x-3">
								<img
									src="/logo.jpg"
									alt="Evaluna"
									className="h-9 w-9 rounded-xl object-cover shadow-xs border border-[#DEDEDA] dark:border-[#292929]"
								/>
								<div>
									<span className="font-serif text-lg font-semibold uppercase tracking-tight">
										EVALUNA PVT LTD
									</span>
									<p className="font-mono text-[9px] uppercase tracking-widest text-[#777777] dark:text-[#999999]">
										Wholesale Grocery Supply & Logistics
									</p>
								</div>
							</div>

							<p className="text-xs leading-relaxed text-[#555555] dark:text-[#A3A3A0]">
								Evaluna Pvt Ltd is a premier technology-driven B2B wholesale grocery
								and FMCG supply partner in Central India. Empowering Kirana stores,
								supermarkets, and HoReCa operators with transparent bulk rates,
								guaranteed genuine brands, and swift doorstep logistics.
							</p>

							<div className="pt-2 font-mono text-[11px] text-[#666666] space-y-1 dark:text-[#A3A3A0]">
								<p>CIN: U51909MP2024PTC068940</p>
								<p>FSSAI License: 11424850000215</p>
								<p>GSTIN: 23AABCE1234F1Z8</p>
							</div>
						</div>

						{/* Quick Links */}
						<div className="space-y-3 lg:col-span-2">
							<h4 className="font-mono text-xs uppercase tracking-wider text-[#111111] dark:text-[#F5F5F2]">
								Quick Links
							</h4>
							<ul className="space-y-2 text-xs text-[#555555] dark:text-[#A3A3A0]">
								<li>
									<Link href="/about" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										About Us
									</Link>
								</li>
								<li>
									<Link href="/#categories" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Core Categories
									</Link>
								</li>
								<li>
									<Link href="/#why-choose" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Why Choose Us
									</Link>
								</li>
								<li>
									<Link href="/#how-it-works" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										How It Works
									</Link>
								</li>
								<li>
									<Link href="/contact" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Bulk Inquiry
									</Link>
								</li>
							</ul>
						</div>

						{/* Wholesale Categories */}
						<div className="space-y-3 lg:col-span-3">
							<h4 className="font-mono text-xs uppercase tracking-wider text-[#111111] dark:text-[#F5F5F2]">
								Wholesale Categories
							</h4>
							<ul className="space-y-2 text-xs text-[#555555] dark:text-[#A3A3A0]">
								<li>
									<Link href="/customer/products?category=staples" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Staples & Grains (Atta, Rice, Pulses)
									</Link>
								</li>
								<li>
									<Link href="/customer/products?category=oils" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Edible Oils & Deshi Ghee
									</Link>
								</li>
								<li>
									<Link href="/customer/products?category=packaged" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Packaged Foods & Namkeen
									</Link>
								</li>
								<li>
									<Link href="/customer/products?category=fmcg" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										FMCG, Soaps & Detergents
									</Link>
								</li>
								<li>
									<Link href="/customer/products?category=beverages" className="hover:text-[#111111] dark:hover:text-[#F5F5F2]">
										Cold Drinks & Beverages
									</Link>
								</li>
							</ul>
						</div>

						{/* Contact Info & Compliance */}
						<div className="space-y-3 lg:col-span-3">
							<h4 className="font-mono text-xs uppercase tracking-wider text-[#111111] dark:text-[#F5F5F2]">
								Contact & Support Desk
							</h4>
							<div className="space-y-2 text-xs text-[#555555] dark:text-[#A3A3A0]">
								<p className="flex items-start gap-2">
									<MapPin className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
									<span>
										Central Logistics Hub, Vidisha Road & Berasia Transit Junction, Bhopal, MP - 463106
									</span>
								</p>
								<p className="flex items-center gap-2">
									<Phone className="h-4 w-4 shrink-0 text-emerald-600" />
									<a href={CONTACT_TEL_HREF} className="hover:underline font-mono">
										{CONTACT_PHONE} / +91 755 492 8110
									</a>
								</p>
								<p className="flex items-center gap-2">
									<MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
									<a
										href={WHATSAPP_INQUIRY_URL}
										target="_blank"
										rel="noopener noreferrer"
										className="hover:underline font-mono"
									>
										WhatsApp: {CONTACT_PHONE}
									</a>
								</p>
								<p className="flex items-center gap-2">
									<Clock className="h-4 w-4 shrink-0 text-emerald-600" />
									<span>Mon - Sat: 8:00 AM - 8:00 PM</span>
								</p>
							</div>

							<div className="pt-2">
								<Link
									href="/login"
									className="inline-flex items-center space-x-1.5 font-mono text-xs uppercase tracking-wider text-[#111111] hover:underline dark:text-[#F5F5F2]"
								>
									<span>Retailer Portal Login</span>
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						</div>
					</div>

					{/* Bottom Legal & Copyright Bar */}
					<div className="mt-8 flex flex-col justify-between gap-4 text-xs text-[#777777] sm:flex-row sm:items-center dark:text-[#888888]">
						<div>
							<p>© 2026 Evaluna Pvt Ltd. All rights reserved.</p>
						</div>

						<div className="flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-wider">
							<Link href="/terms" className="hover:underline">
								Terms & Conditions
							</Link>
							<span>•</span>
							<Link href="/privacy" className="hover:underline">
								Privacy Policy
							</Link>
							<span>•</span>
							<Link href="/terms#returns" className="hover:underline">
								Return & Damaged Goods Policy
							</Link>
							<span>•</span>
							<Link href="/contact" className="hover:underline">
								Support
							</Link>
						</div>
					</div>
				</div>
			</footer>

			{/* Floating WhatsApp Quick Action Button */}
			<aside aria-label="WhatsApp Support" className="fixed bottom-6 right-6 z-40">
				<a
					href={WHATSAPP_INQUIRY_URL}
					target="_blank"
					rel="noopener noreferrer"
					className="group flex items-center gap-2.5 rounded-full bg-emerald-600 py-3 px-4 sm:px-5 font-mono text-xs font-semibold text-white shadow-xl shadow-emerald-600/30 transition-all duration-300 hover:bg-emerald-500 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-black"
					title={`Direct WhatsApp Inquiry with Evaluna Wholesale (${CONTACT_PHONE})`}
				>
					<span className="relative flex h-3 w-3">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
						<span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
					</span>
					<MessageCircle className="h-5 w-5 fill-current" />
					<span className="hidden sm:inline">WhatsApp Help</span>
					<span className="sm:hidden">Help</span>
				</a>
			</aside>
		</div>
	);
}
