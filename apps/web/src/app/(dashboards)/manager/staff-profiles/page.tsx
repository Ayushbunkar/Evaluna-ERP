"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	CheckCircle2,
	Loader2,
	RefreshCw,
	UserCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function StaffProfilesPage() {
	const trpc = useTRPC();
	const [isBackfilling, setIsBackfilling] = useState(false);

	const {
		data: usersData,
		isLoading,
		refetch,
	} = trpc.users.list.useQuery({
		limit: 100,
	});

	const ensureProfilesMutation = trpc.users.ensureProfiles.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Successfully synchronized staff profiles! ${data.fixedCount} record(s) linked/created.`,
			);
			void refetch();
			setIsBackfilling(false);
		},
		onError: (err) => {
			toast.error(`Backfill failed: ${err.message}`);
			setIsBackfilling(false);
		},
	});

	const handleBackfill = () => {
		setIsBackfilling(true);
		ensureProfilesMutation.mutate();
	};

	const userList = usersData?.users || [];

	return (
		<PageTransition className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-slate-900 text-xl tracking-tight sm:text-2xl dark:text-slate-100">
						<Users className="h-6 w-6 text-blue-600" />
						Staff Profile Linkage
					</h2>
					<p className="text-slate-500 text-xs sm:text-sm dark:text-slate-400">
						Link user accounts to Staff and HRMS Employee records so attendance
						and expenses work for everyone.
					</p>
				</div>

				<Button
					onClick={handleBackfill}
					disabled={isBackfilling || ensureProfilesMutation.isPending}
					className="gap-2 bg-blue-600 font-semibold text-white text-xs hover:bg-blue-700"
				>
					{isBackfilling || ensureProfilesMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<RefreshCw className="h-4 w-4" />
					)}
					{isBackfilling || ensureProfilesMutation.isPending
						? "Synchronizing Profiles..."
						: "Auto-Link All Account Profiles"}
				</Button>
			</div>

			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 font-bold text-base">
						<UserCheck className="h-5 w-5 text-blue-600" />
						System Accounts & Profile Link Status
					</CardTitle>
					<CardDescription>
						Every user account created by Super Admin or predefined login
						requires a linked staff profile to check in.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 sm:p-6">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs">
								<thead>
									<tr className="border-b bg-slate-50/50 text-slate-500">
										<th className="p-3 font-semibold">User Name</th>
										<th className="p-3 font-semibold">Email</th>
										<th className="p-3 font-semibold">Assigned Role</th>
										<th className="p-3 font-semibold">Account Status</th>
										<th className="p-3 font-semibold">Staff Link</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{userList.map((u: any) => {
										return (
											<tr key={u.id} className="hover:bg-slate-50/40">
												<td className="p-3 font-bold text-slate-900 dark:text-slate-100">
													{u.name || "N/A"}
												</td>
												<td className="p-3 font-mono text-slate-600">
													{u.email}
												</td>
												<td className="p-3 font-medium text-blue-600 capitalize">
													{u.role || "Staff"}
												</td>
												<td className="p-3">
													<Badge
														variant={
															u.status === "ACTIVE" ? "default" : "outline"
														}
														className="text-[10px]"
													>
														{u.status || "ACTIVE"}
													</Badge>
												</td>
												<td className="p-3">
													<span className="flex items-center gap-1.5 font-semibold text-green-600">
														<CheckCircle2 className="h-4 w-4 text-green-500" />
														Profile Linked
													</span>
												</td>
											</tr>
										);
									})}
									{userList.length === 0 && (
										<tr>
											<td
												colSpan={5}
												className="py-12 text-center text-slate-400 text-xs"
											>
												No user accounts found in the system.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</PageTransition>
	);
}
