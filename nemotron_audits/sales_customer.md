I need to analyze the provided code as a SALES/CUSTOMER auditor, focusing only on:
- customers
- orders
- sales
- quotations
- order status
- customer portal
- salesperson access
- prices
- discounts
- returns
- order totals
- customer data exposure
- business workflow correctness

Let me go through the code and identify any issues related to these areas.

First, I'll look for any potential issues in the sales/customer related code:

1. Looking at `apps\web\src\app\(dashboards)\sales\layout.tsx` - This defines the sales dashboard navigation. I don't see any immediate issues.

2. Looking at `apps\web\src\app\(dashboards)\sales\returns\page.tsx` - This redirects to `/sales/returns/list`. This seems fine.

3. Looking at `apps\web\src\app\(dashboards)\sales\returns\[id]\edit\page.tsx` - This is for editing purchase returns. It uses `useTRPC().purchaseReturns.get.useQuery({ id: Number(params.id) })`. This seems fine.

4. Looking at `apps\web\src\app\customer\layout.tsx` - This is the customer portal layout. It has a server-side gate that checks if the user role is "customer". If not, it redirects staff to their own dashboard. This looks correct for customer portal protection.

5. Looking at `apps\web\src\app\customer\profile\page.tsx` - This shows the customer profile. It uses `trpc.customer.getMyProfile.useQuery()`. This seems fine.

6. Looking at `apps\web\src\app\customer\orders\page.tsx` - This shows customer orders. It uses `trpc.customer.getMyOrders.useQuery()`. This seems fine.

7. Looking at `apps\web\src\app\admin\customer\page.tsx` - This is the admin customer dashboard. It uses `useTRPC().customer.getPortalStats.useQuery()`. This seems fine.

8. Looking at `apps\web\src\app\admin\customer\orders\page.tsx` - This shows order history for admin customer view. It uses a DataTable with empty data. This seems like a placeholder but not necessarily an issue.

9. Looking at `apps\web\src\app\admin\customer\returns\page.tsx` - Similar to above, placeholder for returns.

10. Looking at `apps\web\src\app\admin\customer\wallet\page.tsx` - Placeholder for wallet.

11. Looking at `apps\web\src\app\admin\customer\wishlist\page.tsx` - Placeholder for wishlist.

12. Looking at `apps\web\src\app\admin\customer\support\page.tsx` - Placeholder for support.

13. Looking at `apps\web\src\app\admin\customer\profile\page.tsx` - Placeholder for profile.

14. Looking at `apps\web\src\app\admin\customer\loyalty\page.tsx` - Placeholder for loyalty.

15. Looking at `apps\web\src\app\admin\customer\addresses\page.tsx` - Placeholder for addresses.

16. Looking at `apps\web\src\app\admin\customer\invoices\page.tsx` - Placeholder for invoices.

17. Looking at `apps\web\src\app\admin\supplier\page.tsx` - This is supplier dashboard, not directly sales/customer but related.

18. Looking at `apps\web\src\app\admin\supplier\invoices\page.tsx` - Placeholder for supplier invoices.

19. Looking at `apps\web\src\app\admin\supplier\products\page.tsx` - Placeholder for supplier products.

20. Looking at `apps\web\src\app\admin\supplier\purchase-orders\page.tsx` - Placeholder for supplier purchase orders.

21. Looking at `apps\web\src\app\admin\supplier\returns\page.tsx` - Placeholder for supplier returns.

22. Looking at `apps\web\src\app\admin\supplier\support\page.tsx` - Placeholder for supplier support.

23. Looking at `apps\web\src\app\admin\supplier\grn\page.tsx` - Placeholder for GRN.

24. Looking at `apps\web\src\app\admin\delivery\tracking\page.tsx` - This shows delivery tracking. It uses `trpc.delivery.activeTrips.useQuery()`. This seems fine.

25. Looking at `apps\web\src\app\driver\history\page.tsx` - This shows driver history. It has hardcoded data. This seems like a placeholder but not necessarily an issue for sales/customer audit.

26. Looking at `apps\web\src\app\driver\cash\page.tsx` - This shows cash collection. It has hardcoded data. Again, placeholder.

27. Looking at `apps\web\src\app\driver\scan\page.tsx` - This shows QR scan. It has simulated camera feed. Placeholder.

28. Looking at `apps\web\src\app\driver\route\page.tsx` - This shows route. It has hardcoded route stops. Placeholder.

29. Looking at `apps\web\src\app\customer\orders\page.tsx` - I already looked at this.

30. Looking at `apps\web\src\app\customer\profile\page.tsx` - I already looked at this.

31. Looking at `apps\web\src\app\customer\page.tsx` - This is the main customer dashboard. It shows stats and recent orders. It uses `trpc.customer.getPortalStats.useQuery()` and `trpc.customer.getMyOrders.useQuery()`. This seems fine.

32. Looking at `apps\web\src\app\(dashboards)\sales\orders\review\page.tsx` - This shows customer orders pending review. It uses `trpc.orders.listPendingReview.useQuery()`. This seems fine.

33. Looking at `apps\web\src\app\(dashboards)\sales\hold-bills\page.tsx` - This shows hold bills. It uses `trpc.orders.list.useQuery()` and has a delete mutation. It also has a RoleGate for delete action requiring manager role. This seems fine.

34. Looking at `apps\web\src\app\(dashboards)\biller\returns\page.tsx` - This shows returns review. It uses `trpc.salesReturns.list.useQuery()` and has a process mutation. This seems fine.

35. Looking at `apps\web\src\app\driver\returns\page.tsx` - This shows partial return for driver. It uses `trpc.delivery.getStopDetails.useQuery()` and `trpc.delivery.processPartialReturn.useMutation()`. This seems fine.

36. Looking at `apps\web\src\app\picker\returns\page.tsx` - This shows shelf returns for picker. It uses `trpc.picker.getReturns.useQuery()`. This seems fine.

37. Looking at `apps\web\src\app\putter\returns\page.tsx` - This shows sale returns for putter. It uses `trpc.putter.getSaleReturns.useQuery()`. This seems fine.

38. Looking at `apps\web\src\app\admin\supplier\returns\page.tsx` - Placeholder for supplier returns.

39. Looking at `apps\web\src\app\admin\customer\returns\page.tsx` - Placeholder for customer returns.

40. Looking at `apps\web\src\app\admin\customer\wallet\page.tsx` - Placeholder for wallet.

41. Looking at `apps\web\src\app\admin\customer\wishlist\page.tsx` - Placeholder for wishlist.

42. Looking at `apps\web\src\app\admin\customer\support\page.tsx` - Placeholder for support.

43. Looking at `apps\web\src\app\admin\customer\profile\page.tsx` - Placeholder for profile.

44. Looking at `apps\web\src\app\admin\customer\loyalty\page.tsx` - Placeholder for loyalty.

45. Looking at `apps\web\src\app\admin\customer\addresses\page.tsx` - Placeholder for addresses.

46. Looking at `apps\web\src\app\admin\customer\invoices\page.tsx` - Placeholder for invoices.

47. Looking at `apps\web\src\app\admin\supplier\grn\page.tsx` - Placeholder for GRN.

48. Looking at `apps\web\src\app\admin\delivery\tracking\page.tsx` - I already looked at this.

49. Looking at `apps\web\src\app\admin\layout.tsx` - This defines the admin layout. It has a lot of nav items including sales, customers, etc. This seems fine.

50. Looking at `apps\web\src\app\putter\layout.tsx` - This defines putter layout. It has nav items including returns. This seems fine.

51. Looking at `apps\web\src\app\picker\layout.tsx` - This defines picker layout. It has nav items including returns. This seems fine.

52. Looking at `apps\web\src\app\biller\layout.tsx` - This defines biller layout. It has nav items including returns. This seems fine.

53. Looking at `apps\web\src\app\driver\layout.tsx` - This defines driver layout. It has nav items including history, scan, otp, cash. This seems fine.

54. Looking at `apps\web\src\app\hr\layout.tsx` - This defines HR layout. Not directly sales/customer.

55. Looking at `apps\web\src\app\manager\layout.tsx` - This defines manager layout. It has nav items including orders, customers, etc. This seems fine.

56. Looking at `apps\web\src\app\auditor\layout.tsx` - This defines auditor layout. Not directly sales/customer.

57. Looking at `apps\web\src\app\(dashboards)\sales\layout.tsx` - I already looked at this.

58. Looking at `apps\web\src\app\(dashboards)\biller\layout.tsx` - I already looked at this.

59. Looking at `apps\web\src\app\(dashboards)\auditor\layout.tsx` - This defines auditor layout. Not directly sales/customer.

60. Looking at `apps\web\src\app\(dashboards)\picker\layout.tsx` - I already looked at this.

61. Looking at `apps\web\src\app\(dashboards)\putter\layout.tsx` - I already looked at this.

Now, let me look for any specific issues related to sales/customer:

I notice in `apps\web\src\app\customer\orders\page.tsx`, there's this code:

```typescript
const STATUS_LABELS: Record<string, string> = {
	pending_review: "Awaiting review",
	under_review: "Being reviewed",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};

const FILTERS = [
	{ key: "all", label: "All" },
	{ key: "pending", label: "Pending" },
	{ key: "confirmed", label: "Confirmed" },
] as const;

const PENDING = ["pending_review", "under_review"];
const CONFIRMED = ["confirmed", "completed"];
```

And then in the filtering:

```typescript
const filtered = useMemo(() => {
	const rows = orders ?? [];
	if (filter === "pending")
		return rows.filter((o) => PENDING.includes(o.status ?? ""));
	if (filter === "confirmed")
		return rows.filter((o) => CONFIRMED.includes(o.status ?? ""));
	return rows;
}, [orders, filter]);
```

This looks correct.

In `apps\web\src\app\customer\page.tsx`, I see:

```typescript
const STATUS_LABELS: Record<string, string> = {
	pending_review: "Awaiting review",
	under_review: "Being reviewed",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};
```

And then:

```typescript
{recent.map((o) => (
	<Link
		key={o.id}
		href={`/customer/orders/${o.id}`}
		className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/40"
	>
		<div>
			<p className="font-medium text-sm">{o.orderRef}</p>
			<p className="text-muted-foreground text-xs">
				{o.date ? new Date(o.date).toLocaleDateString() : "—"} ·{" "}
				{o.itemsCount} item(s)
			</p>
		</div>
		<div className="text-right">
			<span className="rounded-full bg-muted px-2 py-0.5 text-xs">
				{STATUS_LABELS[o.status ?? ""] ?? o.status}
			</span>
			{o.total != null && (
				<p className="mt-1 font-semibold text-sm">
					₹{o.total.toLocaleString("en-IN")}
				</p>
			)}
		</div>
	</Link>
))}
```

This also looks correct.

Let me check for any potential customer data exposure issues:

In `apps\web\src\app\admin\customer\orders\page.tsx`, I see:

```typescript
export default function OrderHistoryPage() {
	const [searchTerm, setSearchTerm] = useState("");

	const columns: Column<any>[] = [
		{ key: "id", header: "ID", sortable: true },
		{ key: "date", header: "Date" },
		{ key: "status", header: "Status" },
	];

	return (
		<PageTransition className="flex flex-col gap-6">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Order History</h1>
				<p className="text-muted-foreground text-sm">
					Manage and view details for order history.
				</p>
			</div>

			<Card className="border-border/50 bg-card/50 shadow-sm">
				<CardHeader className="p-4">
					<SearchFilter
						search={searchTerm}
						onSearchChange={setSearchTerm}
						searchPlaceholder="Search records..."
					/>
				</CardHeader>
				<CardContent className="p-0">
					<DataTable
						data={[]}
						columns={columns}
						emptyMessage="No records found in this module yet."
					/>
				</CardContent>
			</Card>
		</PageTransition>
	);
}
```

This is just a placeholder with empty data, so no customer data exposure here.

Similarly, other admin customer pages are placeholders.

Let me check the TRPC routers for any potential issues:

I don't see the actual TRPC router implementations in the provided code, but I do see some references:

- `apps\web\src\lib\trpc\routers\customer.ts` is not provided in the code snippets, but it's referenced in several places.

Since I don't have the actual TRPC router code for customers, I can't audit it directly. But based on the usage, it seems to be working correctly.

Let me check for any issues with order totals or pricing:

In `apps\web\src\components\printing\ThermalReceipt.tsx`, I see:

```typescript
<div className="space-y-1 border-black border-t border-dashed pt-2">
	<div className="flex justify-between">
		<span>Subtotal</span>
		<span>
			{order?.subtotal ? Number(order.subtotal).toFixed(2) : "0.00"}
		</span>
	</div>
	<div className="flex justify-between">
		<span>Tax</span>
		<span>{order?.tax ? Number(order.tax).toFixed(2) : "0.00"}</span>
	</div>
	<div className="mt-2 flex justify-between border-black border-t pt-2 font-bold text-base">
		<span>Total</span>
		<span>{order?.total ? Number(order.total).toFixed(2) : "0.00"}</span>
	</div>
</div>
```

This looks correct for displaying order totals.

In `apps\web\src\components\pos\receipt-print.tsx`, I see:

```typescript
<div className="mb-4 flex justify-between font-bold text-lg">
	<span>TOTAL</span>
	<span>₹{Number.parseFloat(order.total_amount).toFixed(2)}</span>
</div>
```

This also looks correct.

Let me check for any issues with discounts:

I don't see any specific discount-related code in the provided snippets that would indicate an issue.

Let me check for any issues with returns:

In `apps\web\src\app\(dashboards)\biller\returns\page.tsx`, I see:

```typescript
export default function ReturnsReviewPage() {
	const utils = trpc.useUtils();
	const [processingId, setProcessingId] = useState<number | null>(null);

	const { data: returns, isLoading } = trpc.salesReturns.list.useQuery(
		undefined,
		{
			staleTime: 10_000,
		},
	);

	const processMutation = trpc.salesReturns.process.useMutation({
		onSuccess: () => {
			toast.success("Return processed and order adjusted successfully");
			utils.salesReturns.list.invalidate();
			setProcessingId(null);
		},
		onError: (error) => {
			toast.error(`Failed to process return: ${error.message}`);
			setProcessingId(null);
		},
	});

	if (isLoading) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const pendingReturns =
		returns?.filter((r: any) => r.status === "pending") || [];

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					Returns & Adjustments
				</h1>
				<p className="text-muted-foreground">
					Review and approve partial returns from drivers to adjust the final
					bill.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Pending Returns ({pendingReturns.length})</CardTitle>
					<CardDescription>
						Returns waiting for biller approval to generate refunds and restock
						inventory.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{pendingReturns.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
							<CheckCircle2 className="mb-4 h-12 w-12 text-green-500 opacity-20" />
							<p>No pending returns to review.</p>
							<p className="text-sm">All caught up!</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Return ID</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Customer</TableHead>
									<TableHead>Original Order</TableHead>
									<TableHead>Refund Amount</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingReturns.map((ret: any) => (
									<TableRow key={ret.id}>
										<TableCell className="font-medium">RET-{ret.id}</TableCell>
										<TableCell>
											{format(new Date(ret.created_at), "MMM d, yyyy HH:mm")}
										</TableCell>
										<TableCell>
											{ret.customer?.name || "Unknown Customer"}
										</TableCell>
										<TableCell>INV-{ret.order_id}</TableCell>
										<TableCell className="font-semibold text-red-500">
											-₹{Number(ret.total_amount).toFixed(2)}
										</TableCell>
										<TableCell className="text-right">
											<Button
												size="sm"
												disabled={processingId === ret.id}
												onClick={() => {
													setProcessingId(ret.id);
													processMutation.mutate({ id: ret.id });
												}}
											>
												{processingId === ret.id ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<CheckCircle2 className="mr-2 h-4 w-4" />
												)}
												Approve & Adjust Bill
											</Button>
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
}
```

This looks correct for processing returns.

Let me check for any issues with customer portal access:

In `apps\web\src\app\customer\layout.tsx`, I see:

```typescript
/**
 * Server-side gate for the customer self-service portal.
 * Only users whose login carries role="customer" may enter. Staff are bounced
 * back to their own dashboard. This is defence-in-depth on top of the API-level
 * `customerProcedure` (which is the real authority — see routers/customer.ts).
 */
export default async function CustomerLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const user = await getAuthUser();

	if (!user) {
		redirect("/login");
	}

	if (user.role !== "customer") {
		// Send staff to their own area; the customer portal is not for them.
		// Superadmin is a separate flag (not a role value), so branch on it first.
		if (user.isSuperadmin) {
			redirect("/admin");
		}
		redirect(user.role === "sales_person" ? "/sales" : `/${user.role}`);
	}

	return (
		<CustomerShell name={user.name} email={user.email}>
			{children}
		</CustomerShell>
	);
}
```

This looks correct for protecting the customer portal.

Let me check for any issues with salesperson access:

In `apps\web\src\app\(dashboards)\sales\hold-bills\page.tsx`, I see:

```typescript
<TableActionButton
	icon={<TrashIcon className="h-4 w-4 text-red-500" />}
	label="Delete Bill"
	onClick={() => handleDelete(row.id)}
/>
```

This is wrapped in a `RoleGate`:

```typescript
<RoleGate minRole="manager">
	<TableActionButton
		icon={<TrashIcon className="h-4 w-4 text-red-500" />}
		label="Delete Bill"
		onClick={() => handleDelete(row.id)}
	/>
</RoleGate>
```

This means only managers can delete hold bills, which seems appropriate.

Let me check for any issues with quotations:

I don't see any specific quotation-related code in the provided snippets.

Let me check for any issues with order status:

In various places, I see order status being used correctly, like in the customer orders page.

Now, let me look for any potential CRITICAL or HIGH issues:

I don't see any obvious critical issues like exposed customer data, broken workflows, or security vulnerabilities in the provided code snippets.

However, I notice that many of the admin customer pages are just placeholders with empty data tables:

- `apps\web\src\app\admin\customer\orders\page.tsx`
- `apps\web\src\app\admin\customer\returns\page.tsx`
- `apps\web\src\app\admin\customer\wallet\page.tsx`
- `apps\web\src\app\admin\customer\wishlist\page.tsx`
- `apps\web\src\app\admin\customer\support\page.tsx`
- `apps\web\src\app\admin\customer\profile\page.tsx`
- `apps\web\src\app\admin\customer\loyalty\page.tsx`
- `apps\web\src\app\admin\customer\addresses\page.tsx`
- `apps\web\src\app\admin\customer\invoices\page.tsx`
- `apps\web\src\app\admin\supplier\page.tsx` (and related pages)

These are just showing "No records found in this module yet." which suggests these modules aren't fully implemented yet. But as an auditor, I should only report issues supported by the provided code, and placeholders aren't necessarily issues - they just indicate incomplete features.

Let me double-check if there are any actual issues:

In `apps\web\src\app\customer\orders\page.tsx`, I see:

```typescript
{STATUS_LABELS[o.status ?? ""] ?? o.status}
```

This is safe because it uses nullish coalescing.

In `apps\web\src\app\customer\page.tsx`, I see:

```typescript
{STATUS_LABELS[o.status ?? ""] ?? o.status}
```

Same thing.

Let me check if there are any issues with the customer portal redirect logic:

In `apps\web\src\app\customer\layout.tsx`:

```typescript
if (user.role !== "customer") {
	// Send staff to their own area; the customer portal is not for them.
	// Superadmin is a separate flag (not a role value), so branch on it first.
	if (user.isSuperadmin) {
		redirect("/admin");
	}
	redirect(user.role === "sales_person" ? "/sales" : `/${user.role}`);
}
```

This looks correct. It handles superadmins separately, then redirects sales_person to /sales, and other roles to their respective dashboards.

Let me check if there are any issues with order totals calculation:

I don't see any actual order totals calculation in the provided code - it's all just displaying values that come from the backend. Since I don't have the backend code, I can't audit the calculation logic.

Let me check if there are any issues with discounts application:

Again, I don't see any discount application logic in the provided frontend code.

Let me check if there are any issues with returns processing:

In `apps\web\src\app\driver\returns\page.tsx`, I see:

```typescript
const handleQuantityChange = (
	productId: number,
	qty: number,
	max: number,
) => {
	if (qty < 0 || qty > max) return;
	setReturnedItems((prev) => ({
		...prev,
		[productId]: qty,
	}));
};
```

This prevents negative quantities or quantities exceeding the maximum, which is good.

In the same file:

```typescript
const handleSubmit = () => {
	const items = Object.entries(returnedItems)
		.filter(([_, qty]) => qty > 0)
		.map(([productId, qty]) => ({
			productId: Number(productId),
			quantity: qty,
			reason: "Customer Rejected / Damaged",
		}));

	processReturn.mutate({
		stopId: Number(stopId),
		returnedItems: items,
	});
};
```

This filters out zero quantities, which is correct.

Let me check if there are any issues with the customer data exposure:

I don't see any places where customer data is being exposed inappropriately. The customer portal is properly gated, and admin views seem to be placeholders.

Wait, let me look at `apps\web\src\app\admin\customer\orders\page.tsx` again:

```typescript
<DataTable
	data={[]}
	columns={columns}
	emptyMessage="No records found in this module yet."
/>
```

This is just showing empty data, so no customer data exposure.

Similarly for other admin customer pages.

Let me check if there are any issues with the business workflow correctness:

In `apps\web\src\app\(dashboards)\sales\hold-bills\page.tsx`, I see:

```typescript
const handleResume = (id: number) => {
	toast.info("Resuming hold bill...");
	// Currently POS doesn't support resuming directly via URL yet,
	// but we can route them or open it. For now we will just show a toast or redirect to POS.
	router.push(`/sales/pos?resume=${id}`);
};
```

This shows a toast and redirects to POS with a resume parameter. The comment says "Currently POS doesn't support resuming directly via URL yet", which suggests this might not be fully implemented, but it's not necessarily incorrect - it's just a placeholder for future functionality.

Let me check if there are any issues with the sales returns process:

In `apps\web\src\app\(dashboards)\biller\returns\page.tsx`, the process looks correct:
1. List pending returns
2. For each return, show details
3. Have a button to process the return
4. On success, show toast and invalidate the list
5. On error, show toast

This seems like a correct workflow.

Let me check if there are any issues with the customer order workflow:

In `apps\web\src\app\customer\orders\page.tsx`, customers can view their orders and filter by status. This seems correct.

In `apps\web\src\app\customer\page.tsx`, customers can see their recent orders and stats. This seems correct.

Let me check if there are any issues with the customer profile:

In `apps\web\src\app\customer\profile\page.tsx`, I see:

```typescript
export default function CustomerProfilePage() {
	const trpc = useTRPC();
	const { data: p, isLoading } = trpc.customer.getMyProfile.useQuery();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">My Profile</h1>
				<p className="text-muted-foreground text-sm">
					Contact our team if any of these details need updating.
				</p>
			</div>

			{isLoading || !p ? (
				<p className="text-muted-foreground text-sm">Loading…</p>
			) : (
				<>
					<Card className="border-border/50">
						<CardHeader>
							<CardTitle className="text-base">Account</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-5 sm:grid-cols-2">
							<Field label="Name" value={p.name} />
							<Field label="Customer Code" value={p.customer_code} />
							<Field label="Email" value={p.email} />
							<Field label="Phone" value={p.phone} />
							<Field label="Address" value={p.address} />
							<Field label="Customer Type" value={p.customer_type} />
						</CardContent>
					</Card>

					<Card className="border-border/50">
						<CardHeader>
							<CardTitle className="text-base">Loyalty & Wallet</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-5 sm:grid-cols-3">
							<Field
								label="Loyalty Tier"
								value={
									<span className="capitalize">{p.loyalty_tier ?? "bronze"}</span>
								}
							/>
							<Field label="Loyalty Points" value={p.loyalty_points ?? 0} />
							<Field
								label="Wallet Balance"
								value={`₹${Number(p.store_credit ?? 0).toLocaleString("en-IN")}`}
							/>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
```

This looks correct for displaying customer profile information.

Let me check if there are any issues with the customer dashboard stats:

In `apps\web\src\app\customer\page.tsx`, I see:

```typescript
const cards = [
	{
		title: "Total Orders",
		value: stats?.totalOrders ?? 0,
		icon: ShoppingBagIcon,
	},
	{
		title: "Awaiting Review",
		value: stats?.pendingOrders ?? 0,
		icon: ClockIcon,
	},
	{
		title: "Loyalty Points",
		value: stats?.loyaltyPoints ?? 0,
		icon: AwardIcon,
	},
	{
		title: "Wallet Balance",
		value: `₹${(stats?.walletBalance ?? 0).toLocaleString("en-IN")}`,
		icon: WalletIcon,
	},
];
```

This uses nullish coalescing, which is safe.

Now, let me think if there are any CRITICAL or HIGH issues I missed:

Actually, let me look at `apps\web\src\app\customer\orders\page.tsx` more carefully:

```typescript
{STATUS_LABELS[o.status ?? ""] ?? o.status}
```

If `o.status` is null or undefined, it becomes `""` due to the first nullish coalescing, then `STATUS_LABELS[""]` would be undefined, so it falls back to `o.status` which is null or undefined. This would display nothing or "undefined" in the UI.

Let me check what happens if `o.status` is null:

1. `o.status ?? ""` becomes `""` (since null is falsy)
2. `STATUS_LABELS[""]` is undefined (since "" is not a key in STATUS_LABELS)
3. `undefined ?? o.status` becomes `o.status` which is null
4. So it would display null, which in React would render as nothing

This is not ideal - it would be better to have a fallback like "Unknown" or empty string.

Similarly, if `o.status` is an empty string:
1. `o.status ?? ""` becomes `""` (since empty string is falsy)
2. `STATUS_LABELS[""]` is undefined
3. `undefined ?? o.status` becomes `o.status` which is empty string
4. So it would display empty string

This is also not ideal.

If `o.status` is a valid status like "pending_review":
1. `o.status ?? ""` becomes `"pending_review"`
2. `STATUS_LABELS["pending_review"]` is `"Awaiting review"`
3. `"Awaiting review" ?? o.status` becomes `"Awaiting review"` (since it's not null/undefined)
4. So it displays "Awaiting review" - this is correct

So the issue is when status is null, undefined, or empty string - it doesn't display a friendly fallback.

Let me check if this same pattern exists elsewhere:

In `apps\web\src\app\customer\page.tsx`:
```typescript
{STATUS_LABELS[o.status ?? ""] ?? o.status}
```
Same issue.

In `apps\web\src\app\customer\orders\page.tsx` in the recent orders section:
```typescript
<span className="rounded-full bg-muted px-2 py-0.5 text-xs">
	{STATUS_LABELS[o.status ?? ""] ?? o.status}
</span>
```
Same issue.

This is a consistency issue but not necessarily critical. However, it could lead to confusing UI where sometimes nothing is displayed for status.

Let me see if there are any other issues:

In `apps\web\src\app\customer\orders\page.tsx`, I see:
```typescript
{o.total != null && (
	<p className="mt-1 font-semibold">
		₹{o.total.toLocaleString("en-IN")}
	</p>
)}
```
This is safe because it checks for null before calling toLocaleString.

In `apps\web\src\app\customer\page.tsx`:
```typescript
value: `₹${(stats?.walletBalance ?? 0).toLocaleString("en-IN")}`,
```
This is safe because of the nullish coalescing.

Let me check if there are any issues with financial data display:

In `apps\web\src\components\printing\ThermalReceipt.tsx`:
```typescript
<span>
	{order?.subtotal ? Number(order.subtotal).toFixed(2) : "0.00"}
</span>
```
This is safe.

In `apps\web\src\components\pos\receipt-print.tsx`:
```typescript
<span>₹{Number.parseFloat(order.total_amount).toFixed(2)}</span>
```
This assumes order.total_amount is always a valid number string, which