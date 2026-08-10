"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@evaluna/ui/components/card";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@evaluna/ui/components/tabs";
import {
	KeyboardIcon,
	MonitorSmartphoneIcon,
	PrinterIcon,
	SaveIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/lib/animations";

export default function SalespersonSettingsPage() {
	const handleSave = () => {
		toast.success("Settings saved successfully!");
	};

	return (
		<PageTransition className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-8">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">
					Salesperson Settings
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Manage your POS preferences, printing options, and shortcuts.
				</p>
			</div>

			<Tabs defaultValue="pos" className="w-full">
				<TabsList className="mb-4">
					<TabsTrigger value="pos" className="flex items-center gap-2">
						<MonitorSmartphoneIcon className="h-4 w-4" />
						POS Settings
					</TabsTrigger>
					<TabsTrigger value="printing" className="flex items-center gap-2">
						<PrinterIcon className="h-4 w-4" />
						Receipt & Printing
					</TabsTrigger>
					<TabsTrigger value="shortcuts" className="flex items-center gap-2">
						<KeyboardIcon className="h-4 w-4" />
						Shortcuts
					</TabsTrigger>
				</TabsList>

				{/* POS Settings */}
				<TabsContent value="pos">
					<Card>
						<CardHeader>
							<CardTitle>POS Configuration</CardTitle>
							<CardDescription>
								Configure your default behaviors in the POS interface.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-3">
								<Label>Default Payment Method</Label>
								<Select defaultValue="cash">
									<SelectTrigger className="w-[300px]">
										<SelectValue placeholder="Select payment method" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="cash">Cash (Default)</SelectItem>
										<SelectItem value="upi">UPI / QR Code</SelectItem>
										<SelectItem value="card">Credit/Debit Card</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-muted-foreground text-xs">
									This method will be auto-selected during checkout.
								</p>
							</div>

							<div className="grid gap-3">
								<Label>Quick Cash Buttons</Label>
								<div className="flex items-center gap-2">
									<Input defaultValue="50,100,500,1000" className="w-[300px]" />
								</div>
								<p className="text-muted-foreground text-xs">
									Comma-separated values for quick tender buttons (e.g.
									50,100,500).
								</p>
							</div>

							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<Label className="font-medium text-base">
										Enable Sound Effects
									</Label>
									<p className="mt-1 text-muted-foreground text-xs">
										Play sounds on successful scan and checkout.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										defaultChecked
										className="h-4 w-4 accent-primary"
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Printing */}
				<TabsContent value="printing">
					<Card>
						<CardHeader>
							<CardTitle>Receipt & Printer Options</CardTitle>
							<CardDescription>
								Manage how receipts are generated and printed.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center justify-between rounded-lg border p-4">
								<div>
									<Label className="font-medium text-base">
										Auto-Print Receipt
									</Label>
									<p className="mt-1 text-muted-foreground text-xs">
										Automatically trigger print dialog after checkout.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										defaultChecked
										className="h-4 w-4 accent-primary"
									/>
								</div>
							</div>

							<div className="grid gap-3">
								<Label>Paper Size</Label>
								<Select defaultValue="80mm">
									<SelectTrigger className="w-[300px]">
										<SelectValue placeholder="Select paper size" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="80mm">80mm Roll (Thermal)</SelectItem>
										<SelectItem value="58mm">58mm Roll (Thermal)</SelectItem>
										<SelectItem value="A4">A4 Standard</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-3">
								<Label>Footer Message</Label>
								<Input
									defaultValue="Thank you for your business! Please visit again."
									className="w-full max-w-md"
								/>
								<p className="text-muted-foreground text-xs">
									Text to show at the bottom of the printed receipt.
								</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Shortcuts */}
				<TabsContent value="shortcuts">
					<Card>
						<CardHeader>
							<CardTitle>Keyboard Shortcuts</CardTitle>
							<CardDescription>
								Speed up your workflow using keyboard hotkeys.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">Search Product</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										F2
									</kbd>
								</div>
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">Checkout</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										F9
									</kbd>
								</div>
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">Hold Bill</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										F8
									</kbd>
								</div>
								<div className="flex items-center justify-between border-b py-2">
									<span className="font-medium text-sm">Clear Cart</span>
									<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground opacity-100">
										Esc
									</kbd>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<div className="mt-2 flex justify-end">
				<Button onClick={handleSave} className="gap-2">
					<SaveIcon className="h-4 w-4" />
					Save Settings
				</Button>
			</div>
		</PageTransition>
	);
}
