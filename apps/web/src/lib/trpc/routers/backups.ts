import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import {
  branches, staff, customers, suppliers, products,
  orders, orderItems, transactions, stockLedger,
  branchInventory, purchases, purchaseItems, expenses,
  journalEntries, journalEntryLines, accounts,
} from "@evaluna/db/schema";
import {
  createBackup,
  listBackups,
  verifyBackup,
  readBackupData,
  deleteBackup,
  simulateRestore,
  uploadToCloud,
} from "@/lib/backup-engine";

// ── Restore helper: insert each table's data ───────────────────────────────────
async function restoreData(data: Record<string, unknown[]>, dryRun = false): Promise<void> {
  if (dryRun) return; // simulation only

  await db.transaction(async (tx) => {
    // Disable FK checks during restore
    await tx.execute(sql`SET session_replication_role = 'replica'`);

    // Truncate all restorable tables (order matters for FK)
    await tx.execute(sql`
      TRUNCATE journal_entry_lines, journal_entries, accounts,
                expenses, purchase_items, purchases,
                branch_inventory, stock_ledger,
                order_items, orders, transactions,
                products, customers, suppliers,
                staff, branches CASCADE
    `);

    // Re-insert in dependency order
    if (data.branches?.length)          await tx.insert(branches).values(data.branches as any[]);
    if (data.staff?.length)             await tx.insert(staff).values(data.staff as any[]);
    if (data.customers?.length)         await tx.insert(customers).values(data.customers as any[]);
    if (data.suppliers?.length)         await tx.insert(suppliers).values(data.suppliers as any[]);
    if (data.products?.length)          await tx.insert(products).values(data.products as any[]);
    if (data.orders?.length)            await tx.insert(orders).values(data.orders as any[]);
    if (data.orderItems?.length)        await tx.insert(orderItems).values(data.orderItems as any[]);
    if (data.transactions?.length)      await tx.insert(transactions).values(data.transactions as any[]);
    if (data.stockLedger?.length)       await tx.insert(stockLedger).values(data.stockLedger as any[]);
    if (data.branchInventory?.length)   await tx.insert(branchInventory).values(data.branchInventory as any[]);
    if (data.purchases?.length)         await tx.insert(purchases).values(data.purchases as any[]);
    if (data.purchaseItems?.length)     await tx.insert(purchaseItems).values(data.purchaseItems as any[]);
    if (data.expenses?.length)          await tx.insert(expenses).values(data.expenses as any[]);
    if (data.accounts?.length)          await tx.insert(accounts).values(data.accounts as any[]);
    if (data.journalEntries?.length)    await tx.insert(journalEntries).values(data.journalEntries as any[]);
    if (data.journalEntryLines?.length) await tx.insert(journalEntryLines).values(data.journalEntryLines as any[]);

    // Re-enable FK checks
    await tx.execute(sql`SET session_replication_role = 'DEFAULT'`);
  });
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const backupsRouter = router({

  // ── List ─────────────────────────────────────────────────────────────────────
  listBackups: protectedProcedure.query(() => listBackups()),

  // ── Create Backup (Manual) ────────────────────────────────────────────────────
  createBackup: protectedProcedure
    .input(z.object({
      label: z.string().optional(),
      encrypt: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return await createBackup({ trigger: "manual", label: input.label, encrypt: input.encrypt });
    }),

  // ── Scheduled / Auto Backup ───────────────────────────────────────────────────
  createScheduledBackup: protectedProcedure
    .input(z.object({ label: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await createBackup({ trigger: "scheduled", label: input.label, encrypt: true });
    }),

  // ── Verify Backup Checksum ────────────────────────────────────────────────────
  verifyBackup: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(({ input }) => verifyBackup(input.filename)),

  // ── Recovery Simulation (Dry Run) ─────────────────────────────────────────────
  simulateRestore: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(({ input }) => simulateRestore(input.filename)),

  // ── Restore ───────────────────────────────────────────────────────────────────
  restoreBackup: protectedProcedure
    .input(z.object({
      filename: z.string(),
      confirmed: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      if (!input.confirmed) {
        throw new Error("Restore requires explicit confirmation");
      }

      // Pre-restore safety: verify checksum first
      const verification = verifyBackup(input.filename);
      if (!verification.valid) {
        throw new Error(`Backup verification failed: ${verification.reason}`);
      }

      // Create auto-backup of current state before restoring
      await createBackup({ trigger: "pre-restore", label: "pre-restore-snapshot", encrypt: true });

      const data = readBackupData(input.filename);
      await restoreData(data, false);

      return { success: true, tables_restored: Object.keys(data).length };
    }),

  // ── Point-in-Time: preview data at a backup point ─────────────────────────────
  getBackupPreview: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .query(({ input }) => {
      const verification = verifyBackup(input.filename);
      if (!verification.valid) {
        throw new Error(`Cannot preview: ${verification.reason}`);
      }
      const data = readBackupData(input.filename);
      // Return record counts only for fast preview
      const summary: Record<string, number> = {};
      for (const [table, rows] of Object.entries(data)) {
        summary[table] = Array.isArray(rows) ? rows.length : 0;
      }
      return summary;
    }),

  // ── Delete Backup ─────────────────────────────────────────────────────────────
  deleteBackup: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(({ input }) => {
      deleteBackup(input.filename);
      return { success: true };
    }),

  // ── Cloud Upload ──────────────────────────────────────────────────────────────
  uploadToCloud: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .mutation(async ({ input }) => {
      return await uploadToCloud(input.filename);
    }),

  // ── Legacy compatibility ──────────────────────────────────────────────────────
  getBackupData: protectedProcedure
    .input(z.object({ filename: z.string() }))
    .query(({ input }) => readBackupData(input.filename)),
});
