// @ts-nocheck
"use client";

import { Button } from "@evaluna/ui/components/button";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import {
	type Column,
	DataTable,
	type ExportColumn,
	TableActionButton,
	TableActions,
} from "@evaluna/ui/components/data-table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	type FilterOption,
	SearchFilter,
} from "@evaluna/ui/components/search-filter";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
	Check,
	Copy,
	EyeIcon,
	FilePenIcon,
	KeyRound,
	PlusCircle,
	TrashIcon,
	UserCheck,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/router";

type Customer = RouterOutputs["customers"]["list"][number];

export default function CustomersPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const {
		data: customers = [],
		isLoading,
		error,
	} = trpc.customers.list.useQuery();
	const utils = trpc.useUtils();
	const t = useTranslations("customers");
	const tc = useTranslations("common");

	const router = useRouter();

	const customerFormSchema = z.object({
		name: z.string().min(1, t("nameRequired")),
		email: z.string().email(t("invalidEmail")).optional().or(z.literal("")),
		phone: z.string().optional(),
		address: z.string().optional(),
		status: z.enum(["active", "inactive"]),
	});

	const statusFilterOptions: FilterOption[] = [
		{ label: tc("all"), value: "all" },
		{ label: tc("active"), value: "active", variant: "success" },
		{ label: tc("inactive"), value: "inactive", variant: "danger" },
	];

	const tableColumns: Column<Customer>[] = [
		{ key: "customer_code", header: "ID", sortable: true },
		{
			key: "name",
			header: tc("name"),
			sortable: true,
			className: "font-medium",
		},
		{ key: "email", header: tc("email"), sortable: true },
		{ key: "phone", header: tc("phone"), hideOnMobile: true },
		{
			key: "loyalty_tier",
			header: "Tier",
			sortable: true,
			render: (row) => (
				<span
					className={`rounded px-2 py-1 text-xs capitalize ${row.loyalty_tier === "gold" ? "bg-yellow-100 text-yellow-800" : row.loyalty_tier === "silver" ? "bg-gray-200 text-gray-800" : "bg-orange-100 text-orange-800"}`}
				>
					{row.loyalty_tier || "Bronze"}
				</span>
			),
		},
		{
			key: "loyalty_points",
			header: "Points",
			sortable: true,
			render: (row) => row.loyalty_points?.toString() || "0",
		},
		{
			key: "store_credit",
			header: "Credit",
			sortable: true,
			render: (row) => `₹${row.store_credit || "0.00"}`,
		},
		{
			key: "status",
			header: tc("status"),
			sortable: true,
			render: (row) => (
				<span
					className={
						row.status === "active" ? "text-green-600" : "text-muted-foreground"
					}
				>
					{row.status === "active" ? tc("active") : tc("inactive")}
				</span>
			),
		},
	];

	const exportColumns: ExportColumn<Customer>[] = [
		{
			key: "customer_code",
			header: "ID",
			getValue: (c) => c.customer_code ?? "",
		},
		{ key: "name", header: tc("name"), getValue: (c) => c.name },
		{ key: "email", header: tc("email"), getValue: (c) => c.email },
		{ key: "phone", header: tc("phone"), getValue: (c) => c.phone ?? "" },
		{
			key: "loyalty_tier",
			header: "Tier",
			getValue: (c) => c.loyalty_tier ?? "bronze",
		},
		{
			key: "loyalty_points",
			header: "Points",
			getValue: (c) => c.loyalty_points?.toString() ?? "0",
		},
		{
			key: "store_credit",
			header: "Credit",
			getValue: (c) => c.store_credit ?? "0",
		},
		{
			key: "status",
			header: tc("status"),
			getValue: (c) => c.status ?? "active",
		},
	];

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Customer Portal Account Provisioning Modal State
	const [provisionTarget, setProvisionTarget] = useState<Customer | null>(null);
	const [provisionEmail, setProvisionEmail] = useState("");
	const [provisionResult, setProvisionResult] = useState<{
		email: string;
		linked: boolean;
		temporaryPassword: string | null;
	} | null>(null);
	const [hasCopied, setHasCopied] = useState(false);

	const isEditing = editingId !== null;
	const invalidateKeys = [["customers", "list"]];

	const provisionMutation = trpc.customers.provisionLogin.useMutation({
		onSuccess: (data) => {
			utils.customers.list.invalidate();
			setProvisionResult(data);
			toast.success(
				data.linked
					? "Customer portal account linked"
					: "Customer portal login created successfully",
			);
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create portal account");
		},
	});

	const openProvisionDialog = (customer: Customer) => {
		setProvisionTarget(customer);
		setProvisionEmail(customer.email || "");
		setProvisionResult(null);
		setHasCopied(false);
	};

	const handleProvisionSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!provisionTarget) return;
		const emailToUse = provisionEmail.trim() || provisionTarget.email;
		if (!emailToUse) {
			toast.error("Please enter a valid email address");
			return;
		}
		provisionMutation.mutate({
			id: provisionTarget.id,
			email: emailToUse,
		});
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		setHasCopied(true);
		toast.success("Copied credentials to clipboard!");
		setTimeout(() => setHasCopied(false), 2000);
	};

	const createMutation = trpc.customers.create.useMutation({
		onSuccess: () => {
			utils.customers.list.invalidate();
			toast.success(t("created"));
			setIsDialogOpen(false);
		},
		onError: () => {
			toast.error(t("createError"));
		},
	});

	const updateMutation = trpc.customers.update.useMutation({
		onSuccess: () => {
			utils.customers.list.invalidate();
			toast.success(t("updated"));
			setIsDialogOpen(false);
		},
		onError: () => {
			toast.error(t("updateError"));
		},
	});

	const deleteMutation = trpc.customers.delete.useMutation({
		onSuccess: () => {
			utils.customers.list.invalidate();
			toast.success(t("deleted"));
		},
		onError: () => {
			toast.error(t("deleteError"));
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			address: "",
			status: "active" as "active" | "inactive",
		},
		validators: {
			onSubmit: customerFormSchema,
		},
		onSubmit: ({ value }) => {
			const payload = {
				name: value.name,
				email: value.email,
				phone: value.phone || undefined,
				address: value.address || undefined,
				status: value.status,
			};
			if (isEditing) {
				updateMutation.mutate({ id: editingId, ...payload });
			} else {
				createMutation.mutate(payload);
			}
		},
	});

	const filteredCustomers = useMemo(() => {
		return customers.filter((c) => {
			if (statusFilter !== "all" && c.status !== statusFilter) return false;
			const q = searchTerm.toLowerCase();
			return (
				c.name.toLowerCase().includes(q) ||
				c.email.toLowerCase().includes(q) ||
				(c.phone ?? "").includes(searchTerm)
			);
		});
	}, [customers, statusFilter, searchTerm]);

	const openCreate = () => {
		setEditingId(null);
		form.reset();
		setIsDialogOpen(true);
	};

	const openEdit = (c: Customer) => {
		setEditingId(c.id);
		form.reset();
		form.setFieldValue("name", c.name);
		form.setFieldValue("email", c.email);
		form.setFieldValue("phone", c.phone ?? "");
		form.setFieldValue("address", c.address ?? "");
		form.setFieldValue(
			"status",
			(c.status ?? "active") as "active" | "inactive",
		);
		setIsDialogOpen(true);
	};

	const handleDelete = () => {
		if (deleteId !== null) {
			deleteMutation.mutate({ id: deleteId });
			setIsDeleteOpen(false);
			setDeleteId(null);
		}
	};

	const actionsColumn: Column<Customer> = {
		key: "actions",
		header: tc("actions"),
		render: (row) => (
			<TableActions>
				<TableActionButton
					onClick={() => openProvisionDialog(row)}
					icon={<KeyRound className="h-4 w-4 text-primary" />}
					label="Portal Account"
				/>
				<TableActionButton
					onClick={() => router.push(`/sales/customers/${row.id}`)}
					icon={<EyeIcon className="h-4 w-4" />}
					label={tc("view")}
				/>
				<TableActionButton
					onClick={() => openEdit(row)}
					icon={<FilePenIcon className="h-4 w-4" />}
					label={tc("edit")}
				/>
				<TableActionButton
					variant="danger"
					onClick={() => {
						setDeleteId(row.id);
						setIsDeleteOpen(true);
					}}
					icon={<TrashIcon className="h-4 w-4" />}
					label={tc("delete")}
				/>
			</TableActions>
		),
	};

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-6 p-6">
				<CardHeader className="p-0">
					<div className="flex items-center justify-between">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-9 w-32" />
					</div>
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="flex items-center gap-4">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-8 w-20" />
						</div>
					))}
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent>
					<p className="text-red-500">{error.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<PageTransition>
			<Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
				<CardHeader className="p-0">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder={t("searchPlaceholder")}
						filters={[
							{
								options: statusFilterOptions,
								value: statusFilter,
								onChange: setStatusFilter,
							},
						]}
					>
						<Button size="sm" onClick={openCreate}>
							<PlusCircle className="mr-2 h-4 w-4" />
							{t("addCustomer")}
						</Button>
					</SearchFilter>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={filteredCustomers}
						columns={[...tableColumns, actionsColumn]}
						exportColumns={exportColumns}
						exportFilename="customers"
						emptyMessage={t("noCustomers")}
						emptyIcon={<UsersIcon className="h-8 w-8" />}
						defaultSort={[{ id: "name", desc: false }]}
					/>
				</CardContent>

				<Dialog
					open={isDialogOpen}
					onOpenChange={(open) => {
						if (!open) setIsDialogOpen(false);
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{isEditing ? t("editCustomer") : t("createCustomer")}
							</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
						>
							<div className="grid gap-4 py-4">
								<form.Field name="name">
									{(field) => (
										<div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
											<Label htmlFor="name">{tc("name")}</Label>
											<div className="col-span-3">
												<Input
													id="name"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													error={
														field.state.meta.errors.length > 0
															? field.state.meta.errors
																	.map((e) => e?.message ?? e)
																	.join(", ")
															: undefined
													}
												/>
											</div>
										</div>
									)}
								</form.Field>
								<form.Field name="email">
									{(field) => (
										<div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
											<Label htmlFor="email">{tc("email")}</Label>
											<div className="col-span-3">
												<Input
													id="email"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													error={
														field.state.meta.errors.length > 0
															? field.state.meta.errors
																	.map((e) => e?.message ?? e)
																	.join(", ")
															: undefined
													}
												/>
											</div>
										</div>
									)}
								</form.Field>
								<form.Field name="phone">
									{(field) => (
										<div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
											<Label htmlFor="phone">{tc("phone")}</Label>
											<Input
												id="phone"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className="col-span-3"
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="address">
									{(field) => (
										<div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
											<Label htmlFor="address">Address</Label>
											<Input
												id="address"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												className="col-span-3"
											/>
										</div>
									)}
								</form.Field>
								<form.Field name="status">
									{(field) => (
										<div className="flex flex-col gap-2 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
											<Label htmlFor="status">{tc("status")}</Label>
											<Select
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(value as "active" | "inactive")
												}
											>
												<SelectTrigger id="status" className="col-span-3">
													<SelectValue placeholder={t("selectStatus")} />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="active">{tc("active")}</SelectItem>
													<SelectItem value="inactive">
														{tc("inactive")}
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</form.Field>
							</div>
							<DialogFooter>
								<Button
									variant="secondary"
									onClick={() => setIsDialogOpen(false)}
								>
									{tc("cancel")}
								</Button>
								<form.Subscribe selector={(state) => state.isSubmitting}>
									{(isSubmitting) => (
										<Button
											type="submit"
											disabled={
												isSubmitting ||
												createMutation.isPending ||
												updateMutation.isPending
											}
										>
											{isEditing ? t("updateCustomer") : t("addCustomer")}
										</Button>
									)}
								</form.Subscribe>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>

				<DeleteConfirmationDialog
					isOpen={isDeleteOpen}
					onOpenChange={setIsDeleteOpen}
					onConfirm={handleDelete}
					isDeleting={deleteMutation.isPending}
				/>

				{/* Customer Portal Account Modal */}
				<Dialog
					open={provisionTarget !== null}
					onOpenChange={(open) => {
						if (!open) {
							setProvisionTarget(null);
							setProvisionResult(null);
						}
					}}
				>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<KeyRound className="h-5 w-5 text-primary" />
								Customer Portal Account
							</DialogTitle>
						</DialogHeader>

						{provisionResult ? (
							<div className="space-y-4 py-2">
								<div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-sm">
									<p className="font-semibold text-green-700 dark:text-green-400">
										{provisionResult.linked
											? "Account linked to Customer Portal!"
											: "Customer Portal Account created successfully!"}
									</p>
									<p className="text-muted-foreground mt-1 text-xs">
										Guide the customer to sign in at{" "}
										<span className="font-mono font-medium text-foreground">/login</span> with these details:
									</p>
								</div>

								<div className="space-y-3 rounded-md bg-muted/60 p-4 font-mono text-sm border">
									<div>
										<span className="text-xs text-muted-foreground block">Email:</span>
										<span className="font-medium text-foreground">{provisionResult.email}</span>
									</div>
									{provisionResult.temporaryPassword ? (
										<div>
											<span className="text-xs text-muted-foreground block">Temporary Password:</span>
											<span className="font-semibold text-primary select-all">
												{provisionResult.temporaryPassword}
											</span>
										</div>
									) : (
										<div>
											<span className="text-xs text-muted-foreground block">Password:</span>
											<span className="italic text-muted-foreground text-xs">
												Existing password maintained. Customer can sign in directly.
											</span>
										</div>
									)}
								</div>

								<div className="flex justify-between items-center gap-2 pt-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const text = provisionResult.temporaryPassword
												? `Evaluna Customer Portal Login:\nEmail: ${provisionResult.email}\nTemporary Password: ${provisionResult.temporaryPassword}\nLogin at: /login`
												: `Evaluna Customer Portal Login:\nEmail: ${provisionResult.email}\nLogin at: /login`;
											copyToClipboard(text);
										}}
									>
										{hasCopied ? (
											<>
												<Check className="mr-2 h-4 w-4 text-green-500" />
												Copied!
											</>
										) : (
											<>
												<Copy className="mr-2 h-4 w-4" />
												Copy Credentials
											</>
										)}
									</Button>
									<Button
										size="sm"
										onClick={() => {
											setProvisionTarget(null);
											setProvisionResult(null);
										}}
									>
										Done
									</Button>
								</div>
							</div>
						) : (
							<form onSubmit={handleProvisionSubmit} className="space-y-4 py-2">
								<p className="text-sm text-muted-foreground">
									Set up self-service access for <strong>{provisionTarget?.name}</strong>.
									The customer will be able to log in, view orders, and manage loyalty points.
								</p>

								<div className="space-y-2">
									<Label htmlFor="provision-email">Customer Email Address</Label>
									<Input
										id="provision-email"
										type="email"
										value={provisionEmail}
										onChange={(e) => setProvisionEmail(e.target.value)}
										placeholder="customer@example.com"
										required
										autoFocus
									/>
									{!provisionTarget?.email && (
										<p className="text-xs text-amber-600 dark:text-amber-400">
											This customer has no email yet. Adding an email here will save it to their profile and generate their login.
										</p>
									)}
								</div>

								<DialogFooter className="pt-2">
									<Button
										type="button"
										variant="secondary"
										onClick={() => setProvisionTarget(null)}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={provisionMutation.isPending || !provisionEmail.trim()}
									>
										{provisionMutation.isPending ? "Generating..." : "Generate Portal Login"}
									</Button>
								</DialogFooter>
							</form>
						)}
					</DialogContent>
				</Dialog>
			</Card>
		</PageTransition>
	);
}
