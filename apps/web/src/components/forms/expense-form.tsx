peorply"use client";

import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { useTRPC } from "@/lib/trpc/client";
import type { expenseSchema } from "@/lib/validation/expense";

export function ExpenseForm({
	expense,
}: {
	expense?: z.infer<typeof expenseSchema> & { id: string };
}) {
	const router = useRouter();

	const form = useForm({
		validator: zodValidator,
		defaultValues: expense || {
			description: "",
			amount: 0,
			date: new Date(),
			category: "",
		},
	});

	const { mutate: createExpense } = useTRPC().expenses.create.useMutation({
		onSuccess: () => {
			router.push("/admin/expenses");
		},
	});

	const { mutate: updateExpense } = useTRPC().expenses.update.useMutation({
		onSuccess: () => {
			router.push("/admin/expenses");
		},
	});

	const handleSubmit = (values: z.infer<typeof expenseSchema>) => {
		if (expense) {
			updateExpense({ ...values, id: expense.id });
		} else {
			createExpense(values);
		}
	};

	// Common expense categories
	const expenseCategories = [
		"Rent",
		"Utilities",
		"Salaries",
		"Marketing",
		"Office Supplies",
		"Travel",
		"Maintenance",
		"Insurance",
		"Taxes",
		"Other",
	];

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit(handleSubmit)();
			}}
			className="space-y-6 max-w-2xl"
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="description">Description</Label>
					<form.Field
						name="description"
						children={(field) => (
							<Input
								id="description"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="Expense description"
							/>
						)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="amount">Amount</Label>
					<form.Field
						name="amount"
						children={(field) => (
							<Input
								id="amount"
								type="number"
								value={field.state.value}
								onChange={(e) => field.handleChange(Number(e.target.value))}
								placeholder="Amount"
							/>
						)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="date">Date</Label>
					<form.Field
						name="date"
						children={(field) => (
							<Input
								id="date"
								type="date"
								value={field.state.value.toISOString().split("T")[0]}
								onChange={(e) => field.handleChange(new Date(e.target.value))}
							/>
						)}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="category">Category</Label>
					<form.Field
						name="category"
						children={(field) => (
							<Select
								value={field.state.value}
								onValueChange={(value) => field.handleChange(value)}
							>
								<SelectTrigger id="category">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{expenseCategories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					/>
				</div>
			</div>

			<div className="flex justify-end pt-4">
				<Button type="submit" size="lg">
					{expense ? "Update Expense" : "Create Expense"}
				</Button>
			</div>
		</form>
	);
}