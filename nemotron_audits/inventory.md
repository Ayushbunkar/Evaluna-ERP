I need to analyze the provided code to identify inventory-related issues. Let me go through the code systematically, focusing on the areas specified in the inventory auditor specialization.

Looking through the code, I need to find issues related to:
- stock quantities
- stock movements
- warehouses
- branches
- products
- batches
- expiry
- barcode/UPC
- purchasing
- sales deductions
- returns
- stock transfers
- concurrent inventory updates
- negative stock
- audit trails
- inventory/business-rule correctness

Let me examine the code for potential issues:

1. First, I'll look at the inventory-related TRPC routers and procedures.

From the code, I can see several inventory-related routers:
- `apps\web\src\lib\trpc\routers\branches.ts` - handles branch inventory
- `apps\web\src\lib\trpc\routers\batches.ts` - handles product batches
- `apps\web\src\lib\trpc\routers\barcodes.ts` - handles product barcodes
- `apps\web\src\lib\trpc\routers\products.ts` - handles products
- `apps\web\src\lib\trpc\routers\transfers.ts` - handles stock transfers
- `apps\web\src\lib\trpc\routers\purchase-returns.ts` - handles purchase returns
- `apps\web\src\lib\trpc\routers\sales-returns.ts` - handles sales returns
- `apps\web\src\lib\trpc\routers\picking.ts` - handles picking operations
- `apps\web\src\lib\trpc\routers\placement.ts` - handles placement verifications
- `apps\web\src\lib\trpc\routers\receiving-inspections.ts` - handles receiving inspections
- `apps\web\src\lib\trpc\routers\audit.ts` - handles audit discrepancies
- `apps\web\src\lib\trpc\routers\audit-tasks.ts` - handles audit tasks
- `apps\web\src\lib\trpc\routers\price-audit.ts` - handles price audit
- `apps\web\src\lib\trpc\routers\imports.ts` - handles imports

Let me examine these for potential issues:

Starting with `apps\web\src\lib\trpc\routers\branches.ts`:

In the `getInventory` procedure:
```typescript
/** Get branch inventory (joined with products) */
getInventory: protectedProcedure
		.input(z.object({ branch_id: z.number() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select({
					id: branchInventory.id,
					branch_id: branchInventory.branch_id,
					product_id: branchInventory.product_id,
					in_stock: branchInventory.in_stock,
					reorder_level: branchInventory.reorder_level,
					created_at: branchInventory.created_at,
					product_name: products.name,
					product_sku: products.sku,
					product_price: products.price,
				})
				.from(branchInventory)
				.innerJoin(products, eq(branchInventory.product_id, products.id))
				.where(eq(branchInventory.branch_id, input.branch_id));
		}),
```

This looks correct - it's getting inventory for a specific branch with a join to products.

Now looking at `apps\web\src\lib\trpc\routers\transfers.ts`:

This handles stock transfers between branches. Let me check for issues:

In the `create` procedure:
```typescript
/** Create a new inter-branch stock transfer */
create: protectedProcedure
		.input(
			z.object({
				from_branch_id: z.number(),
				to_branch_id: z.number(),
				product_id: z.number(),
				quantity: z.number().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { from_branch_id, to_branch_id, product_id, quantity } = input;

			// Look up the sender's inventory row
			const senderInventory = await ctx.db
				.select()
				.from(branchInventory)
				.where(
					and(
						eq(branchInventory.branch_id, from_branch_id),
						eq(branchInventory.product_id, product_id),
					),
				);

			if (!senderInventory[0] || senderInventory[0].in_stock < quantity) {
				throw new Error("Insufficient stock at the source branch");
			}

			// Deduct stock from sender branch immediately
			await ctx.db
				.update(branchInventory)
				.set({ in_stock: senderInventory[0].in_stock - quantity })
				.where(eq(branchInventory.id, senderInventory[0].id));

			// Create the transfer record with status 'in_transit'
			const transfer = await ctx.db
				.insert(stockTransfers)
				.values({
					from_branch_id,
					to_branch_id,
					product_id,
					quantity,
					status: "in_transit",
				})
				.returning();

			// Insert stock ledger entry for the sender (type='out', reference_type='transfer')
			await ctx.db.insert(stockLedger).values({
				branch_id: from_branch_id,
				product_id,
				transaction_type: "out",
				quantity: -quantity,
				unit_cost: "0",
				total_cost: "0",
				reference_id: transfer[0].id,
				reference_type: "transfer",
			});

			return transfer[0];
		}),
```

I notice a potential issue here: when deducting stock from the sender branch, the code does:
```typescript
await ctx.db
	.update(branchInventory)
	.set({ in_stock: senderInventory[0].in_stock - quantity })
	.where(eq(branchInventory.id, senderInventory[0].id));
```

However, there's a potential race condition here. Between the time we check `senderInventory[0].in_stock < quantity` and when we update the inventory, another process could have modified the inventory, leading to negative stock.

This is a classic concurrent inventory update issue.

Similarly, in the `receive` procedure:
```typescript
/** Receive a pending / in-transit transfer */
receive: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			// Fetch the transfer
			const transfer = await ctx.db
				.select()
				.from(stockTransfers)
				.where(eq(stockTransfers.id, input.id));

			if (!transfer[0]) {
				throw new Error("Transfer not found");
			}

			if (
				transfer[0].status !== "in_transit" &&
				transfer[0].status !== "pending"
			) {
				throw new Error(
					`Cannot receive a transfer with status '${transfer[0].status}'`,
				);
			}

			const { to_branch_id, product_id, quantity } = transfer[0];

			// Update transfer status to 'received'
			await ctx.db
				.update(stockTransfers)
				.set({ status: "received" })
				.where(eq(stockTransfers.id, input.id));

			// Add stock to receiver's branch inventory
			const receiverInventory = await ctx.db
				.select()
				.from(branchInventory)
				.where(
					and(
						eq(branchInventory.branch_id, to_branch_id),
						eq(branchInventory.product_id, product_id),
					),
				);

			if (receiverInventory[0]) {
				await ctx.db
					.update(branchInventory)
					.set({ in_stock: receiverInventory[0].in_stock + quantity })
					.where(eq(branchInventory.id, receiverInventory[0].id));
			} else {
				await ctx.db.insert(branchInventory).values({
					branch_id: to_branch_id,
					product_id,
					in_stock: quantity,
					reorder_level: 10,
				});
			}

			// Insert stock ledger entry for the receiver (type='in', reference_type='transfer')
			await ctx.db.insert(stockLedger).values({
				branch_id: to_branch_id,
				product_id,
				transaction_type: "in",
				quantity,
				unit_cost: "0",
				total_cost: "0",
				reference_id: transfer[0].id,
				reference_type: "transfer",
			});

			return { success: true, id: input.id };
		}),
```

Here, there's another potential race condition when updating the receiver's inventory. Between selecting the receiver inventory and updating it, another process could have modified it.

Also, I notice that when creating a new inventory record for the receiver (if it doesn't exist), the code sets `in_stock: quantity` directly, but it should probably add to any existing stock (though in this case, we're checking if it exists first).

Let me check the `cancel` procedure as well:
```typescript
/** Cancel a pending / in-transit transfer and return stock to sender */
cancel: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			// Fetch the transfer
			const transfer = await ctx.db
				.select()
				.from(stockTransfers)
				.where(eq(stockTransfers.id, input.id));

			if (!transfer[0]) {
				throw new Error("Transfer not found");
			}

			if (
				transfer[0].status !== "in_transit" &&
				transfer[0].status !== "pending"
			) {
				throw new Error(
					`Cannot cancel a transfer with status '${transfer[0].status}'`,
				);
			}

			const { from_branch_id, product_id, quantity } = transfer[0];

			// Update transfer status to 'cancelled'
			await ctx.db
				.update(stockTransfers)
				.set({ status: "cancelled" })
				.where(eq(stockTransfers.id, input.id));

			// Return stock to sender's branch inventory
			const senderInventory = await ctx.db
				.select()
				.from(branchInventory)
				.where(
					and(
						eq(branchInventory.branch_id, from_branch_id),
						eq(branchInventory.product_id, product_id),
					),
				);

			if (senderInventory[0]) {
				await ctx.db
					.update(branchInventory)
					.set({ in_stock: senderInventory[0].in_stock + quantity })
					.where(eq(branchInventory.id, senderInventory[0].id));
			} else {
				// Edge case: row was deleted; re-create it
				await ctx.db.insert(branchInventory).values({
					branch_id: from_branch_id,
					product_id,
					in_stock: quantity,
					reorder_level: 10,
				});
			}

			return { success: true, id: input.id };
		}),
```

Same issue here - potential race condition when updating sender inventory.

Now let's look at `apps\web\src\lib\trpc\routers\purchase-returns.ts`:

In the `create` procedure:
```typescript
create: protectedProcedure
		.input(purchaseReturnInsertSchema)
		.mutation(async ({ input, ctx }) => {
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.purchase_id),
			});
			if (!purchase) throw new Error("Purchase not found");

			const [newReturn] = await db
				.insert(purchaseReturns)
				.values({
					purchase_id: input.purchase_id,
					supplier_id: purchase.supplier_id,
					total_amount: input.total_amount.toString(),
					status: input.status || "pending",
					user_uid: ctx.user.id,
				})
				.returning();

			if (input.items && input.items.length > 0) {
				await db.insert(purchaseReturnItems).values(
					input.items.map((item) => ({
						return_id: newReturn.id,
						product_id: item.product_id,
						quantity: item.quantity,
						refund_amount: item.price.toString(),
					})),
				);
			}
			return newReturn;
		}),
```

I notice that when creating a purchase return, the code inserts return items but doesn't update inventory. This seems like a missing business rule - when a purchase return is created, inventory should be increased (since we're returning goods to the supplier).

Looking at the `processReturn` procedure in `apps\web\src\lib\trpc\routers\purchases.ts`:
```typescript
processReturn: protectedProcedure
		.input(
			z.object({
				purchase_id: z.number(),
				items: z.array(
					z.object({
						product_id: z.number(),
						quantity: z.number(),
						refund_amount: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.purchase_id),
			});
			if (!purchase) throw new Error("Purchase not found");

			const totalRefund = input.items.reduce(
				(acc, curr) => acc + curr.refund_amount,
				0,
			);

			const [newReturn] = await db
				.insert(purchaseReturns)
				.values({
					purchase_id: purchase.id,
					supplier_id: purchase.supplier_id,
					total_amount: totalRefund.toString(),
					status: "processed",
					user_uid: ctx.user.id,
				})
				.returning();

			for (const item of input.items) {
				await db.insert(purchaseReturnItems).values({
					return_id: newReturn.id,
					product_id: item.product_id,
					quantity: item.quantity,
					refund_amount: item.refund_amount.toString(),
				});

				// Deduct from inventory
				const inv = await db.query.branchInventory.findFirst({
					where: eq(branchInventory.product_id, item.product_id),
				});
				if (inv) {
					const newStock = Math.max(0, inv.in_stock - item.quantity);
					await db
						.update(branchInventory)
						.set({ in_stock: newStock })
						.where(eq(branchInventory.id, inv.id));

					await db.insert(stockLedger).values({
						product_id: item.product_id,
						transaction_type: "out",
						quantity: item.quantity,
						unit_cost: "0", // Should calculate
						total_cost: item.refund_amount.toString(),
					});
				}
			}

			// Decrease supplier outstanding balance
			const supplier = await db.query.suppliers.findFirst({
				where: eq(suppliers.id, purchase.supplier_id),
			});
			if (supplier) {
				const newBalance =
					Number.parseFloat(supplier.outstanding_balance || "0") - totalRefund;
				await db
					.update(suppliers)
					.set({ outstanding_balance: newBalance.toString() })
					.where(eq(suppliers.id, supplier.id));
			}

			return newReturn;
		}),
```

Here, when processing a purchase return, it correctly deducts from inventory (transaction_type: "out"). But in the purchase returns router's create procedure, it doesn't update inventory at all.

This is inconsistent - when creating a purchase return (which should increase inventory as we're returning goods to supplier), there's no inventory update, but when processing it (which should decrease inventory as we're actually returning the goods), it does update inventory.

Let me check the sales returns router for similar issues:

In `apps\web\src\lib\trpc\routers\sales-returns.ts`, the `process` procedure:
```typescript
process: roleProcedure(["admin", "manager"])
		.meta({
			openapi: {
				method: "POST",
				path: "/sales-returns/{id}/process",
				tags: ["Sales Returns"],
				summary: "Process a pending sales return",
			},
		})
		.input(z.object({ id: z.number() }))
		.output(z.any())
		.mutation(async ({ ctx, input }) => {
			return db.transaction(async (tx: any) => {
				// 1. Get the return data
				const returnData = await tx.query.salesReturns.findFirst({
					where: eq(salesReturns.id, input.id),
					with: { returnItems: true },
				});

				if (!returnData) {
					throw new Error("Sales Return not found");
				}
				if (returnData.status !== "pending") {
					throw new Error("Only pending returns can be processed");
				}

				// 2. Update status to processed
				const [updatedReturn] = await tx
					.update(salesReturns)
					.set({ status: "processed" })
					.where(eq(salesReturns.id, input.id))
					.returning();

				// 3. Restore stock logic
				const branchId = returnData.branch_id || ctx.user.branchId || 1;
				const items = returnData.returnItems;

				for (const item of items) {
					const inventory = await tx.query.branchInventory.findFirst({
						where: and(
							eq(branchInventory.branch_id, branchId),
							eq(branchInventory.product_id, item.product_id),
						),
					});

					if (inventory) {
						await tx
							.update(branchInventory)
							.set({ in_stock: inventory.in_stock + item.quantity })
							.where(eq(branchInventory.id, inventory.id));
					} else {
						await tx.insert(branchInventory).values({
							branch_id: branchId,
							product_id: item.product_id,
							in_stock: item.quantity,
							reorder_level: 10,
						});
					}
				}

				// 4. Financial Transaction (Refund/Expense)
				await tx.insert(transactions).values({
					branch_id: branchId,
					type: "out",
					category: "refund",
					amount: returnData.total_amount,
					description: `Refund for Sales Return #${updatedReturn.id}`,
					user_uid: ctx.user.id,
					// You would ideally link this to the appropriate payment method used for the refund
				});

				// 5. Adjust original order total
				if (returnData.order_id) {
					const order = await tx.query.orders.findFirst({
						where: eq(orders.id, returnData.order_id),
					});
					if (order) {
						const newTotal =
							Number(order.total_amount) - Number(returnData.total_amount);
						await tx
							.update(orders)
							.set({ total_amount: newTotal.toString() })
							.where(eq(orders.id, returnData.order_id));
					}
				}

				// 6. Log Audit
				await tx.insert(auditLogs).values({
					entity_type: "sales_returns",
					entity_id: updatedReturn.id,
					action: "PROCESS_SALES_RETURN",
					changes: JSON.stringify({ status: "processed" }),
					user_uid: ctx.user.id,
				});

				return updatedReturn;
			});
		}),
```

This looks correct for sales returns - when processing a sales return, it increases inventory (adding the returned quantity back to stock).

Now let's check the purchase returns router again. In the purchase returns router's `create` procedure, it doesn't update inventory, but logically, when you create a purchase return (returning goods to supplier), you should increase inventory.

However, looking at the `processReturn` procedure in the purchases router, it does decrease inventory when processing a purchase return. This suggests that the purchase return creation is just recording the intent to return goods, and the actual inventory adjustment happens when the return is processed.

But let me double-check the business logic:

1. When a purchase is made, inventory increases (as seen in purchases router create procedure)
2. When a purchase return is created, it should decrease inventory (since we're returning goods we had received)
3. When a purchase return is processed, it should... actually, I think I have this backwards.

Let me think through the flow:
- When we purchase goods from a supplier, we receive them into inventory (inventory increases)
- When we return goods to a supplier, we remove them from inventory (inventory decreases)

So:
- Purchase creation: inventory increases
- Purchase return creation: inventory decreases
- Purchase return processing: this might just be confirming the return, so no additional inventory change

But in the purchases router's `processReturn` procedure, it's decreasing inventory, which would be correct for recording the actual return of goods.

However, in the purchase returns router's `create` procedure, there's no inventory change at all. This suggests that the purchase return creation is just recording the return request, and the inventory adjustment happens when it's processed.

But let's check if there's any inventory adjustment in the purchase returns router:

Looking at the purchase returns router again, I don't see any inventory adjustment in either the create or update procedures.

This seems like a missing business rule - when a purchase return is processed (not just created), inventory should be adjusted.

Actually, looking more carefully at the purchases router's `processReturn` procedure, it does adjust inventory when processing a purchase return. So the purchase returns router might just be for managing the return records, while the actual inventory adjustment happens in the purchases router when processing the return.

But let me check if there's a procedure in the purchase returns router for processing returns - I don't see one. The purchase returns router has list, get, create, update, delete procedures, but no "process" procedure.

This suggests that the purchase returns router is incomplete - it's missing the procedure to actually process the return (which would adjust inventory).

Now let's look at the batches router for expiry issues:

In `apps\web\src\lib\trpc\routers\batches.ts`:
```typescript
export const batchesRouter = router({
	listByProduct: publicProcedure
		.input(z.object({ productId: z.number() }))
		.query(async ({ ctx, input }) => {
			const batches = await ctx.db
				.select()
				.from(productBatches)
				.where(eq(productBatches.product_id, input.productId));

			return batches;
		}),

	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = and(
				input.search
					? ilike(productBatches.batch_number, `%${input.search}%`)
					: undefined,
			);

			const batches = await ctx.db
				.select()
				.from(productBatches)
				.where(where)
				.limit(input.limit || 50)
				.offset(input.offset || 0)
				.orderBy(productBatches.created_at);

			const total = await ctx.db
				.select({ count: productBatches.id })
				.from(productBatches)
				.where(where);

			return {
				batches,
				total: total[0]?.count || 0,
			};
		}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const batch = await ctx.db
				.select()
				.from(productBatches)
				.where(eq(productBatches.id, input.id));

			return batch[0];
		}),

	create: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement create batch
		return { success: true };
	}),

	update: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement update batch
		return { success: true };
	}),

	delete: publicProcedure.mutation(async ({ ctx }) => {
		// TODO: Implement delete batch
		return { success: true };
	}),
});
```

I notice that the create, update, and delete procedures are not implemented (just return { success: true }). This is a problem because batches are important for inventory management, especially for tracking expiry dates.

Looking at the schema in `packages\db\src\types.ts`, I can see that ProductBatch has:
- expiry_date?: string;
- manufacture_date?: string;

So batches are meant to track expiry information, but the batches router doesn't have implemented procedures for creating, updating, or deleting batches.

This means there's no way to manage batch information through the API, which is critical for inventory management with expiry tracking.

Let me check if there are any other issues with batches:

In the products router, when listing products, it gets stock from branchInventory but doesn't consider batches or expiry:
```typescript
list: protectedProcedure.query(async ({ ctx }) => {
	// Basic RBAC: If not admin, maybe filter by visibility. For now, fetch all active products.
	// In a full implementation, we would check ctx.user.role here.
	const allProducts = await db
		.select()
		.from(products)
		.where(eq(products.is_deleted, false));

	// Get total stock per product from branchInventory
	const stockMap = new Map<number, number>();
	const stockResults = await db
		.select({
			productId: branchInventory.product_id,
			totalStock: sum(branchInventory.in_stock),
		})
		.from(branchInventory)
		.groupBy(branchInventory.product_id);

	stockResults.forEach((row) => {
		stockMap.set(row.productId, Number(row.totalStock) || 0);
	});

	// Map to the format the UI expects, ensuring numbers are correctly parsed from decimals
	return allProducts.map((p: any) => ({
		id: p.id,
		name: p.name,
		sku: p.sku || "",
		category: p.category || "General",
		baseProcurementPrice:
			Number.parseFloat(p.base_procurement_price as string) || 0,
		baseSellingPrice: Number.parseFloat(p.base_selling_price as string) || 0,
		margin:
			p.base_procurement_price && p.base_selling_price
				? Math.round(
						((Number.parseFloat(p.base_selling_price as string) -
							Number.parseFloat(p.base_procurement_price as string)) /
							Number.parseFloat(p.base_selling_price as string)) *
							100,
					)
				: 0,
		visibilityLevel: p.visibility_level || "global",
		status: p.is_hidden ? "inactive" : "active",
		stock: stockMap.get(p.id) ?? 0, // Pull from inventory stock view
	}));
}),
```

This gets total stock from branchInventory but doesn't consider batches or expiry. For products that use batch tracking, we should probably only count stock that hasn't expired.

However, looking at the branchInventory table in the schema (from packages\db\manual-migration.js), I see:
```typescript
export const branchInventory = pgTable("branch_inventory", {
  id: serial("id").primaryKey(),
  branch_id: integer("branch_id").references(() => branches.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  in_stock: integer("in_stock").notNull().default(0),
  reorder_level: integer("reorder_level").notNull().default(10),
  created_at: timestamp("created_at").defaultNow(),
});
```

There's no batch_id in branchInventory, which suggests that the current implementation doesn't actually use batch tracking at the branch inventory level. Instead, batch tracking might be handled elsewhere.

Looking at the schema in packages\db\src\types.ts, I see:
```typescript
// Phase 8: Stock Ledger (FIFO)
export interface StockLedger {
	id: number;
	product_id: number;
	batch_id?: number;
	transaction_type: string;
	quantity: number;
	unit_cost: string;
	total_cost: string;
	reference_id?: number;
	reference_type?: string;
	created_at: string;
}

// Phase 9: Batch Stock (Location-based)
export interface BatchStock {
	id: number;
	batch_id: number;
	location_id: number;
	quantity: number;
	min_quantity: number;
	max_quantity: number;
	created_at: string;
}
```

This suggests that batch tracking is handled through the StockLedger and BatchStock tables, not directly in branchInventory.

But in the current code I've seen, I don't see references to BatchStock or batch_id in StockLedger being used in the TRPC routers.

Let me check the stockLedger usage in the transfers router:

In transfers.ts, when creating a transfer:
```typescript
// Insert stock ledger entry for the sender (type='out', reference_type='transfer')
await ctx.db.insert(stockLedger).values({
	branch_id: from_branch_id,
	product_id,
	transaction_type: "out",
	quantity: -quantity,
	unit_cost: "0",
	total_cost: "0",
	reference_id: transfer[0].id,
	reference_type: "transfer",
});
```

And when receiving:
```typescript
// Insert stock ledger entry for the receiver (type='in', reference_type='transfer')
await ctx.db.insert(stockLedger).values({
	branch_id: to_branch_id,
	product_id,
	transaction_type: "in",
	quantity,
	unit_cost: "0",
	total_cost: "0",
	reference_id: transfer[0].id,
	reference_type: "transfer",
});
```

And when cancelling:
```typescript
// No stock ledger entry shown for cancelling in the code I saw earlier
```

I don't see batch_id being used in these stock ledger entries.

Let me check the purchases router's create procedure for stock ledger entries:
```typescript
// Batch fetch all products at once, then insert ledger entries in one query
const productIds = items.map((item) => Number.parseInt(item.productId, 10));
const foundProducts = await db.query.products.findMany({
	where: inArray(products.id, productIds),
});
const productMap = new Map(foundProducts.map((p) => [p.id, p]));

const ledgerEntries = items
	.map((item) => {
		const product = productMap.get(Number.parseInt(item.productId, 10));
		if (!product) return null;
		return {
			product_id: product.id,
			transaction_type: "in" as const,
			quantity: item.quantity,
			unit_cost: item.price.toString(),
			total_cost: (item.quantity * Number(item.price)).toString(),
		};
	})
	.filter(Boolean) as any[];

if (ledgerEntries.length > 0) {
	await db.insert(stockLedger).values(ledgerEntries);
}
```

Again, no batch_id.

And in the purchases router's processReturn procedure:
```typescript
await db.insert(stockLedger).values({
	product_id: item.product_id,
	transaction_type: "out",
	quantity: item.quantity,
	unit_cost: "0", // Should calculate
	total_cost: item.refund_amount.toString(),
});
```

Still no batch_id.

This suggests that while the schema defines batch_id in StockLedger, it's not being used in the current implementation.

Let me check if there are any references to batch_id in the code:

Searching through the provided code for "batch_id":

I don't see any explicit references to batch_id being used in the TRPC routers or procedures.

This is a problem because the schema includes batch tracking functionality, but it's not being utilized in the inventory management procedures.

Now let's look for barcode/UPC issues:

In `apps\web\src\lib\validation\barcode.ts`, I see validation functions for UPC, EAN, etc.

Let me check if these are being used anywhere:

In `packages\api\src\barcodes.ts`:
```typescript
// Validation Schemas
const barcodeFormSchema = z.object({
	product_id: z.number(),
	barcode: z.string().min(1, "Barcode is required"),
	barcode_type: z.string().optional(),
	is_weighted: z.boolean().optional(),
	weight_per_unit: z.string().optional(),
});

// Barcodes Router
export const barcodesRouter = router({
	// List all barcodes for a product
	listByProduct: publicProcedure
		.input(z.object({ productId: z.number() }))
		.query(async ({ ctx, input }) => {
			const barcodes = await ctx.db
				.select()
				.from(schema.productBarcodes)
				.where(eq(schema.productBarcodes.product_id, input.productId));

			return barcodes;
		}),

	// List all barcodes with pagination
	list: publicProcedure
		.input(
			z.object({
				search: z.string().optional(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const where = and(
				input.search
					? ilike(schema.productBarcodes.barcode, `%${input.search}%`)
					: undefined,
			);

			const barcodes = await ctx.db
				.select()
				.from(schema.productBarcodes)
				.where(where)
				.limit(input.limit || 50)
				.offset(input.offset || 0)
				.orderBy(schema.productBarcodes.created_at);

			const total = await ctx.db
				.select({ count: schema.productBarcodes.id })
				.from(schema.productBarcodes)
				.where(where);

			return {
				barcodes,
				total: total[0]?.count || 0,
			};
		}),

	// Get barcode by ID
	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const barcode = await ctx.db
				.select()
				.from(schema.productBarcodes)
				.where(eq(schema.productBarcodes.id, input.id));

			return barcode[0];
		}),

	// Get barcode by barcode value
	getByBarcode: publicProcedure
		.input(z.object({ barcode: z.string() }))
		.query(async ({ ctx, input }) => {
			const barcode = await ctx.db
				.select()
				.from(schema.productBarcodes)
				.where(eq(schema.productBarcodes.barcode, input.barcode));

			return barcode[0];
		}),

	// Create barcode
	create: protectedProcedure
		.input(barcodeFormSchema)
		.mutation(async ({ ctx, input }) => {
			const [barcode] = await ctx.db
				.insert(schema.productBarcodes)
				.values({
					product_id: input.product_id,
					barcode: input.barcode,
					barcode_type: input.barcode_type || "EAN-13",
					is_weighted: input.is_weighted || false,
					weight_per_unit: input.weight_per_unit,
				})
				.returning();

			return barcode;
		}),

	// Update barcode
	update: protectedProcedure
		.input(
			z.object({
				id: z.number(),
				data: barcodeFormSchema,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [barcode] = await ctx.db
				.update(schema.productBarcodes)
				.set({
					barcode: input.data.barcode,
					barcode_type: input.data.barcode_type,
					is_weighted: input.data.is_weighted,
					weight_per_unit: input.data.weight_per_unit,
				})
				.where(eq(schema.productBarcodes.id, input.id))
				.returning();

			return barcode;
		}),

	// Delete barcode
	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.delete(schema.productBarcodes)
				.where(eq(schema.productBarcodes.id, input.id));

			return { success: true };
		}),

	// Generate QR code for barcode
	generateQrCode: publicProcedure
		.input(z.object({ barcode: z.string() }))
		.query(async ({ input }) => {
			// In production, this would generate a QR code image
			// For now, return the barcode data
			return {
				barcode: input.barcode,
				qr_code_url: `/api/qrcode?data=${encodeURIComponent(input.barcode)}`,
			};
		}),
});
```

I notice that in the create and update procedures, it's using `input.barcode_type || "EAN-13"` as the default, but it's not validating the barcode format based on the type.

The validation functions in `apps\web\src\lib\validation\barcode.ts` are not being used in the barcode router.

For example, when creating a barcode, it should validate that the barcode is a valid UPC or EAN based on the barcode_type.

Let me check if there's any usage of the validation functions:

I don't see any imports or usage of the validation functions from `apps\web\src\lib\validation\barcode.ts` in the barcode router.

This means that invalid barcodes (like incorrect check digits) could be stored in the system.

Now let's look for negative stock issues:

I already identified a potential