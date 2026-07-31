"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import {
	motion,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";

// Dummy TRPC hook
const trpc = {
	accounting: {
		getAccounts: {
			useQuery: () => ({
				data: [
					{
						id: 1,
						code: "1000",
						name: "Assets",
						type: "Asset",
						balanceType: "Debit",
					},
					{
						id: 2,
						code: "2000",
						name: "Liabilities",
						type: "Liability",
						balanceType: "Credit",
					},
					{
						id: 3,
						code: "3000",
						name: "Equity",
						type: "Equity",
						balanceType: "Credit",
					},
					{
						id: 4,
						code: "4000",
						name: "Revenue",
						type: "Revenue",
						balanceType: "Credit",
					},
					{
						id: 5,
						code: "5000",
						name: "Expenses",
						type: "Expense",
						balanceType: "Debit",
					},
				],
				isLoading: false,
			}),
		},
	},
};

export default function ChartOfAccountsPage() {
	const { data: accounts, isLoading } = trpc.accounting.getAccounts.useQuery();
	const [open, setOpen] = useState(false);

	return (
		<PageTransition>
			<div className="mx-auto max-w-6xl space-y-6 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Chart of Accounts
						</h1>
						<p className="mt-2 text-muted-foreground">
							Manage your accounting ledgers.
						</p>
					</div>
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								<PlusIcon className="h-4 w-4" />
								Add Account
							</motion.button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add New Account</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Account Code</Label>
									<Input placeholder="e.g. 1000" />
								</div>
								<div className="space-y-2">
									<Label>Account Name</Label>
									<Input placeholder="e.g. Cash" />
								</div>
								<div className="space-y-2">
									<Label>Type</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select type..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Asset">Asset</SelectItem>
											<SelectItem value="Liability">Liability</SelectItem>
											<SelectItem value="Equity">Equity</SelectItem>
											<SelectItem value="Revenue">Revenue</SelectItem>
											<SelectItem value="Expense">Expense</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Balance Type</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Select balance type..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Debit">Debit</SelectItem>
											<SelectItem value="Credit">Credit</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setOpen(false)}>
									Cancel
								</Button>
								<Button onClick={() => setOpen(false)}>Save Account</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Accounts List</CardTitle>
						<CardDescription>
							A list of all accounts in the system.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p>Loading...</p>
						) : (
							<div className="rounded-md border">
								<div className="grid grid-cols-4 gap-4 border-b bg-muted/50 p-4 font-semibold">
									<div>Code</div>
									<div>Name</div>
									<div>Type</div>
									<div>Balance Type</div>
								</div>
								<StaggerList>
									{accounts?.map((acc) => (
										<StaggerItem key={acc.id}>
											<div className="grid grid-cols-4 gap-4 border-b p-4 last:border-0 hover:bg-muted/30">
												<div className="font-medium">{acc.code}</div>
												<div>{acc.name}</div>
												<div>{acc.type}</div>
												<div>{acc.balanceType}</div>
											</div>
										</StaggerItem>
									))}
								</StaggerList>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</PageTransition>
	);
}
