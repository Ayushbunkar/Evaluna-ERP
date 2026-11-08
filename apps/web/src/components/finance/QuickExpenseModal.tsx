"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import { Textarea } from "@evaluna/ui/components/textarea";
import { Loader2Icon, PlusCircle, TagIcon, WalletIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

interface QuickExpenseModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

const COMMON_CATEGORIES = [
	"General Office",
	"Rent & Facility",
	"Electricity & Utilities",
	"Pantry & Food",
	"Stationery & Supplies",
	"Maintenance & Repairs",
	"Logistics & Courier",
	"Marketing & Ads",
	"Salary Advance",
	"Other",
];

export function QuickExpenseModal({
	open,
	onOpenChange,
	onSuccess,
}: QuickExpenseModalProps) {
	const trpc = useTRPC();
	const utils = trpc.useUtils();
	const locale = useLocale();

	const [amount, setAmount] = useState<string>("");
	const [category, setCategory] = useState<string>("General Office");
	const [description, setDescription] = useState<string>("");
	const [expenseDate, setExpenseDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);

	const createExpenseMutation = trpc.expenses.create.useMutation({
		onSuccess: () => {
			toast.success(
				locale === "hi"
					? `खर्च ₹${amount} सफलतापूर्वक दर्ज हुआ!`
					: `Expense ₹${amount} logged successfully!`,
			);
			utils.finance.getDashboardStats.invalidate();
			utils.expenses.list.invalidate();
			onOpenChange(false);
			setAmount("");
			setDescription("");
			setCategory("General Office");
			onSuccess?.();
		},
		onError: (err) => {
			toast.error(
				locale === "hi"
					? `खर्च दर्ज करने में त्रुटि: ${err.message}`
					: `Failed to record expense: ${err.message}`,
			);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const amt = Number.parseFloat(amount);
		if (Number.isNaN(amt) || amt <= 0) {
			toast.error(
				locale === "hi"
					? "कृपया वैध खर्च राशि दर्ज करें।"
					: "Please enter a valid expense amount.",
			);
			return;
		}
		if (!description.trim()) {
			toast.error(
				locale === "hi"
					? "कृपया खर्च का विवरण दर्ज करें।"
					: "Please enter expense description.",
			);
			return;
		}

		createExpenseMutation.mutate({
			amount: amt,
			description: description.trim(),
			category: category,
			expense_category: category,
			date: new Date(expenseDate),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md border-border bg-white dark:bg-slate-900">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 font-bold text-lg text-foreground">
						<WalletIcon className="h-5 w-5 text-blue-600" />
						{locale === "hi" ? "व्यावसायिक खर्च दर्ज करें" : "Record Business Expense"}
					</DialogTitle>
					<DialogDescription className="text-xs">
						{locale === "hi"
							? "ऑफ़िस, किराया, बिजली या अन्य दैनिक परिचालन खर्च सीधे दर्ज करें।"
							: "Log office, utility, rent, or operational expenses directly to company ledger."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div>
						<Label className="font-semibold text-xs">
							{locale === "hi" ? "खर्च राशि (₹) *" : "Expense Amount (₹) *"}
						</Label>
						<Input
							type="number"
							step="0.01"
							placeholder="e.g. 1500"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="mt-1 h-9 font-bold font-mono text-base"
							required
							autoFocus
						/>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "श्रेणी (Category)" : "Category"}
							</Label>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="mt-1 h-8 w-full rounded border border-input bg-background px-2 text-xs"
							>
								{COMMON_CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div>
							<Label className="font-semibold text-xs">
								{locale === "hi" ? "तारीख (Date)" : "Date"}
							</Label>
							<Input
								type="date"
								value={expenseDate}
								onChange={(e) => setExpenseDate(e.target.value)}
								className="mt-1 h-8 text-xs"
							/>
						</div>
					</div>

					<div>
						<Label className="font-semibold text-xs">
							{locale === "hi" ? "खर्च का विवरण *" : "Description / Reason *"}
						</Label>
						<Textarea
							placeholder="e.g. Office pantry groceries and tea/coffee supplies"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="mt-1 h-20 text-xs"
							required
						/>
					</div>

					<DialogFooter className="gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
						>
							{locale === "hi" ? "रद्द करें" : "Cancel"}
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={createExpenseMutation.isPending}
							className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
						>
							{createExpenseMutation.isPending ? (
								<>
									<Loader2Icon className="mr-1.5 h-4 w-4 animate-spin" />
									{locale === "hi" ? "दर्ज हो रहा है..." : "Saving..."}
								</>
							) : (
								<>
									<PlusCircle className="mr-1.5 h-4 w-4" />
									{locale === "hi" ? "खर्च सहेजें" : "Save Expense"}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
