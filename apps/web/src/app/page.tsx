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
	ArrowUpRight,
	ChevronRight,
	Compass,
	Globe,
	MapPin,
	Menu,
	Minus,
	Plus,
	Shield,
	Terminal,
	X,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

// ── Photographic Curation (High-Resolution Architectural & Spatial Series) ──
const IMAGERY = {
	heroStructure:
		"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=85",
	identityFacade:
		"https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1600&q=80",
	expandingLogistics:
		"https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=85",
	spatialDepot:
		"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
	precisionWorkspace:
		"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
	centralIndiaHorizon:
		"https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
};

// ── Hero Smooth Auto-Rotating Photographic Gallery (6 Vibrant Slides) ──
const HERO_SLIDES = [
	{
		url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=85",
		alt: "Evaluna Modern Architectural Structure",
		plate: "PLATE 01 / STRUCTURAL ORDER",
		location: "BHOPAL TECH PARK NEXUS",
	},
	{
		url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85",
		alt: "Evaluna Multi-Warehouse Logistics & Bin Routing",
		plate: "PLATE 02 / SPATIAL LOGISTICS",
		location: "BERASIA TRANSIT CORRIDOR",
	},
	{
		url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
		alt: "Evaluna Modern Freight Hub & Architecture",
		plate: "PLATE 03 / COMMERCE DEPOT",
		location: "CENTRAL INDIA DISTRIBUTION",
	},
	{
		url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
		alt: "Evaluna Precision Workspace & Digital Architecture",
		plate: "PLATE 04 / DIGITAL SYSTEMS",
		location: "HEADQUARTERS • VIDISHA ROAD",
	},
	{
		url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80",
		alt: "Evaluna Architectural Facade & Physical Space",
		plate: "PLATE 05 / PHYSICAL FOUNDATION",
		location: "REGIONAL OPERATIONAL BASE",
	},
	{
		url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80",
		alt: "Central India Geographic Horizon & Landscape",
		plate: "PLATE 06 / GEOGRAPHIC NEXUS",
		location: "MADHYA PRADESH PLATEAU",
	},
];

// ── Disciplines & Capabilities (Editorial image-led layout) ──
const DISCIPLINES = [
	{
		number: "01",
		title: "Spatial Logistics & Multi-Warehouse Control",
		tagline: "Synchronized physical fulfillment across trade corridors",
		description:
			"We architect high-fidelity inventory operating systems connecting regional transit centers. Automated First-Expired-First-Out (FEFO) picking, precise bin tracking, and discrepancy prevention designed specifically for central India’s distribution velocity.",
		image: IMAGERY.spatialDepot,
		aspect: "aspect-[16/10]",
		details: [
			"FEFO & FIFO physical picking rules",
			"Central India multi-depot transit routing",
			"Immutable chain-of-custody transfer slips",
		],
		coordinates: "DEPOT HUB • 23.6300° N, 77.4320° E",
	},
	{
		number: "02",
		title: "High-Integrity Commerce & Transaction Engines",
		tagline: "Deterministic checkout speed without connectivity dependencies",
		description:
			"Enterprise transaction platforms engineered to withstand network volatility. Client-side ledger caching guarantees retail billing moves at sub-second speeds, synchronizing quietly when regional connections restore.",
		image: IMAGERY.precisionWorkspace,
		aspect: "aspect-[4/3]",
		details: [
			"Zero-latency point-of-sale checkout",
			"Fault-tolerant local ledger persistence",
			"Automated multi-slab tax & GST calculations",
		],
		coordinates: "COMMERCE NEXUS • BHOPAL METRO",
	},
	{
		number: "03",
		title: "Bespoke Digital Systems & Enterprise Governance",
		tagline: "Purpose-built architectures with zero generic bloat",
		description:
			"Tailored digital software platforms, secure role-based workforce architectures, and integrated financial controls designed to scale regional enterprises with architectural permanence.",
		image: IMAGERY.identityFacade,
		aspect: "aspect-[16/9]",
		details: [
			"Strict cryptographic audit trails",
			"Multi-tier departmental authorization",
			"High-density reporting and cashbook discipline",
		],
		coordinates: "HEADQUARTERS • VIDISHA ROAD",
	},
];

// ── Working Philosophy (The Four Principles) ──
const PRINCIPLES = [
	{
		number: "01",
		title: "Listen to the Ground",
		body: "True operational architecture begins on the unloading dock and checkout counter, not in abstract boardroom presentations. We spend time observing physical movement before writing software.",
	},
	{
		number: "02",
		title: "Reject Ephemeral Fads",
		body: "We deliberately avoid decorative trends and bloated dependencies. We choose tested engineering foundations, strict typing, and minimalist ergonomics that endure over decades.",
	},
	{
		number: "03",
		title: "Honor the Geography",
		body: "Designing in central India requires accounting for real-world realities: intermittent connectivity, dust, temperature, and specific supply chain corridors linking Berasia to national transit routes.",
	},
	{
		number: "04",
		title: "Stewardship Across Cycles",
		body: "Our responsibility does not conclude at deployment. We stand alongside operational teams through seasonal spikes, audits, and decades of steady commercial evolution.",
	},
];

export default function HomePage() {
	const [scrolled, setScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [activeSlide, setActiveSlide] = useState(0);
	const prefersReducedMotion = useReducedMotion();

	// Auto-rotate hero photographic slides smoothly every 4.5 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
		}, 4500);
		return () => clearInterval(interval);
	}, []);

	// Scroll listener for navigation elevation
	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 40);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Pointer-responsive subtle depth for Hero on desktop
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const springX = useSpring(mouseX, { stiffness: 45, damping: 25 });
	const springY = useSpring(mouseY, { stiffness: 45, damping: 25 });

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (prefersReducedMotion || typeof window === "undefined" || window.innerWidth < 1024) return;
		const { clientX, clientY } = e;
		const { innerWidth, innerHeight } = window;
		const xPos = (clientX / innerWidth - 0.5) * 16;
		const yPos = (clientY / innerHeight - 0.5) * 16;
		mouseX.set(xPos);
		mouseY.set(yPos);
	};

	// Scroll-driven expansion for Section D
	const expansionContainerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress: expansionProgress } = useScroll({
		target: expansionContainerRef,
		offset: ["start end", "end start"],
	});
	const expandWidth = useTransform(
		expansionProgress,
		[0.1, 0.55],
		["84%", "100%"],
	);
	const expandScale = useTransform(
		expansionProgress,
		[0.1, 0.55],
		[0.94, 1.0],
	);
	const expandRadius = useTransform(
		expansionProgress,
		[0.1, 0.55],
		["16px", "0px"],
	);

	// Section 2 Parallax
	const identityRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress: identityProgress } = useScroll({
		target: identityRef,
		offset: ["start end", "end start"],
	});
	const identityImageY = useTransform(identityProgress, [0, 1], ["-8%", "8%"]);

	return (
		<div
			onMouseMove={handleMouseMove}
			className="min-h-screen bg-[#F7F7F4] dark:bg-[#080808] text-[#111111] dark:text-[#F5F5F2] selection:bg-[#111111] selection:text-[#F7F7F4] dark:selection:bg-[#F5F5F2] dark:selection:text-[#080808] transition-colors duration-500 font-sans"
		>
			{/* ══════════════════════════════════════════════════════════════
			    SECTION A — REFINED MONOCHROME NAVIGATION
			══════════════════════════════════════════════════════════════ */}
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
					scrolled
						? "bg-[#F7F7F4]/90 dark:bg-[#080808]/90 backdrop-blur-md border-b border-[#DEDEDA] dark:border-[#292929] py-3.5"
						: "bg-transparent py-6"
				}`}
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex items-center justify-between">
					{/* Brand Lockup */}
					<Link
						href="/"
						className="group flex items-center space-x-3.5 transition-opacity hover:opacity-80"
						title="Evaluna — Home"
					>
						<img
							src="/logo.jpg"
							alt="Evaluna"
							className="h-8 w-8 rounded-md object-cover border border-[#DEDEDA] dark:border-[#292929] transition-transform duration-300 group-hover:scale-105"
						/>
						<div className="flex flex-col">
							<span className="text-base font-semibold tracking-tight text-[#111111] dark:text-[#F5F5F2] uppercase font-serif">
								EVALUNA
							</span>
							<span className="text-[9px] tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0] font-mono -mt-0.5">
								Bhopal & Berasia • 23.26° N
							</span>
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center space-x-8 text-[11px] tracking-widest uppercase font-mono text-[#666666] dark:text-[#A3A3A0]">
						<Link
							href="#identity"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							01 Identity
						</Link>
						<Link
							href="#disciplines"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							02 Disciplines
						</Link>
						<Link
							href="#philosophy"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							03 Philosophy
						</Link>
						<Link
							href="#geography"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							04 Geography
						</Link>
						<Link
							href="#dialogue"
							className="transition-colors hover:text-[#111111] dark:hover:text-[#F5F5F2]"
						>
							05 Dialogue
						</Link>
					</nav>

					{/* Right Utility Actions */}
					<div className="hidden md:flex items-center space-x-4">
						<LocaleSwitcher />
						<ThemeToggle />
						<Link
							href="/login"
							className="text-[11px] tracking-widest uppercase font-mono text-[#666666] dark:text-[#A3A3A0] hover:text-[#111111] dark:hover:text-[#F5F5F2] transition-colors px-2 py-1"
						>
							Sign-In
						</Link>
						<Link
							href="#dialogue"
							className="text-xs uppercase tracking-wider font-mono px-4 py-2 border border-[#111111] dark:border-[#F5F5F2] text-[#111111] dark:text-[#F5F5F2] hover:bg-[#111111] hover:text-[#F7F7F4] dark:hover:bg-[#F5F5F2] dark:hover:text-[#080808] transition-all duration-200"
						>
							Inquire
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<div className="flex items-center space-x-2 md:hidden">
						<ThemeToggle />
						<button
							type="button"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className="p-2 text-[#111111] dark:text-[#F5F5F2] focus:outline-none"
							aria-label="Toggle navigation menu"
						>
							{mobileMenuOpen ? (
								<X className="h-6 w-6" />
							) : (
								<Menu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>

				{/* Mobile Drawer */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="md:hidden border-b border-[#DEDEDA] dark:border-[#292929] bg-[#F7F7F4] dark:bg-[#080808] px-6 py-8 overflow-hidden"
						>
							<div className="flex flex-col space-y-6 text-sm tracking-widest uppercase font-mono">
								<Link
									href="#identity"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] dark:text-[#A3A3A0] hover:text-[#111111] dark:hover:text-[#F5F5F2]"
								>
									01 Identity
								</Link>
								<Link
									href="#disciplines"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] dark:text-[#A3A3A0] hover:text-[#111111] dark:hover:text-[#F5F5F2]"
								>
									02 Disciplines
								</Link>
								<Link
									href="#philosophy"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] dark:text-[#A3A3A0] hover:text-[#111111] dark:hover:text-[#F5F5F2]"
								>
									03 Philosophy
								</Link>
								<Link
									href="#geography"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] dark:text-[#A3A3A0] hover:text-[#111111] dark:hover:text-[#F5F5F2]"
								>
									04 Geography
								</Link>
								<Link
									href="#dialogue"
									onClick={() => setMobileMenuOpen(false)}
									className="text-[#666666] dark:text-[#A3A3A0] hover:text-[#111111] dark:hover:text-[#F5F5F2]"
								>
									05 Dialogue
								</Link>
								<div className="pt-4 border-t border-[#DEDEDA] dark:border-[#292929] flex flex-col space-y-3">
									<Link
										href="/login"
										onClick={() => setMobileMenuOpen(false)}
										className="text-xs uppercase tracking-wider font-mono text-[#666666] dark:text-[#A3A3A0]"
									>
										Employee Sign-In
									</Link>
									<Link
										href="/docs"
										onClick={() => setMobileMenuOpen(false)}
										className="text-xs uppercase tracking-wider font-mono text-[#666666] dark:text-[#A3A3A0]"
									>
										Documentation & Manuals
									</Link>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</header>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION B — CINEMATIC EDITORIAL HERO
			══════════════════════════════════════════════════════════════ */}
			<section className="relative pt-32 sm:pt-40 lg:pt-44 pb-20 sm:pb-28 lg:pb-36 border-b border-[#DEDEDA] dark:border-[#292929] overflow-hidden">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
					{/* Editorial Header Metadata */}
					<motion.div
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
						className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-10 border-b border-[#DEDEDA] dark:border-[#292929] text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]"
					>
						<span className="flex items-center space-x-2">
							<span className="h-1.5 w-1.5 rounded-full bg-[#111111] dark:bg-[#F5F5F2]" />
							<span>INDEX 01 / ARCHITECTURAL IDENTITY</span>
						</span>
						<span>CENTRAL INDIA REGIONAL HUB • BHOPAL & BERASIA</span>
						<span className="hidden lg:inline">COORDINATES: 23.2599° N, 77.4126° E</span>
					</motion.div>

					{/* Asymmetric Typography & Image Reveal Composition */}
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pt-12 lg:pt-16 items-end">
						{/* Left: Oversized Editorial Statement */}
						<div className="lg:col-span-7 space-y-8 sm:space-y-10">
							<motion.h1
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
								className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-normal tracking-[-0.035em] text-[#111111] dark:text-[#F5F5F2] leading-[0.92] font-serif"
							>
								A clearer
								<br />
								<span className="italic font-light">way forward.</span>
							</motion.h1>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
								className="max-w-xl space-y-6 pt-2"
							>
								<p className="text-base sm:text-lg text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
									Evaluna designs physical commerce systems, spatial logistics, and digital infrastructure built for permanence. Rooted in the central Indian transit corridor of Bhopal and Berasia, we build clarity into complex human operations.
								</p>

								<div className="flex flex-wrap items-center gap-4 pt-2">
									<Link
										href="#identity"
										className="group inline-flex items-center space-x-3 text-xs uppercase tracking-wider font-mono px-6 py-3.5 bg-[#111111] dark:bg-[#F5F5F2] text-[#F7F7F4] dark:text-[#080808] transition-transform duration-200 hover:scale-[1.02]"
									>
										<span>Explore The Work</span>
										<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
									</Link>
									<Link
										href="#dialogue"
										className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-mono px-6 py-3.5 border border-[#DEDEDA] dark:border-[#292929] text-[#111111] dark:text-[#F5F5F2] hover:border-[#111111] dark:hover:border-[#F5F5F2] transition-colors"
									>
										<span>Direct Inquiry</span>
									</Link>
								</div>
							</motion.div>
						</div>

						{/* Right: Architectural Photographic Plate (Masked Reveal & Desktop Pointer Shift) */}
						<div className="lg:col-span-5 relative">
							<motion.div
								style={{
									x: springX,
									y: springY,
								}}
								className="relative w-full aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] overflow-hidden border border-[#DEDEDA] dark:border-[#292929] bg-[#F0F0ED] dark:bg-[#111111]"
							>
								{/* Smooth Cross-Fading Photographic Showcase (6 Vivid Slides) */}
								<AnimatePresence mode="wait">
									<motion.div
										key={activeSlide}
										initial={{ opacity: 0, scale: 1.05 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.98 }}
										transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
										className="relative w-full h-full"
									>
										<Image
											src={HERO_SLIDES[activeSlide]?.url ?? IMAGERY.heroStructure}
											alt={HERO_SLIDES[activeSlide]?.alt ?? "Evaluna Architecture"}
											fill
											priority
											sizes="(max-width: 1024px) 100vw, 42vw"
											className="object-cover saturate-[1.18] contrast-[1.04]"
										/>
										{/* Subtle tonal grain & overlay */}
										<div className="absolute inset-0 bg-[#111111]/5 dark:bg-black/15 mix-blend-multiply pointer-events-none" />
									</motion.div>
								</AnimatePresence>

								{/* Photographic Metadata Badge & Interactive Slide Indicators */}
								<div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 bg-[#F7F7F4]/95 dark:bg-[#080808]/95 backdrop-blur-md border border-[#DEDEDA] dark:border-[#292929] p-3 text-[#111111] dark:text-[#F5F5F2]">
									<div className="flex items-center justify-between text-[9px] font-mono tracking-widest uppercase">
										<span>{HERO_SLIDES[activeSlide]?.plate}</span>
										<span>{HERO_SLIDES[activeSlide]?.location}</span>
									</div>
									{/* Progress Dots / Bars */}
									<div className="flex items-center space-x-1.5 pt-1">
										{HERO_SLIDES.map((_, idx) => (
											<button
												key={`hero-dot-${idx}`}
												type="button"
												onClick={() => setActiveSlide(idx)}
												className={`h-1 rounded-full transition-all duration-500 ${
													activeSlide === idx
														? "w-8 bg-[#111111] dark:bg-[#F5F5F2]"
														: "w-2 bg-[#DEDEDA] dark:bg-[#404040] hover:bg-[#888888]"
												}`}
												title={`View Plate 0${idx + 1}`}
											/>
										))}
									</div>
								</div>
							</motion.div>
						</div>
					</div>

					{/* Bottom Minimal Scroll Indicator */}
					<div className="pt-16 sm:pt-20 flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
						<span className="flex items-center space-x-2">
							<ArrowDown className="h-3.5 w-3.5 animate-bounce" />
							<span>SCROLL TO UNCOVER</span>
						</span>
						<span className="hidden sm:inline">ESTABLISHED FOR ENDURANCE</span>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION C — COMPANY IDENTITY (Masked Scroll Reveal)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="identity"
				ref={identityRef}
				className="py-24 sm:py-32 lg:py-40 border-b border-[#DEDEDA] dark:border-[#292929] relative overflow-hidden"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
						{/* Left: Identity Manifesto */}
						<div className="lg:col-span-5 space-y-8 sticky top-28">
							<div className="text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0] flex items-center space-x-2">
								<span className="h-1.5 w-1.5 rounded-full bg-[#111111] dark:bg-[#F5F5F2]" />
								<span>02 / THE PREMISE</span>
							</div>

							<h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal leading-[1.08] tracking-[-0.02em]">
								Software is empty without physical reality.
							</h2>

							<div className="space-y-4 text-sm sm:text-base text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
								<p>
									Most commercial software is built in insulation—designed in air-conditioned offices for abstract metrics. When tested by warehouse dust, spotty cellular networks, or rural retail counter rushes, it stumbles.
								</p>
								<p>
									Evaluna operates differently. Founded with deep operational ties to Bhopal and Berasia, our systems are born from active freight terminals, wholesale grain corridors, and real human transaction desks.
								</p>
							</div>

							<div className="pt-6 border-t border-[#DEDEDA] dark:border-[#292929] space-y-4 font-mono text-xs">
								<div className="flex items-center justify-between text-[#111111] dark:text-[#F5F5F2]">
									<span>CENTRAL LOGISTICS HEADQUARTERS</span>
									<span className="text-[#666666] dark:text-[#A3A3A0]">VIDISHA ROAD, BERASIA</span>
								</div>
								<div className="flex items-center justify-between text-[#111111] dark:text-[#F5F5F2]">
									<span>CORE METROPOLITAN PRESENCE</span>
									<span className="text-[#666666] dark:text-[#A3A3A0]">BHOPAL, MADHYA PRADESH</span>
								</div>
								<div className="flex items-center justify-between text-[#111111] dark:text-[#F5F5F2]">
									<span>ARCHITECTURAL STANDARD</span>
									<span className="text-[#666666] dark:text-[#A3A3A0]">DETERMINISTIC & IMMUTABLE</span>
								</div>
							</div>
						</div>

						{/* Right: Editorial Masked Image Plate with Parallax */}
						<div className="lg:col-span-7 space-y-6">
							<div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden border border-[#DEDEDA] dark:border-[#292929] bg-[#F0F0ED] dark:bg-[#111111]">
								<motion.div
									style={{ y: identityImageY }}
									className="relative w-full h-[120%] -top-[10%]"
								>
									<Image
										src={IMAGERY.identityFacade}
										alt="Evaluna Physical Architectural Form"
										fill
										sizes="(max-width: 1024px) 100vw, 58vw"
										className="object-cover saturate-[1.12] contrast-[1.02]"
									/>
								</motion.div>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
								<span>FIG. 02 — PHYSICAL SUBSTRATE & ARCHITECTURAL ANCHOR</span>
								<span>LAT: 23.2599° N • ELEVATION: 527M</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION D — SIGNATURE SCROLL-EXPANDING PHOTOGRAPHIC CANVAS
			══════════════════════════════════════════════════════════════ */}
			<section
				ref={expansionContainerRef}
				className="py-28 sm:py-36 lg:py-44 border-b border-[#DEDEDA] dark:border-[#292929] relative overflow-hidden"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-12 sm:mb-16">
					<div className="max-w-2xl space-y-4">
						<span className="text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
							03 / SCALE IN MOTION
						</span>
						<h2 className="text-3xl sm:text-5xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal leading-tight tracking-[-0.02em]">
							Movement at the scale of real geography.
						</h2>
						<p className="text-sm sm:text-base text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
							Scale is not a server metric. It is the physical rhythm of goods arriving on trucks at sunrise, warehouse workers scanning pallets with precision, and transparent accounting closing at nightfall.
						</p>
					</div>
				</div>

				{/* Scroll-Driven Expanding Photographic Frame */}
				<div className="w-full flex justify-center">
					<motion.div
						style={{
							width: prefersReducedMotion ? "100%" : expandWidth,
							scale: prefersReducedMotion ? 1 : expandScale,
							borderRadius: prefersReducedMotion ? "0px" : expandRadius,
						}}
						className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden border-y border-[#DEDEDA] dark:border-[#292929] bg-[#F0F0ED] dark:bg-[#111111]"
					>
						<Image
							src={IMAGERY.expandingLogistics}
							alt="Evaluna Spatial Logistics & Warehouse Architecture"
							fill
							sizes="100vw"
							className="object-cover saturate-[1.18] contrast-[1.05]"
						/>
						{/* Subtle gradient vignette */}
						<div className="absolute inset-0 bg-gradient-to-t from-[#080808]/70 via-transparent to-transparent pointer-events-none" />

						{/* Text overlay within expanding canvas */}
						<div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 right-6 sm:right-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
							<div className="space-y-1">
								<span className="text-[10px] font-mono tracking-widest uppercase opacity-75">
									SYSTEM PERSPECTIVE
								</span>
								<h3 className="text-xl sm:text-3xl font-serif font-light tracking-tight">
									Automated FEFO Lot Allocation & Multi-Warehouse Dispatch
								</h3>
							</div>
							<span className="text-[10px] font-mono tracking-widest uppercase opacity-75 shrink-0">
								BERASIA DISTRIBUTION CORRIDOR
							</span>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION E — DISCIPLINES & CAPABILITIES (Asymmetric Editorial)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="disciplines"
				className="py-24 sm:py-32 lg:py-40 border-b border-[#DEDEDA] dark:border-[#292929]"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-24 sm:space-y-32">
					{/* Section Header */}
					<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-[#DEDEDA] dark:border-[#292929]">
						<div className="space-y-2">
							<span className="text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
								04 / DISCIPLINES
							</span>
							<h2 className="text-4xl sm:text-6xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal tracking-[-0.025em]">
								What Evaluna engineers.
							</h2>
						</div>
						<p className="max-w-md text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
							Three integrated pillars designed to replace operational chaos with quiet, uncompromising structural clarity.
						</p>
					</div>

					{/* Editorial Sequence of Disciplines */}
					{DISCIPLINES.map((item, index) => {
						const isEven = index % 2 === 0;
						return (
							<div
								key={item.number}
								className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center ${
									isEven ? "" : "lg:flex-row-reverse"
								}`}
							>
								{/* Photographic Plate */}
								<div className={`lg:col-span-7 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
									<div
										className={`relative w-full ${item.aspect} overflow-hidden border border-[#DEDEDA] dark:border-[#292929] bg-[#F0F0ED] dark:bg-[#111111] group`}
									>
										<Image
											src={item.image}
											alt={item.title}
											fill
											sizes="(max-width: 1024px) 100vw, 58vw"
											className="object-cover saturate-[1.14] contrast-[1.04] transition-transform duration-700 group-hover:scale-105"
										/>
										<div className="absolute bottom-3 left-3 text-[9px] font-mono tracking-widest uppercase bg-[#F7F7F4]/90 dark:bg-[#080808]/90 px-2.5 py-1 text-[#111111] dark:text-[#F5F5F2] border border-[#DEDEDA] dark:border-[#292929]">
											{item.coordinates}
										</div>
									</div>
								</div>

								{/* Editorial Content Column */}
								<div className={`lg:col-span-5 space-y-6 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
									<div className="flex items-center space-x-3 text-xs font-mono text-[#666666] dark:text-[#A3A3A0]">
										<span className="font-semibold text-[#111111] dark:text-[#F5F5F2]">
											[{item.number}]
										</span>
										<span className="h-px w-8 bg-[#DEDEDA] dark:bg-[#292929]" />
										<span className="tracking-widest uppercase">{item.tagline}</span>
									</div>

									<h3 className="text-2xl sm:text-3xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal leading-snug">
										{item.title}
									</h3>

									<p className="text-sm sm:text-base text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
										{item.description}
									</p>

									<ul className="space-y-2.5 pt-4 border-t border-[#DEDEDA] dark:border-[#292929] text-xs font-mono text-[#666666] dark:text-[#A3A3A0]">
										{item.details.map((detail, dIdx) => (
											<li key={dIdx} className="flex items-center space-x-2.5">
												<span className="h-1 w-1 bg-[#111111] dark:bg-[#F5F5F2]" />
												<span>{detail}</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION F — WORKING PHILOSOPHY (The Four Principles)
			══════════════════════════════════════════════════════════════ */}
			<section
				id="philosophy"
				className="py-24 sm:py-32 lg:py-40 border-b border-[#DEDEDA] dark:border-[#292929]"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
						{/* Left Sticky Header */}
						<div className="lg:col-span-4 space-y-4 lg:sticky lg:top-28 self-start">
							<span className="text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
								05 / PHILOSOPHY
							</span>
							<h2 className="text-3xl sm:text-5xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal leading-tight tracking-[-0.02em]">
								How we approach design.
							</h2>
							<p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
								Every engineering decision balances functional durability with aesthetic restraint.
							</p>
						</div>

						{/* Right Principles Stack */}
						<div className="lg:col-span-8 divide-y divide-[#DEDEDA] dark:divide-[#292929] border-t border-b border-[#DEDEDA] dark:border-[#292929]">
							{PRINCIPLES.map((principle, pIdx) => (
								<div
									key={principle.number}
									className="py-10 sm:py-14 grid grid-cols-1 sm:grid-cols-12 gap-6 items-baseline transition-colors hover:bg-[#F0F0ED]/40 dark:hover:bg-[#111111]/40 px-2 sm:px-4"
								>
									<span className="sm:col-span-2 text-xs font-mono font-semibold text-[#666666] dark:text-[#A3A3A0]">
										[{principle.number}]
									</span>
									<h3 className="sm:col-span-4 text-xl sm:text-2xl font-serif text-[#111111] dark:text-[#F5F5F2]">
										{principle.title}
									</h3>
									<p className="sm:col-span-6 text-sm text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
										{principle.body}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION G — GEOGRAPHY & CENTRAL INDIA NEXUS
			══════════════════════════════════════════════════════════════ */}
			<section
				id="geography"
				className="py-24 sm:py-32 lg:py-40 border-b border-[#DEDEDA] dark:border-[#292929] relative overflow-hidden"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
						{/* Left Column: Geographic Context */}
						<div className="lg:col-span-6 space-y-6">
							<span className="text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
								06 / GEOGRAPHIC GROUNDING
							</span>
							<h2 className="text-3xl sm:text-5xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal leading-tight tracking-[-0.025em]">
								Bhopal, Berasia, and the central corridor.
							</h2>
							<div className="space-y-4 text-sm sm:text-base text-[#666666] dark:text-[#A3A3A0] font-light leading-relaxed">
								<p>
									Located at the geographic center of India, Madhya Pradesh connects northern transport arteries with southern commercial markets. Our operations in Berasia and Bhopal stand at this vital crossroads.
								</p>
								<p>
									By rooting ourselves here rather than in distant technology hubs, we maintain direct daily contact with the realities of central Indian commerce: grain wholesale yards, high-frequency consumer distribution, and local enterprise leadership.
								</p>
							</div>

							<div className="pt-6 border-t border-[#DEDEDA] dark:border-[#292929] grid grid-cols-2 gap-4 text-xs font-mono">
								<div>
									<span className="block text-[#666666] dark:text-[#A3A3A0]">COORDINATES</span>
									<span className="font-semibold text-[#111111] dark:text-[#F5F5F2]">23.2599° N, 77.4126° E</span>
								</div>
								<div>
									<span className="block text-[#666666] dark:text-[#A3A3A0]">ELEVATION</span>
									<span className="font-semibold text-[#111111] dark:text-[#F5F5F2]">527 METERS MSL</span>
								</div>
							</div>
						</div>

						{/* Right Column: Landscape Photographic Plate */}
						<div className="lg:col-span-6">
							<div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden border border-[#DEDEDA] dark:border-[#292929] bg-[#F0F0ED] dark:bg-[#111111]">
								<Image
									src={IMAGERY.centralIndiaHorizon}
									alt="Central India Topography & Geographic Horizon"
									fill
									sizes="(max-width: 1024px) 100vw, 50vw"
									className="object-cover saturate-[1.20] contrast-[1.05]"
								/>
								<div className="absolute bottom-3 left-3 text-[9px] font-mono tracking-widest uppercase bg-[#F7F7F4]/90 dark:bg-[#080808]/90 px-3 py-1 text-[#111111] dark:text-[#F5F5F2] border border-[#DEDEDA] dark:border-[#292929]">
									CENTRAL PLATEAU • MADHYA PRADESH
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION H — CLOSING DIALOGUE & DIRECT INQUIRY
			══════════════════════════════════════════════════════════════ */}
			<section
				id="dialogue"
				className="py-28 sm:py-36 lg:py-48 border-b border-[#DEDEDA] dark:border-[#292929] relative"
			>
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
					<div className="max-w-4xl space-y-12">
						<div className="space-y-4">
							<span className="text-[10px] font-mono tracking-widest uppercase text-[#666666] dark:text-[#A3A3A0]">
								07 / INITIATE DIALOGUE
							</span>
							<h2 className="text-5xl sm:text-7xl lg:text-8xl font-serif text-[#111111] dark:text-[#F5F5F2] font-normal tracking-[-0.035em] leading-[0.95]">
								Start a conversation.
							</h2>
						</div>

						<p className="text-base sm:text-xl text-[#666666] dark:text-[#A3A3A0] font-light max-w-2xl leading-relaxed">
							Whether discussing enterprise logistics, bespoke digital architecture, or physical distribution systems, our leadership team welcomes direct, thoughtful exchange.
						</p>

						<div className="flex flex-wrap items-center gap-4 pt-4">
							<Link
								href="/contact"
								className="group inline-flex items-center space-x-3 text-xs uppercase tracking-wider font-mono px-8 py-4 bg-[#111111] dark:bg-[#F5F5F2] text-[#F7F7F4] dark:text-[#080808] transition-transform duration-200 hover:scale-[1.02]"
							>
								<span>Initiate Inquiry</span>
								<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Link>
							<Link
								href="/login"
								className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-mono px-8 py-4 border border-[#DEDEDA] dark:border-[#292929] text-[#111111] dark:text-[#F5F5F2] hover:border-[#111111] dark:hover:border-[#F5F5F2] transition-colors"
							>
								<span>Employee Portal</span>
							</Link>
							<Link
								href="/docs"
								className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider font-mono px-8 py-4 border border-[#DEDEDA] dark:border-[#292929] text-[#111111] dark:text-[#F5F5F2] hover:border-[#111111] dark:hover:border-[#F5F5F2] transition-colors"
							>
								<span>Documentation & SOPs</span>
							</Link>
						</div>

						<div className="pt-12 border-t border-[#DEDEDA] dark:border-[#292929] grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono text-[#666666] dark:text-[#A3A3A0]">
							<div>
								<span className="block text-[10px] uppercase text-[#111111] dark:text-[#F5F5F2] mb-1">
									PHYSICAL HEADQUARTERS
								</span>
								<p className="leading-relaxed">
									Near Bank of India, Vidisha Road
									<br />
									Berasia, Bhopal, MP — 463106
								</p>
							</div>
							<div>
								<span className="block text-[10px] uppercase text-[#111111] dark:text-[#F5F5F2] mb-1">
									ELECTRONIC DISPATCH
								</span>
								<p className="leading-relaxed">
									support@evaluna.com
									<br />
									contact@evaluna.com
								</p>
							</div>
							<div>
								<span className="block text-[10px] uppercase text-[#111111] dark:text-[#F5F5F2] mb-1">
									DIRECT INQUIRY LINE
								</span>
								<p className="leading-relaxed">
									+91 96306 49277
									<br />
									Mon — Sat • 09:00 - 19:00 IST
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════════════════════════
			    SECTION I — UNDERSTATED MONOCHROME FOOTER
			══════════════════════════════════════════════════════════════ */}
			<footer className="py-16 sm:py-20 bg-[#F7F7F4] dark:bg-[#080808] transition-colors">
				<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-[#DEDEDA] dark:border-[#292929]">
						<div className="flex items-center space-x-3.5">
							<img
								src="/logo.jpg"
								alt="Evaluna"
								className="h-7 w-7 rounded-md object-cover border border-[#DEDEDA] dark:border-[#292929]"
							/>
							<span className="font-semibold text-sm tracking-tight text-[#111111] dark:text-[#F5F5F2] uppercase font-serif">
								EVALUNA TECHNOLOGIES PVT. LTD.
							</span>
						</div>

						<div className="flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#666666] dark:text-[#A3A3A0]">
							<Link
								href="/privacy"
								className="hover:text-[#111111] dark:hover:text-[#F5F5F2] transition-colors"
							>
								Privacy Policy
							</Link>
							<Link
								href="/terms"
								className="hover:text-[#111111] dark:hover:text-[#F5F5F2] transition-colors"
							>
								Terms of Service
							</Link>
							<Link
								href="/status"
								className="hover:text-[#111111] dark:hover:text-[#F5F5F2] transition-colors"
							>
								System Status
							</Link>
							<Link
								href="/docs"
								className="hover:text-[#111111] dark:hover:text-[#F5F5F2] transition-colors"
							>
								Documentation
							</Link>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[10px] font-mono text-[#666666] dark:text-[#A3A3A0]">
						<span>
							© {new Date().getFullYear()} EVALUNA TECHNOLOGIES PVT. LTD. ALL RIGHTS RESERVED.
						</span>
						<span>
							DESIGNED & ENGINEERED IN BHOPAL & BERASIA, MADHYA PRADESH
						</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
