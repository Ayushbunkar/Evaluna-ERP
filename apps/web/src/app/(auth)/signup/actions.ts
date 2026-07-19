"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function signup(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let user: any = null;

  try {
    // Sign out any existing session first
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // Ignore - no active session to sign out
    }

    const res = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: await headers(),
    });
    user = res.user;
  } catch (error: any) {
    console.error("Signup Server Action Error:", error);
    redirect("/signup?error=signup-failed");
  }

  // Only true superadmins get the branch-select screen
  if (user?.is_superadmin) {
    redirect("/branch-select");
  }

  // Redirect based on role
  const role = user?.role || "sales_person";
  revalidatePath(`/${role === "sales_person" ? "sales" : role}`, "layout");
  redirect(`/${role === "sales_person" ? "sales" : role}`);
}
