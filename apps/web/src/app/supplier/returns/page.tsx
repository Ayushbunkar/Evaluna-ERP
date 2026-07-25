"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { DataTable, type Column } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { PageTransition } from "@/lib/animations";

export default function PurchaseReturnsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const columns: Column<any>[] = [
    { key: "id", header: "ID", sortable: true },
    { key: "date", header: "Date" },
    { key: "status", header: "Status" },
  ];

  return (
    <PageTransition className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Returns</h1>
        <p className="text-muted-foreground text-sm">Manage and view details for purchase returns.</p>
      </div>
      
      <Card className="border-border/50 shadow-sm bg-card/50">
        <CardHeader className="p-4">
          <SearchFilter
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search records..."
          />
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={[]}
            columns={columns}
            emptyMessage="No records found in this module yet."
          />
        </CardContent>
      </Card>
    </PageTransition>
  );
}
