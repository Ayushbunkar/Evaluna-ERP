"use client";

import { Badge } from "@evaluna/ui/components/badge";
import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
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
	IndianRupeeIcon,
	PackageIcon,
	PlusIcon,
	TruckIcon,
	UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagination } from "@/hooks/use-pagination";
import { trpc } from "@/lib/trpc/client";

export default function SuppliersPage() {
	const [open, setOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const search = useDebounce(searchInput, 300);
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		gst_number: "",
		pan_number: "",
		supplier_category: "general",
	});

	const {
		data: supplierList,
		isLoading,
		refetch,
	} = trpc.suppliers.list.useQuery();

	const createMutation = trpc.suppliers.create.useMutation({
		onSuccess: () => {
			toast.success("Supplier added successfully!");
			setOpen(false);
			setForm({
				name: "",
				email: "",
				phone: "",
				address: "",
				gst_number: "",
				pan_number: "",
				supplier_category: "general",
			});
			refetch();
		},
		onError: (e) => toast.error(e.message),
	});

	const suppliers = Array.isArray(supplierList) ? supplierList : [];

	const filteredSuppliers = useMemo(
		() =>
			search
				? suppliers.filter(
						(s: any) =>
							s.name?.toLowerCase().includes(search.toLowerCase()) ||
							s.email?.toLowerCase().includes(search.toLowerCase()) ||
							s.phone?.includes(search),
					)
				: suppliers,
		[suppliers, search],
	);

	const pagination = usePagination(filteredSuppliers, 15);

	const kpis = [
		{
			label: "Total Suppliers",
			value: suppliers.length,
			icon: UsersIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
		{
			label: "Active",
			value: suppliers.filter((s: any) => s.status !== "inactive").length,
			icon: TruckIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
		{
			label: "Categories",
			value: new Set(
				suppliers.map((s: any) => s.supplier_category).filter(Boolean),
			).size,
			icon: PackageIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
		{
			label: "With GST",
			value: suppliers.filter((s: any) => s.gst_number).length,
			icon: IndianRupeeIcon,
			color: "text-foreground",
			bg: "bg-muted",
		},
	];

	return (
		<motion.div
			className="space-y-6 p-6"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Suppliers</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Manage all your suppliers and vendors
					</p>
				</div>
				<Button onClick={() => setOpen(true)} className="gap-2">
					<PlusIcon className="h-4 w-4" />
					Add Supplier
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
											<Skeleton className="mt-1 h-6 w-12" />
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
						<TruckIcon className="h-5 w-5 text-muted-foreground" />
						All Suppliers
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Code</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>GST No.</TableHead>
									<TableHead>Category</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{suppliers.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="py-10 text-center text-muted-foreground"
										>
											No suppliers found. Add your first supplier!
										</TableCell>
									</TableRow>
								) : (
									suppliers.map((s: any) => (
										<TableRow key={s.id} className="hover:bg-muted/30">
											<TableCell className="font-mono text-sm">
												{s.supplier_code ?? `SUPP-${s.id}`}
											</TableCell>
											<TableCell className="font-medium">{s.name}</TableCell>
											<TableCell className="text-muted-foreground">
												{s.email ?? "—"}
											</TableCell>
											<TableCell>{s.phone ?? "—"}</TableCell>
											<TableCell className="font-mono text-xs">
												{s.gst_number ?? "—"}
											</TableCell>
											<TableCell className="capitalize">
												{s.supplier_category ?? "general"}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														s.status === "inactive" ? "secondary" : "default"
													}
												>
													{s.status ?? "Active"}
												</Badge>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add New Supplier</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label>Supplier Name *</Label>
							<Input
								placeholder="e.g. Sharma Traders"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
							/>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>Email</Label>
								<Input
									type="email"
									placeholder="supplier@example.com"
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
								/>
							</div>
							<div className="grid gap-2">
								<Label>Phone</Label>
								<Input
									placeholder="+91 98765 43210"
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label>GST Number</Label>
								<Input
									placeholder="22AAAAA0000A1Z5"
									value={form.gst_number}
									onChange={(e) =>
										setForm({ ...form, gst_number: e.target.value })
									}
								/>
							</div>
							<div className="grid gap-2">
								<Label>PAN Number</Label>
								<Input
									placeholder="AAAAA0000A"
									value={form.pan_number}
									onChange={(e) =>
										setForm({ ...form, pan_number: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label>Address</Label>
							<Input
								placeholder="Full address"
								value={form.address}
								onChange={(e) => setForm({ ...form, address: e.target.value })}
							/>
						</div>
						<div className="grid gap-2">
							<Label>Category</Label>
							<select
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
								value={form.supplier_category}
								onChange={(e) =>
									setForm({ ...form, supplier_category: e.target.value })
								}
							>
								<option value="general">General</option>
								<option value="raw_material">Raw Material</option>
								<option value="packaging">Packaging</option>
								<option value="services">Services</option>
								<option value="equipment">Equipment</option>
							</select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => createMutation.mutate(form as any)}
							disabled={!form.name || createMutation.isPending}
						>
							{createMutation.isPending ? "Adding..." : "Add Supplier"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</motion.div>
	);
}
