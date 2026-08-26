I need to analyze the provided code for database-related issues, focusing on schema, migrations, foreign keys, constraints, indexes, transactions, race conditions, concurrency, deadlocks, duplicate records, data integrity, query correctness, N+1 queries, connection handling, database performance, unsafe SQL, and missing uniqueness constraints.

Let me go through the code systematically to find actual issues.

First, I'll look for any obvious database issues in the provided files.

Starting with the schema files:

1. `packages/db/src/schema.ts` - This file is referenced but not fully shown in the provided code. I see references to it in various places.

2. `packages/db/src/auth-schema.ts` - This is shown and contains the Better Auth tables extended for Evaluna ERP.

3. Migration files:
   - `packages/db/drizzle/0001_add_gps_battery_level.sql` - Adds battery_level column to gps_logs
   - `packages/db/drizzle/0002_reset_role_permissions.sql` - Drops and recreates role_permissions and user_roles tables

Let me check for issues in these migration files and schema definitions.

Looking at `0002_reset_role_permissions.sql`:
```sql
DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "role_permissions";

CREATE TABLE "role_permissions" (
  "role_id" integer REFERENCES "roles"("id"),
  "permission_id" integer REFERENCES "permissions"("id"),
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE "user_roles" (
  "user_id" varchar(100) REFERENCES "user"("id"),
  "role_id" integer REFERENCES "roles"("id"),
  "assigned_by" varchar(100),
  "assigned_at" timestamp DEFAULT now()
);
```

I notice a potential issue here: The `user_roles` table references `"user"("id")` but in the auth schema, the user table's primary key is `id` of type `text` (as seen in auth-schema.ts: `id: text("id").primaryKey()`).

However, in the `user_roles` table, `user_id` is defined as `varchar(100)`. This should be compatible since text can be cast to varchar, but let's check if there's a mismatch.

In the auth-schema.ts:
```typescript
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	// ... other fields
});
```

So the user.id is text, and in the migration, user_roles.user_id is varchar(100). This should work since text can be stored in varchar, but there's a potential issue: if the user.id values are longer than 100 characters, they would be truncated.

However, looking at Better Auth's default implementation, user IDs are typically UUIDs, which are 36 characters, so varchar(100) should be sufficient.

But let's check if there's a more serious issue: the migration drops and recreates these tables, which would delete all existing role and user role assignments. This is destructive and should only be done in development or with explicit data migration.

However, since this is a migration file named "0002_reset_role_permissions.sql", it seems intentional for resetting permissions, possibly during development.

Now, let's look for other issues.

I see in `packages/db/src/auth-schema.ts` (the TypeScript version):
```typescript
export const user = pgTable("user", {
	// ── Better Auth core ───────────────────────────────────────────────────────
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
	twoFactorEnabled: boolean("twoFactorEnabled").default(false),

	// ── Evaluna ERP extensions ─────────────────────────────────────────────────
	/** ERP role: admin | manager | auditor | putter | picker | biller | sales_person | delivery_manager | delivery_boy */
	role: text("role").default("sales_person").notNull(),
	/** Branch this user primarily belongs to. NULL = superadmin (all branches) */
	branch_id: integer("branch_id"),
	/** Prevents login when false */
	is_active: boolean("is_active").default(true).notNull(),
	/** Cross-branch superadmin flag */
	is_superadmin: boolean("is_superadmin").default(false).notNull(),

	// ── Security ───────────────────────────────────────────────────────────────
	/** Increments on each failed login attempt */
	failed_login_count: integer("failed_login_count").default(0).notNull(),
	/** Account locked until this timestamp after too many failures */
	locked_until: timestamp("locked_until"),
	/** When the password was last changed (for expiry policies) */
	password_changed_at: timestamp("password_changed_at"),
	/** Tracks last activity for idle session detection */
	last_active_at: timestamp("last_active_at"),

	// ── Offline Authentication ─────────────────────────────────────────────────
	/** SHA-256 hash of the offline token stored on device */
	offline_token_hash: text("offline_token_hash"),
	/** Offline token expiry (max 72h from last online login) */
	offline_token_expires_at: timestamp("offline_token_expires_at"),

	// ── Remember Me ────────────────────────────────────────────────────────────
	/** Opaque remember-me token (hashed) for long-lived sessions */
	remember_me_token: text("remember_me_token"),

	// ── 2FA ────────────────────────────────────────────────────────────────────
	two_factor_enabled: boolean("two_factor_enabled").default(false),
	two_factor_secret: text("two_factor_secret"),
	two_factor_backup_codes: text("two_factor_backup_codes"),
});
```

I notice that `two_factor_enabled` is defined twice:
1. Near the top: `twoFactorEnabled: boolean("twoFactorEnabled").default(false),`
2. Near the bottom: `two_factor_enabled: boolean("two_factor_enabled").default(false),`

This is a duplicate column definition, which would cause an error when trying to create the table.

Let me verify this by looking at the exact lines:

In the auth-schema.ts file:
```typescript
	twoFactorEnabled: boolean("twoFactorEnabled").default(false),

	// ── Evaluna ERP extensions ─────────────────────────────────────────────────
	/** ERP role: admin | manager | auditor | putter | picker | biller | sales_person | delivery_manager | delivery_boy */
	role: text("role").default("sales_person").notNull(),
	/** Branch this user primarily belongs to. NULL = superadmin (all branches) */
	branch_id: integer("branch_id"),
	/** Prevents login when false */
	is_active: boolean("is_active").default(true).notNull(),
	/** Cross-branch superadmin flag */
	is_superadmin: boolean("is_superadmin").default(false).notNull(),

	// ── Security ───────────────────────────────────────────────────────────────
	/** Increments on each failed login attempt */
	failed_login_count: integer("failed_login_count").default(0).notNull(),
	/** Account locked until this timestamp after too many failures */
	locked_until: timestamp("locked_until"),
	/** When the password was last changed (for expiry policies) */
	password_changed_at: timestamp("password_changed_at"),
	/** Tracks last activity for idle session detection */
	last_active_at: timestamp("last_active_at"),

	// ── Offline Authentication ─────────────────────────────────────────────────
	/** SHA-256 hash of the offline token stored on device */
	offline_token_hash: text("offline_token_hash"),
	/** Offline token expiry (max 72h from last online login) */
	offline_token_expires_at: timestamp("offline_token_expires_at"),

	// ── Remember Me ────────────────────────────────────────────────────────────
	/** Opaque remember-me token (hashed) for long-lived sessions */
	remember_me_token: text("remember_me_token"),

	// ── 2FA ────────────────────────────────────────────────────────────────────
	two_factor_enabled: boolean("two_factor_enabled").default(false),
	two_factor_secret: text("two_factor_secret"),
	two_factor_backup_codes: text("two_factor_backup_codes"),
);
```

Yes, there are two definitions for what appears to be the same concept:
- `twoFactorEnabled: boolean("twoFactorEnabled").default(false),`
- `two_factor_enabled: boolean("two_factor_enabled").default(false),`

These are two different column names ("twoFactorEnabled" vs "two_factor_enabled"), but they both seem to be trying to store the same information (whether 2FA is enabled). This is likely a mistake where the developer intended to rename the column but accidentally left both definitions.

This would cause the table to have two columns for the same concept, which is redundant and confusing.

Let me check if there are any other duplicate definitions.

Looking through the rest of the file, I don't see other obvious duplicates.

Now, let's check for missing constraints or indexes that might cause performance issues or data integrity problems.

In the auth schema, I see:
- `email: text("email").notNull().unique(),` - Good, unique constraint on email
- But I don't see any index on `branch_id`, which is likely used frequently for filtering users by branch
- Similarly, no index on `role`, which is used for permission checks

However, the instructions say: "Do not invent problems. Report only issues supported by the provided code." So I shouldn't suggest adding indexes unless I can see a specific query that would benefit from it.

Let me look at the TRPC routers to see how these fields are used.

In `apps/web/src/lib/auth-guard.ts`:
```typescript
// 3. Resolve user details directly from our extended user table
	const dbUser = await db.query.user.findFirst({
		where: eq(userTable.id, authSession.user.id),
	});

	if (!dbUser?.is_active) {
		console.error("[auth-guard] dbUser is inactive or null!", { dbUser });
		return null; // Suspended or missing
	}

	const role = (dbUser.role || "sales_person") as Role;

// 4. Resolve permissions defensively.
// Some environments still carry stale legacy role_permissions table shapes,
// so we prefer the canonical static permission matrix over crashing the whole
// session when the dynamic table is unavailable or mismatched.
	let permissions: Permission[] = getPermissionsForRole(role as Role);
	try {
		const permsRows = await db
			.select()
			.from(rolePermissions)
			.where(eq(rolePermissions.role_name, role));
		if (permsRows.length > 0) {
			permissions = permsRows.map(
				(r) => `${r.domain}.${r.action}` as Permission,
			);
		}
	} catch (error) {
		console.warn("[auth-guard] Falling back to static permissions", {
			role,
			error,
		});
	}
```

Here, we're querying by `id` (primary key, so indexed), checking `is_active`, and then using `role` to look up in the `rolePermissions` table.

In the `rolePermissions` table definition:
```typescript
export const rolePermissions = pgTable("role_permissions", {
	id: serial("id").primaryKey(),
	role_name: varchar("role_name", { length: 50 }),
	roleId: integer("role_id").references(() => roles.id),
	domain: varchar("domain", { length: 50 }),
	module: varchar("module", { length: 50 }),
	action: varchar("action", { length: 20 }).notNull(),
	is_allowed: boolean("is_allowed").default(false),
	permissionId: integer("permission_id").references(() => permissions.id),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
```

I notice that there's both `role_name` (varchar) and `roleId` (integer referencing roles.id). This seems redundant. The `role_name` should probably be removed since we have a foreign key to the roles table via `roleId`.

But more importantly, in the auth-guard, we're querying:
```typescript
	const permsRows = await db
		.select()
		.from(rolePermissions)
		.where(eq(rolePermissions.role_name, role));
```

We're filtering by `role_name`, but there's no index on `role_name` in the table definition. This could lead to slow queries as the number of roles and permissions grows.

However, without seeing actual query performance issues, I'm not sure if this qualifies as a reportable issue per the rules.

Let me look for more concrete issues.

Another thing I noticed: in the auth schema, there's a `branch_id` field:
```typescript
	branch_id: integer("branch_id"),
```

But there's no foreign key constraint to ensure it references a valid branch. Looking at the schema, there should be a branches table.

Let me check if there's a branches table defined somewhere.

From the code, I see references to branches in various places, like in `apps/web/src/lib/trpc/routers/branches.ts`:
```typescript
import { branches, branchInventory, products } from "@evaluna/db/schema";
```

And in the schema file (not fully shown, but referenced), there should be a branches table.

In fact, in `packages/db/src/schema-monitoring.ts`, I see:
```typescript
// ── Application Event Log ──────────────────────────────────────────────────────
export const eventLogs = pgTable("event_logs", {
	id: serial("id").primaryKey(),
	branch_id: integer("branch_id").references(() => branches.id),
	// ... rest of the definition
});
```

So there is a branches table, and the auth schema's `branch_id` should reference it.

But in the auth-schema.ts, I see:
```typescript
	branch_id: integer("branch_id"),
```

There's no `.references(() => branches.id)` or similar foreign key constraint.

This is a missing foreign key constraint that could lead to orphaned branch_id values (values that don't correspond to an actual branch).

Let me confirm by looking at the exact auth-schema.ts code provided:

```typescript
	/** Branch this user primarily belongs to. NULL = superadmin (all branches) */
	branch_id: integer("branch_id"),
```

Yes, there's no foreign key constraint. This means the database won't prevent inserting a user with a branch_id that doesn't exist in the branches table.

This is a data integrity issue.

Let me see if there are any other missing foreign keys.

In the same auth-schema.ts, I see:
```typescript
	/** Cross-branch superadmin flag */
	is_superadmin: boolean("is_superadmin").default(false).notNull(),
```

But no foreign key for superadmin status, which makes sense as it's a boolean flag.

Now, let's look at the migration files again for issues.

In `0002_reset_role_permissions.sql`:
```sql
CREATE TABLE "user_roles" (
  "user_id" varchar(100) REFERENCES "user"("id"),
  "role_id" integer REFERENCES "roles"("id"),
  "assigned_by" varchar(100),
  "assigned_at" timestamp DEFAULT now()
);
```

Here, `user_id` is varchar(100) referencing "user"("id"). As I noted earlier, in the auth schema, user.id is text. This should be compatible, but let's double-check the auth-schema.ts:

```typescript
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	// ... 
});
```

Yes, user.id is text. In PostgreSQL, text and varchar are compatible for foreign keys as long as the values fit within the varchar limit. Since user IDs are likely UUIDs (36 chars), varchar(100) is sufficient.

However, there's a potential issue: if the user table's id is defined as text without a length limit, and we're referencing it with varchar(100), then if a user id somehow exceeds 100 characters, it would cause an error when trying to insert into user_roles. But this is unlikely given standard practices.

Another issue I noticed: in the auth-schema.ts (TypeScript version), there's a field:
```typescript
	two_factor_enabled: boolean("two_factor_enabled").default(false),
```

But earlier there was:
```typescript
	twoFactorEnabled: boolean("twoFactorEnabled").default(false),
```

These are two different columns. Let me check if both are actually in the final schema.

Looking at the provided auth-schema.ts code, both lines are present, so the table would have both columns.

This is definitely an issue - duplicate functionality stored in two columns.

Let me see if there are any other duplicate definitions.

Scanning through the auth-schema.ts:
- id: defined once
- name: defined once
- email: defined once
- emailVerified: defined once
- image: defined once
- createdAt: defined once
- updatedAt: defined once
- twoFactorEnabled: defined once (near the top)
- role: defined once
- branch_id: defined once
- is_active: defined once
- is_superadmin: defined once
- failed_login_count: defined once
- locked_until: defined once
- password_changed_at: defined once
- last_active_at: defined once
- offline_token_hash: defined once
- offline_token_expires_at: defined once
- remember_me_token: defined once
- two_factor_enabled: defined once (near the bottom)  <-- DUPLICATE CONCEPT
- two_factor_secret: defined once
- two_factor_backup_codes: defined once

So the issue is having both `twoFactorEnabled` and `two_factor_enabled` columns for what appears to be the same purpose.

Now, let's look for transaction-related issues.

In `apps/web/src/app/api/sync/route.ts`:
```typescript
export async function POST(_req: Request) {
	try {
		// Note: In a real system, you would verify an API key or session token here.

		// Fetch up to 50 pending records to sync
		const pendingRecords = await db
			.select()
			.from(pendingSync)
			.where(eq(pendingSync.status, "pending"))
			.limit(50);

		if (pendingRecords.length === 0) {
			return NextResponse.json({
				message: "No records to sync",
				syncedCount: 0,
			});
		}

		// Mock: Send records to Central Cloud Server
		// const response = await fetch("https://api.central-evaluna.com/v1/sync", {
		//   method: "POST",
		//   body: JSON.stringify(pendingRecords),
		//   headers: { "Content-Type": "application/json" }
		// });
		// if (!response.ok) throw new Error("Cloud sync failed");

		// Simulate network delay and success
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Mark as synced locally
		const recordIds = pendingRecords.map((r) => r.id);

		// We update them one by one or in a batch if Drizzle supports it (Postgres allows IN)
		// For simplicity, we'll loop in a transaction
		await db.transaction(async (tx) => {
			for (const id of recordIds) {
				await tx
					.update(pendingSync)
					.set({ status: "synced", updated_at: new Date() })
					.where(eq(pendingSync.id, id));
			}
		});

		return NextResponse.json({
			message: "Sync successful",
			syncedCount: pendingRecords.length,
		});
	} catch (error: any) {
		console.error("Sync API Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
```

I see they're using a transaction, which is good. However, they're updating records one by one in a loop within the transaction. This is inefficient but not incorrect.

A potential issue: if there are many pending records (they're limiting to 50, so it's bounded), but still, updating one by one could be slow. However, Postgres does support updating multiple records with an IN clause, so they could do it in a single query.

But the comment says: "For simplicity, we'll loop in a transaction" and acknowledges that Drizzle might support batch updates.

This is more of a performance optimization than a correctness issue, so I'm not sure if it's reportable per the rules.

Let me look for actual transaction issues like missing transactions where they're needed.

In `apps/web/src/lib/trpc/routers/purchases.ts`:
```typescript
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
```

Here, they're inserting a purchase, then purchase items, then stock ledger entries, then updating the supplier's outstanding balance. All of these should be in a single transaction to ensure data integrity. If any step fails, we could end up with inconsistent data (e.g., purchase recorded but inventory not updated, or vice versa).

However, they're not wrapping this in a transaction. This is a potential data integrity issue.

Let me check if there are other similar cases.

In the same file, the `processReturn` method:
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

Same issue: multiple operations that should be atomic are not wrapped in a transaction.

Let me check the TRPC init to see if there's automatic transaction handling.

In `apps/web/src/lib/trpc/init.ts`:
```typescript
export const createTRPCContext = async (): Promise<TRPCContext> => {
	const user = await getAuthUser();

	// Transform CachedSession to match BaseUser interface
	const baseUser = user
		? {
				id: user.userId,
				name: user.name,
				email: user.email,
				role: user.role,
				branchId: user.branchId,
				isSuperadmin: user.isSuperadmin,
				isActive: user.isActive,
				permissions: user.permissions,
			}
		: null;

	if (!baseUser) {
		console.error(
			"[TRPC] createTRPCContext user is NULL! getAuthUser returned null",
		);
	}

	return { user: baseUser, db: db as any, realtimeService };
};
```

No automatic transaction handling here. Each procedure is responsible for its own transactions.

So the purchases and purchase returns routers are missing transactions for multi-step operations.

This is a data integrity issue.

Let me see if there are other similar cases.

In `apps/web/src/lib/trpc/routers/transfers.ts`:
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

Here, they're:
1. Checking inventory
2. Updating sender's inventory (deducting quantity)
3. Creating transfer record
4. Inserting stock ledger entry for sender

If step 2 succeeds but step 3 fails, we've deducted inventory but have no transfer record.
If step 3 succeeds but step 4 fails, we have a transfer record but no ledger entry.

This should be in a transaction.

Similarly, in the `receive` method:
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

Same issue: updating transfer status, updating receiver inventory, and inserting ledger entry should be atomic.

And in the `cancel` method:
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

Same pattern.

Now, let's look for missing uniqueness constraints that could lead to duplicate records.

In the auth schema, I see:
```typescript
	email: text("email").notNull().unique(),
```

Good, email is unique.

But what about other fields that should be unique?

For example, in the branches table (which I don't see the full definition of, but referenced elsewhere), there should be a unique constraint on the branch code.

In `apps/web/src/lib/trpc/routers/branches.ts`:
```typescript
	/** Create a new branch */
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				code: z.string().optional(),
				address: z.string().optional(),
				phone: z.string().optional(),
				email: z.string().email().optional(),
				is_headquarters: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Auto-generate code as BR-XXXX if not provided
			const code =
				input.code ??
				`BR-${Math.floor(1000 + Math.random() * 9000).toString()}`;

			const result = await ctx.db
				.insert(branches)
				.values({
					name: input.name,
					code,
					address: input.address ?? null,
					phone: input.phone ?? null,
					email: input.email ?? null,
					is_headquarters: input.is_headquarters ?? false,
				})
				.returning();

			return result[0];
		}),
```

They're generating a code and inserting it, but there's no handling for duplicate