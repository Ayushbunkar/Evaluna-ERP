"use client";

import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";

export function ChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [input, setInput] = useState("");
	const [sessionId, setSessionId] = useState<number | null>(null);

	const createSession = trpc.chatbot.createSession.useMutation({
		onSuccess: (data: any) => {
			setSessionId(data.sessionId);
		},
	});

	const { data: history, refetch } = trpc.chatbot.getHistory.useQuery(
		{ sessionId: sessionId! },
		{ enabled: !!sessionId },
	);

	const sendMessage = trpc.chatbot.sendMessage.useMutation({
		onSuccess: () => {
			setInput("");
			refetch();
		},
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen && !sessionId && !createSession.isPending) {
			createSession.mutate({} as any);
		}
	}, [isOpen, sessionId, createSession]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const handleSend = () => {
		if (!input.trim() || !sessionId) return;
		sendMessage.mutate({ sessionId, content: input });
	};

	return (
		<div className="fixed right-4 bottom-4 z-50">
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 20, scale: 0.95 }}
						transition={{ duration: 0.2 }}
						className="absolute right-0 bottom-16 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border bg-background shadow-xl"
					>
						{/* Header */}
						<div className="flex items-center justify-between bg-primary p-3 text-primary-foreground">
							<h3 className="font-semibold text-sm">Customer Support</h3>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-primary-foreground hover:bg-primary/80"
								onClick={() => setIsOpen(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						{/* Message Thread */}
						<div className="flex-1 space-y-4 overflow-y-auto p-4">
							{history?.map((msg: any, idx: number) => (
								<div
									key={idx}
									className={`flex flex-col ${
										msg.sender === "user" ? "items-end" : "items-start"
									}`}
								>
									<div
										className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
											msg.sender === "user"
												? "rounded-tr-none bg-primary text-primary-foreground"
												: "rounded-tl-none bg-muted text-foreground"
										}`}
									>
										{msg.content}
									</div>
									{/* Products Metadata */}
									{msg.sender === "bot" &&
										msg.metadata?.products &&
										Array.isArray(msg.metadata.products) &&
										msg.metadata.products.length > 0 && (
											<div className="mt-2 w-full space-y-2">
												{msg.metadata.products.map(
													(product: any, pIdx: number) => (
														<div
															key={pIdx}
															className="flex w-full flex-col gap-2 rounded-lg border bg-card p-2 text-xs shadow-sm"
														>
															<div className="truncate font-medium">
																{product.name}
															</div>
															<div className="flex items-center justify-between">
																<span className="font-bold">
																	${product.price}
																</span>
																<Button
																	size="sm"
																	variant="secondary"
																	className="h-6 px-2 text-[10px]"
																>
																	<ShoppingBag className="mr-1 h-3 w-3" /> Add
																</Button>
															</div>
														</div>
													),
												)}
											</div>
										)}
								</div>
							))}
							{sendMessage.isPending && (
								<div className="flex items-start">
									<div className="max-w-[85%] rounded-2xl rounded-tl-none bg-muted px-3 py-2 text-foreground text-sm opacity-70">
										Typing...
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Input Area */}
						<div className="flex gap-2 border-t bg-background p-3">
							<Input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSend()}
								placeholder="Type a message..."
								className="h-9 flex-1 text-sm"
								disabled={sendMessage.isPending}
							/>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={handleSend}
								disabled={sendMessage.isPending || !input.trim()}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
							>
								<Send className="h-4 w-4" />
							</motion.button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.button
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				onClick={() => setIsOpen(!isOpen)}
				className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow-lg"
			>
				{isOpen ? (
					<X className="h-6 w-6" />
				) : (
					<MessageCircle className="h-6 w-6" />
				)}
			</motion.button>
		</div>
	);
}
