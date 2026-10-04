"use client";

import { Badge } from "@evaluna/ui/components/badge";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Textarea } from "@evaluna/ui/components/textarea";
import {
	AlertTriangle,
	CheckCheck,
	Clock,
	Copy,
	FileText,
	Globe,
	Loader2,
	MessageSquare,
	Phone,
	Plus,
	RefreshCw,
	Search,
	Send,
	ShieldCheck,
	Smartphone,
	Sparkles,
	Truck,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export function WhatsAppSmsHub() {
	const trpc = useTRPC();
	const [activeTab, setActiveTab] = useState<"logs" | "templates">("logs");
	const [channelFilter, setChannelFilter] = useState<
		"all" | "whatsapp" | "sms"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Test Alert Dialog State
	const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
	const [testChannel, setTestChannel] = useState<"whatsapp" | "sms">(
		"whatsapp",
	);
	const [testPhone, setTestPhone] = useState("+91 ");
	const [testName, setTestName] = useState("");
	const [selectedTemplateId, setSelectedTemplateId] =
		useState("ORDER_CONFIRMED");
	const [customEn, setCustomEn] = useState("");
	const [customHi, setCustomHi] = useState("");

	// Queries & Mutations
	const { data: stats, refetch: refetchStats } =
		trpc.whatsappSms.getStats.useQuery();
	const {
		data: logs = [],
		isLoading: isLoadingLogs,
		refetch: refetchLogs,
	} = trpc.whatsappSms.getLogs.useQuery({
		channel: channelFilter,
		search: searchQuery,
	});
	const { data: templates = [] } = trpc.whatsappSms.getTemplates.useQuery();

	const sendMutation = trpc.whatsappSms.sendTestAlert.useMutation({
		onSuccess: () => {
			toast.success("WhatsApp / SMS alert dispatched successfully!");
			setIsSendDialogOpen(false);
			void refetchLogs();
			void refetchStats();
		},
		onError: (err) => {
			toast.error(`Dispatch failed: ${err.message}`);
		},
	});

	const handleSendTest = () => {
		if (!testPhone || testPhone.length < 8) {
			toast.error("Please enter a valid phone number");
			return;
		}
		sendMutation.mutate({
			channel: testChannel,
			recipientPhone: testPhone,
			recipientName: testName || undefined,
			templateId: selectedTemplateId,
			customMessageEn: customEn || undefined,
			customMessageHi: customHi || undefined,
		});
	};

	return (
		<div className="space-y-6">
			{/* Overview Metric Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="border-emerald-500/20 bg-emerald-500/5 shadow-xs">
					<CardContent className="flex items-center justify-between p-4">
						<div>
							<p className="font-semibold text-emerald-600 text-xs dark:text-emerald-400">
								WhatsApp Dispatched
							</p>
							<h3 className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
								{stats?.whatsappCount ?? 0}
							</h3>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
							<MessageSquare className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-sky-500/20 bg-sky-500/5 shadow-xs">
					<CardContent className="flex items-center justify-between p-4">
						<div>
							<p className="font-semibold text-sky-600 text-xs dark:text-sky-400">
								SMS Gateways Sent
							</p>
							<h3 className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
								{stats?.smsCount ?? 0}
							</h3>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
							<Smartphone className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-blue-500/20 bg-blue-500/5 shadow-xs">
					<CardContent className="flex items-center justify-between p-4">
						<div>
							<p className="font-semibold text-blue-600 text-xs dark:text-blue-400">
								Delivery Rate
							</p>
							<h3 className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
								{stats?.deliveryRate ?? 100}%
							</h3>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
							<CheckCheck className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-amber-500/20 bg-amber-500/5 shadow-xs">
					<CardContent className="flex items-center justify-between p-4">
						<div>
							<p className="font-semibold text-amber-600 text-xs dark:text-amber-400">
								Total Automated Triggers
							</p>
							<h3 className="mt-1 font-bold text-2xl text-slate-900 dark:text-slate-100">
								{stats?.totalSent ?? 0}
							</h3>
						</div>
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
							<Sparkles className="h-5 w-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Actions Bar & Tab Switcher */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
					<Button
						variant={activeTab === "logs" ? "default" : "ghost"}
						size="sm"
						onClick={() => setActiveTab("logs")}
						className="gap-2 font-semibold text-xs"
					>
						<MessageSquare className="h-3.5 w-3.5" />
						Live Delivery Feed
					</Button>
					<Button
						variant={activeTab === "templates" ? "default" : "ghost"}
						size="sm"
						onClick={() => setActiveTab("templates")}
						className="gap-2 font-semibold text-xs"
					>
						<FileText className="h-3.5 w-3.5" />
						Message Templates ({templates.length})
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							void refetchLogs();
							void refetchStats();
						}}
						className="gap-1.5 font-semibold text-xs"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						Refresh
					</Button>
					<Button
						size="sm"
						onClick={() => setIsSendDialogOpen(true)}
						className="gap-1.5 bg-emerald-600 font-semibold text-white text-xs hover:bg-emerald-700"
					>
						<Send className="h-3.5 w-3.5" />
						Send Test Alert
					</Button>
				</div>
			</div>

			{/* Tab 1: Live Dispatch Log Feed */}
			{activeTab === "logs" && (
				<Card className="shadow-sm">
					<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="font-bold text-base">
								Automated WhatsApp & SMS Feed
							</CardTitle>
							<CardDescription className="text-xs">
								Real-time log of customer notifications, driver route
								dispatches, and warehouse alerts
							</CardDescription>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							<div className="relative w-full sm:w-64">
								<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Search name, phone, or message..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-8 pl-8 text-xs"
								/>
							</div>

							<Select
								value={channelFilter}
								onValueChange={(val: any) => setChannelFilter(val)}
							>
								<SelectTrigger className="h-8 w-32 text-xs">
									<SelectValue placeholder="All Channels" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Channels</SelectItem>
									<SelectItem value="whatsapp">WhatsApp</SelectItem>
									<SelectItem value="sms">SMS Only</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</CardHeader>

					<CardContent className="p-0">
						{isLoadingLogs ? (
							<div className="flex justify-center py-12">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : (
							<div className="divide-y divide-slate-100 dark:divide-slate-800">
								{logs.map((log) => (
									<div
										key={log.id}
										className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-start sm:justify-between dark:hover:bg-slate-900/40"
									>
										<div className="flex items-start gap-3">
											<div
												className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
													log.channel === "whatsapp"
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
														: "bg-sky-500/10 text-sky-600 dark:text-sky-400"
												}`}
											>
												{log.channel === "whatsapp" ? (
													<MessageSquare className="h-5 w-5" />
												) : (
													<Smartphone className="h-5 w-5" />
												)}
											</div>

											<div className="space-y-1">
												<div className="flex flex-wrap items-center gap-2">
													<span className="font-bold text-slate-900 text-sm dark:text-slate-100">
														{log.recipientName}
													</span>
													<span className="font-mono text-[#1e293b] text-xs dark:text-[#f8fafc]">
														{log.recipientPhone}
													</span>
													<Badge
														variant="outline"
														className="font-semibold text-[10px] uppercase"
													>
														{log.event.replace(/_/g, " ")}
													</Badge>
												</div>

												<div className="space-y-1 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900/60">
													<p className="font-medium text-slate-800 text-xs dark:text-slate-200">
														<span className="mr-1.5 font-semibold text-blue-600 dark:text-blue-400">
															EN:
														</span>
														{log.messageEn}
													</p>
													{log.messageHi && (
														<p className="text-slate-600 text-xs dark:text-slate-400">
															<span className="mr-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
																HI:
															</span>
															{log.messageHi}
														</p>
													)}
												</div>
											</div>
										</div>

										<div className="flex shrink-0 items-center justify-between sm:flex-col sm:items-end">
											<Badge
												className={`text-[10px] uppercase ${
													log.status === "delivered" || log.status === "read"
														? "bg-emerald-600 text-white"
														: "bg-blue-600 text-white"
												}`}
											>
												{log.status}
											</Badge>
											<span className="flex items-center gap-1 font-medium text-[11px] text-slate-400">
												<Clock className="h-3 w-3" />
												{new Date(log.sentAt).toLocaleTimeString()}
											</span>
										</div>
									</div>
								))}

								{logs.length === 0 && (
									<div className="py-12 text-center text-slate-400 text-xs">
										No WhatsApp or SMS notification logs found matching filter
										criteria.
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Tab 2: Message Templates & Variables */}
			{activeTab === "templates" && (
				<div className="grid gap-4 md:grid-cols-2">
					{templates.map((tpl) => (
						<Card
							key={tpl.id}
							className="shadow-xs transition-all hover:shadow-sm"
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between gap-2">
									<div>
										<CardTitle className="font-bold text-base">
											{tpl.name}
										</CardTitle>
										<CardDescription className="text-xs">
											{tpl.category}
										</CardDescription>
									</div>
									<div className="flex gap-1">
										{tpl.channels.map((ch) => (
											<Badge
												key={ch}
												variant="outline"
												className={`text-[9px] uppercase ${
													ch === "whatsapp"
														? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
														: "border-sky-500/40 text-sky-600 dark:text-sky-400"
												}`}
											>
												{ch}
											</Badge>
										))}
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 pt-0">
								<div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900/60">
									<p className="font-medium text-slate-800 dark:text-slate-200">
										<span className="mr-1 font-semibold text-blue-600 dark:text-blue-400">
											English:
										</span>
										{tpl.templateEn}
									</p>
									<p className="mt-1.5 text-slate-600 dark:text-slate-400">
										<span className="mr-1 font-semibold text-emerald-600 dark:text-emerald-400">
											Hindi:
										</span>
										{tpl.templateHi}
									</p>
								</div>

								<div className="flex flex-wrap items-center gap-1.5">
									<span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
										Dynamic Variables:
									</span>
									{tpl.variables.map((v) => (
										<code
											key={v}
											className="rounded bg-slate-200/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
										>
											{"{{" + v + "}}"}
										</code>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Send Test Alert Dialog Modal */}
			<Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
							<Send className="h-5 w-5 text-emerald-600" />
							Send Test WhatsApp / SMS Alert
						</DialogTitle>
						<DialogDescription className="text-xs">
							Test messaging templates and simulate live WhatsApp / SMS delivery
							to any phone number
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">Select Channel</Label>
							<Select
								value={testChannel}
								onValueChange={(val: any) => setTestChannel(val)}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="whatsapp">
										WhatsApp Business API
									</SelectItem>
									<SelectItem value="sms">
										SMS Gateway (DLT Approved)
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<Label className="font-semibold text-xs">Recipient Phone</Label>
								<Input
									value={testPhone}
									onChange={(e) => setTestPhone(e.target.value)}
									placeholder="+91 98765 43210"
									className="h-9 font-mono text-xs"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="font-semibold text-xs">Recipient Name</Label>
								<Input
									value={testName}
									onChange={(e) => setTestName(e.target.value)}
									placeholder="e.g. Rahul Sharma"
									className="h-9 text-xs"
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">Message Template</Label>
							<Select
								value={selectedTemplateId}
								onValueChange={(val) => setSelectedTemplateId(val)}
							>
								<SelectTrigger className="h-9 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{templates.map((t) => (
										<SelectItem key={t.id} value={t.id}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								Custom English Override (Optional)
							</Label>
							<Input
								value={customEn}
								onChange={(e) => setCustomEn(e.target.value)}
								placeholder="Leave blank to use default template text"
								className="h-9 text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								Custom Hindi Override (Optional)
							</Label>
							<Input
								value={customHi}
								onChange={(e) => setCustomHi(e.target.value)}
								placeholder="Hindi message override..."
								className="h-9 text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsSendDialogOpen(false)}
							disabled={sendMutation.isPending}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSendTest}
							disabled={sendMutation.isPending}
							className="bg-emerald-600 text-white text-xs hover:bg-emerald-700"
						>
							{sendMutation.isPending ? (
								<>
									<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
									Dispatching...
								</>
							) : (
								<>
									<Send className="mr-1.5 h-3.5 w-3.5" />
									Dispatch Test Alert
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
