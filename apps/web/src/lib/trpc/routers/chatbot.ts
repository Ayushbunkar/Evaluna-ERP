import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/init";
import { db } from "@/lib/db";
import { chatSessions, chatMessages, products } from "@evaluna/db/schema";
import { eq, ilike } from "drizzle-orm";

export const chatbotRouter = router({
  createSession: protectedProcedure
    .input(z.object({
      customerId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [newSession] = await db.insert(chatSessions).values({
        customer_id: input.customerId,
      }).returning({ id: chatSessions.id });
      
      return { sessionId: newSession.id };
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { sessionId, content } = input;
      
      // 1. Insert user message
      await db.insert(chatMessages).values({
        session_id: sessionId,
        sender: "user",
        content,
      });

      // 2. Simple Heuristic / Bot Logic
      let botResponseContent = "I'm sorry, I couldn't understand that.";
      let matchedProducts: any = null;

      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes("help") || lowerContent.includes("menu")) {
        botResponseContent = "Hello! I can help you search for products. Try asking for an item.";
      } else {
        // Try to match a product search term. We'll just search using the content as the term.
        const searchResults = await db.select()
          .from(products)
          .where(ilike(products.name, `%${content}%`))
          .limit(3);
          
        if (searchResults.length > 0) {
          botResponseContent = `I found some products matching "${content}":`;
          matchedProducts = searchResults;
        } else {
          botResponseContent = `I couldn't find any products matching "${content}".`;
        }
      }

      // 3. Insert bot response
      const [botMessage] = await db.insert(chatMessages).values({
        session_id: sessionId,
        sender: "bot",
        content: botResponseContent,
        metadata: matchedProducts ? { products: matchedProducts } : null,
      }).returning();

      return botMessage;
    }),

  getHistory: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .query(async ({ input }) => {
      return await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.session_id, input.sessionId))
        .orderBy(chatMessages.created_at);
    }),
});
