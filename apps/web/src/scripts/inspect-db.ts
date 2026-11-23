import { db } from "../lib/db";
import { pickLists, staff, user } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const pl = await db
    .select({
      id: pickLists.id,
      status: pickLists.status,
      assigned_to: pickLists.assigned_to,
      worker_name: staff.name,
      worker_email: staff.email,
    })
    .from(pickLists)
    .leftJoin(staff, eq(pickLists.assigned_to, staff.id));

  console.log("PICK LISTS:", JSON.stringify(pl, null, 2));

  const allStaff = await db.select({ id: staff.id, name: staff.name, email: staff.email, role: staff.role }).from(staff);
  console.log("ALL STAFF:", JSON.stringify(allStaff, null, 2));

  process.exit(0);
}

main();
