"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { Button } from "@evaluna/ui/components/button";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { DataTable, TableActions, TableActionButton, type Column } from "@evaluna/ui/components/data-table";
import { PageTransition, AnimatedCard, StaggerList, StaggerItem } from "@/lib/animations";
import { EyeIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { formatCurrency } from "@/lib/utils";

// Mock data for Sales Returns since TRPC router doesn't exist yet
type SalesReturn = {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  items: number;
};

const mockReturns: SalesReturn[] = [
  { id: "RET-001", orderId: "ORD-9201", customerName: "Rahul Sharma", amount: 1250, date: "2026-07-20T10:30:00Z", status: "refunded", items: 2 },
  { id: "RET-002", orderId: "ORD-9195", customerName: "Priya Singh", amount: 450, date: "2026-07-21T14:15:00Z", status: "pending", items: 1 },
  { id: "RET-003", orderId: "ORD-9188", customerName: "Amit Kumar", amount: 890, date: "2026-07-22T09:45:00Z", status: "approved", items: 3 },
];

export default function SalesReturnsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const locale = useLocale();

  const filteredReturns = mockReturns.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = searchTerm.toLowerCase();
    return r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q);
  });

  const columns: Column<SalesReturn>[] = [
    { key: "id", header: "Return ID", sortable: true, className: "font-medium" },
    { key: "orderId", header: "Original Order", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    { 
      key: "amount", 
      header: "Refund Amount", 
      sortable: true,
      render: (row) => formatCurrency(row.amount, locale)
    },
    { key: "items", header: "Items", hideOnMobile: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
          ${row.status === 'refunded' ? 'bg-emerald-100 text-emerald-700' : ''}
          ${row.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
          ${row.status === 'approved' ? 'bg-blue-100 text-blue-700' : ''}
          ${row.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
        `}>
          {row.status}
        </span>
      )
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (row) => new Date(row.date).toLocaleDateString()
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <TableActions>
          <TableActionButton icon={<EyeIcon className="w-4 h-4" />} label="View Details" onClick={() => {}} />
        </TableActions>
      )
    }
  ];

  return (
    <PageTransition className="flex flex-col gap-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Returns</h1>
          <p className="text-muted-foreground text-sm">Manage customer returns and process refunds.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
          <Link href="/sales/returns/create">
            <PlusIcon className="w-4 h-4 mr-2" /> New Return
          </Link>
        </Button>
      </div>

      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" slow>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <RefreshCcwIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Returns</p>
                  <h3 className="text-2xl font-bold">124</h3>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
        <StaggerItem>
          <AnimatedCard>
            <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <RefreshCcwIcon className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <h3 className="text-2xl font-bold">12</h3>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </StaggerItem>
      </StaggerList>

      <Card className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-6 border-border/50 shadow-sm bg-card/50">
        <CardHeader className="p-0">
          <SearchFilter
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by ID, Order, or Customer..."
            filters={[{
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "All Status", value: "all" },
                { label: "Pending", value: "pending", variant: "warning" },
                { label: "Approved", value: "approved", variant: "default" },
                { label: "Refunded", value: "refunded", variant: "success" },
                { label: "Rejected", value: "rejected", variant: "danger" },
              ]
            }]}
          />
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={filteredReturns}
            columns={columns}
            emptyMessage="No sales returns found matching your filters."
            emptyIcon={<RefreshCcwIcon className="w-8 h-8" />}
          />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
