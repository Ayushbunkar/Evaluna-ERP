"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, BanknoteIcon } from "lucide-react";
import Link from "next/link";

export default function AdminSuppliersPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: suppliers, isLoading, error } = trpc.admin.getSuppliers.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading suppliers</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Suppliers</h1>
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

      {!suppliers || suppliers.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No suppliers found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">ID</TableHeader>
                <TableHeader className="text-left">Name</TableHeader>
                <TableHeader className="text-left">Contact Person</TableHeader>
                <TableHeader className="text-left">Outstanding Balance</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((sup) => (
                <TableRow key={sup.id={sup.id}>
                  <TableCell>{sup.id}</TableCell>
                  <TableCell>{sup.name}</TableCell>
                  <TableCell>{sup.contact_person || "N/A"}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(sup.outstanding_balance), locale)}
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    <Button variant="outline" size="xs" onClick={() => alert(`View supplier ${sup.id}`)}>
                      <BanknoteIcon className="mr-1 h-3 w-3" /> View
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => alert(`Edit supplier ${sup.id}`)}>
                      <ActivityIcon className="mr-1 h-3 w-3" /> Edit
                    </Button>
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