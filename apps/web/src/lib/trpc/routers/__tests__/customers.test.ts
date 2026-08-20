// @ts-nocheck
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { createTestDb, makeUser, SCHEMA_DDL } from "./helpers";

const { pg, db } = createTestDb();
mock.module("@/lib/db", () => ({ db, pglite: pg }));

const { customersRouter } = await import("../customers");
const { createCallerFactory } = await import("../../init");

// Default caller: admin with no branch → sees all branches (superadmin-like scope).
const caller = createCallerFactory(customersRouter)({
	user: makeUser("user-1"),
});
// A caller pinned to a specific branch — customers are isolated by branch_id.
const inBranch = (uid: string, branchId: number) =>
	createCallerFactory(customersRouter)({
		user: { ...makeUser(uid), branchId },
	});

beforeAll(async () => {
	await pg.exec(SCHEMA_DDL);
});
afterAll(async () => {
	await pg.close();
});

describe("customers.list", () => {
	it("returns empty array initially", async () => {
		const list = await caller.list();
		expect(list).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("isolates by branch_id — cross-branch data invisible", async () => {
		const b1 = inBranch("mgr-b1", 1);
		const b2 = inBranch("mgr-b2", 2);
		await b1.create({ name: "C1", email: "c1-list@t.com" });
		await b2.create({ name: "C-other", email: "c-other-list@t.com" });

		const list1 = await b1.list();
		expect(list1.some((c) => c.name === "C1")).toBe(true);
		expect(list1.some((c) => c.name === "C-other")).toBe(false);

		const list2 = await b2.list();
		expect(list2.some((c) => c.name === "C-other")).toBe(true);
		expect(list2.some((c) => c.name === "C1")).toBe(false);
	});
});

describe("customers.create", () => {
	it("creates and persists — visible in list()", async () => {
		const before = await caller.list();
		const c = await caller.create({ name: "John", email: "john@example.com" });
		expect(c.name).toBe("John");
		expect(c.email).toBe("john@example.com");
		expect(c.user_uid).toBe("user-1");
		expect(c.id).toBeGreaterThan(0);

		const after = await caller.list();
		expect(after.length).toBe(before.length + 1);
		const found = after.find((x) => x.id === c.id)!;
		expect(found.name).toBe("John");
		expect(found.email).toBe("john@example.com");
	});

	it("optional fields persist correctly", async () => {
		const c = await caller.create({
			name: "Jane",
			email: "jane@example.com",
			phone: "123456",
			status: "active",
		});

		const list = await caller.list();
		const persisted = list.find((x) => x.id === c.id)!;
		expect(persisted.phone).toBe("123456");
		expect(persisted.status).toBe("active");
	});

	it("rejects name: empty string — no record created", async () => {
		const before = await caller.list();
		await expect(
			caller.create({ name: "", email: "empty@t.com" }),
		).rejects.toThrow();
		const after = await caller.list();
		expect(after.length).toBe(before.length);
	});

	it("rejects invalid email", async () => {
		const before = await caller.list();
		await expect(
			caller.create({ name: "X", email: "not-email" }),
		).rejects.toThrow();
		const after = await caller.list();
		expect(after.length).toBe(before.length);
	});

	it("rejects invalid status enum", async () => {
		await expect(
			caller.create({ name: "X", email: "enum@t.com", status: "bogus" as any }),
		).rejects.toThrow();
	});

	it("rejects duplicate email at DB level — first record intact", async () => {
		const email = "dup@unique.com";
		const first = await caller.create({ name: "First", email });
		await expect(caller.create({ name: "Second", email })).rejects.toThrow();

		const list = await caller.list();
		const dups = list.filter((c) => c.email === email);
		expect(dups.length).toBe(1);
		expect(dups[0].name).toBe("First");
		expect(dups[0].id).toBe(first.id);
	});
});

describe("customers.update", () => {
	it("updates and change persists in list()", async () => {
		const c = await caller.create({ name: "Old", email: "upd@t.com" });
		const updated = await caller.update({ id: c.id, name: "New" });
		expect(updated.name).toBe("New");

		const list = await caller.list();
		const persisted = list.find((x) => x.id === c.id)!;
		expect(persisted.name).toBe("New");
		expect(persisted.email).toBe("upd@t.com"); // unchanged field preserved
	});

	it("cross-branch update fails and original data is untouched", async () => {
		const b1 = inBranch("owner-b1", 1);
		const attacker = inBranch("attacker-b2", 2);
		const c = await b1.create({ name: "Mine", email: "cross-cust@t.com" });
		// Update is scoped to the caller's branch; a branch-2 caller matches no row.
		await expect(
			attacker.update({ id: c.id, name: "Hacked" }),
		).rejects.toThrow();

		const list = await b1.list();
		const original = list.find((x) => x.id === c.id)!;
		expect(original.name).toBe("Mine");
	});
});

describe("customers.delete", () => {
	it("deletes a customer — no longer in list()", async () => {
		const c = await caller.create({ name: "Del", email: "del-cust@t.com" });
		const before = await caller.list();
		expect(before.some((x) => x.id === c.id)).toBe(true);

		await caller.delete({ id: c.id });

		const after = await caller.list();
		expect(after.some((x) => x.id === c.id)).toBe(false);
		expect(after.length).toBe(before.length - 1);
	});

	it("is idempotent — deleting same id twice does not error", async () => {
		const c = await caller.create({ name: "Del2", email: "del2-cust@t.com" });
		await caller.delete({ id: c.id });
		const result = await caller.delete({ id: c.id });
		expect(result.success).toBe(true);

		const list = await caller.list();
		expect(list.some((x) => x.id === c.id)).toBe(false);
	});
});
