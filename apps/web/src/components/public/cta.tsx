"use client";

import { Button } from "@evaluna/ui/components/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
	return (
		<section className="public-section">
			<div className="public-container">
				<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-800 p-12 text-center text-white md:p-16">
					{/* Background Pattern */}
					<div className="absolute inset-0 opacity-10">
						<svg width="100%" height="100%" viewBox="0 0 800 400">
							<defs>
								<pattern
									id="grid"
									width="40"
									height="40"
									patternUnits="userSpaceOnUse"
								>
									<path
										d="M 40 0 L 0 0 0 40"
										fill="none"
										stroke="white"
										strokeWidth="1"
									/>
								</pattern>
							</defs>
							<rect width="100%" height="100%" fill="url(#grid)" />
						</svg>
					</div>

					<div className="relative z-10">
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
							className="public-h2 mb-4 text-white"
						>
							Ready to organize your business?
						</motion.h2>

						<motion.p
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="public-lead mx-auto mb-8 max-w-2xl text-blue-100"
						>
							Join thousands of rural businesses using Evalona to manage orders,
							inventory and customers more efficiently.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6, delay: 0.4 }}
							className="flex flex-col justify-center gap-4 sm:flex-row"
						>
							<Button
								size="lg"
								className="bg-white text-blue-600 hover:bg-blue-50"
								asChild
							>
								<Link href="/signup">
									Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="border-white text-white hover:bg-white/10"
								asChild
							>
								<Link href="/product">See How It Works</Link>
							</Button>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}

