'use client';

import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Button } from '@evaluna/ui/components/button';
import { trpc } from '@/lib/trpc/client';
import { purchaseSchema } from '@/lib/validation/purchase';
import { useRouter } from 'next/navigation';

export function PurchaseForm({ purchase }: { purchase?: z.infer<typeof purchaseSchema> & { id: string } }) {
  const router = useRouter();

  const [suppliers] = trpc.suppliers.list.useSuspenseQuery({});
  const [products] = trpc.products.list.useSuspenseQuery();

  const form = useForm({
    validator: zodValidator,
    defaultValues: purchase || {
      supplierId: '',
      total: 0,
      items: [],
    },
  });

  const { mutate: createPurchase } = trpc.purchases.create.useMutation({
    onSuccess: () => {
      router.push('/admin/purchases');
    },
  });

  const { mutate: updatePurchase } = trpc.purchases.update.useMutation({
    onSuccess: () => {
      router.push('/admin/purchases');
    },
  });

  const handleSubmit = (values: z.infer<typeof purchaseSchema>) => {
    if (purchase) {
      updatePurchase({ ...values, id: purchase.id });
    } else {
      createPurchase(values);
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
        name="supplierId"
        children={(field) => (
          <div>
            <label>Supplier</label>
            <select
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option value="">Select a supplier</option>
              {suppliers?.items.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        )}
      />

      <div>
        <h3 className="text-lg font-medium">Items</h3>
        {form.state.values.items.map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <form.Field
              name={`items[${index}].productId`}
              children={(field) => (
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                >
                  <option value="">Select a product</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              )}
            />
            <form.Field
              name={`items[${index}].quantity`}
              children={(field) => (
                <input
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="Quantity"
                />
              )}
            />
            <form.Field
              name={`items[${index}].price`}
              children={(field) => (
                <input
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  placeholder="Price"
                />
              )}
            />
            <Button
              type="button"
              onClick={() => form.removeFieldValue('items', index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() =>
            form.pushFieldValue('items', { productId: '', quantity: 1, price: 0 })
          }
        >
          Add Item
        </Button>
      </div>

      <form.Field
        name="total"
        children={(field) => (
          <div>
            <label>Total</label>
            <input
              type="number"
              value={field.state.value}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      />

      <Button type="submit">{purchase ? 'Update' : 'Create'}</Button>
    </form>
  );
}
