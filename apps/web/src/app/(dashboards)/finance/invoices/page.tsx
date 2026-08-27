"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, CheckCircle2Icon, FileTextIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

export default function FinanceInvoicesPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: invoices, isLoading, error } = trpc.finance.getInvoices.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading invoices</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Invoices</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            View and manage invoices
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> Financial Activity
          </Button>
          <Button className="text-xs shadow-sm sm:text-sm" asChild>
            <Link href="/finance">
              <FileTextIcon className="mr-1 h-3 w-3" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No invoices found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">Invoice #</TableHeader>
                <TableHeader className="text-left">Date</TableHeader>
                <TableHeader className="text-left">Customer</TableHeader>
                <TableHeader className="text-left">Amount</TableHeader>
                <TableHeader className="text-left">Status</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>#{inv.id}</TableCell>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell>{formatCurrency(Number(inv.amount), locale)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${inv.status === "paid" ? "bg-green-100 text-green-800" : inv.status === "pending" ? "bg-yellow-100 text-yellow-800" : inv.status === "overdue" ? "bg-red-100 text-red-800" : inv.status === "draft" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800"}`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    <Button variant="outline" size="xs" onClick={() => alert(`View invoice ${inv.id}`)}>
                      <SearchIcon className="mr-1 h-3 w-3" /> View
                    </Button>
                    {inv.status === "pending" && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => alert(`Mark invoice ${inv.id} as paid`)}>
                          <CheckCircle2Icon className="mr-1 h-3 w-3" /> Mark Paid
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => alert(`Send reminder for invoice ${inv.id}`)}>
                          <ActivityIcon className="mr-1 h-3 w-3" /> Remind
                        </Button>
                      </>
                    )}
                    {inv.status === "overdue" && (
                      <Button variant="outline" size="xs" onClick={() => alert(`Send overdue notice for invoice ${inv.id}`)}>
                        <ActivityIcon className="mr-1 h-3 w-3" /> Notice
                      </Button>
                    )}
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