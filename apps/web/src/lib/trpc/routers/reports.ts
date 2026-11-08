import {
	branchDamage,
	branches,
	branchInventory,
	customers,
	loyaltyHistory,
	orderItems,
	orders,
	productBatches,
	products,
	stockLedger,
	suppliers,
	transactions,
} from "@evaluna/db/schema";
import { and, desc, eq, gte, isNotNull, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { protectedProcedure, router } from "../init";

const reportInput = z.object({
	branch_id: z.number().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export const reportsRouter = router({
	getDayWiseSalesMarginReport: protectedProcedure
		.input(
			z.object({
				branch_id: z.number().optional(),
				startDate: z.string().optional(),
				endDate: z.string().optional(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions: any[] = [];
			if (bId) conditions.push(eq(orders.branch_id, bId));
			if (input.startDate)
				conditions.push(
					gte(orders.created_at, new Date(`${input.startDate}T00:00:00`)),
				);
			if (input.endDate)
				conditions.push(
					lte(orders.created_at, new Date(`${input.endDate}T23:59:59`)),
				);

			// Fetch orders with items, products and customer
			const ordersList = await db.query.orders.findMany({
				where: conditions.length > 0 ? and(...conditions) : undefined,
				with: {
					customer: {
						columns: { id: true, name: true, phone: true },
					},
					orderItems: {
						with: {
							product: {
								columns: {
									id: true,
									name: true,
									sku: true,
									category: true,
									unit: true,
									base_procurement_price: true,
									base_selling_price: true,
									price: true,
								},
							},
						},
					},
				},
				orderBy: [desc(orders.created_at)],
			});

			const dayMap: Record<
				string,
				{
					date: string;
					orderCount: number;
					totalQuantity: number;
					sellingTotal: number;
					costTotal: number;
					grossProfit: number;
					marginPercent: number;
					discountTotal: number;
					topProductsMap: Record<
						string,
						{
							name: string;
							sku: string;
							category: string;
							unit: string;
							qty: number;
							unitPrice: number;
							costPrice: number;
							revenue: number;
							cost: number;
							profit: number;
							marginPercent: number;
						}
					>;
					orders: Array<{
						id: number;
						billNumber: string | null;
						customerName: string;
						sellingTotal: number;
						costTotal: number;
						grossProfit: number;
						marginPercent: number;
						itemsCount: number;
						status: string | null;
						createdAt: string;
					}>;
				}
			> = {};

			let grandTotalSelling = 0;
			let grandTotalCost = 0;
			let grandTotalQuantity = 0;
			let grandTotalDiscounts = 0;
			const productTotalsMap: Record<
				number,
				{
					id: number;
					name: string;
					sku: string;
					category: string;
					unit: string;
					qty: number;
					revenue: number;
					cost: number;
					profit: number;
					orderIds: Set<number>;
					customerIds: Set<number>;
					unitSellingPrice: number;
					unitCostPrice: number;
				}
			> = {};

			for (const o of ordersList) {
				const dateKey = (o.created_at ? new Date(o.created_at) : new Date())
					.toISOString()
					.split("T")[0];

				if (!dayMap[dateKey]) {
					dayMap[dateKey] = {
						date: dateKey,
						orderCount: 0,
						totalQuantity: 0,
						sellingTotal: 0,
						costTotal: 0,
						grossProfit: 0,
						marginPercent: 0,
						discountTotal: 0,
						topProductsMap: {},
						orders: [],
					};
				}

				const day = dayMap[dateKey];
				day.orderCount += 1;
				const discount = Number(o.discount_amount || 0);
				day.discountTotal += discount;
				grandTotalDiscounts += discount;

				let orderSelling = 0;
				let orderCost = 0;
				let orderQty = 0;

				for (const it of o.orderItems || []) {
					const qty = Number(it.quantity || 0);
					const sellingPricePerUnit = Number(it.price || 0);
					const itemRev = qty * sellingPricePerUnit;
					orderSelling += itemRev;
					orderQty += qty;

					const prod = it.product;
					const costPerUnit = prod
						? Number(
								prod.base_procurement_price ||
									sellingPricePerUnit * 0.8,
							)
						: sellingPricePerUnit * 0.8;
					const itemCost = qty * costPerUnit;
					orderCost += itemCost;

					const pName = prod?.name || `Product #${it.product_id}`;
					const pSku = prod?.sku || "";
					const pCategory = prod?.category || "General";
					const pUnit = prod?.unit || "Pcs";

					if (!day.topProductsMap[pName]) {
						day.topProductsMap[pName] = {
							name: pName,
							sku: pSku,
							category: pCategory,
							unit: pUnit,
							qty: 0,
							unitPrice: sellingPricePerUnit,
							costPrice: costPerUnit,
							revenue: 0,
							cost: 0,
							profit: 0,
							marginPercent: 0,
						};
					}
					day.topProductsMap[pName].qty += qty;
					day.topProductsMap[pName].revenue += itemRev;
					day.topProductsMap[pName].cost += itemCost;
					day.topProductsMap[pName].profit += itemRev - itemCost;

					const pid = it.product_id || (prod ? prod.id : 0);
					if (pid) {
						if (!productTotalsMap[pid]) {
							productTotalsMap[pid] = {
								id: pid,
								name: pName,
								sku: pSku,
								category: pCategory,
								unit: pUnit,
								qty: 0,
								revenue: 0,
								cost: 0,
								profit: 0,
								orderIds: new Set<number>(),
								customerIds: new Set<number>(),
								unitSellingPrice: sellingPricePerUnit,
								unitCostPrice: costPerUnit,
							};
						}
						productTotalsMap[pid].qty += qty;
						productTotalsMap[pid].revenue += itemRev;
						productTotalsMap[pid].cost += itemCost;
						productTotalsMap[pid].profit += itemRev - itemCost;
						if (o.id) productTotalsMap[pid].orderIds.add(o.id);
						if (o.customer?.id) productTotalsMap[pid].customerIds.add(o.customer.id);
					}
				}

				const netOrderSelling = Math.max(0, orderSelling - discount);
				const orderProfit = netOrderSelling - orderCost;
				const orderMargin =
					netOrderSelling > 0 ? (orderProfit / netOrderSelling) * 100 : 0;

				day.totalQuantity += orderQty;
				day.sellingTotal += netOrderSelling;
				day.costTotal += orderCost;
				day.grossProfit += orderProfit;

				grandTotalSelling += netOrderSelling;
				grandTotalCost += orderCost;
				grandTotalQuantity += orderQty;

				day.orders.push({
					id: o.id,
					billNumber: o.bill_number || `ORD-${o.id}`,
					customerName: o.customer?.name || "Customer",
					sellingTotal: Number(netOrderSelling.toFixed(2)),
					costTotal: Number(orderCost.toFixed(2)),
					grossProfit: Number(orderProfit.toFixed(2)),
					marginPercent: Number(orderMargin.toFixed(1)),
					itemsCount: o.orderItems?.length || 0,
					status: o.status,
					createdAt: o.created_at ? new Date(o.created_at).toISOString() : "",
				});
			}

			const dayWiseReports = Object.values(dayMap)
				.sort((a, b) => b.date.localeCompare(a.date))
				.map((day) => {
					const margin =
						day.sellingTotal > 0
							? (day.grossProfit / day.sellingTotal) * 100
							: 0;
					const dayProducts = Object.values(day.topProductsMap)
						.sort((a, b) => b.qty - a.qty)
						.map((p) => {
							const rev = Number(p.revenue.toFixed(2));
							const cst = Number(p.cost.toFixed(2));
							const prof = Number(p.profit.toFixed(2));
							const mrg =
								rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0;
							return {
								...p,
								revenue: rev,
								cost: cst,
								profit: prof,
								marginPercent: mrg,
							};
						});

					return {
						date: day.date,
						orderCount: day.orderCount,
						totalQuantity: day.totalQuantity,
						sellingTotal: Number(day.sellingTotal.toFixed(2)),
						costTotal: Number(day.costTotal.toFixed(2)),
						grossProfit: Number(day.grossProfit.toFixed(2)),
						marginPercent: Number(margin.toFixed(1)),
						discountTotal: Number(day.discountTotal.toFixed(2)),
						topProducts: dayProducts.slice(0, 5),
						dayProducts: dayProducts,
						orders: day.orders,
					};
				});

			const grandGrossProfit = grandTotalSelling - grandTotalCost;
			const grandMargin =
				grandTotalSelling > 0
					? (grandGrossProfit / grandTotalSelling) * 100
					: 0;
			const topProductsOverall = Object.values(productTotalsMap)
				.sort((a, b) => b.profit - a.profit)
				.slice(0, 10)
				.map((p) => ({
					...p,
					revenue: Number(p.revenue.toFixed(2)),
					cost: Number(p.cost.toFixed(2)),
					profit: Number(p.profit.toFixed(2)),
					marginPercent:
						p.revenue > 0
							? Number(((p.profit / p.revenue) * 100).toFixed(1))
							: 0,
				}));

			const allProducts = Object.values(productTotalsMap)
				.sort((a, b) => b.qty - a.qty)
				.map((p) => {
					const avgSelling =
						p.qty > 0
							? Number((p.revenue / p.qty).toFixed(2))
							: p.unitSellingPrice;
					const avgCost =
						p.qty > 0 ? Number((p.cost / p.qty).toFixed(2)) : p.unitCostPrice;
					const rev = Number(p.revenue.toFixed(2));
					const cst = Number(p.cost.toFixed(2));
					const prof = Number(p.profit.toFixed(2));
					const margin =
						rev > 0 ? Number(((prof / rev) * 100).toFixed(1)) : 0;
					return {
						id: p.id,
						name: p.name,
						sku: p.sku,
						category: p.category || "General",
						unit: p.unit || "Pcs",
						totalQty: p.qty,
						orderCount: p.orderIds.size,
						uniqueCustomerCount: p.customerIds.size,
						unitSellingPrice: avgSelling,
						unitCostPrice: avgCost,
						totalRevenue: rev,
						totalCost: cst,
						netProfit: prof,
						marginPercent: margin,
					};
				});

			return {
				summary: {
					totalOrders: ordersList.length,
					totalQuantity: grandTotalQuantity,
					totalSelling: Number(grandTotalSelling.toFixed(2)),
					totalCost: Number(grandTotalCost.toFixed(2)),
					grossProfit: Number(grandGrossProfit.toFixed(2)),
					overallMarginPercent: Number(grandMargin.toFixed(1)),
					totalDiscounts: Number(grandTotalDiscounts.toFixed(2)),
					averageOrderValue:
						ordersList.length > 0
							? Number((grandTotalSelling / ordersList.length).toFixed(2))
							: 0,
					totalProductsCount: allProducts.length,
				},
				dayWise: dayWiseReports,
				topProducts: topProductsOverall,
				allProducts: allProducts,
			};
		}),
	getSalesReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(orders.branch_id, bId));
			if (input.startDate)
				conditions.push(gte(orders.created_at, new Date(input.startDate)));
			if (input.endDate)
				conditions.push(lte(orders.created_at, new Date(input.endDate)));

			return db.query.orders.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					total_amount: true,
					created_at: true,
					status: true,
					payment_method_id: true,
				},
				with: {
					orderItems: {
						columns: {
							id: true,
							product_id: true,
							quantity: true,
							price: true,
						},
					},
					customer: {
						columns: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
				},
				orderBy: [desc(orders.created_at)],
			});
		}),

	getGstReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(orders.branch_id, bId));
			if (input.startDate)
				conditions.push(gte(orders.created_at, new Date(input.startDate)));
			if (input.endDate)
				conditions.push(lte(orders.created_at, new Date(input.endDate)));

			const data = await db.query.orders.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					cgst_amount: true,
					sgst_amount: true,
					igst_amount: true,
					total_amount: true,
					created_at: true,
				},
			});
			return data;
		}),

	getProfitReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;

			const ordersConditions = [];
			if (bId) ordersConditions.push(eq(orders.branch_id, bId));
			if (input.startDate)
				ordersConditions.push(
					gte(orders.created_at, new Date(input.startDate)),
				);
			if (input.endDate)
				ordersConditions.push(lte(orders.created_at, new Date(input.endDate)));

			const salesData = await db.query.orders.findMany({
				where: and(...ordersConditions),
				columns: { total_amount: true, discount_amount: true },
			});

			const ledgerConditions = [eq(stockLedger.transaction_type, "out")];
			if (bId) ledgerConditions.push(eq(stockLedger.branch_id, bId));
			if (input.startDate)
				ledgerConditions.push(
					gte(stockLedger.created_at, new Date(input.startDate)),
				);
			if (input.endDate)
				ledgerConditions.push(
					lte(stockLedger.created_at, new Date(input.endDate)),
				);

			const cogsData = await db.query.stockLedger.findMany({
				where: and(...ledgerConditions),
				columns: { total_cost: true },
			});

			return { salesData, cogsData };
		}),

	getStockReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(branchInventory.branch_id, bId));
			if (input.startDate)
				conditions.push(
					gte(branchInventory.created_at, new Date(input.startDate)),
				);
			if (input.endDate)
				conditions.push(
					lte(branchInventory.created_at, new Date(input.endDate)),
				);

			return db.query.branchInventory.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					branch_id: true,
					product_id: true,
					in_stock: true,
					reorder_level: true,
					reserved_stock: true,
					created_at: true,
				},
				with: {
					product: {
						columns: {
							id: true,
							name: true,
							sku: true,
							barcode: true,
							price: true,
						},
					},
				},
			});
		}),

	getLowStockReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(branchInventory.branch_id, bId));

			// Note: branchInventory.in_stock <= branchInventory.reorder_level
			// can be evaluated by selecting all and filtering, or using sql in where.
			// Easiest is returning rows and letting frontend handle, but let's query it.

			const inventory = await db.query.branchInventory.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					product_id: true,
					in_stock: true,
					reorder_level: true,
				},
				with: {
					product: {
						columns: {
							id: true,
							name: true,
							sku: true,
						},
					},
				},
			});

			return inventory.filter(
				(item: any) => item.in_stock <= item.reorder_level,
			);
		}),

	getDeadStockReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(branchInventory.branch_id, bId));

			return db.query.branchInventory.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					product_id: true,
					in_stock: true,
					reorder_level: true,
				},
				with: {
					product: {
						columns: {
							id: true,
							name: true,
							sku: true,
						},
					},
				},
			});
		}),

	getDamageReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			// branchDamage doesn't have branch_id directly, it uses location_id.
			// we'll filter by dates for now, and optionally join location if branch_id is strictly required.
			const conditions = [];
			if (input.startDate)
				conditions.push(
					gte(branchDamage.created_at, new Date(input.startDate)),
				);
			if (input.endDate)
				conditions.push(lte(branchDamage.created_at, new Date(input.endDate)));

			return db.query.branchDamage.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					product_id: true,
					quantity: true,
					reason: true,
					created_at: true,
				},
				with: {
					product: {
						columns: {
							id: true,
							name: true,
						},
					},
					batch: {
						columns: {
							id: true,
							batch_number: true,
						},
					},
				},
			});
		}),

	getExpiryReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [isNotNull(productBatches.expiry_date)];
			if (bId) conditions.push(eq(productBatches.branch_id, bId));
			if (input.startDate)
				conditions.push(
					gte(productBatches.expiry_date, new Date(input.startDate)),
				);
			if (input.endDate)
				conditions.push(
					lte(productBatches.expiry_date, new Date(input.endDate)),
				);

			return db.query.productBatches.findMany({
				where: and(...conditions),
				with: { product: true },
			});
		}),

	getCustomerReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(customers.branch_id, bId));
			if (input.startDate)
				conditions.push(gte(customers.created_at, new Date(input.startDate)));
			if (input.endDate)
				conditions.push(lte(customers.created_at, new Date(input.endDate)));

			return db.query.customers.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					name: true,
					email: true,
					phone: true,
					loyalty_points: true,
					total_spent: true,
					created_at: true,
				},
				with: {
					orders: {
						columns: {
							id: true,
							total_amount: true,
							created_at: true,
						},
					},
				},
			});
		}),

	getSupplierReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input }) => {
			const conditions = [];
			if (input.startDate)
				conditions.push(gte(suppliers.created_at, new Date(input.startDate)));
			if (input.endDate)
				conditions.push(lte(suppliers.created_at, new Date(input.endDate)));

			return db.query.suppliers.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					name: true,
					email: true,
					phone: true,
					outstanding_balance: true,
					created_at: true,
				},
			});
		}),

	getCashBookReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(transactions.branch_id, bId));
			if (input.startDate)
				conditions.push(
					gte(transactions.created_at, new Date(input.startDate)),
				);
			if (input.endDate)
				conditions.push(lte(transactions.created_at, new Date(input.endDate)));

			return db.query.transactions.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					amount: true,
					type: true,
					category: true,
					description: true,
					created_at: true,
					status: true,
				},
				orderBy: [desc(transactions.created_at)],
			});
		}),

	getBranchComparisonReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input }) => {
			const conditions = [];
			if (input.startDate)
				conditions.push(gte(branches.created_at, new Date(input.startDate)));
			if (input.endDate)
				conditions.push(lte(branches.created_at, new Date(input.endDate)));

			return db.query.branches.findMany({
				where: and(...conditions),
				columns: {
					id: true,
					name: true,
					code: true,
					created_at: true,
				},
			});
		}),

	getCouponReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [isNotNull(orders.coupon_id)];
			if (bId) conditions.push(eq(orders.branch_id, bId));
			if (input.startDate)
				conditions.push(gte(orders.created_at, new Date(input.startDate)));
			if (input.endDate)
				conditions.push(lte(orders.created_at, new Date(input.endDate)));

			return db.query.orders.findMany({
				where: and(...conditions),
				with: { coupon: true },
			});
		}),

	getLoyaltyReport: protectedProcedure
		.input(reportInput)
		.query(async ({ input, ctx }) => {
			const bId = input.branch_id ?? ctx.user.branchId;
			const conditions = [];
			if (bId) conditions.push(eq(loyaltyHistory.branch_id, bId));
			if (input.startDate)
				conditions.push(
					gte(loyaltyHistory.created_at, new Date(input.startDate)),
				);
			if (input.endDate)
				conditions.push(
					lte(loyaltyHistory.created_at, new Date(input.endDate)),
				);

			return db.query.loyaltyHistory.findMany({
				where: and(...conditions),
				with: { customer: true },
			});
		}),
});
