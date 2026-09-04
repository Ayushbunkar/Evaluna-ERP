"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { HistoryIcon, Loader2Icon } from "lucide-react";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function ActivityPage() {
	const trpc = useTRPC();

	// Query real audit logs
	const { data: activity = [], isLoading } =
		trpc.manager.getActivity.useQuery();

	return (
		<PageTransition className="space-y-6">
			<div>
				<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
					<HistoryIcon className="h-6 w-6 text-blue-600" />
					Centralized Activity Timeline
				</h2>
				<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
					Audit chronological operational events compiled automatically from
					database ledgers.
				</p>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="font-bold text-base">
						Chronological Activity Stream
					</CardTitle>
					<CardDescription>
						Up to 100 latest transactional, logistical, and workflow records
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2Icon className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-slate-200">
							{activity.map((act) => (
								<div
									key={act.id}
									className="group relative flex items-start gap-4 pb-2 pl-8"
								>
									{/* Timeline dot */}
									<div className="absolute top-1.5 left-[5px] h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white transition-colors group-hover:bg-blue-500 dark:bg-slate-950" />

									<div className="flex-1 space-y-1">
										<div className="flex items-center justify-between">
											<span className="font-bold text-blue-600 text-xs uppercase tracking-wide">
												{act.action}
											</span>
											<span className="text-[10px] text-slate-400">
												{act.created_at
													? new Date(act.created_at).toLocaleString()
													: ""}
											</span>
										</div>
										<p className="font-medium text-slate-700 text-xs dark:text-slate-300">
											Operational shift on {act.entity_type} #ID {act.entity_id}
										</p>
										<p className="text-[10px] text-slate-400">
											Captured Operator / Staff:{" "}
											{act.user_id ?? "System Auto-Trigger"}
										</p>
									</div>
								</div>
							))}
							{activity.length === 0 && (
								<div className="py-12 text-center text-slate-400 text-xs">
									No activity timelines recorded yet.
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
