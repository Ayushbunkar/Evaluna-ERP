import { db } from "./src/lib/db/index.ts";
import { staff } from "./src/lib/db/schema.ts";
import { ilike } from "drizzle-orm";

async function run() {
  console.log('Cleaning up seeded employees...');
  const res = await db.update(staff).set({ is_deleted: true }).where(ilike(staff.email, "%seed%")).returning();
  console.log("Deleted  seeded employees.");
  process.exit(0);
}
run().catch(console.error);
