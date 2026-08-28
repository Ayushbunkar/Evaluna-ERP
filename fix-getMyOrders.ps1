$path = 'D:\Evaluna ERP\apps\web\src\lib\trpc\routers\customer.ts'
$lines = [System.IO.File]::ReadAllLines($path)
# Define the new lines for getMyOrders property (one tab indentation for property line)
$newLines = @(
    "`tgetMyOrders: customerProcedure.query(async ({ ctx }) => {",
    "`t`tconst rows = await ctx.db.query.orders.findMany({",
    "`t`t`twhere: eq(orders.customer_id, ctx.customer.id),",
    "`t`t`torderBy: [desc(orders.created_at)],",
    "`t`t`twith: { orderItems: { columns: { id: true } }}",
    "`t`t});",
    "`t`treturn rows.map((o) => {",
    "`t`t`torderRef: `ORD-${o.id}`,",
    "`t`t`tdate: o.created_at ? o.created_at.toISOString() : null,",
    "`t`t`tstatus: o.status,",
    "`t`t`titemsCount: o.orderItems.length,",
    "`t`t`ttotal: isConfirmed ? Number(o.total_amount) : null,",
    "`t`t})",
    "`t`),"
)
# Replace lines 115-129 (1-indexed) with new lines
# zero-based indices: start = 114, end = 128 inclusive
$lines = $lines[0..113] + $newLines + $lines[129..($lines.Length-1)]
[System.IO.File]::WriteAllLines($path, $lines)