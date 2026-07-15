
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@evaluna/ui/components/button";
import { useTRPC } from "@/lib/trpc/client";
import { purchaseReturnSchema } from "@/lib/validation/purchase-return";
import { useRouter } from "next/navigation";

export function PurchaseReturnForm({ purchaseReturn }: { purchaseReturn?: z.infer<typeof purchaseReturnSchema> & { id: number } }) {
  const router = useRouter();
  const { data: purchases } = useTRPC().purchases.list.useQuery();
  const { data: products } = useTRPC().products.list.useQuery();

  const form = useForm({
    validator: zodValidator,
    defaultValues: purchaseReturn || {
      purchaseId: "",
      purchaseReturnItems: [],
    },
  });

  const { fields, append, remove } = form.useFieldArray({
    name: "purchaseReturnItems",
  });

  const { mutate: createPurchaseReturn } = useTRPC().purchaseReturns.create.useMutation({
    onSuccess: () => {
      router.push("/admin/purchase-returns/list");
    },
  });

  const { mutate: updatePurchaseReturn } = useTRPC().purchaseReturns.update.useMutation({
    onSuccess: () => {
      router.push("/admin/purchase-returns/list");
    },
  });

  const handleSubmit = (values: z.infer<typeof purchaseReturnSchema>) => {
    if (purchaseReturn) {
      updatePurchaseReturn({ ...values, id: purchaseReturn.id });
    } else {
      createPurchaseReturn(values);
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
        name="purchaseId"
        children={(field) => (
          <div>
            <label>Purchase</label>
            <select
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option value="">Select a purchase</option>
              {purchases?.map((purchase) => (
                <option key={purchase.id} value={purchase.id}>
                  {purchase.id}
                </option>
              ))}
            </select>
          </div>
        )}
      />

      <div>
        <h3 className="text-lg font-medium">Purchase Return Items</h3>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-4">
              <form.Field
                name={`purchaseReturnItems[${index}].productId`}
                children={(subField) => (
                  <div>
                    <label>Product</label>
                    <select
                      value={subField.state.value}
                      onChange={(e) => subField.handleChange(e.target.value)}
                    >
                      <option value="">Select a product</option>
                      {products?.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <form.Field
                name={`purchaseReturnItems[${index}].quantity`}
                children={(subField) => (
                  <div>
                    <label>Quantity</label>
                    <input
                      type="number"
                      value={subField.state.value}
                      onChange={(e) => subField.handleChange(Number(e.target.value))}
                    />
                  </div>
                )}
              />
              <Button type="button" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          className="mt-4"
          onClick={() => append({ productId: "", quantity: 1 })}
        >
          Add Item
        </Button>
      </div>

      <Button type="submit">{purchaseReturn ? "Update" : "Create"}</Button>
    </form>
  );
}
