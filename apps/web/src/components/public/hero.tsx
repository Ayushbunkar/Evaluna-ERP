"use client";

import { Button } from "@evaluna/ui/components/button";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function Hero() {
	const [isThreeJSReady, setIsThreeJSReady] = useState(false);
	const threeJSRef = useRef<HTMLDivElement>(null);

	// Simulate Three.js loading for demo purposes
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsThreeJSReady(true);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="relative flex h-[calc(100vh-80px)] min-h-[600px] items-center overflow-hidden">
			<div className="public-container relative z-10">
				<div className="grid h-full items-center gap-12 lg:grid-cols-2">
					{/* Left Content */}
					<div className="flex flex-col justify-center gap-8">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="flex flex-col gap-6"
						>
							<h1 className="public-h1 text-foreground">
								Built for the businesses
								<br />
								behind every local market
							</h1>
							<p className="public-lead max-w-lg text-muted-foreground">
								Powering smarter distribution, bulk ordering and everyday
								business across rural India.
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="flex flex-col gap-4 sm:flex-row"
						>
							<Button size="lg" asChild>
								<Link href="/product">
									Explore Evalona <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button variant="outline" size="lg" asChild>
								<Link href="/login">Login to Dashboard</Link>
							</Button>
						</motion.div>

						{/* Scroll indicator */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.4 }}
							className="absolute bottom-8 left-0 flex flex-col items-center gap-2"
						>
							<motion.div
								animate={{ y: [0, 10, 0] }}
								transition={{
									repeat: Number.POSITIVE_INFINITY,
									duration: 2,
									ease: "easeInOut",
								}}
							>
								<ChevronDown className="h-6 w-6 text-muted-foreground" />
							</motion.div>
							<span className="text-muted-foreground text-xs uppercase tracking-wider">
								Scroll to Explore
							</span>
						</motion.div>
					</div>

					{/* Right Visual - Three.js Placeholder */}
					<div className="relative hidden h-[60vh] min-h-[400px] lg:block">
						<div
							ref={threeJSRef}
							className="absolute inset-0 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
						>
							{isThreeJSReady ? (
								<div className="relative flex h-full w-full items-center justify-center">
									{/* Three.js Visualization Placeholder */}
									<div className="absolute inset-0 opacity-20">
										<svg width="100%" height="100%" viewBox="0 0 400 400">
											{/* Distribution Network Visualization */}
											<defs>
												<linearGradient
													id="lineGradient"
													x1="0%"
													y1="0%"
													x2="100%"
													y2="100%"
												>
													<stop
														offset="0%"
														stopColor="#3b82f6"
														stopOpacity="0.8"
													/>
													<stop
														offset="100%"
														stopColor="#1e40af"
														stopOpacity="0.8"
													/>
												</linearGradient>
											</defs>

											{/* Warehouse Node */}
											<circle
												cx="100"
												cy="100"
												r="12"
												fill="#3b82f6"
												opacity="0.8"
											/>
											<text
												x="100"
												y="140"
												textAnchor="middle"
												fill="#6b7280"
												fontSize="12"
											>
												Warehouse
											</text>

											{/* Distributor Node */}
											<circle
												cx="200"
												cy="200"
												r="12"
												fill="#3b82f6"
												opacity="0.8"
											/>
											<text
												x="200"
												y="240"
												textAnchor="middle"
												fill="#6b7280"
												fontSize="12"
											>
												Distributor
											</text>

											{/* Shopkeeper Node */}
											<circle
												cx="300"
												cy="100"
												r="12"
												fill="#3b82f6"
												opacity="0.8"
											/>
											<text
												x="300"
												y="140"
												textAnchor="middle"
												fill="#6b7280"
												fontSize="12"
											>
												Shopkeeper
											</text>

											{/* Customer Node */}
											<circle
												cx="200"
												cy="300"
												r="12"
												fill="#3b82f6"
												opacity="0.8"
											/>
											<text
												x="200"
												y="340"
												textAnchor="middle"
												fill="#6b7280"
												fontSize="12"
											>
												Customer
											</text>

											{/* Connecting Lines */}
											<path
												d="M 100 100 L 200 200"
												stroke="url(#lineGradient)"
												strokeWidth="2"
												fill="none"
											/>
											<path
												d="M 200 200 L 300 100"
												stroke="url(#lineGradient)"
												strokeWidth="2"
												fill="none"
											/>
											<path
												d="M 200 200 L 200 300"
												stroke="url(#lineGradient)"
												strokeWidth="2"
												fill="none"
											/>
										</svg>
									</div>

									{/* Rural Business Image Overlay */}
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="flex h-48 w-64 items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700">
											<span className="text-gray-500 text-sm dark:text-gray-400">
												Rural Business Image
											</span>
										</div>
									</div>
								</div>
							) : (
								<div className="flex h-full w-full items-center justify-center">
									<div className="animate-pulse text-muted-foreground">
										Loading 3D Visualization...
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Background Gradient */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute top-0 left-0 h-96 w-96 -translate-x-48 -translate-y-48 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent" />
				<div className="absolute right-0 bottom-0 h-96 w-96 translate-x-48 translate-y-48 rounded-full bg-gradient-to-tl from-blue-500/10 to-transparent" />
			</div>
		</section>
	);
}

