// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as schema from "@/lib/db/schema";
import { buildDDL, createTestDb, makeUser, SCHEMA_DDL } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { productsRouter } = await import("../products");
const { createCallerFactory } = await import("../../init");

const authed = createCallerFactory(productsRouter)({ user: makeUser("u1") });
const unauth = createCallerFactory(productsRouter)({ user: null as any });
const undefinedUser = createCallerFactory(productsRouter)({
	user: undefined as any,
});

beforeAll(async () => {
	await pg.exec(SCHEMA_DDL);
	await pg.exec(buildDDL([schema.branchInventory], false));
});
afterAll(async () => {
	await pg.close();
});

describe("protectedProcedure", () => {
	it("rejects when user is null", async () => {
		await expect(unauth.list()).rejects.toThrow("Not logged in");
	});

	it("rejects when user is undefined", async () => {
		await expect(undefinedUser.list()).rejects.toThrow("Not logged in");
	});

	it("proceeds when user is valid and returns array", async () => {
		const result = await authed.list();
		expect(result).toBeArray();
		expect(result.length).toBe(0);
	});

	it("stamps user_uid from ctx.user.id on create and persists in DB", async () => {
		const product = await authed.create({ name: "Auth Test", price: 100 });
		// create() returns the raw row, which carries the owner stamp.
		expect(product.user_uid).toBe("u1");

		// list() maps rows to the UI shape (no user_uid), but the record persists.
		const list = await authed.list();
		const found = list.find((p) => p.id === product.id);
		expect(found).toBeDefined();
		expect(found?.name).toBe("Auth Test");
	});

	it("products list is global (not user-scoped) while create stamps the caller as owner", async () => {
		const callerB = createCallerFactory(productsRouter)({
			user: makeUser("u2"),
		});
		const pB = await callerB.create({ name: "User B Product", price: 200 });
		expect(pB.user_uid).toBe("u2");

		// products.list filters only by is_deleted, so every caller sees all products.
		const listA = await authed.list();
		expect(listA.some((p) => p.id === pB.id)).toBe(true);
		expect(listA.some((p) => p.name === "User B Product")).toBe(true);
	});
});
