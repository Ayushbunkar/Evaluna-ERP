"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	AnimatePresence,
	motion,
	useMotionValue,
	useReducedMotion,
	useScroll,
	useSpring,
	useTransform,
} from "framer-motion";
import {
	ArrowDown,
	ArrowRight,
	Building2,
	Check,
	Compass,
	Eye,
	Globe,
	Layers,
	MapPin,
	Menu,
	Minus,
	Mountain,
	MoveRight,
	Phone,
	Plus,
	ShieldCheck,
	Sparkles,
	Sun,
	Moon,
	X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

// ── Editorial Work Showcase Data ──
const CAPABILITIES = [
	{
		number: "01",
		title: "Commerce & Retail Infrastructure",
		tagline: "High-throughput transaction systems",
		description:
			"Resilient point-of-sale architectures, real-time inventory reconciliation, and offline-first transactional reliability engineered for retail networks across Madhya Pradesh.",
		stat: "0.2s",
		statLabel: "Receipt sync latency",
		highlights: [
			"Offline-first POS ledger synchronization",
			"Multi-tier GST compliant taxation engine",
			"Real-time sales velocity analytics",
		],
		badge: "Commercial Technology",
	},
	{
		number: "02",
		title: "Supply Chain & Multi-Warehouse Logistics",
		tagline: "Intelligent warehousing & spatial tracking",
		description:
			"Enterprise warehouse operations connecting automated receiving, First-Expired-First-Out (FEFO) batch allocation, and multi-depot distribution centered around Bhopal and Berasia.",
		stat: "100%",
		statLabel: "Batch audit traceability",
		highlights: [
			"FEFO & FIFO automated lot picking",
			"Geofenced logistics & dispatch tracking",
			"Discrepancy prevention & physical stock audits",
		],
		badge: "Logistics Operations",
	},
	{
		number: "03",
		title: "Digital Systems & Custom Engineering",
		tagline: "Purpose-built platforms for modern enterprise",
		description:
			"Tailored digital software platforms, secure role-based workforce architectures, and integrated financial controls designed to scale regional enterprises with modern web precision.",
		stat: "99.9%",
		statLabel: "System reliability",
		highlights: [
			"Strict role-based access & audit trails",
			"Cloud-native resilient infrastructure",
			"End-to-end departmental integration",
		],
		badge: "Digital Platform",
	},
];

const PROCESS_STEPS = [
	{
		number: "01",
		title: "Discover & Understand",
		subtitle: "Deep architectural immersion",
		description:
			"We listen, analyze real-world ground operations, and understand operational bottlenecks before writing a single line of architecture.",
	},
	{
		number: "02",
		title: "Architect & Model",
		subtitle: "Resilient systems design",
		description:
			"Designing high-reliability data models, intuitive human workflows, and offline-tolerant failover patterns.",
	},
	{
		number: "03",
		title: "Engineer & Validate",
		subtitle: "Precision implementation",
		description:
			"Crafting robust codebases backed by rigorous automated verification, strict typing, and uncompromising speed.",
	},
	{
		number: "04",
		title: "Deploy & Elevate",
		subtitle: "Long-term partnership",
		description:
			"Deploying alongside teams in Bhopal and central India, continuously refining workflows as regional enterprise scales.",
	},
];

const VALUES = [
	{
		title: "Built with Purpose",
		description:
			"Every system we engineer exists to solve real human workflow challenges, eliminating operational chaos with clarity.",
	},
	{
		title: "Grounded in Craft",
		description:
			"We reject generic off-the-shelf templates in favor of deeply considered architectural rigor and aesthetic elegance.",
	},
	{
		title: "Regional Pride & Proximity",
		description:
			"Deeply rooted in the heart of Madhya Pradesh, delivering global-tier digital craftsmanship with local accountability.",
	},
	{
		title: "Uncompromising Reliability",
		description:
			"Zero tolerance for downtime, lost data, or disconnected teams. Our platforms are built to run without interruption.",
	},
];

export default function PremiumHomePage() {
	const { theme, setTheme } = useTheme();
	const prefersReducedMotion = useReducedMotion();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const [activeProcess, setActiveProcess] = useState(0);

	// Scroll position listener for sticky nav styling
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 40);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Hero mouse perspective coordinates
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
	const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (prefersReducedMotion) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width - 0.5;
		const y = (e.clientY - rect.top) / rect.height - 0.5;
		mouseX.set(x * 20);
		mouseY.set(y * 20);
	};

	const handleMouseLeave = () => {
		mouseX.set(0);
		mouseY.set(0);
	};

	return (
		<div
			className="min-h-screen bg-[#F8F5EF] text-[#302720] dark:bg-[#191613] dark:text-[#F4EDE3] transition-colors duration-500 selection:bg-[#B87957]/20 selection:text-[#302720] dark:selection:text-[#F4EDE3] font-sans antialiased overflow-x-hidden"
			style={{
				// Warm architectural palette token targets
				// Light: bg #F8F5EF, alt #EFE7DC, text #302720, muted #776A5D, accent #B87957, border #DED3C5, card #FFFCF7
				// Dark:  bg #191613, alt #231E19, text #F4EDE3, muted #B5A695, accent #C99170, border #40362D, card #211C17
			}}
		>
			{/* ══════════════════════════════════════════════════════════════
			    SECTION A — REFINED EDITORIAL NAVIGATION
			══════════════════════════════════════════════════════════════ */}
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
					scrolled
						? "bg-[#F8F5EF]/85 dark:bg-[#191613]/85 backdrop-blur-md border-b border-[#DED3C5] dark:border-[#40362D] py-3.5 shadow-xs"
						: "bg-transparent py-6"
				}`}
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
					{/* Wordmark & Brand Identity */}
					<Link
						href="/"
						className="group flex items-center space-x-3 transition-opacity hover:opacity-90"
					>
						<img
							src="/logo.jpg"
							alt="Evaluna"
							className="h-9 w-9 rounded-lg object-cover shadow-xs ring-1 ring-[#DED3C5] dark:ring-[#40362D] transition-transform duration-300 group-hover:scale-105"
						/>
						<div className="flex flex-col">
							<span className="text-lg font-bold tracking-tight text-[#302720] dark:text-[#F4EDE3] font-serif">
								EVALUNA
							</span>
							<span className="text-[10px] tracking-widest uppercase text-[#776A5D] dark:text-[#B5A695] font-mono -mt-0.5">
								Technologies • Bhopal
							</span>
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center space-x-8 text-xs tracking-wider uppercase font-medium text-[#776A5D] dark:text-[#B5A695]">
						<Link
							href="#about"
							className="transition-colors hover:text-[#302720] dark:hover:text-[#F4EDE3]"
						>
							About
						</Link>
						<Link
							href="#capabilities"
							className="transition-colors hover:text-[#302720] dark:hover:text-[#F4EDE3]"
						>
							Capabilities
						</Link>
						<Link
							href="#philosophy"
							className="transition-colors hover:text-[#302720] dark:hover:text-[#F4EDE3]"
						>
							Philosophy
						</Link>
						<Link
							href="#presence"
							className="transition-colors hover:text-[#302720] dark:hover:text-[#F4EDE3]"
						>
							Presence
						</Link>
						<Link
							href="/contact"
							className="transition-colors hover:text-[#302720] dark:hover:text-[#F4EDE3]"
						>
							Contact
						</Link>
					</nav>

					{/* Controls: Locale, Theme & Primary CTA */}
					<div className="hidden sm:flex items-center space-x-3">
						<ThemeToggle />
						<Link
							href="/login"
							className="text-xs font-mono uppercase tracking-wider text-[#776A5D] dark:text-[#B5A695] px-3 py-2 hover:text-[#302720] dark:hover:text-[#F4EDE3] transition-colors"
						>
							Portal
						</Link>
						<Link
							href="/contact"
							className="inline-flex items-center space-x-2 text-xs font-medium tracking-wide uppercase px-4 py-2.5 rounded-full bg-[#B87957] hover:bg-[#a66b4c] dark:bg-[#C99170] dark:hover:bg-[#b88060] text-white dark:text-[#191613] transition-all duration-300 shadow-xs hover:shadow-sm"
						>
							<span>Let’s Talk</span>
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					{/* Mobile Menu Trigger */}
					<div className="flex md:hidden items-center space-x-2">
						<ThemeToggle />
						<button
							type="button"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 text-[#302720] dark:text-[#F4EDE3] hover:text-[#B87957] transition-colors"
							aria-label="Toggle Navigation Menu"
						>
							{mobileMenuOpen ? (
								<X className="h-5 w-5" />
							) : (
								<Menu className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Navigation Drawer */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3 }}
							className="md:hidden border-b border-[#DED3C5] dark:border-[#40362D] bg-[#F8F5EF] dark:bg-[#191613] px-6 py-6"
						>
							<div className="flex flex-col space-y-4 text-sm font-medium uppercase tracking-wider text-[#776A5D] dark:text-[#B5A695]">
								<Link
									href="#about"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:text-[#302720] dark:hover:text-[#F4EDE3]"
								>
									About
								</Link>
								<Link
									href="#capabilities"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:text-[#302720] dark:hover:text-[#F4EDE3]"
								>
									Capabilities
								</Link>
								<Link
									href="#philosophy"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:text-[#302720] dark:hover:text-[#F4EDE3]"
								>
									Philosophy
								</Link>
								<Link
									href="#presence"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:text-[#302720] dark:hover:text-[#F4EDE3]"
								>
									Presence
								</Link>
								<Link
									href="/contact"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:text-[#302720] dark:hover:text-[#F4EDE3]"
								>
									Contact
								</Link>
								<Link
									href="/login"
									onClick={() => setMobileMenuOpen(false)}
									className="hover:text-[#302720] dark:hover:text-[#F4EDE3]"
								>
									Employee Portal
								</Link>
								<div className="pt-2">
									<Link
										href="/contact"
										onClick={() => setMobileMenuOpen(false)}
										className="inline-flex w-full justify-center items-center space-x-2 text-xs font-medium tracking-wide uppercase px-4 py-3 rounded-full bg-[#B87957] text-white dark:bg-[#C99170] dark:text-[#191613]"
									>
										<span>Let’s Talk</span>
										<ArrowRight className="h-3.5 w-3.5" />
									</Link>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</header>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION B — CINEMATIC HERO (Depth, Perspective & Editorial)
			══════════════════════════════════════════════════════════════ */}
			<section
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				className="relative min-h-[92vh] sm:min-h-screen pt-32 pb-20 flex flex-col justify-between overflow-hidden"
			>
				{/* Ambient Warm Architectural Backdrop Glow */}
				<div className="pointer-events-none absolute inset-0 -z-10">
					<div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-[#B87957]/10 dark:bg-[#C99170]/10 blur-[130px]" />
					<div className="absolute bottom-10 right-10 h-[380px] w-[380px] rounded-full bg-[#EFE7DC] dark:bg-[#231E19] blur-[100px]" />
				</div>

				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full flex-1 flex flex-col justify-center">
					{/* Location badge */}
					<motion.div
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="inline-flex items-center space-x-2 text-xs font-mono tracking-widest uppercase text-[#B87957] dark:text-[#C99170] mb-6"
					>
						<span className="h-1.5 w-1.5 rounded-full bg-[#B87957] dark:bg-[#C99170]" />
						<span>Bhopal & Berasia • Madhya Pradesh, India</span>
					</motion.div>

					{/* Editorial Headline */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
						<motion.div
							initial={{ opacity: 0, y: 25 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.1 }}
							className="lg:col-span-8"
						>
							<h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-normal tracking-tight text-[#302720] dark:text-[#F4EDE3] leading-[1.05]">
								Built with Purpose.
								<br />
								<span className="italic font-light text-[#B87957] dark:text-[#C99170]">
									Designed for
								</span>{" "}
								What’s Next.
							</h1>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 25 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.25 }}
							className="lg:col-span-4 lg:pb-3 space-y-6"
						>
							<p className="text-base sm:text-lg text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
								Evaluna is a technology company engineered around craft, operational
								resilience, and modern enterprise software. Rooted in central India,
								creating digital systems that scale with poise.
							</p>

							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Link
									href="#about"
									className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full bg-[#302720] dark:bg-[#F4EDE3] text-[#F8F5EF] dark:text-[#191613] hover:bg-[#B87957] dark:hover:bg-[#C99170] dark:hover:text-white transition-all shadow-sm"
								>
									<span>Discover Evaluna</span>
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
								<Link
									href="#capabilities"
									className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold px-6 py-3.5 rounded-full border border-[#DED3C5] dark:border-[#40362D] text-[#302720] dark:text-[#F4EDE3] hover:bg-[#EFE7DC] dark:hover:bg-[#231E19] transition-all"
								>
									<span>Explore Our Work</span>
								</Link>
							</div>
						</motion.div>
					</div>

					{/* Hero Layered Composition (3D depth without heavy WebGL) */}
					<motion.div
						style={{ x: springX, y: springY }}
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.35 }}
						className="mt-14 sm:mt-16 relative"
					>
						<div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] shadow-lg">
							{/* Layer 1: Warm Architectural Composition Banner */}
							<div className="h-64 sm:h-80 md:h-[420px] w-full bg-gradient-to-br from-[#EFE7DC] via-[#F8F5EF] to-[#DED3C5] dark:from-[#231E19] dark:via-[#191613] dark:to-[#40362D] relative flex items-center justify-between p-8 sm:p-12 overflow-hidden">
								{/* Subtle geometric lines */}
								<div className="absolute inset-0 opacity-15 dark:opacity-25 bg-[radial-gradient(#B87957_1px,transparent_1px)] [background-size:24px_24px]" />

								<div className="relative z-10 max-w-lg space-y-4">
									<span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest bg-[#B87957]/10 dark:bg-[#C99170]/15 text-[#B87957] dark:text-[#C99170]">
										Architectural Precision
									</span>
									<h3 className="text-2xl sm:text-4xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-snug">
										Where grounded engineering meets enduring aesthetic restraint.
									</h3>
									<p className="text-xs sm:text-sm text-[#776A5D] dark:text-[#B5A695] font-sans">
										Designed in Vidisha Road, Berasia & Bhopal Technology Park to serve real business operations with modern digital clarity.
									</p>
								</div>

								{/* Decorative architectural layout element */}
								<div className="hidden md:flex flex-col items-end space-y-3 relative z-10 text-right font-mono text-[11px] text-[#776A5D] dark:text-[#B5A695]">
									<div className="px-4 py-2 rounded-xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7]/80 dark:bg-[#211C17]/80 backdrop-blur-xs">
										<span className="block font-bold text-[#302720] dark:text-[#F4EDE3]">
											CENTRAL INDIA HUB
										</span>
										<span>Lat 23.63° N / Long 77.43° E</span>
									</div>
									<div className="px-4 py-2 rounded-xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7]/80 dark:bg-[#211C17]/80 backdrop-blur-xs">
										<span className="block font-bold text-[#B87957] dark:text-[#C99170]">
											RELIABILITY TARGET
										</span>
										<span>Sub-second transactional state</span>
									</div>
								</div>
							</div>

							{/* Overlapping Bottom Ribbon */}
							<div className="border-t border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#776A5D] dark:text-[#B5A695]">
								<div className="flex items-center space-x-6">
									<span>01 / IDENTITY</span>
									<span>02 / INFRASTRUCTURE</span>
									<span>03 / VERIFIED SYSTEMS</span>
								</div>
								<div className="flex items-center space-x-2 text-[#B87957] dark:text-[#C99170]">
									<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
									<span>OPERATIONAL GROUND STATE ACTIVE</span>
								</div>
							</div>
						</div>
					</motion.div>
				</div>

				{/* Minimal Scroll Indicator */}
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-8 flex items-center justify-between text-xs font-mono text-[#776A5D] dark:text-[#B5A695]">
					<span className="hidden sm:inline">SCROLL TO EXPLORE STORY</span>
					<div className="flex items-center space-x-2 animate-bounce">
						<ArrowDown className="h-3.5 w-3.5 text-[#B87957] dark:text-[#C99170]" />
					</div>
					<span>EST. MADHYA PRADESH</span>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION C — BRAND INTRODUCTION / ABOUT EVALUNA
			══════════════════════════════════════════════════════════════ */}
			<section
				id="about"
				className="py-24 sm:py-32 border-t border-[#DED3C5] dark:border-[#40362D] bg-[#EFE7DC] dark:bg-[#231E19] transition-colors"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
						{/* Editorial Left Column */}
						<div className="lg:col-span-5 space-y-6">
							<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
								01 — COMPANY PROFILE
							</span>
							<h2 className="text-3xl sm:text-5xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-tight">
								A company created to bring architectural clarity to commerce.
							</h2>
							<div className="h-px w-24 bg-[#B87957] dark:bg-[#C99170]" />
							<p className="text-sm font-mono text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
								Evaluna Technologies Pvt. Ltd. operates at the intersection of robust regional supply chains and modern software systems.
							</p>
						</div>

						{/* Narrative Right Column */}
						<div className="lg:col-span-7 space-y-8">
							<p className="text-lg sm:text-xl text-[#302720] dark:text-[#F4EDE3] leading-relaxed font-light">
								Founded with deep roots in central India, Evaluna was established to solve real friction in regional distribution, wholesale commerce, and enterprise logistics. We build resilient operational infrastructure that allows businesses to operate without interruption, from retail storefronts to multi-acre distribution depots.
							</p>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
								<div className="p-6 rounded-2xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] space-y-2">
									<span className="text-xs font-mono text-[#B87957] dark:text-[#C99170] uppercase">
										Grounded Roots
									</span>
									<h4 className="text-base font-semibold text-[#302720] dark:text-[#F4EDE3]">
										Bhopal & Berasia
									</h4>
									<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
										Directly present along Vidisha Road, Berasia and Bhopal Tech Park, understanding ground reality rather than detached theory.
									</p>
								</div>

								<div className="p-6 rounded-2xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] space-y-2">
									<span className="text-xs font-mono text-[#B87957] dark:text-[#C99170] uppercase">
										Engineering Standard
									</span>
									<h4 className="text-base font-semibold text-[#302720] dark:text-[#F4EDE3]">
										Zero Compromise
									</h4>
									<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
										Combining offline-first local performance with cloud enterprise synchronization, built for high transaction volume.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION D — WHAT EVALUNA DOES (Capabilities & Systems)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="capabilities"
				className="py-24 sm:py-32 bg-[#F8F5EF] dark:bg-[#191613] transition-colors"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
					{/* Section Header */}
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
						<div className="space-y-4 max-w-2xl">
							<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
								02 — CAPABILITIES & SOLUTIONS
							</span>
							<h2 className="text-3xl sm:text-5xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-tight">
								Engineered systems built for tangible operational reality.
							</h2>
						</div>
						<p className="text-xs sm:text-sm text-[#776A5D] dark:text-[#B5A695] max-w-md font-sans">
							Our verified work encompasses transactional commerce, logistics routing, and bespoke enterprise systems engineered for stability and growth.
						</p>
					</div>

					{/* Capabilities Cards (Editorial Composition) */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{CAPABILITIES.map((cap, i) => (
							<motion.div
								key={cap.number}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.6, delay: i * 0.15 }}
								className="group rounded-3xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-8 flex flex-col justify-between hover:border-[#B87957] dark:hover:border-[#C99170] transition-all duration-300 shadow-xs hover:shadow-md"
							>
								<div className="space-y-6">
									<div className="flex items-center justify-between border-b border-[#DED3C5]/60 dark:border-[#40362D]/60 pb-4">
										<span className="font-mono text-sm text-[#B87957] dark:text-[#C99170]">
											{cap.number}
										</span>
										<span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EFE7DC] dark:bg-[#231E19] text-[#776A5D] dark:text-[#B5A695]">
											{cap.badge}
										</span>
									</div>

									<div className="space-y-2">
										<h3 className="text-xl font-serif font-bold text-[#302720] dark:text-[#F4EDE3]">
											{cap.title}
										</h3>
										<p className="text-xs font-mono text-[#B87957] dark:text-[#C99170]">
											{cap.tagline}
										</p>
									</div>

									<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
										{cap.description}
									</p>

									<ul className="space-y-2 pt-2 border-t border-[#DED3C5]/40 dark:border-[#40362D]/40 text-xs text-[#776A5D] dark:text-[#B5A695]">
										{cap.highlights.map((h, idx) => (
											<li key={idx} className="flex items-center space-x-2">
												<span className="h-1 w-1 rounded-full bg-[#B87957] dark:bg-[#C99170]" />
												<span>{h}</span>
											</li>
										))}
									</ul>
								</div>

								<div className="mt-8 pt-6 border-t border-[#DED3C5]/60 dark:border-[#40362D]/60 flex items-center justify-between">
									<div>
										<span className="block text-2xl font-mono font-bold text-[#302720] dark:text-[#F4EDE3]">
											{cap.stat}
										</span>
										<span className="text-[10px] font-mono text-[#776A5D] dark:text-[#B5A695]">
											{cap.statLabel}
										</span>
									</div>
									<div className="h-8 w-8 rounded-full border border-[#DED3C5] dark:border-[#40362D] flex items-center justify-center text-[#776A5D] dark:text-[#B5A695] group-hover:bg-[#B87957] group-hover:text-white dark:group-hover:bg-[#C99170] dark:group-hover:text-[#191613] transition-colors">
										<ArrowRight className="h-3.5 w-3.5" />
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION E — FEATURED SHOWCASE (Visual Editorial Narrative)
			══════════════════════════════════════════════════════════════ */}
			<section className="py-24 sm:py-32 border-t border-[#DED3C5] dark:border-[#40362D] bg-[#EFE7DC] dark:bg-[#231E19] transition-colors">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
					<div className="max-w-2xl space-y-4">
						<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
							03 — VISUAL SHOWCASE
						</span>
						<h2 className="text-3xl sm:text-5xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-tight">
							Designed for human hands on the warehouse floor and boardroom screens.
						</h2>
					</div>

					{/* Asymmetrical Showcase Composition */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
						{/* Large Featured Canvas */}
						<div className="lg:col-span-8 rounded-3xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-8 sm:p-12 flex flex-col justify-between shadow-xs">
							<div className="space-y-4 max-w-xl">
								<span className="text-[11px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#B87957]/10 dark:bg-[#C99170]/15 text-[#B87957] dark:text-[#C99170]">
									Flagship Implementation
								</span>
								<h3 className="text-2xl sm:text-3xl font-serif text-[#302720] dark:text-[#F4EDE3]">
									Unified Operational Architecture
								</h3>
								<p className="text-sm text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
									Connecting offline-first POS counters directly to central warehouse lot tracking (FEFO), driver dispatch delivery routes, and real-time GST tax compliance in one unified source of truth.
								</p>
							</div>

							<div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 border-t border-[#DED3C5]/60 dark:border-[#40362D]/60 font-mono text-xs">
								<div>
									<span className="block text-xl font-bold text-[#302720] dark:text-[#F4EDE3]">
										100%
									</span>
									<span className="text-[#776A5D] dark:text-[#B5A695]">
										Offline-First Resilient
									</span>
								</div>
								<div>
									<span className="block text-xl font-bold text-[#302720] dark:text-[#F4EDE3]">
										FEFO
									</span>
									<span className="text-[#776A5D] dark:text-[#B5A695]">
										Batch Shelf Surveillance
									</span>
								</div>
								<div>
									<span className="block text-xl font-bold text-[#302720] dark:text-[#F4EDE3]">
										Sub-Second
									</span>
									<span className="text-[#776A5D] dark:text-[#B5A695]">
										Synchronized Ledger
									</span>
								</div>
							</div>
						</div>

						{/* Stacked Supporting Cards */}
						<div className="lg:col-span-4 flex flex-col gap-6">
							<div className="rounded-3xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-8 flex-1 flex flex-col justify-between shadow-xs">
								<div className="space-y-3">
									<span className="text-xs font-mono text-[#B87957] dark:text-[#C99170]">
										HARDWARE INTEGRATION
									</span>
									<h4 className="text-lg font-serif font-bold text-[#302720] dark:text-[#F4EDE3]">
										Thermal & Barcode Scanning
									</h4>
									<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
										Direct 2-inch and 3-inch ESC/POS thermal receipt printing, handheld barcode validation, and automated weigh-scale integration.
									</p>
								</div>
								<div className="pt-4 flex items-center justify-between text-xs font-mono text-[#776A5D] dark:text-[#B5A695]">
									<span>PLUG & PLAY</span>
									<Check className="h-4 w-4 text-[#B87957] dark:text-[#C99170]" />
								</div>
							</div>

							<div className="rounded-3xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-8 flex-1 flex flex-col justify-between shadow-xs">
								<div className="space-y-3">
									<span className="text-xs font-mono text-[#B87957] dark:text-[#C99170]">
										FIELD OPERATIONS
									</span>
									<h4 className="text-lg font-serif font-bold text-[#302720] dark:text-[#F4EDE3]">
										Geofenced Attendance & GPS
									</h4>
									<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
										Location-locked warehouse operator check-ins and delivery route tracking tailored for central Madhya Pradesh logistics corridors.
									</p>
								</div>
								<div className="pt-4 flex items-center justify-between text-xs font-mono text-[#776A5D] dark:text-[#B5A695]">
									<span>GEOFENCE VERIFIED</span>
									<MapPin className="h-4 w-4 text-[#B87957] dark:text-[#C99170]" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION F — WHY EVALUNA / WORKING PHILOSOPHY
			══════════════════════════════════════════════════════════════ */}
			<section
				id="philosophy"
				className="py-24 sm:py-32 bg-[#F8F5EF] dark:bg-[#191613] transition-colors"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
					<div className="max-w-2xl space-y-4">
						<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
							04 — GUIDING VALUES
						</span>
						<h2 className="text-3xl sm:text-5xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-tight">
							Our Working Philosophy
						</h2>
						<p className="text-sm text-[#776A5D] dark:text-[#B5A695] font-sans">
							What we prioritize when engineering software for enterprises in central India.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{VALUES.map((val, idx) => (
							<div
								key={idx}
								className="rounded-3xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-8 space-y-4 shadow-xs"
							>
								<span className="text-xs font-mono text-[#B87957] dark:text-[#C99170]">
									0{idx + 1}
								</span>
								<h3 className="text-lg font-serif font-bold text-[#302720] dark:text-[#F4EDE3]">
									{val.title}
								</h3>
								<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
									{val.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION G — PROCESS / APPROACH TIMELINE
			══════════════════════════════════════════════════════════════ */}
			<section className="py-24 sm:py-32 border-t border-[#DED3C5] dark:border-[#40362D] bg-[#EFE7DC] dark:bg-[#231E19] transition-colors">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
					<div className="max-w-2xl space-y-4">
						<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
							05 — METHODOLOGY
						</span>
						<h2 className="text-3xl sm:text-5xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-tight">
							From ground reality to resilient code.
						</h2>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{PROCESS_STEPS.map((step, idx) => (
							<div
								key={step.number}
								className="rounded-2xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-6 space-y-3 relative shadow-xs"
							>
								<div className="flex items-center justify-between">
									<span className="text-xs font-mono text-[#B87957] dark:text-[#C99170]">
										{step.number}
									</span>
									<span className="text-[10px] font-mono text-[#776A5D] dark:text-[#B5A695]">
										STAGE
									</span>
								</div>
								<h4 className="text-base font-serif font-bold text-[#302720] dark:text-[#F4EDE3]">
									{step.title}
								</h4>
								<p className="text-[11px] font-mono text-[#B87957] dark:text-[#C99170]">
									{step.subtitle}
								</p>
								<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION H — LOCAL PRESENCE & REGIONAL IDENTITY
			══════════════════════════════════════════════════════════════ */}
			<section
				id="presence"
				className="py-24 sm:py-32 bg-[#F8F5EF] dark:bg-[#191613] transition-colors"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
					<div className="rounded-3xl border border-[#DED3C5] dark:border-[#40362D] bg-[#FFFCF7] dark:bg-[#211C17] p-8 sm:p-14 lg:p-16 space-y-10 shadow-sm">
						<div className="max-w-2xl space-y-4">
							<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
								06 — REGIONAL PRESENCE
							</span>
							<h2 className="text-3xl sm:text-5xl font-serif text-[#302720] dark:text-[#F4EDE3] leading-tight">
								Anchored in Bhopal & Berasia.
							</h2>
							<p className="text-sm text-[#776A5D] dark:text-[#B5A695] font-sans leading-relaxed">
								Evaluna operates with authentic local presence across the key commercial hubs of Madhya Pradesh. We are physically close to our users, our distribution partners, and our engineering roots.
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-[#DED3C5]/60 dark:border-[#40362D]/60">
							<div className="space-y-3 p-6 rounded-2xl bg-[#EFE7DC]/50 dark:bg-[#231E19]/50 border border-[#DED3C5]/50 dark:border-[#40362D]/50">
								<div className="flex items-center space-x-2 text-[#B87957] dark:text-[#C99170]">
									<MapPin className="h-4 w-4" />
									<span className="text-xs font-mono uppercase font-bold">
										Berasia Facility & Main Depot
									</span>
								</div>
								<h4 className="text-lg font-serif text-[#302720] dark:text-[#F4EDE3]">
									Vidisha Road Operations Hub
								</h4>
								<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
									Near Bank of India, Vidisha Road, Berasia, Bhopal, Madhya Pradesh — 463106
								</p>
								<div className="pt-2 text-[11px] font-mono text-[#776A5D] dark:text-[#B5A695]">
									Direct Logistics & Multi-depot Receiving Gateway
								</div>
							</div>

							<div className="space-y-3 p-6 rounded-2xl bg-[#EFE7DC]/50 dark:bg-[#231E19]/50 border border-[#DED3C5]/50 dark:border-[#40362D]/50">
								<div className="flex items-center space-x-2 text-[#B87957] dark:text-[#C99170]">
									<Building2 className="h-4 w-4" />
									<span className="text-xs font-mono uppercase font-bold">
										Bhopal Technology Presence
									</span>
								</div>
								<h4 className="text-lg font-serif text-[#302720] dark:text-[#F4EDE3]">
									Bhopal Central Technology Network
								</h4>
								<p className="text-xs text-[#776A5D] dark:text-[#B5A695] leading-relaxed">
									Bhopal Technology Network, Central Madhya Pradesh, India
								</p>
								<div className="pt-2 text-[11px] font-mono text-[#776A5D] dark:text-[#B5A695]">
									Cloud Architecture, Solutions Engineering & Support
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION I — FINAL CALL TO ACTION
			══════════════════════════════════════════════════════════════ */}
			<section className="py-24 sm:py-32 border-t border-[#DED3C5] dark:border-[#40362D] bg-[#EFE7DC] dark:bg-[#231E19] transition-colors">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-8">
					<span className="text-xs font-mono uppercase tracking-widest text-[#B87957] dark:text-[#C99170] block">
						07 — COLLABORATION
					</span>
					<h2 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-[#302720] dark:text-[#F4EDE3] max-w-3xl mx-auto leading-tight">
						Have something meaningful to build?
					</h2>
					<p className="text-base sm:text-lg text-[#776A5D] dark:text-[#B5A695] max-w-xl mx-auto leading-relaxed">
						Connect with our team in Bhopal and Berasia to discuss your enterprise requirements, supply chain infrastructure, or digital initiatives.
					</p>

					<div className="flex flex-wrap items-center justify-center gap-4 pt-4">
						<Link
							href="/contact"
							className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-full bg-[#302720] dark:bg-[#F4EDE3] text-[#F8F5EF] dark:text-[#191613] hover:bg-[#B87957] dark:hover:bg-[#C99170] dark:hover:text-white transition-all shadow-md"
						>
							<span>Start a Conversation</span>
							<ArrowRight className="h-4 w-4" />
						</Link>
						<Link
							href="/login"
							className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-semibold px-8 py-4 rounded-full border border-[#DED3C5] dark:border-[#40362D] text-[#302720] dark:text-[#F4EDE3] hover:bg-[#FFFCF7] dark:hover:bg-[#211C17] transition-all"
						>
							<span>Employee Sign-In</span>
						</Link>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION J — FOOTER (Refined Editorial Finisher)
			══════════════════════════════════════════════════════════════ */}
			<footer className="border-t border-[#DED3C5] dark:border-[#40362D] bg-[#F8F5EF] dark:bg-[#191613] py-16 transition-colors">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
					<div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
						<div className="md:col-span-6 space-y-4">
							<div className="flex items-center space-x-3">
								<img
									src="/logo.jpg"
									alt="Evaluna"
									className="h-8 w-8 rounded-lg object-cover shadow-xs ring-1 ring-[#DED3C5] dark:ring-[#40362D]"
								/>
								<span className="text-xl font-bold font-serif text-[#302720] dark:text-[#F4EDE3]">
									EVALUNA
								</span>
							</div>
							<p className="text-xs text-[#776A5D] dark:text-[#B5A695] max-w-sm leading-relaxed">
								Evaluna Technologies Pvt. Ltd. — Engineering resilient commerce, multi-warehouse logistics, and digital systems across Madhya Pradesh, India.
							</p>
						</div>

						<div className="md:col-span-3 space-y-3 text-xs font-mono text-[#776A5D] dark:text-[#B5A695]">
							<span className="block font-bold uppercase text-[#302720] dark:text-[#F4EDE3]">
								Navigation
							</span>
							<ul className="space-y-2">
								<li>
									<Link href="/about" className="hover:text-[#B87957] transition-colors">
										About Company
									</Link>
								</li>
								<li>
									<Link href="/features" className="hover:text-[#B87957] transition-colors">
										Capabilities & Features
									</Link>
								</li>
								<li>
									<Link href="/contact" className="hover:text-[#B87957] transition-colors">
										Contact & Support
									</Link>
								</li>
								<li>
									<Link href="/login" className="hover:text-[#B87957] transition-colors">
										Employee Portal
									</Link>
								</li>
							</ul>
						</div>

						<div className="md:col-span-3 space-y-3 text-xs font-mono text-[#776A5D] dark:text-[#B5A695]">
							<span className="block font-bold uppercase text-[#302720] dark:text-[#F4EDE3]">
								Operations
							</span>
							<p className="text-[11px] leading-relaxed">
								Vidisha Road, Berasia
								<br />
								Bhopal, MP — 463106
								<br />
								Ph: 9630649277
							</p>
						</div>
					</div>

					<div className="pt-8 border-t border-[#DED3C5]/60 dark:border-[#40362D]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#776A5D] dark:text-[#B5A695]">
						<span>
							© {new Date().getFullYear()} Evaluna Technologies Pvt. Ltd. All rights reserved.
						</span>
						<div className="flex items-center space-x-6">
							<Link href="/privacy" className="hover:text-[#B87957] transition-colors">
								Privacy Policy
							</Link>
							<Link href="/terms" className="hover:text-[#B87957] transition-colors">
								Terms of Service
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
