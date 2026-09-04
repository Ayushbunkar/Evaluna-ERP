import { sql } from "drizzle-orm";
import { db } from "./packages/db/src/index.ts";

async function run() {
	// Update public.user: set both role and is_superadmin flag
	const res = await db.execute(sql`
    UPDATE public.user 
    SET role = 'super_admin', is_superadmin = true 
    WHERE email = 'admin@evaluna.com' OR email LIKE '%@evaluna.com%'
  `);
	console.log("Updated rows:", res.rowCount);

	// Also show current state of admin user
	const check = await db.execute(sql`
    SELECT email, role, is_superadmin FROM public.user 
    WHERE email = 'admin@evaluna.com'
  `);
	console.log("Admin user:", check.rows);

	process.exit(0);
}
run();
