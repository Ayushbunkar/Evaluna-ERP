import { z } from "zod";
import { protectedProcedure, router } from "../init";
import { accounts, journalEntries, journalEntryLines } from "@evaluna/db/schema";
import { TRPCError } from "@trpc/server";

export const accountingRouter = router({
  postJournalEntry: protectedProcedure
    .input(
      z.object({
        entryDate: z.union([z.string(), z.date()]).optional(),
        narration: z.string().optional(),
        lines: z.array(
          z.object({
            accountId: z.number(),
            debit: z.number().default(0),
            credit: z.number().default(0),
            narration: z.string().optional(),
          })
        ).min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { entryDate, narration, lines } = input;
      
      const totalDebit = lines.reduce((acc, line) => acc + line.debit, 0);
      const totalCredit = lines.reduce((acc, line) => acc + line.credit, 0);
      
      if (totalDebit !== totalCredit) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Journal entry is not balanced",
        });
      }

      const entryNumber = `JE-${Date.now()}`;
      
      const [entry] = await ctx.db.insert(journalEntries).values({
        entry_number: entryNumber,
        entry_date: entryDate ? new Date(entryDate) : new Date(),
        narration: narration || null,
        status: "posted",
      }).returning();
      
      const linesData = lines.map(line => ({
        journal_entry_id: entry.id,
        account_id: line.accountId,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        narration: line.narration || null,
      }));
      
      await ctx.db.insert(journalEntryLines).values(linesData);
      
      return entry;
    }),
    
  getTrialBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const allAccounts = await ctx.db.select().from(accounts);
      const allLines = await ctx.db.select().from(journalEntryLines);
      
      const trialBalance = allAccounts.map(account => {
        const relatedLines = allLines.filter(l => l.account_id === account.id);
        const totalDebit = relatedLines.reduce((acc, l) => acc + parseFloat(l.debit || "0"), 0);
        const totalCredit = relatedLines.reduce((acc, l) => acc + parseFloat(l.credit || "0"), 0);
        return {
          accountId: account.id,
          accountCode: account.account_code,
          accountName: account.name,
          accountType: account.account_type,
          balanceType: account.balance_type,
          totalDebit,
          totalCredit,
          netBalance: totalDebit - totalCredit,
        };
      });
      
      return trialBalance;
    }),
});
