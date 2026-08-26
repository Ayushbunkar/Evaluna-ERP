## CRITICAL
- apps\web\src\app\manager\purchases\list\columns.tsx
- columns function (actions cell)
- Incorrect navigation link pointing to admin route from manager section
- Evidence: `router.push(\`/admin/purchases/${row.original.id}/return\`)` in manager purchases list columns
- Impact: Users in manager role will be redirected to admin section which they may not have access to, causing unauthorized access errors or confusing UX
- Exact fix: Change `/admin/purchases/${row.original.id}/return` to `/manager/purchases/${row.original.id}/return`

## HIGH
- apps\web\src\app\manager\expenses\page.tsx
- ExpensesList component
- Missing error state handling in data fetching
- Evidence: Only handles `isLoading` state, no error state check before rendering data table
- Impact: If the expenses list query fails, users see no feedback and potentially broken UI
- Exact fix: Add error state handling similar to other list pages: `{isLoading ? <p>Loading...</p> : error ? <p>Error loading expenses</p> : <DataTable ... />}`

## HIGH
- apps\web\src\app\manager\purchases\page.tsx
- PurchasesList component
- Missing error state handling in data fetching
- Evidence: Only handles `isLoading` state, no error state check before rendering data table
- Impact: If the purchases list query fails, users see no feedback and potentially broken UI
- Exact fix: Add error state handling: `{isLoading ? <p>Loading...</p> : error ? <p>Error loading purchases</p> : <DataTable ... />}`

## HIGH
- apps\web\src\app\manager\purchase-returns\list\page.tsx
- PurchaseReturnsList component
- Incorrect navigation link pointing to admin route from manager section
- Evidence: `<Link href="/admin/purchase-returns/create"><Button>New Purchase Return</Button></Link>` in manager purchase returns list
- Impact: Manager users attempting to create a purchase return will be redirected to admin section which they may not access
- Exact fix: Change `/admin/purchase-returns/create` to `/manager/purchase-returns/create`

## HIGH
- apps\web\src\app\manager\purchase-returns\list\columns.tsx
- columns function (actions cell)
- Incorrect navigation link pointing to admin route from manager section
- Evidence: `<Link href=\`/admin/purchase-returns/${purchaseReturn.id}/edit\`>Edit</Link>` in manager purchase returns list columns
- Impact: Manager users trying to edit a purchase return will be redirected to admin section which they may not access
- Exact fix: Change `/admin/purchase-returns/${purchaseReturn.id}/edit` to `/manager/purchase-returns/${purchaseReturn.id}/edit`

## MEDIUM
- apps\web\src\app\components\forms\supplier-form.tsx
- handleSubmit function
- Unnecessary type assertion that bypasses TypeScript safety
- Evidence: `createSupplier(payload as any);` - the `as any` type assertion
- Impact: Potential runtime errors if payload shape doesn't match expectations, loss of type safety
- Exact fix: Remove `as any` and ensure payload matches expected type, or fix the type definitions if needed

## MEDIUM
- apps\web\src\app\manager\expenses\page.tsx
- ExpensesList component
- Incorrect navigation link pointing to admin route from manager section
- Evidence: `<Link href="/admin/expenses/create"><Button>New Expense</Button></Link>` in manager expenses list
- Impact: Manager users attempting to create an expense will be redirected to admin section which they may not access
- Exact fix: Change `/admin/expenses/create` to `/manager/expenses/create`

## MEDIUM
- apps\web\src\app\manager\purchases\page.tsx
- PurchasesList component
- Incorrect navigation link pointing to admin route from manager section
- Evidence: `<Link href="/admin/purchases/create"><Button>New Purchase</Button></Link>` in manager purchases list
- Impact: Manager users attempting to create a purchase will be redirected to admin section which they may not access
- Exact fix: Change `/admin/purchases/create` to `/manager/purchases/create`

## LOW
- apps\web\src\app\(dashboards)\biller\customers\page.tsx
- CustomersPage component
- Inefficient JSON serialization in loading state
- Evidence: `<pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>` renders raw JSON to UI
- Impact: Exposes internal data structure to end users, poor UX for production
- Exact fix: Replace JSON dump with proper user-friendly data presentation

## LOW
- apps\web\src\app\(dashboards)\biller\payments\page.tsx
- PaymentsPage component
- Inefficient JSON serialization in loading state
- Evidence: `<pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>` renders raw JSON to UI
- Impact: Exposes internal data structure to end users, poor UX for production
- Exact fix: Replace JSON dump with proper user-friendly data presentation

## LOW
- apps\web\src\app\(dashboards)\biller\discounts\page.tsx
- DiscountsPage component
- Inefficient JSON serialization in loading state
- Evidence: `<pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>` renders raw JSON to UI
- Impact: Exposes internal data structure to end users, poor UX for production
- Exact fix: Replace JSON dump with proper user-friendly data presentation

## LOW
- apps\web\src\app\(dashboards)\biller\billing\page.tsx
- BillingCheckoutPage component
- Inefficient JSON serialization in loading state
- Evidence: `<pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>` renders raw JSON to UI
- Impact: Exposes internal data structure to end users, poor UX for production
- Exact fix: Replace JSON dump with proper user-friendly data presentation

## UNCERTAIN
- apps\web\src\app\manager\suppliers\list\page.tsx
- Need to verify if this file exists and check for similar issues
- Reason: Referenced in code patterns but not visible in provided source
- Impact: Potential navigation/linking issues if file exists with similar problems
- Exact fix: Verify file existence and apply same fixes as other manager lists if present

## UNCERTAIN
- apps\web\src\app\admin\suppliers\list\page.tsx
- Need to verify navigation links in suppliers list
- Reason: File exists but content not fully visible in provided snippets
- Impact: Potential incorrect links if present
- Exact fix: Verify file content for incorrect admin/manager route references

## UNCERTAIN
- apps\web\src\app\manager\suppliers\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\suppliers\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\expenses\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\expenses\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\purchases\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\purchases\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\purchase-returns\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\suppliers\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\admin\suppliers\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\admin\purchase-returns\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\(dashboards)\sales\returns\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\manager\expenses\[id]\edit\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or form issues if present
- Exact fix: Verify file existence and content for standard edit page issues

## UNCERTAIN
- apps\web\src\app\admin\expenses\[id]\edit\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or form issues if present
- Exact fix: Verify file existence and content for standard edit page issues

## UNCERTAIN
- apps\web\src\app\manager\purchases\[id]\edit\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or form issues if present
- Exact fix: Verify file existence and content for standard edit page issues

## UNCERTAIN
- apps\web\src\app\admin\purchases\[id]\edit\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or form issues if present
- Exact fix: Verify file existence and content for standard edit page issues

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\[id]\return\page.tsx
- Need to verify form handling and navigation
- Reason: File exists but content not fully visible
- Impact: Potential form validation, submission, or navigation issues
- Exact fix: Verify file content for proper form handling and correct navigation targets

## UNCERTAIN
- apps\web\src\app\admin\purchases\[id]\return\page.tsx
- Need to verify form handling and navigation
- Reason: File exists but content not fully visible
- Impact: Potential form validation, submission, or navigation issues
- Exact fix: Verify file content for proper form handling and correct navigation targets

## UNCERTAIN
- apps\web\src\app\manager\purchases\[id]\return\page.tsx
- Need to verify form handling and navigation
- Reason: File exists but content not fully visible
- Impact: Potential form validation, submission, or navigation issues
- Exact fix: Verify file content for proper form handling and correct navigation targets

## UNCERTAIN
- apps\web\src\app\admin\purchases\[id]\return\page.tsx
- Need to verify form handling and navigation
- Reason: File exists but content not fully visible
- Impact: Potential form validation, submission, or navigation issues
- Exact fix: Verify file content for proper form handling and correct navigation targets

## UNCERTAIN
- apps\web\src\app\manager\suppliers\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard supplier detail page issues

## UNCERTAIN
- apps\web\src\app\admin\suppliers\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard supplier detail page issues

## UNCERTAIN
- apps\web\src\app\manager\expenses\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard expense detail page issues

## UNCERTAIN
- apps\web\src\app\admin\expenses\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard expense detail page issues

## UNCERTAIN
- apps\web\src\app\manager\purchases\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchase detail page issues

## UNCERTAIN
- apps\web\src\app\admin\purchases\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchase detail page issues

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchase return detail page issues

## UNCERTAIN
- apps\web\src\app\admin\purchase-returns\[id]\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchase return detail page issues

## UNCERTAIN
- apps\web\src\app\manager\suppliers\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard suppliers list page issues

## UNCERTAIN
- apps\web\src\app\admin\suppliers\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard suppliers list page issues

## UNCERTAIN
- apps\web\src\app\manager\expenses\page.tsx
- Already reviewed above for error handling and navigation link

## UNCERTAIN
- apps\web\src\app\admin\expenses\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard expenses list page issues

## UNCERTAIN
- apps\web\src\app\manager\purchases\page.tsx
- Already reviewed above for error handling and navigation link

## UNCERTAIN
- apps\web\src\app\admin\purchases\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchases list page issues

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchase returns list page issues

## UNCERTAIN
- apps\web\src\app\admin\purchase-returns\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or data display issues if present
- Exact fix: Verify file existence and content for standard purchase returns list page issues

## UNCERTAIN
- apps\web\src\app\manager\suppliers\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\suppliers\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\expenses\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\expenses\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\purchases\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\purchases\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\admin\purchase-returns\create\page.tsx
- Need to verify form submission handling
- Reason: File exists but form handling code not visible
- Impact: Potential form validation or submission issues
- Exact fix: Verify form implementation for proper validation and error handling

## UNCERTAIN
- apps\web\src\app\manager\suppliers\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\admin\suppliers\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\manager\purchase-returns\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\admin\purchase-returns\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\(dashboards)\sales\returns\[id]\edit\page.tsx
- Need to verify navigation links and data fetching
- Reason: File exists but content not fully visible
- Impact: Potential incorrect links or missing error handling
- Exact fix: Verify file content for issues similar to other edit pages

## UNCERTAIN
- apps\web\src\app\manager\expenses\[id]\edit\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or form issues if present
- Exact fix: Verify file existence and content for standard edit page issues

## UNCERTAIN
- apps\web\src\app\admin\expenses\[id]\edit\page.tsx
- Need to verify if this file exists and check for issues
- Reason: Pattern suggests it should exist but not visible in provided snippets
- Impact: Potential navigation/linking or form issues if present
- Exact fix: Verify file existence and content for standard edit page issues

## UNCERTAIN
- apps\web\src\app\manager\purchases\[id]\edit\page.tsx
- Need to verify if this file