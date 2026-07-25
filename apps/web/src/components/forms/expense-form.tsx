'use client';

import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Button } from '@evaluna/ui/components/button';
import { useTRPC } from '@/lib/trpc/client';
import { expenseSchema } from '@/lib/validation/expense';
import { useRouter } from 'next/navigation';

export function ExpenseForm({ expense }: { expense?: z.infer<typeof expenseSchema> & { id: string } }) {
  const router = useRouter();

  const form = useForm({
    validator: zodValidator,
    defaultValues: expense || {
      description: '',
      amount: 0,
      date: new Date(),
      category: '',
    },
  });

  const { mutate: createExpense } = useTRPC().expenses.create.useMutation({
    onSuccess: () => {
      router.push('/admin/expenses');
    },
  });

  const { mutate: updateExpense } = useTRPC().expenses.update.useMutation({
    onSuccess: () => {
      router.push('/admin/expenses');
    },
  });

  const handleSubmit = (values: z.infer<typeof expenseSchema>) => {
    if (expense) {
      updateExpense({ ...values, id: expense.id });
    } else {
      createExpense(values);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit(handleSubmit)();
      }}
      className="space-y-4"
    >
      <form.Field
        name="description"
        children={(field) => (
          <div>
            <label>Description</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="amount"
        children={(field) => (
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      />

      <form.Field
        name="date"
        children={(field) => (
          <div>
            <label>Date</label>
            <input
              type="date"
              value={field.state.value.toISOString().split('T')[0]}
              onChange={(e) => field.handleChange(new Date(e.target.value))}
            />
          </div>
        )}
      />

      <form.Field
        name="category"
        children={(field) => (
          <div>
            <label>Category</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <Button type="submit">{expense ? 'Update' : 'Create'}</Button>
    </form>
  );
}
