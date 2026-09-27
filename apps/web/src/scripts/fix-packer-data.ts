import { db } from "../lib/db";
import { packages, staff } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

async function fixPackerData() {
  console.log("Fixing packer data...");

  // 1. Re-assign package 66 (currently assigned to staff ID 123 "Abhi") to active logged-in packer (ID 166 - packer@evaluna.com)
  const updatedPackages = await db
    .update(packages)
    .set({ packed_by: 166 })
    .where(eq(packages.packed_by, 123))
    .returning();

  console.log(`Reassigned ${updatedPackages.length} package(s) to active packer ID 166 (packer@evaluna.com).`);

  process.exit(0);
}

fixPackerData();
