"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function AdminCustomersPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: customers, isLoading, error } = trpc.admin.getCustomers.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading customers</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Customers</h1>
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

      {!customers || customers.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No customers found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">ID</TableHead>
                <TableHead className="text-left">Name</TableHead>
                <TableHead className="text-left">Contact Person</TableHead>
                <TableHead className="text-left">Credit Used / Limit</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((cust) => (
                <TableRow key={cust.id}>
                  <TableCell>{cust.id}</TableCell>
                  <TableCell>{cust.name}</TableCell>
                  <TableCell>{cust.contact_person || "N/A"}</TableCell>
                  <TableCell>
                    {formatCurrency(Number(cust.credit_used), locale)} / {formatCurrency(Number(cust.credit_limit), locale)}
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    <Button variant="outline" size="xs" onClick={() => alert(`View customer ${cust.id}`)}>
                      <UsersIcon className="mr-1 h-3 w-3" /> View
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => alert(`Edit customer ${cust.id}`)}>
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