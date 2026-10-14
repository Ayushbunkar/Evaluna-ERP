"use client";

import { Button } from "@evaluna/ui/components/button";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	Bot,
	Check,
	Clock,
	Copy,
	Headphones,
	MessageCircle,
	RefreshCw,
	Send,
	Sparkles,
	User,
	X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";

const QUICK_ACTIONS = [
	{ label: "📦 Track my order", query: "Where is my order and what is its status?" },
	{ label: "📋 Show recent orders", query: "Show my recent orders" },
	{ label: "🚚 When will my order arrive?", query: "When will my order arrive?" },
	{ label: "💳 Check payment status", query: "Check my payment and credit status" },
	{ label: "🛒 How to place an order?", query: "How do I place a new order in the dashboard?" },
	{ label: "🧭 Help me use my dashboard", query: "Help me navigate my dashboard" },
	{ label: "📞 Contact customer support", query: "What is your official customer support contact information?" },
];

function formatTime(dateStr?: string | Date | null) {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMessageContent(content: string) {
	// Simple lightweight markdown parser for bold, line breaks, and bullet points
	const lines = content.split("\n");
	return lines.map((line, idx) => {
		const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
		const cleanLine = isBullet ? line.trim().replace(/^[-•]\s*/, "") : line;

		// Parse **bold** within line
		const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
		const formattedParts = parts.map((part, pIdx) => {
			if (part.startsWith("**") && part.endsWith("**")) {
				return (
					<strong key={pIdx} className="font-semibold text-foreground">
						{part.slice(2, -2)}
					</strong>
				);
			}
			return part;
		});

		if (isBullet) {
			return (
				<li key={idx} className="ml-4 list-disc text-xs leading-relaxed sm:text-sm">
					{formattedParts}
				</li>
			);
		}

		if (!cleanLine.trim()) {
			return <div key={idx} className="h-1.5" />;
		}

		return (
			<p key={idx} className="text-xs leading-relaxed sm:text-sm">
				{formattedParts}
			</p>
		);
	});
}

export function ChatWidget() {
	const pathname = usePathname();
	const isCustomerDashboard = Boolean(pathname?.startsWith("/customer"));

	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [sessionId, setSessionId] = useState<number | null>(null);
	const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);

	const createSession = trpc.chatbot.createSession.useMutation({
		onSuccess: (data: any) => {
			setSessionId(data.sessionId);
		},
	});

	const { data: history, refetch } = trpc.chatbot.getHistory.useQuery(
		{ sessionId: sessionId! },
		{ enabled: !!sessionId && isCustomerDashboard, refetchInterval: isOpen ? 8000 : false },
	);

	const sendMessage = trpc.chatbot.sendMessage.useMutation({
		onSuccess: () => {
			setInput("");
			refetch();
		},
	});

	const escalateSession = trpc.chatbot.escalate.useMutation({
		onSuccess: () => {
			refetch();
		},
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isCustomerDashboard && isOpen && !sessionId && !createSession.isPending) {
			createSession.mutate({});
		}
	}, [isCustomerDashboard, isOpen, sessionId, createSession]);

	useEffect(() => {
		if (isOpen) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [history, isOpen, sendMessage.isPending]);

	if (!isCustomerDashboard) {
		return null;
	}

	const handleSend = (text?: string) => {
		const messageToSend = (text || input).trim();
		if (!messageToSend || !sessionId || sendMessage.isPending) return;
		sendMessage.mutate({ sessionId, content: messageToSend });
		if (!text) setInput("");
	};

	const handleCopy = (msgId: number, content: string) => {
		navigator.clipboard.writeText(content);
		setCopiedMsgId(msgId);
		setTimeout(() => setCopiedMsgId(null), 2000);
	};

	const handleEscalate = () => {
		if (!sessionId || escalateSession.isPending) return;
		escalateSession.mutate({
			sessionId,
			reason: "Customer requested human support agent escalation",
		});
	};

	return (
		<div className="fixed right-4 bottom-4 z-50">
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 24, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 24, scale: 0.96 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="absolute right-0 bottom-16 flex h-[540px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background shadow-2xl sm:w-[410px]"
					>
						{/* Header */}
						<div className="flex items-center justify-between border-b border-primary/20 bg-primary px-4 py-3 text-primary-foreground">
							<div className="flex items-center gap-2.5">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
									<Bot className="h-4 w-4 text-primary-foreground" />
								</div>
								<div>
									<div className="flex items-center gap-1.5">
										<h3 className="font-semibold text-sm leading-none">
											Evaluna AI Support
										</h3>
										<span className="flex h-2 w-2 rounded-full bg-emerald-400" />
									</div>
									<p className="mt-0.5 text-[11px] text-primary-foreground/80">
										Order Tracking, Delivery & Billing Assistant
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-primary-foreground hover:bg-white/10"
									title="Escalate to Human Agent"
									onClick={handleEscalate}
									disabled={escalateSession.isPending}
								>
									<Headphones className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 text-primary-foreground hover:bg-white/10"
									onClick={() => setIsOpen(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Sub-banner disclaimer */}
						<div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground border-b">
							<span className="flex items-center gap-1">
								<Sparkles className="h-3 w-3 text-primary" /> Powered by Groq AI • Live DB Grounded
							</span>
							<button
								onClick={handleEscalate}
								disabled={escalateSession.isPending}
								className="font-medium text-primary hover:underline"
							>
								Request Human Agent
							</button>
						</div>

						{/* Message Thread */}
						<div className="flex-1 space-y-3.5 overflow-y-auto p-4">
							{/* Welcome Message */}
							<div className="flex items-start gap-2">
								<div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<Bot className="h-3.5 w-3.5" />
								</div>
								<div className="max-w-[85%] rounded-2xl rounded-tl-none border border-border/60 bg-muted/70 px-3.5 py-2.5 text-xs text-foreground sm:text-sm shadow-xs">
									<p className="font-medium text-foreground">Hello! 👋</p>
									<p className="mt-1 text-muted-foreground">
										I&apos;m your <strong>Evaluna Support Assistant</strong>. I can help you track orders, check delivery stages, review payment balances, and navigate your dashboard.
									</p>
								</div>
							</div>

							{/* Quick Action Chips when conversation is fresh */}
							{(!history || history.length === 0) && (
								<div className="my-2 space-y-1.5 pt-1">
									<p className="px-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
										Quick Questions
									</p>
									<div className="flex flex-wrap gap-1.5">
										{QUICK_ACTIONS.map((action, i) => (
											<button
												key={i}
												type="button"
												disabled={sendMessage.isPending}
												onClick={() => handleSend(action.query)}
												className="rounded-full border border-border bg-card px-2.5 py-1 text-left text-[11px] text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
											>
												{action.label}
											</button>
										))}
									</div>
								</div>
							)}

							{/* History Messages */}
							{history?.map((msg: any, idx: number) => {
								const isUser = msg.sender === "user";
								return (
									<div
										key={idx}
										className={`group flex items-start gap-2 ${
											isUser ? "flex-row-reverse" : "flex-row"
										}`}
									>
										<div
											className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
												isUser
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground"
											}`}
										>
											{isUser ? (
												<User className="h-3 w-3" />
											) : (
												<Bot className="h-3.5 w-3.5" />
											)}
										</div>

										<div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[82%]`}>
											<div
												className={`relative rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs ${
													isUser
														? "rounded-tr-none bg-primary text-primary-foreground"
														: "rounded-tl-none border border-border/70 bg-card text-card-foreground"
												}`}
											>
												{renderMessageContent(msg.content)}

												{/* Message Footer / Copy */}
												<div
													className={`mt-1.5 flex items-center justify-between gap-2 border-t pt-1 text-[10px] ${
														isUser
															? "border-primary-foreground/20 text-primary-foreground/70"
															: "border-border/60 text-muted-foreground"
													}`}
												>
													<span className="flex items-center gap-1">
														<Clock className="h-2.5 w-2.5" />
														{formatTime(msg.created_at)}
													</span>

													{!isUser && (
														<button
															type="button"
															onClick={() => handleCopy(msg.id || idx, msg.content)}
															className="flex items-center gap-1 hover:text-foreground"
															title="Copy message"
														>
															{copiedMsgId === (msg.id || idx) ? (
																<Check className="h-3 w-3 text-emerald-500" />
															) : (
																<Copy className="h-3 w-3" />
															)}
														</button>
													)}
												</div>
											</div>
										</div>
									</div>
								);
							})}

							{/* Loading / Typing Indicator */}
							{sendMessage.isPending && (
								<div className="flex items-start gap-2">
									<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
										<Bot className="h-3.5 w-3.5 animate-spin" />
									</div>
									<div className="rounded-2xl rounded-tl-none border border-border/60 bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-xs">
										<div className="flex items-center gap-1.5">
											<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
											<span
												className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
												style={{ animationDelay: "150ms" }}
											/>
											<span
												className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
												style={{ animationDelay: "300ms" }}
											/>
											<span className="ml-1 text-[11px]">Assistant is retrieving live data...</span>
										</div>
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>

						{/* Quick Action bar if conversation is ongoing */}
						{history && history.length > 0 && (
							<div className="flex items-center gap-1.5 overflow-x-auto border-t bg-muted/30 px-3 py-1.5 scrollbar-none">
								<button
									type="button"
									disabled={sendMessage.isPending}
									onClick={() => handleSend("Where is my order?")}
									className="shrink-0 rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									Track Order
								</button>
								<button
									type="button"
									disabled={sendMessage.isPending}
									onClick={() => handleSend("Check payment status")}
									className="shrink-0 rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									Payment Status
								</button>
								<button
									type="button"
									disabled={sendMessage.isPending}
									onClick={() => handleSend("Contact support details")}
									className="shrink-0 rounded-full border border-border/80 bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
								>
									Contact Info
								</button>
								<button
									type="button"
									disabled={escalateSession.isPending}
									onClick={handleEscalate}
									className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
								>
									Escalate to Human
								</button>
							</div>
						)}

						{/* Input Area */}
						<div className="flex items-center gap-2 border-t bg-background p-3">
							<input
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSend();
									}
								}}
								placeholder="Ask about orders, delivery, payments..."
								className="h-10 flex-1 rounded-full border border-input bg-muted/40 px-3.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-hidden sm:text-sm"
								disabled={sendMessage.isPending}
							/>
							<motion.button
								type="button"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={() => handleSend()}
								disabled={sendMessage.isPending || !input.trim()}
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
							>
								<Send className="h-4 w-4" />
							</motion.button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Floating Launch Button */}
			<motion.button
				type="button"
				whileHover={{ scale: 1.08 }}
				whileTap={{ scale: 0.92 }}
				onClick={() => setIsOpen(!isOpen)}
				aria-label="Open Customer Support Chat"
				className="relative flex h-13 w-13 items-center justify-center rounded-full border border-white/20 bg-primary text-primary-foreground shadow-xl transition-colors hover:bg-primary/95"
			>
				{isOpen ? (
					<X className="h-6 w-6" />
				) : (
					<>
						<MessageCircle className="h-6 w-6" />
						<span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
						</span>
					</>
				)}
			</motion.button>
		</div>
	);
}
