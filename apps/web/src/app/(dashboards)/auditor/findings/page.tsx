"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	ActivityIcon,
	CalendarCheckIcon,
	CheckCircle2Icon,
	ShieldIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function AuditorFindingsPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: findings,
		isLoading,
		error,
	} = trpc.auditor.getFindings.useQuery();

	if (isLoading)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Loading...
			</div>
		);
	if (error)
		return (
			<div className="flex h-[200px] items-center justify-center">
				Error loading findings
			</div>
		);

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Audit Findings
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						List of audit findings and issues
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Audit Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/auditor">
							<ShieldIcon className="mr-1 h-3 w-3" /> Back to Dashboard
						</Link>
					</Button>
				</div>
			</div>

			{!findings || findings.length === 0 ? (
				<div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
					No findings found
				</div>
			) : (
				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead className="text-left">ID</TableHead>
								<TableHead className="text-left">Title</TableHead>
								<TableHead className="text-left">Type</TableHead>
								<TableHead className="text-left">Severity</TableHead>
								<TableHead className="text-left">Status</TableHead>
								<TableHead className="text-left">Date</TableHead>
								<TableHead className="text-left">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{findings.map((f) => (
								<TableRow key={f.id}>
									<TableCell>{f.id}</TableCell>
									<TableCell>{f.title}</TableCell>
									<TableCell>{f.type}</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${f.severity === "critical" ? "bg-red-100 text-red-800" : f.severity === "high" ? "bg-orange-100 text-orange-800" : f.severity === "medium" ? "bg-yellow-100 text-yellow-800" : f.severity === "low" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
										>
											{f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}
										</span>
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-0.5 text-xs ${f.status === "open" ? "bg-red-100 text-red-800" : f.status === "under_review" ? "bg-yellow-100 text-yellow-800" : f.status === "corrective_action_required" ? "bg-orange-100 text-orange-800" : f.status === "resolved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
										>
											{f.status
												.split("_")
												.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
												.join(" ")}
										</span>
									</TableCell>
									<TableCell>{f.date}</TableCell>
									<TableCell className="flex flex-row gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`View finding ${f.id}`)}
										>
											<ActivityIcon className="mr-1 h-3 w-3" /> View
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => alert(`Update finding ${f.id}`)}
										>
											<ShieldIcon className="mr-1 h-3 w-3" /> Update
										</Button>
										{f.status !== "resolved" && (
											<Button
												variant="outline"
												size="xs"
												onClick={() =>
													alert(`Mark finding ${f.id} as resolved`)
												}
											>
												<CheckCircle2Icon className="mr-1 h-3 w-3" /> Resolve
											</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</PageTransition>
	);
}
