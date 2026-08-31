import { db } from './packages/db/src/index.ts';
import { sql } from 'drizzle-orm';

async function run() {
  try {
      const res = await db.execute(sql`SELECT email, role FROM public.staff`);
      console.log("Users before:", res.rows);
      await db.execute(sql`UPDATE public.staff SET role = 'super_admin'`);
      console.log("Staff role updated to super_admin!");
  } catch (e) {
      console.log(e);
  }
  process.exit(0);
}
run();
