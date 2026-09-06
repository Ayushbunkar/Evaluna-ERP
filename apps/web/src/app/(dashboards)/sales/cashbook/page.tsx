"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
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
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";
import { useLocale } from "next-intl";

export default function CashBookPage() {
	const locale = useLocale();
	const [open, setOpen] = useState(false);
	const [type, setType] = useState<"in" | "out">("in");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");

	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Translations Dictionary
	const t = {
		title: locale === "hi" ? "दैनिक कैशबुक" : "Daily Cashbook",
		subtitle: locale === "hi" ? "कैश प्रवाह और खर्चों को ट्रैक करें।" : "Manage register cash flows and track expenses.",
		cashInBtn: locale === "hi" ? "कैश इन (In)" : "Cash In",
		cashOutBtn: locale === "hi" ? "कैश आउट (Out)" : "Cash Out",
		
		addTitleIn: locale === "hi" ? "कैश इन जोड़ें (Cash In)" : "Add Cash In",
		addTitleOut: locale === "hi" ? "कैश आउट जोड़ें (Cash Out)" : "Add Cash Out",
		amountLabel: locale === "hi" ? "राशि" : "Amount",
		descLabel: locale === "hi" ? "विवरण / कारण" : "Description",
		descPlaceholder: locale === "hi" ? "कैश प्रविष्टि का कारण दर्ज करें" : "Reason for cash entry",
		saveBtn: locale === "hi" ? "प्रविष्टि सहेजें" : "Save Entry",
		saving: locale === "hi" ? "सहेजा जा रहा है..." : "Saving...",
		
		cardIn: locale === "hi" ? "दैनिक कैश इन (Cash In)" : "Daily Cash In",
		salesLabel: locale === "hi" ? "बिक्री:" : "Sales:",
		cardOut: locale === "hi" ? "दैनिक कैश आउट (Cash Out)" : "Daily Cash Out",
		expensesLabel: locale === "hi" ? "खर्चे:" : "Expenses:",
		cardNet: locale === "hi" ? "शुद्ध दैनिक प्रवाह" : "Net Daily Flow",
		netMovement: locale === "hi" ? "आज का शुद्ध कैश प्रवाह" : "Net movement today",
		
		recentTxTitle: locale === "hi" ? "हाल के लेनदेन" : "Recent Transactions",
		thDate: locale === "hi" ? "तारीख और समय" : "Date & Time",
		thType: locale === "hi" ? "प्रकार" : "Type",
		thCategory: locale === "hi" ? "श्रेणी" : "Category",
		thDesc: locale === "hi" ? "विवरण" : "Description",
		thAmount: locale === "hi" ? "राशि" : "Amount",
		noTx: locale === "hi" ? "आज कोई कैश लेनदेन नहीं हुआ है।" : "No recent cash transactions today",
		toastSuccess: locale === "hi" ? "कैश प्रविष्टि जोड़ी गई" : "Cash entry added",
		toastErrAmount: locale === "hi" ? "वैध राशि आवश्यक है" : "Valid amount required",
		toastErrDesc: locale === "hi" ? "विवरण आवश्यक है" : "Description required",
	};

	const { data: summary, isLoading: loadingSummary } =
		trpc.cashbook.getDailySummary.useQuery({});
	const { data: ledger, isLoading: loadingLedger } =
		trpc.cashbook.getLedger.useQuery({ limit: 100 });

	const addEntry = trpc.cashbook.addEntry.useMutation({
		onSuccess: () => {
			toast.success(t.toastSuccess);
			setOpen(false);
			setAmount("");
			setDescription("");
			queryClient.invalidateQueries({
				queryKey: [["cashbook", "getDailySummary"]],
			});
			queryClient.invalidateQueries({ queryKey: [["cashbook", "getLedger"]] });
		},
		onError: (err) => toast.error(err.message),
	});

	const handleSave = () => {
		if (!amount || Number.isNaN(Number.parseFloat(amount)))
			return toast.error(t.toastErrAmount);
		if (!description) return toast.error(t.toastErrDesc);

		addEntry.mutate({
			amount: Number.parseFloat(amount),
			type,
			description,
			category: "manual",
			user_uid: "current-user",
		});
	};

	return (
		<PageTransition className="flex flex-col gap-6 p-4">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">{t.title}</h1>
					<p className="text-muted-foreground text-sm">
						{t.subtitle}
					</p>
				</div>
				<div className="flex gap-2">
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button
								onClick={() => setType("in")}
								className="bg-emerald-600 text-white shadow-emerald-900/20 shadow-lg hover:bg-emerald-700"
							>
								<ArrowDownRight className="mr-2 h-4 w-4" /> {t.cashInBtn}
							</Button>
						</DialogTrigger>
						<DialogTrigger asChild>
							<Button
								onClick={() => setType("out")}
								variant="destructive"
								className="shadow-lg shadow-red-900/20"
							>
								<ArrowUpRight className="mr-2 h-4 w-4" /> {t.cashOutBtn}
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>
									{type === "in" ? t.addTitleIn : t.addTitleOut}
								</DialogTitle>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label>{t.amountLabel}</Label>
									<Input
										type="number"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder="0.00"
										className="text-lg"
									/>
								</div>
								<div className="grid gap-2">
									<Label>{t.descLabel}</Label>
									<Input
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder={t.descPlaceholder}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handleSave}
									disabled={addEntry.isPending}
									className="w-full"
								>
									{addEntry.isPending ? t.saving : t.saveBtn}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<StaggerList className="grid gap-4 md:grid-cols-3" slow>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									{t.cardIn}
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
									<ArrowDownRight className="h-4 w-4 text-emerald-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-emerald-500">
									₹{summary?.totalIn?.toFixed(2) || "0.00"}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									{t.salesLabel} ₹{summary?.sales?.toFixed(2) || "0.00"}
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									{t.cardOut}
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
									<ArrowUpRight className="h-4 w-4 text-red-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-red-500">
									₹{summary?.totalOut?.toFixed(2) || "0.00"}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									{t.expensesLabel} ₹{summary?.expenses?.toFixed(2) || "0.00"}
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
				<StaggerItem>
					<AnimatedCard>
						<Card className="border-border/50 bg-card/80 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									{t.cardNet}
								</CardTitle>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
									<Wallet className="h-4 w-4 text-blue-500" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl text-blue-500">
									₹{summary?.net?.toFixed(2) || "0.00"}
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									{t.netMovement}
								</p>
							</CardContent>
						</Card>
					</AnimatedCard>
				</StaggerItem>
			</StaggerList>

			<Card className="flex-1 border-border/50 bg-card/50 shadow-sm">
				<CardHeader>
					<CardTitle>{t.recentTxTitle}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left text-sm">
							<thead>
								<tr className="border-border/50 border-b text-muted-foreground">
									<th className="py-3 font-medium">{t.thDate}</th>
									<th className="font-medium">{t.thType}</th>
									<th className="font-medium">{t.thCategory}</th>
									<th className="font-medium">{t.thDesc}</th>
									<th className="text-right font-medium">{t.thAmount}</th>
								</tr>
							</thead>
							<tbody>
								{ledger?.items?.map((tx) => (
									<tr
										key={tx.id}
										className="border-border/30 border-b transition-colors last:border-0 hover:bg-muted/30"
									>
										<td className="whitespace-nowrap py-3 text-muted-foreground">
											{format(new Date(tx.created_at || new Date()), "PP p")}
										</td>
										<td>
											<span
												className={`rounded-full px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider ${tx.type === "in" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
											>
												{tx.type}
											</span>
										</td>
										<td className="text-muted-foreground capitalize">
											{tx.category || "manual"}
										</td>
										<td className="max-w-[200px] truncate font-medium">
											{tx.description || "-"}
										</td>
										<td
											className={`text-right font-bold ${tx.type === "in" ? "text-emerald-600" : "text-red-600"}`}
										>
											{tx.type === "in" ? "+" : "-"}₹
											{Number(tx.amount).toFixed(2)}
										</td>
									</tr>
								))}
								{(!ledger?.items || ledger.items.length === 0) && (
									<tr>
										<td
											colSpan={5}
											className="py-12 text-center text-muted-foreground"
										>
											<Wallet className="mx-auto mb-3 h-12 w-12 opacity-20" />
											<p>{t.noTx}</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
