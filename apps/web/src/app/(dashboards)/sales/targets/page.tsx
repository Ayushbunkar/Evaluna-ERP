"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { motion } from "framer-motion";

export default function TargetsPage() {
	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 pb-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Sales Targets</h1>
					<p className="mt-1 text-muted-foreground">
						Monitor your team's sales targets and performance.
					</p>
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 15 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<Card>
					<CardHeader>
						<CardTitle>Current Targets</CardTitle>
						<CardDescription>Monthly target overview</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 text-muted-foreground">
							Interactive target visualizations will be placed here.
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
