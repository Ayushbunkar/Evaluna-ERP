import { db } from "./apps/web/src/lib/db";
import { customers } from "./packages/db/src/schema";

async function run() {
  const allCustomers = await db.select().from(customers).limit(10);
  console.log(allCustomers);
  process.exit(0);
}
run();
