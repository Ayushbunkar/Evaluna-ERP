import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@evaluna/db";
import { users } from "@evaluna/db/schema";
import { eq } from "drizzle-orm";

// POST /api/seed-admin
// Creates a default admin account if none exists.
// Remove or protect this route in production!
export async function POST() {
  try {
    const adminEmail = "admin@evaluna.com";
    const adminPassword = "Admin@1234";

    // Check if admin already exists
    const existing = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Admin already exists",
        credentials: { email: adminEmail, password: adminPassword },
      });
    }

    // Create admin via better-auth
    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: "System Admin",
      },
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "Failed to create admin" }, { status: 500 });
    }

    // Update role to admin
    await db
      .update(users)
      .set({ role: "admin" } as any)
      .where(eq(users.email, adminEmail));

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully!",
      credentials: {
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      },
    });
  } catch (error: any) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to seed the admin account",
    credentials: {
      email: "admin@evaluna.com",
      password: "Admin@1234",
    },
  });
}
