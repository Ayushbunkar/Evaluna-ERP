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
import { Input } from "@evaluna/ui/components/input";
import {
	CheckCheck,
	Inbox,
	Paperclip,
	Send,
	User,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export default function MarketingInboxPage() {
	const trpc = useTRPC();
	const inboxQuery = trpc.instagram.getInbox.useQuery();

	const [activeThreadId, setActiveThreadId] = useState<string>("t_1");
	const [replyMessage, setReplyMessage] = useState("");

	const threads = inboxQuery.data || [];
	const activeThread =
		threads.find((t) => t.threadId === activeThreadId) || threads[0];

	const [threadMessages, setThreadMessages] = useState<
		Record<string, Array<{ sender: string; text: string; time: string }>>
	>({});

	// Initialize messages from query data
	React.useEffect(() => {
		if (threads.length > 0 && Object.keys(threadMessages).length === 0) {
			const map: Record<string, any[]> = {};
			threads.forEach((t) => {
				map[t.threadId] = [...t.messages];
			});
			setThreadMessages(map);
		}
	}, [threads]);

	const sendMutation = trpc.instagram.sendDirectMessage.useMutation({
		onSuccess: (res) => {
			toast.success("Message sent to retailer!");
			setThreadMessages((prev) => ({
				...prev,
				[res.threadId]: [...(prev[res.threadId] || []), res.sentMessage],
			}));
			setReplyMessage("");
		},
	});

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyMessage.trim() || !activeThread) return;

		sendMutation.mutate({
			threadId: activeThread.threadId,
			message: replyMessage.trim(),
		});
	};

	const currentMessages = activeThread
		? threadMessages[activeThread.threadId] || activeThread.messages
		: [];

	return (
		<div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
						Direct Messages & Retailer Inbox
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						Communicate directly with kirana owners, supermarket procurement heads & leads
					</p>
				</div>
				<Badge variant="outline" className="text-xs">
					Meta Graph API Messenger
				</Badge>
			</div>

			{/* Inbox Shell: Sidebar threads (30%) + Chat Window (70%) */}
			<div className="flex-1 rounded-2xl border border-border/70 bg-card overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0 shadow-xs">
				{/* Threads List (4 Cols) */}
				<div className="md:col-span-4 border-r border-border/60 flex flex-col min-h-0">
					<div className="p-3 border-b border-border/50 bg-muted/20">
						<p className="font-bold text-xs text-foreground">Recent Conversations</p>
					</div>

					<div className="flex-1 overflow-y-auto divide-y divide-border/40">
						{threads.map((t) => {
							const isSelected = t.threadId === activeThreadId;
							return (
								<button
									key={t.threadId}
									type="button"
									onClick={() => setActiveThreadId(t.threadId)}
									className={`w-full p-3 text-left flex items-start gap-3 transition-colors ${
										isSelected
											? "bg-primary/10 border-l-4 border-primary"
											: "hover:bg-muted/30"
									}`}
								>
									<img
										src={t.avatar}
										alt=""
										className="h-10 w-10 rounded-full object-cover shrink-0 ring-1 ring-border"
									/>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between">
											<p className="font-bold text-xs text-foreground truncate">
												{t.name}
											</p>
											<span className="text-[10px] text-muted-foreground shrink-0">
												{t.updatedAt}
											</span>
										</div>
										<p className="text-[11px] text-muted-foreground truncate mt-0.5">
											@{t.username}
										</p>
										<p className="text-[11px] text-foreground font-medium truncate mt-1">
											{t.lastMessage}
										</p>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* Active Chat Conversation (8 Cols) */}
				{activeThread ? (
					<div className="md:col-span-8 flex flex-col min-h-0 bg-background/50">
						{/* Chat Header */}
						<div className="h-14 border-b border-border/50 px-4 flex items-center justify-between bg-card shrink-0">
							<div className="flex items-center gap-3">
								<img
									src={activeThread.avatar}
									alt=""
									className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
								/>
								<div>
									<p className="font-bold text-xs text-foreground">
										{activeThread.name}
									</p>
									<p className="text-[10px] text-muted-foreground">
										@{activeThread.username} • Verified Customer
									</p>
								</div>
							</div>

							<Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px]">
								Active Lead
							</Badge>
						</div>

						{/* Messages Area */}
						<div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
							{currentMessages.map((msg, idx) => {
								const isMe = msg.sender === "me";
								return (
									<div
										key={idx}
										className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
									>
										<div
											className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
												isMe
													? "bg-primary text-primary-foreground rounded-br-xs"
													: "bg-card border border-border/70 text-foreground rounded-bl-xs"
											}`}
										>
											{msg.text}
										</div>
										<span className="text-[9px] text-muted-foreground mt-1 px-1">
											{msg.time}
										</span>
									</div>
								);
							})}
						</div>

						{/* Message Input Footer */}
						<form
							onSubmit={handleSendMessage}
							className="p-3 border-t border-border/50 bg-card flex items-center gap-2 shrink-0"
						>
							<Input
								placeholder={`Reply to ${activeThread.name}...`}
								className="text-xs h-9 flex-1"
								value={replyMessage}
								onChange={(e) => setReplyMessage(e.target.value)}
							/>
							<Button
								type="submit"
								size="sm"
								disabled={sendMutation.isPending}
								className="h-9 text-xs px-3 bg-primary text-primary-foreground gap-1.5"
							>
								<Send className="h-3.5 w-3.5" />
								Send
							</Button>
						</form>
					</div>
				) : (
					<div className="md:col-span-8 flex items-center justify-center p-8 text-center text-muted-foreground text-xs">
						Select a conversation thread to start messaging.
					</div>
				)}
			</div>
		</div>
	);
}
