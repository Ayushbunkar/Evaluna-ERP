Let me analyze the provided code for performance/production issues, focusing on the specific areas mentioned: slow queries, N+1, unnecessary API requests, excessive rendering, memory problems, caching, scalability, connection pools, background jobs, offline synchronization, PWA, deployment, logging, monitoring, and reliability.

I'll go through the code and identify any issues that match these categories.

First, let me look for potential N+1 query problems:

1. In `apps\web\src\lib\trpc\routers\approvals.ts`:
```typescript
export const approvalsRouter = router({
	getApprovals: protectedProcedure
		.input(z.object({ status: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			let query = ctx.db
				.select({
					id: approvals.id,
					referenceType: approvals.reference_type,
					referenceId: approvals.reference_id,
					requestedBy: staff.name,
					reason: approvals.comments,
					status: approvals.status,
					date: approvals.created_at,
				})
				.from(approvals)
				.leftJoin(staff, eq(approvals.requested_by, staff.id));

			if (input.status) {
				query = query.where(eq(approvals.status, input.status)) as any;
			}

			const results = await query;

			return results.map((r) => ({
				id: `APP-${r.id}`,
				referenceType: r.referenceType || "Unknown",
				referenceId: `REF-${r.referenceId}`,
				requestedBy: r.requestedBy || "Unknown",
				amount: 0,
				reason: r.reason || "No reason provided",
				status: r.status || "pending",
				date: r.date
					? new Date(r.date).toISOString()
					: new Date().toISOString(),
			}));
		}),
```

This looks okay - it's doing a join to get the staff name in the same query.

2. In `apps\web\src\lib\trpc\routers\batches.ts`:
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
```

This is a simple query, no N+1 issue.

3. In `apps\web\src\lib\trpc\routers\barcodes.ts`:
```typescript
export const barcodesRouter = router({
	listByProduct: publicProcedure
		.input(z.object({ productId: z.number() }))
		.query(async ({ ctx, input }) => {
			const barcodes = await ctx.db
				.select()
				.from(productBarcodes)
				.where(eq(productBarcodes.product_id, input.productId));

			return barcodes;
		}),
```

Again, simple query.

4. In `apps\web\src\lib\trpc\routers\branches.ts`:
```typescript
export const branchesRouter = router({
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
});
```

This is doing a join, so it's efficient.

5. In `apps\web\src\lib\trpc\routers\cashbook.ts`:
```typescript
export const cashbookRouter = router({
	getLedger: publicProcedure
		.input(
			z.object({
				limit: z.number().default(50),
				offset: z.number().default(0),
			}),
		)
		.query(async ({ input }) => {
			const items = await db.query.transactions.findMany({
				orderBy: [desc(transactions.created_at)],
				limit: input.limit,
				offset: input.offset,
			});

			// Compute running balance for displayed items roughly (usually requires window functions)
			return { items };
		}),
```

This is a simple query with limit/offset.

6. In `apps\web\src\lib\trpc\routers\expenses.ts`:
```typescript
export const expensesRouter = router({
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

			const items = await db.query.expenses.findMany({
				limit: limit + 1,
				offset: cursor ? cursor * limit : 0,
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
```

This is using cursor-based pagination, which is good for performance.

7. In `apps\web\src\lib\trpc\routers\picking.ts`:
```typescript
export const pickingRouter = router({
	getPickLists: protectedProcedure
		.input(z.object({ limit: z.number().optional().default(10) }))
		.query(async ({ input }) => {
			const lists = await db.query.pickLists.findMany({
				limit: input.limit,
				orderBy: [desc(pickLists.created_at)],
				with: {
					order: {
						with: { customer: true },
					},
					assignedTo: true,
					pickListItems: true,
				},
			});

			return lists.map((pl: any) => ({
				id: `PL-${pl.id}`,
				orderId: pl.order_id ? `ORD-${pl.order_id}` : "N/A",
				customerName: pl.order?.customer?.name ?? "Unknown",
				status: pl.status ?? "pending",
				priority: pl.priority ?? "normal",
				totalItems: pl.pickListItems.reduce(
					(acc: number, item: any) => acc + (item.quantity_ordered ?? 0),
					0,
				),
				assignedTo: pl.assignedTo?.name ?? "Not Assigned",
				createdAt: pl.created_at
					? new Date(pl.created_at).toISOString()
					: new Date().toISOString(),
			}));
		}),
```

This is using `with` to eagerly load related data, which prevents N+1 queries.

8. In `apps\web\src\lib\trpc\routers\price-audit.ts`:
```typescript
export const priceAuditRouter = router({
	// ── Read: immutable price-change log (newest first) ───────────────────────
	listPriceChanges: permProcedure("pricing_audit", "read")
		.input(z.object({ productId: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					id: priceChangeHistory.id,
					product_id: priceChangeHistory.product_id,
					product_name: products.name,
					price_field: priceChangeHistory.price_field,
					old_price: priceChangeHistory.old_price,
					new_price: priceChangeHistory.new_price,
					changed_by: priceChangeHistory.changed_by,
					changed_by_uid: priceChangeHistory.changed_by_uid,
					reason: priceChangeHistory.reason,
					approval_ref: priceChangeHistory.approval_ref,
					source: priceChangeHistory.source,
					created_at: priceChangeHistory.created_at,
				})
				.from(priceChangeHistory)
				.leftJoin(products, eq(priceChangeHistory.product_id, products.id))
				.where(input?.productId ? eq(priceChangeHistory.product_id, input.productId) : undefined)
				.orderBy(desc(priceChangeHistory.created_at));
			return rows;
		}),
```

This is doing a left join to get the product name, which is efficient.

9. In `apps\web\src\lib\trpc\routers\suppliers.ts`:
```typescript
export const suppliersRouter = router({
	getById: roleProcedure(["admin", "manager", "auditor"])
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			const supplier = await db.query.suppliers.findFirst({
				where: eq(suppliers.id, input.id),
			});

			if (!supplier) throw new Error("Supplier not found");

			const ledger = await db.query.transactions.findMany({
				where: and(
					eq(transactions.reference_type, "supplier_payment"),
					eq(transactions.reference_id, input.id),
				),
				orderBy: [desc(transactions.created_at)],
			});

			const purchaseHistory = await db.query.purchases.findMany({
				where: eq(purchases.supplier_id, input.id),
				orderBy: [desc(purchases.created_at)],
			});

			return { supplier, ledger, purchaseHistory };
		}),
```

Here we have a potential N+1 issue. The `getById` procedure is making two additional queries:
1. `ledger` query to get transactions
2. `purchaseHistory` query to get purchases

If this endpoint is called multiple times for different suppliers, it could lead to N+1 query problems. However, since it's a `getById` endpoint (singular), it's less likely to be called in a loop. But if there's a list endpoint that calls this for each item, it could be problematic.

Looking at the `list` procedure in the same file:
```typescript
	list: roleProcedure(["admin", "manager", "auditor"])
		.input(z.void())
		.query(async () => {
			return await db.select().from(suppliers);
		}),
```

This just returns suppliers without the ledger and purchase history. So if a client wants to display a list of suppliers with their ledger and purchase history, they would need to call `getById` for each supplier, leading to N+1.

However, looking at the code, there's no list endpoint that includes the ledger and purchase history. The `list` endpoint only returns basic supplier info. So the N+1 risk is theoretical unless there's a client-side pattern that calls `getById` for each supplier in a list.

Let me check if there's a list endpoint that includes more data:
```typescript
	list: roleProcedure(["admin", "manager", "auditor"])
		.input(z.void())
		.query(async () => {
			return await db.select().from(suppliers);
		}),
```

No, it's just selecting from suppliers without joins.

So the `getById` endpoint is making two additional queries, but since it's designed to get a single supplier with its related data, this is acceptable. The N+1 problem would only occur if someone incorrectly used this endpoint in a loop to get data for multiple suppliers.

Let me check for other potential N+1 issues.

10. In `apps\web\src\lib\trpc\routers\transactions.ts`:
```typescript
export const transactionsRouter = router({
	list: protectedProcedure
		.meta({
			openapi: {
				method: "GET",
				path: "/transactions",
				tags: ["Transactions"],
				summary: "List all transactions",
			},
		})
		.input(z.void())
		.output(z.array(transactionSchema))
		.query(async ({ ctx }) => {
			return db
				.select()
				.from(transactions)
				.where(eq(transactions.user_uid, ctx.user.id));
		}),
```

This is a simple query filtering by user_id.

Now let's look for slow queries or inefficient patterns:

1. In `apps\web\src\lib\trpc\routers\approvals.ts`:
```typescript
	getApprovals: protectedProcedure
		.input(z.object({ status: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			let query = ctx.db
				.select({
					id: approvals.id,
					referenceType: approvals.reference_type,
					referenceId: approvals.reference_id,
					requestedBy: staff.name,
					reason: approvals.comments,
					status: approvals.status,
					date: approvals.created_at,
				})
				.from(approvals)
				.leftJoin(staff, eq(approvals.requested_by, staff.id));

			if (input.status) {
				query = query.where(eq(approvals.status, input.status)) as any;
			}

			const results = await query;

			return results.map((r) => ({
				id: `APP-${r.id}`,
				referenceType: r.referenceType || "Unknown",
				referenceId: `REF-${r.referenceId}`,
				requestedBy: r.requestedBy || "Unknown",
				amount: 0,
				reason: r.reason || "No reason provided",
				status: r.status || "pending",
				date: r.date
					? new Date(r.date).toISOString()
					: new Date().toISOString(),
			}));
		}),
```

This query is doing a left join and then mapping the results. It looks efficient.

2. In `apps\web\src\lib\trpc\routers\branches.ts`:
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

This is doing an inner join, which is efficient for getting inventory with product details.

3. In `apps\web\src\lib\trpc\routers\cashbook.ts`:
```typescript
	getDailySummary: publicProcedure
		.input(
			z.object({
				date: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			let targetDate = input.date ? new Date(input.date) : new Date();

			if (!input.date) {
				const latestTx = await db.query.transactions.findFirst({
					orderBy: [desc(transactions.created_at)],
				});
				if (latestTx?.created_at) {
					targetDate = new Date(latestTx.created_at);
				}
			}

			const start = startOfDay(targetDate);
			const end = endOfDay(targetDate);

			const dailyTx = await db.query.transactions.findMany({
				where: and(
					gte(transactions.created_at, start),
					lte(transactions.created_at, end),
					eq(transactions.status, "completed"),
				),
			});

			let totalIn = 0;
			let totalOut = 0;
			let sales = 0;
			let expenses = 0;

			for (const tx of dailyTx) {
				const amt = Number.parseFloat(tx.amount);
				if (tx.type === "in" || tx.type === "income") {
					totalIn += amt;
					if (tx.category === "sale" || tx.category === "selling") sales += amt;
				} else if (tx.type === "out" || tx.type === "expense") {
					totalOut += amt;
					if (tx.category === "expense") expenses += amt;
				}
			}

			return {
				totalIn,
				totalOut,
				sales,
				expenses,
				net: totalIn - totalOut,
			};
		}),
```

This is fetching all transactions for a day and then processing them in a loop. If there are many transactions for a day, this could be slow. However, it's using `findMany` without a limit, which could return a large number of rows.

This is a potential performance issue if there are many transactions per day. It would be better to use aggregation in the database rather than fetching all rows and processing them in JavaScript.

Let me check if there are any limits or if this is expected to handle small datasets.

Looking at the code, there's no limit on the `dailyTx` query, so if there are thousands of transactions in a day, this could be slow.

4. In `apps\web\src\lib\trpc\routers\expenses.ts`:
```typescript
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

			const items = await db.query.expenses.findMany({
				limit: limit + 1,
				offset: cursor ? cursor * limit : 0,
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
```

This is using cursor-based pagination with a limit, which is good for performance.

5. In `apps\web\src\lib\trpc\routers\picking.ts`:
```typescript
	getPickListItems: protectedProcedure
		.input(z.object({ pickListId: z.string() }))
		.query(async ({ input }) => {
			const idStr = input.pickListId.replace("PL-", "");
			const id = Number.parseInt(idStr, 10);

			if (Number.isNaN(id)) return [];

			const items = await db.query.pickListItems.findMany({
				where: eq(pickListItems.pick_list_id, id),
				with: {
					product: true,
					location: true,
				},
			});

			return items.map((item: any) => ({
				id: `ITEM-${item.pick_list_id}-${item.id}`,
				productCode:
					item.product?.sku ??
					item.product?.barcode ??
					`SKU-${item.product_id}`,
				productName: item.product?.name ?? "Unknown Product",
				orderedQty: item.quantity_ordered ?? 0,
				pickedQty: item.quantity_picked ?? 0,
				location: item.location?.name ?? "Unknown Location",
				status: item.status ?? "pending",
			}));
		}),
```

This is using `with` to eagerly load related data, which prevents N+1 queries.

Now let's look for unnecessary API requests or excessive rendering:

1. In `apps\web\src\app\(auth)\signup\actions.ts`:
```typescript
export async function signup(formData: FormData) {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;

	let user: any = null;

	try {
		// Sign out any existing session first
		try {
			await auth.api.signOut({ headers: await headers() });
		} catch {
			// Ignore - no active session to sign out
		}

		const res = await auth.api.signUpEmail({
			body: { email, password, name },
			headers: await headers(),
		});
		user = res.user;
	} catch (error: any) {
		console.error("Signup Server Action Error:", error);
		redirect("/signup?error=signup-failed");
	}

	// Superadmins are globally scoped and get their own dashboard
	if (user?.is_superadmin) {
		redirect("/superadmin");
	}

	// Redirect based on role
	const role = user?.role || "sales_person";
	revalidatePath(`/${role === "sales_person" ? "sales" : role}`, "layout");
	redirect(`/${role === "sales_person" ? "sales" : role}`);
}
```

This is signing out any existing session before signing up, which is good practice to avoid session conflicts. However, it's making an extra API request to sign out even if there's no existing session. The try/catch handles the case where there's no session, but it's still making an unnecessary request in the common case where there is no existing session to sign out.

This is a minor performance issue - an unnecessary API request in the common case.

2. In `apps\web\src\app\(auth)\login\actions.ts`:
```typescript
export async function login(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	// Always remember users persistently (1 year session) as requested
	const rememberMe = true;

	const predefinedAccounts: Record<string, string> = {
		"superadmin@evaluna.com": "superadmin",
		"manager@evaluna.com": "manager",
		"picker@evaluna.com": "picker",
		"packer@evaluna.com": "packer",
		"checker@evaluna.com": "checker",
		"putter@evaluna.com": "putter",
		"driver@evaluna.com": "driver",
		"admin@evaluna.com": "admin",
		"hr@evaluna.com": "hr",
		"auditor@evaluna.com": "auditor",
		"sales@evaluna.com": "sales_person",
		"billing@evaluna.com": "billing",
	};

	let user: Awaited<ReturnType<typeof auth.api.signInEmail>>["user"] | undefined;

	try {
		// Sign out any existing session first to avoid stale session redirect loops
		try {
			await auth.api.signOut({ headers: await headers() });
		} catch {
			// Ignore - no active session to sign out
		}

		// Auto-signup logic for test accounts
		if (predefinedAccounts[email] && password === "Password@123") {
			try {
				// Try to login first
				const res = await auth.api.signInEmail({
					body: { email, password, rememberMe },
					headers: await headers(),
				});
				user = res.user;
			} catch (err: any) {
				// If login fails (user doesn't exist), sign them up
				const res = await auth.api.signUpEmail({
					body: {
						email,
						password,
						name: predefinedAccounts[email].toUpperCase(),
					},
					headers: await headers(),
				});
				user = res.user;
			}

			// Force their role in DB
			await db
				.update(userTable)
				.set({
					role: predefinedAccounts[email],
					is_superadmin: predefinedAccounts[email] === "superadmin",
				} as any)
				.where(eq(userTable.email, email));
		} else {
			// Normal login for regular users
			const res = await auth.api.signInEmail({
				body: { email, password, rememberMe },
				headers: await headers(),
			});
			user = res.user;
		}
	} catch (err: any) {
		console.error("Login Server Action Error:", err);
		const msg = err.body?.message || "invalid-credentials";
		if (msg.includes("suspended")) {
			redirect("/login?error=suspended");
		} else if (msg.includes("locked")) {
			redirect("/login?error=locked");
		}
		redirect("/login?error=invalid-credentials");
	}

	// Superadmins are globally scoped and get their own dashboard
	if (user?.is_superadmin || predefinedAccounts[email] === "superadmin") {
		redirect("/superadmin");
	}

	// Fetch role directly from DB to bypass any better-auth session caching issues
	const dbUser = await db
		.select({ role: userTable.role })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);

	let role = dbUser[0]?.role || user?.role || "sales_person";

	// Force predefined role for test accounts
	if (predefinedAccounts[email]) {
		role = predefinedAccounts[email];
	}

	revalidatePath(`/${role === "sales_person" ? "sales" : role}`, "layout");
	redirect(`/${role === "sales_person" ? "sales" : role}`);
}
```

Similar to the signup action, this is signing out any existing session before logging in, which is making an unnecessary API request in the common case where there's no existing session to sign out.

Now let's look for caching issues:

1. In `apps\web\src\lib\session-cache.ts`:
```typescript
// Simple in-memory cache implementation to avoid external 'lru-cache' dependency
class SimpleCache<K, V> {
	private cache = new Map<K, { value: V; expiry: number }>();
	private max: number;
	private ttl: number;

	constructor(options: { max: number; ttl: number }) {
		this.max = options.max;
		this.ttl = options.ttl;
	}

	get(key: K): V | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;
		if (Date.now() > entry.expiry) {
			this.cache.delete(key);
			return undefined;
		}
		return entry.value;
	}

	set(key: K, value: V): void {
		if (this.cache.size >= this.max) {
			// Evict first key (oldest inserted)
			const firstKey = this.cache.keys().next().value;
			if (firstKey !== undefined) {
				this.cache.delete(firstKey);
			}
		}
		this.cache.set(key, {
			value,
			expiry: Date.now() + this.ttl,
		});
	}

	delete(key: K): void {
		this.cache.delete(key);
	}
}

// Global cache in server memory
// Caches session data by the Better Auth session token.
export const sessionCache = new SimpleCache<string, CachedSession>({
	max: 1000,
	ttl: 1000 * 60 * 5, // 5 minutes TTL
});

export function getCachedSession(token: string): CachedSession | undefined {
	return sessionCache.get(token);
}

export function setCachedSession(token: string, session: CachedSession): void {
	sessionCache.set(token, session);
}

export function invalidateCachedSession(token: string): void {
	sessionCache.delete(token);
}
```

This is a simple in-memory cache for session data with a 5-minute TTL and max size of 1000 entries. This looks reasonable for reducing database hits for session data.

However, I notice that in `apps\web\src\lib\auth-guard.ts`, the `getAuthUser` function is using this cache:

```typescript
export async function getAuthUser(): Promise<CachedSession | null> {
	const token = await getSessionToken();
	if (!token) return null;

	// 1. Check in-memory cache
	const cached = getCachedSession(token);
	if (cached) {
		if (new Date() > cached.expiresAt) return null;
		if (!cached.isActive) return null;
		return cached;
	}

	// 2. Fetch from Better Auth
	const reqHeaders = await headers();
	const authSession = await auth.api.getSession({
		headers: reqHeaders,
	});

	if (!authSession?.user || !authSession?.session) {
		console.error("[auth-guard] auth.api.getSession returned null!", {
			authSession,
		});
		return null;
	}

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

	// 5. Build enriched session
	const enriched: CachedSession = {
		userId: dbUser.id,
		email: dbUser.email,
		name: dbUser.name,
		role: role,
		branchId: dbUser.branch_id ?? null,
		isSuperadmin: dbUser.is_superadmin ?? false,
		isActive: dbUser.is_active ?? true,
		permissions: permissions,
		expiresAt: authSession.session.expiresAt,
	};

	// 6. Cache and return
	setCachedSession(token, enriched);
	return enriched;
}
```

This is caching the enriched session data for 5 minutes, which should reduce the number of database queries for user details and permissions on subsequent requests with the same session token.

Now let's look for connection pool issues:

I don't see any explicit connection pool configuration in the provided code. The database connection is set up in `apps\web\src\lib\db\index.ts`, but that file isn't provided in the source code snippets.

Let me check if there are any background jobs or offline synchronization issues:

1. In `apps\web\src\lib\offline\syncManager.ts`:
```typescript
export async function processSyncQueue() {
	const pendingItems = await db.sync_queue
		.where("status")
		.equals("pending")
		.toArray();

	for (const item of pendingItems) {
		if (item.id === undefined) continue;

		try {
			// TODO: Call tRPC API here based on item.action and item.payload
			console.log("Processing sync item:", item);

			// Simulate API call
			// await someApiCall(item.action, item.payload);

			await db.sync_queue.update(item.id, { status: "completed" });
		} catch (error) {
			console.error("Failed to sync item:", item.id, error);
			// Optionally mark as failed or leave as pending for retry
			await db.sync_queue.update(item.id, { status: "failed" });
		}
	}
}
```

This is processing the sync queue sequentially. If there are many items in the queue, this could be slow. It's also not batching the updates, which could be inefficient.

However, this is designed to be run periodically (e.g., when the app comes online), so it might be acceptable.

2. In `apps\web\src\lib\offline\sync.ts`:
```typescript
export async function flushSyncQueue() {
	if (typeof window === "undefined" || !navigator.onLine) return;

	const pendingItems = await db.sync_queue
		.where("status")
		.equals("pending")
		.toArray();

	if (pendingItems.length === 0) return;

	console.log(`Flushing ${pendingItems.length} offline mutations...`);

	for (const item of pendingItems) {
		try {
			// In a real robust implementation, this would map the action string (e.g. "orders.create")
			// to the actual TRPC client call, or send it to a batch endpoint.
			// For now, we simulate the flush and mark it completed.
			const res = await fetch(`/api/trpc/${item.action}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(item.payload),
			});

			if (res.ok) {
				await db.sync_queue.update(item.id!, { status: "completed" });
			} else {
				await db.sync_queue.update(item.id!, { status: "failed" });
			}
		} catch (err) {
			console.error("Failed to sync item", item, err);
			// Leave as pending or mark failed depending on retry policy
		}
	}
}
```

This is also processing items sequentially and making individual API calls for each item. If there are many items in the sync queue, this could lead to many API requests and be slow.

It would be more efficient to batch the API calls or use a bulk endpoint.

Now let's look for PWA (Progressive Web App) issues:

1. In `apps\web\next.config.mjs`:
```javascript
const withPWA = withPWAInit({
	dest: "public",
	disable: process.env.NODE_ENV === "development",
	workboxOptions: {
		exclude: [/\/api\//], // Exclude API routes from precaching
		runtimeCaching: [
			{
				// Cache fonts with a long TTL - fonts never change
				urlPattern: /\/fonts\//i,
				handler: "CacheFirst",
				options: {
					cacheName: "fonts-cache",
					expiration: {
						maxEntries: 20,
						maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
					},
				},
			},
			{
				urlPattern: /^(?!.*\/api\/trpc\/).*/i,
				handler: "NetworkFirst",
				options: {
					cacheName: "offlineCache",
					expiration: {
						maxEntries: 200,
					},
				},
			},
		],
	},
});
```

This looks like a reasonable PWA configuration. It's excluding API routes from precaching (which is good because API data changes frequently), caching fonts for a year, and using NetworkFirst for other content with a limit of 200 entries in the offline cache.

However, I notice that the `urlPattern` for the offline cache is `/^(?!.*\/api\/trpc\/).*/i`, which excludes TRPC API routes. This means TRPC API calls won't be cached for offline use, which might be intentional since API data is likely to be stale.

But for a PWA, we might want to cache some API responses for offline use, especially for data that doesn't change frequently (like master data).

Let me check if there are any logging or monitoring issues:

1. In `apps\web\src\lib\monitor-logger.ts`:
```typescript
export async function logEvent(entry: LogEntry): Promise<void> {
	try {
		await db.insert(eventLogs).values({
			branch_id: entry.branchId,
			user_id: entry.userId,
			severity: entry.severity ?? "info",
			category: entry.category,
			event: entry.event,
			message: entry.message,
			metadata: entry.metadata as any,
			duration_ms: entry.durationMs,
			status_code: entry.statusCode,
			ip_address: entry.ipAddress,
			user_agent: entry.userAgent,
		});
	} catch (err) {
		// Never throw from logger — silently write to console as fallback
		console.error("[MonitorLogger] Failed to write event log:", err);
	}
}
```

This is writing logs to the database, which could be a performance issue if there are many log entries. Writing to the database for every log event could slow down the application.

It would be better to use an asynchronous logging mechanism or batch log writes.

2. In `apps\web\src\lib\monitor-logger.ts`:
```typescript
export async function collectSystemMetrics(): Promise<void> {
	try {
		// Node.js process memory
		const mem = process.memoryUsage();
		const memUsedMb = Math.round(mem.