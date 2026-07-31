"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import { motion } from "framer-motion";
import {
	BanknoteIcon,
	DownloadIcon,
	IndianRupeeIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import { useBranch } from "@/lib/branch-context";
import { trpc } from "@/lib/trpc/client";

export default function SalaryPage() {
	const { activeBranchId } = useBranch();

	const { data: staffList, isLoading } = trpc.staff.list.useQuery(
		activeBranchId ? { branch_id: activeBranchId } : {},
	);

	const items = Array.isArray(staffList) ? staffList : [];
	const salaries = items.map((s) => Number.parseFloat(s.salary ?? "0"));
	const totalMonthly = salaries.reduce((a, b) => a + b, 0);
	const maxSalary = salaries.length > 0 ? Math.max(...salaries) : 0;
	const _minSalary = salaries.length > 0 ? Math.min(...salaries) : 0;
	const avgSalary = salaries.length > 0 ? totalMonthly / salaries.length : 0;

	const kpis = [
		{
			label: "Total Monthly Bill",
			value: `₹${totalMonthly.toLocaleString("en-IN")}`,
			icon: IndianRupeeIcon,
			color: "text-blue-600",
			bg: "bg-blue-50",
		},
		{
			label: "Average Salary",
			value: `₹${avgSalary.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
			icon: TrendingUpIcon,
			color: "text-purple-600",
			bg: "bg-purple-50",
		},
		{
			label: "Highest Salary",
			value: `₹${maxSalary.toLocaleString("en-IN")}`,
			icon: BanknoteIcon,
			color: "text-green-600",
			bg: "bg-green-50",
		},
		{
			label: "Total Employees",
			value: items.length.toString(),
			icon: UsersIcon,
			color: "text-teal-600",
			bg: "bg-teal-50",
		},
	];

	// Simulate HRA = 40%, PF = 12% of basic, Allowances = 20%
	const getSalaryBreakdown = (basicStr: string | null) => {
		const basic = Number.parseFloat(basicStr ?? "0");
		const hra = basic * 0.4;
		const allowances = basic * 0.2;
		const pf = basic * 0.12;
		const net = basic + hra + allowances - pf;
		return { basic, hra, allowances, pf, net };
	};

	return (
		<motion.div
			className="space-y-6 p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text font-bold text-3xl text-transparent">
						Salary Structure
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						View and manage employee salary breakdown
					</p>
				</div>
				<Button variant="outline" className="gap-2">
					<DownloadIcon className="h-4 w-4" />
					Export to Excel
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: i * 0.07 }}
					>
						<Card className="border-0 shadow-sm">
							<CardContent className="pt-6">
								<div className="flex items-center gap-3">
									<div className={`${kpi.bg} rounded-lg p-2`}>
										<kpi.icon className={`h-5 w-5 ${kpi.color}`} />
									</div>
									<div>
										<p className="text-muted-foreground text-sm">{kpi.label}</p>
										{isLoading ? (
											<Skeleton className="mt-1 h-6 w-24" />
										) : (
											<p className="font-bold text-xl">{kpi.value}</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BanknoteIcon className="h-5 w-5 text-amber-600" />
						Employee Salary Details
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Emp Code</TableHead>
									<TableHead>Employee</TableHead>
									<TableHead>Department</TableHead>
									<TableHead>Basic (₹)</TableHead>
									<TableHead>HRA (₹)</TableHead>
									<TableHead>Allowances (₹)</TableHead>
									<TableHead>PF Deduction (₹)</TableHead>
									<TableHead>Net Salary (₹)</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={8}
											className="py-10 text-center text-muted-foreground"
										>
											No staff records found.
										</TableCell>
									</TableRow>
								) : (
									items.map((s) => {
										const bd = getSalaryBreakdown(s.salary);
										return (
											<TableRow key={s.id} className="hover:bg-muted/30">
												<TableCell className="font-mono text-sm">
													{s.staff_code ?? `EMP-${s.id}`}
												</TableCell>
												<TableCell className="font-medium">{s.name}</TableCell>
												<TableCell className="text-muted-foreground capitalize">
													{s.department ?? s.role ?? "—"}
												</TableCell>
												<TableCell>
													₹{bd.basic.toLocaleString("en-IN")}
												</TableCell>
												<TableCell className="text-green-600">
													₹{bd.hra.toLocaleString("en-IN")}
												</TableCell>
												<TableCell className="text-blue-600">
													₹{bd.allowances.toLocaleString("en-IN")}
												</TableCell>
												<TableCell className="text-red-600">
													₹{bd.pf.toLocaleString("en-IN")}
												</TableCell>
												<TableCell className="font-bold text-green-700">
													₹{bd.net.toLocaleString("en-IN")}
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
