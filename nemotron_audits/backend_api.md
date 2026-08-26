I need to analyze the provided code as a BACKEND/API auditor for the Evaluna ERP project. I'll focus on API routes, controllers, services, validation, request handling, response handling, error handling, authentication middleware, authorization middleware, rate limiting, API consistency, async problems, race conditions, and incorrect HTTP behavior.

Let me go through the code systematically to find actual issues.

First, I'll look for any obvious API-related issues in the provided files.

Starting with the TRPC router files:

1. `apps\web\src\lib\trpc\router.ts` - Just re-exports from index, no issues visible.

2. `apps\web\src\app\api\auth\[...all]\route.ts` - Uses better-auth/next-js handler, looks standard.

3. `apps\web\src\app\api\openapi.json\route.ts` - Returns OpenAPI document, looks fine.

4. `apps\web\src\lib\trpc\client.ts` - Creates TRPC React Query client, standard.

5. `apps\web\src\app\api\docs\route.ts` - Uses Scalar for API docs, standard.

6. `seed-admin.js` - Just a fetch call to seed admin, not backend code.

7. `packages\db\run-seed.ts` - Calls GET on seed-all route, not backend.

8. `db-query.ts` - Direct DB query script, not backend.

9. `apps\web\next-env.d.ts` - Next.js types, not backend.

10. `apps\web\scratch\login-test.js` - Test script, not backend.

11. `packages\api\src\routers\.hrms_disabled\index.ts` - Exports HRMS routers (disabled), not active.

12. `scratch\db-query.ts` - Another DB query script.

13. `apps\web\src\lib\trpc\serverClient.ts` - Creates cached server client, looks fine.

14. `apps\web\test-signup.ts` - Test script.

15. `apps\web\scratch\prod-test.js` - Production test script.

16. `check.js` - DB check script.

17. `apps\web\scripts\ensure-db.js` and `.ts` - DB initialization scripts.

18. `apps\web\src\lib\trpc\openapi.ts` - Generates OpenAPI doc, looks fine.

19. `scripts\check-db.ts` - DB check script.

20. `packages\api\src\index.js` - This is important! Let me examine this closely.

Looking at `packages\api\src\index.js`:
```javascript
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.context().meta().create({
	transformer: superjson,
});
export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});
```

I notice something concerning here. The `protectedProcedure` is defined as:
```javascript
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});
```

This middleware checks if `ctx.user` exists and throws UNAUTHORIZED if not. However, it then calls `next({ ctx: { ...ctx, user: ctx.user } })` which is redundant since `ctx.user` is already in the context. But more importantly, there's a potential issue: it's not checking if the user is active or if their account is suspended.

Looking at the actual protected procedure in `packages\api\src\index.ts` (which seems to be the real file, as there's both .js and .ts versions), I see:

```typescript
// Base protected procedure ensures user is logged in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
	}
	if (!ctx.user.isActive) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Account suspended" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});
```

This is actually better - it checks `isActive` as well. But I need to check which file is actually being used. Since there's both a .js and .ts file, and the project likely uses TypeScript, the .ts file is probably the one being used.

Let me check if there are any issues with this protected procedure.

Actually, looking more carefully at the .ts version in `packages\api\src\index.ts`:
```typescript
// Base protected procedure ensures user is logged in
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in" });
	}
	if (!ctx.user.isActive) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Account suspended" });
	}
	return next({ ctx: { ...ctx, user: ctx.user } });
});
```

This looks correct. It checks for user existence and active status.

But wait, I see a potential issue: the middleware returns `next({ ctx: { ...ctx, user: ctx.user } })`. This is creating a new context object with the user property, but the user property is already in ctx. This is unnecessary but not harmful.

However, there's a more subtle issue. In TypeScript, when we do `{ ...ctx, user: ctx.user }`, we're spreading the entire ctx object and then overwriting the user property with the same value. This is redundant but harmless.

Let me look for other potential issues.

Looking at `apps\web\src\lib\trpc\init.ts`:
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

This looks fine. It transforms the user from `getAuthUser()` into the expected format.

Now, let's look at the auth guard: `apps\web\src\lib\auth-guard.ts`

This is important for authentication. Let me examine it:

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

This looks mostly correct, but I notice a potential issue: when checking if the user is active, it uses `dbUser?.is_active` (from the database), but when building the enriched session, it uses `dbUser.is_active ?? true`. This creates an inconsistency.

If `dbUser.is_active` is false, the function returns null early (line: `if (!dbUser?.is_active) { ... return null; }`). So the `?? true` fallback would never be used for inactive users because they're already filtered out.

However, if `dbUser.is_active` is null or undefined, the early return wouldn't trigger (since `!null` is true, but `!undefined` is also true - wait, let's check):

Actually, `if (!dbUser?.is_active)`:
- If `dbUser.is_active` is `false` → `!false` is true → returns null
- If `dbUser.is_active` is `true` → `!true` is false → continues
- If `dbUser.is_active` is `null` → `!null` is true → returns null
- If `dbUser.is_active` is `undefined` → `!undefined` is true → returns null

So actually, the early return handles both false and null/undefined values. Then when building the enriched session, `dbUser.is_active ?? true` would only be used if `dbUser.is_active` is not null/undefined/false, which means it must be true. So the `?? true` is redundant but harmless.

Actually, let me double-check:
- If `dbUser.is_active` is `false` → early return triggers → function returns null
- If `dbUser.is_active` is `true` → early return doesn't trigger → `dbUser.is_active ?? true` evaluates to `true`
- If `dbUser.is_active` is `null` → early return triggers → function returns null
- If `dbUser.is_active` is `undefined` → early return triggers → function returns null

So the `?? true` is never actually used in practice because any falsy value (false, null, undefined) would trigger the early return. It's redundant but not harmful.

Let me look for actual issues.

Looking at `apps\web\src\app\api\trpc\[trpc]\route.ts`:
```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { wsHandler } from "@trpc/server/adapters/ws";
import { createTRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/lib/trpc/router";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

// WebSocket handler for TRPC subscriptions
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(req: Request) {
  // Check if this is a WebSocket upgrade request
  if (req.headers.get("upgrade") === "websocket") {
    return wsHandler({
      endpoint: "/api/trpc",
      router: appRouter,
      createContext: createTRPCContext,
    })(req);
  }

  // Otherwise, handle as regular HTTP request
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}
```

This looks standard for a TRPC HTTP handler. The WebSocket upgrade check is correct.

Let me check for any missing error handling or incorrect HTTP behavior.

Looking at `apps\web\src\app\api\backup\route.ts`:
```typescript
import { NextResponse } from "next/server";
import { pglite } from "@/lib/db";

export async function GET() {
	try {
		// PGlite allows dumping its data directory as a tarball (or File/Blob depending on platform)
		// In Node.js, it dumps as a Buffer or Blob containing a tar archive of the database
		const file = await (pglite as any)?.dumpDataDir("tar");

		// Convert to buffer if it's a File or Blob
		let buffer: Buffer;
		if (file instanceof Blob || file instanceof File) {
			buffer = Buffer.from(await file.arrayBuffer());
		} else {
			buffer = Buffer.from(file as any);
		}

		const date = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `evaluna-erp-backup-${date}.tar`;

		return new NextResponse(buffer as any, {
			status: 200,
			headers: {
				"Content-Type": "application/x-tar",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("Backup failed:", error);
		return NextResponse.json({ error: "Backup failed" }, { status: 500 });
	}
}
```

This looks fine. It handles errors and returns appropriate HTTP status codes.

Let me check the sync route: `apps\web\src\app\api\sync\route.ts`
```typescript
import { pendingSync } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

This looks mostly fine, but I notice a potential issue: it's missing authentication/authorization checks. The comment says "Note: In a real system, you would verify an API key or session token here." but it's not implemented. This is a security issue - anyone can trigger a sync operation.

However, as an auditor, I should only report issues supported by the provided code. The code doesn't show any authentication check, so this is a valid issue.

Let me check if there are any other similar issues.

Looking at `apps\web\src\app\api\seed-admin\route.ts`:
```typescript
import { user } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/seed-admin
// Creates a default admin account if none exists.
// Remove or protect this route in production!
export async function POST() {
	try {
		const adminEmail = "admin@evaluna.com";
		const adminPassword = "Admin@1234";

		// Check if admin already exists
		const existing = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.email, adminEmail))
			.limit(1);

		if (existing.length > 0) {
			return NextResponse.json({
				success: true,
				message: "Admin already exists",
				credentials: { email: adminEmail, password: adminPassword },
			});
		}

		// Create admin via better-auth
		const result = await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				password: adminPassword,
				name: "System Admin",
			},
		});

		if (!result) {
			return NextResponse.json(
				{ success: false, error: "Failed to create admin" },
				{ status: 500 },
			);
		}

		// Update role to admin
		await db
			.update(user)
			.set({ role: "admin" } as any)
			.where(eq(user.email, adminEmail));

		return NextResponse.json({
			success: true,
			message: "Admin account created successfully!",
			credentials: {
				email: adminEmail,
				password: adminPassword,
				role: "admin",
			},
		});
	} catch (error: any) {
		console.error("Seed admin error:", error);
		return NextResponse.json(
			{ success: false, error: error?.message ?? "Unknown error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		message: "POST to this endpoint to seed the admin account",
		credentials: {
			email: "admin@evaluna.com",
			password: "Admin@1234",
		},
	});
}
```

This route has a comment saying "// Remove or protect this route in production!" which indicates it's known to be insecure. It creates an admin account without any authentication check. This is a critical security issue.

Similarly, `apps\web\src\app\api\seed-users\route.ts` seeds multiple users without authentication.

Let me check that one too:
```typescript
import { user } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const USERS_TO_SEED = [
	{ name: "Super Admin", email: "superadmin@evaluna.com", role: "superadmin" },
	{ name: "Admin", email: "admin@evaluna.com", role: "admin" },
	{ name: "Sales Manager", email: "sales@evaluna.com", role: "sales_person" },
	{ name: "Auditor Desk", email: "auditor@evaluna.com", role: "auditor" },
	{ name: "HR Manager", email: "hr@evaluna.com", role: "hr" },
	{ name: "Warehouse Picker", email: "picker@evaluna.com", role: "picker" },
	{ name: "Warehouse Putter", email: "putter@evaluna.com", role: "putter" },
	{ name: "Driver / Delivery", email: "driver@evaluna.com", role: "driver" },
	{ name: "Marketing Exec", email: "marketing@evaluna.com", role: "marketing" },
];

export async function POST() {
	try {
		const password = "Password@123";
		const created = [];

		for (const u of USERS_TO_SEED) {
			// Check if exists
			const existing = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.email, u.email))
				.limit(1);

			if (existing.length === 0) {
				// Create via better-auth
				const result = await auth.api.signUpEmail({
					body: {
						email: u.email,
						password: password,
						name: u.name,
					},
				});

				if (result) {
					// Update role
					await db
						.update(user)
						.set({ role: u.role } as any)
						.where(eq(user.email, u.email));

					created.push(u.email);
				}
			}
		}

		return NextResponse.json({
			success: true,
			message: "Test users seeded successfully!",
			created,
			password_for_all: password,
			users: USERS_TO_SEED,
		});
	} catch (error: any) {
		console.error("Seed users error:", error);
		return NextResponse.json(
			{ success: false, error: error?.message ?? "Unknown error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return POST();
}
```

This also seeds users without any authentication check.

Now, let me look for other issues.

Looking at `apps\web\src\app\api\finance\upload\route.ts` and `apps\web\src\app\api\finance\attachments\[id]\route.ts`, these seem to have proper authentication via `getAuthUser()`.

Let me check if there are any async problems or race conditions.

Looking at `apps\web\src\lib\offline\syncManager.ts`:
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

This processes items sequentially, which is fine. No obvious race conditions here.

Looking at `apps\web\src\lib\offline\sync.ts`:
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

This also processes items sequentially. No obvious race conditions.

Let me check for incorrect HTTP behavior.

Looking at `apps\web\src\app\api\attendance\upload\route.ts`:
```typescript
export async function POST(req: Request) {
	const user = await getAuthUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let form: FormData;
	try {
		form = await req.formData();
	} catch {
		return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
	}

	const file = form.get("file");
	const kind = String(form.get("kind") || "checkIn");
	if (!(file instanceof File))
		return NextResponse.json({ error: "No image provided" }, { status: 400 });

	const entityType =
		kind === "checkOut" ? ATTENDANCE_ENTITY.checkOut : ATTENDANCE_ENTITY.checkIn;

	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		const result = await storeAttendanceImage(db, {
			buffer,
			mime: file.type,
			originalName: file.name || "attendance.jpg",
			branchId: user.branchId ?? null,
			entityType,
			uploadedBy: user.userId,
		});
		return NextResponse.json({ id: result.id });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Upload failed";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
```

This looks correct - it returns 401 for unauthenticated, 400 for bad request, and 200 for success.

Let me check the finance upload route for comparison:
```typescript
export async function POST(req: Request) {
	const user = await getAuthUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let form: FormData;
	try {
		form = await req.formData();
	} catch {
		return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
	}

	const file = form.get("file");
	const entityType = String(form.get("entity_type") || "payment");
	if (!(file instanceof File))
		return NextResponse.json({ error: "No file provided" }, { status: 400 });
	if (!ALLOWED_ENTITY.has(entityType))
		return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });

	const ext = ALLOWED[file.type];
	if (!ext)
		return NextResponse.json(
			{ error: "Unsupported file type. Allowed: PDF, JPG, PNG, WEBP." },
			{ status: 415 },
		);
	if (file.size <= 0 || file.size > MAX_BYTES)
		return NextResponse.json(
			{ error: "File must be between 1 byte and 10 MB" },
			{ status: 413 },
		);

	// ... rest of the code
}
```

This also looks correct with proper status codes.

Now, let me look for validation issues.

Looking at `apps\web\src\lib\trpc\routers\transactions.ts`:
```typescript
const transactionSchema = z.object({
	id: z.number(),
	description: z.string().nullable(),
	amount: z.string(),
	type: z.string().nullable(),
	category: z.string().nullable(),
	status: z.string().nullable(),
	order_id: z.number().nullable(),
	payment_method_id: z.number().nullable(),
	user_uid: z.string(),
	created_at: z.coerce.date().nullable(),
});

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

	create: protectedProcedure
		.meta({
			openapi: {
				method: "POST",
				path: "/transactions",
				tags: ["Transactions"],
				summary: "Create a transaction",
			},
		})
		.input(
			z.object({
				description: z.string().min(1),
				amount: z.string(),
				type: z.enum(["income", "expense"]),
				category: z.string().optional(),
				status: z.enum(["completed", "pending"]).optional(),
			}),
		)
		.output(transactionSchema)
		.mutation(async ({ ctx, input }) => {
			const [data] = await db
				.insert(transactions)
				.values({ ...input, user_uid: ctx.user.id })
				.returning();
			return data;
		}),

	// ... update and delete
});
```

The validation looks correct. The create method requires description (min 1), amount, and type (income/expense).

Let me check if there are any missing validations that should be there.

Looking at `apps\web\src\lib\trpc\routers\expenses.ts`:
```typescript
import { expenses } from "@evaluna/db/schema";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { expenseSchema } from "@/lib/validation/expense";
import { protectedProcedure, router } from "../init";

export const expensesRouter = router({
	create: protectedProcedure
		.input(expenseSchema)
		.mutation(async ({ input, ctx }) => {
			const { id, ...expenseData } = input;
			const newExpense = await db
				.insert(expenses)
				.values({
					...expenseData,
					amount: expenseData.amount.toString(),
					user_uid: ctx.user.id,
				})
				.returning();

			return newExpense[0];
		}),
	// ... other methods
});
```

It uses `expenseSchema` for validation, which is imported from "@/lib/validation/expense". Without seeing that file, I can't verify if the validation is correct, but the usage looks proper.

Let me check for API consistency issues.

Looking at the OpenAPI generation in `apps\web\src\lib\trpc\openapi.ts`:
```typescript
import { generateOpenApiDocument } from "trpc-to-openapi";
import { appRouter } from "./router";

export const openApiDocument = generateOpenApiDocument(appRouter, {
	title: "Evaluna ERP API",
	description:
		"Open-source Point of Sale system API — products, customers, orders, transactions, and payment methods.",
	version: "0.4.1",
	baseUrl: "/api",
	tags: [
		"Products",
		"Customers",
		"Orders",
		"Transactions",
		"Payment Methods",
		"Dashboard",
	],
});
```

This looks fine.

Now, let me look for authentication middleware issues.

I already looked at the protected procedure in `packages\api\src\index.ts` which seems correct.

Let me check if there are any routes that should be protected but aren't.

Looking at `apps\web\src\app\api\backup\route.ts` - this should probably be protected, but it doesn't have any authentication check. Anyone can trigger a backup.

Similarly, the sync route I mentioned earlier lacks authentication.

Let me confirm: does `apps\web\src\app\api\backup\route.ts` have any authentication?

```typescript
import { NextResponse } from "next/server";
import { pglite } from "@/lib/db";

export async function GET() {
	try {
		// ... backup code
	} catch (error) {
		console.error("Backup failed:", error);
		return NextResponse.json({ error: "Backup failed" }, { status: 500 });
	}
}
```

No authentication check at all. This is a problem - anyone can download a backup of the database.

Similarly, let's check if there are other unprotected sensitive routes.

Looking at `apps\web\src\app\api\seed-admin\route.ts` and `apps\web\src\app\api\seed-users\route.ts` - these are clearly meant to be unprotected for initialization, but they should be removed or protected in production as the comment indicates.

But the backup route doesn't have such a comment - it's just unprotected.

Let me check if there are any other routes without authentication.

Looking at `apps\web\src\app\api\openapi.json\route.ts`:
```typescript
import { NextResponse } from "next/server";
import { openApiDocument } from "@/lib/trpc/openapi";

export function GET() {
	return NextResponse.json(openApiDocument);
}
```

This is probably fine to be public - it's just the API documentation.

The docs route: `apps\web\src\app\api\docs\route.ts` uses Scalar to serve the API docs, which is also fine to be public.

But the backup route should definitely be protected.

Let me check if there are any rate limiting issues. I don't see any explicit rate limiting in the code, but that might be handled at a higher level (like in Next.js middleware or a reverse proxy). Since I'm only to report issues supported by the provided code, and there's no rate limiting code shown, I shouldn't report missing rate limiting as an issue unless it's clearly missing where it should be.

Now, let me look for async problems.

Looking at `apps\web\src\lib\trpc\server.ts`:
```typescript
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCallerFactory, createTRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/lib/trpc/router";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

/**
 * Create a context for the tRPC API
 */
export const createContext = createTRPCContext;

/**
 * Get a server client for the tRPC API
 * @example
 * const { trpc } = getServerClient();
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const getServerClient = async () => {
	const context = await createContext();
	const caller = createCaller(context);

	return {
		trpc: caller,
	};
};
```

This looks fine. The `getServerClient` function properly awaits the context creation.

Let me check if there are any issues with the context creation that could cause async problems.

In `apps\web\src\lib\trpc\init.ts`:
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
				isActive