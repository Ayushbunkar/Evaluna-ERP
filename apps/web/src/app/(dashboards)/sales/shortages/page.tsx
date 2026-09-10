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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@evaluna/ui/components/table";
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	ChevronRightIcon,
	CornerDownRightIcon,
	InboxIcon,
	PlusIcon,
	RefreshCwIcon,
	SendIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";
import { useTRPC } from "@/lib/trpc/client";

export default function SalesShortagesPage() {
	const trpc = useTRPC();
	const locale = useLocale();

	const [requestOpen, setRequestOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<{
		id: string;
		product: string;
		sku: string;
		quantity_needed: number;
	} | null>(null);

	const [quantity, setQuantity] = useState(5);
	const [notes, setNotes] = useState("");

	const utils = trpc.useUtils();

	// Fetch stock shortages
	const {
		data: shortages,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = trpc.putter.getMissingStock.useQuery({});

	// Request replenishment mutation
	const requestReplenishMutation = trpc.putter.requestReplenishment.useMutation(
		{
			onSuccess: () => {
				toast.success(
					locale === "hi"
						? "स्टॉक पुनःपूर्ति अनुरोध सफलतापूर्वक सबमिट किया गया!"
						: "Stock replenishment request submitted successfully to Inventory Manager!",
				);
				setRequestOpen(false);
				setNotes("");
				utils.putter.getMissingStock.invalidate();
			},
			onError: (err) => {
				toast.error(err.message || "Failed to submit request.");
			},
		},
	);

	const handleOpenRequest = (item: typeof selectedItem) => {
		if (!item) return;
		// Extract raw product ID from the item ID (which is 'MS-ID')
		setSelectedItem(item);
		setQuantity(item.quantity_needed || 10);
		setNotes("Urgent stock required for customer orders.");
		setRequestOpen(true);
	};

	const handleSendRequest = () => {
		if (!selectedItem) return;
		const rawId = Number.parseInt(selectedItem.id.replace("MS-", ""), 10);
		if (Number.isNaN(rawId)) {
			toast.error("Invalid product reference.");
			return;
		}

		if (quantity <= 0) {
			toast.error("Quantity must be greater than 0.");
			return;
		}

		requestReplenishMutation.mutate({
			product_id: rawId,
			quantity,
			notes: notes.trim(),
		});
	};

	const t = {
		title:
			locale === "hi" ? "स्टॉक की कमी और कमी सूचना" : "Stock Shortages & Alerts",
		subtitle:
			locale === "hi"
				? "उन उत्पादों को ट्रैक करें जिनकी इन्वेंट्री कम है और सीधे इन्वेंट्री मैनेजर को पुनःपूर्ति अनुरोध सबमिट करें।"
				: "Track low-inventory products and directly submit replenishment alerts to the Inventory Manager.",
		product: locale === "hi" ? "उत्पाद" : "Product",
		sku: locale === "hi" ? "SKU" : "SKU",
		qtyNeeded: locale === "hi" ? "कमी मात्रा" : "Qty Needed",
		action: locale === "hi" ? "कार्रवाई" : "Action",
		requestBtn: locale === "hi" ? "स्टॉक मांगें" : "Request Stock",
		requestTitle:
			locale === "hi" ? "स्टॉक पुनःपूर्ति अनुरोध" : "Request Stock Replenishment",
		requestDesc:
			locale === "hi"
				? "यह अनुरोध समीक्षा और अनुमोदन के लिए इन्वेंट्री मैनेजर / गोदाम पर्यवेक्षक को भेजा जाएगा।"
				: "This alert will be sent to the Inventory Manager / Warehouse Supervisor for immediate review and action.",
		notesLabel:
			locale === "hi"
				? "विशेष निर्देश / टिप्पणियाँ"
				: "Special Instructions / Notes",
		cancel: locale === "hi" ? "रद्द करें" : "Cancel",
		send: locale === "hi" ? "अनुरोध भेजें" : "Send Alert",
		sending: locale === "hi" ? "भेजा जा रहा है..." : "Sending...",
		loading:
			locale === "hi"
				? "स्टॉक अलर्ट लोड हो रहे हैं..."
				: "Loading shortages alerts...",
		emptyTitle: locale === "hi" ? "कोई कमी नहीं!" : "All Stock Full!",
		emptyDesc:
			locale === "hi"
				? "सभी उत्पादों का स्टॉक वर्तमान में सुरक्षित सीमा के भीतर है। कोई स्टॉक कमी दर्ज नहीं है।"
				: "All products are currently stocked within safe parameters. No shortages reported.",
	};

	return (
		<PageTransition className="container mx-auto space-y-6">
			{/* Page Header */}
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div>
					<h1 className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight sm:text-2xl">
						<AlertTriangleIcon className="h-6 w-6 text-amber-500" />
						{t.title}
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						{t.subtitle}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isLoading || isRefetching}
					className="gap-1.5 self-start sm:self-center"
				>
					<RefreshCwIcon
						className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
					/>
					{isRefetching ? "Refreshing…" : "Refresh"}
				</Button>
			</div>

			{/* Main List */}
			{isLoading ? (
				<div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
					{t.loading}
				</div>
			) : error ? (
				<div className="flex h-[250px] items-center justify-center text-destructive text-sm">
					Error loading shortages: {error.message}
				</div>
			) : shortages.length === 0 ? (
				<Card className="border-border/50 bg-card/40">
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
						<CheckCircle2Icon className="h-10 w-10 text-emerald-500" />
						<p className="font-semibold text-foreground text-sm">
							{t.emptyTitle}
						</p>
						<p className="text-xs">{t.emptyDesc}</p>
					</CardContent>
				</Card>
			) : (
				<Card className="border-border/50 bg-card/50 shadow-sm">
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.product}</TableHead>
									<TableHead>{t.sku}</TableHead>
									<TableHead className="text-center">{t.qtyNeeded}</TableHead>
									<TableHead className="text-right">{t.action}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{shortages.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-semibold text-foreground text-sm">
											<div>
												<p>{item.product}</p>
												<span className="mt-0.5 inline-flex items-center rounded-md border border-border/40 bg-muted/80 px-1.5 py-0.5 font-bold font-mono text-[10px] text-muted-foreground">
													ID: {item.id.replace("MS-", "")}
												</span>
											</div>
										</TableCell>
										<TableCell className="font-mono text-muted-foreground text-xs">
											{item.sku}
										</TableCell>
										<TableCell className="text-center font-bold font-mono text-amber-600 text-sm">
											{item.quantity_needed}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="secondary"
												size="sm"
												className="gap-1 text-xs transition-colors hover:bg-amber-500 hover:text-white"
												onClick={() => handleOpenRequest(item)}
											>
												<SendIcon className="h-3 w-3" />
												{t.requestBtn}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Replenishment Dialogue */}
			<Dialog open={requestOpen} onOpenChange={setRequestOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-1.5 text-lg">
							<AlertTriangleIcon className="h-5 w-5 text-amber-500" />
							{t.requestTitle}
						</DialogTitle>
						<DialogDescription className="pt-1 text-xs">
							{t.requestDesc}
						</DialogDescription>
					</DialogHeader>

					{selectedItem && (
						<div className="space-y-4 py-3 text-sm">
							<div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/70 p-3">
								<p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Product Details
								</p>
								<div className="space-y-1 text-xs">
									<p className="font-bold text-foreground text-sm">
										{selectedItem.product}
									</p>
									<p className="font-mono text-muted-foreground">
										SKU: {selectedItem.sku}
									</p>
									<p className="text-muted-foreground">
										Product Number/ID:{" "}
										<strong className="font-bold font-mono text-foreground">
											{selectedItem.id.replace("MS-", "")}
										</strong>
									</p>
									<p className="flex items-center gap-1 pt-0.5 font-semibold text-amber-600">
										<CornerDownRightIcon className="h-3.5 w-3.5" />
										Current Deficit Shortage: {selectedItem.quantity_needed}{" "}
										units
									</p>
								</div>
							</div>

							<div className="grid gap-3">
								<div className="space-y-1.5">
									<Label className="font-semibold text-muted-foreground text-xs">
										Quantity to Request *
									</Label>
									<Input
										type="number"
										min={1}
										value={quantity}
										onChange={(e) =>
											setQuantity(Math.max(1, Number(e.target.value) || 1))
										}
										className="h-9 text-xs"
									/>
								</div>

								<div className="space-y-1.5">
									<Label className="font-semibold text-muted-foreground text-xs">
										{t.notesLabel}
									</Label>
									<textarea
										placeholder="e.g. Need immediately for customer ORD-439"
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
										className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									/>
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="outline" onClick={() => setRequestOpen(false)}>
							{t.cancel}
						</Button>
						<Button
							onClick={handleSendRequest}
							disabled={requestReplenishMutation.isPending}
							className="bg-amber-500 font-semibold text-white hover:bg-amber-600"
						>
							{requestReplenishMutation.isPending ? t.sending : t.send}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}
