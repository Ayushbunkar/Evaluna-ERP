We are given a large codebase. We are to focus on security/RBAC issues only.

We must look for:
- authentication
- authorization
- RBAC
- privilege escalation
- tenant isolation
- company isolation
- branch isolation
- IDOR
- insecure direct object references
- API authorization
- session security
- secrets
- data leakage
- injection
- CSRF
- XSS
- SSRF
- unsafe file uploads
- sensitive information exposure

We are to report only issues supported by the provided code.

We are to return findings in the format:

## CRITICAL
- [file]
- [function]
- Problem
- Evidence
- Impact
- Exact fix

## HIGH
...

## MEDIUM
...

## LOW
...

## UNCERTAIN
Only include things that require checking another file.

We must prioritize CRITICAL and HIGH.

Let's analyze the code.

We note that the project uses Better Auth for authentication and tRPC for the API.

We'll look for:

1. Authentication issues: e.g., missing authentication checks, weak session management, etc.
2. Authorization issues: e.g., missing role/permission checks, overly permissive access, etc.
3. RBAC issues: e.g., incorrect role hierarchy, missing superadmin bypass, etc.
4. Privilege escalation: e.g., ways to gain higher privileges than intended.
5. Tenant/company/branch isolation: e.g., data leakage between tenants, companies, or branches.
6. IDOR: e.g., direct object references without authorization checks.
7. API authorization: e.g., tRPC procedures without proper protection.
8. Session security: e.g., insecure session handling, missing CSRF protection, etc.
9. Secrets: e.g., hardcoded secrets, exposed secrets.
10. Data leakage: e.g., exposing sensitive data in responses.
11. Injection: e.g., SQL injection, command injection.
12. CSRF: e.g., missing CSRF tokens in state-changing operations.
13. XSS: e.g., unsanitized user input in HTML output.
14. SSRF: e.g., server-side request forgery.
15. Unsafe file uploads: e.g., unrestricted file types, missing validation.
16. Sensitive information exposure: e.g., logging sensitive data, exposing in error messages.

We'll go through the provided code snippets.

Note: We are only to report issues that are actually in the code. We must not invent.

Let's start by looking for obvious issues.

We see in `apps\web\src\lib\auth-guard.ts`:

This file is responsible for getting the authenticated user. It uses a session cache and fetches from Better Auth.

We note that it does:
- Gets the session token from cookies.
- Checks the cache.
- If not in cache, fetches from Better Auth via `auth.api.getSession`.
- Then fetches the user from the extended user table (our own `user` table) to get role, branch_id, etc.
- Then resolves permissions by trying to get from `rolePermissions` table, and if that fails, falls back to static permissions.

This seems reasonable.

However, note that the `getAuthUser` function returns a `CachedSession` or null. It does not check if the user is active? Actually, it does:

```typescript
	if (!dbUser?.is_active) {
		console.error("[auth-guard] dbUser is inactive or null!", { dbUser });
		return null; // Suspended or missing
	}
```

So inactive users are rejected.

Now, let's look at the tRPC context creation in `apps\web\src\lib\trpc\init.ts`:

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

This sets the `user` in the TRPC context. Then, in the API (in `packages\api\src\index.ts`), we have procedures that use this user.

In `packages\api\src\index.ts`, we see:

```typescript
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

This checks for login and active status.

Then we have:

```typescript
export const customerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const customer = await ctx.db.query.customers.findFirst({
		where: (c: any, { eq, and }: any) =>
			and(eq(c.email, ctx.user.email), eq(c.is_deleted, false)),
	});
	if (!customer) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No customer account is linked to this login.",
		});
	}
	return next({ ctx: { ...ctx, user: ctx.user, customer } });
});
```

This is for the customer self-service portal. It ensures the user has a customer record.

Similarly, we have `superadminProcedure` and `requirePermission`, `requireRole`.

Now, let's look for potential issues.

One issue that stands out is in `apps\web\src\app\api\finance\upload\route.ts` and `apps\web\src\app\api\finance\attachments\[id]\route.ts`.

In the upload route, we have:

```typescript
export async function POST(req: Request) {
	const user = await getAuthUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// ... validation ...

	const buffer = Buffer.from(await file.arrayBuffer());

	// Partition on disk by branch so files are naturally scoped, then a random name.
	const branchSeg = user.branchId != null ? `b${user.branchId}` : "shared";
	const storedName = `${randomUUID()}${ext}`;
	const relDir = path.join(branchSeg, entityType);
	const absDir = path.join(uploadRoot(), relDir);
	await mkdir(absDir, { recursive: true });
	await writeFile(path.join(absDir, storedName), buffer);

	const relPath = path.join(relDir, storedName).split(path.sep).join("/");
	const [row] = await db
		.insert(attachments)
		.values({
			branch_id: user.branchId ?? null,
			entity_type: entityType,
			entity_id: null, // linked when the parent record is saved
			file_name: file.name.slice(0, 255),
			stored_name: storedName,
			mime_type: file.type,
			file_size: file.size,
			storage_path: relPath,
			uploaded_by: user.userId,
		})
		.returning();

	return NextResponse.json({
		id: row.id,
		file_name: row.file_name,
		mime_type: row.mime_type,
		file_size: row.file_size,
	});
}
```

This seems to store the file in a branch-specific directory (`b<branchId>`) and then records the `branch_id` in the attachment. Then, in the download route:

```typescript
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const user = await getAuthUser();
	if (!user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const attachmentId = Number(id);
	if (!Number.isInteger(attachmentId) || attachmentId <= 0)
		return NextResponse.json({ error: "Invalid id" }, { status: 400 });

	const [row] = await db
		.select()
		.from(attachments)
		.where(
			and(eq(attachments.id, attachmentId), eq(attachments.is_deleted, false)),
		)
		.limit(1);
	if (!row)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	// Branch isolation: a scoped user may only read their own branch's files.
	if (user.branchId != null && row.branch_id !== user.branchId)
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	const root = path.resolve(uploadRoot());
	const abs = path.resolve(root, row.storage_path);
	if (abs !== root && !abs.startsWith(root + path.sep))
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	let data: Buffer;
	try {
		data = await readFile(abs);
	} catch {
		return NextResponse.json({ error: "File missing" }, { status: 404 });
	}

	return new NextResponse(new Uint8Array(data), {
		status: 200,
		headers: {
			"Content-Type": row.mime_type,
			"Content-Disposition": `inline; filename="${encodeURIComponent(row.file_name)}"`,
			"Content-Length": String(data.length),
			"Cache-Control": "private, no-store",
		},
	});
}
```

This checks that if the user has a branchId, then the attachment's branch_id must match. This is good for branch isolation.

However, note that the upload route does not check the entityType against the user's permissions. It only checks that the entityType is in `ALLOWED_ENTITY` (which is `["payment", "employee_expense"]`). But it does not check if the user is allowed to upload for that entityType.

We see that in the download route, there is no check for the entityType. So if a user uploads a file for an entityType they are not allowed to, they can still download it if they know the ID? But note that the upload route does not link the attachment to any parent record (entity_id is null). So the attachment is orphaned until the parent record is saved and updates the attachment's entity_id.

But the download route does not check the entityType at all. It only checks the branch_id.

So if a user can guess an attachment ID that belongs to another branch, they would be blocked by the branch check. But if they can guess an attachment ID in the same branch, they can download it regardless of the entityType.

However, the entityType is not a security boundary in this context? The attachment is just a file. The entityType is used to categorize the file. But the download route does not use it for authorization.

This might be acceptable if the attachment is only ever accessed via the parent record (which would have its own authorization checks). But note that the download route is exposed at `/api/finance/attachments/[id]`. So if someone can guess or brute-force an attachment ID, they can download the file.

The attachment ID is a serial integer, so it is predictable. This is an IDOR.

Moreover, the upload route does not check the user's permissions for the entityType. So a user without permission to create an employee expense could still upload a file for employee_expense, and then if they can guess the ID, they can download it.

But note: the upload route requires authentication. So only logged-in users can upload. But they might not have permission to create an employee expense, yet they can upload a file for that entityType.

This is a potential issue: the upload route does not check if the user is allowed to upload for the given entityType.

We see that in the download route, there is no check for the entityType. So if the attachment is orphaned (entity_id null) or linked to a record the user cannot access, they can still download the file if they know the ID and it's in their branch.

However, the attachment is meant to be linked to a parent record (like an expense or payment). The parent record would have its own authorization checks. But the attachment route bypasses that.

This is a classic IDOR: direct reference to an attachment by ID without checking if the user is allowed to access that attachment.

We should check if the user is allowed to access the parent record. But the attachment route doesn't know the parent record until we look at the attachment's entity_id and entity_type.

We could change the download route to, after fetching the attachment, check if the user is allowed to access the parent record (if entity_id is not null). But if entity_id is null (which happens during upload before linking), then we might want to restrict access to the uploader only? Or we could require that the attachment is only accessible after being linked.

Alternatively, we could check that the user is the uploader (uploaded_by) or has permission to the entityType.

But note: the upload route sets `uploaded_by: user.userId`. So we could check in the download route that either:
- The user is the uploader, OR
- The user has permission to access the parent record (if entity_id is set).

However, the parent record might be in a different module (finance, hr, etc.) and we don't want to duplicate authorization logic.

Given the complexity, a simpler fix is to check that the user is the uploader for orphaned attachments, and for linked attachments, check the parent record's authorization.

But note: the attachment route is under `/api/finance/attachments`, so it's only for finance attachments. The entityType is limited to "payment" and "employee_expense". So we could check the finance module permissions.

We see in the code that there is a `PermissionGate` component used in the reimbursements page, for example.

But in the API route, we don't have that.

Alternatively, we can change the download route to require that the attachment is linked (entity_id not null) and then check the parent record. But that would break the upload flow because immediately after upload, the attachment is not linked.

We could change the upload route to not return the attachment ID until it is linked? But that complicates the frontend.

Another approach: in the download route, if the attachment is not linked (entity_id null), then only the uploader can access it. If it is linked, then we check the parent record.

Let's see if we can implement that.

But note: the issue is that the attachment ID is guessable. We should use a UUID for the attachment ID? But the attachment table uses a serial integer for id. We see in the schema:

```typescript
export const attachments = pgTable("attachments", {
	id: serial("id").primaryKey(),
	// ... 
});
```

So it's an auto-incrementing integer. This is predictable.

We should change the attachment ID to be a UUID to prevent guessing. But that is a larger change.

Alternatively, we can add a random token to the attachment and require that token in the download URL? But that would change the API.

Given the time, we note two issues:

1. The attachment ID is a sequential integer, making it easy to guess (IDOR).
2. The download route does not check if the user is allowed to access the attachment (beyond branch isolation).

We'll report the IDOR as a critical issue because it allows unauthorized file access.

Let's look for other issues.

Now, let's look at the file upload route for finance: `apps\web\src\app\api\finance\upload\route.ts`

We see that it validates the file type against an allowlist:

```typescript
const ALLOWED: Record<string, string> = {
	"application/pdf": ".pdf",
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
};
```

And it checks the size: max 10 MB.

It also generates a random stored name and stores the original name for display.

It also partitions by branch and entityType.

This seems secure against unsafe file uploads.

Now, let's look for injection.

We see in `apps\web\src\app\api\sync\route.ts`:

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

This uses Drizzle ORM with parameterized queries, so no SQL injection.

Now, let's look for CSRF.

We see that the API routes are Next.js API routes. They are accessed via fetch/XHR. Next.js API routes are not automatically protected against CSRF. However, if they are using cookies for authentication, then they are vulnerable to CSRF.

We see that the authentication uses cookies (Better Auth with nextCookies plugin). So the session is stored in a cookie.

Therefore, any state-changing operation (POST, PUT, DELETE, etc.) in the API routes is vulnerable to CSRF if it relies solely on the cookie for authentication and does not use a CSRF token.

We must check if the API routes use CSRF protection.

Looking at the code, we don't see any CSRF protection in the API routes.

For example, in `apps\web\src\app\api\seed-admin\route.ts`:

```typescript
export async function POST() {
	// ... creates an admin account ...
}
```

This is a POST route that creates an admin account. It is accessible at `/api/seed-admin`. If a user is logged in and visits a malicious site, that site could make a POST request to this endpoint and create an admin account.

Similarly, other POST routes like `/api/finance/upload` are vulnerable.

This is a critical issue.

We must note that the Better Auth library might have CSRF protection for its own endpoints (like sign in, sign up), but for our custom API routes, we do not.

We see in `packages\auth\src\index.ts` that Better Auth is configured with:

```typescript
	// ── Plugins ──────────────────────────────────────────────────────────────
	plugins: [
		twoFactor({
			issuer: "Evaluna ERP",
			otpOptions: {
				period: 30,
				digits: 6,
			},
		}),
		nextCookies(), // ← MUST be last so Set-Cookie headers are forwarded correctly
	],
```

The `nextCookies()` plugin is for Next.js and handles the cookies. But it does not provide CSRF protection for our custom routes.

We must add CSRF protection to our state-changing API routes.

However, note that the tRPC API (which is used by the frontend) is also vulnerable. The tRPC API is served via `/api/trpc` (we assume, from the context).

We see in `apps\web\src\app\api\auth\[...all]\route.ts`:

```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { POST, GET } = toNextJsHandler(auth);
```

This is the Better Auth endpoint, which likely has CSRF protection for its own routes (like sign in) because it's a third-party library.

But our custom routes under `/api/` (like `/api/seed-admin`, `/api/finance/upload`, etc.) and the tRPC router (if exposed) are not protected.

We see that the tRPC server is set up in `apps\web\src\lib\trpc\server.ts` and then used in `apps\web\src\app\api\trpc\[...all]\route.ts` (not provided in the snippets, but we can infer).

But we don't have the tRPC route handler in the provided code. However, we do see in `apps\web\src\lib\trpc\server.ts`:

```typescript
export const createContext = createTRPCContext;
```

And then in the tRPC router initialization, we have procedures that are protected.

But the tRPC endpoint itself (the HTTP handler) is not shown.

Nevertheless, any state-changing tRPC procedure (mutation) that is accessible via HTTP is vulnerable to CSRF if it relies on cookies and lacks CSRF protection.

We must fix CSRF for all state-changing endpoints.

Now, let's look for other issues.

We see in `apps\web\src\app\admin\finance\reimbursements\page.tsx`:

```typescript
	{/* PLACEHOLDER_ACTIONS */}
											<PermissionGate
												domain="finance"
												action="approve"
												fallback={null}
											>
												{(e.status === "submitted" ||
													e.status === "under_review") && (
													<span className="flex justify-end gap-1">
														<Button
															size="sm"
															variant="ghost"
															disabled={busy}
															onClick={() =>
																review.mutate({
																	id: e.id,
																	decision: "approve",
																})
															}
														>
															Approve
														</Button>
														<Button
															size="sm"
															variant="ghost"
															disabled={busy}
															onClick={() =>
																review.mutate({
																	id: e.id,
																	decision: "reject",
																})
															}
														>
															Reject
														</Button>
													</span>
												)}
												{e.status === "approved" && (
													<Button
														size="sm"
														disabled={busy}
														onClick={() => pay.mutate({ id: e.id })}
													>
														Pay
													</Button>
												)}
											</PermissionGate>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
```

This uses a `PermissionGate` component to conditionally render the Approve and Reject buttons. However, note that the `PermissionGate` is only for UI hiding. The actual authorization is done in the tRPC procedure `review.mutate` and `pay.mutate`.

We should check if those tRPC procedures have proper authorization.

We don't see the tRPC procedures for `employeeExpenses.review` and `employeeExpenses.pay` in the provided code. But we can assume they are defined somewhere.

However, the UI hiding is not sufficient for security; we must have server-side authorization.

But note: the `review.mutate` and `pay.mutate` are tRPC mutations. They should be protected by the tRPC middleware.

We see in `apps\web\src\lib\trpc\routers\__tests__\payment-methods.test.ts` that there is a test for payment methods, but not for expenses.

We don't have the code for the employeeExpenses router.

But we can look for it in the provided code? We don't see it.

Given the time, we'll focus on the issues we can see.

Now, let's look for IDOR in other places.

We see in `apps\web\src\app\admin\purchases\[id]\return\page.tsx` and `apps\web\src\app\manager\purchases\[id]\return\page.tsx` (they are identical) that they use:

```typescript
	const { data: purchase, isLoading } = trpc.purchases.get.useQuery({
		id: purchaseId,
	});
```

This fetches a purchase by ID. We must check if the `trpc.purchases.get` procedure checks that the user is allowed to access that purchase.

We don't see the procedure, but we can assume it is protected. However, we must check if it does branch isolation or user isolation.

We see in the purchase return creation in `apps\web\src\lib\trpc\routers\purchase-returns.ts`:

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

This procedure uses `protectedProcedure`, so it checks login and active status. But it does not check if the user is allowed to access the purchase (by branch or by user).

The purchase is fetched by `input.purchase_id`. We then use `purchase.supplier_id` to set the supplier_id in the purchase return.

But we do not check if the purchase belongs to the user's branch or if the user has permission to access that purchase.

This is a potential IDOR: a user could create a purchase return for any purchase by guessing the ID, even if it belongs to another branch or another user.

We should check that the purchase belongs to the user's branch (if branch isolation is enabled) or that the user has permission to access the purchase.

Similarly, in the `get` procedure for purchase returns:

```typescript
	get: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ input }) => {
			return await db.query.purchaseReturns.findFirst({
				where: eq(purchaseReturns.id, input.id),
				with: {
					returnItems: {
						with: { product: true },
					},
					purchase: true,
					supplier: true,
				},
			});
		}),
```

This fetches a purchase return by ID without checking if the user is allowed to see it.

We should add a check that the purchase return's purchase belongs to the user's branch or that the user has permission.

We see that in the purchase return, we have a `user_uid` field set to `ctx.user.id` on creation. So we could check that the purchase return's `user_uid` matches the current user's ID? But note: a manager might be allowed to see purchase returns from their branch, even if they didn't create it.

So we should check by branch.

We see that the purchase return does not store a branch_id. But we can get the branch from the purchase (via the purchase's branch_id) or from the user_uid? Not directly.

We see that the purchase table has a `user_uid` and also a `branch_id`? Let's check the schema.

We don't have the full schema, but we see in `packages\db\src\schema.js`:

```typescript
export const orders = pgTable("orders", {
	id: serial("id").primaryKey(),
	customer_id: integer("customer_id").references(() => customers.id),
	total_amount: integer("total_amount").notNull(),
	user_uid: varchar("user_uid", { length: 255 }).notNull(),
	status: varchar("status", { length: 20 }),
	created_at: timestamp("created_at").defaultNow(),
});
```

But we don't see a branch_id in orders. However, we see in the customer table:

```typescript
export const customers = pgTable("customers", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	phone: varchar("phone", { length: 20 }),
	user_uid: varchar("user_uid", { length: 255 }).notNull(),
	status: varchar("status", { length: 20 }),
	gstin: varchar("gstin", { length: 15 }),
	pan: varchar("pan", { length: 10 }),
	credit_balance: integer("credit_balance").default(0),
	khata: boolean("khata").default(false),
	created_at: timestamp("created_at").defaultNow(),
});
```

And in the staff table? We don't see it in the provided schema.js.

But we see in `apps\web\src\lib\trpc\routers\staff.ts`:

```typescript
	list: protectedProcedure
		.input(z.object({ branch_id: z.number().optional() }).optional())
		.query(async ({ ctx, input }) => {
			const branchId = input?.branch_id ?? ctx.user.branchId;
			if (branchId) {
				return ctx.db.select().from(staff).where(eq(staff.branch_id, branchId));
			}
			return ctx.db.select().from(staff);
		}),
```

So the staff table has a branch_id.

And in the user table (from better-auth) we have a branch_id? We see in `packages\auth\src\index.ts`:

```typescript
		user: {
			additionalFields: {
				role: { type: "string", defaultValue: "sales_person" },
				branch_id: { type: "number", required: false },
				is_active: { type: "boolean", defaultValue: true },
				is_superadmin: { type: "boolean", defaultValue: false },
			},
		},
```

So the user table (extended) has a branch_id.

Therefore, to check if a purchase is in the user's branch, we would need to join the purchase to the customer to get the customer's user_uid, and then get the user's branch_id? Or we could store the branch_id directly in the purchase.

We don't see a branch_id in the purchase table in the provided schema.js.

But we see in the orderItems table? No.

This is a problem: without a branch_id on the purchase, we cannot do branch isolation for purchases.

We see in the `apps\web\src\app\admin\purchases\list\columns.tsx` that they display the supplier name, but not the branch.

We must check the actual schema. But we don't have it.

Given the time, we'll note that the purchase return creation and retrieval do not check the user's branch or permissions, which could lead to IDOR.

But we cannot confirm without the schema.

However, we see in the `apps\web\src\app\admin\purchases\list\columns.tsx` that they have:

```typescript
	{
		id: "supplier",
		header: "Supplier",
		accessorFn: (row: any) => row.supplier?.name || "Unknown",
	},
```

This suggests that the purchase has a supplier relation.

And the supplier table might have a branch_id? We don't see it in the provided schema.js for suppliers:

```typescript
export const suppliers = pgTable("suppliers", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).unique(),
	phone: varchar("phone", { length: 20 }),
	address: text("address"),
	gstin: varchar("gstin", { length: 15 }),
	pan: varchar("pan", { length: 10 }),
	created_at: timestamp("created_at").defaultNow(),
});
```

No branch_id.

So it seems that the system does not store branch_id on purchases, orders, suppliers, etc. This means that branch isolation is not implemented for these entities.

But we see in the staff table and the user table (extended) we have branch_id.

And we see in the `apps\web\src\app\admin\delivery\page.tsx` (the delivery management page) that they do:

```typescript
	const serverClient = await getServerClient();
	const deliveries = await serverClient.delivery.list().catch(() => []);
```

And then they filter by status, but not by branch.

We see in the delivery tracking page:

```typescript
	const { data: trips, isLoading } = trpc.delivery.activeTrips.useQuery(
		undefined,
		{
			refetchInterval: 10000, // Refetch every 10 seconds for live updates
		},
	);
```

No branch filter.

But we see in the `apps\web\src\app\manager\delivery\page.tsx`:

```typescript
export default async function ManagerDeliveryPage() {
	const trpc = await getServerClient();
	const session = await (trpc as any).auth.getSession();

	if (
		!session ||
		(session.user.role !== "admin" &&
			session.user.role !== "manager" &&
			session.user.role !== "delivery_manager")
	) {
		redirect("/");
	}

	const branchId = session.user.branchId;

	// Fetch initial data
	const routes = await (trpc as any).delivery.listRoutes({ branchId });
	const vehicles = await (trpc as any).vehicles.list({ branchId });
	const drivers = await (trpc as any).delivery.listDrivers({ branchId });
	const trips = await (trpc as any).delivery.listAllTrips({ branchId });
	const branches = await (trpc as any).branches.list();
```

Here, they are passing `branchId` to the tRPC procedures. So the tRPC procedures for delivery, vehicles, etc., are expected to use the branchId for filtering.

We see in `apps\web\src\lib\trpc\routers\vehicles.ts`:

```typescript
export const vehiclesRouter = router({
	list: roleProcedure(["admin", "manager", "delivery_manager"])
		.input(z.object({ branchId: z.number().optional() }))
		.query(async ({ input, ctx }) => {
			const branch = input.branchId || ctx.user?.branchId;
			if (!branch) throw new TRPCError({ code: "BAD_REQUEST" });
			return await db.query.vehicles.findMany({
				where: eq(vehicles.branch_id, branch),
			});
		}),

	// ... 
});
```

So they do use the branchId (either from input or from ctx.user.branchId) to filter vehicles by branch_id.

Similarly, for deliveries, we would expect the same.

But we don't see the delivery router in the provided code.

However, we see in `apps\web\src\app\admin\delivery\tracking\page.tsx` that they use `trpc.delivery.activeTrips.useQuery` without any arguments. This suggests that the procedure does not take a branchId and instead uses the ctx.user.branchId.

We don't see the procedure, but we can hope it is implemented correctly.

Now, back to the purchase return issue: we don't see a branch_id on purchases, so we cannot filter by branch. This means that purchase returns are not isolated by branch. A user in one branch could see purchase returns from another branch.

This is a branch isolation issue.

We must check if the purchase table has a branch_id. We don't see it in the provided schema.js