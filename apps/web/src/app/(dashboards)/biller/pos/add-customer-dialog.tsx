// @ts-nocheck
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

interface AddCustomerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCustomerSelected: (id: number, name: string) => void;
}

export function AddCustomerDialog({
	open,
	onOpenChange,
	onCustomerSelected,
}: AddCustomerDialogProps) {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [customers, setCustomers] = useState<
		Array<{ id: number; name: string; email: string }>
	>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState<{
		id: number;
		name: string;
	} | null>(null);

	useEffect(() => {
		if (open && searchTerm) {
			const timer = setTimeout(() => {
				fetchCustomers();
			}, 300);
			return () => clearTimeout(timer);
		}
		if (open && !searchTerm) {
			fetchCustomers();
		}
	}, [open, searchTerm]);

	const fetchCustomers = async () => {
		if (!open) return;

		setIsLoading(true);
		try {
			const data = await trpc.pos.customers.query({
				search: searchTerm,
				limit: 50,
			});
			setCustomers(
				data.map((customer) => ({
					id: customer.id,
					name: customer.name,
					email: customer.email || "",
				})),
			);
		} catch (error) {
			console.error("Failed to fetch customers:", error);
			toast.error("Failed to load customers");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectCustomer = (customer: { id: number; name: string }) => {
		setSelectedCustomer(customer);
	};

	const handleConfirm = () => {
		if (!selectedCustomer) {
			toast.error("Please select a customer");
			return;
		}

		onCustomerSelected(selectedCustomer.id, selectedCustomer.name);
		onOpenChange(false);
		setSearchTerm("");
		setSelectedCustomer(null);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Select Customer</DialogTitle>
					<DialogDescription>
						Search for customers to add to the sale
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Search Customers</Label>
						<Input
							placeholder="Search for customers by name or email..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					{isLoading && (
						<div className="text-muted-foreground text-sm">Loading...</div>
					)}

					{searchTerm && customers.length > 0 && (
						<div className="space-y-2">
							<div className="border-b pb-2 font-medium text-muted-foreground text-sm">
								Available Customers
							</div>
							<div className="space-y-2">
								{customers.map((customer) => (
									<div
										key={customer.id}
										className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
											selectedCustomer?.id === customer.id ? "bg-muted" : ""
										}`}
										onClick={() => handleSelectCustomer(customer)}
									>
										<div>
											<div className="font-medium">{customer.name}</div>
											{customer.email && (
												<div className="text-muted-foreground text-sm">
													{customer.email}
												</div>
											)}
										</div>
										{selectedCustomer?.id === customer.id && (
											<div className="text-green-600">âœ“ Selected</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{searchTerm && customers.length === 0 && !isLoading && (
						<div className="text-muted-foreground text-sm">
							No customers found. Try a different search term.
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!selectedCustomer || isLoading}
					>
						{isLoading ? "Processing..." : "Confirm Selection"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}





