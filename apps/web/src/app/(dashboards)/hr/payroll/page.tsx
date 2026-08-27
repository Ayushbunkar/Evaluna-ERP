"use client";

import { Button } from "@evaluna/ui/components/button";
import { Table, TableBody, TableCell, Header, TableHead, TableRow } from "@evaluna/ui/components/table";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";
import { PageTransition } from "@/lib/animations";
import { ActivityIcon, BanknoteIcon } from "lucide-react";
import Link from "next/link";

export default function HRPayrollPage() {
  const trpc = useTRPC();
  const locale = useLocale();
  const { data: payrollRecords, isLoading, error } = trpc.hr.getPayrollRecords.useQuery();

  if (isLoading) return <div className="flex h-[200px] items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-[200px] items-center justify-center">Error loading payroll</div>;

  return (
    <PageTransition className="container mx-auto py-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">Payroll Records</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            View and manage payroll
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="outline" className="text-xs shadow-sm sm:text-sm">
            <ActivityIcon className="mr-2 h-4 w-4" /> HR Activities
          </Button>
        </div>
      </div>

      {!payrollRecords || payrollRecords.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground text-xs sm:h-[250px] sm:text-sm">
          No payroll records found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHeader className="text-left">ID</TableHeader>
                <TableHeader className="text-left">Employee</TableHeader>
                <TableHeader className="text-left">Month</TableHeader>
                <TableHeader className="text-left">Amount</TableHeader>
                <TableHeader className="text-left">Status</TableHeader>
                <TableHeader className="text-left">Actions</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{rec.id}</TableCell>
                  <TableCell>{rec.employee_name}</TableCell>
                  <TableCell>{rec.month}</TableCell>
                  <TableCell>{formatCurrency(Number(rec.amount), locale)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${rec.status === "paid" ? "bg-green-100 text-green-800" : rec.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                      {rec.status}
                    </span>
                  </TableCell>
                  <TableCell className="flex flex-row gap-2">
                    {rec.status === "pending" && (
                      <Button variant="outline" size="xs" onClick={() => alert(`Process payroll ${rec.id}`)}>
                        <BanknoteIcon className="mr-1 h-3 w-3" /> Process
                      </Button>
                    )}
                    {rec.status !== "pending" && (
                      <Button variant="outline" size="xs" onClick={() => alert(`View payroll ${rec.id}`)}>
                        <ActivityIcon className="mr-1 h-3 w-3" /> View
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