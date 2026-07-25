"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ShoppingBag } from "lucide-react";
import { Button } from "@evaluna/ui/components/button";
import { Input } from "@evaluna/ui/components/input";
import { trpc } from "@/lib/trpc/client";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const createSession = trpc.chatbot.createSession.useMutation({
    onSuccess: (data: any) => {
      setSessionId(data.sessionId);
    }
  });

  const { data: history, refetch } = trpc.chatbot.getHistory.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  const sendMessage = trpc.chatbot.sendMessage.useMutation({
    onSuccess: () => {
      setInput("");
      refetch();
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !sessionId && !createSession.isPending) {
      createSession.mutate();
    }
  }, [isOpen, sessionId, createSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    sendMessage.mutate({ sessionId, message: input });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-80 h-96 bg-background border rounded-2xl shadow-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
              <h3 className="font-semibold text-sm">Customer Support</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary/80" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Products Metadata */}
                  {msg.sender === "bot" && msg.metadata?.products && Array.isArray(msg.metadata.products) && msg.metadata.products.length > 0 && (
                    <div className="mt-2 space-y-2 w-full">
                      {msg.metadata.products.map((product: any, pIdx: number) => (
                        <div key={pIdx} className="bg-card border rounded-lg p-2 flex flex-col gap-2 text-xs w-full shadow-sm">
                          <div className="font-medium truncate">{product.name}</div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold">${product.price}</span>
                            <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2">
                              <ShoppingBag className="h-3 w-3 mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex items-start">
                  <div className="bg-muted text-foreground max-w-[85%] rounded-2xl rounded-tl-none px-3 py-2 text-sm opacity-70">
                    Typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-background flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 text-sm h-9"
                disabled={sendMessage.isPending}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={sendMessage.isPending || !input.trim()}
                className="bg-primary text-primary-foreground h-9 w-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
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
        className="bg-primary text-primary-foreground h-12 w-12 rounded-full flex items-center justify-center shadow-lg border"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
