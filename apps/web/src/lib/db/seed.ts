import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { auth } from "../auth";
import { db } from ".";
import {
	customers,
	orderItems,
	orders,
	paymentMethods,
	products,
	salesReturns,
	transactions,
} from "./schema";

const DEMO_EMAIL = "test@example.com";
const DEMO_PASSWORD = "test1234";
const DEMO_NAME = "Test User";

const EXPENSE_CATEGORIES = [
	"rent",
	"utilities",
	"supplies",
	"marketing",
	"maintenance",
] as const;

export async function seed() {
	const existing = await db
		.select({ count: sql<number>`count(*)` })
		.from(paymentMethods);

	if (existing[0].count > 0) return;

	// ── Payment Methods ──────────────────────────────────────────────────────
	const [pmCredit, pmDebit, pmCash] = await db
		.insert(paymentMethods)
		.values([{ name: "Credit Card" }, { name: "Debit Card" }, { name: "Cash" }])
		.returning();

	const paymentMethodIds = [pmCredit.id, pmDebit.id, pmCash.id];

	// ── Demo User ────────────────────────────────────────────────────────────
	const signUpRes = await auth.api.signUpEmail({
		body: { name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASSWORD },
	});
	const userId = signUpRes.user.id;

	// ── Customers ────────────────────────────────────────────────────────────
	const customerValues = Array.from({ length: 20 }, () => ({
		name: faker.person.fullName(),
		email: faker.internet.email().toLowerCase(),
		phone: faker.phone.number({ style: "national" }),
		user_uid: userId,
		status: faker.helpers.arrayElement([
			"active",
			"active",
			"active",
			"inactive",
		]),
		created_at: faker.date.recent({ days: 90 }),
	}));

	const insertedCustomers = await db
		.insert(customers)
		.values(customerValues)
		.returning();

	// ── Products ─────────────────────────────────────────────────────────────
	const productNames: Record<string, string[]> = {
		electronics: [
			"Wireless Mouse",
			"Mechanical Keyboard",
			"USB-C Hub",
			"Webcam HD",
			"Bluetooth Speaker",
			'LED Monitor 24"',
			"Phone Charger",
			"HDMI Cable",
		],
		clothing: [
			"Cotton T-Shirt",
			"Denim Jacket",
			"Running Shoes",
			"Baseball Cap",
			"Wool Scarf",
			"Leather Belt",
			"Polo Shirt",
			"Cargo Pants",
		],
		books: [
			"Clean Code",
			"Design Patterns",
			"The Pragmatic Programmer",
			"Refactoring",
			"Domain-Driven Design",
			"System Design Interview",
			"JavaScript: The Good Parts",
			"Learning SQL",
		],
		home: [
			"Ceramic Mug",
			"Desk Lamp",
			"Wall Clock",
			"Throw Pillow",
			"Kitchen Scale",
			"Glass Vase",
			"Bath Towel Set",
			"Scented Candle",
		],
	};

	const productValues = Object.entries(productNames).flatMap(
		([category, names]) =>
			names.map((name) => ({
				name,
				description: faker.commerce.productDescription(),
				price: faker.number.int({ min: 499, max: 29999 }).toString(),
				in_stock: faker.number.int({ min: 0, max: 200 }),
				user_uid: userId,
				category,
			})),
	);

	const insertedProducts = await db
		.insert(products)
		.values(productValues)
		.returning();

	// ── Orders + Order Items + Selling Transactions ──────────────────────────
	const orderCount = 40;
	for (let i = 0; i < orderCount; i++) {
		const customer = faker.helpers.arrayElement(insertedCustomers);
		const pmId = faker.helpers.arrayElement(paymentMethodIds);
		const itemCount = faker.number.int({ min: 1, max: 5 });
		const chosenProducts = faker.helpers.arrayElements(
			insertedProducts,
			itemCount,
		);

		const items = chosenProducts.map((p) => ({
			product_id: p.id,
			quantity: faker.number.int({ min: 1, max: 4 }),
			price: p.price,
		}));

		const totalAmount = items.reduce(
			(sum, item) => sum + Number(item.price) * item.quantity,
			0,
		);

		const createdAt = faker.date.recent({ days: 60 });

		const [order] = await db
			.insert(orders)
			.values({
				customer_id: customer.id,
				total_amount: totalAmount.toString(),
				user_uid: userId,
				status: faker.helpers.weightedArrayElement([
					{ value: "completed", weight: 8 },
					{ value: "pending", weight: 1.5 },
					{ value: "cancelled", weight: 0.5 },
				]),
				created_at: createdAt,
			})
			.returning();

		await db.insert(orderItems).values(
			items.map((item) => ({
				order_id: order.id,
				...item,
			})),
		);

		if (order.status === "completed") {
			await db.insert(transactions).values({
				order_id: order.id,
				payment_method_id: pmId,
				amount: totalAmount.toString(),
				user_uid: userId,
				type: "income",
				category: "selling",
				status: "completed",
				created_at: createdAt,
			});
		}
	}

	// ── Sales Returns ────────────────────────────────────────────────────────
	const completedOrders = await db
		.select()
		.from(orders)
		.where(eq(orders.status, "completed"))
		.limit(5);
	let returnCount = 0;
	for (const order of completedOrders) {
		const reason = faker.helpers.arrayElement([
			"Defective product",
			"Wrong item sent",
			"Customer changed mind",
		]);
		const status = faker.helpers.arrayElement([
			"pending",
			"approved",
			"refunded",
			"rejected",
		]);
		const amount = (
			Number.parseFloat(order.total_amount) *
			faker.number.float({ min: 0.1, max: 1.0 })
		).toFixed(2);

		if (order.customer_id) {
			await db.insert(salesReturns).values({
				order_id: order.id,
				customer_id: order.customer_id,
				total_amount: amount,
				reason,
				status,
				user_uid: userId,
				created_at: faker.date.recent({ days: 10 }),
			});
			returnCount++;
		}
	}

	// ── Expense Transactions ─────────────────────────────────────────────────
	const expenseCount = 25;
	for (let i = 0; i < expenseCount; i++) {
		const category = faker.helpers.arrayElement(EXPENSE_CATEGORIES);
		const descriptions: Record<string, () => string> = {
			rent: () => `Monthly rent — ${faker.date.month()}`,
			utilities: () =>
				`${faker.helpers.arrayElement(["Electricity", "Water", "Internet"])} bill`,
			supplies: () =>
				`${faker.helpers.arrayElement(["Office supplies", "Packaging materials", "Cleaning products"])}`,
			marketing: () =>
				`${faker.helpers.arrayElement(["Google Ads", "Facebook campaign", "Flyers printing", "Influencer collab"])}`,
			maintenance: () =>
				`${faker.helpers.arrayElement(["AC repair", "Store painting", "Equipment servicing", "Plumbing fix"])}`,
		};

		await db.insert(transactions).values({
			payment_method_id: faker.helpers.arrayElement(paymentMethodIds),
			amount: faker.number.int({ min: 2000, max: 150000 }).toString(),
			user_uid: userId,
			type: "out",
			category,
			status: faker.helpers.weightedArrayElement([
				{ value: "completed", weight: 9 },
				{ value: "pending", weight: 1 },
			]),
			created_at: faker.date.recent({ days: 60 }),
		});
	}

	console.log(
		`Seeded: 3 payment methods, 1 demo user (${DEMO_EMAIL} / ${DEMO_PASSWORD}), ` +
			`${customerValues.length} customers, ${productValues.length} products, ` +
			`${orderCount} orders, ${returnCount} sales returns, ${expenseCount} expense transactions`,
	);
}
