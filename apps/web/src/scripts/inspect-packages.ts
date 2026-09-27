import { db } from "../lib/db";
import { packages, staff, user } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const pkgs = await db
    .select({
      id: packages.id,
      package_number: packages.package_number,
      status: packages.status,
      packed_by: packages.packed_by,
      worker_name: staff.name,
      worker_email: staff.email,
    })
    .from(packages)
    .leftJoin(staff, eq(packages.packed_by, staff.id));

  console.log("PACKAGES:", JSON.stringify(pkgs, null, 2));

  const allStaff = await db.select({ id: staff.id, name: staff.name, email: staff.email, role: staff.role, status: staff.status, is_deleted: staff.is_deleted }).from(staff);
  console.log("ALL STAFF:", JSON.stringify(allStaff, null, 2));

  process.exit(0);
}

main();
