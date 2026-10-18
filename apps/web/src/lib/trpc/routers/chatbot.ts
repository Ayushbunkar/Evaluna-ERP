import { chatMessages, chatSessions, customers } from "@evaluna/db/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { processCustomerSupportQuery } from "@/lib/ai/customer-support-agent";
import { escalateChatSession, OFFICIAL_COMPANY_INFO } from "@/lib/ai/customer-support-data";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "@/lib/trpc/init";

interface RateLimitRecord {
	lastTimestamp: number;
	recentTimestamps: number[];
	lastContent?: string;
	lastBotResponse?: any;
}

const userSessionRateLimits = new Map<string, RateLimitRecord>();

export const chatbotRouter = router({
	createSession: protectedProcedure
		.input(
			z.object({
				customerId: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let customerId = input.customerId;

			if (!customerId && ctx.user?.id) {
				const [customer] = await db
					.select({ id: customers.id })
					.from(customers)
					.where(eq(customers.user_uid, ctx.user.id))
					.limit(1);
				if (customer) {
					customerId = customer.id;
				}
			}

			const [newSession] = await db
				.insert(chatSessions)
				.values({
					customer_id: customerId || null,
					status: "active",
				})
				.returning({ id: chatSessions.id });

			return { sessionId: newSession.id };
		}),

	sendMessage: protectedProcedure
		.input(
			z.object({
				sessionId: z.number(),
				content: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { sessionId, content } = input;
			const trimmedContent = content.trim();

			// 0. Rate limiting & Token protection
			const rateLimitKey = `${ctx.user.id}:${sessionId}`;
			const now = Date.now();
			const record = userSessionRateLimits.get(rateLimitKey) || {
				lastTimestamp: 0,
				recentTimestamps: [],
			};

			// Deduplication: prevent identical rapid double-clicks (within 3s)
			if (
				record.lastContent === trimmedContent &&
				now - record.lastTimestamp < 3000 &&
				record.lastBotResponse
			) {
				return record.lastBotResponse;
			}

			// Minimum interval cooldown between rapid clicks (1200ms)
			if (now - record.lastTimestamp < 1200) {
				await db.insert(chatMessages).values({
					session_id: sessionId,
					sender: "user",
					content: trimmedContent,
				});

				const [rateLimitBotMsg] = await db
					.insert(chatMessages)
					.values({
						session_id: sessionId,
						sender: "bot",
						content:
							"Aap bohot tezi se message bhej rahe hain. Kripya thoda dhairya rakhein taaki hum aapke pichle prashn ka sahi uttar taiyar kar sakein.",
						metadata: { rateLimited: true, reason: "fast_clicks" },
					})
					.returning();

				record.lastTimestamp = now;
				record.lastBotResponse = rateLimitBotMsg;
				userSessionRateLimits.set(rateLimitKey, record);
				return rateLimitBotMsg;
			}

			// Sliding window: maximum 12 messages per 60 seconds
			record.recentTimestamps = record.recentTimestamps.filter((t) => now - t < 60000);
			if (record.recentTimestamps.length >= 12) {
				await db.insert(chatMessages).values({
					session_id: sessionId,
					sender: "user",
					content: trimmedContent,
				});

				const [cooldownBotMsg] = await db
					.insert(chatMessages)
					.values({
						session_id: sessionId,
						sender: "bot",
						content:
							"Aapne pichle 1 minute me kayi messages bheje hain. Token suraksha aur behtar sewa ke liye kripya 1 minute ruk kar dobara prashn poochein, ya helpline +91 96306 49277 par call karein.",
						metadata: { rateLimited: true, reason: "sliding_window" },
					})
					.returning();

				record.lastTimestamp = now;
				record.lastBotResponse = cooldownBotMsg;
				userSessionRateLimits.set(rateLimitKey, record);
				return cooldownBotMsg;
			}

			// Update rate limit tracking for legitimate request
			record.lastTimestamp = now;
			record.lastContent = trimmedContent;
			record.recentTimestamps.push(now);
			userSessionRateLimits.set(rateLimitKey, record);

			// 1. Fetch session to get customer_id
			const [session] = await db
				.select()
				.from(chatSessions)
				.where(eq(chatSessions.id, sessionId))
				.limit(1);

			// 2. Insert user message
			await db.insert(chatMessages).values({
				session_id: sessionId,
				sender: "user",
				content,
			});

			// 3. Fetch past messages for conversation context
			const rawHistory = await db
				.select({
					sender: chatMessages.sender,
					content: chatMessages.content,
				})
				.from(chatMessages)
				.where(eq(chatMessages.session_id, sessionId))
				.orderBy(asc(chatMessages.created_at))
				.limit(10);

			const conversationHistory = rawHistory
				.filter((m) => m.content && m.sender)
				.map((m) => ({
					sender: m.sender as string,
					content: m.content as string,
				}));

			// 4. Run Grounded Groq AI Agent
			const agentResult = await processCustomerSupportQuery({
				sessionId,
				userUid: ctx.user.id,
				userEmail: ctx.user.email,
				userName: ctx.user.name,
				userRole: (ctx.user as any)?.role,
				customerId: session?.customer_id,
				content,
				conversationHistory,
			});

			// 5. If escalated, update session status
			if (agentResult.escalated && session?.status !== "escalated") {
				await db
					.update(chatSessions)
					.set({ status: "escalated" })
					.where(eq(chatSessions.id, sessionId));
			}

			// 6. Insert bot response
			const [botMessage] = await db
				.insert(chatMessages)
				.values({
					session_id: sessionId,
					sender: "bot",
					content: agentResult.text,
					metadata: {
						model: agentResult.modelUsed,
						escalated: agentResult.escalated || false,
						...agentResult.metadata,
					},
				})
				.returning();

			record.lastBotResponse = botMessage;
			userSessionRateLimits.set(rateLimitKey, record);

			return botMessage;
		}),

	escalate: protectedProcedure
		.input(
			z.object({
				sessionId: z.number(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { ticketId } = await escalateChatSession(
				input.sessionId,
				input.reason,
			);

			const confirmationContent = `A support escalation request has been submitted.
• **Ticket ID:** ${ticketId}
• **Direct Support Line:** ${OFFICIAL_COMPANY_INFO.phone}
• **Emergency Ext:** ${OFFICIAL_COMPANY_INFO.phoneExtensions}
• **Email:** ${OFFICIAL_COMPANY_INFO.email}

A customer support executive has been notified and will review your account details shortly.`;

			const [botMessage] = await db
				.insert(chatMessages)
				.values({
					session_id: input.sessionId,
					sender: "bot",
					content: confirmationContent,
					metadata: {
						ticketId,
						escalated: true,
					},
				})
				.returning();

			return {
				ticketId,
				message: botMessage,
			};
		}),

	getHistory: protectedProcedure
		.input(
			z.object({
				sessionId: z.number(),
			}),
		)
		.query(async ({ input }) => {
			return await db
				.select()
				.from(chatMessages)
				.where(eq(chatMessages.session_id, input.sessionId))
				.orderBy(asc(chatMessages.created_at));
		}),
});
