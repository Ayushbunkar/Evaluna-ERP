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
import { ActivityIcon, BanknoteIcon } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { DataEmpty, DataError, TableLoading } from "@/components/admin/data-states";
import { useTRPC } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminSuppliersPage() {
	const trpc = useTRPC();
	const locale = useLocale();
	const {
		data: suppliers,
		isLoading,
		error,
		refetch,
	} = trpc.admin.getSuppliers.useQuery();

	return (
		<PageTransition className="container mx-auto py-8">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex flex-col gap-1">
					<h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						Suppliers
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						View and manage all suppliers
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button variant="outline" className="text-xs shadow-sm sm:text-sm">
						<ActivityIcon className="mr-2 h-4 w-4" /> Supplier Activities
					</Button>
					<Button className="text-xs shadow-sm sm:text-sm" asChild>
						<Link href="/admin/suppliers/create">
							<BanknoteIcon className="mr-2 h-4 w-4" /> Add Supplier
						</Link>
					</Button>
				</div>
			</div>

			<div className="mt-6">
				{isLoading ? (
					<TableLoading columns={6} />
				) : error ? (
					<DataError
						title="Error loading suppliers"
						message={error.message}
						onRetry={() => refetch()}
					/>
				) : !suppliers || suppliers.length === 0 ? (
					<DataEmpty
						title="No suppliers found"
						message="Add your first supplier to get started."
					/>
				) : (
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="text-left">Code</TableHead>
									<TableHead className="text-left">Name</TableHead>
									<TableHead className="text-left">Email</TableHead>
									<TableHead className="text-left">Phone</TableHead>
									<TableHead className="text-left">GST Number</TableHead>
									<TableHead className="text-left">Outstanding</TableHead>
									<TableHead className="text-left">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{suppliers.map((sup) => (
									<TableRow key={sup.id}>
										<TableCell>{sup.supplier_code}</TableCell>
										<TableCell>{sup.name}</TableCell>
										<TableCell>{sup.email}</TableCell>
										<TableCell>{sup.phone}</TableCell>
										<TableCell>{sup.gst_number}</TableCell>
										<TableCell>
											{formatCurrency(Number(sup.outstanding_balance), locale)}
										</TableCell>
										<TableCell className="flex flex-row gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`View supplier ${sup.id}`)}
											>
												<BanknoteIcon className="mr-1 h-3 w-3" /> View
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => alert(`Edit supplier ${sup.id}`)}
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
