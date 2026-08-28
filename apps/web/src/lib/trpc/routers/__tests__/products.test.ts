// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeUser, SCHEMA_DDL } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { productsRouter } = await import("../products");
const { createCallerFactory } = await import("../../init");

const caller = createCallerFactory(productsRouter)({
	user: makeUser("user-1"),
});
const callerAs = (uid: string) =>
	createCallerFactory(productsRouter)({ user: makeUser(uid) });
// update() is gated by products.write — build callers that carry that permission.
const writeUser = (uid: string) => ({
	...makeUser(uid),
	permissions: ["products.write"],
});
const writer = createCallerFactory(productsRouter)({
	user: writeUser("user-1"),
	db,
});
const writerAs = (uid: string) =>
	createCallerFactory(productsRouter)({ user: writeUser(uid), db });

beforeAll(async () => {
	await pg.exec(SCHEMA_DDL);
	// update() now appends to these tables when a price changes.
	// update() resolves a staff id (via email) and appends to these tables.
	await pg.exec(
		buildDDL(
			[
				schema.staff,
				schema.priceChangeHistory,
				schema.auditLogs,
				schema.branchInventory,
			],
			false,
		),
	);
});
afterAll(async () => {
	await pg.close();
});

describe("products.list", () => {
	it("returns empty array initially", async () => {
		const list = await caller.list();
		expect(list).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("list is global (not user-scoped): shows products from all users", async () => {
		// DRIFT: the current router's list() filters only by is_deleted, so it is
		// no longer user-scoped. Ownership is still stamped at create() via user_uid.
		const p1 = await caller.create({ name: "P1", price: 100 });
		const other = callerAs("other-user");
		const pOther = await other.create({ name: "P-other", price: 50 });

		expect(p1.user_uid).toBe("user-1");
		expect(pOther.user_uid).toBe("other-user");

		const list = await caller.list();
		expect(list.some((p) => p.name === "P1")).toBe(true);
		expect(list.some((p) => p.name === "P-other")).toBe(true);

		const otherList = await other.list();
		expect(otherList.some((p) => p.name === "P1")).toBe(true);
		expect(otherList.some((p) => p.name === "P-other")).toBe(true);
	});

	it("returns correct shape with all expected fields", async () => {
		const list = await caller.list();
		const p = list[0];
		expect(typeof p.id).toBe("number");
		expect(typeof p.name).toBe("string");
		expect(typeof p.sku).toBe("string");
		expect(typeof p.category).toBe("string");
		expect(typeof p.baseProcurementPrice).toBe("number");
		expect(typeof p.baseSellingPrice).toBe("number");
		expect(typeof p.visibilityLevel).toBe("string");
		expect(typeof p.status).toBe("string");
		expect(typeof p.stock).toBe("number");
	});
});

describe("products.create", () => {
	it("creates and persists — visible in list()", async () => {
		const before = await caller.list();
		const p = await caller.create({
			name: "Widget",
			price: 1500,
		});
		expect(p.name).toBe("Widget");
		// DRIFT: price is a decimal STRING on both input->store and return.
		expect(Number(p.price)).toBe(1500);
		expect(p.user_uid).toBe("user-1");
		expect(p.id).toBeGreaterThan(0);

		const after = await caller.list();
		expect(after.length).toBe(before.length + 1);
		const found = after.find((x) => x.id === p.id);
		expect(found).toBeDefined();
		expect(found?.name).toBe("Widget");
	});

	it("omitted optional fields are null in DB", async () => {
		const p = await caller.create({ name: "Bare", price: 100 });
		expect(p.description).toBeNull();
		expect(p.category).toBeNull();

		const list = await caller.list();
		const persisted = list.find((x) => x.id === p.id)!;
		// list() maps a null category to the "General" default.
		expect(persisted.category).toBe("General");
	});

	it("provided optional fields persist correctly", async () => {
		const p = await caller.create({
			name: "Full",
			price: 999,
			description: "desc",
			category: "cat",
		});
		expect(p.description).toBe("desc");
		expect(p.category).toBe("cat");

		const list = await caller.list();
		const persisted = list.find((x) => x.id === p.id)!;
		expect(persisted.category).toBe("cat");
	});

	it("rejects name: empty string — no record created", async () => {
		const before = await caller.list();
		await expect(caller.create({ name: "", price: 100 })).rejects.toThrow();
		const after = await caller.list();
		expect(after.length).toBe(before.length);
	});

	it("rejects invalid price type — no record created", async () => {
		// DRIFT: there is no in_stock field/validation anymore; price is the
		// required numeric field, so a non-number is the current invalid input.
		const before = await caller.list();
		await expect(
			caller.create({ name: "Bad", price: "not-a-number" }),
		).rejects.toThrow();
		const after = await caller.list();
		expect(after.length).toBe(before.length);
	});
});

describe("products.update", () => {
	it("updates fields and change persists in list()", async () => {
		const p = await caller.create({
			name: "Old",
			price: 100,
			description: "keep-me",
		});
		const updated = await writer.update({ id: p.id, name: "New", price: 200 });
		expect(updated.name).toBe("New");
		expect(Number(updated.price)).toBe(200);
		// fields not included in the update input are preserved
		expect(updated.description).toBe("keep-me");

		const list = await caller.list();
		const persisted = list.find((x) => x.id === p.id)!;
		expect(persisted.name).toBe("New");
	});

	it("requires products.write — a permissionless user is FORBIDDEN", async () => {
		const p = await caller.create({ name: "Guarded", price: 100 });
		await expect(caller.update({ id: p.id, name: "Nope" })).rejects.toThrow(
			/permission/i,
		);
	});

	it("update is not ownership-scoped: any user WITH products.write can update by id", async () => {
		// DRIFT: the current router's update() has no per-record ownership check, so
		// any holder of products.write may update any product id.
		const p = await caller.create({ name: "Mine", price: 100 });
		const other = writerAs("attacker");

		const hacked = await other.update({ id: p.id, name: "Hacked" });
		expect(hacked.name).toBe("Hacked");

		const list = await caller.list();
		const row = list.find((x) => x.id === p.id)!;
		expect(row.name).toBe("Hacked");
	});
});

describe("products.delete", () => {
	it("deletes a product — no longer in list()", async () => {
		const p = await caller.create({
			name: "ToDelete",
			price: 100,
		});
		const before = await caller.list();
		expect(before.some((x) => x.id === p.id)).toBe(true);

		await caller.delete({ id: p.id });

		const after = await caller.list();
		expect(after.some((x) => x.id === p.id)).toBe(false);
		expect(after.length).toBe(before.length - 1);
	});

	it("is idempotent — deleting same id twice does not error", async () => {
		const p = await caller.create({
			name: "DelTwice",
			price: 100,
		});
		await caller.delete({ id: p.id });
		const result = await caller.delete({ id: p.id });
		expect(result.success).toBe(true);

		const list = await caller.list();
		expect(list.some((x) => x.id === p.id)).toBe(false);
	});
});
