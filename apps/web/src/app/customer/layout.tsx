import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-guard";
import { CustomerShell } from "./customer-shell";

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
