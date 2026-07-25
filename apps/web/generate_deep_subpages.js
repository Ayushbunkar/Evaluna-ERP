const fs = require('fs');
const path = require('path');

const modules = [
  {
    name: 'picker',
    navItems: [
      { href: "/picker/pick-lists", title: "Pick Lists" },
      { href: "/picker/tasks", title: "Current Task" },
      { href: "/picker/completed", title: "Completed Picks" },
      { href: "/picker/pending", title: "Pending Queue" },
      { href: "/picker/returns", title: "Shelf Returns" },
      { href: "/picker/reports", title: "Picker Reports" }
    ]
  },
  {
    name: 'putter',
    navItems: [
      { href: "/putter/receiving", title: "Inbound Receiving" },
      { href: "/putter/put-away", title: "Put Away Tasks" },
      { href: "/putter/missing", title: "Missing Stock" },
      { href: "/putter/returns", title: "Sale Returns" },
      { href: "/putter/damage", title: "Damage Raise" },
      { href: "/putter/completed", title: "Completed Put-Aways" },
      { href: "/putter/reports", title: "Putter Reports" }
    ]
  },
  {
    name: 'hr',
    navItems: [
      { href: "/hr/employees", title: "Employee Directory" },
      { href: "/hr/attendance", title: "Attendance Tracking" },
      { href: "/hr/leave", title: "Leave Management" },
      { href: "/hr/salary", title: "Salary Structure" },
      { href: "/hr/payroll", title: "Payroll Processing" },
      { href: "/hr/performance", title: "Performance Metrics" },
      { href: "/hr/recruitment", title: "Recruitment Tracker" },
      { href: "/hr/reports", title: "HR Analytics" }
    ]
  },
  {
    name: 'customer',
    navItems: [
      { href: "/customer/orders", title: "Order History" },
      { href: "/customer/invoices", title: "Invoices" },
      { href: "/customer/wishlist", title: "My Wishlist" },
      { href: "/customer/loyalty", title: "Loyalty Program" },
      { href: "/customer/wallet", title: "Store Wallet" },
      { href: "/customer/addresses", title: "Saved Addresses" },
      { href: "/customer/returns", title: "My Returns" },
      { href: "/customer/support", title: "Help & Support" },
      { href: "/customer/profile", title: "My Profile" }
    ]
  },
  {
    name: 'supplier',
    navItems: [
      { href: "/supplier/purchase-orders", title: "Purchase Orders" },
      { href: "/supplier/grn", title: "Goods Received Notes" },
      { href: "/supplier/invoices", title: "Invoices" },
      { href: "/supplier/payments", title: "Payment Ledger" },
      { href: "/supplier/returns", title: "Purchase Returns" },
      { href: "/supplier/products", title: "Product Catalog" },
      { href: "/supplier/support", title: "Supplier Support" }
    ]
  }
];

const basePath = path.join(__dirname, 'src', 'app');

modules.forEach(mod => {
  mod.navItems.forEach(nav => {
    // Determine dir path based on href. e.g. "/picker/pick-lists" -> "src/app/picker/pick-lists"
    const dirPath = path.join(basePath, ...nav.href.split('/').filter(Boolean));
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const pageContent = `"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@evaluna/ui/components/card";
import { DataTable, type Column } from "@evaluna/ui/components/data-table";
import { SearchFilter } from "@evaluna/ui/components/search-filter";
import { PageTransition } from "@/lib/animations";

export default function ${nav.title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  const [searchTerm, setSearchTerm] = useState("");

  const columns: Column<any>[] = [
    { key: "id", header: "ID", sortable: true },
    { key: "date", header: "Date" },
    { key: "status", header: "Status" },
  ];

  return (
    <PageTransition className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">${nav.title}</h1>
        <p className="text-muted-foreground text-sm">Manage and view details for ${nav.title.toLowerCase()}.</p>
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
`;

    const filePath = path.join(dirPath, 'page.tsx');
    fs.writeFileSync(filePath, pageContent);
  });
});

console.log("Deep generation complete! Generated 39 sub-pages.");
