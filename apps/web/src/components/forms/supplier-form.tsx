
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@evaluna/ui/components/button";
import { useTRPC } from "@/lib/trpc/client";
import { supplierSchema } from "@/lib/validation/supplier";
import { useRouter } from "next/navigation";

export function SupplierForm({ supplier }: { supplier?: z.infer<typeof supplierSchema> & { id: number } }) {
  const router = useRouter();

  const form = useForm({
    validator: zodValidator,
    defaultValues: supplier || {
      name: "",
      email: "",
      phone: "",
      address: "",
      gstin: "",
      pan: "",
    },
  });

  const { mutate: createSupplier } = useTRPC().suppliers.create.useMutation({
    onSuccess: () => {
      router.push("/admin/suppliers/list");
    },
  });

  const { mutate: updateSupplier } = useTRPC().suppliers.update.useMutation({
    onSuccess: () => {
      router.push("/admin/suppliers/list");
    },
  });

  const handleSubmit = (values: z.infer<typeof supplierSchema>) => {
    if (supplier) {
      updateSupplier({ ...values, id: supplier.id });
    } else {
      createSupplier(values);
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
        name="name"
        children={(field) => (
          <div>
            <label>Name</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="email"
        children={(field) => (
          <div>
            <label>Email</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="phone"
        children={(field) => (
          <div>
            <label>Phone</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="address"
        children={(field) => (
          <div>
            <label>Address</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="gstin"
        children={(field) => (
          <div>
            <label>GSTIN</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <form.Field
        name="pan"
        children={(field) => (
          <div>
            <label>PAN</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      />

      <Button type="submit">{supplier ? "Update" : "Create"}</Button>
    </form>
  );
}
