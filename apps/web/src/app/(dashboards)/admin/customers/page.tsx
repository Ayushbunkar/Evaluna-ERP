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
import { ActivityIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { DataEmpty, DataError, TableLoading } from "@/components/admin/data-states";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminCustomersPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: customers,
		isLoading,
		error,
		refetch,
	} = trpc.admin.getCustomers.useQuery();

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Customers
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and manage all customers
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Customer Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/customers/create">
							<UsersIcon className="mr-2 h-4 w-4" /> Add Customer
						</Link>
					</Button>
				</div>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<TableLoading columns={7} />
				) : error ? (
					<DataError
						title="Error loading customers"
						message={error.message}
						onRetry={() => refetch()}
					/>
				) : !customers || customers.length === 0 ? (
					<DataEmpty
						title="No customers found"
						message="Add your first customer to get started."
					/>
				) : (
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="text-left">Code</TableHead>
									<TableHead className="text-left">Name</TableHead>
									<TableHead className="text-left">Email</TableHead>
									<TableHead className="text-left">Type</TableHead>
									<TableHead className="text-left">Credit Used / Limit</TableHead>
									<TableHead className="text-left">Status</TableHead>
									<TableHead className="text-left">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{customers.map((cust) => (
									<TableRow key={cust.id}>
										<TableCell>{cust.customer_code}</TableCell>
										<TableCell>{cust.name}</TableCell>
										<TableCell>{cust.email}</TableCell>
										<TableCell className="capitalize">
											{cust.customer_type}
										</TableCell>
										<TableCell>
											{formatCurrency(Number(cust.credit_used), locale)} /{" "}
											{formatCurrency(Number(cust.credit_limit), locale)}
										</TableCell>
										<TableCell>
											<span
												className={`rounded-full px-2 py-0.5 text-xs capitalize ${cust.status.toLowerCase() === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
											>
												{cust.status}
											</span>
										</TableCell>
										<TableCell className="flex flex-row gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`View customer ${cust.id}`)}
											>
												<UsersIcon className="mr-1 h-3 w-3" /> View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`Edit customer ${cust.id}`)}
											>
												<ActivityIcon className="mr-1 h-3 w-3" /> Edit
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</PageTransition>
	);
}
