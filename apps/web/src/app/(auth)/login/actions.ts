"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  try {
    const res = await auth.api.signInEmail({
      body: { 
        email, 
        password,
        rememberMe,
      },
      headers: await headers(),
    });
    
    // We can't access user.is_superadmin directly from res.user here easily if it's not typed,
    // but the session and user are returned.
    const user = res.user as any;
    if (user.is_superadmin || !user.branch_id) {
      redirect("/branch-select");
    }
  } catch (err: any) {
    console.error("Login Server Action Error:", err);
    // Determine error type
    const msg = err.body?.message || "invalid-credentials";
    if (msg.includes("suspended")) {
      redirect("/login?error=suspended");
    } else if (msg.includes("locked")) {
      redirect("/login?error=locked");
    }
    redirect("/login?error=invalid-credentials");
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  });

  revalidatePath("/", "layout");
  redirect("/");
}
