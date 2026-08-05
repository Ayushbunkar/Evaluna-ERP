"use client";

import { format } from "date-fns";
import {
	AlertTriangleIcon,
	ClipboardCheckIcon,
	FileWarningIcon,
	SearchIcon,
	UserCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";

export default function AuditDashboard() {
	const [activeTab, setActiveTab] = useState("audits");

	// Using trpc to fetch active audits and discrepancies
	const { data: audits, isLoading: loadingAudits } =
		(trpc.audit as any).listAudits.useQuery();
	const { data: discrepancies, isLoading: loadingDiscrepancies } =
		(trpc.audit as any).listDiscrepancies.useQuery();

	return (
		<div className="fade-in slide-in-from-bottom-4 container mx-auto animate-in space-y-8 p-6 duration-500">
			{/* Header Section */}
			<div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-8 text-white shadow-2xl md:flex-row md:items-center">
				<div className="pointer-events-none absolute top-0 right-0 p-12 opacity-10">
					<ClipboardCheckIcon className="h-64 w-64" />
				</div>
				<div className="relative z-10 space-y-2">
					<h1 className="flex items-center gap-3 font-extrabold text-4xl tracking-tight">
						<ClipboardCheckIcon className="h-10 w-10 text-emerald-400" />
						Audit & Compliance
					</h1>
					<p className="max-w-xl text-lg text-slate-300 leading-relaxed">
						Manage inventory audits, resolve discrepancies, and write-off
						damaged or missing stock.
					</p>
				</div>
				<div className="relative z-10 mt-4 flex flex-col gap-3 sm:flex-row md:mt-0">
					<Link href="/admin/audit/scanner">
						<Button
							size="lg"
							className="border-0 bg-emerald-600 font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-500"
						>
							<UserCheckIcon className="mr-2 h-5 w-5" />
							Auditor Scanner
						</Button>
					</Link>
					<Button
						size="lg"
						variant="outline"
						className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
					>
						Create Audit Plan
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="mb-6 rounded-xl bg-slate-100 p-1">
					<TabsTrigger value="audits" className="rounded-lg px-6 text-base">
						Active Audits
					</TabsTrigger>
					<TabsTrigger
						value="discrepancies"
						className="rounded-lg px-6 text-base"
					>
						Discrepancies & Escalations
						{discrepancies?.filter((d: any) => d.resolution_status === "pending")
							.length ? (
							<Badge variant="destructive" className="ml-2 animate-pulse">
								{
									discrepancies.filter((d: any) => d.resolution_status === "pending")
										.length
								}
							</Badge>
						) : null}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="audits" className="space-y-4">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-bold text-2xl text-slate-800">
							Planned & Ongoing Audits
						</h2>
						<div className="relative">
							<SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder="Search audits..."
								className="w-[300px] border-slate-200 bg-white pl-9 shadow-sm"
							/>
						</div>
					</div>

					{loadingAudits ? (
						<div className="flex h-48 items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-emerald-600 border-b-2" />
						</div>
					) : audits?.length === 0 ? (
						<Card className="border-slate-300 border-dashed bg-slate-50">
							<CardContent className="flex flex-col items-center justify-center p-12 text-center">
								<ClipboardCheckIcon className="mb-4 h-16 w-16 text-slate-300" />
								<h3 className="font-bold text-slate-700 text-xl">
									No Active Audits
								</h3>
								<p className="mt-2 max-w-sm text-slate-500">
									All inventory checks are complete. Create a new audit plan to
									start counting.
								</p>
								<Button className="mt-6 bg-slate-900 text-white">
									Schedule Audit
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
							{audits?.map((audit: any) => (
								<Card
									key={audit.id}
									className="border-t-4 border-t-emerald-500 transition-shadow hover:shadow-lg"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div>
												<CardTitle className="text-lg">
													Audit #{audit.id}
												</CardTitle>
												<CardDescription>
													{format(new Date(audit.created_at!), "MMM d, yyyy")}
												</CardDescription>
											</div>
											<Badge
												variant={
													audit.status === "completed" ? "default" : "secondary"
												}
												className={
													audit.status === "completed"
														? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
														: "bg-amber-100 text-amber-800 hover:bg-amber-200"
												}
											>
												{audit.status.replace("_", " ")}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="pb-4">
										<div className="space-y-2 text-sm">
											<div className="flex justify-between rounded bg-slate-50 p-2">
												<span className="text-slate-500">Warehouse</span>
												<span className="font-medium text-slate-900">
													Main HQ
												</span>
											</div>
											<div className="flex justify-between rounded bg-slate-50 p-2">
												<span className="text-slate-500">Auditor</span>
												<span className="font-medium text-slate-900">
													User ID {audit.auditor_id || "Unassigned"}
												</span>
											</div>
										</div>
									</CardContent>
									<CardFooter className="pt-0">
										<Button variant="outline" className="w-full" asChild>
											<Link href={`/admin/audit/${audit.id}`}>
												View Details
											</Link>
										</Button>
									</CardFooter>
								</Card>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="discrepancies" className="space-y-4">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-bold text-2xl text-slate-800">
							Action Required
						</h2>
					</div>

					{loadingDiscrepancies ? (
						<div className="flex h-48 items-center justify-center">
							<div className="h-8 w-8 animate-spin rounded-full border-red-600 border-b-2" />
						</div>
					) : discrepancies?.length === 0 ? (
						<Card className="border-slate-300 border-dashed bg-slate-50">
							<CardContent className="flex flex-col items-center justify-center p-12 text-center">
								<FileWarningIcon className="mb-4 h-16 w-16 text-slate-300" />
								<h3 className="font-bold text-slate-700 text-xl">All Clear</h3>
								<p className="mt-2 max-w-sm text-slate-500">
									There are no pending discrepancies or missing stock items
									requiring manager approval.
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							{discrepancies?.map((disc: any) => (
								<Card
									key={disc.id}
									className="overflow-hidden border-l-4 border-l-red-500"
								>
									<div className="flex flex-col sm:flex-row">
										<div className="flex-1 bg-white p-6">
											<div className="mb-4 flex items-start justify-between">
												<div className="flex items-center gap-2">
													<AlertTriangleIcon className="h-5 w-5 text-red-500" />
													<h3 className="font-bold text-lg text-slate-900">
														{disc.type === "missing"
															? "Missing Stock"
															: disc.type === "damage"
																? "Damaged Product"
																: disc.type === "expiry"
																	? "Expired Product"
																	: "Product Not Available"}
													</h3>
												</div>
												<Badge
													variant="outline"
													className="border-red-200 bg-red-50 font-bold text-red-700 text-xs uppercase tracking-wider"
												>
													{disc.resolution_status}
												</Badge>
											</div>

											<div className="mb-4 grid grid-cols-2 gap-4 text-sm">
												<div>
													<p className="mb-1 font-semibold text-slate-500 text-xs uppercase">
														Item ID
													</p>
													<p className="font-medium text-slate-900">
														{disc.audit_item_id}
													</p>
												</div>
												<div>
													<p className="mb-1 font-semibold text-slate-500 text-xs uppercase">
														Discrepancy Qty
													</p>
													<p className="font-bold text-red-600">
														{disc.qty} units
													</p>
												</div>
											</div>

											<p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-slate-600 text-sm">
												{disc.notes ||
													"No additional notes provided by the auditor during the count."}
											</p>
										</div>

										<div className="flex flex-row justify-center gap-3 border-t bg-slate-50 p-6 sm:w-48 sm:flex-col sm:border-t-0 sm:border-l">
											{disc.resolution_status === "pending" ? (
												<>
													<Button className="w-full bg-slate-900 text-white shadow-md hover:bg-slate-800">
														Write Off
													</Button>
													<Button
														variant="outline"
														className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
													>
														Investigate
													</Button>
												</>
											) : (
												<Button
													variant="ghost"
													className="w-full text-slate-500"
													disabled
												>
													Resolved
												</Button>
											)}
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
