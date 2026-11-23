import { db } from "../lib/db";
import { pickLists, staff, user } from "@evaluna/db/schema";
import { eq, inArray } from "drizzle-orm";

async function fixPickerData() {
  console.log("Fixing picker data...");

  // 1. Update staff ID 157 (kailash.bharati@evaluna.com) to is_deleted: true, status: 'inactive' so it no longer appears anywhere.
  await db
    .update(staff)
    .set({ name: "Warehouse Picker", is_deleted: true, status: "inactive" })
    .where(eq(staff.id, 157));

  // 2. Ensure staff ID 164 (picker@evaluna.com) is active and has role 'picker'
  await db
    .update(staff)
    .set({ is_deleted: false, status: "active", role: "picker" })
    .where(eq(staff.id, 164));

  // 3. Re-assign all existing pick lists assigned to staff ID 157 over to staff ID 164 (the active logged-in picker)
  const updatedPickLists = await db
    .update(pickLists)
    .set({ assigned_to: 164 })
    .where(eq(pickLists.assigned_to, 157))
    .returning();

  console.log(`Reassigned ${updatedPickLists.length} picklists to staff ID 164 (picker@evaluna.com).`);

  process.exit(0);
}

fixPickerData();
