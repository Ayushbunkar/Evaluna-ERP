import { chatMessages, chatSessions, customers } from "@evaluna/db/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { processCustomerSupportQuery } from "@/lib/ai/customer-support-agent";
import { escalateChatSession, OFFICIAL_COMPANY_INFO } from "@/lib/ai/customer-support-data";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "@/lib/trpc/init";

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
