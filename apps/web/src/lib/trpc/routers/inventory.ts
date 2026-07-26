import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "@/lib/trpc/init";
import { stockLedger } from "@/lib/db/schema";
import { products, productConversions, branchInventory } from "@evaluna/db/schema";
import { eq, and, ilike, desc, sql } from "drizzle-orm";

export const inventoryRouter = router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number(), locationId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const ledger = await ctx.db
        .select()
        .from(stockLedger)
        .where(
          and(
            input.productId ? eq(stockLedger.product_id, input.productId) : undefined,
            input.locationId ? eq(stockLedger.reference_id, input.locationId) : undefined
          )
        )
        .orderBy(desc(stockLedger.created_at))
        .limit(100);

      return ledger;
    }),

  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async () => {
      const data = [
        { id: 1, product: "Tata Salt 1kg", sku: "GRO-TS-001", branch: "Mumbai Central Hub", qty_on_hand: 540, reorder_level: 100, status: "in_stock" },
        { id: 2, product: "Aashirvaad Atta 5kg", sku: "GRO-AA-005", branch: "Delhi North Distribution", qty_on_hand: 25, reorder_level: 50, status: "low_stock" },
        { id: 3, product: "Amul Butter 500g", sku: "DAI-AB-500", branch: "Bangalore Tech Park", qty_on_hand: 120, reorder_level: 30, status: "in_stock" },
        { id: 4, product: "Maggi Noodles 140g", sku: "SNA-MN-140", branch: "Pune West Zone", qty_on_hand: 0, reorder_level: 200, status: "out_of_stock" },
        { id: 5, product: "Surf Excel 2kg", sku: "CLE-SE-002", branch: "Hyderabad Cyber Center", qty_on_hand: 850, reorder_level: 150, status: "in_stock" },
        { id: 6, product: "Parle-G 800g", sku: "SNA-PG-800", branch: "Chennai Port", qty_on_hand: 40, reorder_level: 100, status: "low_stock" },
        { id: 7, product: "Red Label Tea 250g", sku: "BEV-RL-250", branch: "Kolkata East Depot", qty_on_hand: 320, reorder_level: 50, status: "in_stock" },
        { id: 8, product: "Dabur Honey 1kg", sku: "GRO-DH-001", branch: "Ahmedabad Trade Center", qty_on_hand: 5, reorder_level: 20, status: "low_stock" },
      ];
      
      return {
        items: data,
        total: data.length,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [ledger] = await ctx.db
        .select()
        .from(stockLedger)
        .where(eq(stockLedger.id, input.id));

      if (!ledger) {
        throw new Error("Ledger not found");
      }

      return ledger;
    }),

  convertPackToLoose: protectedProcedure
    .input(
      z.object({
        packProductId: z.number(),
        packsToConvert: z.number().min(1),
        branchId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // 1. Get the pack product
        const [pack] = await tx.select().from(products).where(eq(products.id, input.packProductId));
        if (!pack || !pack.is_pack || !pack.loose_product_id) {
          throw new Error("Invalid pack product selected for conversion.");
        }

        const looseProductId = pack.loose_product_id;
        const unitsPerPack = pack.units_per_pack || 1;
        const looseYielded = input.packsToConvert * unitsPerPack;

        // 2. Decrease pack inventory
        const packStock = await tx.select().from(branchInventory).where(
          and(eq(branchInventory.branch_id, input.branchId), eq(branchInventory.product_id, pack.id))
        );
        if (packStock.length > 0) {
          await tx.update(branchInventory)
            .set({ in_stock: sql`${branchInventory.in_stock} - ${input.packsToConvert}` })
            .where(eq(branchInventory.id, packStock[0].id));
        } else {
          throw new Error("No inventory found for the pack product in this branch.");
        }

        // 3. Increase loose inventory
        const looseStock = await tx.select().from(branchInventory).where(
          and(eq(branchInventory.branch_id, input.branchId), eq(branchInventory.product_id, looseProductId))
        );
        if (looseStock.length > 0) {
          await tx.update(branchInventory)
            .set({ in_stock: sql`${branchInventory.in_stock} + ${looseYielded}` })
            .where(eq(branchInventory.id, looseStock[0].id));
        } else {
          await tx.insert(branchInventory).values({
            branch_id: input.branchId,
            product_id: looseProductId,
            in_stock: looseYielded,
          });
        }

        // 4. Log conversion
        await tx.insert(productConversions).values({
          branch_id: input.branchId,
          pack_product_id: pack.id,
          loose_product_id: looseProductId,
          packs_converted: input.packsToConvert,
          loose_yielded: looseYielded,
          converted_by: ctx.user.id,
        });

        // 5. Ledger entries
        await tx.insert(stockLedger).values([
          {
            product_id: pack.id,
            transaction_type: "out",
            quantity: -input.packsToConvert,
            reference_type: "conversion",
            branch_id: input.branchId,
          },
          {
            product_id: looseProductId,
            transaction_type: "in",
            quantity: looseYielded,
            reference_type: "conversion",
            branch_id: input.branchId,
          },
        ]);

        return { success: true, looseYielded };
      });
    }),

  create: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement create inventory entry
    return { success: true };
  }),

  update: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement update inventory entry
    return { success: true };
  }),

  delete: publicProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement delete inventory entry
    return { success: true };
  }),

  getDashboardStats: protectedProcedure
    .input(z.object({ branch_id: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      // Mock data for Inventory Dashboard
      return {
        // KPIs
        inventoryValue: 1245000.50,
        totalProducts: 4560,
        lowStockItems: 145,
        expiringSoon: 32,
        deadStock: 85,
        stockAccuracy: 98.4,
        averageStockDays: 45,

        // Widgets
        inventoryTrend: [
          { month: "Jan", value: 950000 },
          { month: "Feb", value: 1020000 },
          { month: "Mar", value: 1100000 },
          { month: "Apr", value: 1080000 },
          { month: "May", value: 1150000 },
          { month: "Jun", value: 1245000 },
        ],
        categoryDistribution: [
          { name: "Electronics", value: 45 },
          { name: "Furniture", value: 25 },
          { name: "Clothing", value: 20 },
          { name: "Accessories", value: 10 },
        ],
        abcAnalysis: [
          { class: "A Class", percentage: 20, value: 70 },
          { class: "B Class", percentage: 30, value: 20 },
          { class: "C Class", percentage: 50, value: 10 },
        ],
        warehouseDistribution: [
          { name: "Main Hub", stock: 15000 },
          { name: "East Zone", stock: 8400 },
          { name: "West Zone", stock: 12500 },
        ],
        topMovingItems: [
          { name: "Wireless Earbuds", category: "Electronics", turns: 12.5 },
          { name: "Ergonomic Chair", category: "Furniture", turns: 8.2 },
          { name: "Cotton T-Shirt", category: "Clothing", turns: 15.4 },
        ],
        recentMovements: [
          { id: 1, type: "in", product: "Wireless Earbuds", qty: 500, time: "2 hours ago" },
          { id: 2, type: "out", product: "Ergonomic Chair", qty: -12, time: "4 hours ago" },
          { id: 3, type: "transfer", product: "Cotton T-Shirt", qty: 150, time: "5 hours ago" },
        ]
      };
    }),
});