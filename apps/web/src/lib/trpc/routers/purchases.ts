import {
	approvals,
	branchInventory,
	products,
	purchaseItems,
	purchaseReturnItems,
	purchaseReturns,
	purchases,
	receivingInspections,
	stockLedger,
	suppliers,
} from "@evaluna/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { purchaseSchema } from "@/lib/validation/purchase";
import { protectedProcedure, router } from "../init";

export const purchasesRouter = router({
	create: protectedProcedure
		.input(purchaseSchema)
		.mutation(async ({ input, ctx }) => {
			const {
				items,
				id,
				createdAt,
				updatedAt,
				supplierId,
				total,
				...purchaseData
			} = input;

			const grn = `GRN-${Math.floor(10000 + Math.random() * 90000)}`;

			const newPurchase = await db
				.insert(purchases)
				.values({
					...purchaseData,
					supplier_id: Number.parseInt(supplierId, 10),
					total_amount: total.toString(),
					user_uid: ctx.user.id,
					grn_number: grn,
					amount_paid: "0",
					payment_status: "unpaid",
				})
				.returning();

			if (newPurchase[0] && items) {
				// Insert purchase items (batch)
				await db.insert(purchaseItems).values(
					items.map((item) => ({
						...item,
						purchase_id: newPurchase[0].id,
						product_id: Number.parseInt(item.productId, 10),
						price: item.price.toString(),
					})),
				);

				// Batch fetch all products at once, then insert ledger entries in one query
				const productIds = items.map((item) =>
					Number.parseInt(item.productId, 10),
				);
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

				// Increase supplier outstanding balance
				const supplier = await db.query.suppliers.findFirst({
					where: eq(suppliers.id, Number.parseInt(supplierId, 10)),
				});
				if (supplier) {
					const newBalance =
						Number.parseFloat(supplier.outstanding_balance || "0") + total;
					await db
						.update(suppliers)
						.set({ outstanding_balance: newBalance.toString() })
						.where(eq(suppliers.id, supplier.id));
				}
			}

			return newPurchase[0];
		}),

	list: protectedProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).default(10),
				cursor: z.number().nullish(),
			}),
		)
		.query(async ({ input }) => {
			const limit = input.limit ?? 10;
			const cursor = input.cursor ?? null;

			const items = await db.query.purchases.findMany({
				limit: limit + 1,
				offset: cursor ? cursor * limit : 0,
				with: {
					supplier: true,
				},
			});

			let nextCursor: typeof cursor | undefined;
			if (items.length > limit) {
				items.pop();
				nextCursor = (cursor ?? 0) + 1;
			}
			return {
				items,
				nextCursor,
			};
		}),

	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const purchase = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.id),
				with: {
					purchaseItems: true,
					supplier: true,
				},
			});
			return purchase;
		}),

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

	getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const [allPurchases, allSuppliers] = await Promise.all([
			ctx.db.query.purchases.findMany({
				with: {
					purchaseItems: true,
				},
			}),
			ctx.db.query.suppliers.findMany(),
		]);

		const posToday = allPurchases.filter(
			(p) => p.created_at && new Date(p.created_at) >= todayStart,
		).length;

		const pendingApproval = allPurchases.filter(
			(p) => p.status === "pending" || p.status === "pending_approval",
		).length;

		const incomingInventory = allPurchases
			.filter((p) => p.status === "pending" || p.status === "pending_approval")
			.reduce((acc, p) => {
				const itemsCount =
					p.purchaseItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
				return acc + itemsCount;
			}, 0);

		const supplierContacts = allSuppliers.length;

		return {
			posToday,
			pendingApproval,
			incomingInventory,
			supplierContacts,
		};
	}),

	getAnalytics: protectedProcedure.query(async ({ ctx }) => {
		const [allPurchases, allSuppliers, inspections, lowStockItems] =
			await Promise.all([
				ctx.db.query.purchases.findMany({
					with: {
						purchaseItems: true,
						supplier: true,
					},
					orderBy: (p, { asc }) => [asc(p.created_at)],
				}),
				ctx.db.query.suppliers.findMany(),
				ctx.db.query.receivingInspections.findMany(),
				ctx.db.query.branchInventory.findMany({
					where: sql`${branchInventory.in_stock} <= 10`,
					with: {
						product: true,
					},
				}),
			]);

		const activePurchases = allPurchases.filter(
			(p) => p.status !== "cancelled",
		);
		const totalSpend = activePurchases.reduce(
			(acc, p) => acc + Number(p.total_amount || 0),
			0,
		);
		const openPOsCount = activePurchases.filter(
			(p) => p.status === "pending" || p.status === "pending_approval",
		).length;

		// Lead times
		let totalLeadTimeMs = 0;
		let leadTimeCount = 0;
		for (const insp of inspections) {
			const purchase = allPurchases.find((p) => p.id === insp.purchase_id);
			if (purchase && purchase.created_at && insp.created_at) {
				const diff =
					new Date(insp.created_at).getTime() -
					new Date(purchase.created_at).getTime();
				if (diff > 0) {
					totalLeadTimeMs += diff;
					leadTimeCount++;
				}
			}
		}
		const avgLeadTimeDays =
			leadTimeCount > 0
				? Number(
						(totalLeadTimeMs / leadTimeCount / (1000 * 60 * 60 * 24)).toFixed(
							1,
						),
					)
				: 0;

		// Monthly Outlay Trend (last 6 months)
		const monthlyDataMap: Record<string, number> = {};
		const now = new Date();
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];

		const last6Months: { monthKey: string; label: string; amount: number }[] =
			[];
		for (let i = 5; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
			monthlyDataMap[monthKey] = 0;
			last6Months.push({ monthKey, label, amount: 0 });
		}

		for (const p of activePurchases) {
			if (p.created_at) {
				const d = new Date(p.created_at);
				const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
				if (key in monthlyDataMap) {
					monthlyDataMap[key] += Number(p.total_amount || 0);
				}
			}
		}

		const outlayTrend = last6Months.map((m) => ({
			label: m.label,
			amount: Number(monthlyDataMap[m.monthKey].toFixed(2)),
		}));

		// Supplier metrics
		const supplierSpendMap: Record<
			number,
			{ name: string; spend: number; poCount: number }
		> = {};
		for (const p of activePurchases) {
			const sId = p.supplier_id;
			if (sId) {
				if (!supplierSpendMap[sId]) {
					supplierSpendMap[sId] = {
						name: p.supplier?.name || `Supplier ${sId}`,
						spend: 0,
						poCount: 0,
					};
				}
				supplierSpendMap[sId].spend += Number(p.total_amount || 0);
				supplierSpendMap[sId].poCount++;
			}
		}

		const suppliersMetric = Object.entries(supplierSpendMap)
			.map(([id, data]) => ({
				id: Number(id),
				name: data.name,
				spend: Number(data.spend.toFixed(2)),
				poCount: data.poCount,
			}))
			.sort((a, b) => b.spend - a.spend)
			.slice(0, 5);

		const onTimeRate =
			activePurchases.length > 0
				? Number(
						((inspections.length / activePurchases.length) * 100).toFixed(1),
					)
				: 100;

		return {
			totalSpend,
			activeSuppliersCount: allSuppliers.length,
			openPOsCount,
			avgLeadTimeDays,
			outlayTrend,
			suppliersMetric,
			onTimeRate,
			lowStockCount: lowStockItems.length,
			lowStockItems: lowStockItems.map((item) => ({
				productName: item.product?.name || "Unknown",
				sku: item.product?.sku || "N/A",
				inStock: item.in_stock,
			})),
		};
	}),

	delete: protectedProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ input }) => {
			await db
				.delete(purchaseItems)
				.where(eq(purchaseItems.purchase_id, input.id));
			await db.delete(purchases).where(eq(purchases.id, input.id));
			return { id: input.id };
		}),
});
