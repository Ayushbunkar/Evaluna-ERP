import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pendingSync } from "@evaluna/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    // Note: In a real system, you would verify an API key or session token here.
    
    // Fetch up to 50 pending records to sync
    const pendingRecords = await db.select()
      .from(pendingSync)
      .where(eq(pendingSync.status, "pending"))
      .limit(50);

    if (pendingRecords.length === 0) {
      return NextResponse.json({ message: "No records to sync", syncedCount: 0 });
    }

    // Mock: Send records to Central Cloud Server
    // const response = await fetch("https://api.central-evaluna.com/v1/sync", {
    //   method: "POST",
    //   body: JSON.stringify(pendingRecords),
    //   headers: { "Content-Type": "application/json" }
    // });
    // if (!response.ok) throw new Error("Cloud sync failed");

    // Simulate network delay and success
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mark as synced locally
    const recordIds = pendingRecords.map((r) => r.id);
    
    // We update them one by one or in a batch if Drizzle supports it (Postgres allows IN)
    // For simplicity, we'll loop in a transaction
    await db.transaction(async (tx) => {
      for (const id of recordIds) {
        await tx.update(pendingSync)
          .set({ status: "synced", updated_at: new Date() })
          .where(eq(pendingSync.id, id));
      }
    });

    return NextResponse.json({ 
      message: "Sync successful", 
      syncedCount: pendingRecords.length 
    });

  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
