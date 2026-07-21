'use client';

import { useTRPC } from '@/lib/trpc/client';
import { Button } from '@evaluna/ui/components/button';
import Link from 'next/link';
import { DataTable } from '@evaluna/ui/components/data-table';
import { columns } from './list/columns';

export default function ExpensesList() {
  const { data: expenses, isLoading } = useTRPC().expenses.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link href="/admin/expenses/create">
          <Button>New Expense</Button>
        </Link>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} data={expenses?.items ?? []} />
      )}
    </div>
  );
}
