'use client';

import { ExpenseForm } from '@/components/forms/expense-form';

export default function CreateExpensePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Expense</h1>
      <ExpenseForm />
    </div>
  );
}
