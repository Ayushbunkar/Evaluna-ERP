"use client";

import { Button } from "@evaluna/ui/components/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function BusinessStory() {
	return (
		<section className="public-section">
			<div className="public-container">
				<div className="grid items-center gap-12 lg:grid-cols-2">
					{/* Left Content */}
					<div className="flex flex-col gap-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<h2 className="public-h2 text-foreground">
								The last mile of business
							</h2>
							<p className="public-lead text-muted-foreground">
								Behind every local market is a network of distributors,
								shopkeepers and suppliers. Evalona helps organize that network.
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: 0.2 }}
						>
							<Button variant="outline" size="lg" asChild>
								<Link href="/solutions">
									Learn How It Works <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</motion.div>
					</div>

					{/* Right Visual */}
					<div className="relative h-96 overflow-hidden rounded-lg">
						<div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />

						{/* Rural Marketplace Image Placeholder */}
						<div className="relative z-10 flex h-full w-full items-center justify-center">
							<div className="flex h-full w-full items-center justify-center bg-gray-300 dark:bg-gray-700">
								<span className="text-gray-500 dark:text-gray-400">
									Rural Marketplace Image
								</span>
							</div>
						</div>

						{/* Animated Lines */}
						<div className="pointer-events-none absolute inset-0 z-20">
							<svg
								width="100%"
								height="100%"
								viewBox="0 0 400 300"
								className="h-full w-full"
							>
								<defs>
									<linearGradient
										id="storyGradient"
										x1="0%"
										y1="0%"
										x2="100%"
										y2="100%"
									>
										<stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
										<stop offset="100%" stopColor="#1e40af" stopOpacity="0.6" />
									</linearGradient>
								</defs>

								{/* Decorative animated lines */}
								<motion.path
									d="M 50 50 L 350 50"
									stroke="url(#storyGradient)"
									strokeWidth="1"
									fill="none"
									initial={{ pathLength: 0 }}
									whileInView={{ pathLength: 1 }}
									transition={{ duration: 1, delay: 0.5 }}
									viewport={{ once: true }}
								/>
								<motion.path
									d="M 50 100 L 350 100"
									stroke="url(#storyGradient)"
									strokeWidth="1"
									fill="none"
									initial={{ pathLength: 0 }}
									whileInView={{ pathLength: 1 }}
									transition={{ duration: 1, delay: 0.7 }}
									viewport={{ once: true }}
								/>
								<motion.path
									d="M 50 150 L 350 150"
									stroke="url(#storyGradient)"
									strokeWidth="1"
									fill="none"
									initial={{ pathLength: 0 }}
									whileInView={{ pathLength: 1 }}
									transition={{ duration: 1, delay: 0.9 }}
									viewport={{ once: true }}
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
