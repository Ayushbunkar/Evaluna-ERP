'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@evaluna/ui/components/button';
import { useRouter } from 'next/navigation';

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'grn_number',
    header: 'GRN Number',
    cell: ({ row }) => <span className="font-medium">{row.getValue('grn_number')}</span>
  },
  {
    id: 'supplier',
    header: 'Supplier',
    accessorFn: (row) => row.supplier?.name || "Unknown",
  },
  {
    accessorKey: 'total_amount',
    header: 'Total',
    cell: ({ row }) => `₹${row.getValue('total_amount')}`
  },
  {
    accessorKey: 'payment_status',
    header: 'Payment Status',
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded text-xs capitalize ${row.original.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {row.original.payment_status || "unpaid"}
      </span>
    )
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/purchases/${row.original.id}/return`)}>
            Return Items
          </Button>
        </div>
      );
    }
  }
];
