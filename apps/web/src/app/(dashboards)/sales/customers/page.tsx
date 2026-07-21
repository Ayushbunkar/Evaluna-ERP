"use client";

import { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/v4";
import { Card, CardContent, CardHeader } from "@evaluna/ui/components/card";
import { PlusCircle, FilePenIcon, TrashIcon, UsersIcon, EyeIcon } from "lucide-react";
import { Button } from "@evaluna/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@evaluna/ui/components/select";
import { Label } from "@evaluna/ui/components/label";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Skeleton } from "@evaluna/ui/components/skeleton";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useCrudMutation } from "@/hooks/use-crud-mutation";
import { DataTable, TableActions, TableActionButton, type Column, type ExportColumn } from "@evaluna/ui/components/data-table";
import { SearchFilter, type FilterOption } from "@evaluna/ui/components/search-filter";
import type { RouterOutputs } from "@/lib/trpc/router";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/lib/animations";

type Customer = RouterOutputs["customers"]["list"][number];

export default function CustomersPage() {
  const trpc = useTRPC();
  const { data: customers = [], isLoading, error } = trpc.customers.list.useQuery();
  const t = useTranslations("customers");
  const tc = useTranslations("common");

  const router = useRouter();

  const customerFormSchema = z.object({
    name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("invalidEmail")),
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
    { key: "name", header: tc("name"), sortable: true, className: "font-medium" },
    { key: "email", header: tc("email"), sortable: true },
    { key: "phone", header: tc("phone"), hideOnMobile: true },
    {
      key: "loyalty_tier",
      header: "Tier",
      sortable: true,
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs capitalize ${row.loyalty_tier === 'gold' ? 'bg-yellow-100 text-yellow-800' : row.loyalty_tier === 'silver' ? 'bg-gray-200 text-gray-800' : 'bg-orange-100 text-orange-800'}`}>
          {row.loyalty_tier || "Bronze"}
        </span>
      ),
    },
    { key: "loyalty_points", header: "Points", sortable: true, render: (row) => row.loyalty_points?.toString() || "0" },
    { key: "store_credit", header: "Credit", sortable: true, render: (row) => `₹${row.store_credit || "0.00"}` },
    {
      key: "status",
      header: tc("status"),
      sortable: true,
      render: (row) => (
        <span className={row.status === "active" ? "text-green-600" : "text-muted-foreground"}>
          {row.status === "active" ? tc("active") : tc("inactive")}
        </span>
      ),
    },
  ];

  const exportColumns: ExportColumn<Customer>[] = [
    { key: "customer_code", header: "ID", getValue: (c) => c.customer_code ?? "" },
    { key: "name", header: tc("name"), getValue: (c) => c.name },
    { key: "email", header: tc("email"), getValue: (c) => c.email },
    { key: "phone", header: tc("phone"), getValue: (c) => c.phone ?? "" },
    { key: "loyalty_tier", header: "Tier", getValue: (c) => c.loyalty_tier ?? "bronze" },
    { key: "loyalty_points", header: "Points", getValue: (c) => c.loyalty_points?.toString() ?? "0" },
    { key: "store_credit", header: "Credit", getValue: (c) => c.store_credit ?? "0" },
    { key: "status", header: tc("status"), getValue: (c) => c.status ?? "active" },
  ];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isEditing = editingId !== null;
  const trpcUtils = trpc.useUtils();
  const invalidateKeys = trpcUtils.customers.list.getQueryKey();

  const createMutation = useCrudMutation({
    mutationOptions: trpc.customers.create.mutationOptions(),
    invalidateKeys,
    successMessage: t("created"),
    errorMessage: t("createError"),
    onSuccess: () => setIsDialogOpen(false),
  });

  const updateMutation = useCrudMutation({
    mutationOptions: trpc.customers.update.mutationOptions(),
    invalidateKeys,
    successMessage: t("updated"),
    errorMessage: t("updateError"),
    onSuccess: () => setIsDialogOpen(false),
  });

  const deleteMutation = useCrudMutation({
    mutationOptions: trpc.customers.delete.mutationOptions(),
    invalidateKeys,
    successMessage: t("deleted"),
    errorMessage: t("deleteError"),
  });

  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", address: "", status: "active" as "active" | "inactive" },
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
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(searchTerm);
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
    form.setFieldValue("status", (c.status ?? "active") as "active" | "inactive");
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
        <TableActionButton onClick={() => router.push(`/admin/customers/${row.id}`)} icon={<EyeIcon className="w-4 h-4" />} label={tc("view")} />
        <TableActionButton onClick={() => openEdit(row)} icon={<FilePenIcon className="w-4 h-4" />} label={tc("edit")} />
        <TableActionButton variant="danger" onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} icon={<TrashIcon className="w-4 h-4" />} label={tc("delete")} />
      </TableActions>
    ),
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-6 p-6">
        <CardHeader className="p-0"><div className="flex items-center justify-between"><Skeleton className="h-10 w-48" /><Skeleton className="h-9 w-32" /></div></CardHeader>
        <CardContent className="p-0 space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /><Skeleton className="h-8 w-20" /></div>))}</CardContent>
      </Card>
    );
  }

  if (error) { return <Card><CardContent><p className="text-red-500">{error.message}</p></CardContent></Card>; }

  return (
    <PageTransition>
      <Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6">
        <CardHeader className="p-0">
          <SearchFilter
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={t("searchPlaceholder")}
            filters={[{ options: statusFilterOptions, value: statusFilter, onChange: setStatusFilter }]}
          >
            <Button size="sm" onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />{t("addCustomer")}</Button>
          </SearchFilter>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={filteredCustomers}
            columns={[...tableColumns, actionsColumn]}
            exportColumns={exportColumns}
            exportFilename="customers"
            emptyMessage={t("noCustomers")}
            emptyIcon={<UsersIcon className="w-8 h-8" />}
            defaultSort={[{ id: "name", desc: false }]}
          />
        </CardContent>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setIsDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isEditing ? t("editCustomer") : t("createCustomer")}</DialogTitle></DialogHeader>
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
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="name">{tc("name")}</Label>
                    <div className="col-span-3">
                      <Input id="name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} error={field.state.meta.errors.length > 0 ? field.state.meta.errors.map(e => e?.message ?? e).join(", ") : undefined} />
                    </div>
                  </div>
                )}
              </form.Field>
              <form.Field name="email">
                {(field) => (
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="email">{tc("email")}</Label>
                    <div className="col-span-3">
                      <Input id="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} error={field.state.meta.errors.length > 0 ? field.state.meta.errors.map(e => e?.message ?? e).join(", ") : undefined} />
                    </div>
                  </div>
                )}
              </form.Field>
              <form.Field name="phone">
                {(field) => (
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="phone">{tc("phone")}</Label>
                    <Input id="phone" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="col-span-3" />
                  </div>
                )}
              </form.Field>
              <form.Field name="address">
                {(field) => (
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="col-span-3" />
                  </div>
                )}
              </form.Field>
              <form.Field name="status">
                {(field) => (
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="status">{tc("status")}</Label>
                    <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as "active" | "inactive")}>
                      <SelectTrigger id="status" className="col-span-3"><SelectValue placeholder={t("selectStatus")} /></SelectTrigger>
                      <SelectContent><SelectItem value="active">{tc("active")}</SelectItem><SelectItem value="inactive">{tc("inactive")}</SelectItem></SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>{tc("cancel")}</Button>
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {isEditing ? t("updateCustomer") : t("addCustomer")}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

        <DeleteConfirmationDialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} onConfirm={handleDelete} isDeleting={deleteMutation.isPending} />
      </Card>
    </PageTransition>
  );
}
